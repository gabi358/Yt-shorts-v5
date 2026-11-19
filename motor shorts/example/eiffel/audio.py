"""Synthesized music bed + SFX stems for the Eiffel short (music.wav, sfx.wav). Mix them with mix.py."""
import numpy as np, subprocess, wave

SR = 48000
import os
TOTAL = int(os.environ.get("TOTAL", 1378))  # total frames at 30 fps
DUR = TOTAL / 30
N = int(DUR * SR)
rng = np.random.default_rng(7)
t_all = np.arange(N) / SR

def load_voice():
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "voice.mp3", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    v = np.frombuffer(raw, np.float32).copy()
    out = np.zeros(N, np.float32); out[:min(N, len(v))] = v[:N]; return out

def env(n, a=0.005, r=0.2, sus=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
    return e

def lp(x, k):  # one-pole low-pass, k in (0,1)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += k * (x[i] - acc); y[i] = acc
    return y

def lp_fast(x, cutoff):
    # FFT brick-ish low-pass (fast, fine for beds)
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)

def hp_fast(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 - 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)

def place(buf, sig, t0, gain=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if i < N and j > i: buf[i:j] += sig[: j - i] * gain

midi = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---------------- music: jaunty Paris musette waltz (3/4) ----------------
music = np.zeros(N, np.float32)
BPM = 150; beat = 60 / BPM
prog = [(57, [57, 60, 64]), (50, [50, 53, 57]), (52, [52, 56, 59]), (57, [57, 60, 64]), (53, [53, 57, 60]), (52, [52, 56, 59]), (57, [57, 60, 64]), (57, [57, 60, 64])]
def brass(fs, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs:
        ph = 2 * np.pi * f * t + 0.003 * np.sin(2 * np.pi * 5 * t)
        s += sum(np.sin((k + 1) * ph) / (k + 1) ** 1.3 for k in range(8))
    a = np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.15).clip(0)
    return lp_fast((s * a).astype(np.float32), 1800) / len(fs)
def reed(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    ph = 2 * np.pi * f * t + 0.004 * np.sin(2 * np.pi * 6 * t)
    s = sum(np.sin((k + 1) * ph) / (k + 1) ** 1.1 for k in range(7)) + 0.6 * sum(np.sin((k + 1) * ph * 1.006) / (k + 1) ** 1.1 for k in range(5))
    a = np.minimum(1, t / 0.02) * np.minimum(1, np.maximum(0, (dur - t) / 0.05))
    return lp_fast((s * a).astype(np.float32), 2600) * 0.3
def pluck(f, dur=0.35, bright=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum((bright ** k) * np.sin(2 * np.pi * f * (k + 1) * t) / (k + 1) for k in range(6))
    return (s * env(n, 0.003, dur * 0.35)).astype(np.float32)
MUSIC_END = 44.2
mel = [0, 2, 4, 7, 4, 2, 0, 4, 7, 9, 7, 4]  # tune offsets over the chord tones
bar = 0; tt = 0.0
while tt < MUSIC_END:
    root, ch = prog[bar % len(prog)]
    place(music, pluck(midi(root - 12), 0.4, 0.4), tt, 0.5)                  # oom
    for b in (1, 2):
        tb = tt + b * beat
        if tb < MUSIC_END:
            for m in ch: place(music, pluck(midi(m), 0.22, 0.55), tb, 0.12)    # pah pah
    for j in range(3):
        tb = tt + j * beat
        if tb < MUSIC_END: place(music, reed(midi(ch[(j + bar) % 3] + 12), beat * 0.9), tb, 0.55 if j != 1 else 0.4)
    bar += 1; tt += beat * 3
i0 = int((MUSIC_END - 0.08) * SR); music[i0:] *= np.linspace(1, 0, N - i0) ** 8
dn = int((DUR - MUSIC_END) * SR); td = np.arange(dn) / SR
drone = lp_fast(((np.sin(2 * np.pi * 55 * td) + 0.5 * np.sin(2 * np.pi * 82.4 * td)) * np.minimum(1, td / 0.8)).astype(np.float32), 600)
place(music, drone, MUSIC_END, 0.08)

# ---------------- sfx ----------------
sfx = np.zeros(N, np.float32)
def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)
def thunk(f0=90, d=0.3):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f0 * t * (1 + 0.6 * np.exp(-t * 40))) * np.exp(-t * 14) + lp_fast(noise(d), 1200) * np.exp(-t * 30) * 0.5).astype(np.float32)
def rumble(d):
    n = int(d * SR); t = np.arange(n) / SR
    s = lp_fast(noise(d), 160) * 3 * np.minimum(1, t / 0.15) * np.exp(-t / (d * 0.45))
    return s.astype(np.float32)
