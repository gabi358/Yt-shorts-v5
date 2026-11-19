#!/usr/bin/env bash
# Parallel render: bash render_parallel.sh <total_frames> [workers=2]   (resumable: RESUME=1 skips existing frames)
N="${1:?total frames}"; W="${2:-2}"; mkdir -p frames; per=$(( (N + W - 1) / W ))
for i in $(seq 0 $((W-1))); do a=$((i*per)); b=$(( (i+1)*per - 1 )); [ $b -ge $N ] && b=$((N-1))
  RESUME=1 nohup node render.mjs frames "$a-$b" > "r$i.log" 2>&1 & done
echo "started $W workers; watch: ls frames | wc -l   (resume after an interruption: run the same command again)"
