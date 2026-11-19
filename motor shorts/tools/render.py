# Python alternative to render.mjs (needs: pip install playwright && playwright install chromium)
#   python render.py <outdir> <"a-b" or "1,2,3"> [step] [quality]
# Env: CPU=1 software WebGL | DRAFT=1 half-res 540x960 | RESUME=1 skip existing | ANGLE=d3d11|vulkan|metal|gl
import sys, os, base64, time, threading, http.server, functools
from playwright.sync_api import sync_playwright

outdir, spec = sys.argv[1], sys.argv[2]
step = int(sys.argv[3]) if len(sys.argv) > 3 else 1
q = float(sys.argv[4]) if len(sys.argv) > 4 else 0.96
os.makedirs(outdir, exist_ok=True)
frames = []
for part in spec.split(","):
    if "-" in part:
        a, b = map(int, part.split("-")); frames += list(range(a, b + 1, step))
    else:
        frames.append(int(part))

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=os.path.abspath("web")))
threading.Thread(target=srv.serve_forever, daemon=True).start()
angle = os.environ.get("ANGLE") or ("d3d11" if sys.platform == "win32" else "metal" if sys.platform == "darwin" else "gl")
if os.environ.get("CPU"):
    args = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
else:
    args = ["--use-angle=" + angle, "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--enable-webgl"]
GPU_NAME = "(()=>{const g=document.createElement('canvas').getContext('webgl2');const e=g&&g.getExtension('WEBGL_debug_renderer_info');return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):'unknown'})()"
with sync_playwright() as p:
    br = p.chromium.launch(args=args)
    pg = br.new_page(viewport={"width": 1080, "height": 1920})
    pg.on("console", lambda m: print("PAGE", m.text, flush=True))
    pg.on("pageerror", lambda e: print("ERR", e, flush=True))
    pg.goto(f"http://127.0.0.1:{srv.server_port}/index.html" + ("#half" if os.environ.get("DRAFT") else os.environ.get("HASH", "")))
    pg.wait_for_function("window.ready || window.err", timeout=180000)
    if pg.evaluate("window.err"):
        print("page error"); sys.exit(1)
    print("WebGL:", pg.evaluate(GPU_NAME))
    t0 = time.time(); n = 0
    for f in frames:
        fn = os.path.join(outdir, f"f{f:04d}.jpg")
        if os.environ.get("RESUME") and os.path.exists(fn): continue
        d = pg.evaluate("([f,q])=>{window.renderFrame(f);return document.getElementById('c').toDataURL('image/jpeg',q)}", [f, q])
        open(fn, "wb").write(base64.b64decode(d.split(",")[1])); n += 1
        if n % 25 == 0: print(f"{n} frames, {(time.time() - t0) / n:.2f} s/frame", flush=True)
    print(f"done {n} frames, {(time.time() - t0) / max(n, 1):.2f} s/frame")
    br.close()
