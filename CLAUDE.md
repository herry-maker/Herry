# CLAUDE.md — Herry Authentication API

## Project Overview

Herry is a **Laravel 13 REST API** providing complete token-based authentication using Laravel Sanctum. It also ships a Python client library for easy integration. The codebase prioritises security-first design throughout.

**Stack summary:**

| Layer | Technology |
|-------|-----------|
| Backend | PHP 8.3+, Laravel 13.8+ |
| Authentication | Laravel Sanctum 4.3+ |
| Database (dev) | SQLite (in-memory for tests) |
| Database (prod) | MySQL or PostgreSQL |
| Frontend scaffold | Blade + Tailwind CSS 4 + Vite 8 |
| Python client | Python 3.6+, `requests` |
| PHP testing | PHPUnit 12 |
| Python testing | pytest 8 |
| Code style | Laravel Pint |

---

## Key Commands

### First-time setup
```bash
composer setup
# Installs PHP deps, copies .env, generates APP_KEY, migrates, installs npm deps, builds assets
```

### Development server (all processes concurrently)
```bash
composer dev
# Starts: php artisan serve | queue:listen | pail (log tail) | npm run dev (Vite HMR)
```

### Running tests
```bash
composer test                          # PHP feature + unit tests
python -m pytest python/ -v            # Python client tests
```

### Linting
```bash
./vendor/bin/pint                      # Fix PHP code style (Laravel Pint)
./vendor/bin/pint --test               # Check only, no writes
```

### Other useful Artisan commands
```bash
php artisan migrate                    # Run pending migrations
php artisan migrate:fresh              # Drop all tables and re-migrate (dev only)
php artisan tinker                     # Interactive REPL
php artisan config:clear               # Clear config cache
```

---

## Architecture

### Directory layout

```
app/
  Http/
    Controllers/Auth/       # AuthController, EmailVerificationController, PasswordResetController
    Requests/Auth/          # FormRequest classes per endpoint
  Models/
    User.php                # Eloquent model with HasApiTokens, HasFactory, Notifiable
  Providers/
    AppServiceProvider.php  # Rate limiter configuration (boot-time)
routes/
  api.php                   # All API routes (public throttled + protected Sanctum)
  web.php                   # Single welcome route
tests/
  Feature/Auth/AuthTest.php # Comprehensive feature tests (358 lines)
  Unit/                     # Unit tests (sparse)
python/
  auth_client.py            # Python client library
  test_auth_client.py       # pytest suite for the Python client
  requirements.txt
database/
  migrations/               # 4 migrations: users, cache, jobs, personal_access_tokens
```

### Request lifecycle

1. Request hits `routes/api.php`
2. Middleware applied: `throttle:auth` (public routes) or `auth:sanctum` (protected routes)
3. Controller method receives a fully-validated `FormRequest` (validation errors auto-return 422)
4. Controller returns `response()->json([...])` with consistent keys: `message`, `user`, `token`, `type`

---

## API Endpoints

All routes are prefixed with `/api/auth`.

### Public (rate-limited: 5/min per IP, 10/min per email+IP)

| Method | Path | Controller method |
|--------|------|-------------------|
| POST | `/api/auth/register` | `AuthController@register` |
| POST | `/api/auth/login` | `AuthController@login` |
| POST | `/api/auth/forgot-password` | `PasswordResetController@forgotPassword` |
| POST | `/api/auth/reset-password` | `PasswordResetController@resetPassword` |

### Protected (`Authorization: Bearer <token>` required)

| Method | Path | Controller method |
|--------|------|-------------------|
| GET | `/api/auth/me` | `AuthController@me` |
| PUT | `/api/auth/me` | `AuthController@updateProfile` |
| PUT | `/api/auth/password` | `AuthController@changePassword` |
| POST | `/api/auth/logout` | `AuthController@logout` |
| POST | `/api/auth/logout-all` | `AuthController@logoutAll` |
| POST | `/api/auth/refresh` | `AuthController@refresh` |
| POST | `/api/auth/email/verify/{id}/{hash}` | `EmailVerificationController@verify` |
| POST | `/api/auth/email/resend` | `EmailVerificationController@send` |

---

## Conventions

### FormRequest pattern (mandatory for all endpoints)
Every endpoint has a dedicated `FormRequest` class in `app/Http/Requests/Auth/`. Do **not** put validation logic inside controllers. Add new endpoints by creating a new `XxxRequest` class and type-hinting it in the controller method.

```php
// Correct
public function register(RegisterRequest $request): JsonResponse { ... }

// Wrong — never inline validation in controllers
public function register(Request $request): JsonResponse {
    $request->validate([...]);
}
```

### JSON response shape
All responses must include at minimum a `message` key. Authenticated responses that return a user include `user`. Token-issuing responses include `token` and `type` (always `'Bearer'`).

