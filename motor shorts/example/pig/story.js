// "La guerra del cerdo" — timed to voice.mp3 (54.75 s, 1643 frames @ 30 fps). Captions burned in afterwards.
import { camFromKeys, M, idle, blinkAt, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 1643, DECK = 6;
const S_ = (id, a, b, light, c0, c1, o = {}) => ({ id, a, b, light, c0, c1, ...o });
const C = (pos, look, fov, roll = 0) => ({ pos, look, fov, roll });
export const SHOTS = [
  S_('hook', 0, 47, 'day', C([0.7, 6.75, 3.0], [0, 6.42, 0], 32), C([0.45, 6.7, 2.4], [0, 6.42, 0], 30), { cinf: 9 }),
  S_('flags', 48, 115, 'day', C([0.5, 6.7, 2.6], [0, 6.5, -0.5], 36), C([0, 9.5, 12], [0, 8, -8], 46), { cinf: 2 }),
  S_('island', 116, 153, 'day', C([-20, 95, 65], [0, 0, -35], 60), C([20, 100, 60], [0, 0, -35], 60), { cinf: 0 }),
  S_('year', 154, 223, 'gold', C([-1.5, 7.2, 4], [-4.5, 7.4, -2], 40), C([-3.2, 7.3, 2.4], [-5, 7.4, -2], 34), { cinf: 6 }),
  S_('usCamp', 224, 283, 'day', C([-30, 7, -2], [-41, 11, -14], 50), C([-33, 7.4, -4], [-41, 11.5, -14], 46), { cinf: 2 }),
  S_('ukCamp', 284, 336, 'day', C([27, 7, -1], [38, 11, -13], 50), C([30, 7.4, -3], [38, 11.5, -13], 46), { cinf: 2 }),
  S_('farmer', 337, 402, 'day', C([0, 7.2, 6.4], [0, 7.0, -0.6], 46), C([0.1, 7.1, 5.4], [0, 7.0, -0.6], 42), { cinf: 8 }),
  S_('eat', 403, 448, 'day', C([-1.2, 6.55, 2.4], [0.6, 6.45, -1], 34), C([-0.6, 6.5, 1.6], [0.6, 6.45, -1], 30), { cinf: 9 }),
  S_('gun', 449, 484, 'day', C([0.3, 7.2, 4], [0, 7.3, 0], 34), C([0.2, 7.2, 3.4], [0, 7.3, 0], 30), { cinf: 8 }),
  S_('dead', 485, 502, 'day', C([0, 6.9, 5.4], [0, 6.7, -0.6], 46), C([0, 6.9, 4.8], [0, 6.7, -0.6], 42), { cinf: 8 }),
  S_('hbc', 503, 573, 'day', C([0, 7.1, 7.2], [0, 7.0, -1], 52), C([0, 7.1, 6.4], [0, 7.0, -1], 48), { cinf: 8 }),
  S_('redA', 574, 624, 'day', C([0, 6.8, 7], [0, 7.0, -1], 50), C([0, 6.9, 6.2], [0, 7.0, -1], 46), { cinf: 6 }),
  S_('redB', 625, 672, 'grey', C([0, 7.3, 6.6], [0.4, 7.1, -0.6], 50), C([0, 7.3, 5.8], [0.4, 7.1, -0.6], 46), { cinf: 8 }),
  S_('usA', 673, 709, 'day', C([-32.5, 7.3, -3], [-33.5, 7.4, -10], 36), C([-33, 7.3, -4.4], [-33.5, 7.4, -10], 34), { cinf: 6 }),
  S_('usB', 710, 745, 'day', C([-38, 20, 6], [-38, 6, -18], 46), C([-38, 16, 0], [-38, 6, -18], 44), { cinf: 0 }),
  S_('t64', 746, 813, 'day', C([-4, 10.5, 13], [-14, 6.8, -7], 44), C([-18, 10, 12], [-14, 6.8, -7], 40), { cinf: 2 }),
  S_('after', 814, 836, 'day', C([-30, 7.6, 2], [-40, 7.5, -15], 46), C([-34, 8, -2], [-40, 7.5, -15], 44), { cinf: 2 }),
  S_('t420', 837, 883, 'day', C([-40, 75, 0], [-40, 6, -38], 60), C([-40, 82, -10], [-40, 6, -38], 60), { cinf: 0 }),
  S_('cannons', 884, 942, 'day', C([-19, 7.2, 8], [-24, 7, 2], 42), C([-19, 7.4, -8], [-24, 7, -14], 40), { cinf: 3 }),
  S_('shipsA', 943, 984, 'storm', C([42, 7.4, 10], [78, 10, -40], 50), C([46, 7.6, 8], [82, 11, -45], 46), { cinf: 0 }),
  S_('shipsB', 985, 1031, 'storm', C([72, 6.9, -10], [88, 8.2, -5], 46), C([74, 7.4, -3], [88, 8.5, -6], 40), { cinf: 2 }),
  S_('todo', 1032, 1089, 'grey', C([0, 6.9, 8], [0, 7.1, -1.5], 54), C([0, 6.9, 7], [0, 7.1, -1.5], 50), { cinf: 7 }),
  S_('admA', 1090, 1139, 'grey', C([0.4, 7.1, 5], [0, 7.1, -1], 34), C([0.2, 7.1, 4.2], [0, 7.1, -1], 30), { cinf: 8 }),
  S_('admB', 1140, 1187, 'grey', C([0.2, 7.3, 3.2], [0, 7.35, -1], 28), C([0.1, 7.3, 3.0], [0, 7.35, -1], 25), { cinf: 9 }),
  S_('admC', 1188, 1244, 'grey', C([0, 7.2, 6.6], [0.2, 7.0, -0.8], 50), C([0, 7.2, 5.8], [0.2, 7.0, -0.8], 46), { cinf: 8 }),
  S_('yearsA', 1245, 1304, ['day', 'gold', 'night'], C([0, 7.4, 9], [0, 7.1, -2], 60), C([0, 7.4, 8], [0, 7.1, -2], 56), { cinf: 5 }),
  S_('yearsB', 1305, 1361, ['night', 'dawn', 'day'], C([0, 7.5, 9], [0, 7.4, -2.5], 60), C([0, 7.6, 8], [0, 7.4, -2.5], 54), { cinf: 5 }),
  S_('eyesA', 1362, 1389, 'dawn', C([0.2, 7.3, 3.4], [0, 7.3, 0], 28), C([0.1, 7.3, 3.2], [0, 7.3, 0], 24), { cinf: 9 }),
  S_('eyesB', 1390, 1431, 'dawn', C([-0.2, 7.3, 3.4], [0, 7.3, 0], 28), C([-0.1, 7.3, 3.2], [0, 7.3, 0], 24), { cinf: 9 }),
  S_('sunrise', 1432, 1453, 'dawn', C([60, 6.9, -25], [100, 12, -60], 46), C([62, 7.2, -27], [100, 14, -62], 46), { cinf: 0 }),
  S_('judgeA', 1454, 1496, 'bright', C([0, 8.1, 3.6], [0, 6.9, -1.2], 38), C([0.3, 8.0, 2.8], [0, 6.95, -1.3], 34), { cinf: 7 }),
  S_('judgeB', 1497, 1539, 'bright', C([-1.6, 6.4, 3.5], [1.5, 10.5, -3], 52), C([-1.6, 6.5, 2], [1.6, 10.8, -3], 46), { cinf: 2 }),
  S_('graveA', 1540, 1579, 'night', C([1.0, 6.9, 6.0], [1.6, 6.7, -1.3], 36), C([1.4, 6.7, 3.4], [1.6, 6.65, -1.3], 30), { cinf: 7 }),
  S_('graveB', 1580, 1615, 'night', C([1.6, 6.6, 2.6], [1.6, 6.65, -1.3], 28), C([1.6, 6.5, 2.3], [1.6, 7.4, -1.3], 30), { cinf: 7 }),
  S_('reveal', 1616, 1643, 'bright', C([1.6, 7.4, 3.2], [1.6, 7.5, -1.3], 34), C([1.6, 7.5, 2.6], [1.6, 7.5, -1.3], 30), { cinf: 6 }),
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
export const smooth = M.smooth;
export { clamp };

export const LIGHTS = {
  day: { az: 130, el: 48, sky: '#c9d9f0', ground: '#8a8672', hemi: 1.12, sun: '#fff0dc', sunI: 2.4, fog: '#dde4ee', fogNear: 110, fogFar: 1100,
    skyTop: '#5a93d8', skyHor: '#dce6f2', sat: 1.1, waterDeep: '#2c6c8c', waterShal: '#5aaec4', glint: '#effaff', vig: 0.2, shadowExt: 26 },
  gold: { az: 24, el: 13, sky: '#9a90c8', ground: '#6a4c40', hemi: 1.0, sun: '#ffb878', sunI: 2.9, fog: '#f1c9a2', fogNear: 90, fogFar: 900,
    skyTop: '#7b78b8', skyHor: '#ffc99a', sunDisc: '#fff0c8', sunSize: 0.003, sat: 1.12, gain: '#fff2e2', waterDeep: '#3d5a86', waterShal: '#d99a6e', glint: '#ffe2a8', vig: 0.26, shadowExt: 26 },
  grey: { az: 130, el: 40, sky: '#aab4c2', ground: '#6a6a60', hemi: 1.05, sun: '#e8eaf0', sunI: 1.0, fog: '#b9c1cc', fogNear: 60, fogFar: 700,
    skyTop: '#7f8ea6', skyHor: '#c9d0da', sat: 0.82, waterDeep: '#3a5566', waterShal: '#6f8c9a', glint: '#cfd9e0', vig: 0.3, shadowExt: 26 },
  storm: { az: 130, el: 30, sky: '#5a6270', ground: '#3f4540', hemi: 0.85, sun: '#b8c4d8', sunI: 0.6, fog: '#59616e', fogNear: 40, fogFar: 520,
    skyTop: '#2c3446', skyHor: '#69727f', sat: 0.78, gain: '#e6eef8', waterDeep: '#1f3544', waterShal: '#42606e', glint: '#9fb4c4', vig: 0.38, rain: 1, shadowExt: 30 },
  night: { az: 200, el: 35, sky: '#3a4a78', ground: '#242a3e', hemi: 0.8, sun: '#8fa8e8', sunI: 1.1, fog: '#1c2440', fogNear: 50, fogFar: 600,
    skyTop: '#0c1230', skyHor: '#2a3a6a', sunDisc: '#e8f0ff', sunSize: 0.0016, sat: 0.9, gain: '#d8e4ff', waterDeep: '#0f1c3a', waterShal: '#27406a', glint: '#bcd0ff', vig: 0.4, shadowExt: 26 },
  dawn: { az: 319, el: 7, sky: '#c8a0b8', ground: '#7a5a58', hemi: 1.0, sun: '#ffb078', sunI: 2.6, fog: '#f0c0a8', fogNear: 70, fogFar: 800,
    skyTop: '#6a78b8', skyHor: '#ffc0a0', sunDisc: '#fff0c8', sunSize: 0.004, sat: 1.12, gain: '#fff0e0', waterDeep: '#4a5a88', waterShal: '#e0a888', glint: '#ffe0b0', vig: 0.26, shadowExt: 26 },
  bright: { az: 130, el: 58, sky: '#e8f0ff', ground: '#9a9680', hemi: 1.4, sun: '#fff4dc', sunI: 2.8, fog: '#eef2fa', fogNear: 120, fogFar: 1200,
    skyTop: '#62a2ee', skyHor: '#fff2dc', sat: 1.15, gain: '#fff8ea', waterDeep: '#2c7298', waterShal: '#66b8cc', glint: '#ffffff', vig: 0.18, shadowExt: 26 },
};
const hx = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mixHex = (a, b, t) => '#' + hx(a).map((v, i) => Math.round(lerp(v, hx(b)[i], t)).toString(16).padStart(2, '0')).join('');
const DEF = { gain: '#ffffff', lift: '#000000', sunDisc: '#000000', sunSize: 0, rain: 0 };
const mixL = (A, B, t) => { const o = {}; for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) {
  const a = A[k] ?? DEF[k], b = B[k] ?? DEF[k]; o[k] = typeof a === 'number' ? lerp(a, b, t) : typeof a === 'string' && a[0] === '#' ? mixHex(a, b, t) : a; } return o; };
export const lightFor = (S, f) => {
  if (!Array.isArray(S.light)) return { ...LIGHTS[S.light] };
  const n = S.light.length - 1, x = clamp((f - S.a) / (S.b - S.a)) * n, i = Math.min(n - 1, Math.floor(x));
  return mixL(LIGHTS[S.light[i]], LIGHTS[S.light[i + 1]], M.smooth(x - i));
};

// ---------- cameras ----------
const KEYS = SHOTS.flatMap((s) => [{ f: s.a, ...s.c0 }, { f: s.b, ...s.c1 }]);
const KICKS = [{ f: 466, a: 0.05 }, { f: 1000, a: 0.04 }, { f: 1009, a: 0.05 }, { f: 1019, a: 0.04 }, { f: 1616, a: 0.05 }];
export const camAt = (f) => {
  const c = camFromKeys(KEYS, f, { creep: 0.0004, kicks: KICKS });
  const flashes = [[48, 0.3, 4], [466, 0.75, 6], [485, 0.4, 4], [955, 0.55, 4], [972, 0.4, 3], [1000, 0.5, 4], [1009, 0.45, 4], [1019, 0.5, 4], [1032, 0.35, 4], [1454, 0.3, 4], [1616, 0.95, 9]];
  c.flash = 0; for (const [a, v, n] of flashes) if (f >= a && f < a + n) c.flash = Math.max(c.flash, v * (1 - (f - a) / n));
  const S = shotAt(f);
  c.shadowAt = [c.look[0], DECK + 1, c.look[2]];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const S = shotAt(f), C_ = camAt(f); return { focus: dist(C_.pos, C_.look), cinf: S.cinf ?? 8 }; };

// ---------- world state ----------
export const worldAt = (f) => {
  const W = { usT: 4, ukT: 4, cannons: f < 884 ? 0 : Math.min(14, (f - 884) / 2.2), t64: null, t420: f >= 837, tUK: f >= 943, ships: f >= 943, table: f >= 1454 && f < 1540, grave: f >= 1540, bigFlag: f >= 1497 && f < 1540 ? M.smooth(ramp(f, 1497, 1530)) : 0 };
  if (f >= 710) W.usT = Math.round(lerp(4, 14, ramp(f, 710, 745)));
  if (f >= 814) W.usT = Math.round(lerp(14, 20, ramp(f, 814, 880)));
  if (f >= 1000) W.ukT = 8;
  if (f >= 746 && f < 837) W.t64 = { x: lerp(-32, -14, M.smooth(ramp(f, 746, 813))) };
  return W;
};

// ---------- cast ----------
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const FXC = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
const walkPh = (f, f0, rate = 0.07) => q(((f - f0) * rate) % 1);
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  const tint = S.light === 'gold' ? '#ffe2c8' : '#ffffff';
  const A = (who, seed, o, pos, extra = {}) => { const id = idle(f, seed); out.push(R(T, who, { seed, blink: blinkAt(f, seed), bob: q(id.bob, 3), tilt: q(id.tilt, 1), headTilt: q(id.headTilt, 1), ...o }, pos, { tint, ...extra })); };
  const PG = (o, pos, extra = {}) => { const id = idle(f, 7); const oo = { blink: blinkAt(f, 7), bob: q(id.bob, 3), ...o }; out.push({ key: 'pig' + JSON.stringify(oo), draw: (p) => T.pigFront(p, oo), x: pos[0], y: pos[1], z: pos[2], tint, ...extra }); };
  const lying = (pos) => PG({ expr: 'dead' }, [pos[0], DECK + 0.3, pos[2]], { roll: 1.45, blob: false });
  const puff = (a, pos, s = 0.9) => { if (f >= a && f < a + 22) { const t = q(ramp(f, a, a + 22), 2); out.push(FXC('pf' + t, (p) => { p.g.translate(150, 700); p.g.scale(1.2, 1.2); T.fxPuff(p, t); }, pos, s)); } };
  const chew = q(0.5 + 0.5 * Math.sin(f * 0.55), 1);
  switch (S.id) {
    case 'hook': PG({ expr: 'eat', chew }, [0, DECK, 0]); break;
    case 'flags': PG({ expr: 'eat', chew }, [0, DECK, 0]); break;
    case 'year': out.push(FXC('board1859', (p) => T.fxBoard(p, '1859'), [-4.8, DECK, -2.4], 1.3, { blob: true, shadow: true, order: 2 })); break;
    case 'farmer': {
      A('cutlar', 3, { expr: f < 358 ? 'smile' : 'shock', L: 'belly', R: 'hip', look: 0.5 }, [-0.8, DECK, 0.2]);
      PG({ expr: 'eat', chew }, [0.8, DECK, -0.8]);
      if (f >= 362) out.push(FXC('excl', (p) => T.fxExcl(p), [-0.8, DECK + 2.25, 0.2], 0.4));
      break;
    }
    case 'eat': PG({ expr: 'eat', chew }, [0.6, DECK, -1.0]); break;
    case 'gun': {
      A('cutlarR', 3, { expr: f < 466 ? 'stubborn' : 'grin', L: 'hip', R: 'spear', look: 0 }, [0, DECK, 0]);
      if (f >= 466 && f < 474) { const t = q(ramp(f, 466, 474), 2); out.push(FXC('bang' + t, (p) => T.fxBang(p, t), [0.62, DECK + 1.65, 0.3], 0.7, { order: 6 })); }
      puff(468, [0.5, DECK + 1.2, 0.1], 0.6);
      break;
    }
    case 'dead': A('cutlar', 3, { expr: 'shock', L: 'cheek', R: 'cheek', look: 0.3 }, [-1.0, DECK, -0.6]); lying([0.5, 0, -0.6]); puff(485, [0, DECK, -0.6], 0.9); break;
    case 'hbc': {
      A('cutlar', 3, { expr: 'nervous', L: 'belly', R: 'belly', look: 0.5 }, [-1.4, DECK, -1.0], { s: 0.92 });
      A('hbc', 12, { expr: f < 530 ? 'stubborn' : 'shock', L: f > 520 ? 'point' : 'hang', R: 'hip', look: -0.5, facing: -1 }, [1.4, DECK, -1.0]);
      lying([0, 0, 0.2]); break;
    }
    case 'redA': {
      const k = clamp((f - 574) / 50);
      [[0.1, 0], [1.3, -0.7]].forEach(([x, dz], i) => A('gbS', 14 + i, { expr: 'stubborn', step: walkPh(f, 574 + i * 4, 0.07), L: 'hang', R: 'spear', look: 0 }, [x, DECK, lerp(-4.2, -0.4, M.smooth(k)) + dz]));
      lying([-1.3, 0, -0.5]); break;
    }
    case 'redB': {
      A('cutlar', 3, { expr: 'nervous', L: 'cheek', R: 'cheek', look: 0.6 }, [-0.8, DECK, 0]);
      A('gbS', 14, { expr: 'stubborn', L: 'point', R: 'spear', look: -0.5, facing: -1 }, [0.8, DECK, -0.8]);
      A('gbS', 15, { expr: 'stubborn', L: 'hang', R: 'spear', look: -0.5, facing: -1 }, [1.9, DECK, -1.2]);
      const t = ((f - 625) * 0.03) % 1; out.push(FXC('sw', (p) => T.fxDrip(p), [-1.2, DECK + 2.0 - t * 0.5, 0.1], 0.14)); break;
    }
    case 'usA': A('usO', 20, { expr: 'shock', L: 'hip', R: 'up', look: 0.2, wv: f * 0.4 }, [-33.3, DECK, -8]); break;
    case 't64': break;
    case 'todo': {
      A('usS', 22, { expr: 'stubborn', L: 'hang', R: 'spear', look: 0.7, facing: 1 }, [-2.2, DECK, -1.5]);
      A('gbS', 23, { expr: 'stubborn', L: 'hang', R: 'spear', look: -0.7, facing: -1 }, [2.2, DECK, -1.5]);
      lying([0, 0, 0.4]); break;
    }
    case 'admA': A('admiral', 30, { expr: 'stubborn', L: 'cross', R: 'cross', look: 0 }, [0, DECK, -1]); break;
    case 'admB': A('admiral', 30, { expr: 'stubborn', L: 'cross', R: 'cross', look: q(0.7 * Math.sin((f - 1140) * 0.5), 1), headTilt: q(7 * Math.sin((f - 1140) * 0.5), 1) }, [0, DECK, -1]); break;
    case 'admC': A('admiral', 30, { expr: 'squint', L: 'hip', R: 'point', look: 0.7, facing: 1 }, [-0.8, DECK, -0.8]); lying([1.1, 0, -0.3]); break;
    case 'yearsA': case 'yearsB': {
      [[-1.9, -1.6], [-3.1, -2.4]].forEach(([x, z], i) => A('usS', 22 + i, { expr: 'squint', L: 'hang', R: 'spear', look: 0.8, facing: 1 }, [x, DECK, z]));
      [[1.9, -1.6], [3.1, -2.4]].forEach(([x, z], i) => A('gbS', 24 + i, { expr: 'squint', L: 'hang', R: 'spear', look: -0.8, facing: -1 }, [x, DECK, z]));
      if (S.id === 'yearsB') out.push(FXC('b12', (p) => T.fxBoard(p, '12 AÑOS'), [0, DECK, -2.4], 1.15, { blob: true, shadow: true, order: 2 }));
      break;
    }
    case 'eyesA': A('usS', 22, { expr: 'squint', L: 'hang', R: 'spear', look: 0.8, facing: 1 }, [0, DECK, 0]); break;
    case 'eyesB': A('gbS', 24, { expr: 'squint', L: 'hang', R: 'spear', look: -0.8, facing: -1 }, [0, DECK, 0]); break;
    case 'judgeA': A('judge', 40, { expr: f < 1478 ? 'neutral' : 'smile', L: 'hip', R: f > 1474 ? 'up' : 'hip', look: 0 }, [0, DECK, -2.5]); break;
    case 'graveA': case 'graveB': out.push(FXC('cross', (p) => T.fxCross(p), [1.6, DECK, -1.3], 1.0, { blob: true, shadow: true, order: 2 })); break;
    case 'reveal': {
      const k = ramp(f, 1616, 1643), fl = Math.sin(f * 0.5);
      out.push(FXC('cross', (p) => T.fxCross(p), [1.6, DECK, -1.3], 1.0, { blob: true, shadow: true, order: 2 }));
      PG({ expr: 'angel', wing: q(0.5 + 0.5 * fl, 1) }, [1.6, DECK + 0.9 + M.back(clamp(k * 2)) * 0.6 + Math.sin(f * 0.15) * 0.05, -0.9], { blob: false, order: 4, alpha: clamp(k * 6) });
      break;
    }
  }
  return out;
};