def crash(d=1.2):
    n = int(d * SR); t = np.arange(n) / SR; s = np.zeros(n, np.float32)
    for k in range(14):
        tk = rng.uniform(0, d * 0.6); i = int(tk * SR); g = thunk(rng.uniform(60, 160), 0.35) * rng.uniform(0.3, 0.9)
        s[i:i + len(g)] += g[: n - i]
    s += lp_fast(noise(d), 2500) * np.exp(-t * 3) * 0.25
    return s
def cuckoo():
    out = []
    for f, d in [(740, 0.16), (587, 0.24)]:
        n = int(d * SR); t = np.arange(n) / SR
        out.append(np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.01) * np.exp(-t * 6)); out.append(np.zeros(int(0.06 * SR)))
    return np.concatenate(out).astype(np.float32)
def scrape(d=0.8):
    n = int(d * SR); t = np.arange(n) / SR
    s = noise(d) * (0.5 + 0.5 * np.sin(2 * np.pi * 13 * t)) * np.sin(np.pi * t / d)
    s = hp_fast(lp_fast(s, 5000), 1500)
    ring = np.sin(2 * np.pi * 1870 * t) * np.exp(-t * 3) * 0.2
    return (s * 0.6 + ring).astype(np.float32)
def ting():
    n = int(1.2 * SR); t = np.arange(n) / SR
    return (sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in [(2093, 4), (3136, 6), (4186, 8)]) * 0.3).astype(np.float32)
def sting():
    n = int(2.0 * SR); t = np.arange(n) / SR
    low = np.sin(2 * np.pi * 41 * t) * np.exp(-t * 1.5) * 1.2
    hit = lp_fast(noise(2.0), 900) * np.exp(-t * 6) * 0.8
    stab = brass([midi(45), midi(48), midi(51)], 1.4); s = low + hit; s[: len(stab)] += stab * 2.2 * np.exp(-np.arange(len(stab)) / SR * 2)
    return s.astype(np.float32)
def creak(d=0.6, f0=140):
    n = int(d * SR); t = np.arange(n) / SR
    rate = f0 * (1 + 0.35 * np.sin(2 * np.pi * 1.3 * t / d))
    ph = np.cumsum(rate) / SR; pulses = (np.mod(ph, 1) < 0.08).astype(np.float32)
    s = lp_fast(pulses * (0.6 + 0.4 * rng.random(n).astype(np.float32)), 2200) * np.sin(np.pi * t / d)
    return hp_fast(s, 200) * 2.5
def snap():
    d = 0.5; n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(noise(d), 800) * np.exp(-t * 18) * 1.4 + np.pad(thunk(120, 0.4), (0, n - int(0.4 * SR))) * 0.6).astype(np.float32)
