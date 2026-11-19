FACE.snore = { eye: ["dash", "dash"], brow: [0, -1], mouth: "o" };
FACE.stubborn = { eye: ["lid", "lid"], brow: [4, -3], mouth: "frown" };
FACE.squint = { eye: ["slit", "slit"], brow: [3, -2], mouth: "dash" };

// ---------------- Roman-era cast (our own designs), built on the Pen / blob / face helpers above ----------------
const STEEL = "#aeb6bf", BRASS = "#d9a845", LEATHER = "#7a4a2a";
export const OUTFITS = {
  legion: { tunic: "#b8322f", cape: "#8f2228", skin: SKIN, helmet: true, armor: true, spear: true, shield: true },
  old: { tunic: "#9c4a3c", cape: "#6e3330", skin: "#f3d6bb", helmet: "old", armor: true, spear: true, shield: false, beard: "#f4f1ea", brows: "#f4f1ea" },
  toga: { tunic: "#f1ead8", skin: "#f5c9a0", toga: "#6b3c8f", hair: "#3b2a20", stout: true },
  lustig: { tunic: "#262c3f", skin: "#f6d3b3", tophat: true, moustache: "#2a1f1c", toga: "#7a1f2b" },
  lustigB: { tunic: "#262c3f", skin: "#f6d3b3", tophat: true, moustache: "#2a1f1c" },
  poisson: { tunic: "#6e4b36", skin: "#f0c8a2", cap: "#8a7a58", moustache: "#3a2a20", stout: true },
  mayor: { tunic: "#3a4a5e", skin: "#f3d0ae", tophat: true, stout: true, moustache: "#6a6a6a", toga: "#2d5fb3" },
  cop: { tunic: "#27406e", skin: "#efc9a4", cap: "#1d2c52", moustache: "#2a2018" },
  dA: { tunic: "#4a4f5a", skin: "#f5c9a0", cap: "#5a4a3a" },
  dB: { tunic: "#7a3b3b", skin: "#e8c39e", cap: "#2f3b4a", moustache: "#3a2a20", stout: true },
  dC: { tunic: "#3f5a4a", skin: "#d9a67e", hair: "#2a1e18" },
  dD: { tunic: "#6a6a72", skin: "#f5c9a0", cap: "#8a7a5a", moustache: "#5a4a3a" },
  dE: { tunic: "#8a6a3a", skin: "#f0cba8", hair: "#5a3b2a", stout: true },
  dF: { tunic: "#3a3a52", skin: "#e9c4a0", cap: "#6a3a3a" },
  gA: { tunic: "#5a3a6a", skin: "#f5c9a0", cap: "#3a5a6a", moustache: "#2a2018" },
  gB: { tunic: "#2f6a6a", skin: "#e8c39e", hair: "#1e1714", stout: true },
  gC: { tunic: "#8a4a2a", skin: "#f0cba8", cap: "#4a4a4a" },
  gD: { tunic: "#4a5a2a", skin: "#d9a67e", cap: "#7a6a4a", moustache: "#2a2018" },
  gE: { tunic: "#6a2a3a", skin: "#f5c9a0", hair: "#3a2a20" },
  gF: { tunic: "#2a4a7a", skin: "#e9c4a0", cap: "#8a6a3a", stout: true },
  civA: { tunic: "#4f7fb8", skin: "#f5c9a0", hair: "#5a3b2a" },
  civB: { tunic: "#d9a441", skin: SKIN, hair: "#2b211c", dress: "#c25a7a" },
  civC: { tunic: "#5d8a3a", skin: "#c99067", hair: "#1e1714", stout: true },
  workA: { tunic: "#8a5d3b", skin: "#f5c9a0", cap: "#c2733a", apron: "#d8c9a6" },
  workB: { tunic: "#3f6a6f", skin: "#ecd0b6", cap: "#5b4a8a", moustache: "#4a3020" },
  // ---- Emu War cast ----
  aus: { tunic: "#8a7440", skin: "#f0c8a2", cap: "#6b5a2e", moustache: "#4a3322", spear: true, rifle: true, toga: "#5a4a28" },
  major: { tunic: "#7a6a3a", skin: "#f3d0ae", cap: "#6b5a2e", moustache: "#3a2a20", stout: true, toga: "#d9a845" },
  farmA: { tunic: "#5a7a9a", skin: "#f0c8a2", cap: "#d9c27a", moustache: "#4a3322", apron: "#8a6a45", toga: "#d9a845" },
  farmB: { tunic: "#9a5040", skin: "#e8c39b", cap: "#c9b070", moustache: "#8a8a86", stout: true, apron: "#7a6a4a" },
  // ---- Pig War cast ----
  cutlar: { tunic: "#8a6a3a", skin: "#f0c8a2", cap: "#d9c27a", moustache: "#4a3322", stout: true, apron: "#b9a679" },
  cutlarR: { tunic: "#8a6a3a", skin: "#f0c8a2", cap: "#d9c27a", moustache: "#4a3322", stout: true, apron: "#b9a679", spear: true, rifle: true },
  usS: { tunic: "#2f4a8a", skin: "#f3d0ae", cap: "#1f2f5a", moustache: "#5a3a22", spear: true, rifle: true, toga: "#e9e4d2" },
  usO: { tunic: "#2a3f78", skin: "#f3d0ae", cap: "#1f2f5a", moustache: "#2a2018", toga: "#d9a845", stout: true },
  gbS: { tunic: "#c22a2e", skin: "#f5c9a0", tophat: true, spear: true, rifle: true, toga: "#f1ede0" },
  admiral: { tunic: "#22386a", skin: "#f0c8a2", cap: "#eeeae0", moustache: "#e8e4dc", brows: "#e8e4dc", toga: "#d9a845", stout: true },
  judge: { tunic: "#1c1c24", skin: "#f3d0ae", tophat: true, moustache: "#f4f1ea", brows: "#f4f1ea", stout: true, toga: "#7a1f2b" },
  hbc: { tunic: "#3f6a4a", skin: "#f3d0ae", cap: "#6a3a2a", moustache: "#8a5a32", apron: "#cbbf98" },
};

