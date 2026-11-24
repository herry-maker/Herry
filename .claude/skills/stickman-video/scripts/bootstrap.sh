#!/usr/bin/env bash
# bootstrap.sh — install or update a minimal upstream stickman-video-director runtime.
#
#   scripts/bootstrap.sh install [--dir DIR] [--ref REF] [--style B6|B1|...]... [--with-audio-library]
#   scripts/bootstrap.sh update  [same flags]        (alias: install --update)
#
# What it does, in order:
#   1. sparse-checkout of kaomei/stickman-video-director into ~/.cache/stickman-video-director
#      (or $B6_UPSTREAM_DIR, or --dir): the Skill's scripts, references, fonts and the B6 asset
#      pack only. Other style packs (b1..b7, a6..a8, 100+ MB each) are excluded unless named
#      with --style; the 250 MB audio library only with --with-audio-library.
#   2. npm ci inside the Skill (canvas + sharp).
#   3. a Python venv at <dir>/.venv from upstream's pins (numpy/Pillow/opencv), falling back
#      to current wheels when the pins have no wheel for the local Python.
#   4. node scripts/autopilot.mjs doctor --style B6, with the venv as B6_PYTHON.
#   5. writes <dir>/b6-bootstrap.json with the upstream commit, styles, pin mode and doctor output.
#
# It never calls a TTS or image service and never reads or writes credentials.
set -euo pipefail

UPSTREAM_URL="${B6_UPSTREAM_URL:-https://github.com/kaomei/stickman-video-director.git}"
DIR="${B6_UPSTREAM_DIR:-$HOME/.cache/stickman-video-director}"
REF=""
UPDATE=0
AUDIO_LIB=0
STYLES=()
SKILL_SUBDIR="skills/directing-stickman-videos"

usage() { sed -n '2,20p' "$0"; exit "${1:-0}"; }

cmd="${1:-}"; shift || true
case "$cmd" in
  install) ;;
  update) UPDATE=1 ;;
  -h|--help|help|"") usage 0 ;;
  *) echo "unknown command: $cmd" >&2; usage 2 ;;
esac
while [ $# -gt 0 ]; do
  case "$1" in
    --dir) DIR="$2"; shift 2 ;;
    --dir=*) DIR="${1#--dir=}"; shift ;;
    --ref) REF="$2"; shift 2 ;;
    --ref=*) REF="${1#--ref=}"; shift ;;
    --style) STYLES+=("$2"); shift 2 ;;
    --style=*) STYLES+=("${1#--style=}"); shift ;;
    --update) UPDATE=1; shift ;;
    --with-audio-library) AUDIO_LIB=1; shift ;;
    -h|--help) usage 0 ;;
    *) echo "unknown flag: $1" >&2; usage 2 ;;
  esac
done
[ ${#STYLES[@]} -eq 0 ] && STYLES=(B6)
case " ${STYLES[*]} " in *" B6 "*) ;; *) STYLES+=(B6) ;; esac   # doctor --style B6 needs the B6 pack

say() { printf '\n== %s\n' "$*"; }
need() { command -v "$1" >/dev/null 2>&1 || { echo "missing host tool: $1" >&2; exit 1; }; }

say "host tools"
for t in git node npm ffmpeg ffprobe python3; do need "$t"; printf '  %-8s %s\n' "$t" "$(command -v "$t")"; done
NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
[ "$NODE_MAJOR" -ge 20 ] || { echo "Node 20+ required, found $(node --version)" >&2; exit 1; }
git --version | awk '{ split($3,v,"."); if (v[1]<2 || (v[1]==2 && v[2]<25)) { print "git 2.25+ required for sparse-checkout"; exit 1 } }'

# ---- 1. sparse checkout -------------------------------------------------------------
PATTERNS=(
  "/${SKILL_SUBDIR}/"
  "!/${SKILL_SUBDIR}/assets/"
  "/${SKILL_SUBDIR}/assets/fonts/"
  "/${SKILL_SUBDIR}/assets/b6/"
)
for s in "${STYLES[@]}"; do
  s_lower="$(printf '%s' "$s" | tr '[:upper:]' '[:lower:]')"
  [ "$s_lower" = "b6" ] || PATTERNS+=("/${SKILL_SUBDIR}/assets/${s_lower}/")
done
[ "$AUDIO_LIB" -eq 1 ] && PATTERNS+=("/${SKILL_SUBDIR}/assets/b-audio-library/")

say "upstream checkout → $DIR"
if [ ! -d "$DIR/.git" ]; then
  mkdir -p "$(dirname "$DIR")"
  git clone --quiet --depth 1 --filter=blob:none --no-checkout "$UPSTREAM_URL" "$DIR"
  UPDATE=1
fi
git -C "$DIR" sparse-checkout init --no-cone >/dev/null
printf '%s\n' "${PATTERNS[@]}" | git -C "$DIR" sparse-checkout set --no-cone --stdin
if [ "$UPDATE" -eq 1 ]; then
  if [ -n "$REF" ]; then
    git -C "$DIR" fetch --quiet --depth 1 origin "$REF"
    git -C "$DIR" checkout --quiet --detach FETCH_HEAD
  else
    DEFAULT_BRANCH="$(git -C "$DIR" symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##' || true)"
    [ -n "$DEFAULT_BRANCH" ] || DEFAULT_BRANCH="$(git -C "$DIR" remote show origin 2>/dev/null | awk '/HEAD branch/ {print $NF}')"
    [ -n "$DEFAULT_BRANCH" ] || DEFAULT_BRANCH=main
    git -C "$DIR" fetch --quiet --depth 1 origin "$DEFAULT_BRANCH"
    git -C "$DIR" checkout --quiet --detach FETCH_HEAD
  fi
