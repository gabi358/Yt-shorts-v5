// Story de DEMOSTRACIÓN del motor v5 (mundo "campamento"): 7 planos que ejercitan luna/estrellas, luces prácticas, multitud, interior de tienda, día, atardecer y tormenta con rayos.
import { camFromKeys, keysFromShots, subjectShot, orbit, FILL, M, idle, blinkAt, q, clamp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 420, DECK = 0;
const HERO = [1.6, 0, 2.2], TENT = [0.4, 0, -13.2];
const S_ = (id, a, b, light, c0, c1, o = {}) => ({ id, a, b, light, c0, c1, ...o });
export const SHOTS = [
  S_('noche_ws', 0, 59, 'noche', orbit([0, 6, -30], 40, 0, -7, 52), orbit([0, 6, -30], 36, 4, -6, 50), { cinf: 2, focus: 'fire' }),
  S_('heroe_cu', 60, 119, 'noche', subjectShot(HERO, { fill: FILL.cu, az: -35, el: 3, fov: 36, dx: 0.1 }), subjectShot(HERO, { fill: FILL.ecu * 0.8, az: -28, el: 2, fov: 34, dx: 0.1 }), { cinf: 8, focus: 'hero' }),
  S_('columna', 120, 179, 'noche', orbit([0, 1.6, -30], 16, 70, 3, 50), orbit([0, 1.6, -30], 13, 60, 2.5, 48), { cinf: 4, focus: 'col' }),
  S_('tienda', 180, 239, 'noche', { pos: [1.2, 1.6, -9.4], look: [-0.3, 1.2, -14.5], fov: 66, roll: 0 }, { pos: [0.8, 1.55, -10.2], look: [-0.2, 1.25, -14.5], fov: 60, roll: 0 }, { cinf: 6, focus: 'tent' }),
  S_('muralla_dia', 240, 299, 'dia', orbit([0, 6, -48], 46, -12, 6, 46), orbit([0, 7, -48], 40, -6, 5, 44), { cinf: 2, focus: 'wall' }),
  S_('atardecer_cu', 300, 359, 'atardecer', subjectShot(HERO, { fill: FILL.cu, az: 55, el: 2, fov: 36, dx: -0.1 }), subjectShot(HERO, { fill: FILL.mcu, az: 45, el: 3, fov: 38, dx: -0.1 }), { cinf: 8, focus: 'hero' }),
  S_('tormenta', 360, 419, 'tormenta', orbit([0, 2.5, -30], 18, 55, 3, 52), orbit([0, 2.5, -30], 15, 45, 3, 50), { cinf: 3, focus: 'col' }),
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
export const smooth = M.smooth; export { clamp };
const L0 = { fog: '#101a34', fogNear: 30, fogFar: 460 };
export const LIGHTS = {
  noche: { ...L0, az: 205, el: 34, sky: '#2c3c6c', ground: '#171d33', hemi: 1.1, sun: '#86a2f4', sunI: 3.6, sunDisc: '#e6edff', sunDiscI: 5, sunSize: 0.0018, glow: 0.55, glowCol: '#8fa8ff', stars: 1, clouds: 0.5, cloudCol: '#8294bc', cloudShade: '#141c38',
    skyTop: '#060a1c', skyHor: '#1c2a52', practical: 1, windows: 1, bloom: 0.6, bloomThr: 0.8, rays: 0.5, raysCol: '#a8bcff', gShadow: '#c4d6ff', gHigh: '#ffe0bc', gAmt: 0.65, contrast: 0.3, sat: 1.0, vig: 0.34, exposure: 1.35, ink: 0.55, shadowExt: 36, cardLit: 0.85, cardRim: 0.6 },
  dia: { az: 40, el: 30, sky: '#9ab6e4', ground: '#4a4a38', hemi: 1.0, sun: '#ffe8c2', sunI: 3.3, sunDisc: '#fff4d0', sunDiscI: 6, sunSize: 0.0014, glow: 0.5, glowCol: '#ffe0a8', clouds: 0.5, cloudCol: '#ffffff', cloudShade: '#a4b2d2', skyTop: '#4a7ccc', skyHor: '#d0e2f6', fog: '#c6d6ea', fogNear: 70, fogFar: 760,
    practical: 0, bloom: 0.3, bloomThr: 1.0, rays: 0.0, gShadow: '#d0defc', gHigh: '#fff0d8', gAmt: 0.5, contrast: 0.25, sat: 1.15, vig: 0.25, ink: 0.5, shadowExt: 40 },
  atardecer: { az: 215, el: 9, sky: '#7a5a92', ground: '#3a2a30', hemi: 0.8, sun: '#ff9650', sunI: 3.8, sunDisc: '#ffd8a0', sunDiscI: 6, sunSize: 0.004, glow: 1.0, glowCol: '#ff9a58', clouds: 0.6, cloudCol: '#ffbe8a', cloudShade: '#6a4a7a', skyTop: '#3a3a7a', skyHor: '#ff9a60', fog: '#c88a70', fogNear: 60, fogFar: 640,
    practical: 0.35, bloom: 0.55, bloomThr: 0.85, rays: 0.8, raysCol: '#ffb070', gShadow: '#b8b0ff', gHigh: '#ffd2a2', gAmt: 0.7, contrast: 0.28, sat: 1.2, vig: 0.3, ink: 0.5, shadowExt: 36 },
  tormenta: { az: 200, el: 30, sky: '#27303f', ground: '#161a22', hemi: 1.0, sun: '#8aa0d2', sunI: 2.2, sunDisc: '#000000', glow: 0.0, clouds: 1.0, cloudCol: '#4e5a70', cloudShade: '#10141e', skyTop: '#10141e', skyHor: '#3a4658', fog: '#1c2432', fogNear: 20, fogFar: 320,
    practical: 1, windows: 1, bloom: 0.55, bloomThr: 0.8, rain: 1, gShadow: '#bcd0ff', gHigh: '#ffe0c0', gAmt: 0.6, contrast: 0.3, sat: 0.85, vig: 0.42, ink: 0.5, shadowExt: 36 },
};
export const lightFor = (S) => LIGHTS[S.light] || LIGHTS.noche;
export const FX_EVENTS = [{ type: 'dust', f0: 125, f1: 126, pos: [2, 0.2, -28], burst: 16, spread: [3, 0, 2], seed: 2 }, { type: 'spark', f0: 60, f1: 120, pos: [0, 0.6, 0], rate: 14, spread: [0.3, 0.1, 0.3], seed: 6 }];
export const LIGHTNING = [{ f: 372, pos: [9, -44], h: 70, seed: 4 }, { f: 396, pos: [-12, -50], h: 80, seed: 9 }];
const KEYS = keysFromShots(SHOTS);
export const camAt = (f) => { const c = camFromKeys(KEYS, f, { creep: 0.03, sway: 0.01 }); c.flash = 0; return c; };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const FOC = { fire: [0, 0.6, 0], hero: [HERO[0], 1.3, HERO[2]], col: [0, 1.3, -26], tent: [0, 1.1, -13.5], wall: [0, 6, -48] };
export const dofAt = (f) => { const S = shotAt(f), c = camAt(f); return { focus: dist(c.pos, FOC[S.focus] || c.look), cinf: S.cinf ?? 4 }; };
export const worldAt = () => ({});
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], id = idle(f, 3), A = (who, seed, o, pos, extra) => { const i2 = idle(f, seed); out.push(R(T, who, { seed, blink: blinkAt(f, seed), bob: q(i2.bob, 3), tilt: q(i2.tilt, 1), headTilt: q(i2.headTilt, 1), ...o }, pos, extra)); };
  if (S.id !== 'tienda' && S.id !== 'muralla_dia') {
    A('legion', 3, { expr: S.id === 'heroe_cu' ? 'grin' : 'neutral', L: 'hip', R: 'spear', look: 0.3 }, HERO); A('toga', 7, { expr: 'smile', L: 'hang', R: 'hip', look: -0.4 }, [-1.9, 0, 1.4], { s: 0.95 });
  }
  if (S.id === 'tienda') A('old', 9, { expr: 'stubborn', L: 'belly', R: 'hip', look: 0.3 }, TENT);
  return out;
};
export const fxAt = () => [];
