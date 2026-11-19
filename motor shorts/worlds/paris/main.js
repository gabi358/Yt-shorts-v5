import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import { SHOTS, TOTAL, shotAt, camAt, dofAt, LIGHTS, lightFor, actorsAt, worldAt, fxAt } from './story.js';

const SC = location.hash.includes("half") ? 0.5 : 1; const W = Math.round(1080 * SC), H = Math.round(1920 * SC);
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

// ---------- world: Paris 1925 ----------
const DECK = 6;
const world = new THREE.Group(); scene.add(world);
const waterU = { t: { value: 0 }, deep: { value: new THREE.Color('#2f6f8f') }, shal: { value: new THREE.Color('#5fa8bf') }, glint: { value: new THREE.Color('#e9f6ff') } };
// painted textures local to this story
const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
function facadeCanvas(hotel = false) {
  const [c, g] = cvs(256, 224), r = P.rng(hotel ? 5 : 3);
  g.fillStyle = hotel ? '#efe3c6' : '#e8dcc0'; g.fillRect(0, 0, 256, 224);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(150,130,100,${0.04 + r() * 0.05})`; g.fillRect(r() * 256, r() * 224, 4 + r() * 18, 2 + r() * 5); }
  g.fillStyle = '#b9aa88'; g.fillRect(0, 214, 256, 10); g.fillStyle = '#6e6246'; g.fillRect(0, 222, 256, 2); g.fillRect(0, 0, 2, 224);
  // window
  g.fillStyle = '#f6f0e0'; g.fillRect(72, 22, 112, 150); g.fillStyle = '#26324a'; g.fillRect(80, 30, 96, 134);
  g.fillStyle = '#4a5a7a'; g.fillRect(84, 34, 38, 60); g.fillRect(134, 34, 38, 60);
  g.fillStyle = '#f6f0e0'; g.fillRect(126, 30, 5, 134); g.fillRect(80, 92, 96, 5);
  g.fillStyle = '#3a2a22'; g.fillRect(70, 18, 116, 6); g.fillStyle = '#c8b890'; g.beginPath(); g.moveTo(66, 22); g.lineTo(128, 6); g.lineTo(190, 22); g.closePath(); g.fill(); g.strokeStyle = '#6e6246'; g.lineWidth = 3; g.stroke();
  // shutters
  g.fillStyle = '#7d8fa6'; g.fillRect(44, 24, 24, 146); g.fillRect(188, 24, 24, 146);
  g.strokeStyle = '#4e5b6e'; g.lineWidth = 2; for (let y = 34; y < 165; y += 9) { g.beginPath(); g.moveTo(44, y); g.lineTo(68, y); g.moveTo(188, y); g.lineTo(212, y); g.stroke(); }
  // balcony
  g.fillStyle = '#1d1a22'; g.fillRect(40, 150, 176, 6); g.fillRect(40, 182, 176, 7);
  for (let x = 44; x < 214; x += 11) g.fillRect(x, 156, 3, 26);
  return c;
}
function ironCanvas(rust = 1) {
  const [c, g] = cvs(256, 256), r = P.rng(77);
  g.fillStyle = '#5b4a43'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${190 + r() * 40},${90 + r() * 40},40,${(0.25 + r() * 0.35) * rust})`; g.beginPath(); g.ellipse(r() * 256, r() * 256, 6 + r() * 26, 4 + r() * 14, r() * 3, 0, 7); g.fill(); }
  g.strokeStyle = '#2a2024'; g.lineWidth = 6;
  for (let k = 0; k < 2; k++) for (let y = -256; y < 512; y += 64) { g.beginPath(); g.moveTo(k ? 256 : 0, y); g.lineTo(k ? 0 : 256, y + 256); g.stroke(); }
  g.strokeStyle = '#1c1618'; g.lineWidth = 8; g.strokeRect(2, 2, 252, 252);
  return c;
}
function windowCanvas() {
  const [c, g] = cvs(256, 512);
  g.fillStyle = '#8fc0ee'; g.fillRect(0, 0, 256, 512);
  g.fillStyle = '#ffffffaa'; g.beginPath(); g.ellipse(100, 130, 60, 24, 0, 0, 7); g.ellipse(150, 150, 50, 20, 0, 0, 7); g.fill();
  g.fillStyle = '#f6f0e0'; g.fillRect(124, 0, 8, 512); g.fillRect(0, 250, 256, 8);
  g.strokeStyle = '#8a7a56'; g.lineWidth = 12; g.strokeRect(0, 0, 256, 512);
  g.fillStyle = '#9b2a33'; g.fillRect(0, 0, 40, 512); g.fillRect(216, 0, 40, 512);
  g.strokeStyle = '#5a1a20'; g.lineWidth = 3; for (let x = 8; x < 40; x += 10) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.moveTo(256 - x, 0); g.lineTo(256 - x, 512); g.stroke(); }
  return c;
}
function wallpaperCanvas() {
  const [c, g] = cvs(256, 256);
  g.fillStyle = '#c9b27a'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#b79e62'; for (let x = 0; x < 256; x += 64) g.fillRect(x, 0, 14, 256);
  g.fillStyle = '#d8c48e'; for (let y = 32; y < 256; y += 64) for (let x = 32; x < 256; x += 64) { g.beginPath(); g.moveTo(x, y - 14); g.lineTo(x + 10, y); g.lineTo(x, y + 14); g.lineTo(x - 10, y); g.closePath(); g.fill(); }
  return c;
}
function felt() { const [c, g] = cvs(64, 64); g.fillStyle = '#2f5f42'; g.fillRect(0, 0, 64, 64); return c; }
const M2 = {
  cobble: texM(P.stone(21, 30, 6, 58, 64, 48), 7, 70), pave: texM(P.stone(22, 40, 6, 76, 128, 64), 3, 70),
  facade: toon({ map: P.tex(facadeCanvas(), 1, 1) }), facadeHotel: toon({ map: P.tex(facadeCanvas(true), 1, 1) }),
  wall: texM(P.plaster(8), 1, 1), zinc: toon({ color: '#6c7684' }), iron: toon({ map: P.tex(ironCanvas(1), 1, 3) }), ironRust: toon({ map: P.tex(ironCanvas(1.7), 2, 4) }),
  paper: toon({ map: P.tex(wallpaperCanvas(), 4, 2) }), felt: toon({ map: P.tex(felt()) }), win: toon({ map: P.tex(windowCanvas()) }),
  awning: toon({ color: '#9b2a33' }), awningW: toon({ color: '#efe6cf' }), gold: toon({ color: '#d8b055' }), glass: toon({ color: '#ffe9a0' }), black: toon({ color: '#1f1c24' }),
  leaf: toon({ color: '#86ad4e' }), leaf2: toon({ color: '#6f9a42' }), flagB: toon({ color: '#2d5fb3' }), flagW: toon({ color: '#f4f4f4' }), flagR: toon({ color: '#c8323a' }),
  chair: toon({ color: '#6b3f22' }), dark: toon({ color: '#4a3226' }),
};
M2.facade.map.wrapS = M2.facade.map.wrapT = THREE.RepeatWrapping; M2.facadeHotel.map.wrapS = M2.facadeHotel.map.wrapT = THREE.RepeatWrapping;
// ground, avenue, sidewalks
const ground = add(new THREE.PlaneGeometry(900, 900), M.grass, 0, DECK, -150, world, { cast: false }); ground.rotation.x = -Math.PI / 2;
const road = add(new THREE.PlaneGeometry(14, 240), M2.cobble, 0, DECK + 0.02, -50, world, { cast: false }); road.rotation.x = -Math.PI / 2;
for (const s of [-1, 1]) { const sw = add(new THREE.PlaneGeometry(4.2, 240), M2.pave, s * 9.1, DECK + 0.03, -50, world, { cast: false }); sw.rotation.x = -Math.PI / 2; add(tbox(0.3, 0.22, 240, 2), M.stone, s * 7.0, DECK + 0.1, -50, world, { cast: false }); }
// park plaza at the foot of the tower
const plaza = add(new THREE.PlaneGeometry(70, 60), M2.pave, 0, DECK + 0.03, -92, world, { cast: false }); plaza.rotation.x = -Math.PI / 2; plaza.material = M2.pave.clone(); plaza.material.map = M2.pave.map.clone(); plaza.material.map.repeat.set(12, 12); plaza.material.map.needsUpdate = true;
// facades (Haussmann blocks)
const blocks = [];
const block = (side, z0, z1, h, hotel = false) => {
  const len = Math.abs(z1 - z0), zc = (z0 + z1) / 2, w = 14, xc = side * (11 + w / 2);
  const g = new THREE.Group(); g.position.set(xc, DECK, zc); world.add(g);
  add(tbox(w, h, len, 3), M2.wall, 0, h / 2, 0, g);
  const m = hotel ? M2.facadeHotel : M2.facade; const mm = m.clone(); mm.map = m.map.clone(); mm.map.repeat.set(len / 4, h / 3.5); mm.map.needsUpdate = true;
  const fp = add(new THREE.PlaneGeometry(len, h), mm, -side * (w / 2 + 0.03), h / 2, 0, g, { cast: false }); fp.rotation.y = -side * Math.PI / 2;
  // cornice + mansard roof
  add(tbox(w + 0.6, 0.5, len + 0.4, 2), M.stone, 0, h + 0.25, 0, g);
  const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2 - 2.2, 3.6); sh.lineTo(-w / 2 + 2.2, 3.6); sh.closePath();
  const rg = new THREE.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false }); rg.translate(0, 0, -len / 2);
  add(rg, M2.zinc, 0, h + 0.5, 0, g);
  for (let k = 0; k < 4; k++) add(tbox(0.9, 2.4, 0.9, 1), M.stone, (k % 2 ? -1 : 1) * 2.5, h + 4.4, -len / 2 + len * (k + 0.5) / 4, g);
  blocks.push(g); return g;
};
let zz = 26; const rb = P.rng(9);
for (const side of [-1, 1]) { zz = 26; while (zz > -76) { const L = 20 + rb() * 6, h = 13 + rb() * 3; if (side === -1 && zz <= -8 && zz > -34) { zz -= 26; continue; } block(side, zz, zz - L + 0.8, h); zz -= L; } }
// the hotel (left side, door at z=-20)
const hotel = block(-1, -8, -34, 17, true);
{ const hx = -11;
  for (const z of [-17, -23]) add(new THREE.CylinderGeometry(0.34, 0.38, 5.6, 14), M.marble, hx + 1.6, DECK + 2.8, z, world);
  add(tbox(2.4, 0.5, 8.6, 2), M.marbleTop, hx + 1.7, DECK + 5.8, -20, world);
  add(box(0.3, 3.6, 2.8), M.door, hx + 0.1, DECK + 1.8, -20, world, { cast: false });
  const aw = add(tbox(3.4, 0.22, 7.2, 1), M2.awning, hx + 2.1, DECK + 4.3, -20, world); aw.rotation.z = 0.28;
  for (let i = 0; i < 6; i++) { const st = add(tbox(3.4, 0.24, 0.55, 1), M2.awningW, hx + 2.1, DECK + 4.3, -20 - 3.3 + i * 1.32, world); st.rotation.z = 0.28; }
  for (let i = 0; i < 3; i++) add(tbox(2.2 - i * 0.3, 0.2, 7.4, 1), M.stone, hx + 1.4 + i * 0.35, DECK + 0.1 + i * 0.2, -20, world);
  for (const [k, z] of [[0, -11.5], [1, -28.5]]) { const pole = add(new THREE.CylinderGeometry(0.06, 0.06, 4, 8), M2.black, hx + 0.9, DECK + 13.5, z, world); pole.rotation.z = -0.8; for (let i = 0; i < 3; i++) add(box(0.05, 1.1, 0.55), [M2.flagB, M2.flagW, M2.flagR][i], hx + 2.6 + 0.5, DECK + 15.3 - 0.0, z - 0.55 + i * 0.55, world, { cast: false }); }
}
// lamp posts + round trees along the avenue
const lamp = (x, z) => { add(new THREE.CylinderGeometry(0.08, 0.12, 4.2, 8), M2.black, x, DECK + 2.1, z, world); add(new THREE.SphereGeometry(0.34, 10, 8), M2.glass, x, DECK + 4.4, z, world, { cast: false }); };
const tree = (x, z, h = 5) => { add(new THREE.CylinderGeometry(0.2, 0.28, h, 8), M.trunk, x, DECK + h / 2, z, world); add(new THREE.SphereGeometry(2.1, 12, 10), M2.leaf, x, DECK + h + 1.3, z, world).scale.set(1, 0.95, 1); add(new THREE.SphereGeometry(1.5, 10, 8), M2.leaf2, x + 0.8, DECK + h + 2.4, z - 0.4, world); };
for (let z = 20; z > -90; z -= 9) { const hz = z < 2 && z > -38; if (!hz) { tree(-7.9, z); lamp(-7.3, z - 6.5); } tree(7.9, z - 4.5); lamp(7.3, z - 2); }
for (let i = 0; i < 40; i++) { const a = rb() * 6.28, d = 20 + rb() * 40; tree(Math.cos(a) * d * 1.3, -105 + Math.sin(a) * d * 0.7, 4 + rb() * 2); }
// cafe on the right pavement (z ~ -1.8)
const cafe = new THREE.Group(); cafe.position.set(8.9, DECK, -1.6); world.add(cafe);
for (const [x, z] of [[0, 0], [0.2, 3.2], [-0.2, -3.2]]) { add(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 16), M.marbleTop, x, 0.78, z, cafe); add(new THREE.CylinderGeometry(0.06, 0.06, 0.78, 6), M2.black, x, 0.39, z, cafe); add(new THREE.CylinderGeometry(0.25, 0.25, 0.05, 12), M2.black, x, 0.03, z, cafe);
  for (const [dx, dz] of [[-0.8, 0.1], [0.8, -0.1]]) { add(tbox(0.5, 0.06, 0.5, 1), M2.chair, x + dx, 0.48, z + dz, cafe); add(tbox(0.06, 0.55, 0.5, 1), M2.chair, x + dx + Math.sign(dx) * 0.22, 0.78, z + dz, cafe); for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(tbox(0.05, 0.48, 0.05, 1), M2.chair, x + dx + lx * 0.2, 0.24, z + dz + lz * 0.2, cafe, { cast: false }); } }
