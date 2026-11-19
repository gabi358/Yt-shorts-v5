// PLANTILLA story.js v4 — cámara por composición (sin adivinar coordenadas).
// Copia, cambia POS (dónde está cada cosa en tu mundo), los planos y los actores. Los números de FPS/TOTAL salen del audio (timing.py).
import { camFromKeys, keysFromShots, subjectShot, groupShot, orbit, FILL, M, idle, blinkAt, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 1350, DECK = 6;   // 45 s

// 1. DÓNDE ESTÁ CADA COSA (pies de la tarjeta = [x, DECK, z]). Los planos se definen RELATIVOS a estos puntos.
const POS = {
  hero:  [0, DECK, 0],
  rival: [1.4, DECK, -1.0],
  prop:  [0, DECK + 0.9, 1.2],     // objeto ancla (cartel, olla, moneda...)
  crowd: [[-1.2, DECK, -2], [0, DECK, -2.6], [1.3, DECK, -2.2]],
};
const H = POS.hero, R = POS.rival;

// 2. PLANOS. fill = cuánto del alto de pantalla ocupa el CUERPO ENTERO (FILL.ecu 3.2 · cu 2.1 · mcu 1.45 · ms 0.95 · mws 0.62 · ws 0.34 · ews 0.14).
//    az = lado desde el que se ve, el = altura de cámara (≈2-6 = ojos; <0 = contrapicado bajo el suelo; 25+ = picado), dx/dy = regla de tercios.
//    c0 -> c1 es el movimiento del plano: cambia fill/az/el/fov un poco (p.ej. fill 1.45 -> 1.8) y la cámara entra o gira SOLA, siempre dentro de lo previsto.
//    glide: n  => transición sin corte (la cámara viaja n fotogramas desde el plano anterior). Solo dentro del mismo escenario.
const S_ = (id, a, b, light, c0, c1, o = {}) => ({ id, a, b, light, c0, c1, ...o });
export const SHOTS = [
  S_('01_gancho',    0,   59, 'dia',      subjectShot(H, { fill: FILL.mcu, az: 20, el: 4, fov: 38, dx: 0.12 }),            subjectShot(H, { fill: FILL.cu, az: 12, el: 4, fov: 36, dx: 0.1 }), { cinf: 6 }),
  S_('02_mundo',    60,  119, 'dia',      orbit([0, DECK + 8, -10], 55, 25, 22, 50),                                          orbit([0, DECK + 8, -10], 46, 10, 18, 46), { cinf: 2 }),
  S_('03_inserto', 120,  169, 'dia',      orbit(POS.prop, 1.6, 15, 12, 34),                                                   orbit(POS.prop, 1.2, 5, 10, 30), { cinf: 9 }),
  S_('04_pareja',  170,  239, 'atardecer', groupShot([H, R], { az: -30, el: 3, fov: 44, fill: 0.8 }),                         groupShot([H, R], { az: -18, el: 3, fov: 42, fill: 0.95 }), { cinf: 6, glide: 8 }),
  S_('05_reaccion',240,  289, 'atardecer', subjectShot(R, { fill: FILL.cu, az: -25, el: 2, fov: 34, dx: -0.12, dy: 0.05 }),   subjectShot(R, { fill: FILL.ecu, az: -20, el: 2, fov: 32 }), { cinf: 9 }),
  S_('06_multitud', 290, 359, 'atardecer', groupShot(POS.crowd, { az: 0, el: 1, fov: 52, fill: 0.6 }),                        groupShot(POS.crowd, { az: 14, el: 1, fov: 50, fill: 0.7 }), { cinf: 4 }),
  S_('07_giro',    360,  419, 'noche',    subjectShot(H, { fill: FILL.ms, az: 35, el: -5, fov: 46, dy: 0.08 }),               subjectShot(H, { fill: FILL.mcu, az: 25, el: -4, fov: 42, dy: 0.08 }), { cinf: 7 }),
  // ... sigue hasta TOTAL: 1 plano nuevo cada ~1.8-2.8 s (4-9 palabras). Alterna: ECU/CU de cara -> inserto de objeto -> plano de mundo -> grupo.
];

export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
export const smooth = M.smooth;
export { clamp };

// 3. LUZ. Una por bloque del guion. Sombras largas y frías, sol cálido, hemi baja (0.6-0.8). Para noche: luna + fuego (ver DIRECTOR.md).
export const LIGHTS = {
  dia:       { az: 28,  el: 24, sky: '#8fa0c8', ground: '#4a4236', hemi: 0.75, sun: '#ffe0a8', sunI: 3.0, fog: '#d8c8b0', fogNear: 80, fogFar: 850, skyTop: '#3f6fc0', skyHor: '#ffd8b0', sat: 1.15, gain: '#fff4e6', vig: 0.24, shadowExt: 26 },
  atardecer: { az: 35,  el: 12, sky: '#7a5a88', ground: '#4a3028', hemi: 0.60, sun: '#ff9848', sunI: 3.4, fog: '#e0a880', fogNear: 70, fogFar: 750, skyTop: '#584488', skyHor: '#ffa868', sat: 1.25, gain: '#fff0e0', vig: 0.28, shadowExt: 26 },
  gris:      { az: 140, el: 22, sky: '#707a88', ground: '#3a3a38', hemi: 0.70, sun: '#c8d0e0', sunI: 1.8, fog: '#9098a8', fogNear: 50, fogFar: 600, skyTop: '#505868', skyHor: '#a0a8b8', sat: 0.85, gain: '#e4ecf8', vig: 0.32, shadowExt: 26 },
  tormenta:  { az: 180, el: 16, sky: '#2a3240', ground: '#1c2028', hemi: 0.55, sun: '#88a0cc', sunI: 1.2, fog: '#1c2230', fogNear: 35, fogFar: 450, skyTop: '#141824', skyHor: '#384458', sat: 0.75, gain: '#d0e0f8', vig: 0.40, rain: 1, shadowExt: 30 },
  noche:     { az: 210, el: 22, sky: '#182440', ground: '#121624', hemi: 0.50, sun: '#7898e8', sunI: 1.6, fog: '#0e1428', fogNear: 40, fogFar: 500, skyTop: '#080c1c', skyHor: '#1c2848', sat: 0.90, gain: '#d0e4ff', vig: 0.38, shadowExt: 26 },
  amanecer:  { az: 310, el: 10, sky: '#885878', ground: '#3a2830', hemi: 0.65, sun: '#ff9060', sunI: 3.0, fog: '#d09088', fogNear: 60, fogFar: 700, skyTop: '#503868', skyHor: '#ffa080', sat: 1.20, gain: '#fff0e8', vig: 0.26, shadowExt: 26 },
  triunfo:   { az: 120, el: 20, sky: '#ffd8a0', ground: '#5a3c28', hemi: 0.80, sun: '#ffb040', sunI: 3.6, fog: '#f0c890', fogNear: 90, fogFar: 950, skyTop: '#4a80d0', skyHor: '#ffe0b0', sat: 1.30, gain: '#fffbf0', vig: 0.20, shadowExt: 26 },
};
export const lightFor = (S, f) => LIGHTS[S.light] || LIGHTS.dia;

// 4. CÁMARA. keysFromShots une los planos (corte duro, o glide si lo pides). creep = push-in por segundo DENTRO de cada plano (no acumula entre planos).
const KEYS = keysFromShots(SHOTS);
const KICKS = [/* { f: 120, a: 0.04 } golpe de cámara en cada impacto / revelación */];
const FLASHES = [/* [frame, intensidad 0.4-0.8, duración 4-6] */];
export const camAt = (f) => {
  const c = camFromKeys(KEYS, f, { creep: 0.03, sway: 0.012, kicks: KICKS });
  c.flash = 0; for (const [a, v, n] of FLASHES) if (f >= a && f < a + n) c.flash = Math.max(c.flash, v * (1 - (f - a) / n));
  return c;
};

// 5. PROFUNDIDAD DE CAMPO: foco = distancia real cámara-objetivo; cinf por plano (2 mundo abierto · 5-6 plano medio · 8-9 primer plano/inserto).
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const c = camAt(f); return { focus: dist(c.pos, c.look), cinf: shotAt(f).cinf ?? 6 }; };
export const worldAt = (f) => ({});

// 6. ACTORES: TODOS con idle() y blinkAt() en cada fotograma. Entradas con M.back, preparación con M.anticip.
export const actorsAt = (f, T) => {
  const out = [];
  // const i1 = idle(f, 1), b1 = blinkAt(f, 1);  -> pásalos a la tarjeta (bob, tilt, blink) como en example/eiffel/story.js
  // Coloca a cada actor en POS.* para que los planos de arriba lo encuadren solos.
  return out;
};
export const fxAt = (f, T) => [];