/** galea: iron bowl, brass brow band, cheek guards, transverse red crest */
const galea = (p, H, cx, hc, light, thick, ow, old, u) => {
  const crest = old ? "#8d4b3f" : "#d2372f", bowl = old ? "#8f8a7e" : STEEL;
  // crest (behind the bowl top)
  const cy0 = hc - H.b * 0.98;
  const cr = ellPts(cx, cy0, 0.66 * 2 * H.a, 0.42 * 2 * H.b, 180, 360, 0, 40);
  cr.push([cx + 0.66 * 2 * H.a * 0.98, cy0 + 4 * u], [cx - 0.66 * 2 * H.a * 0.98, cy0 + 4 * u]);
  const crP = [...ellPts(cx, cy0 + 2 * u, 0.62 * 2 * H.a, 0.36 * 2 * H.b, 180, 360, 0, 40)];
  p.shadedFill(crP, crest, mul(crest, [0.7, 0.62, 0.7]), light, 0.62 * 2 * H.a, 0.3);
  p.clip(crP, () => { for (let i = -9; i <= 9; i++) p.stroke([[cx + i * 7.4 * u, cy0], [cx + i * 9.4 * u, cy0 - 0.62 * H.b * Math.cos(i / 11)]], 1.4 * u, mul(crest, [0.62, 0.55, 0.62])); });
  if (old) p.clip(crP, () => { for (let i = 0; i < 6; i++) p.ell(cx + (i - 3) * 22 * u, cy0 - 18 * u - (i % 2) * 10 * u, 9 * u, 5 * u, "#6f6a5e", 0); });
  p.inkRing(crP, ow * 0.85, thick);
  p.poly(rrect(cx - 10 * u, cy0 - 6 * u, cx + 10 * u, cy0 + 6 * u, 3 * u), BRASS, 2 * u);
  // bowl: upper head cap
  const bandY = hc - H.b * 0.42;
  const bp = ellPts(cx, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
  p.shadedFill(bp, bowl, mul(bowl, [0.62, 0.64, 0.72]), light, H.a, 0.4);
  p.clip(bp, () => {
    p.stroke(ellPts(cx - 20 * u, bandY - 0.3 * H.b, 0.25 * H.a, 0.18 * H.b, 200, 300, 0, 16), 4 * u, "#ffffff55");
    if (old) for (let i = 0; i < 9; i++) p.ell(cx + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (3 + (i % 3) * 2) * u, (2 + (i % 2)) * u, "#8a4b22", 0);
  });
  p.inkRing(bp, ow * 0.9, thick);
  p.band([[cx - H.a * 1.04, bandY], [cx + H.a * 1.04, bandY]], old ? "#a88a4a" : BRASS, 7 * u, 1.8 * u, "round");
  for (const s of [-1, 1]) p.dot(cx + s * 0.55 * H.a, bandY, 2.2 * u, "#fff3c4");
};
const cheeks = (p, H, cx, hc, light, ow, old, u) => {
  const bowl = old ? "#8f8a7e" : STEEL;
  for (const s of [-1, 1]) {
    const x0 = cx + s * 0.78 * H.a, x1 = cx + s * 1.07 * H.a, y0 = hc - H.b * 0.42, y1 = hc + H.b * 0.48;
    const pts = [[x0, y0], [x1, y0], [x1 - s * 0.04 * H.a, y1 - 0.1 * H.b], [x0 + s * 0.06 * H.a, y1], [x0 - s * 0.05 * H.a, (y0 + y1) / 2]];
    p.shadedFill(pts, bowl, mul(bowl, [0.62, 0.64, 0.72]), light, 0.2 * H.a, 0.3);
    p.poly(pts, null, ow * 0.8);
    p.dot((x0 + x1) / 2, (y0 + y1) / 2 - 0.05 * H.b, 2.2 * u, BRASS);
  }
};
const cobweb = (p, cx, cy, r, u) => {
  const g = p.g; g.save(); g.globalAlpha = 0.8;
  for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.05 + 0.9 * i / 6); p.stroke([[cx, cy], [cx + Math.cos(a) * r, cy + Math.sin(a) * r]], 1.1 * u, "#f2f2f2"); }
  for (let k = 1; k <= 4; k++) { const rr = r * k / 4.3, pts = []; for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.05 + 0.9 * i / 6); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } p.stroke(pts, 1 * u, "#f2f2f2"); }
  g.restore();
};

