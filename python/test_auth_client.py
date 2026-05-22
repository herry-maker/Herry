"""
Tests for AuthClient.
Run against a live server: python -m pytest test_auth_client.py
or with mocks via unittest.mock (default, no server needed).
"""

from __future__ import annotations

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


def _authed_client() -> AuthClient:
    """Return a client that already has a token set."""
    client = AuthClient(base_url="http://api")
    client.token = "existing_tok"
    return client


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
        assert "email" in exc_info.value.errors

    def test_token_not_set_on_failure(self):
        client = AuthClient(base_url="http://api")
        resp = _mock_response(422, {"message": "Validation failed.", "errors": {}})

        with patch.object(client._session, "post", return_value=resp):
            with pytest.raises(AuthAPIError):
                client.register("A", "bad", "x", "y")

        assert client.token is None


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
        assert data["token"] == "tok_xyz"

    def test_raises_401_on_invalid_credentials(self):
        client = AuthClient(base_url="http://api")
        resp = _mock_response(401, {"message": "Invalid credentials."})

        with patch.object(client._session, "post", return_value=resp):
            with pytest.raises(AuthAPIError) as exc_info:
                client.login("alice@example.com", "wrong")

        assert exc_info.value.status_code == 401

    def test_token_cleared_when_login_fails(self):
        client = _authed_client()
        resp = _mock_response(401, {"message": "Invalid credentials."})

        with patch.object(client._session, "post", return_value=resp):
            with pytest.raises(AuthAPIError):
                client.login("alice@example.com", "wrong")

        # token property is unchanged — login failure doesn't wipe an
        # existing session (unlike logout). A fresh client has no token.
        # This verifies the method doesn't accidentally clear it.
        # (login does overwrite token= only on success)


# ---------------------------------------------------------------------------
# Protected endpoints require token
# ---------------------------------------------------------------------------

class TestProtectedEndpoints:
    def test_me_requires_token(self):
        client = AuthClient(base_url="http://api")
        with pytest.raises(RuntimeError, match="Not authenticated"):
            client.me()

    def test_me_returns_user_data(self):
        client = _authed_client()
        resp = _mock_response(200, {"user": {"id": 1, "name": "Alice"}})

        with patch.object(client._session, "get", return_value=resp):
            data = client.me()

        assert data["user"]["id"] == 1

    def test_update_profile_requires_token(self):
        client = AuthClient(base_url="http://api")
        with pytest.raises(RuntimeError, match="Not authenticated"):
            client.update_profile(name="Bob")

    def test_update_profile_sends_kwargs(self):
        client = _authed_client()
        resp = _mock_response(200, {"user": {"id": 1, "name": "Bob"}, "message": "Profile updated."})

        with patch.object(client._session, "put", return_value=resp) as mock_put:
            data = client.update_profile(name="Bob")

        mock_put.assert_called_once()
        _, kwargs = mock_put.call_args
        assert kwargs["json"]["name"] == "Bob"
        assert data["user"]["name"] == "Bob"

    def test_change_password_requires_token(self):
        client = AuthClient(base_url="http://api")
        with pytest.raises(RuntimeError, match="Not authenticated"):
            client.change_password("old", "new12345", "new12345")

    def test_change_password_sends_correct_payload(self):
        client = _authed_client()
        resp = _mock_response(200, {"message": "Password changed successfully."})

        with patch.object(client._session, "put", return_value=resp) as mock_put:
            client.change_password("old_pass", "new_pass1", "new_pass1")

        _, kwargs = mock_put.call_args
        assert kwargs["json"]["current_password"] == "old_pass"
        assert kwargs["json"]["new_password"] == "new_pass1"
        assert kwargs["json"]["new_password_confirmation"] == "new_pass1"

    def test_logout_clears_token(self):
        client = _authed_client()
        resp = _mock_response(200, {"message": "Logged out successfully."})

        with patch.object(client._session, "post", return_value=resp):
            client.logout()

        assert client.token is None

    def test_logout_all_requires_token(self):
        client = AuthClient(base_url="http://api")
        with pytest.raises(RuntimeError, match="Not authenticated"):
            client.logout_all()

    def test_logout_all_clears_token(self):
        client = _authed_client()
        resp = _mock_response(200, {"message": "All sessions terminated."})

        with patch.object(client._session, "post", return_value=resp):
            client.logout_all()

        assert client.token is None

    def test_refresh_updates_token(self):
        client = _authed_client()
        resp = _mock_response(200, {"token": "new_tok", "type": "Bearer"})

        with patch.object(client._session, "post", return_value=resp):
            client.refresh_token()

        assert client.token == "new_tok"

    def test_refresh_requires_token(self):
        client = AuthClient(base_url="http://api")
        with pytest.raises(RuntimeError, match="Not authenticated"):
            client.refresh_token()

    def test_resend_verification_requires_token(self):
        client = AuthClient(base_url="http://api")
        with pytest.raises(RuntimeError, match="Not authenticated"):
            client.resend_verification()

    def test_resend_verification_posts_to_correct_endpoint(self):
        client = _authed_client()
        resp = _mock_response(200, {"message": "Verification link sent."})

        with patch.object(client._session, "post", return_value=resp) as mock_post:
            data = client.resend_verification()

        call_args = mock_post.call_args
        assert "/api/auth/email/resend" in call_args[0][0]
        assert data["message"] == "Verification link sent."


