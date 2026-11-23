# B6 runtime: install, project layout and commands

Condensed from `references/b6-installed-production.md`, `b6-code-runtime.md`,
`b6-fast-iteration.md`, `b6-motion-review.md` and `autopilot-runtime.md` in
kaomei/stickman-video-director (MIT). Command names and flags are copied
verbatim from `scripts/autopilot.mjs`; verify against the installed copy,
because upstream changes often.

## Install the upstream runtime (one time per machine)

B6 is rendered by code shipped inside the upstream skill folder
`skills/directing-stickman-videos`. Nothing in this skill renders video.
Use the bundled bootstrap instead of a full clone (the complete upstream
skill is ~500 MB; B6 needs about a fifth of it):

```bash
bash scripts/check.sh                                   # report only
bash scripts/bootstrap.sh install                       # default: ~/.cache/stickman-video-director
bash scripts/bootstrap.sh install --dir /abs/dir        # custom location (or set B6_UPSTREAM_DIR)
bash scripts/bootstrap.sh install --with-audio-library  # + assets/b-audio-library (250 MB)
bash scripts/bootstrap.sh install --update              # move an existing clone to current origin/main
```

What it does: sparse partial clone of `scripts/`, `references/`,
`assets/b6`, `assets/fonts` (cone mode, so `package.json`, `package-lock.json`
and `SKILL.md` come along); `npm ci` (`@napi-rs/canvas`, `sharp`); a venv at
`<dir>/.venv-b6` from `assets/b6/hong-kong-v90/requirements.txt`
(`numpy==2.0.2`, `Pillow==11.3.0`, `opencv-python-headless==4.13.0.92`,
falling back to current wheels if the pins fail); then
`node scripts/autopilot.mjs doctor --style B6` with `B6_PYTHON` pointing at
that venv. It writes `<dir>/b6-bootstrap.json` (upstream commit, python,
pin status, doctor exit code) and prints the exports to use. Tested
2026-11-23: all ten doctor checks pass from this trimmed checkout, and
`init --style B6` scaffolds a project from it.

Doctor checks: Node ≥ 20, ffmpeg, ffprobe, canvas, sharp, bundled fonts,
Python with NumPy/Pillow/OpenCV, the Archivo Black caption font and the
complete `assets/b6` pack. It checks local dependencies only, not TTS or
image-provider access.

Manual equivalent, if you prefer:

```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/kaomei/stickman-video-director.git stickman-video-director
git -C stickman-video-director sparse-checkout set skills/directing-stickman-videos/scripts skills/directing-stickman-videos/references skills/directing-stickman-videos/assets/b6 skills/directing-stickman-videos/assets/fonts
cd stickman-video-director/skills/directing-stickman-videos && npm ci
python3 -m venv ../../.venv-b6 && ../../.venv-b6/bin/pip install -r assets/b6/hong-kong-v90/requirements.txt
B6_PYTHON=../../.venv-b6/bin/python node scripts/autopilot.mjs doctor --style B6
```

Keep production projects and their outputs OUTSIDE the upstream directory;
`init` refuses paths inside it. Without `--with-audio-library`,
`scripts/audio-library.mjs` fails with "Cannot read audio catalog", and
because B6 films carry SFX and licensed music by default, the sound gate
then depends on external licensed sources with evidence; install the
library for production. `check.sh` reports host tools, upstream files and
doctor only; it cannot see connectors or credits.

## Read-only route query

```bash
node scripts/autopilot.mjs workflow --style B6 --ratio 9:16 [--project /abs/project]
```

Returns absolute paths and argument arrays for production standards,
acceptance standards and the review-template workflow (doctor, init,
validate, preview, review-pack, check-review, approve, render, film review,
delivery completeness). Its arrays are authoritative for the installed
version; the examples in this file are illustrative and may differ in
small ways (for example `validate <dir>/project.json`, or `run.py preview`
without `--start`). Run it before production and copy its arguments.

## Initialize a production project

```bash
node scripts/autopilot.mjs init /abs/new-story --style B6 --ratio 9:16     # or 16:9 or both
```

Default init (no `--example`) creates a `b6-production-v1` project with:

