// "El hombre que vendió la Torre Eiffel" — timed to voice.mp3 (45.95 s, 1378 frames @ 30 fps). No captions.
import { camFromKeys, M, idle, blinkAt, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 1378, DECK = 6, IX = 90;
export const SHOTS = [
  { id: 'hook', a: 0, b: 73, light: 'day' },
  { id: 'wide', a: 74, b: 127, light: 'day' },
  { id: 'paris', a: 128, b: 217, light: 'day' },
  { id: 'rust', a: 218, b: 290, light: 'gold' },
  { id: 'mayor', a: 291, b: 347, light: 'gold' },
  { id: 'read', a: 348, b: 504, light: 'day' },
  { id: 'official', a: 505, b: 589, light: 'day' },
  { id: 'arrive', a: 590, b: 673, light: 'day' },
  { id: 'secret', a: 674, b: 801, light: 'salon' },
  { id: 'poisson', a: 802, b: 864, light: 'day' },
  { id: 'outsider', a: 865, b: 972, light: 'day' },
  { id: 'deal', a: 973, b: 1055, light: 'salon' },
  { id: 'vanish', a: 1056, b: 1130, light: 'day' },
  { id: 'shame', a: 1131, b: 1260, light: 'day' },
  { id: 'back', a: 1261, b: 1326, light: 'day' },
  { id: 'again', a: 1327, b: 1377, light: 'salon' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
export const smooth = M.smooth;
export { clamp };

export const LIGHTS = {
  day: { az: 130, el: 48, sky: '#c9d9f0', ground: '#8a8672', hemi: 1.12, sun: '#fff0dc', sunI: 2.4, fog: '#dde4ee', fogNear: 110, fogFar: 1100,
    skyTop: '#5a93d8', skyHor: '#dce6f2', sat: 1.1, waterDeep: '#2c6c8c', waterShal: '#5aaec4', glint: '#effaff', vig: 0.2, shadowExt: 22 },
  gold: { az: 24, el: 13, sky: '#9a90c8', ground: '#6a4c40', hemi: 1.0, sun: '#ffb878', sunI: 2.9, fog: '#f1c9a2', fogNear: 90, fogFar: 900,
    skyTop: '#7b78b8', skyHor: '#ffc99a', sunDisc: '#fff0c8', sunSize: 0.003, sat: 1.12, gain: '#fff2e2', waterDeep: '#3d5a86', waterShal: '#d99a6e', glint: '#ffe2a8', vig: 0.26, shadowExt: 24 },
  salon: { az: 205, el: 42, sky: '#e8dcc8', ground: '#8a7a62', hemi: 1.3, sun: '#ffe6c0', sunI: 1.9, fog: '#e8dcc8', fogNear: 200, fogFar: 900,
    skyTop: '#7aa4d8', skyHor: '#dce6f2', sat: 1.08, gain: '#fff0dc', waterDeep: '#2c6c8c', waterShal: '#5aaec4', glint: '#effaff', vig: 0.28, shadowExt: 12 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });

// ---------- cameras ----------
const L0 = [0, DECK, 0];
const cx = (x) => IX + x;
const SECRET_C = [cx(-0.1), 7.5, -0.5];
const KEYS = [
  // hook MCU -> pull back through the street to the tower
  { f: 0, pos: [2.1, 7.45, 1.6], look: [0, 7.3, 0], fov: 34 },
  { f: 52, pos: [2.0, 7.45, 1.45], look: [0, 7.3, 0], fov: 33 },
  { f: 110, pos: [-2, 12, 58], look: [0, 62, -95], fov: 60, path: [[1.5, 8, 18]] },
  { f: 127, pos: [-2.2, 12.2, 57], look: [0, 62, -95], fov: 59.5 },
  // paris: crane over the avenue
  { f: 128, pos: [-13, 9, 24], look: [0, 38, -80], fov: 52 },
  { f: 217, pos: [-2, 36, 58], look: [0, 42, -95], fov: 48 },
  // rust: low angle at the tower foot, tilting up
  { f: 218, pos: [0, 7.5, -60], look: [0, 40, -95], fov: 58 },
  { f: 290, pos: [-4, 7.6, -68], look: [2, 62, -95], fov: 50 },
  // mayor close-up
  { f: 291, pos: [2.8, 7.4, -69.2], look: [1.4, 7.3, -72], fov: 34 },
  { f: 347, pos: [2.5, 7.38, -69.6], look: [1.4, 7.3, -72], fov: 31 },
  // cafe: Lustig reads the paper
  { f: 348, pos: [8.7, 7.55, 1.3], look: [8.9, 7.3, -2.6], fov: 38 },
  { f: 420, pos: [8.75, 7.5, 0.7], look: [8.9, 7.3, -2.6], fov: 34 },
  { f: 504, pos: [8.95, 7.42, -0.4], look: [8.9, 7.32, -2.6], fov: 30, roll: -2 },
  // official: sash appears in front of the hotel
  { f: 505, pos: [-3.8, 7.6, -11.4], look: [-8.5, 7.3, -14], fov: 36 },
  { f: 589, pos: [-4.4, 7.5, -12.2], look: [-8.5, 7.35, -14], fov: 32 },
  // arrive: six dealers hurry to the hotel
  { f: 590, pos: [-3, 7.9, -1], look: [-8.5, 7, -13], fov: 44 },
  { f: 673, pos: [-4.5, 7.7, -8.5], look: [-8.5, 7, -16], fov: 38 },
  // secret: the salon
  { f: 674, pos: [cx(-0.1), 7.6, 5.9], look: SECRET_C, fov: 34 },
  { f: 740, pos: [cx(0.5), 7.6, 5.7], look: [cx(0.5), 7.5, -0.5], fov: 33 },
  { f: 801, pos: [cx(1.0), 7.55, 5.2], look: [cx(1.0), 7.45, -0.5], fov: 31, roll: 2 },
  // poisson close up
  { f: 802, pos: [-5.7, 7.35, -7.6], look: [-8.3, 7.3, -9], fov: 33 },
  { f: 864, pos: [-6.0, 7.3, -7.9], look: [-8.3, 7.28, -9], fov: 31 },
  // outsider
  { f: 865, pos: [-4.3, 7.7, -4.6], look: [-8.3, 7.15, -9.5], fov: 42 },
  { f: 972, pos: [-5.3, 7.5, -6.2], look: [-8.5, 7.2, -9.5], fov: 36 },
  // deal
  { f: 973, pos: [cx(0.05), 7.65, 7.4], look: [cx(0.05), 7.5, -0.4], fov: 34 },
  { f: 1055, pos: [cx(0.05), 7.6, 6.6], look: [cx(0.05), 7.45, -0.4], fov: 31 },
  // vanish
  { f: 1056, pos: [1.5, 7.6, 2.8], look: [-0.5, 7.2, -3], fov: 38 },
  { f: 1130, pos: [0.8, 9.0, 4.2], look: [-0.5, 6.6, -3], fov: 44 },
  // shame at the cafe
  { f: 1131, pos: [8.9, 7.5, 3.8], look: [8.9, 7.3, -2.5], fov: 36 },
  { f: 1260, pos: [8.9, 7.4, 3.3], look: [8.9, 7.3, -2.5], fov: 33 },
  // back to Paris: Lustig walks up the avenue
  { f: 1261, pos: [0, 7.3, 2], look: [0, 11, -40], fov: 42 },
  { f: 1326, pos: [0, 7.3, 0.4], look: [0, 8.5, -40], fov: 38 },
  // again
  { f: 1327, pos: [cx(-0.1), 7.6, 5.9], look: SECRET_C, fov: 34 },
  { f: 1377, pos: [cx(-0.7), 7.55, 4.6], look: [cx(-0.8), 7.45, -0.4], fov: 28 },
];
const KICKS = [{ f: 100, a: 0.03 }, { f: 1019, a: 0.04 }, { f: 1088, a: 0.05 }, { f: 1198, a: 0.03 }, { f: 1374, a: 0.03 }];
export const camAt = (f) => {
  const c = camFromKeys(KEYS, f, { creep: 0.0004, kicks: KICKS });
  const flashes = [[128, 0.5, 5], [218, 0.4, 4], [505, 0.35, 4], [1056, 0.3, 4], [1088, 0.8, 7], [1261, 0.55, 6], [1327, 0.35, 4]];
  c.flash = 0; for (const [a, v, n] of flashes) if (f >= a && f < a + n) c.flash = Math.max(c.flash, v * (1 - (f - a) / n));
  const S = shotAt(f);
  c.shadowAt = S.light === 'salon' ? [cx(0.5), DECK + 1, 0] : [c.look[0], DECK + 1, Math.max(-100, c.look[2] > -60 ? c.look[2] : -70)];
  if (S.id === 'hook' || S.id === 'wide' || S.id === 'paris') c.shadowAt = [0, DECK, -8];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const FOCUS = { hook: [0, 7.3, 0], read: [8.9, 7.3, -2.6], official: [-8.5, 7.3, -14], poisson: [-8.3, 7.3, -9], outsider: [-8.3, 7.2, -9.5], mayor: [1.4, 7.3, -72], shame: [8.9, 7.3, -2.5], vanish: [-0.5, 7.3, -3], back: [0, 7.3, -4], secret: [cx(0.6), 7.3, -0.6], deal: [cx(0.1), 7.3, -0.4], again: [cx(0.0), 7.3, -0.4] };
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  switch (S.id) {
    case 'hook': return { focus: dist(C.pos, FOCUS.hook), cinf: lerp(12, 0, smooth(ramp(f, 20, 60))) };
    case 'wide': case 'paris': return { focus: 80, cinf: 0 };
    case 'rust': return { focus: 60, cinf: 2 };
    case 'arrive': return { focus: dist(C.pos, [-8.5, 7, -14]), cinf: 3 };
    case 'read': return { focus: dist(C.pos, FOCUS.read), cinf: 11 };
    case 'secret': case 'again': case 'deal': return { focus: dist(C.pos, FOCUS[S.id]), cinf: 10 };
    default: return { focus: dist(C.pos, FOCUS[S.id] || [0, 7.3, 0]), cinf: 10 };
  }
};
export const worldAt = (f) => {
  const W = { mini: null };
  const tpop = (a, s0) => { const t = M.back(ramp(f, a, a + 16)); return { x: cx(0.15), y: DECK + 0.94, z: 1.0, s: s0 * t, ry: f * 0.03 }; };
  if (f >= 706 && f < 802) W.mini = tpop(706, 0.0075);
  if (f >= 1352 && f < 1378) W.mini = tpop(1352, 0.0075);
  return W;
};

// ---------- cast ----------
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const FXC = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
const walkPh = (f, f0, rate = 0.07) => q(((f - f0) * rate) % 1);
const dealers = ['dA', 'dB', 'dC', 'dD', 'dE', 'dF'], guests = ['gA', 'gB', 'gC', 'gD', 'gE', 'gF'];
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  const tint = S.light === 'gold' ? '#ffe2c8' : '#ffffff';
  const A = (who, seed, o, pos, extra = {}) => { const id = idle(f, seed); out.push(R(T, who, { seed, blink: blinkAt(f, seed), bob: q(id.bob, 3), tilt: q(id.tilt, 1), headTilt: q(id.headTilt, 1), ...o }, pos, { tint, ...extra })); };
  const lust = (o, pos, extra) => A('lustig', 3, o, pos, extra);
  switch (S.id) {
    case 'hook': lust({ expr: f < 20 ? 'smile' : 'grin', look: f < 40 ? 0 : 0.3, L: 'belly', R: 'hip' }, L0); break;
    case 'wide': {
      lust({ expr: 'grin', L: 'hip', R: 'up', look: 0.2 }, L0);
      // second Lustig pops in beside the first on "Dos veces"
      if (f >= 80) { const t = M.back(ramp(f, 80, 96)); out.push(R(T, 'lustigB', { seed: 3, expr: 'grin', blink: 0, L: 'up', R: 'hip', facing: 0 }, [2.2, DECK, 0.6], { tint, s: t, alpha: clamp(t * 2) })); }
      break;
    }
    case 'paris': break;
    case 'rust': break;
    case 'mayor': {
      const sweat = f > 310;
      A('mayor', 5, { expr: f < 316 ? 'shock' : 'nervous', L: 'belly', R: f > 322 ? 'cheek' : 'hip', look: 0 }, [1.4, DECK, -72], { tint });
      break;
    }
    case 'read': {
      const paperDown = ramp(f, 424, 446);
      lust({ expr: f < 428 ? 'neutral' : 'grin', L: 'belly', R: 'belly', look: f < 428 ? -0.2 : 0 }, [8.9, DECK, -2.6]);
      if (paperDown < 1) out.push({ key: 'news', draw: (p) => T.fxNews(p), x: 8.9, y: DECK + 0.1 - paperDown * 0.9, z: -2.15, s: 0.95, blob: false, shadow: false, order: 4 });
      if (f >= 438) { const t = q(ramp(f, 438, 470), 2); out.push(FXC('spark' + t, (p) => { p.g.translate(150, 300); T.fxStars(p, t); }, [8.9, DECK + 1.9, -2.5], 0.6)); }
      break;
    }
    case 'official': {
      const pos = [-8.5, DECK, -14];
      const dressed = f >= 520;
      lust({ expr: dressed ? 'stubborn' : 'neutral', L: dressed ? 'hip' : 'hang', R: dressed ? 'hip' : 'hang', look: 0.1, nolook: 1 }, pos, { yaw: 0 });
      // swap the character's outfit key: official sash is the "toga" band of the lustig outfit
      if (f >= 514 && f < 534) { const t = q(ramp(f, 514, 534), 2); out.push(FXC('puffS' + t, (p) => { p.g.translate(150, 700); p.g.scale(1.1, 1.1); T.fxPuff(p, t); }, [-8.3, DECK, -13.8], 0.7)); }
      break;
    }
    case 'arrive': {
      const prog = (f - 590);
      dealers.forEach((d, i) => {
        const z0 = -9 + i * 1.0, zt = -16.2 + i * 0.85, z = Math.max(zt, z0 - prog * 0.095);
        const moving = z > zt + 0.01;
        A(d, 10 + i, { expr: moving ? 'smile' : 'grin', step: moving ? walkPh(f, 590 + i * 3, 0.09) : 0, facing: -1, L: 'hang', R: 'hang', look: -0.3 }, [-8.1 + (i % 2) * 0.35, DECK, z]);
      });
      lust({ expr: 'grin', L: 'wave', R: 'hip', wv: f * 0.4, look: -0.4 }, [-8.4, DECK, -18.4]);
      break;
    }
    case 'secret': case 'again': {
      const again = S.id === 'again';
      const names = again ? guests : dealers;
      const pos = [[0.1, -0.3], [0.85, -0.3], [1.6, -0.3], [0.5, -1.3], [1.25, -1.3], [2.0, -1.3]];
      const lean = again ? 0 : ramp(f, 680, 720);
      names.forEach((n, i) => {
        const e = (!again && f < 770) ? (f < 705 ? 'neutral' : 'nervous') : 'grin';
        A(n, 20 + i, { expr: again && f < 1345 ? 'neutral' : e, L: 'hang', R: 'hang', look: -0.5, headTilt: q(-4 * lean + 2 * Math.sin(f * 0.1 + i), 1) }, [cx(pos[i][0]), DECK, pos[i][1]], { order: i > 2 ? 1 : 2 });
      });
      const talk = again ? f >= 1340 : f >= 706;
      lust({ expr: 'smile', L: talk ? 'point' : 'cheek', R: 'hip', look: 0.5 }, [cx(-0.95), DECK, -0.5]);
      break;
    }
    case 'poisson': {
      A('poisson', 30, { expr: 'nervous', L: 'belly', R: 'belly', look: 0.5 + 0.3 * Math.sin(f * 0.12), headTilt: q(-4 + 3 * Math.sin(f * 0.15), 1) }, [-8.3, DECK, -9]);
      break;
    }
    case 'outsider': {
      A('poisson', 30, { expr: 'nervous', L: 'belly', R: 'belly', look: 0.6, headTilt: q(5, 1) }, [-9.2, DECK, -9.4], { s: 0.9 });
      const p0 = f - 865;
      guests.slice(0, 3).forEach((n, i) => {
        const z = -2 - i * 1.7 - p0 * 0.045 - (i % 2) * 0.4;
        A(n, 40 + i, { expr: 'stubborn', step: walkPh(f, 865 + i * 5, 0.045), facing: 1, L: i % 2 ? 'cross' : 'hang', R: 'hang', look: 0.8, headTilt: q(8, 1) }, [-6.9 - (i % 2) * 0.5, DECK, z], { s: 1.08 });
      });
      break;
    }
    case 'deal': {
      const t = ramp(f, 996, 1030);
      lust({ expr: f < 1030 ? 'smile' : 'grin', L: 'hip', R: f >= 1030 ? 'hip' : 'reach', look: 0.2 }, [cx(-0.8), DECK, -0.4]);
      A('poisson', 30, { expr: f < 1030 ? 'nervous' : 'smile', L: 'hang', R: 'hang', look: -0.3 }, [cx(0.9), DECK, -0.4]);
      const x = lerp(cx(0.5), cx(-0.5), M.smooth(t)), y = DECK + 0.2 + Math.sin(t * Math.PI) * 0.12;
      out.push({ key: 'case' + (f > 1010 ? 1 : 0), draw: (p) => T.fxCase(p, f > 1010 ? 0 : 1), x, y, z: -0.2, s: 0.9, blob: false, shadow: false, order: 4 });
      if (f >= 1030) { const k = q(ramp(f, 1030, 1052), 2); out.push(FXC('spk' + k, (p) => { p.g.translate(150, 300); T.fxStars(p, k); }, [cx(-0.8), DECK + 1.8, -0.4], 0.5)); }
      break;
    }
    case 'vanish': {
      const poof = 1088;
      const wk = clamp((f - 1056) / 32);
      if (f < poof) {
        const x = lerp(-1.6, -0.4, wk), z = lerp(-4.5, -2.6, wk);
        lust({ expr: 'grin', step: walkPh(f, 1056, 0.1), L: f > 1076 ? 'wave' : 'hang', R: 'hang', wv: f * 0.5, look: 0 }, [x, DECK, z]);
        out.push({ key: 'case0', draw: (p) => T.fxCase(p, 0), x: x + 0.55, y: DECK - 0.15, z: z + 0.05, s: 0.6, blob: false, shadow: true, order: 3 });
      } else {
        const t = q(ramp(f, poof, poof + 24), 2);
        out.push(FXC('poof' + t, (p) => { p.g.translate(150, 700); p.g.scale(1.3, 1.3); T.fxPuff(p, t); }, [-0.4, DECK, -2.6], 1.0));
        if (f >= poof + 2 && f < poof + 18) out.push(FXC('spkv' + t, (p) => { p.g.translate(150, 300); T.fxStars(p, t); }, [-0.4, DECK + 1.5, -2.6], 0.7));
        // one banknote flutters down
        const k = clamp((f - poof) / 40);
        out.push(FXC('bill', (p) => T.fxBill(p), [-0.4 + Math.sin(k * 9) * 0.45, DECK + 2.4 - k * 2.3, -2.4], 0.18, { roll: q(Math.sin(k * 9) * 0.6, 2) }));
      }
      break;
    }
    case 'shame': {
      const up = f < 1190 ? 0 : ramp(f, 1190, 1204);
      A('poisson', 30, { expr: f < 1235 ? 'nervous' : 'neutral', L: f > 1205 && f < 1235 ? 'wave' : 'belly', R: 'belly', wv: f * 0.6, look: f > 1195 && f < 1235 ? -0.7 : 0.2 }, [8.9, DECK, -2.5]);
      if (f < 1245) out.push({ key: 'news', draw: (p) => T.fxNews(p), x: 8.9, y: DECK + 0.45 - up * 0.2 - ramp(f, 1236, 1250) * 1.2, z: -2.0, s: 1.1, blob: false, shadow: false, order: 4 });
      if (f >= 1150) { const t = ((f - 1150) * 0.03) % 1; out.push(FXC('sw', (p) => T.fxDrip(p), [8.55, DECK + 2.1 - t * 0.5, -2.2], 0.14)); }
      const cp = clamp((f - 1190) / 52);
      if (f >= 1190 && f < 1245) A('cop', 50, { expr: f < 1235 ? 'smile' : 'neutral', step: walkPh(f, 1190, 0.08), facing: -1, L: f > 1205 && f < 1230 ? 'wave' : 'hang', R: 'hang', wv: f * 0.5, look: 0 }, [lerp(6.7, 11.6, cp), DECK, -0.6], { s: 1.05 });
      break;
    }
    case 'back': {
      const prog = clamp((f - 1261) / 66), z = lerp(-9, -2.2, M.smooth(prog));
      if (f >= 1263) lust({ expr: 'grin', step: walkPh(f, 1263, 0.09), L: 'hang', R: 'hang', look: 0 }, [0, DECK, z]);
      if (f >= 1261 && f < 1285) { const t = q(ramp(f, 1261, 1285), 2); out.push(FXC('puffb' + t, (p) => { p.g.translate(150, 700); p.g.scale(1.2, 1.2); T.fxPuff(p, t); }, [0, DECK, -9], 0.9)); }
      break;
    }
  }
  return out;
};

// ---------- 2D effects ----------
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  const outdoor = !['secret', 'deal', 'again'].includes(S.id);
  if (outdoor && S.id !== 'wide' && S.id !== 'paris') { // leaves drifting through the avenue
    for (let i = 0; i < 6; i++) { const t = ((f * 0.006) + i / 6) % 1, cols = ['#d9a02b', '#c4852c', '#a9b83a'];
      const base = S.id === 'rust' || S.id === 'mayor' ? [0, -68] : S.id === 'read' || S.id === 'shame' ? [8.9, -2.5] : S.id === 'official' || S.id === 'arrive' || S.id === 'poisson' || S.id === 'outsider' ? [-8, -12] : [0, -2];
      out.push(FXC('leaf' + i % 3, (p) => T.fxLeaf(p, cols[i % 3]), [base[0] - 3 + t * 6 + Math.sin(i * 3.1) * 0.5, DECK + 3.2 - t * 3.1 + Math.sin(t * 9 + i) * 0.2, base[1] + 1.5 + i * 0.35], 0.1, { roll: q(t * 8 + i, 1) })); } }
  if (S.id === 'rust' || S.id === 'mayor') { // rust flakes falling from the tower
    for (let i = 0; i < 7; i++) { const t = ((f * 0.012) + i / 7) % 1; const x = -4 + i * 1.5 + Math.sin(i * 5.2) * 0.8; out.push(FXC('rf' + i % 2, (p) => T.fxRust(p), [x, DECK + 12 - t * 12, -64 - (i % 3) * 1.5], 0.16, { roll: q(t * 6, 1) })); } }
  return out;
};
