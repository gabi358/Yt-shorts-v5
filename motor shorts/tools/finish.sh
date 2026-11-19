#!/usr/bin/env bash
# Encode frames + mix -> mp4, then QA.   bash finish.sh "Title Of Short"
# Env: CAPTIONS=1 burn word-by-word captions (needs captions.ass from captions.py) | SMALL=1 also write a <30 MB copy
set -e; T="${1:-short}"; F="out/${T// /-}.mp4"; mkdir -p out
ffmpeg -v error -y -i mix_raw.wav -af "loudnorm=I=-14:TP=-1.5:LRA=7" -ar 48000 -ac 2 mix.wav
# filter chain: draft frames (540x960) are upscaled to 1080x1920, then captions
W0=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 frames/f0000.jpg 2>/dev/null || echo 1080)
FILT=""
[ "$W0" -lt 1080 ] && FILT="scale=1080:1920:flags=lanczos"
if [ "${CAPTIONS:-0}" = 1 ] && [ -f captions.ass ]; then FILT="${FILT:+$FILT,}ass=captions.ass"; fi
VF=(); [ -n "$FILT" ] && VF=(-vf "$FILT")
ffmpeg -v error -y -framerate 30 -i frames/f%04d.jpg -i mix.wav "${VF[@]}" -map 0:v:0 -map 1:a:0 -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$F"
ffprobe -v error -show_entries format=duration -show_entries stream=width,height,r_frame_rate -of compact "$F"
echo "--- QA (empty = no black/frozen spans)"; ffmpeg -i "$F" -vf "freezedetect=n=0.0005:d=0.4,blackdetect=d=0.05" -an -f null - 2>&1 | grep -E "freeze_start|black_start" || true
ffmpeg -i "$F" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1
ffmpeg -v error -y -i "$F" -vf "fps=2,scale=180:-1,tile=10x4" -frames:v 1 out/qa_sheet.jpg; echo "$F"
# Upload limit helper
[ "${SMALL:-0}" = 1 ] && ffmpeg -v error -y -i "$F" -c:v libx264 -crf 21 -preset veryfast -c:a copy -movflags +faststart "${F%.mp4}-small.mp4" && echo "small copy: ${F%.mp4}-small.mp4"
exit 0
