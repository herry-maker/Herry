import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

import auth
import database
import models
import schemas
from config import settings

# Create all tables on startup (use Alembic migrations in production).
database.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Herry Auth Service", version="1.0.0")

http_bearer = HTTPBearer()


# ---------------------------------------------------------------------------
# Dependency: resolve the authenticated user from the Bearer token
# ---------------------------------------------------------------------------

def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Security(http_bearer)],
    db: Session = Depends(database.get_db),
) -> models.User:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = auth.decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise exc
        jti = payload["jti"]
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise exc

    if auth.is_token_blacklisted(jti, db):
        raise exc

    user = db.query(models.User).filter_by(id=user_id).first()
    if not user or not user.is_active:
        raise exc

    return user


# ---------------------------------------------------------------------------
# Public endpoints
# ---------------------------------------------------------------------------

@app.post("/auth/register", status_code=201)
def register(payload: schemas.UserRegister, db: Session = Depends(database.get_db)):
    if db.query(models.User).filter_by(email=payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="An account with this email already exists.",
        )

    user = models.User(
        name=payload.name,
        email=payload.email,
        hashed_password=auth.hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "Registration successful.",
        "user": schemas.UserResponse.model_validate(user),
        "access_token": auth.create_access_token(user.id),
        "refresh_token": auth.create_refresh_token(user.id),
        "token_type": "Bearer",
    }


@app.post("/auth/login")
def login(payload: schemas.UserLogin, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter_by(email=payload.email).first()

    if not user or not auth.verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The provided credentials are incorrect.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled.",
        )

    return {
        "message": "Login successful.",
        "user": schemas.UserResponse.model_validate(user),
        "access_token": auth.create_access_token(user.id),
        "refresh_token": auth.create_refresh_token(user.id),
        "token_type": "Bearer",
    }


@app.post("/auth/forgot-password")
def forgot_password(
    payload: schemas.ForgotPasswordRequest,
    db: Session = Depends(database.get_db),
):
    user = db.query(models.User).filter_by(email=payload.email).first()

    if user:
        # Delete any outstanding tokens for this email before issuing a new one.
        db.query(models.PasswordResetToken).filter_by(email=payload.email).delete()

        reset_token = secrets.token_urlsafe(32)
        db.add(models.PasswordResetToken(
            email=payload.email,
            token=reset_token,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        ))
        db.commit()

        # In production, send reset_token via email.
        # Expose it in the response only in local dev to ease testing.
        if settings.APP_ENV == "local":
            return {
                "message": "If an account exists for that email, a reset link has been sent.",
                "_dev_reset_token": reset_token,
            }

    # Ambiguous response — prevents user-enumeration regardless of whether
    # the email matched a real account.
    return {"message": "If an account exists for that email, a reset link has been sent."}


@app.post("/auth/reset-password")
def reset_password(
    payload: schemas.ResetPasswordRequest,
    db: Session = Depends(database.get_db),
):
    now = datetime.now(timezone.utc)

    entry = (
        db.query(models.PasswordResetToken)
        .filter_by(email=payload.email, token=payload.token, used=False)
        .first()
    )

    # Treat missing entry and expired token identically to avoid information leakage.
    if not entry or entry.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid or expired reset token. Please request a new one.",
        )

    user = db.query(models.User).filter_by(email=payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid or expired reset token. Please request a new one.",
        )

    user.hashed_password = auth.hash_password(payload.password)
    entry.used = True
    db.commit()

    return {"message": "Password reset successfully. Please log in with your new password."}


# ---------------------------------------------------------------------------
# Protected endpoints
# ---------------------------------------------------------------------------

@app.post("/auth/logout")
def logout(
    credentials: Annotated[HTTPAuthorizationCredentials, Security(http_bearer)],
    db: Session = Depends(database.get_db),
):
    try:
        payload = auth.decode_token(credentials.credentials)
        jti = payload["jti"]
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        auth.blacklist_token(jti, exp, db)
    except (JWTError, KeyError):
        pass  # Token is already invalid — treat as successful logout.

    return {"message": "Logged out successfully."}


@app.post("/auth/refresh")
def refresh_token(
    payload: schemas.RefreshRequest,
    db: Session = Depends(database.get_db),
):
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token.",
    )
    try:
        data = auth.decode_token(payload.refresh_token)
        if data.get("type") != "refresh":
            raise exc
        jti = data["jti"]
        user_id = int(data["sub"])
        exp = datetime.fromtimestamp(data["exp"], tz=timezone.utc)
    except (JWTError, KeyError, ValueError):
        raise exc

    if auth.is_token_blacklisted(jti, db):
        raise exc

    # Rotate: blacklist the consumed refresh token so it cannot be reused.
    auth.blacklist_token(jti, exp, db)

    user = db.query(models.User).filter_by(id=user_id).first()
    if not user or not user.is_active:
        raise exc

    return {
        "access_token": auth.create_access_token(user.id),
        "refresh_token": auth.create_refresh_token(user.id),
        "token_type": "Bearer",
    }


@app.get("/auth/me")
def me(current_user: models.User = Depends(get_current_user)):
    return {"user": schemas.UserResponse.model_validate(current_user)}
