// usage: node render.mjs <outdir> <frames: "a-b" or "1,2,3"> [step] [quality]
// Uses the GPU by default (ANGLE). Environment variables:
//   CPU=1     software WebGL (works without a GPU, ~9 s/frame)
//   DRAFT=1   half resolution 540x960 (finish.sh upscales it to 1080x1920)
//   RESUME=1  skip frames that already exist
//   ANGLE=d3d11|vulkan|metal|gl   force the graphics backend (default: d3d11 on Windows)
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const [,, outdir, spec, step = '1', qual = '0.96'] = process.argv;
fs.mkdirSync(outdir, { recursive: true });
let frames = [];
for (const part of spec.split(',')) { if (part.includes('-')) { const [a, b] = part.split('-').map(Number); for (let f = a; f <= b; f += +step) frames.push(f); } else frames.push(+part); }
const root = process.env.WEB || path.resolve('web');
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise(r => srv.on('listening', r));
const angle = process.env.ANGLE || (process.platform === 'win32' ? 'd3d11' : process.platform === 'darwin' ? 'metal' : 'gl');
const args = process.env.CPU
  ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
  : ['--use-angle=' + angle, '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--enable-webgl'];
const b = await chromium.launch({ args });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
pg.on('console', m => console.log('PAGE', m.text())); pg.on('pageerror', e => console.log('ERR', e.message));
await pg.goto(`http://localhost:${srv.address().port}/index.html${process.env.DRAFT ? '#half' : (process.env.HASH || '')}`);
await pg.waitForFunction(() => window.ready || window.err, null, { timeout: 180000 });
if (await pg.evaluate(() => window.err)) { console.log('page error'); process.exit(1); }
console.log('WebGL:', await pg.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); const e = g && g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; }));
const t0 = Date.now(); let n = 0;
for (const f of frames) {
  const fn = path.join(outdir, `f${String(f).padStart(4, '0')}.jpg`);
  if (process.env.RESUME && fs.existsSync(fn)) continue;
  const d = await pg.evaluate(([f, q]) => { if (window.location.hash === '#nd') window.DEBUG_ND = 1; if (window.location.hash === '#e') window.DEBUG_E = 1; window.renderFrame(f); return document.getElementById('c').toDataURL('image/jpeg', q); }, [f, +qual]);
  fs.writeFileSync(fn, Buffer.from(d.split(',')[1], 'base64')); n++;
  if (n % 25 === 0) console.log(`${n} frames, ${((Date.now() - t0) / n / 1000).toFixed(2)} s/frame`);
}
console.log(`done ${n} frames, ${((Date.now() - t0) / Math.max(n, 1) / 1000).toFixed(2)} s/frame`);
await b.close(); srv.close();