/** front-facing Roman-era character. opts: expr, blink, look, facing, seed, L/R arm poses, tilt, headTilt, bob, nohelmet, light */
export const romanFront = (p, key, opts = {}) => {
  const O = typeof key === "string" ? OUTFITS[key] : key;
  const { expr = "neutral", blink = 0, look = 0, facing = 0, seed = 3, L = "hang", R = O.spear ? "spear" : "hang", tilt = 0, headTilt = 0,
    bob = 0, nohelmet = false, light = rad(-120), web = false, step = 0 } = opts;
  const lid = lidOf(blink), skin = O.skin ?? SKIN;
  const H = headBlob(seed, 118, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const torsoL = O.stout ? 1.12 : 1.08, legsL = 1.38, sole = 975;
  const torsoBot = sole - legsL * HH - bob * HH, chin = torsoBot - torsoL * HH, hc = chin - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u, cx = 300;
  const legCol = mix(O.tunic, INK, 0.62), armCol = mix(O.tunic, INK, 0.5);
  const helmet = !!O.helmet && !nohelmet, old = O.helmet === "old";
  p.rot = null;
  // ---- cape behind everything ----
  if (O.cape) {
    const cp = [[cx - 0.48 * W, chin + 0.08 * HH], [cx + 0.48 * W, chin + 0.08 * HH], [cx + 0.62 * W, sole - 0.55 * HH], [cx + 0.2 * W, sole - 0.45 * HH], [cx - 0.2 * W, sole - 0.5 * HH], [cx - 0.62 * W, sole - 0.55 * HH]];
    p.gradFill(cp, O.cape, mul(O.cape, [0.6, 0.6, 0.7]), light); p.inkRing(cp, ow * 0.8, thick);
  }
  // ---- legs ----
  const dress = !!O.dress;
  for (const side of [-1, 1]) {
    const up = Math.max(0, Math.sin(Math.PI * 2 * (step + (side > 0 ? 0.5 : 0)))) * 30 * (step ? 1 : 0);
    const hx = cx + side * 16 * u, fx = cx + side * 22 * u, fy = sole - 4 * u - up;
    p.stroke(curve([hx, hipY], [(hx + fx) / 2 + side * 2 * u, (hipY + fy) / 2], [fx, fy]), 5.8 * u, legCol);
    const sandal = O.helmet ? LEATHER : "#5a3b2a";
    p.stroke([[fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u]], 7.5 * u + 3, INK);
    p.stroke([[fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u]], 7.5 * u, sandal);
    if (O.helmet) for (let k = 1; k <= 3; k++) p.stroke([[fx - 4 * u, fy - k * 0.07 * HH], [fx + 4 * u, fy - k * 0.07 * HH - 2 * u]], 2 * u, LEATHER);
  }
  // ---- upper body ----
  p.rot = tilt ? [rad(tilt), cx, hipY] : null;
  const T = { a: (0.4 * W) / 1.06 * (O.stout ? 1.12 : 1), b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: O.stout ? 0.17 : 0.12, asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = cx + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const S = (side) => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
  const arm = (side, pose) => {
    const s = S(side), X = (k) => tcx + side * (T.a * 1.1 + k * u);
    switch (pose) {
      case "spear": return { pts: [s, [X(6), s[1] + 0.42 * HH], [X(10), s[1] + 0.2 * HH]], front: false };
      case "point": return { pts: [s, [X(28), s[1] - 0.02 * HH], [X(62), s[1] - 0.1 * HH]], front: false, finger: true };
      case "up": return { pts: [s, [X(14), s[1] - 0.3 * HH], [X(22), s[1] - 0.75 * HH]], front: false };
      case "wave": return { pts: [s, [X(16), s[1] - 0.2 * HH], [X(30 + 10 * Math.sin(opts.wv || 0)), s[1] - 0.62 * HH]], front: false };
      case "hip": return { pts: [s, [X(22), s[1] + 0.3 * HH], [tcx + side * T.a * 0.95, torsoBot - 0.3 * HH]], front: false };
      case "belly": return { pts: [s, [X(8), s[1] + 0.45 * HH], [tcx + side * 0.25 * T.a, torsoBot - 0.35 * HH]], front: true };
      case "temple": return { pts: [s, [X(26), s[1] + 0.05 * HH], [cx + side * (H.a + 16 * u), hc - 0.1 * HH]], front: false, swirl: true };
      case "lift": return { pts: [s, [X(20), s[1] - 0.25 * HH], [X(4), s[1] - 0.82 * HH]], front: false };
      case "shield": return { pts: [s, [X(4), s[1] + 0.4 * HH], [tcx + side * 0.6 * T.a, torsoBot - 0.1 * HH]], front: true };
      case "cross": return { pts: [s, [X(2), s[1] + 0.38 * HH], [tcx - side * 0.45 * T.a, s[1] + 0.32 * HH]], front: true };
      case "reach": { const lf = (opts.lift || 0) * 0.62 * HH; return { pts: [s, [X(42), s[1] - 0.12 * HH - lf * 0.6], [X(82), s[1] - 0.5 * HH - lf]], front: false }; }
      case "cheek": return { pts: [s, [X(16), s[1] + 0.05 * HH], [cx + side * (H.a + 2 * u), hc + 0.25 * H.b]], front: false };
      case "thumb": return { pts: [s, [X(20), s[1] + 0.12 * HH], [X(44), s[1] - 0.12 * HH]], front: false, thumb: true };
      default: return { pts: [s, [X(4), s[1] + 0.48 * HH], [X(3), chin + 1.04 * HH]], front: false };
    }
  };
  const arms = [arm(-1, L), arm(1, R)];
  const drawArm = (a) => {
    p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.2 * u, armCol);
    const [hx, hy] = a.pts[2];
    p.dot(hx, hy, 5.5 * u);
    if (a.finger) { const dx = a.pts[2][0] - a.pts[1][0], dy = a.pts[2][1] - a.pts[1][1], l = Math.hypot(dx, dy); p.stroke([[hx, hy], [hx + dx / l * 14 * u, hy + dy / l * 14 * u]], 2.6 * u); }
    if (a.thumb) p.stroke([[hx, hy], [hx + Math.sign(hx - cx) * 6 * u, hy - 12 * u]], 2.6 * u);
  };
  // spear behind
  if (O.spear && R === "spear") {
    const [hx, hy] = arms[1].pts[2], s0 = [hx + 2 * u, sole - 2 * u], s1 = [hx - 3 * u, O.rifle ? 250 : 70];
    if (O.rifle) {
      const mid = [s0[0] + (s1[0] - s0[0]) * 0.42, s0[1] + (s1[1] - s0[1]) * 0.42];
      p.band([s0, mid], "#7a4a28", 5.4 * u, 1.4 * u, "round");
      p.band([mid, s1], "#4a4d55", 3.4 * u, 1.2 * u, "round");
      p.poly([[s1[0] - 2.5 * u, s1[1] + 2 * u], [s1[0], s1[1] - 26 * u], [s1[0] + 2.5 * u, s1[1] + 2 * u]], "#d4dae1", 1.6 * u);
    } else {
    p.band([s0, s1], old ? "#6d5236" : "#8a5a34", 4.2 * u, 1.4 * u, "round");
    const tip = [[s1[0] - 7 * u, s1[1] + 6 * u], [s1[0], s1[1] - 34 * u], [s1[0] + 7 * u, s1[1] + 6 * u], [s1[0], s1[1] + 14 * u]];
    p.poly(tip, old ? "#8b7c6a" : "#c9cfd6", 2 * u);
    }
    if (web) cobweb(p, s1[0] - 2 * u, s1[1] + 60 * u, 70 * u, u);
  }
  for (const a of arms) if (!a.front) drawArm(a);
  // torso
  if (dress) {
    const D = { a: 0.5 * W * 0.98, b: 0.5 * ((sole - 0.35 * HH) - (chin - 0.2 * HH)), nTop: 2.0, nBot: 3.0, egg: 0.35, asym: 0, rot: 0, noise: 0.006, seed: seed + 9 };
    const dp = blobPts(cx, sole - 0.35 * HH - D.b, D);
    p.gradFill(dp, O.dress, mul(O.dress, SH_CLOTH), light); p.inkRing(dp, ow, thick);
  }
  // skirt / pteruges below the torso
  if (!dress) {
    const sk = [[tcx - 0.92 * T.a, torsoBot - 0.2 * HH], [tcx + 0.92 * T.a, torsoBot - 0.2 * HH], [tcx + 1.0 * T.a, torsoBot + 0.3 * HH], [tcx - 1.0 * T.a, torsoBot + 0.3 * HH]];
    p.gradFill(sk, O.tunic, mul(O.tunic, SH_CLOTH), light); p.poly(sk, null, ow * 0.8);
    if (O.armor) for (let i = -3; i <= 3; i++) { const x = tcx + i * 0.27 * T.a, st = [[x - 9 * u, torsoBot - 0.05 * HH], [x + 9 * u, torsoBot - 0.05 * HH], [x + 9 * u, torsoBot + 0.22 * HH], [x - 9 * u, torsoBot + 0.22 * HH]]; p.poly(st, old ? "#5e4632" : LEATHER, 1.6 * u); }
  }
  p.gradFill(tp, O.tunic, mul(O.tunic, SH_CLOTH), light);
  p.clip(tp, () => {
    if (O.armor) {
      const top = chin - 0.1 * HH, bot = torsoBot - 0.25 * HH, n = 5;
      for (let i = 0; i < n; i++) {
        const y0 = top + (bot - top) * i / n, y1 = top + (bot - top) * (i + 1) / n;
        const c = old ? (i % 2 ? "#8d8679" : "#9a9384") : (i % 2 ? "#a7b0ba" : "#bcc4cc");
        p.poly([[tcx - 1.5 * T.a, y0], [tcx + 1.5 * T.a, y0 + 3 * u], [tcx + 1.5 * T.a, y1 + 3 * u], [tcx - 1.5 * T.a, y1]], c, 1.8 * u);
      }
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.2 * HH], [tcx + 1.4 * T.a, torsoBot - 0.2 * HH]], LEATHER, 0.08 * HH, 1.5 * u);
      for (let i = -2; i <= 2; i++) p.dot(tcx + i * 0.3 * T.a, torsoBot - 0.2 * HH, 2.4 * u, BRASS);
      if (old) for (let i = 0; i < 5; i++) p.ell(tcx + Math.sin(i * 1.7) * 0.7 * T.a, top + (bot - top) * ((i * 0.31) % 1), 6 * u, 3 * u, "#8a4b22", 0);
    } else {
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.24 * HH], [tcx + 1.4 * T.a, torsoBot - 0.24 * HH]], O.apron ? "#5a3b2a" : "#e2c27a", 0.05 * HH, 1.2 * u);
      if (O.toga) p.band([[tcx - 1.0 * T.a, chin - 0.1 * HH], [tcx + 1.1 * T.a, torsoBot - 0.1 * HH]], O.toga, 0.16 * HH, 1.6 * u);
      if (O.apron) p.poly([[tcx - 0.55 * T.a, torsoBot - 0.2 * HH], [tcx + 0.55 * T.a, torsoBot - 0.2 * HH], [tcx + 0.6 * T.a, torsoBot + 0.2 * HH], [tcx - 0.6 * T.a, torsoBot + 0.2 * HH]], O.apron, 1.6 * u);
      p.stroke([[tcx - 0.2 * T.a, chin + 0.02 * HH], [tcx, chin + 0.16 * HH], [tcx + 0.2 * T.a, chin + 0.02 * HH]], 2 * u);
    }
  });
  p.inkRing(tp, ow, thick);
  if (O.armor) for (const s of [-1, 1]) { // shoulder plates
    const sp = ellPts(tcx + s * 0.72 * T.a, chin + 0.1 * HH, 0.42 * T.a, 0.13 * HH, 180, 360, s * 8, 20);
    p.poly(sp, old ? "#9a9384" : "#c5ccd3", 1.8 * u);
  }
  if (O.moss) {/* reserved */}
  for (const a of arms) if (a.front) drawArm(a);
  // shield in front, held by the left hand
  if (O.shield && L === "shield") {
    const sx = tcx - 0.55 * T.a, sy = torsoBot + 0.05 * HH, sw = 0.36 * W, sh = 0.78 * HH;
    const sp = rrect(sx - sw, sy - sh, sx + sw, sy + sh, 8 * u);
    p.gradFill(sp, "#c0302c", "#7d1d22", light);
    p.clip(sp, () => {
      p.band([[sx - sw, sy], [sx + sw, sy]], BRASS, 6 * u, 1.2 * u);
      p.band([[sx, sy - sh], [sx, sy + sh]], BRASS, 6 * u, 1.2 * u);
      for (const s of [-1, 1]) { p.stroke([[sx + s * 12 * u, sy - 14 * u], [sx + s * 34 * u, sy - 46 * u], [sx + s * 22 * u, sy - 44 * u], [sx + s * 46 * u, sy - 74 * u]], 3.5 * u, BRASS); p.stroke([[sx + s * 12 * u, sy + 14 * u], [sx + s * 34 * u, sy + 46 * u], [sx + s * 22 * u, sy + 44 * u], [sx + s * 46 * u, sy + 74 * u]], 3.5 * u, BRASS); }
      p.stroke(ellPts(sx - sw * 0.5, sy - sh * 0.7, sw * 0.3, sh * 0.1, 200, 320, 0, 10), 3 * u, "#ffffff44");
    });
    p.ell(sx, sy, 13 * u, 13 * u, "#e6c068", 2.2 * u);
    p.inkRing(sp, ow, thick);
  }
  // ---- head ----
  const [cpx, cpy] = rotAbout([cx, chin], rad(tilt), [cx, hipY]);
  const Ah = tilt + headTilt;
  p.rot = Ah ? [rad(Ah), cx, chin, cpx - cx, cpy - chin] : null;
  if (helmet) galea(p, H, cx, hc, light, thick, ow, old, u);
  const hp = blobPts(cx, hc, H);
  if (O.hair && !helmet) { const hb = blobPts(cx, hc - 0.03 * HH, { ...H, a: H.a * 1.04, b: H.b * 1.05 }); p.poly(hb, O.hair, 0); }
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  if (helmet) {
    const bandY = hc - H.b * 0.42, bp = ellPts(cx, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
    p.shadedFill(bp, old ? "#8f8a7e" : STEEL, mul(old ? "#8f8a7e" : STEEL, [0.62, 0.64, 0.72]), light, H.a, 0.4);
    p.clip(bp, () => { p.stroke(ellPts(cx - 20 * u, bandY - 0.3 * H.b, 0.25 * H.a, 0.18 * H.b, 200, 300, 0, 16), 5 * u, "#ffffff66");
      if (old) for (let i = 0; i < 9; i++) p.ell(cx + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (4 + (i % 3) * 2) * u, (2.5 + (i % 2)) * u, "#8a4b22", 0); });
    p.poly(bp, null, ow * 0.9);
    p.band([[cx - H.a * 1.05, bandY], [cx + H.a * 1.05, bandY]], old ? "#a88a4a" : BRASS, 7 * u, 1.8 * u, "round");
    p.poly(rrect(cx - 4 * u, bandY - 0.55 * H.b, cx + 4 * u, bandY - 3 * u, 2 * u), old ? "#a88a4a" : BRASS, 1.5 * u);
    cheeks(p, H, cx, hc, light, ow, old, u);
  } else if (O.tophat) hatOn(p, { hat: "tophat", jacket: O.tunic }, hp, H, cx, hc, light, seed, facing, false);
  else if (O.cap) hatOn(p, { hat: "cap", cap: O.cap, jacket: O.tunic }, hp, H, cx, hc, light, seed, facing, false);
  else if (O.hair) hatOn(p, { hat: "hair", hair: O.hair, jacket: O.tunic }, hp, H, cx, hc, light, seed, facing, false);
  else if (O.helmet && nohelmet) { // bald old head with white side tufts
    for (const s of [-1, 1]) p.ell(cx + s * 0.9 * H.a, hc - 0.1 * H.b, 0.22 * H.a, 0.3 * H.b, "#f4f1ea", 3 * u);
  }
  if (O.beard) {
    const bd = blobPts(cx + 6 * u * facing, hc + 0.85 * H.b, { a: 0.62 * H.a, b: 0.75 * H.b, nTop: 2.4, nBot: 1.6, egg: -0.35, asym: 0, rot: 0, noise: 0.02, seed: seed + 4 });
    p.shadedFill(bd, O.beard, mul(O.beard, [0.86, 0.86, 0.92]), light, 0.6 * H.a, 0.3);
    p.clip(bd, () => { for (let i = -3; i <= 3; i++) p.stroke([[cx + i * 9 * u, hc + 0.45 * H.b], [cx + i * 7 * u, hc + 1.35 * H.b]], 1.2 * u, "#c9c4bb"); });
    p.inkRing(bd, ow * 0.8, thick);
  }
  faceFront(p, cx, hc, W, expr, facing, look, lid, helmet, skin, O.beard ? O.beard : O.moustache, !!O.stout);
  if (O.brows) for (const s of [-1, 1]) p.ell(cx + 7 * u * facing + s * 14 * u, hc - 20 * u, 11 * u, 5 * u, O.brows, 2 * u);
  if (O.beard) { // re-draw the mouth over the beard for open mouths
    if (expr === "shock" || expr === "snore") p.ell(cx + 8 * u * facing, hc + 22 * u, 6 * u, 7 * u, "#5a1e28", 2 * u);
  }
  p.rot = null;
  if (arms.some((a) => a.swirl)) { // cuckoo swirl next to the temple
    const a = arms.find((x) => x.swirl), [hx, hy] = a.pts[2], ph = opts.swirl || 0, pts = [];
    for (let i = 0; i < 40; i++) { const t = i / 40 * Math.PI * 4 + ph, r = (4 + i * 0.7) * u; pts.push([hx + Math.cos(t) * r, hy - 40 * u + Math.sin(t) * r]); }
    p.stroke(pts, 3 * u, "#ffffff"); p.stroke(pts, 1.4 * u, INK);
  }
};

