// BUILDERS v5 — biblioteca de constructores de mundo densos (terreno, hierba, árboles, muros con puerta, torres, casas, tiendas, atrezo, fuego, multitudes, haces de luz).
// Todos devuelven mallas ya colocadas en la escena. Un mundo = llamadas a estos constructores + lamp()/FX. Mantén la altura del suelo con `kit.heightAt`.
import * as THREE from './lib/three.module.js';
import * as P from './paint.js';

export const makeKit = (ctx) => {
  const { scene, std, tex, add, lamp, LU, T } = ctx;
  const kit = { tm: { value: 0 }, heightAt: () => 0, fx: [] };
  const rng = P.rng;
  const hexC = (h) => new THREE.Color(h);

  // ---------- util ----------
  /** funde varias geometrías en una sola (con color por parte). parts=[{geo,pos,rot,scale,color}] */
  const merged = (parts) => {
    const pos = [], nor = [], uv = [], col = [], idx = []; let base = 0; const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), nm = new THREE.Matrix3();
    for (const p of parts) {
      const g = p.geo.index ? p.geo : p.geo.toNonIndexed(), a = g.attributes, n = a.position.count;
      e.set(...(p.rot || [0, 0, 0])); q.setFromEuler(e); const s = p.scale == null ? [1, 1, 1] : typeof p.scale === 'number' ? [p.scale, p.scale, p.scale] : p.scale;
      m.compose(new THREE.Vector3(...(p.pos || [0, 0, 0])), q, new THREE.Vector3(...s)); nm.getNormalMatrix(m); const c = hexC(p.color || '#ffffff');
      const v = new THREE.Vector3();
      for (let i = 0; i < n; i++) {
        v.fromBufferAttribute(a.position, i).applyMatrix4(m); pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(a.normal, i).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z);
        uv.push(a.uv ? a.uv.getX(i) : 0, a.uv ? a.uv.getY(i) : 0);
        const j = p.jitter ? 1 + (Math.random() - 0.5) * 0 : 1; col.push(c.r * j, c.g * j, c.b * j);
      }
      if (g.index) for (let i = 0; i < g.index.count; i++) idx.push(g.index.array[i] + base); else for (let i = 0; i < n; i++) idx.push(base + i);
      base += n;
    }
    const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    G.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); G.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); G.setIndex(idx); return G;
  };
  const tbox = (w, h, d, t = 3) => { // caja con UV a escala de mundo (1 repetición cada t metros)
    const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); } return g;
  };
  const uvs = (g, su, sv) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return g; };
  const mesh = (geo, mat, [x, y, z] = [0, 0, 0], o = {}) => { const m = add(geo, mat, x, y, z, o.parent || scene, o); if (o.rotY) m.rotation.y = o.rotY; if (o.nd) m.userData.nd = o.nd; return m; };

  // ---------- materiales compartidos ----------
  const bumpTex = (canvas, rx = 1, ry = 1) => tex(canvas, rx, ry);
  const stoneC = P.stoneWall(21), stoneMossC = P.stoneWall(22, 34, 12, 54, 0.45);
  const mats = {
    stone: std({ map: tex(stoneC), bumpMap: bumpTex(stoneC), bumpScale: 2.2, roughness: 0.95 }),
    stoneMoss: std({ map: tex(stoneMossC), bumpMap: bumpTex(stoneMossC), bumpScale: 2.2, roughness: 0.95 }),
    stoneW: (() => { const m = std({ map: tex(stoneC, 0.25, 0.25), bumpMap: bumpTex(stoneC, 0.25, 0.25), bumpScale: 2.2, roughness: 0.95, side: THREE.DoubleSide }); return m; })(),
    meadow: std({ map: tex(P.ground(33, ['#5c7a3a', '#6f8a40', '#4c6632', '#86a052']), 1, 1), roughness: 1 }),
    dirt: std({ map: tex(P.ground(31), 1, 1), roughness: 1 }), sand: std({ map: tex(P.ground(32, ['#c9b07a', '#d8c08a', '#b89c68', '#e0cc9a']), 1, 1), roughness: 1 }),
    plank: std({ map: tex(P.planks(5), 1, 1), bumpMap: bumpTex(P.planks(5)), bumpScale: 1, roughness: 0.85 }),
    wood: std({ color: '#6b4a30', roughness: 0.9 }), woodDark: std({ color: '#3c2a1e', roughness: 0.95 }), iron: std({ color: '#3a3a40', roughness: 0.55, metalness: 0.7 }),
    timber: std({ map: tex(P.timber(41), 1, 1), roughness: 0.95 }), roofRed: std({ map: tex(P.tiles(42), 1, 1), bumpMap: bumpTex(P.tiles(42)), bumpScale: 1.5, roughness: 0.7 }),
    roofDark: std({ map: tex(P.tiles(43, '#3a4658', '#566a82'), 1, 1), roughness: 0.7 }),
    leaf: std({ vertexColors: true, roughness: 1 }), bark: std({ color: '#4a3526', roughness: 1 }),
    blade: std({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }),
    cloth: std({ color: '#d9cdb0', roughness: 1, side: THREE.DoubleSide }),
    window: std({ color: '#2a2230', emissive: new THREE.Color('#ffb860'), emissiveIntensity: 0, roughness: 0.4 }),
    flame: new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 1.5, 0.5) }),
  };
  kit.mats = mats;
  kit.onLight = (L) => { mats.window.emissiveIntensity = (L.windows ?? L.practical ?? 0) * 2.2; };

  // ---------- terreno ----------
  /** terrain({ size, seg, height:(x,z)=>y, color:(x,z,y)=>'#hex', map:'dirt'|'sand'|material, tile, cx, cz }) */
  kit.terrain = (o) => {
    const size = o.size || 400, seg = o.seg || 140, g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, col = new Float32Array(p.count * 3), cx = o.cx || 0, cz = o.cz || 0, c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) + cx, z = p.getZ(i) + cz, y = o.height ? o.height(x, z) : 0; p.setXYZ(i, x - cx, y, z - cz); c.set(o.color ? o.color(x, z, y) : '#ffffff'); col.set([c.r, c.g, c.b], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const tile = o.tile || 6, base = typeof o.map === 'object' ? o.map : (mats[o.map || 'dirt']), m = base.clone(); m.vertexColors = true; m.map = base.map.clone(); m.map.repeat.set(size / tile, size / tile); m.map.needsUpdate = true;
    const t = mesh(g, m, [cx, 0, cz], { cast: false }); t.receiveShadow = true; return t;
  };

  // ---------- hierba densa (triángulos fundidos con gradiente y viento) ----------
  /** grass({ area:[x0,z0,x1,z1], n, h:[min,max], w, colors:[base,tip,...], mask:(x,z)=>0..1, seed }) — n = nº de briznas */
  kit.grass = (o) => {
    const r = rng(o.seed || 7), n = o.n || 40000, [x0, z0, x1, z1] = o.area, hh = o.h || [0.35, 0.7], w = o.w || 0.07, cols = (o.colors || ['#2e5a24', '#8fc04a', '#5c9a34', '#b8d860']).map(hexC);
    const pos = new Float32Array(n * 9), nor = new Float32Array(n * 9), col = new Float32Array(n * 9), uv = new Float32Array(n * 6); let k = 0;
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0); if (o.mask && r() > o.mask(x, z)) { i--; if (++k > n * 8) break; continue; }
      const y = kit.heightAt(x, z), h = hh[0] + r() * (hh[1] - hh[0]), a = r() * 6.28, dx = Math.cos(a) * w, dz = Math.sin(a) * w, lean = (r() - 0.5) * 0.35, ca = cols[(r() * cols.length) | 0], cb = cols[(r() * cols.length) | 0];
      const b = i * 9; pos.set([x - dx, y, z - dz, x + dx, y, z + dz, x + Math.cos(a + 1.57) * lean * h, y + h, z + Math.sin(a + 1.57) * lean * h], b);
      for (let v = 0; v < 3; v++) { nor.set([0.15 * Math.cos(a + 1.57), 0.95, 0.15 * Math.sin(a + 1.57)], b + v * 3); }
      const dark = 0.38 + r() * 0.15; col.set([ca.r * dark, ca.g * dark, ca.b * dark, ca.r * dark, ca.g * dark, ca.b * dark, cb.r, cb.g, cb.b], b);
      uv.set([0, 0, 1, 0, 0.5, 1], i * 6);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const m = mats.blade.clone(); const tm = kit.tm;
    m.onBeforeCompile = (s) => { s.uniforms.uTm = tm; s.vertexShader = 'uniform float uTm;\n' + s.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float sw = uv.y*uv.y; transformed.x += sin(uTm*1.9 + position.x*.7 + position.z*.5)*.09*sw; transformed.z += cos(uTm*1.5 + position.z*.8)*.06*sw;`); };
    const mm = new THREE.Mesh(g, m); mm.castShadow = false; mm.receiveShadow = true; mm.userData.nd = ctx.ndUp; mm.frustumCulled = false; scene.add(mm); return mm;
  };

  // ---------- árboles ----------
  /** pines: trees.pine([[x,z,scale],...], {colors}) ; redondos: trees.round(...) */
  const treeBuild = (list, kind, o = {}) => {
    const lp = [], tp = [], r = rng(o.seed || 5), cols = (o.colors || (kind === 'pine' ? ['#274a2a', '#32603a', '#3d7040'] : ['#4a7a30', '#5f9238', '#78a844'])).map(hexC);
    for (const [x, z, s0 = 1] of list) {
      const s = s0 * (0.8 + r() * 0.5), y = kit.heightAt(x, z), c = cols[(r() * cols.length) | 0].getStyle();
      tp.push({ geo: new THREE.CylinderGeometry(0.16 * s, 0.26 * s, 2.4 * s, 7), pos: [x, y + 1.2 * s, z] });
      if (kind === 'pine') for (let i = 0; i < 4; i++) lp.push({ geo: new THREE.ConeGeometry((2.0 - i * 0.42) * s, (2.6 - i * 0.2) * s, 8), pos: [x, y + (2.2 + i * 1.35) * s, z], rot: [0, r() * 3, 0], color: c });
      else for (let i = 0; i < 4; i++) lp.push({ geo: new THREE.IcosahedronGeometry((1.5 + r() * 0.6) * s, 1), pos: [x + (r() - 0.5) * 1.7 * s, y + (3.2 + r() * 1.6) * s, z + (r() - 0.5) * 1.7 * s], rot: [r(), r(), r()], color: cols[(r() * cols.length) | 0].getStyle() });
    }
    const L = mesh(merged(lp), mats.leaf, [0, 0, 0]); L.userData.nd = ctx.ndUp; const Tm = mesh(merged(tp), mats.bark, [0, 0, 0]); return [L, Tm];
  };
  kit.pines = (list, o) => treeBuild(list, 'pine', o); kit.roundTrees = (list, o) => treeBuild(list, 'round', o);

  // ---------- montañas lejanas ----------
  kit.mountains = (o = {}) => {
    const r = rng(o.seed || 3), parts = [], n = o.n || 28, c = o.color || '#566488';
    for (let i = 0; i < n; i++) { const a = (i / n) * 6.283 + r() * 0.2, d = (o.r0 || 700) + r() * ((o.r1 || 1100) - (o.r0 || 700)), h = (o.h?.[0] || 90) + r() * ((o.h?.[1] || 260) - (o.h?.[0] || 90)); parts.push({ geo: new THREE.ConeGeometry(h * (0.9 + r() * 0.8), h, 7 + ((r() * 3) | 0)), pos: [Math.cos(a) * d + (o.cx || 0), h / 2 - 8, Math.sin(a) * d + (o.cz || 0)], rot: [0, r() * 3, 0], color: new THREE.Color(c).lerp(new THREE.Color('#9fb0cc'), r() * 0.4).getStyle() }); }
    const m = mesh(merged(parts), mats.leaf, [0, 0, 0], { cast: false }); return m;
  };

  // ---------- muros, torres, puertas ----------
  /** wall({ a:[x,z], b:[x,z], h, t, y, merlons }) */
  kit.wall = (o) => {
    const [ax, az] = o.a, [bx, bz] = o.b, L = Math.hypot(bx - ax, bz - az), h = o.h || 6, t = o.t || 1.8, y = o.y ?? kit.heightAt((ax + bx) / 2, (az + bz) / 2), ang = Math.atan2(-(bz - az), bx - ax);
    const g = new THREE.Group(); g.position.set((ax + bx) / 2, y, (az + bz) / 2); g.rotation.y = ang; scene.add(g);
    mesh(tbox(L, h, t, 4), mats.stone, [0, h / 2 - 0.2, 0], { parent: g });
    mesh(tbox(L + 0.2, 0.35, t + 0.5, 4), mats.stone, [0, h + 0.05, 0], { parent: g });
    if (o.merlons !== false) { const parts = []; for (let x = -L / 2 + 0.7; x < L / 2 - 0.4; x += 1.5) { parts.push({ geo: tbox(0.9, 0.9, 0.55, 4), pos: [x, h + 0.65, t * 0.5 - 0.1] }); parts.push({ geo: tbox(0.9, 0.9, 0.55, 4), pos: [x, h + 0.65, -t * 0.5 + 0.1] }); } mesh(merged(parts), mats.stone, [0, 0, 0], { parent: g }); }
    return g;
  };
  /** tower({ pos:[x,z], r, h, roof:'red'|'dark'|none }) */
  kit.tower = (o) => {
    const [x, z] = o.pos, r = o.r || 2.6, h = o.h || 10, y = o.y ?? kit.heightAt(x, z), g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
    mesh(uvs(new THREE.CylinderGeometry(r, r * 1.08, h, 20), r * 2.4, h / 4), mats.stone, [0, h / 2 - 0.2, 0], { parent: g });
    mesh(uvs(new THREE.CylinderGeometry(r * 1.2, r * 1.2, 0.5, 20), r * 3, 0.3), mats.stone, [0, h + 0.1, 0], { parent: g });
    if (o.roof !== 'none') { const rm = o.roof === 'dark' ? mats.roofDark : mats.roofRed; mesh(uvs(new THREE.ConeGeometry(r * 1.45, r * 2.1, 20), r * 2.2, r * 0.8), rm, [0, h + 0.35 + r * 1.05, 0], { parent: g }); }
    for (let i = 0; i < 3; i++) mesh(new THREE.BoxGeometry(0.5, 1.0, 0.2), mats.window, [Math.sin(i * 2.1) * (r + 0.01), h * (0.45 + i * 0.1), Math.cos(i * 2.1) * (r + 0.01)], { parent: g, rotY: i * 2.1, cast: false });
    return g;
  };
  /** gate({ pos:[x,z], rotY, w (luz del arco), h (alto del arco), W (ancho total), HH (alto total), t }) */
  kit.gate = (o) => {
    const [x, z] = o.pos, w = o.w || 4.4, h = o.h || 6, W = o.W || 12, HH = o.HH || 9, t = o.t || 2.4, y = o.y ?? kit.heightAt(x, z);
    const s = new THREE.Shape(); s.moveTo(-W / 2, 0); s.lineTo(-w / 2, 0); s.lineTo(-w / 2, h - w / 2); s.absarc(0, h - w / 2, w / 2, Math.PI, 0, true); s.lineTo(w / 2, 0); s.lineTo(W / 2, 0); s.lineTo(W / 2, HH); s.lineTo(-W / 2, HH); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 18 }); g.translate(0, 0, -t / 2);
    const m = mesh(g, mats.stoneW, [x, y, z], { rotY: o.rotY || 0 });
    // merlones + puerta de madera abierta (hojas)
    const gp = new THREE.Group(); gp.position.set(x, y, z); gp.rotation.y = o.rotY || 0; scene.add(gp);
    const parts = []; for (let xx = -W / 2 + 0.7; xx < W / 2 - 0.3; xx += 1.5) { parts.push({ geo: tbox(0.9, 0.9, 0.55, 4), pos: [xx, HH + 0.45, t * 0.5 - 0.1] }); parts.push({ geo: tbox(0.9, 0.9, 0.55, 4), pos: [xx, HH + 0.45, -t * 0.5 + 0.1] }); }
    mesh(merged(parts), mats.stone, [0, 0, 0], { parent: gp });
    if (o.doors !== false) for (const sgn of [-1, 1]) { const d = new THREE.Group(); d.position.set(sgn * w / 2, 0, -t * 0.35); d.rotation.y = sgn * 1.25; gp.add(d); mesh(new THREE.BoxGeometry(w / 2, h - w * 0.25, 0.16), mats.plank, [-sgn * w / 4, (h - w * 0.25) / 2, 0], { parent: d }); for (let k = 0; k < 3; k++) mesh(new THREE.BoxGeometry(w / 2, 0.14, 0.2), mats.iron, [-sgn * w / 4, 0.9 + k * 1.7, 0], { parent: d }); }
    return gp;
  };

  // ---------- casas y tejados ----------
  /** house({ pos:[x,z], w, d, h, rotY, roof:'red'|'dark', floors }) */
  kit.house = (o) => {
    const [x, z] = o.pos, w = o.w || 6, d = o.d || 5, h = o.h || 4.2, y = o.y ?? kit.heightAt(x, z), g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = o.rotY || 0; scene.add(g);
    const wm = mats.timber.clone(); wm.map = mats.timber.map.clone(); wm.map.needsUpdate = true;
    mesh(tbox(w, h, d, 3), wm, [0, h / 2, 0], { parent: g });
    const rm = o.roof === 'dark' ? mats.roofDark : mats.roofRed, rh = Math.max(w, d) * 0.5;
    const roof = mesh(uvs(new THREE.ConeGeometry(Math.SQRT1_2, 1, 4), 2.2, 1.4), rm, [0, h + rh * 0.5, 0], { parent: g }); roof.rotation.y = Math.PI / 4; roof.scale.set((w + 1.2) * 1.0, rh, (d + 1.2) * 1.0);
    const parts = [];
    for (let i = 0; i < Math.max(2, Math.round(w / 2.2)); i++) { const wx = -w / 2 + (i + 0.5) * w / Math.max(2, Math.round(w / 2.2)); parts.push({ geo: new THREE.BoxGeometry(0.8, 1.1, 0.12), pos: [wx, h * 0.62, d / 2 + 0.04] }); }
    parts.push({ geo: new THREE.BoxGeometry(1.0, 2.0, 0.16), pos: [w * 0.28, 1.0, d / 2 + 0.05] });
    mesh(merged(parts), mats.window, [0, 0, 0], { parent: g, cast: false });
    return g;
  };

  // ---------- tiendas de campaña ----------
  /** tent({ pos:[x,z], rotY, w, d, h, wall, fabric:['#base','#stripe'] }) — doble cara: sirve por dentro y por fuera */
  kit.tent = (o) => {
    const [x, z] = o.pos, w = o.w || 5, d = o.d || 6, h = o.h || 3.6, wl = o.wall ?? 1.5, y = o.y ?? kit.heightAt(x, z), fab = o.fabric || ['#e0d3ae', '#a9473b'];
    const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(-w / 2, wl); s.lineTo(0, h); s.lineTo(w / 2, wl); s.lineTo(w / 2, 0); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2);
    const m = std({ map: tex(P.fabric(o.seed || 7, fab[0], fab[1], 8), 1 / 2.2, 1 / 2.2), roughness: 1, side: THREE.DoubleSide });
    const gp = new THREE.Group(); gp.position.set(x, y, z); gp.rotation.y = o.rotY || 0; scene.add(gp);
    mesh(g, m, [0, 0, 0], { parent: gp });
    for (const sz of [-1, 1]) mesh(new THREE.CylinderGeometry(0.06, 0.06, h + 0.9, 6), mats.wood, [0, (h + 0.9) / 2, sz * (d / 2 + 0.05)], { parent: gp });
    mesh(new THREE.CylinderGeometry(0.05, 0.05, d + 0.6, 6), mats.wood, [0, h + 0.02, 0], { parent: gp }).rotation.x = Math.PI / 2;
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const rp = mesh(new THREE.CylinderGeometry(0.012, 0.012, 2.3, 4), mats.woodDark, [sx * (w / 2 + 0.9), 0.55, sz * (d / 2 + 0.3)], { parent: gp, cast: false }); rp.rotation.z = -sx * 0.78; rp.rotation.x = sz * 0.2; mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.4, 5), mats.wood, [sx * (w / 2 + 1.6), 0.1, sz * (d / 2 + 0.5)], { parent: gp, cast: false }); }
    return gp;
  };

  // ---------- atrezo ----------
  kit.barrel = (o) => { const [x, z] = o.pos, s = o.s || 1, y = o.y ?? kit.heightAt(x, z), pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(new THREE.Vector2(0.42 * s * (1 + 0.14 * Math.sin(t * Math.PI)), (t - 0.5) * 1.0 * s)); }
    const gp = new THREE.Group(); gp.position.set(x, y + 0.5 * s, z); scene.add(gp); mesh(new THREE.LatheGeometry(pts, 14), mats.wood, [0, 0, 0], { parent: gp });
    for (const k of [-0.3, 0.3]) { const b = mesh(new THREE.TorusGeometry(0.46 * s, 0.025 * s, 6, 16), mats.iron, [0, k * s, 0], { parent: gp, cast: false }); b.rotation.x = Math.PI / 2; b.scale.setScalar(1 + 0.1 * (1 - Math.abs(k) * 2)); }
    if (o.gold) mesh(new THREE.CylinderGeometry(0.4 * s, 0.4 * s, 0.05, 14), std({ color: '#e0b43a', metalness: 0.8, roughness: 0.3, emissive: '#7a5a10', emissiveIntensity: 0.5 }), [0, 0.5 * s, 0], { parent: gp, cast: false });
    return gp; };
  kit.crate = (o) => { const [x, z] = o.pos, s = o.s || 1, y = o.y ?? kit.heightAt(x, z); const m = mesh(tbox(0.9 * s, 0.9 * s, 0.9 * s, 1.2), mats.plank, [x, y + 0.45 * s, z], { rotY: o.rotY || 0 }); return m; };
  kit.sack = (o) => { const [x, z] = o.pos, s = o.s || 1, y = o.y ?? kit.heightAt(x, z); const m = mesh(new THREE.SphereGeometry(0.4 * s, 10, 8), mats.cloth, [x, y + 0.3 * s, z]); m.scale.set(1, 0.85, 0.8); return m; };
  kit.table = (o) => { const [x, z] = o.pos, w = o.w || 1.6, d = o.d || 0.8, h = o.h || 0.8, y = o.y ?? kit.heightAt(x, z), gp = new THREE.Group(); gp.position.set(x, y, z); gp.rotation.y = o.rotY || 0; scene.add(gp);
    mesh(tbox(w, 0.08, d, 1.2), mats.plank, [0, h, 0], { parent: gp }); for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(0.09, h, 0.09), mats.wood, [sx * (w / 2 - 0.1), h / 2, sz * (d / 2 - 0.1)], { parent: gp }); return gp; };
  kit.bench = (o) => kit.table({ ...o, w: o.w || 1.8, d: o.d || 0.35, h: 0.45 });
  kit.carpet = (o) => { const [x, z] = o.pos, w = o.w || 3, d = o.d || 4.4, y = (o.y ?? kit.heightAt(x, z)) + 0.02; const m = std({ map: tex(P.carpet(o.seed || 23, o.c1, o.c2, o.c3), 1, 1), bumpMap: tex(P.carpet(o.seed || 23, o.c1, o.c2, o.c3)), bumpScale: 0.6, roughness: 1 });
    const p = mesh(new THREE.PlaneGeometry(w, d), m, [x, y, z], { cast: false }); p.rotation.x = -Math.PI / 2; p.rotation.z = -(o.rotY || 0); return p; };
  kit.cart = (o) => { const [x, z] = o.pos, s = o.s || 1, y = o.y ?? kit.heightAt(x, z), gp = new THREE.Group(); gp.position.set(x, y, z); gp.rotation.y = o.rotY || 0; gp.scale.setScalar(s); scene.add(gp);
    mesh(tbox(1.9, 0.16, 1.2, 1.2), mats.plank, [0, 0.8, 0], { parent: gp }); for (const sz of [-1, 1]) { mesh(tbox(1.9, 0.5, 0.08, 1.2), mats.plank, [0, 1.05, sz * 0.6], { parent: gp }); const w = new THREE.Group(); w.position.set(0, 0.48, sz * 0.7); gp.add(w); const rim = mesh(new THREE.TorusGeometry(0.46, 0.05, 6, 20), mats.wood, [0, 0, 0], { parent: w }); mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 8), mats.woodDark, [0, 0, 0], { parent: w }).rotation.x = Math.PI / 2; for (let k = 0; k < 6; k++) { const sp = mesh(new THREE.BoxGeometry(0.04, 0.9, 0.04), mats.wood, [0, 0, 0], { parent: w, cast: false }); sp.rotation.z = k * Math.PI / 6; } }
    for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(2.4, 0.06, 0.07), mats.wood, [-1.9, 0.7, sz * 0.35], { parent: gp }); return gp; };
  kit.fence = (o) => { const [ax, az] = o.a, [bx, bz] = o.b, L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 1.6)), parts = [], ang = Math.atan2(-(bz - az), bx - ax);
    for (let i = 0; i <= n; i++) { const t = i / n, px = ax + (bx - ax) * t, pz = az + (bz - az) * t, py = kit.heightAt(px, pz); parts.push({ geo: new THREE.BoxGeometry(0.12, 1.2, 0.12), pos: [px, py + 0.6, pz] }); }
    for (const hh of [0.45, 0.9]) parts.push({ geo: new THREE.BoxGeometry(L, 0.08, 0.06), pos: [(ax + bx) / 2, kit.heightAt((ax + bx) / 2, (az + bz) / 2) + hh, (az + bz) / 2], rot: [0, ang, 0] });
    return mesh(merged(parts.map((p) => ({ ...p, color: '#6b4a30' }))), std({ vertexColors: true, roughness: 0.95 }), [0, 0, 0]); };
  /** bandera con tela ondulante: pole + cloth (tex canvas opcional) */
  kit.banner = (o) => { const [x, z] = o.pos, h = o.h || 9, y = o.y ?? kit.heightAt(x, z), gp = new THREE.Group(); gp.position.set(x, y, z); gp.rotation.y = o.rotY || 0; scene.add(gp);
    mesh(new THREE.CylinderGeometry(0.06, 0.09, h, 8), mats.woodDark, [0, h / 2, 0], { parent: gp });
    const cw = o.w || 2.2, ch = o.hh || 3.2, geo = new THREE.PlaneGeometry(cw, ch, 10, 14), c = document.createElement('canvas'); c.width = 128; c.height = 192; const g = c.getContext('2d');
    g.fillStyle = o.color || '#c8442f'; g.fillRect(0, 0, 128, 192); g.fillStyle = o.emblem || '#f0d068'; g.beginPath(); g.arc(64, 70, 34, 0, 7); g.fill(); g.fillStyle = o.color || '#c8442f'; g.beginPath(); g.arc(64, 70, 18, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 150, 128, 12);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = std({ map: t, side: THREE.DoubleSide, roughness: 1 }), tm = kit.tm;
    m.onBeforeCompile = (s) => { s.uniforms.uTm = tm; s.vertexShader = 'uniform float uTm;\n' + s.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float k = (uv.x); transformed.z += sin(uTm*3. + position.y*1.8 + position.x*2.)*.22*k + sin(uTm*5.3 + position.y*3.)*.05*k; transformed.y -= k*k*.1;`); };
    const cl = mesh(geo, m, [cw / 2 + 0.06, h - ch / 2 - 0.2, 0], { parent: gp, cast: false }); return gp; };

  // ---------- fuego y luz práctica ----------
  /** campfire({ pos:[x,z], I, size }) -> registra la lámpara y devuelve eventos FX (se añaden a world.fx) */
  kit.campfire = (o, f0 = 0, f1 = 99999) => { const [x, z] = o.pos, y = o.y ?? kit.heightAt(x, z), gp = new THREE.Group(); gp.position.set(x, y, z); scene.add(gp); const r = rng(9);
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; const s = mesh(new THREE.IcosahedronGeometry(0.2 + r() * 0.08, 0), mats.stone, [Math.cos(a) * 0.62, 0.12, Math.sin(a) * 0.62], { parent: gp }); s.scale.set(1, 0.7, 1); }
    for (let i = 0; i < 4; i++) { const lg = mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.95, 6), std({ color: '#2a1c14', emissive: '#a03a10', emissiveIntensity: 0.6, roughness: 1 }), [0, 0.2, 0], { parent: gp, cast: false }); lg.rotation.set(1.2, i * 1.57 + 0.4, 0); lg.position.set(Math.cos(i * 1.57 + 0.4) * 0.2, 0.2, Math.sin(i * 1.57 + 0.4) * 0.2); }
    lamp({ pos: [x, y + 0.8, z], color: '#ff9a40', I: o.I ?? 46, size: o.size ?? 3.2, flicker: 0.32, key: o.key || 'fire', glow: 1.6 });
    return kit.fireFx([x, y + 0.25, z], f0, f1, o.scale || 1); };
  kit.fireFx = (pos, f0, f1, s = 1) => [{ type: 'fire', f0, f1, pos, rate: 26, spread: [0.3 * s, 0.05, 0.3 * s], size: s, seed: 3 }, { type: 'ember', f0, f1, pos: [pos[0], pos[1] + 0.4, pos[2]], rate: 7, spread: [0.3, 0.2, 0.3], seed: 5 }, { type: 'spark', f0, f1, pos: [pos[0], pos[1] + 0.3, pos[2]], rate: 3, spread: [0.2, 0.1, 0.2], seed: 8 }, { type: 'smoke', f0, f1, pos: [pos[0], pos[1] + 1.1, pos[2]], rate: 2.2, spread: [0.3, 0.2, 0.3], size: s, seed: 11 }];
  /** lantern({ pos, hang, color, I }) : cuerpo emisivo + lámpara */
  kit.lantern = (o) => { const [x, y, z] = o.pos, gp = new THREE.Group(); gp.position.set(x, y, z); scene.add(gp);
    mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.42, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.5, 0.6) }), [0, 0, 0], { parent: gp, cast: false });
    mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.05, 8), mats.iron, [0, 0.24, 0], { parent: gp, cast: false }); mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.05, 8), mats.iron, [0, -0.24, 0], { parent: gp, cast: false });
    if (o.hang) mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 4), mats.iron, [0, 0.55, 0], { parent: gp, cast: false });
    lamp({ pos: [x, y, z], color: o.color || '#ffc070', I: o.I ?? 14, size: o.size ?? 1.3, flicker: 0.1, key: o.key, glow: 2.0 }); return gp; };
  kit.torch = (o, f0 = 0, f1 = 99999) => { const [x, z] = o.pos, y = o.y ?? kit.heightAt(x, z), h = o.h || 2.2; mesh(new THREE.CylinderGeometry(0.04, 0.06, h, 6), mats.wood, [x, y + h / 2, z], { cast: false });
    lamp({ pos: [x, y + h + 0.2, z], color: '#ff9a3c', I: o.I ?? 22, size: 1.8, flicker: 0.3, key: o.key, glow: 1.8 }); return kit.fireFx([x, y + h, z], f0, f1, 0.35); };

  // ---------- haz de luz (rayos de ventana/rendija) ----------
  kit.shaft = (o) => { const A = new THREE.Vector3(...o.from), B = new THREE.Vector3(...o.to), len = A.distanceTo(B), w0 = o.w0 ?? 0.3, w1 = o.w1 ?? o.w ?? 1.2;
    const geo = new THREE.PlaneGeometry(1, 1, 1, 1), c = new THREE.Color(o.color || '#ffd9a0').multiplyScalar(o.I ?? 0.5);
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { col: { value: c }, w0: { value: w0 }, w1: { value: w1 }, tm: kit.tm },
      vertexShader: `varying vec2 vUv; uniform float w0, w1; void main(){ vUv = uv; float w = mix(w0, w1, uv.y); vec3 p = vec3(position.x*w, (uv.y)*1., 0.); gl_Position = projectionMatrix*modelViewMatrix*vec4(p.x, p.y*${len.toFixed(3)}, 0., 1.); }`,
      fragmentShader: `uniform vec3 col; uniform float tm; varying vec2 vUv; void main(){ float e = 1. - abs(vUv.x*2.-1.); e = pow(e, 1.8); float f = (1. - vUv.y*.85) * smoothstep(0., .08, vUv.y); float n = .85 + .15*sin(tm*.8 + vUv.y*9.); gl_FragColor = vec4(col*e*f*n, e*f*.7); }` });
    const grp = new THREE.Group(); grp.position.copy(A); const dir = B.clone().sub(A).normalize(); grp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); scene.add(grp);
    for (let k = 0; k < 2; k++) { const p = new THREE.Mesh(geo, m); p.rotation.y = k * Math.PI / 2; p.userData.ndSkip = true; p.renderOrder = 6; p.frustumCulled = false; grp.add(p); } return grp; };

  // ---------- multitudes (cientos de personajes como billboards fundidos) ----------
  /** crowd({ variants:[{who,opts,tint}...], list:[[x,y,z,variant,scale],...], cols }) */
  kit.crowd = (o) => {
    const vars = o.variants, cols = o.cols || 8, rowsN = Math.ceil(vars.length / cols), cw = 150, ch = 250, cvs = document.createElement('canvas'); cvs.width = cw * cols; cvs.height = ch * rowsN; const g = cvs.getContext('2d');
    vars.forEach((v, i) => { g.save(); g.translate((i % cols) * cw, ((i / cols) | 0) * ch); g.beginPath(); g.rect(0, 0, cw, ch); g.clip(); g.scale(cw / 600, ch / 1000); try { T.romanFront(new T.Pen(g), v.who, { seed: 3 + i * 5, expr: v.expr || 'neutral', L: 'hang', R: 'hang', ...v.opts }); } catch (e) { } g.restore(); });
    const at = new THREE.CanvasTexture(cvs); at.colorSpace = THREE.SRGBColorSpace; at.anisotropy = 4; at.generateMipmaps = true;
    const n = o.list.length, pos = new Float32Array(n * 12), cr = new Float32Array(n * 8), cu = new Float32Array(n * 8), inf = new Float32Array(n * 16), idx = new Uint32Array(n * 6), rr = rng(o.seed || 17);
    o.list.forEach(([x, y, z, v = 0, s = 1], i) => { const vi = v < 0 ? (rr() * vars.length) | 0 : v, cx = vi % cols, cy = (vi / cols) | 0, tint = new THREE.Color(vars[vi].tint || '#ffffff'); const sj = s * (0.92 + rr() * 0.16), ph = rr() * 40;
      const cs = [[-1, 0], [1, 0], [1, 1], [-1, 1]]; for (let k = 0; k < 4; k++) { const a = i * 4 + k; pos.set([x, y, z], a * 3); cr.set(cs[k], a * 2); cu.set([(cx + (cs[k][0] + 1) / 2) / cols, 1 - (cy + 1 - cs[k][1]) / rowsN], a * 2); inf.set([sj, ph, tint.r * 0.9 + 0.1, tint.g * 0.9 + 0.1], a * 4); } idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6); });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('corner', new THREE.BufferAttribute(cr, 2)); geo.setAttribute('cuv', new THREE.BufferAttribute(cu, 2)); geo.setAttribute('info', new THREE.BufferAttribute(inf, 4)); geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1e5);
    const VS = `attribute vec2 corner, cuv; attribute vec4 info; uniform float tm, bob; varying vec2 vUv; varying vec3 vW; varying vec3 vTint; varying float vPx; varying float vD;
      void main(){ vec3 right = normalize(vec3(viewMatrix[0][0], 0., viewMatrix[2][0])); float s = info.x; float b = abs(sin(tm*5. + info.y))*.06*bob;
        vec3 w = position + right*corner.x*.675*s + vec3(0., (corner.y*2.25 - .056)*s + b*s, 0.); vW = w; vUv = cuv; vTint = vec3(info.z, info.w, info.z*.5+info.w*.5); vPx = corner.x;
        vec4 mv = viewMatrix*vec4(w,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`;
    const NPL = LU.plI.value.length;
    const m = new THREE.ShaderMaterial({ transparent: false, side: THREE.DoubleSide, fog: true, uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), map: { value: at }, tm: kit.tm, bob: { value: o.bob ?? 1 }, ...LU },
      vertexShader: `#include <fog_pars_vertex>\n` + VS.replace('vec4 mv = viewMatrix*vec4(w,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }', 'vec4 mvPosition = viewMatrix*vec4(w,1.); vD = -mvPosition.z; gl_Position = projectionMatrix*mvPosition;\n#include <fog_vertex>\n}'),
      fragmentShader: `#include <fog_pars_fragment>
        uniform sampler2D map; uniform vec3 sunDir, sunCol, hemiSky, hemiGnd, ref; uniform float litAmt; uniform vec3 plPos[${NPL}]; uniform vec3 plCol[${NPL}]; uniform float plI[${NPL}]; varying vec2 vUv; varying vec3 vW; varying vec3 vTint; varying float vPx; varying float vD;
        void main(){ vec4 t = texture2D(map, vUv); if (t.a < .5) discard; vec3 N0 = normalize(vec3(cameraPosition.x-vW.x, 0., cameraPosition.z-vW.z)); vec3 R = vec3(N0.z, 0., -N0.x);
          vec3 n = normalize(N0*.85 + R*vPx*.85 + vec3(0.,.25,0.)); vec3 lit = mix(hemiGnd, hemiSky, n.y*.5+.5) + sunCol*clamp((dot(n, normalize(sunDir))+.35)/1.35, 0., 1.);
          for (int i=0;i<${NPL};i++){ vec3 d = plPos[i]-vW; float dd = dot(d,d); lit += plCol[i]*(plI[i]/(dd+.8))*clamp(dot(n,normalize(d))*.6+.4, 0., 1.); }
          vec3 k = clamp(lit/max(ref, vec3(.001)), vec3(.28), vec3(2.4)); gl_FragColor = vec4(t.rgb*vTint*mix(vec3(1.), k, litAmt), 1.);
          #include <fog_fragment>
        }` });
    const nd = new THREE.ShaderMaterial({ uniforms: { map: { value: at }, tm: kit.tm, bob: { value: o.bob ?? 1 } }, vertexShader: VS, side: THREE.DoubleSide,
      fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vD; void main(){ if (texture2D(map, vUv).a < .5) discard; gl_FragColor = vec4(0.,0.,0.,vD); }` });
    const cm = new THREE.Mesh(geo, m); cm.userData.nd = nd; cm.frustumCulled = false; cm.castShadow = false; cm.receiveShadow = false; scene.add(cm); return cm;
  };

  return kit;
};
