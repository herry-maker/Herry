---
name: stickman-video
description: Produce or continue a stickman explainer video in this repository with the kaomei/stickman-video-director Code Engine (B styles). Use when the user mentions stickman video, Banyak Referensi, Vidka/Herry/Ardipal, project.json shots, B1/B6 rendering, narration recording or the bootstrap/check scripts. Installs nothing by itself; routes narration to ElevenLabs, art to ElevenLabs/Figma image generation or supplied rasters, mixing to FFmpeg.
---

# Stickman video (project skill)

Project: `video/banyak-referensi/` — "Banyak Referensi, Mana yang Tepat?", 12 × 15 s, Indonesian, currently authored for **B1 Minimal Line Art 16:9**. The upstream Skill is not vendored; it is installed on demand into a cache by `scripts/bootstrap.sh`.

## 1. Runtime: bootstrap and check

```bash
.claude/skills/stickman-video/scripts/bootstrap.sh install            # B6-only sparse checkout + npm ci + venv + doctor
.claude/skills/stickman-video/scripts/bootstrap.sh install --style B1  # also fetch assets/b1 (needed by this project's B1 reference review)
.claude/skills/stickman-video/scripts/check.sh --project video/banyak-referensi
```

- Target dir: `~/.cache/stickman-video-director`, overridden by `B6_UPSTREAM_DIR` or `--dir`. The Skill root is `<dir>/skills/directing-stickman-videos`; export it as `SKILL_DIR` for `tools/make-art.mjs` and run all `autopilot.mjs` commands from it.
- `bootstrap.sh` flags: `--with-audio-library` (adds the 250 MB upstream SFX/music library), `--dir`, `--update` (or the `update` command: re-fetch and re-check), `--ref` (branch, tag or commit), repeatable `--style` (extra asset packs; B6 is always included because `doctor --style B6` needs its pack).
- `bootstrap.sh` builds `<dir>/.venv` from upstream's pins (`assets/b6/hong-kong-v90/requirements.txt`: numpy 2.0.2, Pillow 11.3.0, opencv-python-headless 4.13.0.92) and falls back to current wheels when the pins have no wheel for the local Python; the mode is recorded. It then runs `doctor --style B6` with that venv and writes `<dir>/b6-bootstrap.json` (upstream commit, styles, pin mode, doctor JSON).
- `check.sh` installs nothing. It lists host tools, upstream files, venv imports and the doctor checks, optionally a project's narration and SHA pin, and ends with one `READY` or `NOT READY` line (exit 0 only on READY).

What neither script can see, and must be checked in the conversation instead: whether the ElevenLabs and Figma connectors are attached to the session, remaining ElevenLabs credits, and whether a paid take already exists elsewhere. The `gemini_key_present` field in doctor output is irrelevant to the routes below; do not treat it as a blocker or a requirement.

## 2. Service routes

| Need | Route | Rules |
|---|---|---|
| Narration | **ElevenLabs connector** (`creative_generate_speech`), voice chosen **by listed voice ID** from `creative_list_voices`, never from memory | **One paid take.** Confirm text (`narasi.md`), voice and cost with the user first. Download the returned file to `audio/narasi.<ext>`, convert with FFmpeg to 48 kHz WAV, write `sha256sum` to `audio/narasi.sha256`, set `voice.path` in `tools/build-project.mjs`. Never regenerate, speed-change or trim an accepted take; a revision is a new user decision. |
| B6 default voice (upstream) | "The Pharaoh 3" — listed in this workspace as **The Pharaoh 3 - Youthful, fresh and dynamic**, ID `Qziuou6kCJ2R3w53L2Zs`, English | Upstream names the voice "Energetic, Lively & Cheerful"; the listed name differs, so pin the ID, not the label. Re-list before use: library listings change. |
| This project's voice (Indonesian) | **Chosen and recorded 2026-11-24: Bayu - academic, calm and clear `saYZ00LWtwkN6VaX46N9`, `eleven_multilingual_v2`, one take, 170.3 s, flow `WxFOQoJ8tNIoUFz6nVFo`; SHA pinned in `audio/narasi.sha256`. Do not regenerate.** Other candidates listed that day (`languages: id`, educational/narrative): **Bayu - academic, calm and clear** `saYZ00LWtwkN6VaX46N9`; **Abu Aisyah** `EOiisOG9mUn5iXbtXJuL`; **Dito - Indonesian Narrator** `RPwoahKEr9WZSgNHBLbp`; **Mona - Storyteller** (female) `zjmMdjff4JG35O3EQJBV` | User picks one; no auditions without authorization (each audition is a paid call). Dialogue lines (Vidka, Herry, Ardipal, Pemain) may use the same voice in a first take; separate voices are a later, separately authorized decision. |
| Character and prop art | **ElevenLabs image generation** (`creative_generate_image`, reference via `creative_attach_reference_file`) **or Figma image generation** (`generate_image` after `create_session`) **or rasters the user supplies** | Keep the file names and aspect ratios in `video/banyak-referensi/art/`; `project.json` then needs no change. Transparent PNG, fine black line on nothing, B1 proportions (slender, 4–4.5 heads). Current PNGs are code-drawn placeholders from `tools/make-art.mjs`. Image generation is billable: list what will be generated and get a yes first. |
| Mixing and encoding | **FFmpeg / FFprobe** on the host, driven by `autopilot.mjs preview/render` | Ambience bed, SFX and music are declared in `project.json`; `tools/make-audio.sh` regenerates the placeholder WAVs. Music needs a licensed file (`music: {path, gain ≤ 0.2}`). |

Network: generated media downloads come from `elevenlabsusercontent.com`, which the "Herry" cloud environment allows and the Default one does not; switch the session there before downloading. Never paste or log API keys; connectors authenticate themselves. Never fabricate a passing review or run `approve` on technical checks alone: the user approves the sample.

## 3. Production loop for this project

1. `check.sh --project video/banyak-referensi` → READY.
2. Narration: one take via the ElevenLabs route, pin SHA, update `voice.path`.
3. Align: `tools/align-cues.mjs` writes `audio/timing.json` from per-word timestamps (`--words`, exact) or from FFmpeg `silencedetect` pauses (approximate, current state). Word timestamps come from ElevenLabs Scribe on the connector (about 52 credits for this take; the call needs the user's permission in this session) since Whisper model hosts are not reachable from the sandbox. `build-project.mjs --timing audio/timing.json` then scales each scene's choreography to its real length. Pictures follow speech; the 15 s per scene is a word budget, not a cut list.
4. `node tools/build-project.mjs && node tools/motion-gaps.mjs project.json` → `autopilot.mjs validate` → `preview --seconds 60`.
5. The user watches the actual MP4 with sound; an independent review fills `output/preview-reference/review-template.json`; only then `approve --visual-review … && render`.

Constraints inherited from upstream B1: one caption line ≤ 1120 design units; the principal picture must show keyed local motion at least every 2.5 s (`motion-gaps.mjs` finds gaps); hand font Caveat lacks `→ — · ≠` (use words); figures stand on y = 600 with the caption band from y = 610.
