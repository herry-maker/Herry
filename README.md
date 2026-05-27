# Herry — Authentication API & Music Transcription

A Laravel 13 REST API providing full token-based authentication, Python client library, and PDF music sheet transcription to MuseScore format.

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 13 (PHP 8.4) |
| Auth tokens | Laravel Sanctum |
| Python client | `python/auth_client.py` (stdlib + `requests`) |
| Music Transcription | Python (music21, OpenCV, pdf2image) |
| Database | SQLite (dev) / MySQL/Postgres (prod) |

---

## Quick Start

### 1. Setup & Installation

```bash
# Install PHP dependencies
composer install

# Copy environment file and generate app key
cp .env.example .env
php artisan key:generate

# Run migrations
php artisan migrate

# Install Python music transcription dependencies
cd python
pip install -r requirements_music.txt
cd ..

# Start development server
php artisan serve
```

### 2. Install System Dependencies (for Music Transcription)

**Ubuntu/Debian:**
```bash
sudo apt-get install poppler-utils python3-dev
```

**macOS:**
```bash
brew install poppler
```

**Windows:**
Download from [poppler-windows releases](https://github.com/oschwartz10612/poppler-windows/releases/)

---

## API Endpoints

### Authentication Endpoints

All endpoints are prefixed with `/api/auth`.

#### Public (no token required)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Log in and receive a Bearer token |
| `POST` | `/api/auth/forgot-password` | Send a password-reset link by email |
| `POST` | `/api/auth/reset-password` | Reset password using the emailed token |

#### Protected (Bearer token required)

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

### Music Transcription Endpoints

All endpoints are prefixed with `/api/music`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/music/transcribe` | Upload PDF and transcribe to MuseScore |
| `GET` | `/api/music/transcriptions` | List all transcriptions |
| `GET` | `/api/music/download/{file}` | Download a transcribed file |
| `DELETE` | `/api/music/delete/{file}` | Delete a transcribed file |

---

## Request/Response Examples

### Authentication

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

### Music Transcription

**Upload and Transcribe**
```bash
curl -X POST http://localhost:8000/api/music/transcribe \
  -F "pdf_file=@sheet_music.pdf" \
  -F "title=Concerto in D Major" \
  -F "output_format=mscx"
```

**Response (201)**
```json
{
  "message": "Music transcription completed successfully",
  "data": {
    "file_name": "sheet_music.pdf",
    "title": "Concerto in D Major",
    "output_file": "sheet_music_transcribed.mscx",
    "pages_processed": 5,
    "notes_detected": 156,
    "download_url": "http://localhost:8000/api/music/download/sheet_music_transcribed.mscx"
  }
}
```

---

## Security Measures

### Authentication
- **Password hashing** — bcrypt with 12 rounds (`BCRYPT_ROUNDS=12`)
- **Token prefix** — `herry_` prefix enables secret-scanning on GitHub
- **Token expiration** — 30 days (configured in `config/sanctum.php`)
- **Rate limiting** — Auth endpoints: 5 req/min per IP; API: 60 req/min
- **Input validation** — Every request validated via dedicated `FormRequest` classes
- **CSRF** — Sanctum `EnsureFrontendRequestsAreStateful` for SPA/cookie-based flows
- **Logout invalidation** — Password change revokes all other sessions; password reset revokes all tokens

### Music Transcription
- **File validation** — Only PDF files accepted, max 50MB
- **Directory traversal protection** — Prevents access to files outside storage
- **Temporary file cleanup** — Processed files removed after transcription
- **Access control** — Download/delete operations restricted to uploaded files

---

## Python Client Library

### Installation

```bash
cd python
pip install -r requirements.txt
```

### Basic Usage

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
python -m pytest test_music_transcriber.py -v
```

---

## Music Transcription

### Overview

Convert PDF sheet music to MuseScore format automatically using advanced image recognition.

**Features:**
- Extract images from PDF files
- Detect musical staff lines
- Recognize note positions
- Estimate pitch values
- Generate MusicXML compatible with MuseScore

### Direct Python Usage

```python
from music_transcriber import transcribe_pdf_to_musescore

result = transcribe_pdf_to_musescore(
    pdf_path='sheet_music.pdf',
    output_dir='./output',
    title='My Transcription'
)

if result['success']:
    print(f"Output: {result['output_file']}")
    print(f"Notes: {result['notes_detected']}")
    print(f"Pages: {result['pages_processed']}")
else:
    print(f"Error: {result['error']}")
```

### Supported Formats

**Input:** PDF (300+ DPI recommended)
**Output:** MSCX (MuseScore), MSCZ, or MusicXML

### Limitations

- Best with printed sheet music; handwritten notation may not work well
- Single-staff melodies recommended for best accuracy
- Complex notation not yet supported
- Performance: ~5-10 seconds per page

**See [MUSIC_TRANSCRIPTION_FEATURE.md](MUSIC_TRANSCRIPTION_FEATURE.md) for complete documentation.**

---

## Environment Variables

Key variables in `.env`:

```dotenv
BCRYPT_ROUNDS=12
SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1
SANCTUM_TOKEN_PREFIX=herry_
MAIL_MAILER=log          # Use smtp/mailgun in production for real emails
```

---

## Testing

### Run All Tests

```bash
# PHP tests
composer test

# Python tests
cd python
pytest -v
```

### Test Music Transcription

```bash
cd python
pytest test_music_transcriber.py -v
```

### Test API Endpoints

```bash
php artisan test tests/Feature/MusicTranscriptionTest.php
```

---

## Project Structure

```
Herry/
├── app/
│   └── Http/Controllers/
│       └── MusicTranscriptionController.php
├── python/
│   ├── music_transcriber.py
│   ├── test_music_transcriber.py
│   ├── requirements.txt
│   └── requirements_music.txt
├── routes/
│   └── music_transcription.php
├── tests/
│   └── Feature/
│       └── MusicTranscriptionTest.php
├── MUSIC_TRANSCRIPTION_FEATURE.md
└── README.md
```

---

## Troubleshooting

### PDF Conversion Issues

```
Error: "Cannot find a usable mro_class_name"
Solution: Install poppler-utils
  - Ubuntu: sudo apt-get install poppler-utils
  - macOS: brew install poppler
```

### Missing Python Modules

```
Error: "ModuleNotFoundError: No module named 'pdf2image'"
Solution: pip install -r python/requirements_music.txt
```

### No Notes Detected

- Increase PDF DPI (300+ recommended)
- Check sheet music quality
- Ensure staff lines are clear and well-defined

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

---

## License

MIT License - see LICENSE file for details

---

## Resources

- [Laravel Documentation](https://laravel.com/docs)
- [music21 Documentation](http://web.mit.edu/music21/)
- [MusicXML Standard](https://www.musicxml.com/)
- [OpenCV Documentation](https://docs.opencv.org/)