/** loose helmet prop card (lifted off the old soldier) */
export const helmetCard = (p) => {
  const H = headBlob(3, 118, 0), u = 2 * H.a / 100, hc = 560, light = rad(-120), thick = thickAngle(light), ow = 5 * u;
  galea(p, H, 300, hc, light, thick, ow, true, u);
  const bandY = hc - H.b * 0.42, bp = ellPts(300, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
  // dark inside visible from below
  p.ell(300, bandY, H.a * 1.05, 0.12 * H.b, "#2a221e", 0);
  p.shadedFill(bp, "#8f8a7e", mul("#8f8a7e", [0.62, 0.64, 0.72]), light, H.a, 0.4);
  p.clip(bp, () => { for (let i = 0; i < 9; i++) p.ell(300 + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (4 + (i % 3) * 2) * u, (2.5 + (i % 2)) * u, "#8a4b22", 0); });
  p.poly(bp, null, ow * 0.9);
  p.band([[300 - H.a * 1.05, bandY], [300 + H.a * 1.05, bandY]], "#a88a4a", 7 * u, 1.8 * u, "round");
  cheeks(p, H, 300, hc, light, ow, true, u);
};

/** ZZZ for the sleeping guard */
export const fxZ = (p, t) => {
  const g = p.g; g.save(); g.font = "900 120px Arial Black, Arial"; g.lineJoin = "round";
  for (let i = 0; i < 3; i++) {
    const k = (t + i / 3) % 1, x = 220 + i * 70 + Math.sin(k * 6) * 20, y = 700 - k * 500, s = 0.5 + k * 0.7;
    g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = Math.min(1, (1 - k) * 2.5);
    g.lineWidth = 16; g.strokeStyle = INK; g.strokeText("Z", 0, 0); g.fillStyle = "#ffffff"; g.fillText("Z", 0, 0); g.restore();
  }
  g.restore();
};
/** falling leaf */
export const fxLeaf = (p, col) => { p.poly([[300, 380], [420, 470], [300, 620], [180, 470]], col, 14); p.stroke([[300, 400], [300, 600]], 8); };
/** dust cloud puff (k 0..1 growth) */
export const fxDust = (p, k, col = "#e8dcc4") => {
  const g = p.g; g.save(); g.globalAlpha = Math.max(0, 1 - k * k);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, r = 90 + 150 * k; p.ell(300 + Math.cos(a) * r, 520 + Math.sin(a) * r * 0.6, 120 + 60 * k, 100 + 50 * k, col, 12); }
  p.ell(300, 520, 170 + 110 * k, 140 + 80 * k, col, 0);
  g.restore();
};
export const fxDrip = (p) => p.ell(300, 500, 40, 64, "#9fd4ff", 10);
export const fxWood = (p, seed) => { p.poly([[200, 420], [400, 400], [420, 560], [230, 600]], "#5b3d22", 14); p.stroke([[240, 450], [380, 440]], 6, "#3a2614"); p.ell(330, 520, 26, 18, "#4d7a32", 0); };

