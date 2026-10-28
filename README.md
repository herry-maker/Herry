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

## Djahwasi Guitar Tuner (`/tuner`)

Djahwasi Guitar Tuner, a strobe-style tuner at `public/tuner/index.html`, served at `/tuner`. The page is self-contained, with a manifest, service worker and icon beside it in `public/tuner/`. No build step, no dependencies beyond the browser.

- **Pitch detection** in the browser with the Web Audio API and a McLeod normalized autocorrelation on 4096 samples, accurate down to a bass low E (41 Hz).
- **Strobe disk**: the stripes drift clockwise when sharp, counter-clockwise when flat, and freeze inside ±3 cents. A cents arc and brass pointer sit over the disk.
- **Tunings**: Standard, Drop D, half-step down, DADGAD, Open G, Open D, 4-string bass, ukulele. A4 is adjustable from 415 to 466 Hz. Settings persist in `localStorage`.
- **Headstock pegs**: tap a peg to hear a reference tone and lock it as the target string.
- **Tune all strings**: a guided mode that walks through the strings in order, marks each one done after it is held in tune for 1.2 s, and plays a confirmation tick.
- **Drift trace**: the strip at the foot toggles between the live waveform and an 8-second history of the pitch error in cents.
- **Installable**: ships a web manifest and a service worker, so it can be added to a phone's home screen and opened offline.
- **Keyboard**: space starts or stops listening, 1 to 6 pick a string, Esc clears the target.
- **Capo**: set the capo fret (0 to 12) and every string target transposes; pegs show the sounding note with the open-string name beneath.
- **Tone generator**: pick a root note, pluck or sustain it, play any interval above it (root, then interval, then both), or strum the whole tuning.
- **Open a recording**: analyse an audio file through the same pitch pipeline, for browsers or embeds where the microphone is blocked.

The microphone needs a secure context (`https://` or `localhost`). Two ways to run it:

- `php artisan serve`, then open `http://localhost:8000/tuner/`.
- Open `public/tuner/index.html` straight from disk in Chrome or Firefox (press Ctrl+O or Cmd+O in the browser, or drag the file into a tab).

All asset paths are relative, so the folder also works unchanged on any static host.

Detection is gated by a noise floor tracked from unpitched frames (not a fixed level), so quiet inputs such as a phone microphone with automatic gain control off are still read. If nothing is detected, the input level and clarity figures under the readout show whether sound is reaching the page at all.

---

## Djahwasi Pitch Detector (`/pitch`)

Djahwasi Pitch Detector, a general-purpose pitch detector at `public/pitch/index.html`, served at `/pitch`. Built like the tuner: one self-contained page, relative paths, a manifest and icons beside it, no build step. Where the tuner is organised around guitar strings, this app reports whatever periodic sound it hears, from a bass low B to the top of a piano.