| File | Role |
|---|---|
| `project.json` | `version: 2`, `style: B6`, `renderer: b6-production-v1`, `purpose: production`, `stage: needs_authoring` (set to `authored` when done), `duration` (null until authored), `fps: 30`, `voice.path`/`sha256`, `formats`, `inputs`, `quality_target` |
| `story.json` | `narration` text and beats |
| `captions.json` | semantic cues aligned to the actual voice recording |
| `scene.py` | exports `frame(t, context)` (native) and `draft_frame(t, context)` (draft); returns `context.puppet_runtime.RenderResult` |
| `formats/portrait.json`, `formats/landscape.json` | one native plan per ratio: portrait **720×1280**, landscape **1280×720**; `caption` profile (landscape also needs `native_layout_reason`); continuous `shots[]` with `start`, `composition`, `action`, `camera`, `transition`; `cast_inventory: [{id, role, shot_ids}]` |
| `characters.json` + `characters/<id>/<view>/` | cast → per-view `b6-puppet/1` packages (`binding_version: 2`) |
| `quality-target.json` + `reference/eiffel-portrait-v44.mp4` | copy of `assets/b6/style-standard.json` and the hash-checked Sample 1 movie, project-local, compare-only (hash-blocked as a layer) |
| `run.py`, `b6_puppet.py`, `b6_space.py`, `b6_actions.py`, `b6_iteration.py`, `b6_character_preflight.py`, `b6_asset_roles.py`, `caption_renderer.py`, `motion_review.py` | trusted runtime copies; hashes are verified before import, so never edit them |
| `engine/` | the locked V90 painted engine, fonts and rigs |

`--ratio both` creates two native plan slots, not a conversion. The two
`--example` routes are NOT production: `--example hong-kong-v90` reproduces
the unchanged 20 s Sample 2 clip (`purpose: example-reproduction`);
`--example blocking-calibration` is a retired six-second diagnostic whose
`approve`/`render` are permanently disabled.

## Authoring loop (portrait example)

```bash
# After character packages are fitted, before paid narration or full encode:
node scripts/autopilot.mjs preflight /abs/new-story --ratio 9:16
# Optional explicit planned views:
python3 scripts/b6_character_preflight.py /abs/new-story --required-views /abs/views.json --output /abs/new-story/character-preflight.json

# Full-timeline, full-30fps, half-resolution motion draft (needs draft_frame in scene.py):
python3 /abs/new-story/run.py draft /abs/new-story --ratio 9:16 --trusted-code --draft-scale 0.5 --output outputs/draft-01

# Schema/hash validation without importing scene code:
node scripts/autopilot.mjs validate /abs/new-story --ratio 9:16

# Native preview of a representative 5–20 s stress range:
node scripts/autopilot.mjs preview /abs/new-story --ratio 9:16 --trusted-code --start 0 --seconds 7.5 --output outputs/preview-01

# Which ranges a change invalidates (never grants review credit):
python3 /abs/new-story/run.py plan-iteration /abs/new-story --ratio 9:16 --report outputs/preview-01/report.json
```

`node scripts/autopilot.mjs <cmd>` (from the installed skill) and
`python3 /abs/new-story/run.py <cmd>` (from anywhere) are the same
commands; upstream mixes them freely. Prefer `run.py` once the project
exists so the project stays reproducible without the skill checkout.
`--start`/`--seconds` are seconds on the project timeline; pick them from
the plan's shot `start` values. `--draft-scale 0.5` renders 360×640 for a
720×1280 plan (0.75 → 540×960); frame count, fps and audio speed are
unchanged. `--trusted-code` means the
authored `scene.py` executes as local Python; read it first. Scene code
must not spawn processes or decode media itself: prepare story media as
project-local PNGs listed in `project.inputs`.

## Audio library, voice and mixing

```bash
node scripts/audio-library.mjs recommend --style B6 --beat paper-handoff --limit 3   # beats: opening, reaction, prop-handoff, walk, transition, street, money, applause, ending, ...
node scripts/audio-library.mjs search "cash register" --kind sfx
node scripts/audio-library.mjs list --kind music --limit 40
node scripts/audio-library.mjs export --ids ID1,ID2,ID3 --out /abs/new-story/audio
```

`export` copies the recordings with license evidence, writes
`audio-selection.json` and `CREDITS.md`. B6's library direction: playful
scheming music; brisk prop, money, street and reaction sounds; no whoosh on
every camera move.

