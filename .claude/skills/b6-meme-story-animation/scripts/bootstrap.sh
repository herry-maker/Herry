#!/usr/bin/env bash
# Install or check the upstream B6 (Meme Story Animation) runtime from
# kaomei/stickman-video-director without pulling the whole 500 MB skill.
#
#   bash scripts/bootstrap.sh install [--dir DIR] [--with-audio-library] [--update] [--ref REF]
#   bash scripts/bootstrap.sh check   [--dir DIR]
#
# DIR defaults to $B6_UPSTREAM_DIR or ~/.cache/stickman-video-director.
# install: sparse-clone only scripts/, references/, assets/b6, assets/fonts
#          (+ assets/b-audio-library with --with-audio-library, recommended for
#          production because B6 films carry SFX and licensed music by default), run npm ci,
#          build a Python venv with NumPy/Pillow/OpenCV, run `doctor --style B6`,
#          write DIR/b6-bootstrap.json. Never touches an existing clone unless --update.
# check:   report what is present/missing; installs nothing; exit 1 if anything is missing.
set -u

UPSTREAM_URL="https://github.com/kaomei/stickman-video-director.git"
SKILL_SUBDIR="skills/directing-stickman-videos"
MODE="${1:-}"; shift || true
DIR="${B6_UPSTREAM_DIR:-$HOME/.cache/stickman-video-director}"
WITH_AUDIO=0; UPDATE=0; REF="main"
while [ $# -gt 0 ]; do
  case "$1" in
    --dir) DIR="$2"; shift 2;;
    --with-audio-library) WITH_AUDIO=1; shift;;
    --update) UPDATE=1; shift;;
    --ref) REF="$2"; shift 2;;
    -h|--help) sed -n '2,15p' "$0"; exit 0;;
    *) echo "unknown argument: $1" >&2; exit 2;;
  esac
done
case "$MODE" in install|check) ;; *) echo "usage: bootstrap.sh install|check [options]  (see --help)" >&2; exit 2;; esac

SKILL_DIR="$DIR/$SKILL_SUBDIR"
VENV="$DIR/.venv-b6"
PY="$VENV/bin/python"
MISSING=()
ok()   { printf '  [ok]      %s\n' "$1"; }
miss() { printf '  [MISSING] %s\n' "$1"; MISSING+=("$1"); }

ver_ge() { # ver_ge "22.1.0" "20"  -> true if $1 >= $2 (major[.minor])
  local a="${1#v}" b="$2"; [ "$(printf '%s\n%s\n' "$b" "$a" | sort -V | head -n1)" = "$b" ]; }

echo "== Host prerequisites =="
command -v git >/dev/null 2>&1 && ok "git $(git --version | awk '{print $3}')" || miss "git"
if command -v node >/dev/null 2>&1; then
  NV="$(node --version)"; ver_ge "$NV" "20" && ok "node $NV (>=20 required)" || miss "node >= 20 (found $NV)"
else miss "node >= 20"; fi
command -v npm >/dev/null 2>&1 && ok "npm $(npm --version)" || miss "npm"
if command -v python3 >/dev/null 2>&1; then
  PV="$(python3 -c 'import sys;print("%d.%d"%sys.version_info[:2])')"; ver_ge "$PV" "3.9" && ok "python3 $PV (>=3.9 required)" || miss "python3 >= 3.9 (found $PV)"
  python3 -c 'import venv' 2>/dev/null && ok "python3 venv module" || miss "python3 venv module (apt install python3-venv)"
else miss "python3 >= 3.9"; fi
command -v ffmpeg  >/dev/null 2>&1 && ok "ffmpeg"  || miss "ffmpeg  (apt install ffmpeg / brew install ffmpeg)"
command -v ffprobe >/dev/null 2>&1 && ok "ffprobe" || miss "ffprobe (ships with ffmpeg)"