// ---------- Eiffel Tower ----------
const strut = (parent, p1, p2, w, mat) => {
  const a = new THREE.Vector3(...p1), b = new THREE.Vector3(...p2), L = a.distanceTo(b);
  const m = add(tbox(w, L, w, 3), mat, 0, 0, 0, parent); m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); return m;
};
function buildTower(mat) {
  const g = new THREE.Group();
  const sg = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
  for (const [sx, sz] of sg) {
    strut(g, [sx * 14, 0, sz * 14], [sx * 8.6, 18, sz * 8.6], 3.4, mat);
    strut(g, [sx * 8.6, 18, sz * 8.6], [sx * 4.2, 34, sz * 4.2], 2.6, mat);
    strut(g, [sx * 4.2, 34, sz * 4.2], [sx * 2.2, 74, sz * 2.2], 1.7, mat);
    strut(g, [sx * 2.2, 74, sz * 2.2], [sx * 0.7, 104, sz * 0.7], 1.0, mat);
  }
  // arches
  for (const s of [-1, 1]) { const ar = add(new THREE.TorusGeometry(10.6, 0.95, 8, 28, Math.PI), mat, 0, 0, s * 12.4, g); const ar2 = add(new THREE.TorusGeometry(10.6, 0.95, 8, 28, Math.PI), mat, s * 12.4, 0, 0, g); ar2.rotation.y = Math.PI / 2; }
  // horizontal rings + platforms + cross braces
  for (const y of [18]) { const hw = 8.6; for (const s of [-1, 1]) { add(tbox(hw * 2, 0.9, 1.0, 3), mat, 0, y, s * hw, g); add(tbox(1.0, 0.9, hw * 2, 3), mat, s * hw, y, 0, g); } }
  add(tbox(13.6, 1.5, 13.6, 3), mat, 0, 34, 0, g); add(tbox(14.8, 0.35, 14.8, 3), M2.black, 0, 35, 0, g);
  add(tbox(7.6, 1.2, 7.6, 3), mat, 0, 74, 0, g); add(tbox(8.6, 0.3, 8.6, 3), M2.black, 0, 74.8, 0, g);
  for (const s of [-1, 1]) for (const y0 of [38, 52, 64]) { const y1 = y0 + 12, w0 = 4.2 - (y0 - 34) * 0.05, w1 = 4.2 - (y1 - 34) * 0.05;
    strut(g, [s * 0, y0, w0 * 0.9], [s * 0, y1, w1 * 0.9], 0.01, mat).visible = false;
    strut(g, [-w0 * 0.9, y0, s * w0 * 0.9], [w1 * 0.9, y1, s * w1 * 0.9], 0.45, mat); strut(g, [w0 * 0.9, y0, s * w0 * 0.9], [-w1 * 0.9, y1, s * w1 * 0.9], 0.45, mat);
    strut(g, [s * w0 * 0.9, y0, -w0 * 0.9], [s * w1 * 0.9, y1, w1 * 0.9], 0.45, mat); strut(g, [s * w0 * 0.9, y0, w0 * 0.9], [s * w1 * 0.9, y1, -w1 * 0.9], 0.45, mat); }
  add(new THREE.CylinderGeometry(0.2, 0.9, 22, 8), mat, 0, 115, 0, g); add(new THREE.CylinderGeometry(0.04, 0.2, 14, 6), M2.black, 0, 133, 0, g);
  add(tbox(3.4, 0.7, 3.4, 3), mat, 0, 104, 0, g);
  return g;
}
const tower = buildTower(M2.ironRust); tower.position.set(0, DECK, -95); world.add(tower);
const mini = buildTower(M2.iron); mini.visible = false; scene.add(mini);
// ---------- the hotel salon (interior set far from the street) ----------
const IX = 90, salon = new THREE.Group(); salon.position.set(IX, DECK, 0); world.add(salon);
add(tbox(20, 0.3, 16, 2), M.plank, 0, -0.05, 0, salon);
add(tbox(20, 8, 0.4, 3), M2.paper, 0, 4, -7.2, salon); add(tbox(20, 1.3, 0.55, 2), M2.dark, 0, 0.65, -7.0, salon);
for (const s of [-1, 1]) { add(tbox(0.4, 8, 16, 3), M2.paper, s * 10, 4, 0, salon); add(tbox(0.55, 1.3, 16, 2), M2.dark, s * 9.8, 0.65, 0, salon); }
for (const x of [-4.8, 4.8]) { const wn = add(new THREE.PlaneGeometry(2.2, 4.4), M2.win, x, 3.6, -6.96, salon, { cast: false }); }
const gframe = add(tbox(2.6, 3.2, 0.12, 1), M2.gold, 0, 4.2, -6.95, salon); add(tbox(2.2, 2.8, 0.14, 1), toon({ color: '#6a8aa8' }), 0, 4.2, -6.9, salon);
const chand = new THREE.Group(); chand.position.set(0, 7.2, -1.2); salon.add(chand);
add(new THREE.CylinderGeometry(0.03, 0.03, 4, 6), M2.black, 0, 2, 0, chand); const tr = add(new THREE.TorusGeometry(0.9, 0.08, 8, 24), M2.gold, 0, 0, 0, chand); tr.rotation.x = Math.PI / 2;
for (let i = 0; i < 8; i++) add(new THREE.SphereGeometry(0.16, 8, 6), M2.glass, Math.cos(i * 0.785) * 0.9, 0.18, Math.sin(i * 0.785) * 0.9, chand, { cast: false });
// table (nearest to camera, hides legs so characters read as seated)
const table = add(tbox(9.4, 0.12, 2.4, 2), M2.felt, 0, 0.88, 1.1, salon);
add(tbox(9.6, 0.5, 2.6, 2), M2.dark, 0, 0.55, 1.1, salon);
for (const x of [-4.4, 4.4]) for (const z of [0.1, 2.1]) add(tbox(0.3, 0.9, 0.3, 1), M2.dark, x, 0.45, z, salon);
for (const [x, z] of [[-3.5, -1.6], [-1.9, -1.8], [0, -1.7], [1.9, -1.8], [3.5, -1.6], [-0.9, -3.0]]) { add(tbox(0.7, 0.08, 0.7, 1), M2.chair, x, 0.5, z, salon); add(tbox(0.7, 0.9, 0.08, 1), M2.chair, x, 0.95, z - 0.32, salon); }
for (const x of [-8.6, 8.6]) { add(new THREE.CylinderGeometry(0.35, 0.28, 0.7, 10), M2.dark, x, 0.35, -5.8, salon); add(new THREE.SphereGeometry(0.8, 10, 8), M2.leaf2, x, 1.6, -5.8, salon); }
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
  tower.visible = true;
  if (S.mini) { mini.visible = true; mini.position.set(S.mini.x, S.mini.y, S.mini.z); mini.scale.setScalar(S.mini.s); mini.rotation.y = S.mini.ry || 0; } else mini.visible = false;
  chand.rotation.y = f * 0.01; chand.position.y = 7.2 + Math.sin(f * 0.05) * 0.03;
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
  helmetState(W_.helmet);
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
  inkU.px.value = 2.5 * SC; inkU.flash.value = window.DEBUG_E ? -1 : (C.flash || 0); inkU.vig.value = L.vig ?? 0.22; inkU.rain.value = L.rain || 0; inkU.tm.value = f / 30;
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  // lens
  dofU.focus.value = D.focus; dofU.cinf.value = D.cinf * SC; dofU.near.value = D.near ?? 1;
  renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL;
window.ready = true;
