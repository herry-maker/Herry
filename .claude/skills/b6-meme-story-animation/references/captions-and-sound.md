# B6 captions, voice, sound and music defaults

Condensed from `references/b6-sample-1-acceptance.md`, `b6-dynamic-meme.md`,
`autopilot-production-qa.md`, `autopilot-sound-system.md`,
`music-sourcing-and-license.md` and `b-delivery-completeness.md` in
kaomei/stickman-video-director (MIT).

## Voice

- Default narration: English, **ElevenLabs "The Pharaoh 3 - Energetic, Lively & Cheerful"**. Verify the exact `voice_id` in the authenticated account before synthesis; the scaffold leaves `voice_id` unset on purpose. Never invent an ID.
- Native named-voice settings with empty extra style direction. No "acting" descriptions for the narrator.
- One accepted track, exact words, SHA-256 pinned in `project.json`; original speed (rate 1.0). A visual revision never recasts, re-times or time-stretches accepted narration. No paid re-auditions for a picture change.
- The B6 encoder muxes ONE prepared, full-length, mixed audio track. It is not a Foley generator or mixer; mix voice + SFX + music before encoding (FFmpeg is already a host requirement; duck music under speech instead of speeding speech). Do not duplicate effects already in the master.
- Synthesis route: whatever authenticated ElevenLabs access the host offers (connector or API). The skill ships no TTS command.

## Portrait caption profile (`eiffel-v44-portrait-archivo-black-v1`, 720 × 1280)

| Property | Value | Verify by |
|---|---|---|
| Font | **Archivo Black** (`fonts/ArchivoBlack.ttf`, bundled), 47 px, one fixed size for the whole version | font identity in `caption_contract`; native-size decoded glyph crop |
| Fill / outline | `#ffffff` fill, 4 px `#171319` outline | renderer config and decoded edge crop |
| Position | horizontally centered, **baseline y = 914** (`ms` anchor), caption layer band y = 864…951 | decoded frame; the glyph center sits near 70 % of height, NOT a bottom-center anchor at y = 1100 |
| Side allowance | 44 px each side | measure whole outlined cue; re-break semantically if it overflows |
| Raster | render at 3×, Lanczos downsample | renderer identity; edge crop |
| Switching | immediate semantic-phrase replacement; no pop, bounce, auto-shrink, shadow, or accidental blank frame between continuous cues | consecutive decoded frames at each cue change |
| Lines | max **one** visible line | every cue |

Scale geometry, type and stroke uniformly with native resolution. A 42 px bottom-anchored cue at y = 1100 is a FAILED match even when synced and readable. Intentional caption gaps during real speech pauses are fine. Archivo Black replaces Sample 1's historical Arial Black by explicit user approval; that difference is not a defect and Arial is not needed.

**16:9 is separate.** `b6-landscape-native-archivo-black-v1` is a starting layout proposal, not approved V44 geometry: record `native_layout_reason`, stage faces/hands/props around the band, and review that native movie. Never apply y = 914 to a 720-high frame or center-crop a portrait film.

Any other language or user-requested design needs a separately named, implemented profile with verified glyph coverage and runtime validation BEFORE use. Writing down a reason does not pass the gate.

## Semantic captions

- Every spoken word, in order, aligned to the ACTUAL recording; breaks at meaning and real pauses. Keep names, noun/verb phrases, modifiers, phrasal verbs, numbers+units together.
- No splitting to hit a cue count. Sample 1's 73 cues / ~0.65 s mean duration describe that recording; they are not quotas.
- Automatic grouping is a draft, not acceptance: listen across every cue boundary.
- Burned-in captions and SRT/VTT sidecars come from the same cues.

## Sound (required for every preview and film)

Act as sound director. Save a scene/beat sound script covering the exact text from opening to ending: per-scene bed, action material/distance/sync, emotional job, cue priority, quiet moments and payoff hierarchy, rights manifest. Sound must communicate place, contact, information or emotion, not decorate every cut. First search the bundled B audio library (`assets/b-audio-library`: ~774 SFX/transitions, 31 CC BY 4.0 music tracks, 85 stingers) with `node scripts/audio-library.mjs recommend --style B6 --beat <beat>` / `search` / `export --ids … --out …`; export writes the evidence and `CREDITS.md` into the project. B6 direction: playful scheming music, brisk prop/money/street/reaction sounds, no whoosh on every camera move. External assets need track-specific license evidence (sync, edit, platform, commercial use, attribution). Never reuse another creator's mixed soundtrack. Listen to the encoded mix: intelligible speech, no masking, no clipping, no copy-pasted cue fatigue; mark unavailable listening as pending, never as passed.

## Background music

Included by default under the B delivery-completeness gate: choose a track matching B6's playful reference mood and voice space, verify license, record credits and the edit/sync notice in the project. Motivated short silence is allowed with a documented reason; it does not waive music for the whole film. Only an explicit user omission removes music.