Nothing in the skill synthesizes speech, paints, or mixes. Narration: the
host's ElevenLabs connector (list voices → "The Pharaoh 3 - Energetic,
Lively & Cheerful" → generate once → save to the project → pin SHA-256).
Art: the host's image generation (ElevenLabs creative image tools or Figma
image generation) with the still-art brief, or user-supplied rasters. Mix:
FFmpeg (already required by `doctor`), ONE full-length master the encoder
muxes. Record every tool, provider and file hash in the checkpoint.

## Review and approval

```bash
# Decoded shot clips, reference clips, frames, index.html and a PENDING motion-review.json:
python3 /abs/new-story/run.py review-pack /abs/new-story --ratio 9:16 --report outputs/preview-01/report.json --output outputs/review-01
# ...the agent watches the media and fills every subcheck observation, then:
python3 /abs/new-story/run.py check-review /abs/new-story --ratio 9:16 --report outputs/preview-01/report.json --review outputs/review-01/motion-review.json
# Only after the USER's actual decision on that exact preview:
python3 /abs/new-story/run.py approve /abs/new-story --ratio 9:16 --report outputs/preview-01/report.json --review outputs/review-01/motion-review.json --note "User's words"
node scripts/autopilot.mjs render /abs/new-story --ratio 9:16 --trusted-code --output outputs/film-01
# Then build a fresh review-pack from outputs/film-01/report.json and check-review again before delivery.
```

A rejected preview's review is immutable. Build the replacement pack with
`--review outputs/review-01/motion-review.json` so its open findings carry
into `repair_log`; `.b6-review-history/` is preserved with the project and
is never added to `project.inputs`. `approve` is per ratio, per reviewed
video hash, per input fingerprint; any change to reviewed source, art or
audio invalidates it. Never run `approve` for the agent's own test.

Encoded outputs include SRT/VTT sidecars derived from the same semantic
cues as the burned-in captions. Deliver MP4, sidecars, project/checkpoint,
review state and a clickable containing-folder link. Publication is a
separate user instruction.

## Puppet and helper APIs (sketch)

Full contract: upstream `references/b6-puppet-api.md`, `b6-actions.md`,
`b6-code-runtime.md`.

```python
runtime = context.puppet_runtime                     # trusted b6_puppet.py
hero = runtime.Puppet(context.character_packages['hero'], 'three_quarter', 'hero')
track = context.actions.offer_track(runtime, hero_view.arms['right'],
                                    start=1.2, reach=.25, offer=.18, hold=.35, retract=.32)
timeline = context.actions.handoff_timeline(runtime, start=1.4, shared_start=1.9,
    shared_end=2.15, end=2.7,
    giver={'actor_id': 'hero', 'arm': 'right', 'grip': [.18, .65]},
    recipient={'actor_id': 'mark', 'arm': 'left', 'grip': [.78, .65]},
    paper_size=(84, 40), initial_pose=[20, -205, 0], shared_pose=[0, -205, 0], final_pose=[-20, -210, -3])

def frame(t, context):
    cam = camera_for(t)                              # b6_space.Camera / camera_move / CameraTravel
    contact = runtime.transform_contact(timeline.sample(t), contact_plane_matrix(cam))
    pose = hero.pose(frame_index=i(t), placement=cam.billboard_matrix(hero_foot, units_per_pixel=.8),
                     arm_actions={'right': track.sample(t)},
                     wrist_targets=contact.targets.get('hero', {}),
                     head_angle_deg=context.actions.reaction_nod(t, start=2.3))
    result = runtime.render_scene(context.size, [pose, ...], paper=contact,
                                  paper_art=deed_rgba, background=bg_rgba, frame_index=i(t))
    runtime.validate_render_result(result, expected_actor_ids={'hero', 'mark'})
    return result

def draft_frame(t, context):
    view = context.viewport                          # RenderViewport; use view.size and view.camera(native_cam)
    return draw_scene(t, context, camera=view.camera(camera_for(t)), size=view.size)
```

Hard rules the runtime enforces: fixed planar bone lengths, no stretch, no
elbow-pole flip, five fitted actions only (`rest`, `reach`, `offer`,
`receive`, `retract`), one `ContactTimeline` owns the prop and every grip,
`owner → shared → owner` transfers, uniform similarity placements only,
persistent `Puppet` instance across frames, `set_view(..., allow_cut=True)`
only at real cuts, `head_angle_deg` within ±20° and 7°/frame, neck mount
overlap checked on every expression, and captions added by the production
caption stage, never by painting over `result.beauty`.
