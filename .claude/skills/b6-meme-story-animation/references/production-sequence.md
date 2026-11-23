# B6 production sequence (what the agent produces, in order)

Condensed from `references/b6-dynamic-meme.md`, `b6-installed-production.md`,
`b6-native-formats.md`, `b6-character-binding.md` and `b6-fast-iteration.md`
in kaomei/stickman-video-director (MIT). The user supplies topic/story,
duration and ratio; the agent does everything below. Initialization,
copied assets, a gallery or a re-encode of a sample is never the deliverable.

## 0. Recover and lock
Read the existing checkpoint, actual media and last user instruction. Resolve story, audience, ratio(s), duration, language and approved text; reuse known choices, ask once only for a decision that changes production. If an era/place is specified, write the look brief (see art-direction.md). Run `node scripts/autopilot.mjs workflow --style B6 --ratio <r>` and `doctor --style B6`; repair the environment yourself (npm ci, venv, FFmpeg) instead of sending the user away. Watch Sample 1 portrait V44 with sound and note the ranges you will compare against (opening transaction 0–2.8 s, entry/staging/light 5.35–9 s, independent carriage travel 41.08–43.04 s, plus any range relevant to this story).

## 1. Story → beats
Each beat: cause → action/information → reaction/payoff. Mark contact, emotion, evidence and scene geography. Pick each shot's information carrier (place, landmark/prop, crowd, relationship, action, reaction); the protagonist need not appear in every shot or the first frame. Give every shot a reason (environment/ensemble, setup, contact, detail, reaction). Avoid repeated push-ins and unexplained sub-second inserts.

## 2. Native plan per requested ratio
Author `formats/portrait.json` and/or `formats/landscape.json` separately: shot IDs, actual audio in/out, composition, actor/prop world positions, view/expression states, foreground/occlusion order, camera intent/keys/easing, focus/eyeline, contact timestamps, transition, caption band, `cast_inventory`. Portrait: stacked/deep space, faces in the upper field, depth/vertical reveals, wrists/prop in a dedicated middle zone, captions at the band. Landscape: left/center/right landmarks, lateral tracks and reveals. Shared beats, stills and voice are reusable; coordinates and finished video are not. "Both" means two independently directed versions, one voice.

## 3. Build the art before animation
Approve a whole-character sheet and face/body crops against the drawing grammar (and the period-read review if an era is set). Produce story-specific front, three-quarter, profile and back views plus the needed expression states (neutral, suspicious, greedy, excited, shocked, disappointed, recovery…) as separate RGBA layers, with the same ink and light. Record paths/hashes. Reference layers from `assets/b6` may inform prompts, never enter the film.

## 4. Build a large world
A continuous wide set with recognizable left/center/right (or near/middle/far) regions, enough height and overscan for the most extreme frustum, established ground/horizon/scale, front/middle/back layers, purposeful dressing, period landmarks along the camera route, and separate layers for anything that must move (pedestrians, vehicles, steam). A narrow static plate cannot gain depth from zoom or shake.

## 5. Bind and test action locally
Reuse a compatible user-approved identity/action first. Otherwise fit each identity/view on its own art: sleeve outlets, shoulder/hip/sole pins, fixed bone lengths, neck mount, cuff mattes, five FK poses (`rest`, `reach`, `offer`, `receive`, `retract`), near/far order, occluders. Register everything in `characters.json`, including static background people. Run `preflight`. Block rest → preparation → approach → contact → short hold → release → recovery at a fixed camera (2–3 s turn/contact test), inspect decoded frames, then add the intended camera. Unreachable target ⇒ restage, never stretch or widen limits.

## 6. Direct the camera in space
Motivated lateral tracks/reveals, foreground crossings, depth dollies, reaction cuts, object follow and readable settles via `b6_space`/`CameraTravel`. Actor and background paths are independent of the camera; walkers' stance and wheels follow world distance. Environment may stretch through projection; faces/bodies and the final canvas never do. Brief shake/overshoot only for an earned accent.

## 7. Voice, captions, sound
Synthesize or reuse the approved narration (default ElevenLabs The Pharaoh 3, see captions-and-sound.md); pin path, SHA-256 and actual duration; original speed. Write semantic single-line cues per format aligned to the actual recording. Write the scene/beat sound script, pull SFX and a licensed music track (bundled library first), mix ONE full-length master. Set `stage: authored`, `duration`, `voice`, `inputs`, `quality_target`.

## 8. Draft, then representative native preview
Implement `draft_frame` and run `draft --draft-scale 0.5` (full timeline, 30 fps, original-speed audio) to catch action, staging, attention and camera-landing mistakes cheaply. Then `validate` and `preview` a 5–20 s range containing the riskiest contact, emotional reaction and wide-world camera/layer relationship. Build `review-pack`, inspect actual-size crops, consecutive frames at contacts/cuts/expression changes and full-range playback with sound; complete all 35 subchecks (acceptance-matrix.md); `check-review`. Repair gaps (`plan-iteration` scopes the re-render) and loop until no known gap remains. Then present the preview, its review state and the folder link to the user.

## 9. Approve, render, final review, deliver
Record the user's actual decision with `approve --report … --review … --note`, then `render`. Build a fresh `review-pack` from the film's `report.json`, inspect every shot including middle and ending (preview approval covers only the preview range), `check-review`. Deliver MP4, SRT/VTT, project/checkpoint, hash manifest, native plans, review and user-acceptance state, and a clickable containing-folder link. Save checkpoints at art, rig test, native preview and delivery stages (constraints, absolute output paths, hashes, tested scope, pending review, next action). Publication, uploads, commits and new paid calls are separate user instructions.
