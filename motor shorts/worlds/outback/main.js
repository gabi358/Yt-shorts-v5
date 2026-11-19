import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import { clamp, M as MO } from './motion.js';
import { SHOTS, TOTAL, shotAt, camAt, dofAt, LIGHTS, lightFor, actorsAt, worldAt, fxAt } from './story.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.08, 1500);
const rx = (a) => a * Math.PI / 180;

// ---------- materials ----------
const grad = (() => { const d = new Uint8Array([90, 90, 90, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 2, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (opts) => new THREE.MeshToonMaterial({ gradientMap: grad, ...opts });
const texM = (c, rx_ = 1, ry_ = 1, color = '#ffffff') => toon({ map: P.tex(c, rx_, ry_), color });
const M = {
  plank: texM(P.planks(1), 1, 6), beam: texM(P.beam(2), 1, 2), beamDark: texM(P.beam(3, [28, 36, 30]), 1, 2),
  rot: texM(P.rotten(4), 1, 1), rotB: texM(P.rotten(14), 1, 1),
  stone: texM(P.stone(4), 1, 1), stoneMoss: texM(P.mossy(P.stone(4), 5, 1.2), 1, 1),
  grass: texM(P.grass(6), 40, 40), dirt: texM(P.dirt(7), 6, 30), plaster: texM(P.plaster(8), 1, 1), plaster2: texM(P.plaster(18, 28), 1, 1),
  roof: texM(P.roof(9), 2, 2), marble: texM(P.marble(10), 1, 1), marbleTop: toon({ color: '#ece2cf' }),
  trunk: toon({ color: '#6a4a32' }), cypress: toon({ color: '#3f6b36' }), pine: toon({ color: '#5c8a3c' }), bush: toon({ color: '#6c9a42' }),
  hill: toon({ color: '#7aa64c' }), hillFar: toon({ color: '#86ad60' }), mount: toon({ color: '#8fa7b8' }), snow: toon({ color: '#f4f6fa' }),
  iron: toon({ color: '#5c5a57' }), bronze: toon({ color: '#b08a4a' }), wood: toon({ color: '#7a5434' }), door: toon({ color: '#5a3a24' }),
  window: toon({ color: '#2b2430' }), red: toon({ color: '#b8282b' }),
};
M.banner = new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(P.banner()), alphaTest: 0.5, side: THREE.DoubleSide });
// helmet
const helmetIn = P.tex(P.helmetInside()); helmetIn.wrapS = helmetIn.wrapT = THREE.ClampToEdgeWrapping;
M.helmIn = new THREE.MeshToonMaterial({ gradientMap: grad, map: helmetIn, side: THREE.BackSide });
M.helmOut = toon({ color: '#8f8a7e' });

// ---------- ink / normal-depth contract ----------
const NOINK = 'noink'; // userData flag: never outlined (cards, fx, water handled specially)
const ndMat = new THREE.ShaderMaterial({
  vertexShader: `varying vec3 vN; varying float vD; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vD); }`,
  side: THREE.DoubleSide,
});
const cardNd = (map) => new THREE.ShaderMaterial({
  uniforms: { map: { value: map } },
  vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv=uv; vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vD; void main(){ if(texture2D(map,vUv).a<.5) discard; gl_FragColor=vec4(0.,0.,0.,vD); }`,
  side: THREE.DoubleSide,
});
const waterNd = new THREE.ShaderMaterial({
  vertexShader: `varying float vD; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `varying float vD; void main(){ gl_FragColor=vec4(.5,1.,.5,vD); }`,
});

// ---------- helpers ----------
const add = (geo, mat, x = 0, y = 0, z = 0, parent = scene, opts = {}) => {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = opts.cast ?? true; m.receiveShadow = true; parent.add(m); return m;
};
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const uvScale = (geo, su, sv) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };
/** box with world-scaled UVs per face (texel density 1 tile per `t` metres) */
const tbox = (w, h, d, t = 2) => {
  const g = box(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); }
  return g;
};

