# Herry — Authentication API

A Laravel 13 REST API providing full token-based authentication, paired with a Python client library.

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 13 (PHP 8.4) |
| Auth tokens | Laravel Sanctum |
| Python client | `python/auth_client.py` (stdlib + `requests`) |
| Database | SQLite (dev) / MySQL/Postgres (prod) |

---

## Quick Start

```bash
# 1. Install PHP dependencies
composer install

# 2. Copy environment file and generate app key
cp .env.example .env
php artisan key:generate

# 3. Run migrations
php artisan migrate

# 4. Start development server
php artisan serve
```

---

## API Endpoints

All endpoints are prefixed with `/api/auth`.

### Public (no token required)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Log in and receive a Bearer token |
| `POST` | `/api/auth/forgot-password` | Send a password-reset link by email |
| `POST` | `/api/auth/reset-password` | Reset password using the emailed token |

### Protected (Bearer token required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/auth/me` | Get the authenticated user's profile |
| `PUT` | `/api/auth/me` | Update name / email |
| `PUT` | `/api/auth/password` | Change password |
| `POST` | `/api/auth/logout` | Revoke current token |
| `POST` | `/api/auth/logout-all` | Revoke all tokens (all devices) |
| `POST` | `/api/auth/refresh` | Rotate the current token |
| `POST` | `/api/auth/email/resend` | Resend email verification link |
| `POST` | `/api/auth/email/verify/{id}/{hash}` | Verify email address |

### Request/Response Examples

**Register**
```json
POST /api/auth/register
{ "name": "Alice", "email": "alice@example.com",
  "password": "secret123", "password_confirmation": "secret123" }

// 201
{ "message": "Registration successful.",
  "user": { "id": 1, "name": "Alice", "email": "alice@example.com", ... },
  "token": "1|herry_...", "type": "Bearer" }
```

**Login**
```json
POST /api/auth/login
{ "email": "alice@example.com", "password": "secret123" }

// 200
{ "message": "Login successful.", "user": {...}, "token": "2|herry_...", "type": "Bearer" }
```

---

## Security Measures

- **Password hashing** — bcrypt with 12 rounds (`BCRYPT_ROUNDS=12`)
- **Token prefix** — `herry_` prefix enables secret-scanning on GitHub
- **Token expiration** — 30 days (configured in `config/sanctum.php`)
- **Rate limiting** — Auth endpoints: 5 req/min per IP; API: 60 req/min
- **Input validation** — Every request validated via dedicated `FormRequest` classes
- **CSRF** — Sanctum `EnsureFrontendRequestsAreStateful` for SPA/cookie-based flows
- **Logout invalidation** — Password change revokes all other sessions; password reset revokes all tokens

---

## Python Client

```bash
cd python
pip install -r requirements.txt
```

```python
from auth_client import AuthClient, AuthAPIError

client = AuthClient(base_url="http://localhost:8000")

# Register
client.register("Alice", "alice@example.com", "secret123", "secret123")

# Login (token stored automatically)
client.login("alice@example.com", "secret123")

# Use protected endpoints
user = client.me()
client.update_profile(name="Alice Smith")
client.change_password("secret123", "newpass456", "newpass456")
client.refresh_token()
client.logout()

# Password reset flow
client.forgot_password("alice@example.com")
client.reset_password("<token_from_email>", "alice@example.com", "newpass", "newpass")
```

### Run Python Tests

```bash
cd python
python -m pytest test_auth_client.py -v
```

---

## Environment Variables

Key auth-related variables in `.env`:

```dotenv
BCRYPT_ROUNDS=12
SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1
SANCTUM_TOKEN_PREFIX=herry_
MAIL_MAILER=log          # Use smtp/mailgun in production for real emails
```
