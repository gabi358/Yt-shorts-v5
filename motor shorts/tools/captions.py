#!/usr/bin/env python3
"""Word-by-word captions (big white bold, black outline, pop-in) -> captions.ass
usage: python3 captions.py work/phrases.json [--font Arial] [--size 88] [--marginv 520] [--words 2]
Word times are estimated from phrase times (letters ~ duration). With a whisper transcript they could be exact."""
import json, re, sys, argparse
ap = argparse.ArgumentParser(); ap.add_argument('phrases'); ap.add_argument('--out', default='captions.ass')
ap.add_argument('--font', default='Arial'); ap.add_argument('--size', type=int, default=104); ap.add_argument('--marginv', type=int, default=560)
ap.add_argument('--words', type=int, default=2, help='max words on screen at once'); a = ap.parse_args()
P = json.load(open(a.phrases))['phrases']
def t(x): h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60; return f"{h}:{m:02d}:{s:05.2f}"
hdr = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: W,{a.font},{a.size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,7,2,2,60,60,{a.marginv},1
[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""
ev = []
for p in P:
    ws = p['text'].split()
    if not ws: continue
    wt = [max(2, len(re.sub(r'\W', '', w))) + 1 for w in ws]; tot = sum(wt); s, e = p['s'], p['e']; cur = s; spans = []
    for w, x in zip(ws, wt): d = (e - s) * x / tot; spans.append((w, cur, cur + d)); cur += d
    i = 0
    while i < len(spans):
        grp = [spans[i]]
        while len(grp) < a.words and i + len(grp) < len(spans) and len(grp[0][0]) + len(spans[i + len(grp)][0]) <= 11 and len(grp) == 1: grp.append(spans[i + 1])
        i += len(grp)
        txt = ' '.join(g[0] for g in grp).upper() if False else ' '.join(g[0] for g in grp)
        ev.append(f"Dialogue: 0,{t(grp[0][1])},{t(grp[-1][2])},W,,0,0,0,,{{\\fscx78\\fscy78\\t(0,90,\\fscx100\\fscy100)}}{txt}")
open(a.out, 'w').write(hdr + '\n'.join(ev) + '\n'); print(a.out, len(ev), 'captions')