else
  git -C "$DIR" checkout --quiet  # re-applies the sparse patterns to the current commit
fi
COMMIT="$(git -C "$DIR" rev-parse HEAD)"
SKILL="$DIR/$SKILL_SUBDIR"
[ -f "$SKILL/SKILL.md" ] && [ -f "$SKILL/scripts/autopilot.mjs" ] || { echo "upstream layout changed: $SKILL/SKILL.md or scripts/autopilot.mjs missing" >&2; exit 1; }
printf '  commit %s\n  patterns:\n' "$COMMIT"; printf '    %s\n' "${PATTERNS[@]}"
printf '  checkout size %s\n' "$(du -sh "$SKILL" | cut -f1)"

# ---- 2. node dependencies -----------------------------------------------------------
say "npm ci ($SKILL)"
LOCK_SHA_FILE="$DIR/.npm-lock.sha256"
LOCK_SHA="$(sha256sum "$SKILL/package-lock.json" | cut -d' ' -f1)"
if [ -d "$SKILL/node_modules/@napi-rs/canvas" ] && [ -f "$LOCK_SHA_FILE" ] && [ "$(cat "$LOCK_SHA_FILE")" = "$LOCK_SHA" ]; then
  echo "  node_modules up to date (lockfile unchanged)"
else
  (cd "$SKILL" && npm ci --no-audit --no-fund --loglevel=error)
  printf '%s' "$LOCK_SHA" > "$LOCK_SHA_FILE"
fi

# ---- 3. python venv -----------------------------------------------------------------
say "python venv ($DIR/.venv)"
VENV="$DIR/.venv"
PINS="$SKILL/assets/b6/hong-kong-v90/requirements.txt"
[ -x "$VENV/bin/python" ] || python3 -m venv "$VENV"
PY="$VENV/bin/python"
"$PY" -m pip install --quiet --upgrade pip >/dev/null 2>&1 || true
PIN_MODE="pinned"
if "$PY" -c 'import numpy, PIL, cv2' >/dev/null 2>&1 && [ "$UPDATE" -eq 0 ]; then
  echo "  venv already has numpy/Pillow/cv2"
  PIN_MODE="$(cat "$DIR/.venv-pin-mode" 2>/dev/null || echo unknown)"
elif [ -f "$PINS" ] && "$PY" -m pip install --quiet -r "$PINS" 2>"$DIR/.venv-pip.log"; then
  echo "  installed upstream pins: $(tr '\n' ' ' < "$PINS")"
else
  echo "  upstream pins failed for $("$PY" --version) (see $DIR/.venv-pip.log); falling back to current wheels"
  "$PY" -m pip install --quiet numpy Pillow opencv-python-headless
  PIN_MODE="fallback-current-wheels"
fi
printf '%s' "$PIN_MODE" > "$DIR/.venv-pin-mode"
"$PY" -c 'import sys,numpy,PIL,cv2; print("  python", sys.version.split()[0], "numpy", numpy.__version__, "Pillow", PIL.__version__, "cv2", cv2.__version__)'

# ---- 4. doctor ----------------------------------------------------------------------
say "doctor --style B6"
DOCTOR_JSON="$(cd "$SKILL" && B6_PYTHON="$PY" node scripts/autopilot.mjs doctor --style B6 2>&1 || true)"
echo "$DOCTOR_JSON" | sed 's/^/  /'
DOCTOR_OK="$(printf '%s' "$DOCTOR_JSON" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);console.log(Object.values(j.checks).every(Boolean)?"true":"false")}catch{console.log("false")}})')"

# ---- 5. record ----------------------------------------------------------------------
say "record"
RECORD="$DIR/b6-bootstrap.json"
STYLES_JSON="$(printf '%s\n' "${STYLES[@]}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.stringify(s.trim().split("\n"))))')"
DOCTOR_ESCAPED="$(printf '%s' "$DOCTOR_JSON" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.stringify(JSON.parse(s)))}catch{console.log(JSON.stringify({raw:s}))}})')"
cat > "$RECORD" <<JSON
{
  "upstream_url": "$UPSTREAM_URL",
  "requested_ref": "${REF:-default-branch}",
  "upstream_commit": "$COMMIT",
  "skill_dir": "$SKILL",
  "installed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "styles": $STYLES_JSON,
  "audio_library": $([ "$AUDIO_LIB" -eq 1 ] && echo true || echo false),
  "node": "$(node --version)",
  "python": "$("$PY" -c 'import sys;print(sys.version.split()[0])')",
  "python_pins": "$PIN_MODE",
  "venv": "$VENV",
  "doctor_ok": $DOCTOR_OK,
  "doctor": $DOCTOR_ESCAPED,
  "not_checked_here": [
    "ElevenLabs connector availability and credits (narration, image generation)",
    "Figma connector availability (image generation)",
    "gemini_key_present in doctor output is irrelevant to these routes"
  ]
}
JSON
echo "  wrote $RECORD"
if [ "$DOCTOR_OK" = "true" ]; then echo; echo "READY  upstream $COMMIT at $SKILL"; else echo; echo "NOT READY  doctor reported a failing check (see above)"; exit 1; fi
