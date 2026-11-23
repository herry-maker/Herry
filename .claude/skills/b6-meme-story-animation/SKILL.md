---
name: b6-meme-story-animation
description: Use when a user asks for a "B6", "Meme Story Animation", "动感 Meme 风" or "Dynamic Meme Animation" video, a meme-face hand-drawn story cartoon in the style of the stickman-video-director Code Engine (B) B6 route or of YouTube's RicksClips3000, or when planning, previewing, reviewing or repairing such a film. Also use when someone reaches for a generic Shorts pipeline (Remotion, word-pop captions, camera shake, uniform-line stickmen) to imitate that look.
---

# B6 · Meme Story Animation

B6 is one style route inside the open-source skill
[kaomei/stickman-video-director](https://github.com/kaomei/stickman-video-director)
(`skills/directing-stickman-videos`, MIT). It turns a short story with a twist
(con stories, historical oddities, absurd comedy) into a lively 2D cartoon:
expressive meme faces, loose pressure-varying ink, matte paint, soft warm
light, a wide painted world, code-directed acting and camera. This skill is a
distilled operating manual for that route. It renders nothing itself: the
upstream skill's Node + Python painted-puppet engine does.

**Core principle:** the deliverable is a NEW film that matches Sample 1
(portrait "The Man Who Sold the Eiffel Tower", V44) in drawing, limb weight,
acting, space, camera, rhythm and captions. Initialization, copied assets, a
re-encode of a sample or a technically valid encode with weak acting is not
the deliverable. Technical checks, motion review and the user's decision are
three separate results; none substitutes for another.

## What B6 is NOT (the baseline mistakes)

| Generic-Shorts habit | B6 reality |
|---|---|
| Remotion / After Effects / edge-tts / whisperx pipeline | Upstream `autopilot.mjs` + project `run.py` painted engine; see [runtime-commands](references/runtime-commands.md) |
| Round-head stickman, 6 px uniform black line, dot eyes, ≤5 flat colours | Asymmetric flattened white head, heavy lids, uneven brows, pressure-varying single-stroke limbs, broad matte paint, soft light; see [art-direction](references/art-direction.md) |
| 72 px all-caps word-highlight captions at 60 % height | Archivo Black 47 px @720×1280, white with 4 px `#171319` outline, baseline y 914, one line, hard phrase cuts, no pop/bounce/highlight |
| Speed up the voice to fit, rate +5 % | Original-speed narration; cut words or extend duration instead |
| Whip transitions, camera shake on punchlines, zoom for energy | Depth from projection, parallax and occlusion through an authored wide world; motivated tracks/reveals/reaction cuts; shake only for an earned accent |
| Gates = loudness, file size, ffprobe | 35-subcheck review against Sample 1 playback, then the user's decision; see [acceptance-matrix](references/acceptance-matrix.md) |
| "You approve the character sheet, then I render" | Agent authors, previews, reviews and repairs; the user decides on the actual preview and the final |

## Prerequisites

1. Upstream skill installed (sparse clone, `npm ci`, `node scripts/autopilot.mjs doctor --style B6`). Host needs Node 20+, FFmpeg/FFprobe, Python 3.9+ with NumPy, Pillow, OpenCV. The agent fixes the environment; it does not send the user to assemble it.
2. An authenticated TTS provider for new narration (default voice: ElevenLabs "The Pharaoh 3 - Energetic, Lively & Cheerful"; verify the voice ID, never invent it), and a still-image tool or user-supplied raster art for new characters/worlds. Missing provider access is a stated, pending gap, never a silent downgrade.
3. Projects live outside the installed skill directory.

## Locked defaults (user's explicit choice overrides)

| Setting | Default |
|---|---|
| Ratio / size / fps | 9:16 works best, native **720×1280 @ 30 fps**; 16:9 is a separate native plan at 1280×720, never a crop |
| Primary reference | Sample 1 portrait V44 (`assets/b6/reference/eiffel-portrait-v44.mp4`); Sample 2 Hong Kong V90 = secondary binding evidence only |
| Narration | English, original speed, one accepted track pinned by SHA-256 |
| Captions | profile `eiffel-v44-portrait-archivo-black-v1`; single line; semantic breaks aligned to the actual recording |
| Sound | scene/beat sound script, bundled B audio library first, licensed background music by default |
| Preview | full-timeline 30 fps draft at `--draft-scale 0.5` (360×640) first, then a 5–20 s native stress segment chosen from the plan's shot `start` times |
| Tools the skill does not ship | TTS (use the host's authenticated ElevenLabs route), still-image generation, audio mixing (FFmpeg); name what is missing before promising a timeline |

## Production sequence

Follow [production-sequence](references/production-sequence.md) end to end:
lock → beats → native plan per ratio → character art → wide world → bind and
fixed-camera action test → camera in space → voice/captions/sound → draft and
native preview with full motion review → approve → render → final review →
deliver with folder link and checkpoint.

The command skeleton (portrait):

```bash
node scripts/autopilot.mjs workflow --style B6 --ratio 9:16
node scripts/autopilot.mjs doctor --style B6
node scripts/autopilot.mjs init /abs/new-story --style B6 --ratio 9:16
node scripts/autopilot.mjs preflight /abs/new-story --ratio 9:16
python3 /abs/new-story/run.py draft /abs/new-story --ratio 9:16 --trusted-code --draft-scale 0.5 --output outputs/draft-01
node scripts/autopilot.mjs validate /abs/new-story --ratio 9:16
node scripts/autopilot.mjs preview /abs/new-story --ratio 9:16 --trusted-code --start 0 --seconds 7.5 --output outputs/preview-01
python3 /abs/new-story/run.py review-pack /abs/new-story --ratio 9:16 --report outputs/preview-01/report.json --output outputs/review-01
python3 /abs/new-story/run.py check-review /abs/new-story --ratio 9:16 --report outputs/preview-01/report.json --review outputs/review-01/motion-review.json
python3 /abs/new-story/run.py approve /abs/new-story --ratio 9:16 --report outputs/preview-01/report.json --review outputs/review-01/motion-review.json --note "user's decision"
node scripts/autopilot.mjs render /abs/new-story --ratio 9:16 --trusted-code --output outputs/film-01
```

## Honest capability boundary

The installed path can initialize a project, validate, render painted
world-space layers, execute authored local scene code, keep original-speed
audio, burn semantic captions and encode both native ratios. It does NOT
paint a new cast, infer a skeleton from a flat image, invent expressions,
generate a walk from text, mix audio, or guarantee audience performance.
New art needs an image tool or supplied raster; new actions need fitting and
calibration; walking needs authored stance/view/foot-contact work. Say which
of these the current environment lacks before promising a timeline.

## Quick reference

| Need | Read |
|---|---|
| Install, project files, every command and flag, puppet/actions API sketch | [references/runtime-commands.md](references/runtime-commands.md) |
| Drawing grammar, era/place brief, light, still-art prompt | [references/art-direction.md](references/art-direction.md) |
| Voice, caption profile numbers, semantic cue rules, sound and music | [references/captions-and-sound.md](references/captions-and-sound.md) |
| Step-by-step production and what each stage must output | [references/production-sequence.md](references/production-sequence.md) |
| 35 subchecks, evidence rules, stop-and-repair triggers | [references/acceptance-matrix.md](references/acceptance-matrix.md) |
| Full upstream text (puppet API, binding contract, V90 recipe) | upstream `skills/directing-stickman-videos/references/b6-*.md` |

## Common mistakes

| Mistake | Correct B6 behavior |
|---|---|
| Treating `init` or a copied `assets/b6/paint` folder as progress | Author story-specific art; bundled media is compare-only and hash-blocked |
| Pasting Sample 1 or V90 frames into the film | Use them to brief new paintings and to compare; never as layers |
| Inheriting V90's thin wire limbs for a new cast | Match Sample 1's heavier stroke at matched head width; record the comparison frames |
| Calling a passing `check-review` or encode "approved" | Only the user's decision on that exact preview hash is approval; `approve` is per ratio and per fingerprint |
| Delivering a `pending` / `needs_repair` preview and waiting | Repair the responsible asset/code, re-render, re-review; stop only for an explicit interim request, a stop, or an evidenced blocker |
| Converting portrait to landscape by crop or shared coordinates | Separate native plan, staging, camera and caption band per ratio |
| "Period look" via a date caption and one old car | Costume silhouette, hair, accessories and street furniture all carry the era; run the period-read review |
| Editing `b6_puppet.py`, thresholds or `quality-target.json` to pass | Fix the art, fitting or staging; hash-checked runtime refuses edited helpers |
| Running `approve` for the agent's own test or an old approval | Never; approval records the user's words about the current reviewed video |
| Publishing, uploading or spending after delivery | Each is a separate user instruction |

## Provenance

Distilled on 2026-11-23 from kaomei/stickman-video-director at commit
`7e6dd42` (MIT License, © 2026 Stickman Video Director contributors). The
upstream README section for this style is `README.md#b6`; the style's own
reference files are `skills/directing-stickman-videos/references/b6-*.md`.
Upstream evolves quickly: when a command or value here disagrees with the
installed copy, the installed copy wins and this skill should be updated.