export const headCenter = (seed = 3) => { const H = headBlob(seed, 118, 0), HH = 2 * H.b; return 975 - 1.38 * HH - 1.08 * HH - H.b; };

/** newspaper prop (rusty tower sketch) */
export const fxNews = (p) => {
  const pg = [[110, 330], [490, 300], [500, 640], [100, 660]];
  p.poly(pg, "#efe6cf", 12);
  for (let i = 0; i < 6; i++) p.stroke([[135, 560 + i * 15 - 5], [470, 555 + i * 15 - 5]], 5, "#8a826d");
  p.poly([[140, 345], [470, 332], [470, 372], [140, 386]], "#3a3340", 4);
  // sketch of a rusty tower
  p.poly([[250, 540], [300, 400], [350, 540]], "#d9824a", 8);
  p.stroke([[262, 500], [338, 500]], 5); p.stroke([[275, 455], [325, 455]], 5); p.stroke([[300, 400], [300, 380]], 5);
  p.stroke([[160, 420], [225, 420]], 5, "#8a826d"); p.stroke([[160, 445], [225, 445]], 5, "#8a826d"); p.stroke([[375, 420], [450, 420]], 5, "#8a826d"); p.stroke([[375, 445], [450, 445]], 5, "#8a826d");
};
/** briefcase full of notes */
export const fxCase = (p, open = 0) => {
  p.poly([[160, 520], [440, 520], [450, 700], [150, 700]], "#6b3f22", 12);
  p.poly([[250, 490], [350, 490], [352, 520], [248, 520]], "#4a2a16", 10);
  p.band([[160, 600], [440, 600]], "#d8b055", 12, 4);
  p.poly([[285, 585], [315, 585], [315, 622], [285, 622]], "#e6c068", 6);
  if (open) for (let i = 0; i < 3; i++) p.poly([[190 + i * 70, 505 - i * 8], [255 + i * 70, 495 - i * 8], [262 + i * 70, 540], [195 + i * 70, 548]], "#9bc47a", 6);
};
/** falling banknote / coin sparkle */
export const fxBill = (p) => { p.poly([[190, 450], [410, 430], [420, 560], [200, 580]], "#a9d28a", 10); p.ell(300, 505, 38, 38, "#d8ecc4", 6); };
export const fxRust = (p) => p.ell(300, 500, 34, 58, "#c4622b", 8);


