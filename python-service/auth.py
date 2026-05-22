import uuid
from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

import models
from config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _make_token(data: dict, expires_delta: timedelta) -> str:
    payload = data.copy()
    now = datetime.now(timezone.utc)
    payload.update({
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": now + expires_delta,
    })
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(user_id: int) -> str:
    return _make_token(
        {"sub": str(user_id), "type": "access"},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(user_id: int) -> str:
    return _make_token(
        {"sub": str(user_id), "type": "refresh"},
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str) -> dict:
    """Decode and validate a JWT. Raises jose.JWTError on any failure."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def is_token_blacklisted(jti: str, db: Session) -> bool:
    return db.query(models.BlacklistedToken).filter_by(jti=jti).first() is not None


def blacklist_token(jti: str, expires_at: datetime, db: Session) -> None:
    db.add(models.BlacklistedToken(jti=jti, expires_at=expires_at))
    db.commit()
    # Opportunistically purge already-expired entries to keep the table small.
    db.query(models.BlacklistedToken).filter(
        models.BlacklistedToken.expires_at < datetime.now(timezone.utc)
    ).delete()
    db.commit()