```php
return response()->json([
    'message' => 'Registration successful.',
    'user'    => $user,
    'token'   => $token,
    'type'    => 'Bearer',
], 201);
```

### Tokens
- Tokens are created with `createToken(name, ['*'], now()->addDays(30))`
- Token name for login/refresh is the `User-Agent` header; for registration it is `'auth_token'`
- Token prefix is `herry_` (configured via `SANCTUM_TOKEN_PREFIX`) for GitHub secret scanning detection

### Password handling
- Passwords are stored via Laravel's `HashedCast` on the `User` model — never hash manually before `User::create()`
- `BCRYPT_ROUNDS=12` in production; tests use `4` (configured in `phpunit.xml`) for speed
- Always use `Hash::check()` for comparison — never string equality

### Timing attack mitigation (do not remove)
The login method always runs `Hash::check()` even when the user does not exist, using a dummy hash. This prevents email enumeration via response timing. Keep this pattern intact.

```php
$hash = $user?->password ?? '$2y$12$invalid.hash.that.never.matches.anything.here';
if (! $user || ! Hash::check($request->password, $hash)) { ... }
```

### Rate limiting
Defined in `AppServiceProvider::configureRateLimiting()`. The `auth` limiter uses two buckets:
- 5 requests/min per IP
- 10 requests/min per `email|IP` combination

Do not bypass or weaken these limits.

---

## Security Invariants

These must be preserved in all changes:

1. **No plaintext passwords** — `HashedCast` handles hashing automatically; never call `Hash::make()` before passing to `User::create()` or `update()`
2. **Timing-safe login** — always run `Hash::check()` against a real or dummy hash
3. **Token revocation on password change** — `changePassword` deletes all tokens except the current one; `resetPassword` deletes all tokens
4. **Signed URLs for email verification** — the `verification.verify` route uses `middleware('signed')`
5. **Rate limiting on public auth routes** — the `throttle:auth` middleware must remain on all public auth routes
6. **No token reuse** — `refresh` deletes the current token before issuing a new one

---

## Testing

### PHP tests
Tests live in `tests/Feature/Auth/AuthTest.php` and use `RefreshDatabase` (rolls back after each test). Run with:

```bash
composer test
```

Tests use an in-memory SQLite database configured in `phpunit.xml`. The test suite covers: registration, login, credential validation, protected route access, password change, token refresh, logout (single + all sessions), and email verification flows.

When adding a new endpoint, add corresponding tests covering:
- Happy path (2xx)
- Validation failures (422)
- Auth failures where applicable (401/403)

### Python tests
```bash
pip install -r python/requirements.txt
python -m pytest python/test_auth_client.py -v
```

Uses `unittest.mock` to mock HTTP responses — no live server required.

---

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed. Critical variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `APP_KEY` | (generated) | Laravel encryption key — never commit |
| `BCRYPT_ROUNDS` | `12` | bcrypt cost factor; lower only in tests |
| `SANCTUM_TOKEN_PREFIX` | `herry_` | Prefix for secret scanning |
| `SANCTUM_STATEFUL_DOMAINS` | `localhost,127.0.0.1` | SPA cookie flow domains |
| `DB_CONNECTION` | `sqlite` | Switch to `mysql`/`pgsql` for production |
| `MAIL_MAILER` | `log` | Use `smtp`/`mailgun` for production emails |
| `SESSION_DRIVER` | `database` | |
| `QUEUE_CONNECTION` | `database` | |
| `CACHE_STORE` | `database` | |

---

## Python Client

`python/auth_client.py` provides a `HerryAuthClient` class wrapping all API endpoints. Usage:

```python
from auth_client import HerryAuthClient

client = HerryAuthClient(base_url="http://localhost:8000")
result = client.register("Alice", "alice@example.com", "Secret1pass")
token = result["token"]

client.set_token(token)
profile = client.me()
```

The client can also be used as a context manager. Keep the Python interface in sync with any API changes.

---

## Database

### Migrations (in order)
1. `create_users_table` — standard Laravel users table
2. `create_cache_table` — database-backed cache
3. `create_jobs_table` — database queue jobs
4. `create_personal_access_tokens_table` — Sanctum tokens (30-day expiry enforced at token creation)

### Dev database
SQLite file at `database/database.sqlite` (created by `composer setup`). Tests use `:memory:` SQLite configured in `phpunit.xml`.

---

## Code Style

- **PHP**: Laravel Pint (PSR-12 + Laravel rules). Run `./vendor/bin/pint` before committing.
- **Indentation**: 4 spaces for PHP and YAML; 2 spaces for JSON (enforced by `.editorconfig`).
- **Line endings**: LF (enforced by `.gitattributes`).
- **Comments**: Only when the *why* is non-obvious (e.g. timing attack mitigation). Do not comment what the code does.
- **Imports**: Sorted alphabetically within each `use` block.