// ======================= Pig War props =======================
const PINK = "#f6adae", PINKD = "#d9808a";
/** front-view pig (card: soles at y=975). opts: expr eat|shock|happy|dead|angel, blink, chew(0..1), wing(0..1) */
export const pigFront = (p, o = {}) => {
  const { expr = "eat", blink = 0, chew = 0, wing = 0, bob = 0 } = o;
  const y0 = -bob * 300;
  if (expr === "angel") for (const s of [-1, 1]) {
    const wp = [[300 + s * 120, 800 + y0], [300 + s * 260, 650 + y0 - wing * 50], [300 + s * 290, 740 + y0 - wing * 30], [300 + s * 250, 800 + y0], [300 + s * 190, 880 + y0]];
    p.poly(wp, "#ffffff", 10);
    for (let k = 0; k < 3; k++) p.stroke([[300 + s * (170 + k * 24), 760 + y0 + k * 30], [300 + s * (225 + k * 12), 740 + y0 + k * 40]], 4, "#cfd8e6");
  }
  // legs
  for (const [x, w] of [[222, 1], [378, 1], [262, 0.9], [338, 0.9]]) {
    p.stroke([[x, 905 + y0], [x, 962]], 40 * w, PINK);
    p.poly([[x - 21 * w, 954], [x + 21 * w, 954], [x + 19 * w, 975], [x - 19 * w, 975]], "#6b4a4a", 8);
  }
  // body
  p.ell(300, 868 + y0, 196, 120, PINK, 12);
  p.ell(300, 900 + y0, 150, 60, "#f9c3c2", 0);
  // ears
  for (const s of [-1, 1]) p.poly([[300 + s * 70, 700 + y0], [300 + s * 150, 632 + y0], [300 + s * 178, 718 + y0], [300 + s * 140, 760 + y0]], PINKD, 10);
  // head
  p.ell(300, 790 + y0, 126, 108, PINK, 12);
  p.ell(222, 826 + y0, 24, 15, "#f58f94", 0); p.ell(378, 826 + y0, 24, 15, "#f58f94", 0);
  // eyes
  const ey = 770 + y0;
  for (const s of [-1, 1]) {
    const ex = 300 + s * 54;
    if (expr === "dead") { p.stroke([[ex - 14, ey - 14], [ex + 14, ey + 14]], 9); p.stroke([[ex + 14, ey - 14], [ex - 14, ey + 14]], 9); }
    else if (expr === "eat" || expr === "happy" || blink > 0.6) p.stroke(ellPts(ex, ey + 6, 16, 11, 200, 340, 0, 12), 8);
    else { const r = expr === "shock" ? 24 : 17; p.ell(ex, ey, r, r * 1.1, "#ffffff", 7); p.dot(ex + (expr === "shock" ? 0 : s * -2), ey + 2, expr === "shock" ? 5 : 8); }
  }
  // snout
  p.ell(300, 830 + y0, 62, 44, "#f48e96", 9);
  p.ell(280, 832 + y0, 8, 13, "#a84458", 0); p.ell(320, 832 + y0, 8, 13, "#a84458", 0);
  // mouth
  const my = 878 + y0;
  if (expr === "dead") { p.stroke([[262, my], [300, my + 6], [338, my]], 7); p.ell(328, my + 14, 12, 18, "#e8607a", 6); }
  else if (expr === "shock") p.ell(300, my + 6, 22, 24, "#5a1e28", 7);
  else if (expr === "eat") { const c = 6 + 12 * chew; p.ell(300, my + c * 0.3, 26, c, "#5a1e28", 7); p.ell(332, my - 6, 25, 17, "#a8703a", 7); p.ell(325, my - 10, 6, 4, "#c99455", 0); }
  else p.stroke(ellPts(300, my - 6, 28, 16, 20, 160, 0, 12), 7);
  if (expr !== "dead") for (const s of [-1, 1]) p.ell(300 + s * 92, 812 + y0, 18, 11, "#f2828e", 0);
  if (expr === "angel" || expr === "dead") {
    const hp = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; hp.push([300 + 78 * Math.cos(a), 640 + y0 + 20 * Math.sin(a)]); }
    p.stroke(hp, 20, INK); p.stroke(hp, 10, "#ffd84a");
  }
};
/** gunshot burst */
export const fxBang = (p, t = 0) => {
  const pts = []; for (let i = 0; i < 20; i++) { const r = i % 2 ? 90 : 230 * (0.7 + 0.5 * t), a = i / 20 * Math.PI * 2; pts.push([300 + r * Math.cos(a), 500 + r * Math.sin(a)]); }
  p.poly(pts, "#ffd23c", 12);
  const q2 = pts.map(([x, y]) => [300 + (x - 300) * 0.55, 500 + (y - 500) * 0.55]); p.poly(q2, "#fff6c4", 0);
};
export const fxPotato = (p) => { p.ell(300, 540, 70, 50, "#b68a4e", 9); p.ell(280, 530, 7, 5, "#7a5a30", 0); p.ell(325, 552, 6, 4, "#7a5a30", 0); };
/** wooden sign on a post with big text */
export const fxBoard = (p, text = "1859", sub = "") => {
  p.poly([[270, 560], [330, 560], [334, 975], [266, 975]], "#6a4a2e", 12);
  p.poly([[60, 250], [540, 236], [548, 520], [52, 536]], "#c9a165", 14);
  p.stroke([[80, 300], [520, 290]], 6, "#a3804a"); p.stroke([[78, 470], [522, 482]], 6, "#a3804a");
  const g = p.g; g.save(); g.font = "900 " + (text.length > 5 ? 118 : 190) + "px Arial Black, Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  g.lineWidth = 16; g.strokeStyle = INK; g.strokeText(text, 300, sub ? 340 : 390); g.fillStyle = "#fff2cf"; g.fillText(text, 300, sub ? 340 : 390);
  if (sub) { g.font = "900 78px Arial Black, Arial"; g.lineWidth = 12; g.strokeText(sub, 300, 450); g.fillText(sub, 300, 450); }
  g.restore();
};
/** wooden cross (grave marker) with a tiny pig-face plaque */
export const fxCross = (p) => {
  p.poly([[270, 380], [330, 380], [334, 975], [266, 975]], "#8a6240", 12);
  p.poly([[160, 520], [440, 510], [444, 580], [156, 592]], "#8a6240", 12);
  p.ell(300, 700, 64, 56, PINK, 9); p.ell(300, 716, 34, 24, "#f48e96", 6); p.dot(286, 716, 5); p.dot(314, 716, 5);
  p.dot(268, 672, 6); p.dot(332, 672, 6);
};
/** exclamation mark */
export const fxExcl = (p) => { p.poly([[262, 420], [338, 420], [326, 640], [274, 640]], "#ffd23c", 12); p.ell(300, 720, 34, 34, "#ffd23c", 12); };


