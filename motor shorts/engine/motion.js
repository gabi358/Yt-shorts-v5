// Motion helpers: smooth, continuous, "animated" movement for cameras and cards.
// Import in story.js:  import { M } from './motion.js';
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const lerp3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
export const ramp = (f, a, b) => clamp((f - a) / (b - a));
export const M = {
  smooth: (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); },           // smootherstep (glides)
  easeOut: (t) => 1 - Math.pow(1 - clamp(t), 3),                                          // fast start, soft land (reference "burst" moves)
  easeIn: (t) => Math.pow(clamp(t), 3),
  back: (t, s = 1.7) => { t = clamp(t) - 1; return t * t * ((s + 1) * t + s) + 1; },        // overshoot then settle (pops, arrivals)
  anticip: (t, s = 0.12) => { t = clamp(t); return t < 0.25 ? -s * Math.sin(t / 0.25 * Math.PI) : M.back((t - 0.25) / 0.75); }, // wind-up then go
  spring: (t, freq = 3, damp = 5) => { t = Math.max(0, t); return 1 - Math.exp(-damp * t) * Math.cos(freq * 2 * Math.PI * t); },  // settle wobble (t in s)
};
/** Centripetal Catmull-Rom through 3D points; u in [0,1] over the whole path (constant-ish speed). */
export const spline = (pts, u) => {
  const n = pts.length - 1, x = clamp(u) * n, i = Math.min(n - 1, Math.floor(x)), t = x - i;
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
  return p1.map((_, k) => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t * t * t));
};
/** Camera from keys {f,pos,look,fov,roll,ease?}. 3+ keys inside one glide use a spline (no corners).
 *  CORTE DURO = última key de un plano en el fotograma b y primera key del siguiente en b+1 (hueco de 1 fotograma).
 *  PUSH-IN (v4): `creep` = fracción de FOV que se cierra POR SEGUNDO de plano (defecto 0.03 = 3 %/s), contada desde el
 *  inicio del plano actual (último corte duro) y limitada por `creepMax` (defecto 0.10 = 10 % en total). Antes (v3) se contaba
 *  desde el fotograma 0 del vídeo: en un short de 60 s el FOV acababa a la mitad y "no se veía nada". NO subas creep por encima de 0.06.
 *  `sway` = vaivén de cámara en mano en metros (0 = ninguno, 0.015 = sutil, 0.04 = fuerte). kicks = golpes de cámara por impacto. */
export const camFromKeys = (K, f, { creep = 0.03, creepMax = 0.10, sway = 0, kicks = [] } = {}) => {
  let c, seg = -1;
  if (f <= K[0].f) c = { ...K[0] };
  else if (f >= K[K.length - 1].f) { c = { ...K[K.length - 1] }; seg = K.length - 1; }
  else {
    const i = K.findIndex((k, j) => f >= k.f && f <= K[j + 1].f), a = K[i], b = K[i + 1]; seg = i;
    const ease = M[b.ease || 'smooth'], t = ease((f - a.f) / Math.max(1, b.f - a.f));
    if (b.path) { // optional via-points for curved moves: b.path = [[x,y,z], ...]
      const pts = [a.pos, ...b.path, b.pos]; c = { pos: spline(pts, t), look: lerp3(a.look, b.look, t), fov: lerp(a.fov, b.fov, t), roll: lerp(a.roll || 0, b.roll || 0, t) };
    } else c = { pos: lerp3(a.pos, b.pos, t), look: lerp3(a.look, b.look, t), fov: lerp(a.fov, b.fov, t), roll: lerp(a.roll || 0, b.roll || 0, t) };
  }
  // inicio del plano actual = última key tras un corte duro (hueco <= 1 fotograma) antes del segmento actual
  let t0 = K[0].f; for (let j = 1; j <= Math.max(seg, 0); j++) if (K[j].f - K[j - 1].f <= 1) t0 = K[j].f;
  c.fov *= 1 - Math.min(creepMax, creep * Math.max(0, f - t0) / 30); // push-in suave por plano
  if (sway) { const w = (sway) * 1; c.pos = [c.pos[0] + w * (Math.sin(f * 0.071) + 0.5 * Math.sin(f * 0.173 + 1)), c.pos[1] + w * 0.6 * Math.sin(f * 0.093 + 2), c.pos[2] + w * 0.8 * Math.sin(f * 0.057 + 4)]; c.roll = (c.roll || 0) + sway * 14 * Math.sin(f * 0.049 + 3); }
  for (const k of kicks) { const d = f - k.f; if (d >= 0 && d < 7) { const s = (d % 2 ? -1 : 1) * k.a * (1 - d / 7); c.look = [c.look[0], c.look[1] + s * 3, c.look[2] + s * 2]; c.roll = (c.roll || 0) + s * 20; } }
  return c;
};

