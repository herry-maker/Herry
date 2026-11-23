# B6 runtime: install, project layout and commands

Condensed from `references/b6-installed-production.md`, `b6-code-runtime.md`,
`b6-fast-iteration.md`, `b6-motion-review.md` and `autopilot-runtime.md` in
kaomei/stickman-video-director (MIT). Command names and flags are copied
verbatim from `scripts/autopilot.mjs`; verify against the installed copy,
because upstream changes often.

## Install the upstream skill (one time)

B6 is rendered by code shipped inside the upstream skill folder
`skills/directing-stickman-videos`. Nothing in this skill renders video.

```bash
# Sparse clone: only the skill folder (still ~500 MB because of bundled reference media and the audio library)
git clone --depth 1 --filter=blob:none --sparse https://github.com/kaomei/stickman-video-director.git stickman-video-director
git -C stickman-video-director sparse-checkout set skills/directing-stickman-videos
cd stickman-video-director/skills/directing-stickman-videos
npm ci                                   # @napi-rs/canvas, sharp; Node >= 20
node scripts/autopilot.mjs doctor --style B6
```

Host requirements the doctor checks: Node 20+, FFmpeg/FFprobe, Python 3.9+
with NumPy, Pillow, OpenCV. For Python packages use a project virtualenv and
the bundled `assets/b6/hong-kong-v90/requirements.txt`; select that
interpreter with `B6_PYTHON=/path/to/python` or `--python`. `doctor` checks
local dependencies only, not TTS/image-provider access.

Install the skill where the agent runtime reads skills (Claude Code:
`~/.claude/skills/` or a project `.claude/skills/`). Keep production
projects and their outputs OUTSIDE the installed skill directory; `init`
refuses paths inside it.

## Read-only route query

```bash
node scripts/autopilot.mjs workflow --style B6 --ratio 9:16 [--project /abs/project]
```

Returns absolute paths and argument arrays for production standards,
acceptance standards and the review-template workflow. Run it before
production and copy its arguments rather than retyping flags.

## Initialize a production project

```bash
node scripts/autopilot.mjs init /abs/new-story --style B6 --ratio 9:16     # or 16:9 or both
```

Default init (no `--example`) creates a `b6-production-v1` project with:

| File | Role |
|---|---|
| `project.json` | `style: B6`, `stage: scaffold` (set to `authored` when done), `duration`, `fps`, `voice.path`/`sha256`, `formats`, `inputs`, `quality_target`, `purpose: production` |
| `story.json` | `narration` text and beats |
| `captions.json` | semantic cues aligned to the actual voice recording |
| `scene.py` | exports `frame(t, context)` (native) and `draft_frame(t, context)` (draft); returns `context.puppet_runtime.RenderResult` |
| `formats/portrait.json`, `formats/landscape.json` | one native plan per ratio: width/height, `caption` profile, continuous `shots[]` with `composition`, `action`, `camera`, `transition`, `cast_inventory: [{id, role, shot_ids}]` |
| `characters.json` + `characters/<id>/<view>/` | cast → per-view `b6-puppet/1` packages (`binding_version: 2`) |
| `quality-target.json` | copy of `assets/b6/style-standard.json` plus the project-local Sample 1 reference movie (compare-only) |
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

`run.py` in the project accepts the same subcommands as `autopilot.mjs`
and works without the installed skill folder. `--trusted-code` means the
authored `scene.py` executes as local Python; read it first. Scene code
must not spawn processes or decode media itself: prepare story media as
project-local PNGs listed in `project.inputs`.

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
