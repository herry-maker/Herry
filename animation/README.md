# Animation toolkits

Two cartoon-animation toolkits were added on 2026-11-23 for making short animated films from this repo.

## 1. ClaudeAnimationBase (painterly, hand-painted cartoons)

Source: https://github.com/JohnHeibel/ClaudeAnimationBase (MIT). Vendored in `animation/ClaudeAnimationBase/`.
Every frame is painted with p5.js + p5.brush in headless Chromium; the character "Clawd" comes with
views, emotions, hats and dances. Needs Node 22+, ffmpeg and Chrome/Chromium.

```bash
cd animation/ClaudeAnimationBase
npm install --ignore-scripts
# contact sheet of the demo at t = 0..5 s (verified working in the cloud container, ~10 s/frame in software GL)
CHROME_PATH=/opt/pw-browsers/chromium node render.mjs --sheet=0,1,2,3,4,5 --out=out/sheet.jpg --soft-gl
# full MP4 of the demo
CHROME_PATH=/opt/pw-browsers/chromium node render.mjs --clip --out=out/video.mp4 --soft-gl
```

On a machine with a GPU drop `--soft-gl`; on a headless NVIDIA box use `--gpu-angle=gl-egl`.
Watercolour fills are the slow part. Ask the agent to avoid them when rendering without a GPU.

To make a film, open this folder in Claude Code and say, for example:
"Read ANIMATION_GUIDE.md, then make a 15-second video of Clawd trying to catch a butterfly."

## 2. directing-stickman-videos (script-driven stickman explainers)

Source: https://github.com/kaomei/stickman-video-director. Installed as an agent skill at
`.agents/skills/directing-stickman-videos` (symlinked from `.claude/skills/`), recorded in `skills-lock.json`.
The skill directory is git-ignored because it bundles about 500 MB of reference audio and video.
Reinstall in a fresh checkout with:

```bash
npx skills add kaomei/stickman-video-director -y
```

Mode A (Model Engine) produces storyboards and prompts for a video model; Mode B (Code Engine)
renders narrated, captioned videos locally and needs a text-to-speech provider to be configured.