if [ "$MODE" = "check" ]; then
  echo "== Upstream install at $DIR =="
  if [ -d "$SKILL_DIR/scripts" ] && [ -f "$SKILL_DIR/package.json" ]; then
    ok "upstream skill files ($(git -C "$DIR" rev-parse --short HEAD 2>/dev/null || echo 'unknown commit'))"
    [ -d "$SKILL_DIR/node_modules/sharp" ] && [ -d "$SKILL_DIR/node_modules/@napi-rs/canvas" ] && ok "npm dependencies (sharp, @napi-rs/canvas)" || miss "npm dependencies: run bootstrap.sh install"
    [ -d "$SKILL_DIR/assets/b6/reference" ] && ok "assets/b6 (reference media, engine, fonts)" || miss "assets/b6"
    [ -d "$SKILL_DIR/assets/b-audio-library/audio" ] && ok "assets/b-audio-library (default SFX/music source)" || echo "  [absent]  assets/b-audio-library: B6 films need SFX and licensed music by default; run  bootstrap.sh install --with-audio-library  or source licensed audio externally with evidence"
    if [ -x "$PY" ] && "$PY" -c 'import sys,numpy,PIL,cv2; assert sys.version_info>=(3,9)' 2>/dev/null; then ok "python venv $VENV with numpy/Pillow/OpenCV"; else miss "python venv with numpy/Pillow/OpenCV: run bootstrap.sh install"; fi
    if [ ${#MISSING[@]} -eq 0 ]; then
      echo "== node scripts/autopilot.mjs doctor --style B6 =="
      (cd "$SKILL_DIR" && B6_PYTHON="$PY" node scripts/autopilot.mjs doctor --style B6) || miss "doctor --style B6 reported a failing check (see JSON above)"
    fi
  else
    miss "upstream skill not installed at $DIR: run  bash scripts/bootstrap.sh install"
  fi
  echo
  if [ ${#MISSING[@]} -eq 0 ]; then
    echo "READY. Use:  export B6_PYTHON=$PY ; cd $SKILL_DIR"
    exit 0
  fi
  echo "NOT READY. Missing:"; printf '  - %s\n' "${MISSING[@]}"; exit 1
fi

# ---------------- install ----------------
if [ ${#MISSING[@]} -gt 0 ]; then
  echo; echo "Install the missing host prerequisites first:"; printf '  - %s\n' "${MISSING[@]}"; exit 1
fi
set -e
SPARSE=("$SKILL_SUBDIR/scripts" "$SKILL_SUBDIR/references" "$SKILL_SUBDIR/assets/b6" "$SKILL_SUBDIR/assets/fonts")
[ "$WITH_AUDIO" = 1 ] && SPARSE+=("$SKILL_SUBDIR/assets/b-audio-library")

echo "== Upstream checkout at $DIR =="
if [ -d "$DIR/.git" ]; then
  if [ "$UPDATE" = 1 ]; then
    echo "  updating existing clone to origin/$REF"
    git -C "$DIR" fetch --depth 1 origin "$REF"
    git -C "$DIR" checkout -q --detach FETCH_HEAD
  else
    echo "  existing clone kept at $(git -C "$DIR" rev-parse --short HEAD) (use --update to move to origin/$REF)"
  fi
  git -C "$DIR" sparse-checkout set "${SPARSE[@]}"
else
  mkdir -p "$(dirname "$DIR")"
  git clone --depth 1 --filter=blob:none --sparse --branch "$REF" "$UPSTREAM_URL" "$DIR"
  git -C "$DIR" sparse-checkout set "${SPARSE[@]}"
fi
COMMIT="$(git -C "$DIR" rev-parse HEAD)"
echo "  upstream commit $COMMIT"
echo "  checkout size: $(du -sh "$DIR" | cut -f1)"

echo "== npm ci in $SKILL_DIR =="
(cd "$SKILL_DIR" && npm ci --no-audit --no-fund --loglevel=error)

echo "== Python venv $VENV =="
[ -x "$PY" ] || python3 -m venv "$VENV"
"$PY" -m pip install --quiet --upgrade pip
REQ="$SKILL_DIR/assets/b6/hong-kong-v90/requirements.txt"
PIN_STATUS="pinned"
if ! "$PY" -m pip install --quiet -r "$REQ" 2>/tmp/b6-pip-pinned.log; then
  echo "  pinned requirements failed for this Python (see /tmp/b6-pip-pinned.log); installing current numpy/Pillow/opencv-python-headless instead"
  "$PY" -m pip install --quiet numpy Pillow opencv-python-headless
  PIN_STATUS="unpinned-fallback"
fi
"$PY" -c 'import sys,numpy,PIL,cv2; print("  python", sys.version.split()[0], "numpy", numpy.__version__, "Pillow", PIL.__version__, "cv2", cv2.__version__)'

echo "== node scripts/autopilot.mjs doctor --style B6 =="
set +e
DOCTOR_JSON="$(cd "$SKILL_DIR" && B6_PYTHON="$PY" node scripts/autopilot.mjs doctor --style B6 2>&1)"; DOCTOR_RC=$?
set -e
echo "$DOCTOR_JSON"

cat > "$DIR/b6-bootstrap.json" <<JSON
{
  "installed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "upstream_url": "$UPSTREAM_URL",
  "upstream_ref": "$REF",
  "upstream_commit": "$COMMIT",
  "skill_dir": "$SKILL_DIR",
  "python": "$PY",
  "python_requirements": "$PIN_STATUS",
  "audio_library": $([ "$WITH_AUDIO" = 1 ] && echo true || echo false),
  "doctor_exit_code": $DOCTOR_RC
}
JSON
echo "  wrote $DIR/b6-bootstrap.json"
echo
if [ "$DOCTOR_RC" -eq 0 ]; then
  echo "READY. Before production:"
else
  echo "Doctor reported a failing check (exit $DOCTOR_RC). Fix it, then re-run:  bash scripts/bootstrap.sh check"
fi
echo "  export B6_PYTHON=$PY"
echo "  cd $SKILL_DIR"
echo "  node scripts/autopilot.mjs workflow --style B6 --ratio 9:16"
echo "Not checked here (scripts cannot see them): the ElevenLabs/image connectors in the agent's tool list, provider credits, and the 'gemini_key_present' field above, which only matters for upstream's optional Gemini route."
exit "$DOCTOR_RC"