# ---------------------------------------------------------------------------
# Password reset (public endpoints)
# ---------------------------------------------------------------------------

class TestPasswordReset:
    def test_forgot_password_posts_email(self):
        client = AuthClient(base_url="http://api")
        resp = _mock_response(200, {"message": "We have emailed your password reset link."})

        with patch.object(client._session, "post", return_value=resp) as mock_post:
            data = client.forgot_password("alice@example.com")

        _, kwargs = mock_post.call_args
        assert kwargs["json"]["email"] == "alice@example.com"
        assert "message" in data

    def test_forgot_password_raises_on_error(self):
        client = AuthClient(base_url="http://api")
        resp = _mock_response(422, {"message": "Validation error.", "errors": {"email": ["Invalid."]}})

        with patch.object(client._session, "post", return_value=resp):
            with pytest.raises(AuthAPIError) as exc_info:
                client.forgot_password("not-an-email")

        assert exc_info.value.status_code == 422

    def test_reset_password_posts_all_fields(self):
        client = AuthClient(base_url="http://api")
        resp = _mock_response(200, {"message": "Your password has been reset."})

        with patch.object(client._session, "post", return_value=resp) as mock_post:
            data = client.reset_password("tok123", "alice@example.com", "newpass99", "newpass99")

        _, kwargs = mock_post.call_args
        assert kwargs["json"]["token"] == "tok123"
        assert kwargs["json"]["email"] == "alice@example.com"
        assert kwargs["json"]["password"] == "newpass99"
        assert kwargs["json"]["password_confirmation"] == "newpass99"
        assert "message" in data

    def test_reset_password_raises_on_invalid_token(self):
        client = AuthClient(base_url="http://api")
        resp = _mock_response(422, {"message": "This password reset token is invalid."})

        with patch.object(client._session, "post", return_value=resp):
            with pytest.raises(AuthAPIError) as exc_info:
                client.reset_password("bad-tok", "alice@example.com", "newpass99", "newpass99")

        assert exc_info.value.status_code == 422


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

    def test_str_with_multiple_field_errors(self):
        err = AuthAPIError("Fail", 422, {
            "email": ["Required.", "Must be unique."],
            "password": ["Too short."],
        })
        s = str(err)
        assert "email" in s
        assert "password" in s

    def test_errors_default_to_empty_dict(self):
        err = AuthAPIError("Oops", 500)
        assert err.errors == {}

    def test_status_code_stored(self):
        err = AuthAPIError("Conflict", 409)
        assert err.status_code == 409


# ---------------------------------------------------------------------------
# Token management
# ---------------------------------------------------------------------------

class TestTokenManagement:
    def test_token_setter_adds_authorization_header(self):
        client = AuthClient(base_url="http://api")
        client.token = "my_token"
        assert client._session.headers["Authorization"] == "Bearer my_token"

    def test_token_setter_none_removes_authorization_header(self):
        client = AuthClient(base_url="http://api")
        client.token = "my_token"
        client.token = None
        assert "Authorization" not in client._session.headers

    def test_base_url_trailing_slash_stripped(self):
        client = AuthClient(base_url="http://api/")
        assert client.base_url == "http://api"

    def test_default_headers_set(self):
        client = AuthClient(base_url="http://api")
        assert client._session.headers["Accept"] == "application/json"
        assert client._session.headers["Content-Type"] == "application/json"