// ======================= Emu War props =======================
/** front-view emu (soles y=975). opts: expr neutral|smug|eat|shock|dizzy|happy, step 0..1, crown, helmet, sash, wheat, blink, bob */
export const emuFront = (p, o = {}) => {
  const { expr = "neutral", step = 0, crown = false, helmet = false, sash = false, wheat = false, blink = 0, bob = 0 } = o;
  const y0 = -bob * 200, BODY = "#7b5d47", NECK = "#a8b7c2", LEG = "#c2b08c";
  // legs
  for (const [s, ph] of [[-1, 0], [1, 0.5]]) {
    const lift = Math.max(0, Math.sin((step + ph) * Math.PI * 2)) * 60, x = 300 + s * 58;
    p.stroke([[x, 770 + y0], [x + s * 6, 880 - lift * 0.4], [x, 950 - lift]], 22, LEG);
    for (const dx of [-26, 0, 26]) p.stroke([[x, 950 - lift], [x + dx, 972 - lift * 0.9]], 12, LEG);
  }
  // body
  p.ell(300, 640 + y0, 158, 168, BODY, 12);
  for (let i = 0; i < 7; i++) { const x = 160 + i * 47; p.poly([[x - 22, 770 + y0], [x, 818 + y0 + (i % 2) * 14], [x + 22, 770 + y0]], BODY, 8); }
  p.ell(300, 700 + y0, 108, 100, "#92735c", 0);
  for (let i = 0; i < 5; i++) p.stroke([[220 + i * 40, 600 + y0], [226 + i * 40, 650 + y0]], 6, "#5a4332");
  if (sash) { p.band([[190, 520 + y0], [415, 750 + y0]], "#b8282b", 42, 8, "flat"); p.ell(300, 636 + y0, 26, 26, "#ffd84a", 8); }
  // neck + head
  p.stroke([[300, 520 + y0], [300, 410 + y0], [300, 280 + y0]], 52, INK); p.stroke([[300, 520 + y0], [300, 410 + y0], [300, 280 + y0]], 38, NECK);
  p.ell(300, 238 + y0, 58, 52, NECK, 11);
  // eyes
  for (const s of [-1, 1]) {
    const ex = 300 + s * 30, ey = 226 + y0;
    if (expr === "dizzy") { p.stroke([[ex - 11, ey - 11], [ex + 11, ey + 11]], 7); p.stroke([[ex + 11, ey - 11], [ex - 11, ey + 11]], 7); continue; }
    if (expr === "eat" || expr === "happy" || blink > 0.6) { p.stroke(ellPts(ex, ey + 4, 13, 9, 200, 340, 0, 10), 7); continue; }
    p.ell(ex, ey, 18, 18, "#e0a030", 6); p.ell(ex, ey, 11, 11, "#ffffff", 0); p.dot(ex - s * 1, ey + 1, expr === "shock" ? 3 : 6);
    if (expr === "smug") { p.poly([[ex - 22, ey - 22], [ex + 22, ey - 22], [ex + 22, ey - 2 + (s > 0 ? 3 : 0)], [ex - 22, ey - 5]], NECK, 6); p.stroke([[ex - 20, ey - 28 - (s > 0 ? 8 : 0)], [ex + 20, ey - 30 + (s > 0 ? 6 : 0)]], 6); }
  }
  // beak
  p.ell(300, 262 + y0, 24, 18, "#c9a56a", 8); p.stroke([[280, 266 + y0], [320, 266 + y0]], 4, "#8a6a3a");
  if (wheat) { p.stroke([[318, 262 + y0], [372, 200 + y0]], 5, "#d9b648"); for (let k = 0; k < 4; k++) p.ell(366 - k * 6 + 6, 204 + k * 9 + y0, 6, 11, "#e8c85a", 4); }
  if (expr === "shock") p.ell(300, 276 + y0, 12, 9, "#5a1e28", 5);
  if (helmet) { p.ell(300, 205 + y0, 66, 38, "#6a7076", 9); p.poly([[228, 215 + y0], [372, 215 + y0], [384, 232 + y0], [216, 232 + y0]], "#555b61", 7); }
  if (crown) p.poly([[258, 196 + y0], [264, 138 + y0], [282, 170 + y0], [300, 126 + y0], [318, 170 + y0], [336, 138 + y0], [342, 196 + y0]], "#ffd84a", 9);
};
