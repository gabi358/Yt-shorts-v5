#!/usr/bin/env python3
"""Environment check:  python check.py   - says what is missing and how to fix it."""
import shutil, subprocess, sys, importlib

ok = True

def row(name, good, fix=""):
    global ok
    ok &= bool(good)
    print(("  OK     " if good else "  FALTA  ") + name + ("" if good else "   ->  " + fix))

def first_line(cmd):
    try:
        out = subprocess.run(cmd, capture_output=True, text=True).stdout.strip().splitlines()
        return out[0] if out else None
    except Exception:
        return None

node = first_line(["node", "-v"])
row("Node " + (node or ""), node and int(node[1:].split(".")[0]) >= 22, "instala Node 22 o superior (nodejs.org)")
row("ffmpeg", shutil.which("ffmpeg"), "instala ffmpeg y ponlo en el PATH (winget install ffmpeg)")
row("ffprobe", shutil.which("ffprobe"), "viene con ffmpeg")
row("bash (Git Bash o WSL, para setup.sh y finish.sh)", shutil.which("bash"), "instala Git for Windows (incluye Git Bash) o WSL")
for mod, pipname in [("numpy", "numpy"), ("PIL", "pillow")]:
    try:
        importlib.import_module(mod); row("python " + pipname, True)
    except Exception:
        row("python " + pipname, False, "pip install " + pipname)
try:
    importlib.import_module("faster_whisper"); row("faster-whisper (opcional)", True)
except Exception:
    print("  --     faster-whisper no instalado (opcional, tiempos palabra a palabra): pip install faster-whisper")
try:
    importlib.import_module("playwright"); row("python playwright (opcional, para render.py)", True)
except Exception:
    print("  --     python playwright no instalado (opcional si usas node): pip install playwright && playwright install chromium")
print("\nPara render.mjs (node): en la carpeta del proyecto ejecuta  npm install  y  npx playwright install chromium")
print("TODO LISTO" if ok else "Faltan cosas obligatorias (arriba).")
sys.exit(0 if ok else 1)
