#!/usr/bin/env bash
# Regenerates the two placeholder audio files (not committed: ~33 MB of PCM).
#  - placeholder-silent-180s.wav : silent stand-in for the narration (replace with the real recording)
#  - room-tone-180s.wav          : quiet procedural room tone used as the B1 ambience bed
set -euo pipefail
cd "$(dirname "$0")/../audio"
ffmpeg -loglevel error -y -f lavfi -i anullsrc=r=48000:cl=mono -t 180 -c:a pcm_s16le placeholder-silent-180s.wav
ffmpeg -loglevel error -y -f lavfi -i "anoisesrc=color=brown:amplitude=0.08:seed=42:r=48000:d=180" -af "lowpass=f=900,highpass=f=60,volume=0.6" -c:a pcm_s16le room-tone-180s.wav
ls -la
