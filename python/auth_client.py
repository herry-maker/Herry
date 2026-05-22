"""
Herry Auth Client
-----------------
A Python client for the Herry Laravel authentication API.

Usage:
    client = AuthClient(base_url="http://localhost:8000")
    client.register("Alice", "alice@example.com", "secret123", "secret123")
    client.login("alice@example.com", "secret123")
    user = client.me()
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Any

import requests


@dataclass
class AuthClient:
    base_url: str = field(default_factory=lambda: os.getenv("API_BASE_URL", "http://localhost:8000"))
    _token: str | None = field(default=None, init=False, repr=False)
    _session: requests.Session = field(default_factory=requests.Session, init=False, repr=False)

    def __post_init__(self) -> None:
        self.base_url = self.base_url.rstrip("/")
        self._session.headers.update({
            "Accept": "application/json",
            "Content-Type": "application/json",
        })

    # ------------------------------------------------------------------
    # Token management
    # ------------------------------------------------------------------

    @property
    def token(self) -> str | None:
        return self._token

    @token.setter
    def token(self, value: str | None) -> None:
        self._token = value
        if value:
            self._session.headers["Authorization"] = f"Bearer {value}"
        else:
            self._session.headers.pop("Authorization", None)

    # ------------------------------------------------------------------
    # Public endpoints
    # ------------------------------------------------------------------

    def register(
        self,
        name: str,
        email: str,
        password: str,
        password_confirmation: str,
    ) -> dict[str, Any]:
        """Register a new user and store the returned token."""
        data = self._post("/api/auth/register", {
            "name": name,
            "email": email,
            "password": password,
            "password_confirmation": password_confirmation,
        })
        self.token = data.get("token")
        return data

    def login(self, email: str, password: str) -> dict[str, Any]:
        """Authenticate and store the returned token."""
        data = self._post("/api/auth/login", {"email": email, "password": password})
        self.token = data.get("token")
        return data

    def forgot_password(self, email: str) -> dict[str, Any]:
        """Request a password-reset link by email."""
        return self._post("/api/auth/forgot-password", {"email": email})

    def reset_password(
        self,
        token: str,
        email: str,
        password: str,
        password_confirmation: str,
    ) -> dict[str, Any]:
        """Reset a password using the link token."""
        return self._post("/api/auth/reset-password", {
            "token": token,
            "email": email,
            "password": password,
            "password_confirmation": password_confirmation,
        })

    # ------------------------------------------------------------------
    # Protected endpoints (require prior login/register)
    # ------------------------------------------------------------------

    def me(self) -> dict[str, Any]:
        """Return the currently authenticated user's profile."""
        self._require_token()
        return self._get("/api/auth/me")

    def update_profile(self, **kwargs: Any) -> dict[str, Any]:
        """Update name and/or email. Pass name= and/or email=."""
        self._require_token()
        return self._put("/api/auth/me", kwargs)

    def change_password(
        self,
        current_password: str,
        new_password: str,
        new_password_confirmation: str,
    ) -> dict[str, Any]:
        """Change the authenticated user's password."""
        self._require_token()
        return self._put("/api/auth/password", {
            "current_password": current_password,
            "new_password": new_password,
            "new_password_confirmation": new_password_confirmation,
        })

    def logout(self) -> dict[str, Any]:
        """Revoke the current access token."""
        self._require_token()
        data = self._post("/api/auth/logout", {})
        self.token = None
        return data

    def logout_all(self) -> dict[str, Any]:
        """Revoke all access tokens for the authenticated user."""
        self._require_token()
        data = self._post("/api/auth/logout-all", {})
        self.token = None
        return data

    def refresh_token(self) -> dict[str, Any]:
        """Exchange the current token for a fresh one."""
        self._require_token()
        data = self._post("/api/auth/refresh", {})
        self.token = data.get("token")
        return data

    def resend_verification(self) -> dict[str, Any]:
        """Resend the email-verification link."""
        self._require_token()
        return self._post("/api/auth/email/resend", {})

    # ------------------------------------------------------------------
    # Internal HTTP helpers
    # ------------------------------------------------------------------

    def _get(self, path: str) -> dict[str, Any]:
        response = self._session.get(f"{self.base_url}{path}")
        return self._handle(response)

    def _post(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        response = self._session.post(f"{self.base_url}{path}", json=payload)
        return self._handle(response)

    def _put(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        response = self._session.put(f"{self.base_url}{path}", json=payload)
        return self._handle(response)

    @staticmethod
    def _handle(response: requests.Response) -> dict[str, Any]:
        try:
            data: dict[str, Any] = response.json()
        except ValueError:
            response.raise_for_status()
            return {}

        if not response.ok:
            message = data.get("message", response.reason)
            errors = data.get("errors", {})
            raise AuthAPIError(message, status_code=response.status_code, errors=errors)

        return data

    def _require_token(self) -> None:
        if not self._token:
            raise RuntimeError("Not authenticated. Call login() or register() first.")


class AuthAPIError(Exception):
    """Raised when the API returns a non-2xx status code."""

    def __init__(
        self,
        message: str,
        status_code: int = 0,
        errors: dict[str, list[str]] | None = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.errors = errors or {}

    def __str__(self) -> str:
        base = f"[{self.status_code}] {super().__str__()}"
        if self.errors:
            details = "; ".join(f"{k}: {', '.join(v)}" for k, v in self.errors.items())
            return f"{base} — {details}"
        return base
