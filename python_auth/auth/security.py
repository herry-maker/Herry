"""
Pure-stdlib JWT (HS256) + bcrypt password hashing.
No dependency on cryptography / python-jose / PyJWT to avoid the broken
system pyo3 binding in this environment.
"""
import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt

from ..config import settings


# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ---------------------------------------------------------------------------
# JWT (HS256, pure stdlib)
# ---------------------------------------------------------------------------

class JWTError(Exception):
    pass


def _b64url_encode(data: bytes) -> bytes:
    return base64.urlsafe_b64encode(data).rstrip(b"=")


def _b64url_decode(s: str | bytes) -> bytes:
    if isinstance(s, str):
        s = s.encode("ascii")
    # Re-add padding
    padding = 4 - len(s) % 4
    if padding < 4:
        s += b"=" * padding
    return base64.urlsafe_b64decode(s)


def _sign(header_b64: bytes, payload_b64: bytes, secret: str) -> bytes:
    msg = header_b64 + b"." + payload_b64
    return hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).digest()


def create_access_token(subject: str | int, extra: dict | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict = {
        "sub": str(subject),
        "exp": int(expire.timestamp()),
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "type": "access",
    }
    if extra:
        payload.update(extra)

    header_b64 = _b64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode())
    sig_b64 = _b64url_encode(_sign(header_b64, payload_b64, settings.secret_key))

    return (header_b64 + b"." + payload_b64 + b"." + sig_b64).decode("ascii")


def decode_access_token(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise JWTError("Malformed token.")

        header_b64, payload_b64, sig_b64 = parts

        # Verify signature
        expected_sig = _sign(header_b64.encode(), payload_b64.encode(), settings.secret_key)
        actual_sig = _b64url_decode(sig_b64)
        if not hmac.compare_digest(expected_sig, actual_sig):
            raise JWTError("Invalid signature.")

        payload = json.loads(_b64url_decode(payload_b64))

        # Verify expiry
        exp = payload.get("exp")
        if exp is None or datetime.now(timezone.utc).timestamp() > exp:
            raise JWTError("Token has expired.")

        return payload
    except JWTError:
        raise
    except Exception as exc:
        raise JWTError(f"Could not decode token: {exc}") from exc


# ---------------------------------------------------------------------------
# Opaque refresh / reset tokens
# ---------------------------------------------------------------------------

def create_refresh_token() -> tuple[str, str]:
    """Return (raw_token, sha256_hex_hash). Store hash, send raw to client."""
    raw = secrets.token_urlsafe(64)
    return raw, hash_token(raw)


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# Expiry helpers
# ---------------------------------------------------------------------------

def refresh_token_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)


def password_reset_token_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(hours=1)