// ---------- 2D effects ----------
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  const ids = ['hook', 'farmer', 'eat', 'gun', 'dead', 'hbc', 'redA', 'redB', 'todo', 'admA', 'admB', 'admC', 'year', 'usA', 'yearsA', 'yearsB'];
  if (ids.includes(S.id)) { const c = camAt(f);
    for (let i = 0; i < 5; i++) { const t = ((f * 0.006) + i / 5) % 1, cols = ['#d9a02b', '#c4852c', '#a9b83a'];
      out.push(FXC('leaf' + i % 3, (p) => T.fxLeaf(p, cols[i % 3]), [c.look[0] - 3 + t * 6 + Math.sin(i * 3.1) * 0.5, DECK + 3.2 - t * 3.1 + Math.sin(t * 9 + i) * 0.2, c.look[2] + 1.5 + i * 0.35], 0.1, { roll: q(t * 8 + i, 1) })); } }
  // gun flashes from the warship
  if (S.id === 'shipsB') for (const [a, i] of [[1000, 1], [1009, 3], [1019, 5]]) if (f >= a && f < a + 8) {
    const t = q(ramp(f, a, a + 8), 2), px = -8.5 + i * 2.5, th = 1.77, c = Math.cos(th), s = Math.sin(th);
    out.push(FXC('sb' + t, (p) => T.fxBang(p, t), [88 + px * c - 3 * s, 5.1 + 0.8 + 1.5, -5 - px * s - 3 * c], 1.4, { order: 6 }));
  }
  return out;
};