// ---------- COMPOSICIÓN POR FRACCIÓN DE PANTALLA (v4) ----------
// Elimina el error nº 1 de cámara: adivinar coordenadas absolutas de mundo. Se indica QUÉ se ve y CUÁNTO ocupa; la distancia sale de la óptica.
const D2R = Math.PI / 180;
export const CARD_H = 2.25;   // altura de una tarjeta de personaje a escala 1 (m): pies -> coronilla
/** Fracciones típicas (altura del CUERPO ENTERO / altura de pantalla). >1 = el cuerpo no cabe (solo cabeza y torso). Medidas en las referencias. */
export const FILL = { ecu: 3.2, cu: 2.1, mcu: 1.45, ms: 0.95, mws: 0.62, ws: 0.34, ews: 0.14 };
/** Cámara orbital: mira a `target` desde `dist` m, azimut az (° alrededor de Y; 0 = cámara en +z mirando a -z), elevación el (° sobre el horizonte). */
export const orbit = (target, dist, az = 0, el = 6, fov = 40, roll = 0) => {
  const a = az * D2R, e = el * D2R;
  return { pos: [target[0] + dist * Math.sin(a) * Math.cos(e), target[1] + dist * Math.sin(e), target[2] + dist * Math.cos(a) * Math.cos(e)], look: [target[0], target[1], target[2]], fov, roll };
};
/** Plano de un sujeto. p = [x,y,z] PIES de la tarjeta, s = escala de la tarjeta.
 *  fill: fracción de la altura de pantalla que ocupa el cuerpo entero (usa FILL.cu, FILL.ms, ...). aim: punto de la tarjeta al que mira (0.58 = cara).
 *  dx/dy: desplazan al sujeto por la pantalla (fracción de pantalla; dy>0 = más arriba, dx>0 = más a la derecha). Para regla de tercios: dx=±0.17, dy=0.12.
 *  el: elevación en grados (negativo = cámara BAJO el suelo mirando hacia arriba = contrapicado; 3-8 = a la altura de los ojos; 25+ = picado). */
export const subjectShot = (p, { s = 1, fill = FILL.ms, az = 0, el = 5, fov = 40, aim = 0.58, dx = 0, dy = 0, roll = 0 } = {}) => {
  const half = Math.tan(fov * D2R / 2), dist = (CARD_H * s / fill) / (2 * half), visH = 2 * dist * half, visW = visH * 9 / 16, a = az * D2R;
  const right = [Math.cos(a), 0, -Math.sin(a)];
  const t = [p[0] - right[0] * dx * visW, p[1] + CARD_H * s * aim - dy * visH, p[2] - right[2] * dx * visW];
  return orbit(t, dist, az, el, fov, roll);
};
/** Dos o más sujetos en el mismo plano: encuadra el grupo. pts = [[x,y,z], ...] PIES de cada tarjeta. fill = tope de altura de pantalla (defecto 0.9);
 *  si el grupo es ancho, se aleja solo hasta que quepa a lo ancho con ~25 % de aire. */
export const groupShot = (pts, opts = {}) => {
  const n = pts.length, c = [0, 1, 2].map((k) => pts.reduce((acc, q) => acc + q[k], 0) / n);
  const a = (opts.az || 0) * D2R, right = [Math.cos(a), 0, -Math.sin(a)];
  const xs = pts.map((q) => (q[0] - c[0]) * right[0] + (q[2] - c[2]) * right[2]);
  const w = (Math.max(...xs) - Math.min(...xs) + 0.9) * 1.25, visH = w * 16 / 9, s = opts.s || 1;
  const feet = [c[0], Math.min(...pts.map((q) => q[1])), c[2]];
  return subjectShot(feet, { ...opts, fill: Math.min(opts.fill ?? 0.9, CARD_H * s / visH) });
};
/** Construye las KEYS de cámara desde SHOTS = [{a,b,c0,c1,glide?,ease?}]. Corte duro por defecto.
 *  glide: n  -> en vez de cortar, la cámara VIAJA n fotogramas (6-10) desde el final del plano anterior hasta c0 con ease-out (transición continua de las referencias).
 *  Solo úsalo si ambos planos están en el MISMO escenario. */
export const keysFromShots = (shots) => shots.flatMap((s, i) => {
  const out = [];
  if (i > 0 && s.glide) out.push({ f: s.a - 1 + s.glide, ...s.c0, ease: s.ease || 'easeOut' }); else out.push({ f: s.a, ...s.c0 });
  out.push({ f: s.b, ...s.c1, ease: s.hold || 'smooth' });
  return out;
});
/** Idle life for a card: breathing bob + small sway, deterministic per seed. Use on EVERY on-screen character. */
export const idle = (f, seed = 1) => ({
  bob: 0.006 * Math.sin((f + seed * 11) * 0.11),
  tilt: 1.2 * Math.sin((f + seed * 7) * 0.05),
  headTilt: 1.5 * Math.sin((f + seed * 5) * 0.037 + 1),
});
/** Blink: 4-frame lid every 0.5-2.3 s. */
export const blinkAt = (f, seed) => { const per = 38 + (seed * 17) % 31, ph = (f + seed * 13) % per; return ph < 2 ? 0.5 : ph < 4 ? 1 : 0; };
/** Walk: phase for step cycles + planted travel. speed m/s, stride m. */
export const walk = (f, f0, speed = 1.1, stride = 0.8) => { const t = Math.max(0, f - f0) / 30; return { dist: t * speed, phase: (t * speed / (2 * stride)) % 1 }; };
/** Round values used in card keys so canvas redraws happen only when the pose visibly changes. */
export const q = (x, n = 2) => Math.round(x * 10 ** n) / 10 ** n;
