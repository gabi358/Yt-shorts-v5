#!/usr/bin/env python3
"""mix.py voice music.wav sfx.wav [--music-db -9.5] [--sfx-db -6] -> mix_raw.wav
Levels are measured against the voice's gated RMS. One linear gain per stem, no ducking, SFX peaks capped at 0.7x the voice peak.
  --music-db  music level vs voice (default -9.5 = quieter than the old -6 dB)
  --sfx-db    SFX level vs voice (default -6)
finish.sh then normalizes the whole mix to about -14 LUFS."""
import sys, subprocess, wave, numpy as np

SR = 48000
args = sys.argv[1:]

def opt(name, default):
    if name in args:
        i = args.index(name); v = float(args[i + 1]); del args[i:i + 2]; return v
    return default

music_db = opt("--music-db", -9.5)
sfx_db = opt("--sfx-db", -6.0)
if len(args) < 3:
    sys.exit(__doc__)

def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()

def grms(x, thr=-45.0, blk=int(0.4 * SR)):
    e = np.array([np.mean(x[i:i + blk] ** 2) for i in range(0, max(1, len(x) - blk), blk // 2)])
    sel = e[10 * np.log10(e + 1e-12) > thr]
    return np.sqrt(sel.mean()) if len(sel) else 1e-6

v, m, s = load(args[0]), load(args[1]), load(args[2])
n = max(len(v), len(m), len(s))
pad = lambda x: np.pad(x, (0, n - len(x)))[:n]
v, m, s = pad(v), pad(m), pad(s)
rv = grms(v)
m = m * (rv * 10 ** (music_db / 20) / grms(m))
s = s * (rv * 10 ** (sfx_db / 20) / grms(s))
cap = 0.7 * np.abs(v).max()
if np.abs(s).max() > cap:
    s = s * cap / np.abs(s).max()
mix = v + m + s
pk = np.abs(mix).max()
if pk > 0.95:
    mix *= 0.95 / pk
db = lambda x: 20 * np.log10(grms(x) / rv)
print("voice gated RMS %.1f dBFS | music %.1f dB vs voice | sfx %.1f dB vs voice (peak cap)" % (20 * np.log10(rv), db(m), db(s)))
with wave.open("mix_raw.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
