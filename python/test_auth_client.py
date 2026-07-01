"""
Tests for AuthClient.
Run against a live server: python -m pytest test_auth_client.py
or with a mock via unittest.mock.
"""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest

from auth_client import AuthAPIError, AuthClient


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mock_response(status_code: int, body: dict) -> MagicMock:
    m = MagicMock()
    m.status_code = status_code
    m.ok = status_code < 400
    m.reason = "OK" if m.ok else "Error"
    m.json.return_value = body
    return m


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------

class TestRegister:
    def test_stores_token_on_success(self):
        client = AuthClient(base_url="http://api")
        resp = _mock_response(201, {"token": "tok_abc", "user": {"id": 1}})

        with patch.object(client._session, "post", return_value=resp):
            data = client.register("Alice", "alice@example.com", "pass12345", "pass12345")

        assert client.token == "tok_abc"
        assert data["token"] == "tok_abc"

    def test_raises_on_duplicate_email(self):
        client = AuthClient(base_url="http://api")
        resp = _mock_response(422, {
            "message": "The email has already been taken.",
            "errors": {"email": ["The email has already been taken."]},
        })

        with patch.object(client._session, "post", return_value=resp):
            with pytest.raises(AuthAPIError) as exc_info:
                client.register("Alice", "alice@example.com", "pass12345", "pass12345")

        assert exc_info.value.status_code == 422


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

class TestLogin:
    def test_stores_token_on_success(self):
        client = AuthClient(base_url="http://api")
        resp = _mock_response(200, {"token": "tok_xyz", "user": {"id": 1}})

        with patch.object(client._session, "post", return_value=resp):
            data = client.login("alice@example.com", "pass12345")

        assert client.token == "tok_xyz"

    def test_raises_401_on_invalid_credentials(self):
        client = AuthClient(base_url="http://api")
        resp = _mock_response(401, {"message": "Invalid credentials."})

        with patch.object(client._session, "post", return_value=resp):
            with pytest.raises(AuthAPIError) as exc_info:
                client.login("alice@example.com", "wrong")

        assert exc_info.value.status_code == 401


# ---------------------------------------------------------------------------
# Protected endpoints require token
# ---------------------------------------------------------------------------

class TestProtectedEndpoints:
    def test_me_requires_token(self):
        client = AuthClient(base_url="http://api")
        with pytest.raises(RuntimeError, match="Not authenticated"):
            client.me()

    def test_logout_clears_token(self):
        client = AuthClient(base_url="http://api")
        client.token = "existing_tok"
        resp = _mock_response(200, {"message": "Logged out successfully."})

        with patch.object(client._session, "post", return_value=resp):
            client.logout()

        assert client.token is None

    def test_refresh_updates_token(self):
        client = AuthClient(base_url="http://api")
        client.token = "old_tok"
        resp = _mock_response(200, {"token": "new_tok"})

        with patch.object(client._session, "post", return_value=resp):
            client.refresh_token()

        assert client.token == "new_tok"

    def test_verify_email_requires_token(self):
        client = AuthClient(base_url="http://api")
        with pytest.raises(RuntimeError, match="Not authenticated"):
            client.verify_email("/api/auth/email/verify/1/abc?expires=1&signature=x")

    def test_verify_email_calls_signed_url(self):
        client = AuthClient(base_url="http://api")
        client.token = "tok"
        resp = _mock_response(200, {"message": "Email verified successfully."})

        with patch.object(client._session, "post", return_value=resp) as mock_post:
            data = client.verify_email("/api/auth/email/verify/1/abc?expires=1&signature=x")

        mock_post.assert_called_once()
        assert data["message"] == "Email verified successfully."


# ---------------------------------------------------------------------------
# Context manager
# ---------------------------------------------------------------------------

class TestContextManager:
    def test_enter_returns_client(self):
        with AuthClient(base_url="http://api") as client:
            assert isinstance(client, AuthClient)

    def test_exit_closes_session(self):
        client = AuthClient(base_url="http://api")
        with patch.object(client._session, "close") as mock_close:
            with client:
                pass
        mock_close.assert_called_once()


# ---------------------------------------------------------------------------
# AuthAPIError formatting
# ---------------------------------------------------------------------------

class TestAuthAPIError:
    def test_str_with_errors(self):
        err = AuthAPIError("Validation failed", 422, {"email": ["Invalid"]})
        assert "422" in str(err)
        assert "email" in str(err)

    def test_str_without_errors(self):
        err = AuthAPIError("Not found", 404)
        assert "404" in str(err)
        assert "Not found" in str(err)
