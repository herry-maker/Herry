#!/bin/sh
# One command: «Sidang Kecil Sebelum Sidang» (Cerita 3), Stick-figure Explainer, 60 fps.
#   sh build.sh            timeline from the voice durations, events, picture, score + foley + voice mix, subtitles, master, poster
# The voice files (voice/*.wav) were generated once with ElevenLabs (see CREDITS); they are kept in the folder.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-/root/lemo-opuscar}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=sidang-kecil
WORKERS=${WORKERS:-3}
FPS=60

# ffmpeg 7+ (mux.sh needs it): the imageio-ffmpeg build in .venv-tools, with the system ffprobe
if [ -d "$HERE/.venv-tools" ]; then
  mkdir -p "$HERE/out/bin"
  FFB=$("$HERE/.venv-tools/bin/python" -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
  ln -sf "$FFB" "$HERE/out/bin/ffmpeg"; ln -sf "$(command -v ffprobe)" "$HERE/out/bin/ffprobe"
  export PATH="$HERE/out/bin:$PATH"
fi

cd "$LIB"
python3 "$HERE/tools/timeline.py"
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps $FPS --workers "$WORKERS" --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
python3 "$HERE/tools/srt.py"
"$PY" core/render/srt.py "$HERE/out/cues.json" "$HERE/subtitles_id.srt"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/$NAME.mp4" $FPS 0      # −14 LUFS, no grain: the paper stays clean
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok"
ffmpeg -v error -y -ss 50.6 -i "$HERE/$NAME.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
echo "done: $HERE/$NAME.mp4"