def splash(d=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    s = lp_fast(noise(d), 4000) * (np.exp(-t * 4) * np.minimum(1, t / 0.01)) + lp_fast(noise(d), 400) * np.exp(-t * 7) * 1.5
    return s.astype(np.float32)
def whoosh(d=0.5):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 1500) * np.sin(np.pi * t / d) ** 2 * 0.6).astype(np.float32)
def snore(d=1.1):
    n = int(d * SR); t = np.arange(n) / SR
    buzz = (np.mod(np.cumsum(60 + 25 * np.sin(np.pi * t / d)) / SR, 1) < 0.3).astype(np.float32)
    return (lp_fast(buzz * 0.5 + noise(d) * 0.15, 700) * np.sin(np.pi * t / d) ** 2).astype(np.float32)
def leaves(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(lp_fast(noise(d), 6000), 2500) * (0.3 + 0.3 * np.sin(2 * np.pi * 0.7 * t) ** 2) * np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.4)).astype(np.float32)
def water(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 900) * 0.5 + hp_fast(lp_fast(noise(d), 3000), 1200) * 0.15 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.4 * t))).astype(np.float32)

F = lambda f: f / 30
def pop(): 
    n = int(0.3 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * (300 + 500 * np.exp(-t * 18)) * t) * np.exp(-t * 14)).astype(np.float32)
def coin():
    n = int(0.5 * SR); t = np.arange(n) / SR
    return ((np.sin(2 * np.pi * 1760 * t) + np.sin(2 * np.pi * 2349 * t)) * np.exp(-t * 9) * 0.3).astype(np.float32)
def step(): return thunk(160, 0.09) * 0.5
sfx = np.zeros(N, np.float32)
place(sfx, whoosh(0.9), F(56), 0.5)
place(sfx, ting(), F(82), 0.5); place(sfx, ting(), F(92), 0.4)
place(sfx, whoosh(0.5), F(126), 0.4)
place(sfx, creak(0.8, 90), F(222), 0.7); place(sfx, creak(0.6, 120), F(262), 0.6); place(sfx, leaves(2.0), F(230), 0.25)
place(sfx, thunk(70, 0.3), F(300), 0.5)
place(sfx, creak(0.5, 140), F(318), 0.5)
place(sfx, scrape(0.6), F(352), 0.25)
place(sfx, scrape(0.5), F(426), 0.4); place(sfx, ting(), F(440), 0.6)
place(sfx, whoosh(0.4), F(505), 0.5); place(sfx, pop(), F(516), 0.8); place(sfx, ting(), F(520), 0.4)
for i in range(14): place(sfx, step(), F(592) + i * 0.17, 0.7)
place(sfx, pop(), F(708), 0.8); place(sfx, ting(), F(712), 0.4)
place(sfx, coin(), F(772), 0.6); place(sfx, coin(), F(780), 0.5)
place(sfx, creak(0.5, 160), F(830), 0.3)
place(sfx, scrape(0.7), F(996), 0.5); place(sfx, coin(), F(1030), 0.8); place(sfx, ting(), F(1033), 0.5)
for i in range(8): place(sfx, step(), F(1057) + i * 0.17, 0.7)
place(sfx, pop(), F(1088), 1.0); place(sfx, whoosh(0.6), F(1088), 0.6); place(sfx, ting(), F(1092), 0.7)
place(sfx, creak(0.6, 110), F(1150), 0.3)
for i in range(5): place(sfx, step(), F(1192) + i * 0.2, 0.6)
place(sfx, whoosh(0.4), F(1205), 0.3)
place(sfx, pop(), F(1263), 1.0); place(sfx, whoosh(0.7), F(1261), 0.5)
for i in range(11): place(sfx, step(), F(1266) + i * 0.17, 0.6)
place(sfx, pop(), F(1354), 0.8); place(sfx, coin(), F(1358), 0.6)
place(sfx, sting(), 44.25, 0.8); place(sfx, ting(), F(1373), 0.6)
for name, a in (("music", music), ("sfx", sfx)):
    pcm = (np.clip(a, -1, 1) * 32767).astype(np.int16)
    with wave.open(name + ".wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("stems ok", N / SR)
