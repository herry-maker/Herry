#!/usr/bin/env bash
# check.sh — report the stickman-video-director setup without installing anything.
#
#   scripts/check.sh [--dir DIR] [--project PROJECT_DIR]
#
# Prints host tools, upstream checkout state, venv state and the doctor result, and ends
# with exactly one line that starts with READY or NOT READY. Exit code 0 only when READY.
# --project also checks a project's narration file and its pinned SHA-256 (audio/narasi.sha256).
set -uo pipefail

DIR="${B6_UPSTREAM_DIR:-$HOME/.cache/stickman-video-director}"
PROJECT=""
while [ $# -gt 0 ]; do
  case "$1" in
    --dir) DIR="$2"; shift 2 ;; --dir=*) DIR="${1#--dir=}"; shift ;;
    --project) PROJECT="$2"; shift 2 ;; --project=*) PROJECT="${1#--project=}"; shift ;;
    -h|--help) sed -n '2,9p' "$0"; exit 0 ;;
    *) echo "unknown flag: $1" >&2; exit 2 ;;
  esac
done
SKILL="$DIR/skills/directing-stickman-videos"
FAIL=0
ok()   { printf '  ok    %s\n' "$*"; }
bad()  { printf '  FAIL  %s\n' "$*"; FAIL=1; }
warn() { printf '  warn  %s\n' "$*"; }

echo "== host tools"
for t in git node npm ffmpeg ffprobe python3; do
  if command -v "$t" >/dev/null 2>&1; then ok "$t $($t --version 2>&1 | head -1 | cut -c1-60)"; else bad "$t not found"; fi
done
if command -v node >/dev/null 2>&1; then
  [ "$(node -p 'Number(process.versions.node.split(".")[0])')" -ge 20 ] && ok "node major >= 20" || bad "node 20+ required"
fi

echo "== upstream ($DIR)"
if [ -d "$DIR/.git" ]; then
  ok "git checkout, commit $(git -C "$DIR" rev-parse --short HEAD 2>/dev/null)"
  if [ -f "$DIR/b6-bootstrap.json" ]; then
    REC="$(node -p "JSON.parse(require('fs').readFileSync('$DIR/b6-bootstrap.json','utf8')).upstream_commit" 2>/dev/null)"
    [ "$REC" = "$(git -C "$DIR" rev-parse HEAD)" ] && ok "b6-bootstrap.json matches checkout ($(date -r "$DIR/b6-bootstrap.json" +%F 2>/dev/null))" || warn "b6-bootstrap.json records a different commit; run bootstrap.sh update"
  else warn "no b6-bootstrap.json (bootstrap.sh never completed here)"; fi
else bad "no upstream checkout; run scripts/bootstrap.sh install"; fi
for f in SKILL.md scripts/autopilot.mjs scripts/b6-dynamic-meme.mjs package-lock.json assets/fonts/Caveat.ttf assets/fonts/NotoSans.ttf assets/fonts/ArchivoBlack.ttf assets/b6/manifest.json assets/b6/hong-kong-v90/requirements.txt; do
  [ -f "$SKILL/$f" ] && ok "$f" || bad "$f missing"
done
[ -d "$SKILL/node_modules/@napi-rs/canvas" ] && [ -d "$SKILL/node_modules/sharp" ] && ok "node_modules (canvas, sharp)" || bad "node_modules missing; bootstrap runs npm ci"
[ -d "$SKILL/assets/b-audio-library" ] && ok "audio library present" || warn "audio library not checked out (optional; --with-audio-library)"
for s in b1 b2 b3 b4 b5 b7; do [ -d "$SKILL/assets/$s" ] && ok "extra style pack assets/$s"; done

echo "== python venv ($DIR/.venv)"
PY="$DIR/.venv/bin/python"
if [ -x "$PY" ]; then
  if "$PY" -c 'import sys,numpy,PIL,cv2; assert sys.version_info>=(3,9)' >/dev/null 2>&1; then
    ok "$("$PY" -c 'import sys,numpy,PIL,cv2;print("python",sys.version.split()[0],"numpy",numpy.__version__,"Pillow",PIL.__version__,"cv2",cv2.__version__)') ($(cat "$DIR/.venv-pin-mode" 2>/dev/null || echo 'pin mode unknown'))"
  else bad "venv lacks numpy/Pillow/cv2"; fi
else bad "no venv"; fi

echo "== doctor --style B6 (read-only)"
if [ -f "$SKILL/scripts/autopilot.mjs" ] && [ -d "$SKILL/node_modules" ]; then
  OUT="$(cd "$SKILL" && B6_PYTHON="${PY}" node scripts/autopilot.mjs doctor --style B6 2>&1)"
  echo "$OUT" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);for(const [k,v] of Object.entries(j.checks))console.log((v?"  ok    ":"  FAIL  ")+k);if(Object.values(j.checks).some(v=>!v))process.exit(1)}catch{console.log("  FAIL  doctor did not return JSON:\n"+s);process.exit(1)}})' || FAIL=1
  echo "  note  gemini_key_present is reported by doctor but irrelevant here (narration/art go through connectors)"
else bad "doctor not runnable (missing scripts or node_modules)"; fi

if [ -n "$PROJECT" ]; then
  echo "== project ($PROJECT)"
  if [ -f "$PROJECT/project.json" ]; then
    VOICE="$(node -p "JSON.parse(require('fs').readFileSync('$PROJECT/project.json','utf8')).voice.path" 2>/dev/null)"
    if [ -f "$PROJECT/$VOICE" ]; then
      ok "narration file $VOICE ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$PROJECT/$VOICE" 2>/dev/null)s)"
      case "$VOICE" in *placeholder*) warn "narration is a placeholder, not a recording" ;; esac
      if [ -f "$PROJECT/audio/narasi.sha256" ]; then
        PIN="$(cut -d' ' -f1 "$PROJECT/audio/narasi.sha256")"; ACT="$(sha256sum "$PROJECT/$VOICE" | cut -d' ' -f1)"
        [ "$PIN" = "$ACT" ] && ok "narration SHA-256 matches audio/narasi.sha256" || bad "narration SHA-256 differs from audio/narasi.sha256 (accepted take replaced?)"
      else warn "no audio/narasi.sha256 pin yet (write it after the one accepted take)"; fi
    else bad "voice.path $VOICE not found"; fi
  else bad "no project.json"; fi
fi

echo "== not visible to this script"
echo "  - ElevenLabs connector: availability, chosen voice ID, remaining credits"
echo "  - Figma connector: availability of image generation"
echo "  - whether any paid generation already happened (check the project's pinned SHA instead)"
echo
if [ "$FAIL" -eq 0 ]; then echo "READY  stickman runtime at $SKILL"; exit 0; else echo "NOT READY  see FAIL lines above"; exit 1; fi
