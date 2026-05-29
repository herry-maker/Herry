# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Herry** is a Laravel 13 REST API (PHP 8.4) with two main feature sets:
1. **Token-based authentication** via Laravel Sanctum — register, login, logout, email verification, password reset, token refresh.
2. **PDF music sheet transcription** — accepts PDF uploads and converts them to MuseScore format using a Python subprocess (`python/music_transcriber.py`).

## Commands

### PHP / Laravel

```bash
# First-time setup
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate

# Full dev environment (server + queue + logs + Vite, all concurrently)
composer dev

# Run all PHP tests
composer test

# Run a single test file
php artisan test tests/Feature/Auth/LoginTest.php

# Run a single test method
php artisan test --filter test_user_can_login

# Code style (Laravel Pint)
./vendor/bin/pint
./vendor/bin/pint --test   # dry run, exits non-zero on violations
```

### Frontend (Vite + Tailwind)

```bash
npm install
npm run dev    # watch mode
npm run build  # production build
```

### Python client & transcriber

```bash
# Auth client only
cd python && pip install -r requirements.txt

# Music transcription (also needs system poppler-utils)
cd python && pip install -r requirements_music.txt

# Run Python tests
cd python && python -m pytest test_auth_client.py -v
cd python && python -m pytest test_music_transcriber.py -v
```

## Architecture

### Laravel side

```
bootstrap/app.php       — Application bootstrap; registers routes, Sanctum stateful middleware
routes/api.php          — Auth routes under /api/auth (public throttled + protected Sanctum)
routes/music_transcription.php — Music routes under /api/music (NOT loaded via bootstrap yet — must be added)
app/Http/Controllers/Auth/
    AuthController.php           — register, login, logout, logoutAll, me, updateProfile, changePassword, refresh
    PasswordResetController.php  — forgotPassword, resetPassword (revokes all tokens on reset)
    EmailVerificationController.php — send, verify
app/Http/Requests/Auth/         — One FormRequest per action; all validation lives here
app/Models/User.php             — HasApiTokens + MustVerifyEmail; #[Fillable] / #[Hidden] PHP 8 attributes
app/Providers/AppServiceProvider.php — Rate limiters: "auth" (5/min per IP + 10/min per email+IP), "api" (60/min)
```

**Key design decisions:**
- Tokens are 30-day expiring Sanctum tokens; the prefix `herry_` enables GitHub secret scanning.
- Login uses a constant-time hash check against a dummy hash for unknown emails to prevent timing-based user enumeration.
- Password change revokes all *other* tokens; password reset revokes *all* tokens.
- `routes/music_transcription.php` defines its own `Route::prefix('api/music')` group and is not registered in `bootstrap/app.php` — if it needs to be active, it must be added there.

### Python side

```
python/auth_client.py        — HTTP client wrapping all /api/auth/* endpoints; stores token in-memory
python/music_transcriber.py  — MusicTranscriber class: PDF → images (pdf2image) → staff/note detection (OpenCV/numpy) → MusicXML (music21)
python/test_auth_client.py   — pytest suite for AuthClient
```

`MusicTranscriptionController` (Laravel) shells out to `music_transcriber.py` via a subprocess. The transcribed files are stored under `storage/app/music_transcriptions/`.

### Testing environment

`phpunit.xml` configures tests to use:
- SQLite in-memory database
- `BCRYPT_ROUNDS=4` (fast hashing)
- Array cache, array mail, sync queue

All Feature tests use `RefreshDatabase`. The `MusicTranscriptionTest` uses `Storage::fake('local')`.

## Conventions

- **Requests:** Every controller action has a matching `FormRequest` in `app/Http/Requests/Auth/`. Validation stays in `rules()`, never in controllers.
- **Responses:** All responses are `JsonResponse`. Auth success messages follow the pattern `'message' => 'Verb noun-ed.'`.
- **Password rules:** `Password::min(8)->letters()->mixedCase()->numbers()` — enforced in `RegisterRequest` and `ResetPasswordRequest`.
- **Token expiry:** Always `now()->addDays(30)` — change here and in `config/sanctum.php` together.
- **PHP attributes:** Use `#[Fillable([...])]` and `#[Hidden([...])]` on models instead of `$fillable`/`$hidden` properties (Laravel 13 style).
