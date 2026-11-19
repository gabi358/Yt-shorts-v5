// "La guerra de los emús" — timed to voice.mp3 (44.6 s, 1338 frames @ 30 fps).
import { camFromKeys, M, idle, blinkAt, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 1338, DECK = 6;
const S_ = (id, a, b, light, c0, c1, o = {}) => ({ id, a, b, light, c0, c1, ...o });
const C = (pos, look, fov, roll = 0) => ({ pos, look, fov, roll });
export const SHOTS = [
  S_('year', 0, 78, 'hot', C([2.5, 7.2, 3], [-1.2, 7.2, -4.5], 44), C([0.5, 7.3, 2], [-1.2, 7.4, -4.5], 38), { cinf: 6 }),
  S_('herd', 79, 130, 'hot', C([0, 34, 10], [0, 6, -30], 56), C([0, 30, 0], [0, 6, -30], 56), { cinf: 0 }),
  S_('eat', 131, 186, 'hot', C([0.3, 7.2, 5.2], [0, 7.1, -0.5], 44), C([0, 7.15, 4.2], [0, 7.1, -0.5], 40), { cinf: 8 }),
  S_('farmA', 187, 215, 'hot', C([0.3, 7.3, 3.4], [0, 7.3, 0], 28), C([0.2, 7.3, 3.2], [0, 7.3, 0], 24), { cinf: 9 }),
  S_('farmB', 216, 256, 'hot', C([-0.3, 7.3, 3.4], [0, 7.3, 0], 28), C([-0.2, 7.3, 3.2], [0, 7.3, 0], 24), { cinf: 9 }),
  S_('army', 257, 317, 'hot', C([0, 7.3, 6.4], [0, 7.1, -0.3], 50), C([0, 7.3, 5.6], [0, 7.1, -0.3], 46), { cinf: 7 }),
  S_('truckA', 318, 356, 'hot', C([2, 7.2, 7], [6, 7.6, -14], 44), C([2.5, 7.3, 4], [6, 7.6, -10], 44), { cinf: 3 }),
  S_('truckB', 357, 394, 'hot', C([0, 7.4, 7], [0.5, 7.5, -1.5], 50), C([0.4, 7.4, 6], [0.5, 7.5, -1.5], 46), { cinf: 6 }),
  S_('smugA', 395, 442, 'hot', C([0.4, 7.2, 4.4], [0, 7.15, 0], 36), C([0.3, 7.2, 4.0], [0, 7.15, 0], 32), { cinf: 9 }),
  S_('smugB', 443, 469, 'hot', C([0, 7.3, 6.5], [0, 7.2, 0], 56), C([0, 7.3, 6.0], [0, 7.2, 0], 54), { cinf: 6 }),
  S_('splitA', 470, 530, 'hot', C([0, 45, 10], [0, 6, -30], 58), C([0, 75, 10], [0, 6, -30], 58), { cinf: 0 }),
  S_('splitB', 531, 606, 'hot', C([0, 7.3, 8], [0, 7.2, -4], 52), C([0, 7.4, 7.4], [0, 7.2, -4], 52), { cinf: 4 }),
  S_('gunA', 607, 656, 'hot', C([-1.5, 7.6, 2.6], [0.6, 7.8, -3.6], 40), C([-1.2, 7.6, 2.2], [0.8, 7.8, -3.6], 40), { cinf: 6 }),
  S_('shells', 657, 712, 'hot', C([0, 6.7, 4.6], [0, 6.4, -1.5], 42), C([0, 6.9, 3.8], [0, 6.5, -1.5], 42), { cinf: 5 }),
  S_('taunt', 713, 766, 'hot', C([0, 7.2, 5.4], [0, 7.0, -0.8], 46), C([0.3, 7.2, 4.8], [0, 7.0, -0.8], 42), { cinf: 7 }),
  S_('majorA', 767, 825, 'hot', C([0.3, 7.3, 3.3], [0, 7.3, 0], 28), C([0.2, 7.3, 3.1], [0, 7.3, 0], 25), { cinf: 9 }),
  S_('majorB', 826, 885, 'hot', C([-0.3, 7.3, 3.3], [0, 7.3, 0], 28), C([-0.2, 7.3, 3.1], [0, 7.3, 0], 25), { cinf: 9 }),
  S_('majorC', 886, 935, 'hot', C([0, 7.0, 3.4], [0, 7.45, 0], 30), C([0.1, 7.0, 3.2], [0, 7.5, 0], 27), { cinf: 9 }),
  S_('armyAir', 936, 985, 'gold', C([0, 70, 5], [0, 6, -30], 60), C([0, 66, 0], [0, 6, -30], 60), { cinf: 0 }),
  S_('armyMarch', 986, 1053, 'gold', C([0, 6.8, 6.5], [0, 7.4, -1], 52), C([0, 7.0, 5.8], [0, 7.4, -1], 48), { cinf: 6 }),
  S_('truckAway', 1054, 1097, 'gold', C([2, 7.2, 6], [6, 7.6, -14], 44), C([2.5, 7.3, 4], [6, 7.6, -20], 40), { cinf: 3 }),
  S_('walkAway', 1098, 1148, 'gold', C([0, 7.2, 7], [0, 7.1, -1], 50), C([0.2, 7.2, 6.4], [0, 7.1, -1], 46), { cinf: 6 }),
  S_('crown', 1149, 1214, 'bright', C([0, 7.2, 5.8], [0, 7.2, -0.3], 44), C([0, 7.25, 5.0], [0, 7.2, -0.3], 38), { cinf: 7 }),
  S_('worry', 1215, 1247, 'hot', C([0.3, 7.3, 3.8], [0, 7.2, 0], 32), C([0.2, 7.3, 3.5], [0, 7.2, 0], 30), { cinf: 9 }),
  S_('fence', 1248, 1292, 'bright', C([0, 7.2, 1.5], [0, 7.0, -7], 48), C([0, 7.2, 0.5], [0, 7.0, -7], 44), { cinf: 4 }),
  S_('final', 1293, 1338, 'bright', C([0.2, 7.4, -0.5], [0.3, 7.3, -8], 34), C([0.3, 7.35, -2.5], [0.3, 7.3, -8], 28), { cinf: 8 }),
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
export const smooth = M.smooth;
export { clamp };
export const LIGHTS = {
  hot: { az: 140, el: 62, sky: '#ead3a8', ground: '#a88858', hemi: 1.2, sun: '#fff0c8', sunI: 2.8, fog: '#f2d7a8', fogNear: 120, fogFar: 1100,
    skyTop: '#4f95dc', skyHor: '#f6e2b4', sat: 1.15, gain: '#fff0d8', waterDeep: '#2c6c8c', waterShal: '#5aaec4', glint: '#effaff', vig: 0.24, shadowExt: 26 },
  gold: { az: 24, el: 13, sky: '#9a90c8', ground: '#6a4c40', hemi: 1.0, sun: '#ffb878', sunI: 2.9, fog: '#f1c9a2', fogNear: 90, fogFar: 900,
    skyTop: '#7b78b8', skyHor: '#ffc99a', sunDisc: '#fff0c8', sunSize: 0.003, sat: 1.12, gain: '#fff2e2', waterDeep: '#3d5a86', waterShal: '#d99a6e', glint: '#ffe2a8', vig: 0.26, shadowExt: 26 },
  bright: { az: 130, el: 58, sky: '#e8f0ff', ground: '#9a9680', hemi: 1.4, sun: '#fff4dc', sunI: 2.8, fog: '#eef2fa', fogNear: 120, fogFar: 1200,
    skyTop: '#62a2ee', skyHor: '#fff2dc', sat: 1.15, gain: '#fff8ea', waterDeep: '#2c7298', waterShal: '#66b8cc', glint: '#ffffff', vig: 0.18, shadowExt: 26 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });
const KICKS = [...Array(13)].map((_, i) => ({ f: 608 + i * 4, a: 0.03 })).concat([{ f: 1149, a: 0.04 }]);
export const camAt = (f) => {
  const c = camFromKeys(SHOTS.flatMap((s) => [{ f: s.a, ...s.c0 }, { f: s.b, ...s.c1 }]), f, { creep: 0.0004, kicks: KICKS });
  c.flash = 0;
  for (const [a, v, n] of [[1149, 0.8, 8], [1248, 0.25, 4]]) if (f >= a && f < a + n) c.flash = Math.max(c.flash, v * (1 - (f - a) / n));
  if (f >= 607 && f < 657 && f % 4 < 2) c.flash = Math.max(c.flash, 0.22);
  c.shadowAt = [c.look[0], DECK + 1, c.look[2]];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const S = shotAt(f), C_ = camAt(f); return { focus: dist(C_.pos, C_.look), cinf: S.cinf ?? 8 }; };
export const worldAt = (f) => {
  const W = { herd: null, army: null, truck: null, shells: f >= 657 && f <= 766, fence: f < 1248 ? 0 : Math.min(24, (f - 1248) / 82 * 24 + 0.01) };
  if (f >= 79 && f <= 130) W.herd = { x: lerp(-10, 8, ramp(f, 79, 130)), z: -30, spread: 6 };
  if (f >= 470 && f <= 530) W.herd = { x: 0, z: -30, spread: lerp(5, 24, ramp(f, 470, 590)) };
  if (f >= 936 && f <= 985) W.army = { x: 0, z: lerp(-70, -28, ramp(f, 936, 985)) };
  if (f >= 318 && f <= 356) W.truck = { x: 6, z: lerp(-30, -3, ramp(f, 318, 356)), ry: -Math.PI / 2 };
  else if ((f >= 357 && f <= 394) || (f >= 607 && f <= 766)) W.truck = { x: 2, z: -4, ry: 0 };
  else if (f >= 1054 && f <= 1097) W.truck = { x: 6, z: lerp(-3, -45, ramp(f, 1054, 1097)), ry: Math.PI / 2 };
  return W;
};
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const FXC = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  const tint = S.light === 'gold' ? '#ffe2c8' : '#ffffff';
  const A = (who, seed, o, pos, extra = {}) => { const id = idle(f, seed); out.push(R(T, who, { seed, blink: blinkAt(f, seed), bob: q(id.bob, 3), tilt: q(id.tilt, 1), headTilt: q(id.headTilt, 1), ...o }, pos, { tint, ...extra })); };
  const EM = (o, pos, seed = 5, extra = {}) => { const id = idle(f, seed); const oo = { blink: blinkAt(f, seed), bob: q(id.bob, 3), ...o }; out.push({ key: 'emu' + JSON.stringify(oo), draw: (p) => T.emuFront(p, oo), x: pos[0], y: pos[1], z: pos[2], s: 0.9, tint, ...extra }); };
  const chew = q(0.5 + 0.5 * Math.sin(f * 0.55), 1);
  const run = (rate = 0.045) => q((f * rate) % 1, 2);
  switch (S.id) {
    case 'year': out.push(FXC('board1932', (p) => T.fxBoard(p, '1932'), [-1.2, DECK, -4.5], 1.4, { blob: true, shadow: true, order: 2 })); break;
    case 'eat':
      EM({ expr: 'eat', wheat: true, step: 0 }, [0, DECK, -0.2]); EM({ expr: 'eat', wheat: true }, [-1.15, DECK, -1.4], 6); EM({ expr: 'eat', wheat: true }, [1.2, DECK, -1.8], 8); break;
    case 'farmA': A('farmA', 3, { expr: 'stubborn', L: 'hip', R: 'hip', look: 0.3 }, [0, DECK, 0]); break;
    case 'farmB': A('farmB', 4, { expr: 'stubborn', L: 'cross', R: 'cross', look: -0.3 }, [0, DECK, 0]); break;
    case 'army':
      A('farmA', 3, { expr: 'nervous', L: 'point', R: 'hip', look: 0.5 }, [-0.9, DECK, 0]); A('major', 9, { expr: 'neutral', L: 'hip', R: 'hip', look: -0.4, facing: -1 }, [0.9, DECK, -0.4]); break;
    case 'truckB':
      [[-0.9, 0.2], [0.2, -0.1], [1.1, 0.3]].forEach(([x, z], i) => A('aus', 10 + i, { expr: 'neutral', L: 'hang', R: 'spear', look: 0.2 }, [x, DECK, z])); break;
    case 'smugA': EM({ expr: 'smug', step: 0 }, [0, DECK, 0]); break;
    case 'smugB': [-1.4, 0, 1.4].forEach((x, i) => EM({ expr: 'smug' }, [x, DECK, i === 1 ? 0.4 : -0.2], 5 + i)); break;
    case 'splitB': {
      const k = (f - 531) / 75;
      [[-3.2, 3.2, 0, 1], [3.2, -3.2, -2, -1], [-2.5, 2.6, -5, 1], [2.8, -2.8, -8, -1]].forEach(([x0, x1, z0, d], i) => {
        const x = lerp(x0, x1, clamp(k + (i % 2) * 0.05)), z = z0 + Math.sin((f - 531) * 0.28 + i) * 0.7;
        EM({ expr: 'shock', step: q((f * 0.09 + i * 0.3) % 1, 2) }, [x, DECK, z], 5 + i, { roll: d * 0.1 });
      }); break;
    }
    case 'gunA': {
      A('aus', 10, { expr: 'shock', L: 'cheek', R: 'spear', look: 0.5 }, [-0.9, DECK, -0.6]); A('aus', 11, { expr: 'shock', L: 'cheek', R: 'cheek', look: 0.5 }, [0.0, DECK, -1.4]);
      if (f % 4 < 2) out.push(FXC('mz' + (f % 2), (p) => T.fxBang(p, f % 2), [1.95, DECK + 2.55, -3.6], 0.7, { order: 6 })); break;
    }
    case 'shells':
      A('aus', 10, { expr: 'squint', L: 'hang', R: 'spear', look: 0.4 }, [-0.6, DECK, -1.2]); A('aus', 11, { expr: 'nervous', L: 'cheek', R: 'cheek', look: -0.4 }, [0.7, DECK, -1.6]); break;
    case 'taunt':
      A('aus', 10, { expr: 'squint', L: 'hang', R: 'spear', look: 0.4 }, [-0.9, DECK, -1.8]); EM({ expr: 'smug', step: 0 }, [0.5, DECK, -0.2]); break;
    case 'majorA': A('major', 9, { expr: 'shock', L: 'hip', R: 'point', look: 0 }, [0, DECK, 0]); break;
    case 'majorB': A('major', 9, { expr: 'stubborn', L: 'cross', R: 'cross', look: 0 }, [0, DECK, 0]); break;
    case 'majorC': A('major', 9, { expr: 'grin', L: 'hip', R: 'up', look: 0, wv: f * 0.3 }, [0, DECK, 0]); break;
    case 'armyMarch': {
      const k = ramp(f, 986, 1053);
      [[-1.3, -3], [0, -1.8], [1.3, -3]].forEach(([x, z0], i) => EM({ expr: 'smug', helmet: true, step: run(0.06) }, [x, DECK, lerp(z0, z0 + 3.5, k)], 5 + i));
      break;
    }
    case 'walkAway': {
      const k = ramp(f, 1098, 1148);
      [0, 1, 2].forEach((i) => A('aus', 10 + i, { expr: 'nervous', step: q((f * 0.07 + i * 0.3) % 1, 2), L: 'hang', R: 'spear', look: 0.8, facing: 1 }, [lerp(-3.5 - i * 0.8, 3.0 - i * 0.8, k), DECK, -0.4 - i * 0.5]));
      EM({ expr: 'happy' }, [1.6, DECK, -3.5], 5); break;
    }
    case 'crown': {
      EM({ expr: 'happy', crown: true, sash: true }, [0, DECK, -0.2]); EM({ expr: 'happy', helmet: true }, [-1.5, DECK, -1.2], 6); EM({ expr: 'happy', helmet: true }, [1.5, DECK, -1.2], 7); break;
    }
    case 'worry': A('farmA', 3, { expr: 'shock', L: 'cheek', R: 'cheek', look: 0 }, [0, DECK, 0]); break;
    case 'fence':
      A('farmA', 3, { expr: 'grin', L: 'point', R: 'hip', look: 0.4 }, [-1.0, DECK, -3.6]); A('farmB', 4, { expr: 'grin', L: 'hip', R: 'hip', look: -0.3 }, [1.0, DECK, -3.2]); break;
    case 'final':
      out.push(FXC('boardP', (p) => T.fxBoard(p, 'PREMIO'), [-0.8, DECK, -4.4], 1.0, { blob: true, shadow: true, order: 2 }));
      EM({ expr: 'eat', wheat: true, crown: true }, [0.4, DECK, -8.4], 5); break;
  }
  return out;
};
export const fxAt = (f, T) => {
  const out = [];
  if (f >= 1149 && f <= 1214) for (let i = 0; i < 9; i++) { const t = (((f - 1149) * 0.014) + i / 9) % 1, cols = ['#ff6b9a', '#ffd84a', '#5fb8ff', '#8ee06a'];
    out.push(FXC('cf' + i % 4, (p) => T.fxLeaf(p, cols[i % 4]), [-1.4 + (i * 0.37) % 2.8, DECK + 3.6 - t * 3.4, 4.6 - i * 0.12], 0.12, { roll: t * 9 + i })); }
  return out;
};