- **Three sources**: the microphone, an audio file (WAV, MP3, M4A/AAC, OGG, FLAC, or a video's audio track, by button or drag-and-drop), and a **self-test tone** generated inside the page and routed straight into the detector. The self-test separates "the detector is broken" from "the microphone is not delivering sound": if it reads the chosen note, the detector works.
- **Readout**: note name and octave, cents from equal temperament (A4 adjustable 415 to 466 Hz), frequency, fractional MIDI number, clarity, and a level meter that shows the input level, the tracked noise floor and the gate.
- **Pitch trace**: the last 7 minutes of pitch are kept and shown on a log-frequency axis with note gridlines, viewable as the last 12 s, 1 min, 3 min or 7 min. **Save CSV** exports the trace (relative time, wall-clock time, f0, MIDI, note, cents, clarity, level, slow level, dynamic mark, approximate dB SPL when calibrated, spectral centroid, flatness, mean, standard deviation, skewness, kurtosis, zero-crossing rate, peak, crest factor); **Save image** exports a branded PNG of the trace. A spectrum strip marks the detected fundamental and its harmonics.
- **Beat and tempo**: onsets are detected from the spectral flux of each frame (local maxima 1.5 standard deviations above the preceding 1.5 s), and the tempo in BPM comes from the autocorrelation of the onset envelope with a log-normal prior centred on 110 BPM (40 to 220 BPM). A beat light flashes on each onset; the panel shows confidence, onsets in the last 8 s, the last inter-onset interval and an onset-strength strip. File analysis reports a whole-file tempo and marks onsets on the chart and in the CSV.
- **Level and dynamics**: RMS and peak in dBFS, a 300 ms slow level, the level range over the last 7 minutes and a one-minute level strip. A musical dynamic mark (ppp to fff) is read off a scale anchored by two levels; **Set pp here** and **Set ff here** anchor it to the player's own soft and loud playing, since absolute dynamics depend on the microphone and distance. The anchors can also be typed in dBFS. Typing a sound-level meter's reading and pressing **Calibrate** shows an approximate dB SPL figure for that microphone and position.
- **Timbre**: spectral centroid (and brightness as a multiple of f0), spread, roll-off, spectral flatness (tonal versus noisy), the first ten harmonics as a bar chart relative to the strongest, odd/even harmonic balance in dB and spectral tilt in dB per octave, with plain-word descriptors (dark, warm, bright, brilliant; clean, breathy, noise-like; hollow; fundamental-heavy, rich upper harmonics). The same descriptors are computed for files and exported in the CSV.
- **Statistics**: key statistical measures of the current window (4096 samples): mean (DC offset), variance and standard deviation, skewness, excess kurtosis, zero-crossing rate per second, RMS amplitude (linear and dBFS), peak and crest factor, each with a one-line meaning and a plain-word reading. File analysis reports the same measures over the whole file and per frame in the CSV.
- **Recording**: **Record** captures the microphone for up to 7 minutes (it stops by itself at 7:00). On stop the recording is analysed like an opened file, with the full pitch-track chart, playback, CSV export and a **Save recording** button (WebM/Opus in Chrome and Firefox, M4A in Safari).
- **File analysis**: the whole file is analysed offline in a Web Worker (4096-sample window, 1024-sample hop) and drawn as a pitch track. Click the chart to play from that point with the live readout running. Summary figures (voiced fraction, median, 5 to 95 percent range, tempo, level range and dynamics, median centroid) and a **CSV export** (time, f0, MIDI, note, cents, clarity, level, dynamic, centroid, flatness, onset, standard deviation, skewness, kurtosis, zero-crossing rate, crest factor) support transcription and performance-analysis work.
- **Algorithm**: McLeod Pitch Method (normalized square difference function) with the autocorrelation computed by FFT, parabolic peak interpolation and median smoothing. Validated in Node on synthetic tones from 30 Hz to 2.5 kHz within 2 cents, at input levels down to −60 dBFS and at 6 dB signal-to-noise ratio; about 1 ms per frame.
- **Robust input handling**: noise-floor gate instead of a fixed level cutoff; the audio context is recreated if iOS changes the hardware sample rate when the microphone opens; a tap-to-resume prompt if the browser suspends audio; a silence watchdog; device picker when more than one microphone exists; specific messages for each permission and device error.
- **Diagnostics panel**: secure context, microphone API availability, audio context state, sample rate, device label, applied track settings, frames analysed and the last error, with a troubleshooting checklist.
- **Settings** persist in `localStorage`: range preset (voice, guitar, bass, violin/flute, piano, auto), A4, sharps or flats, sensitivity (clarity threshold), smoothing, trace span, dynamics anchors and SPL calibration.
- **Keyboard**: space starts or stops the microphone.

Run it the same way as the tuner: `php artisan serve` and open `http://localhost:8000/pitch/`, or open `public/pitch/index.html` from disk. The microphone needs `https://` or `localhost`; the file and self-test sources work anywhere. The GitHub Pages workflow publishes it at `https://<owner>.github.io/<repo>/pitch/` beside the tuner.

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