// ---------- sky ----------
const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, sunSize: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 top, hor, sunDir, sunCol; uniform float sunSize; varying vec3 vP;
    void main(){ float h = clamp(vP.y,0.,1.); vec3 c = mix(hor, top, pow(h, .55)); if(vP.y<0.) c = hor;
      float s = dot(normalize(vP), normalize(sunDir)); c += sunCol * (smoothstep(1.-sunSize, 1.-sunSize*.6, s) + .35*pow(max(s,0.), 24.)*step(.001,sunSize));
      gl_FragColor = vec4(c,1.); }`,
}));
sky.userData.sky = true; scene.add(sky);

// ---------- lights ----------
const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 2); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2;
scene.add(sun); scene.add(sun.target);
scene.fog = new THREE.Fog('#ffffff', 40, 600);

// ---------- world: Australian outback wheat belt 1932 ----------
const DECK = 6, SEA = DECK - 0.9;
const world = new THREE.Group(); scene.add(world);
const waterU = { t: { value: 0 }, deep: { value: new THREE.Color('#2f6f8f') }, shal: { value: new THREE.Color('#5fa8bf') }, glint: { value: new THREE.Color('#e9f6ff') } };
const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const R0 = P.rng(77);
const MM = {
  red: toon({ color: '#c98558' }), red2: toon({ color: '#b3703f' }), road: toon({ color: '#d7a46c' }), wheat: toon({ color: '#e3b94a' }), wheat2: toon({ color: '#d1a23a' }), wheat3: toon({ color: '#efcf68' }),
  gum: toon({ color: '#7d8a5a' }), gum2: toon({ color: '#6f7d50' }), bark: toon({ color: '#c9b79b' }), tin: toon({ color: '#b9bcc0' }), cab: toon({ color: '#6f7a4a' }), cabRoof: toon({ color: '#8a8456' }),
  tire: toon({ color: '#2c2c2e' }), steel: toon({ color: '#3a3b40' }), brass: toon({ color: '#d9a845' }), emuB: toon({ color: '#7b5d47' }), emuN: toon({ color: '#a8b7c2' }), helm: toon({ color: '#6a7076' }),
  wall: toon({ color: '#e8dcc0' }), roof: toon({ color: '#b5452e' }), post: toon({ color: '#8a6240' }),
};
// ground: huge red plain + paler wheat belt
add(new THREE.CylinderGeometry(900, 900, 4, 48), MM.red, 0, DECK - 2, -200, world, { cast: false });
add(new THREE.PlaneGeometry(130, 80), MM.wheat2, 0, DECK + 0.02, -26, world, { cast: false }).rotation.x = -Math.PI / 2;
add(new THREE.PlaneGeometry(5.5, 400), MM.road, 6, DECK + 0.03, -120, world, { cast: false }).rotation.x = -Math.PI / 2;
for (const [x, z, r] of [[-30, 8, 14], [34, 10, 18], [-55, -4, 10], [58, -6, 12]]) { const d = add(new THREE.CircleGeometry(r, 20), MM.red2, x, DECK + 0.025, z, world, { cast: false }); d.rotation.x = -Math.PI / 2; }
// distant mesas / ranges
for (const [x, z, r, h, m] of [[-260, -420, 90, 60, MM.red2], [90, -520, 130, 70, MM.red2], [380, -380, 80, 50, MM.red2], [-520, -300, 110, 55, MM.red2], [-60, -700, 220, 50, M.hillFar]]) {
  add(new THREE.CylinderGeometry(r * 0.7, r, h, 9), m, x, DECK + h / 2 - 2, z, world, { cast: false });
}
// merge helper
function merged(geos, mat, parent = world) {
  const pos = [], nor = [], uv = [], idx = []; let off = 0;
  for (const g of geos) { const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv, i = g.index;
    for (let k = 0; k < p.count; k++) { pos.push(p.getX(k), p.getY(k), p.getZ(k)); nor.push(n.getX(k), n.getY(k), n.getZ(k)); uv.push(u.getX(k), u.getY(k)); }
    for (let k = 0; k < i.count; k++) idx.push(i.getX(k) + off); off += p.count; }
  const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); G.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); G.setIndex(idx);
  const m = new THREE.Mesh(G, mat); m.castShadow = false; m.receiveShadow = true; parent.add(m); return m;
}
// wheat tufts (3 colour layers)
for (const [mat, n] of [[MM.wheat, 380], [MM.wheat2, 330], [MM.wheat3, 300]]) {
  const gs = [];
  for (let i = 0; i < n; i++) {
    const x = (R0() - 0.5) * 100, z = -3 - R0() * 62; if (Math.abs(x - 6) < 3.6) continue; if (x < -12 && x > -34 && z > -18) continue;
    const g = new THREE.ConeGeometry(0.3 + R0() * 0.15, 0.9 + R0() * 0.5, 5); g.translate(x, DECK + 0.45, z); gs.push(g);
  }
  merged(gs, mat);
}
// eucalyptus trees
const gum = (x, z, s = 1) => {
  const g = new THREE.Group(); g.position.set(x, DECK, z); world.add(g);
  add(new THREE.CylinderGeometry(0.22 * s, 0.34 * s, 4.2 * s, 6), MM.bark, 0, 2.1 * s, 0, g);
  for (const [dx, dy, dz, r] of [[0, 4.8, 0, 1.9], [-1.3, 4.1, 0.4, 1.4], [1.2, 4.4, -0.3, 1.5]]) { const b = add(new THREE.SphereGeometry(r * s, 8, 6), (dx > 0 ? MM.gum2 : MM.gum), dx * s, dy * s, dz * s, g); b.scale.y = 0.65; }
};
for (const [x, z, s] of [[-16, 4, 1.1], [18, 3, 1], [-42, -6, 1.2], [44, -8, 1.1], [-8, -50, 1.3], [22, -52, 1.2], [-30, -48, 1], [40, -46, 1.1], [-60, 6, 1.2], [62, 4, 1.3]]) gum(x, z, s);
// farmhouse + barn + windmill + water tank
const house = new THREE.Group(); house.position.set(-24, DECK, -12); world.add(house);
add(tbox(7, 3.2, 5, 2), MM.wall, 0, 1.6, 0, house);
{ const sh = new THREE.Shape(); sh.moveTo(-4.2, 0); sh.lineTo(4.2, 0); sh.lineTo(0, 1.6); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: 5.6, bevelEnabled: false }); g.translate(0, 0, -2.8); add(g, MM.roof, 0, 3.2, 0, house); }
add(box(1.2, 2.1, 0.12), M.door, 0.8, 1.05, 2.55, house); add(box(1.1, 1.0, 0.12), M.window, -1.9, 1.8, 2.55, house);
add(box(5, 0.2, 2.2), M.wood, 0, 0.1, 3.6, house);
const mill = new THREE.Group(); mill.position.set(14, DECK, -13); world.add(mill);
for (const [a, b] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) { const l = add(new THREE.CylinderGeometry(0.08, 0.14, 10, 5), M.wood, a * 0.7, 5, b * 0.7, mill); l.rotation.z = -a * 0.1; l.rotation.x = b * 0.1; }
const rotor = new THREE.Group(); rotor.position.set(0, 10.4, 1.1); mill.add(rotor);
for (let i = 0; i < 8; i++) { const bl = add(box(0.35, 2.1, 0.06), MM.tin, 0, 1.2, 0, rotor); const gg = new THREE.Group(); gg.rotation.z = i * Math.PI / 4; rotor.remove(bl); gg.add(bl); rotor.add(gg); }
add(new THREE.CylinderGeometry(1.4, 1.4, 2.4, 14), MM.tin, 8, 1.2, -5, world);
const barn = new THREE.Group(); barn.position.set(-38, DECK, -22); world.add(barn);
add(box(8, 3.6, 6), MM.roof, 0, 1.8, 0, barn);
// fence (grows with count)
const fenceP = [], fenceR = [];
for (let i = 0; i < 24; i++) { const x = -20 + i * 1.9; fenceP.push(add(box(0.2, 1.5, 0.2), MM.post, x, DECK + 0.75, -7, world)); }
fenceR.push(add(box(46, 0.1, 0.1), M.wood, 3, DECK + 0.55, -7, world), add(box(46, 0.1, 0.1), M.wood, 3, DECK + 1.1, -7, world));
// ---- stylised herd ----
function emu3(x, z, s = 1, helmet = false) {
  const b = [], n = [];
  const body = new THREE.SphereGeometry(0.55 * s, 7, 5); body.scale(1, 1.15, 1.3); body.translate(x, 1.05 * s + DECK, z); b.push(body);
  const neck = new THREE.CylinderGeometry(0.07 * s, 0.1 * s, 1.0 * s, 5); neck.translate(x, 1.95 * s + DECK, z + 0.15 * s); n.push(neck);
  const head = new THREE.SphereGeometry(0.15 * s, 6, 5); head.translate(x, 2.5 * s + DECK, z + 0.2 * s); n.push(head);
  for (const dx of [-0.16, 0.16]) { const l = new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 0.9 * s, 4); l.translate(x + dx * s, 0.45 * s + DECK, z); n.push(l); }
  if (helmet) { const h = new THREE.SphereGeometry(0.2 * s, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2); h.translate(x, 2.55 * s + DECK, z + 0.2 * s); n.push(h); }
  return [b, n];
}
function herd(count, w, d, mat2 = MM.emuN, helmet = false, grid = null) {
  const g = new THREE.Group(); world.add(g); const B = [], N = [];
  for (let i = 0; i < count; i++) {
    let x, z; if (grid) { x = ((i % grid) - (grid - 1) / 2) * 2.2; z = -Math.floor(i / grid) * 2.2; } else { x = (R0() - 0.5) * w; z = (R0() - 0.5) * d; }
    const [b, n] = emu3(x, z, 0.9 + R0() * 0.25, helmet); B.push(...b); N.push(...n);
  }
  merged(B, MM.emuB, g); merged(N, helmet ? MM.helm : mat2, g); return g;
}
const herds = [herd(50, 18, 12), herd(50, 18, 12), herd(50, 18, 12), herd(50, 18, 12)];
const armyG = herd(200, 0, 0, MM.emuN, true, 20); armyG.visible = false;
// ---- truck ----
const truck = new THREE.Group(); world.add(truck);
add(tbox(2.0, 2.0, 2.2, 2), MM.cab, 1.9, 1.5, 0, truck); add(box(2.1, 0.2, 2.3), MM.cabRoof, 1.9, 2.6, 0, truck);
add(box(0.12, 0.8, 1.7), M.window, 2.95, 1.9, 0, truck);
add(tbox(3.2, 1.1, 2.3, 2), M.wood, -0.9, 1.15, 0, truck);
add(box(5.6, 0.4, 2.1), MM.steel, 0.4, 0.6, 0, truck);
for (const [x, z] of [[2.2, 1.1], [2.2, -1.1], [-1.5, 1.1], [-1.5, -1.1]]) { const w = add(new THREE.CylinderGeometry(0.62, 0.62, 0.35, 14), MM.tire, x, 0.62, z, truck); w.rotation.x = Math.PI / 2; }
add(box(0.15, 0.9, 0.15), MM.steel, -0.9, 2.1, 0, truck);
{ const gun = add(new THREE.CylinderGeometry(0.09, 0.09, 1.6, 8), MM.steel, -0.1, 2.55, 0, truck); gun.rotation.z = -Math.PI / 2; add(new THREE.CylinderGeometry(0.28, 0.28, 0.5, 10), MM.steel, -0.95, 2.55, 0, truck).rotation.z = -Math.PI / 2; }
truck.visible = false;
// ---- spent shells ----
{ const gs = []; for (let i = 0; i < 260; i++) { const g = new THREE.CylinderGeometry(0.05, 0.05, 0.16, 5); g.rotateZ(Math.PI / 2); g.rotateY(R0() * 6); g.translate(-3 + R0() * 6, DECK + 0.05, -1 + R0() * 4.5); gs.push(g); } var shells = merged(gs, MM.brass); shells.visible = false; }
// clouds: painted billboards far away (no fog, no ink)
const clouds = [];
{ const r = P.rng(90);
  for (let i = 0; i < 14; i++) {
    const c = document.createElement('canvas'); c.width = 600; c.height = 400; const pen = new T.Pen(c.getContext('2d')); pen.ol = 0;
    pen.g.translate(300, 200); pen.g.scale(1.4, 1.2); pen.g.translate(-300, -200); T.fxCloud(pen, i + 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.667), new THREE.MeshBasicMaterial({ map: P.tex(c), transparent: true, fog: false, depthWrite: false }));
    const a = r() * Math.PI * 2, d = 650 + r() * 250; m.position.set(Math.cos(a) * d, 120 + r() * 160, Math.sin(a) * d); m.scale.setScalar(160 + r() * 140);
    m.userData.ndSkip = true; m.renderOrder = -1; scene.add(m); clouds.push(m);
  } }

// ---------- helmet prop (3D) ----------
const helmet = new THREE.Group(); scene.add(helmet); helmet.visible = false;
{
  const inGeo = new THREE.SphereGeometry(0.98, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  const uv = inGeo.attributes.uv, pos = inGeo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5 - pos.getX(i) / 2.1, 0.5 - pos.getZ(i) / 2.1);
  add(inGeo, M.helmIn, 0, 0, 0, helmet);
  add(new THREE.SphereGeometry(1.0, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), M.helmOut, 0, 0, 0, helmet);
  const band = add(new THREE.TorusGeometry(1.0, 0.07, 8, 48), toon({ color: '#a88a4a' }), 0, 0.02, 0, helmet); band.rotation.x = Math.PI / 2;
  const crest = add(new THREE.CylinderGeometry(1.3, 1.3, 0.22, 32, 1, false, 0, Math.PI), toon({ color: '#8d4b3f' }), 0, 0.95, 0, helmet);
  crest.rotation.z = Math.PI / 2; crest.rotation.y = Math.PI / 2; crest.scale.set(1, 1, 0.6);
}

// ---------- cards ----------
const CW = 1200, CH = 2000, CM = 2.25; // canvas px, card height in metres (design 600x1000 -> 2.25 m)
const cardGeo = new THREE.PlaneGeometry(CM * 0.6, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
const blobTex = P.tex(P.radial('20,14,30', 0.6));
class Card {
  constructor(scale = 1) {
    [this.c, this.g] = (() => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return [c, c.getContext('2d')]; })();
    this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 4;
    this.mat = new THREE.MeshBasicMaterial({ map: this.t, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: true });
    this.mesh = new THREE.Mesh(cardGeo, this.mat); this.mesh.userData.nd = cardNd(this.t); this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.t, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, fog: true }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.userData.ndSkip = true; this.blob.renderOrder = 1;
    scene.add(this.mesh); scene.add(this.blob); this.key = ''; this.mesh.visible = this.blob.visible = false;
  }
  draw(key, fn) {
    if (key === this.key) return; this.key = key;
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0);
    const p = new T.Pen(g); fn(p); this.t.needsUpdate = true;
  }
}
const cards = []; const getCard = (i) => cards[i] || (cards[i] = new Card());

// ---------- render targets & post ----------
const rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
const rtNd = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const rtInk = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsGeo = new THREE.PlaneGeometry(2, 2);
const fs = (mat) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(fsGeo, mat)); return s; };
const inkU = { col: { value: rtColor.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, px: { value: 1.6 }, fogCol: { value: new THREE.Color() },
  sat: { value: 1.08 }, lift: { value: new THREE.Color(0, 0, 0) }, gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.22 }, flash: { value: 0 }, rain: { value: 0 }, tm: { value: 0 } };
const inkScene = fs(new THREE.ShaderMaterial({ uniforms: inkU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D col, nd; uniform vec2 res; uniform float px, sat, vig, flash, rain, tm; uniform vec3 fogCol, lift, gain; varying vec2 vUv;
  float edgeAt(vec2 uv, float r){
    vec4 c = texture2D(nd, uv); if (dot(c.rgb,c.rgb) < .01) return 0.; float d = c.a; vec3 n = c.rgb*2.-1.;
    float e = 0.; float rr = r * clamp(7./d, .62, 1.25);
    for (int i=0;i<16;i++){ float a = float(i)*.785398 + (i>7 ? .39 : 0.); float k = i>7 ? .5 : 1.;
      vec2 o = vec2(cos(a), sin(a))*rr*k/res; vec4 s = texture2D(nd, uv+o);
      float ds = s.a; bool card = dot(s.rgb,s.rgb) < .01;
      if (card && ds > 0.) continue;            // character cards: never outlined by the world ink
      if (card) ds = 1e4;                        // sky
      vec3 ns = s.rgb*2.-1.;
      e = max(e, smoothstep(.006, .02, (ds - d)/d));                           // depth jump, near side only
      if (!card && abs(ds-d)/d < .06) e = max(e, smoothstep(.88, .72, dot(n, ns)) * .9); // crease
    }
    return e * (1. - smoothstep(140., 520., d)*.8);
  }
  void main(){
    vec3 c = texture2D(col, vUv).rgb;
    float e = edgeAt(vUv, px);
    c = mix(c, vec3(.012,.01,.014), e);
    if (flash < -0.5) c = vec3(e);
    if (rain > 0.) { for (int k=0;k<2;k++){ float sc = k==0 ? 170. : 95.; float u = vUv.x*sc + vUv.y*sc*.22*(k==0?1.:.8); float id = floor(u); float hh = fract(sin(id*91.7+float(k)*7.)*437.5);
        float y = fract(vUv.y*(1.6+hh) + tm*(2.4+hh*1.8) + hh*10.); float s1 = smoothstep(0.,.03,y)*smoothstep(.24,.08,y); float w = 1. - abs(fract(u)-.5)*2.; s1 *= smoothstep(.55,.9,w)*step(.45,hh);
        c = mix(c, vec3(.82,.9,1.), s1*rain*.5); } }
    float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, sat);
    c = c*gain + lift;
    vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.75), q*vec2(1.,.75))*2.2;
    c = mix(c, vec3(1.), flash);
    gl_FragColor = vec4(c,1.); }` }));
const dofU = { src: { value: rtInk.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, focus: { value: 5 }, cinf: { value: 0 }, near: { value: 1 } };
const dofScene = fs(new THREE.ShaderMaterial({ uniforms: dofU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D src, nd; uniform vec2 res; uniform float focus, cinf, near; varying vec2 vUv;
  float coc(vec2 uv){ float d = texture2D(nd, uv).a; if (d <= 0.) d = 2000.; float k = 1. - focus/d; return k > 0. ? cinf*k : min(-k*cinf*near, cinf*1.4); }
  void main(){
    float c0 = coc(vUv);
    if (cinf < .5 || c0 < .6) { gl_FragColor = linearToOutputTexel(vec4(texture2D(src, vUv).rgb, 1.)); return; }
    vec3 acc = vec3(0.); float wsum = 0.;
    for (int i=0;i<48;i++){ float fi = float(i); float r = sqrt((fi+.5)/48.); float a = fi*2.39996;
      vec2 o = vec2(cos(a), sin(a))*r*c0/res; float cs = coc(vUv+o);
      float w = smoothstep(r*c0-1.5, r*c0+.5, cs + .5);
      acc += texture2D(src, vUv+o).rgb*w; wsum += w; }
    gl_FragColor = linearToOutputTexel(vec4(acc/max(wsum,1e-3), 1.)); }` }));
// final copy with sRGB handled by the renderer output (we render to screen with linear->sRGB in the shader chunk)
dofScene.children[0].material.toneMapped = false;

// ---------- per-frame state ----------
const tmpV = new THREE.Vector3();
function applyLight(L, f) {
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemi;
  sun.color.set(L.sun); sun.intensity = L.sunI;
  scene.fog.color.set(L.fog); scene.fog.near = L.fogNear; scene.fog.far = L.fogFar;
  skyU.top.value.set(L.skyTop); skyU.hor.value.set(L.skyHor); skyU.sunCol.value.set(L.sunDisc || '#000'); skyU.sunSize.value = L.sunSize || 0;
  inkU.sat.value = L.sat; inkU.gain.value.set(L.gain || '#ffffff'); inkU.lift.value.set(L.lift || '#000000');
  waterU.deep.value.set(L.waterDeep); waterU.shal.value.set(L.waterShal); waterU.glint.value.set(L.glint);
}
function placeSun(L, focus) {
  // sun direction from azimuth/elevation in world space
  const az = rx(L.az), el = rx(L.el); tmpV.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  skyU.sunDir.value.copy(tmpV);
  sun.position.copy(focus).addScaledVector(tmpV, 80); sun.target.position.copy(focus);
  const ext = L.shadowExt || 30, sc = sun.shadow.camera; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 200; sc.updateProjectionMatrix();
}

function worldState(S, f) {
  herds.forEach((h, i) => { h.visible = !!S.herd; if (S.herd) { const H = S.herd, a = i * Math.PI / 2 + 0.7; h.position.set(H.x + Math.cos(a) * H.spread, 0, H.z + Math.sin(a) * H.spread * 0.7); } });
  armyG.visible = !!S.army; if (S.army) armyG.position.set(S.army.x, 0, S.army.z);
  truck.visible = !!S.truck; if (S.truck) { truck.position.set(S.truck.x, DECK, S.truck.z); truck.rotation.y = S.truck.ry; }
  shells.visible = !!S.shells;
  fenceP.forEach((p, i) => { p.visible = i < S.fence; p.scale.y = i < S.fence ? Math.min(1, MO.back(clamp(S.fence - i))) : 1; });
  fenceR.forEach((r) => { r.visible = S.fence > 20; });
  mill.children.forEach((c) => { if (c === rotor) c.rotation.z = f * 0.06; });
  waterU.t.value = f / 30;
}

function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    c.draw(a.key, a.draw);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0), a.roll || 0);
    c.mat.color.set(a.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1;
    c.mesh.castShadow = a.shadow !== false;
    c.mesh.renderOrder = a.order || 2;
    if (a.blob !== false && a.y < DECK + 0.5) { c.blob.visible = true; c.blob.position.set(a.x, (a.ground ?? DECK) + 0.02, a.z); c.blob.scale.set(0.95 * s, 0.6 * s, 1); }
  });
}

const helmetState = (h) => {
  helmet.visible = !!h; if (!h) return;
  helmet.position.set(h.x, h.y, h.z); helmet.rotation.set(h.rx || 0, h.ry || 0, h.rz || 0); helmet.scale.setScalar(h.s || 0.17);
};

const swapForNd = (on) => {
  scene.traverse((o) => {
    if (!o.isMesh) return;
    if (on) {
      o.userData.mat0 = o.material;
      if (o.userData.ndSkip) { o.userData.vis0 = o.visible; o.visible = false; return; }
      if (o === sky || o.userData.sky) { o.userData.vis0 = o.visible; o.visible = false; return; }
      o.material = o.userData.nd || ndMat;
    } else {
      o.material = o.userData.mat0; if (o.userData.vis0 !== undefined) { o.visible = o.userData.vis0; delete o.userData.vis0; }
    }
  });
};

window.renderFrame = (f) => {
  const S = shotAt(f), L = lightFor(S, f), C = camAt(f);
  applyLight(L, f);
  camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0));
  camera.fov = C.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const W_ = worldAt(f); worldState(W_, f);
  placeSun(L, new THREE.Vector3(...(C.shadowAt || C.look)));
  drawActors([...actorsAt(f, T), ...fxAt(f, T)], camera);
  
  sky.position.copy(camera.position);
  for (const c of clouds) c.quaternion.copy(camera.quaternion);
  // pass A: colour
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  // pass B: normal + depth
  const fog = scene.fog; scene.fog = null; const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.shadowMap.autoUpdate = false;
  swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false);
  scene.fog = fog; renderer.shadowMap.enabled = sm; renderer.shadowMap.autoUpdate = true;
  if (window.DEBUG_ND) { const dm = new THREE.MeshBasicMaterial({ map: rtNd.texture }); const ds = fs(dm); renderer.setRenderTarget(null); renderer.render(ds, fsCam); return true; }
  // ink + grade
  const D = dofAt(f);
  inkU.px.value = 2.5; inkU.flash.value = window.DEBUG_E ? -1 : (C.flash || 0); inkU.vig.value = L.vig ?? 0.22; inkU.rain.value = L.rain || 0; inkU.tm.value = f / 30;
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  // lens
  dofU.focus.value = D.focus; dofU.cinf.value = D.cinf; dofU.near.value = D.near ?? 1;
  renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL;
window.ready = true;
