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

// ---------- world: San Juan Island 1859 ----------
const DECK = 6, SEA = DECK - 0.9;
const world = new THREE.Group(); scene.add(world);
const waterU = { t: { value: 0 }, deep: { value: new THREE.Color('#2f6f8f') }, shal: { value: new THREE.Color('#5fa8bf') }, glint: { value: new THREE.Color('#e9f6ff') } };
const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const waterMat = new THREE.ShaderMaterial({
  uniforms: { ...THREE.UniformsLib.fog, ...waterU }, fog: true,
  vertexShader: `varying vec3 vW; varying float vFog;
    #include <fog_pars_vertex>
    void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
      #include <fog_vertex>
    }`,
  fragmentShader: `uniform float t; uniform vec3 deep, shal, glint; varying vec3 vW;
    #include <fog_pars_fragment>
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
    void main(){
      vec2 p = vW.xz;
      float a = n(p*vec2(.35,.9)+vec2(t*.4,0.)) + .5*n(p*vec2(.8,2.1)-vec2(t*.6,t*.2));
      float streak = smoothstep(.95,1.15,a);
      float depthMix = clamp(length(vW.xz-vec2(0.,-35.))/160.-.45, 0., 1.);
      vec3 c = mix(shal, deep, depthMix);
      c = mix(c, glint, streak*.55);
      c += .05*(n(p*.2+t*.1)-.5);
      gl_FragColor = vec4(c,1.);
      #include <fog_fragment>
    }`,
});
const water = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), waterMat); water.rotation.x = -Math.PI / 2; water.position.set(0, SEA, -300);
water.userData.nd = waterNd; water.receiveShadow = false; scene.add(water);

const R0 = P.rng(41);
const MM = {
  sand: toon({ color: '#d9c795' }), dirtF: toon({ color: '#6e4b30' }), potato: toon({ color: '#4f8a3a' }), potato2: toon({ color: '#5f9a42' }),
  cream: toon({ color: '#ece2c6' }), cream2: toon({ color: '#d8ccaa' }), usBlue: toon({ color: '#2f4a8a' }), ukRed: toon({ color: '#c22a2e' }),
  skin: toon({ color: '#f0c8a2' }), hull: toon({ color: '#26262c' }), hullBand: toon({ color: '#d9a845' }), port: toon({ color: '#7a1f1f' }), sail: toon({ color: '#f1e9d2' }),
  iron: toon({ color: '#3a3b40' }), mound: toon({ color: '#5a4030' }), cabinWall: texM(P.planks(5), 2, 1, '#c9a577'), roofB: toon({ color: '#6a4a36' }), gold: toon({ color: '#d9a845' }),
};
MM.dirtF.polygonOffset = true; MM.dirtF.polygonOffsetFactor = -2; MM.dirtF.polygonOffsetUnits = -2;
// island: grass cap + sand ring
add(new THREE.CylinderGeometry(75, 80, 4, 72), M.grass, 0, DECK - 2, -35, world, { cast: false });
{ const g = M.grass.map; }
add(new THREE.CylinderGeometry(86, 90, 3, 72), MM.sand, 0, DECK - 2.4, -35, world, { cast: false });
// far hills / islands / mountains
for (const [x, z, r, sy, m] of [[-190, -170, 60, .55, M.hill], [210, -140, 70, .5, M.hill], [-300, -330, 110, .6, M.hillFar], [320, -380, 130, .55, M.hillFar], [40, -520, 160, .5, M.hillFar], [-120, -600, 120, .6, M.hillFar]]) {
  const h = add(new THREE.SphereGeometry(r, 24, 12), m, x, SEA - 4, z, world, { cast: false }); h.scale.y = sy;
}
for (const [x, z, r, hgt] of [[-260, -900, 160, 300], [60, -950, 200, 380], [380, -880, 170, 320], [-520, -760, 190, 260]]) {
  add(new THREE.ConeGeometry(r, hgt, 7), M.mount, x, SEA + hgt / 2 - 8, z, world, { cast: false });
  add(new THREE.ConeGeometry(r * 0.3, hgt * 0.3, 7), M.snow, x, SEA + hgt * 0.85 - 8, z, world, { cast: false });
}
// pine trees (back belt + far corners)
const pine = (x, z, s = 1) => {
  const g = new THREE.Group(); g.position.set(x, DECK, z); world.add(g);
  add(new THREE.CylinderGeometry(0.28 * s, 0.38 * s, 2.4 * s, 6), M.trunk, 0, 1.2 * s, 0, g);
  for (let i = 0; i < 4; i++) add(new THREE.ConeGeometry((2.3 - i * 0.5) * s, 3 * s, 8), M.pine, 0, (3 + i * 1.7) * s, 0, g);
  return g;
};
for (let i = 0; i < 70; i++) {
  const a = R0() * Math.PI * 2, d = 20 + R0() * 52; let x = Math.cos(a) * d, z = -35 + Math.sin(a) * d;
  if (z > -22 && Math.abs(x) < 70) continue; if (Math.abs(x + 40) < 16 && z > -60 && z < 0) continue; if (Math.abs(x - 42) < 12 && z > -40 && z < 0) continue; if (Math.abs(x) < 18 && z > -24) continue;
  if (Math.abs(x + 15) < 6 && z > -20) continue; pine(x, z, 0.9 + R0() * 0.9);
}
// ---- potato field + fence ----
add(new THREE.PlaneGeometry(22, 14), MM.dirtF, 0, DECK + 0.012, -5, world, { cast: false }).rotation.x = -Math.PI / 2;
const plants = [];
for (let r = 0; r < 6; r++) for (let c = 0; c < 16; c++) {
  const x = -9 + c * 1.2 + (r % 2) * 0.3, z = -10.5 + r * 1.75; if (Math.abs(x) < 0.8 && r > 3) continue;
  const b = add(new THREE.SphereGeometry(0.34, 8, 6), (r + c) % 3 ? MM.potato : MM.potato2, x, DECK + 0.1, z, world, { cast: false }); b.scale.set(1.2, 0.7, 1);
}
const fenceG = new THREE.Group(); world.add(fenceG);
for (let i = -6; i <= 6; i++) add(box(0.18, 1.2, 0.18), M.wood, i * 1.9, DECK + 0.6, -12, fenceG);
for (const y of [0.45, 0.9]) add(box(24, 0.1, 0.1), M.wood, 0, DECK + y, -12, fenceG);
for (let i = 0; i <= 3; i++) add(box(0.18, 1.2, 0.18), M.wood, -11.5, DECK + 0.6, -12 + i * 2.3, fenceG);
for (const y of [0.45, 0.9]) add(box(0.1, 0.1, 7.5), M.wood, -11.5, DECK + y, -8.4, fenceG);
// ---- Cutlar's cabin ----
const cabin = new THREE.Group(); cabin.position.set(-17, DECK, -9); world.add(cabin);
add(tbox(6, 3, 4.6, 2), M.plank, 0, 1.5, 0, cabin);
{ const sh = new THREE.Shape(); sh.moveTo(-3.5, 0); sh.lineTo(3.5, 0); sh.lineTo(0, 2.2); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: 5.4, bevelEnabled: false }); g.translate(0, 0, -2.7); const r = add(g, MM.roofB, 0, 3, 0, cabin); r.rotation.y = Math.PI / 2; r.scale.set(0.8, 1, 1.2); }
add(box(1.1, 2, 0.12), M.door, 0.6, 1, 2.35, cabin); add(box(1.0, 1.0, 0.12), M.window, -1.8, 1.7, 2.35, cabin);
add(box(0.8, 2.2, 0.8), M.stone, 2.3, 3.7, -1.2, cabin);
// ---- tents ----
const tentGeo = (() => { const sh = new THREE.Shape(); sh.moveTo(-1.5, 0); sh.lineTo(1.5, 0); sh.lineTo(0, 2.3); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: 3.2, bevelEnabled: false }); g.translate(0, 0, -1.6); return g; })();
const usTents = [], ukTents = [];
for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) usTents.push(add(tentGeo, MM.cream, -44 + c * 3.8, DECK, -12 - r * 4.2, world));
for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) ukTents.push(add(tentGeo, MM.cream2, 38 + c * 3.8, DECK, -14 - r * 4.2, world));
// ---- flags ----
function flagCanvas(kind) {
  const [c, g] = cvs(300, 200);
  if (kind === 'us') {
    for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#f4f0e6' : '#b8282b'; g.fillRect(0, i * 200 / 13, 300, 200 / 13 + 1); }
    g.fillStyle = '#2a3f78'; g.fillRect(0, 0, 130, 108);
    g.fillStyle = '#fff'; for (let r = 0; r < 5; r++) for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(12 + k * 21 + (r % 2) * 10, 12 + r * 20, 3.6, 0, 7); g.fill(); }
  } else {
    g.fillStyle = '#1f3a7a'; g.fillRect(0, 0, 300, 200);
    g.strokeStyle = '#f4f0e6'; g.lineWidth = 34; g.beginPath(); g.moveTo(0, 0); g.lineTo(300, 200); g.moveTo(300, 0); g.lineTo(0, 200); g.stroke();
    g.strokeStyle = '#c22a2e'; g.lineWidth = 12; g.beginPath(); g.moveTo(0, 0); g.lineTo(300, 200); g.moveTo(300, 0); g.lineTo(0, 200); g.stroke();
    g.strokeStyle = '#f4f0e6'; g.lineWidth = 64; g.beginPath(); g.moveTo(150, 0); g.lineTo(150, 200); g.moveTo(0, 100); g.lineTo(300, 100); g.stroke();
    g.strokeStyle = '#c22a2e'; g.lineWidth = 36; g.beginPath(); g.moveTo(150, 0); g.lineTo(150, 200); g.moveTo(0, 100); g.lineTo(300, 100); g.stroke();
  }
  return c;
}
const flagTex = { us: P.tex(flagCanvas('us')), uk: P.tex(flagCanvas('uk')) };
const flags = [];
function makeFlag(kind, x, z, h, w = 3.6, dir = 1) {
  const g = new THREE.Group(); g.position.set(x, DECK, z); world.add(g);
  add(new THREE.CylinderGeometry(0.07, 0.09, h, 6), M.iron, 0, h / 2, 0, g);
  add(new THREE.SphereGeometry(0.15, 8, 6), MM.gold, 0, h + 0.05, 0, g);
  const geo = new THREE.PlaneGeometry(w, w * 2 / 3, 14, 4); geo.translate(dir * (w / 2 + 0.05), 0, 0);
  const m = add(geo, toon({ map: flagTex[kind], side: THREE.DoubleSide }), 0, h - w / 3 - 0.2, 0, g); m.castShadow = true;
  m.userData.base = geo.attributes.position.array.slice(); flags.push(m); return g;
}
const flagsAll = {
  usNear: makeFlag('us', -4.2, -6.5, 7), ukNear: makeFlag('uk', 4.2, -6.5, 7, 3.6, -1),
  usCamp: makeFlag('us', -40, -8, 11, 5), ukCamp: makeFlag('uk', 34, -9, 11, 5),
  usBig: makeFlag('us', -1.5, -3, 9, 6),
};
// ---- troops (merged boxes) ----
function merged(geos, mat) {
  const pos = [], nor = [], uv = [], idx = []; let off = 0;
  for (const g of geos) { const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv, i = g.index;
    for (let k = 0; k < p.count; k++) { pos.push(p.getX(k), p.getY(k), p.getZ(k)); nor.push(n.getX(k), n.getY(k), n.getZ(k)); uv.push(u.getX(k), u.getY(k)); }
    for (let k = 0; k < i.count; k++) idx.push(i.getX(k) + off); off += p.count; }
  const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); G.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); G.setIndex(idx);
  return add(G, mat, 0, 0, 0, world);
}
function troopBlock(cols, rows, bodyMat, dx = 1.2, dz = 1.0) {
  const bodies = [], heads = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = (c - (cols - 1) / 2) * dx, z = -r * dz;
    bodies.push(box(0.55, 1.5, 0.35).translate(x, 0.75, z)); heads.push(box(0.36, 0.36, 0.36).translate(x, 1.7, z));
    heads.push(box(0.42, 0.18, 0.42).translate(x, 1.96, z));
  }
  const g = new THREE.Group(); world.add(g);
  const a = merged(bodies, bodyMat), b = merged(heads, MM.skin); world.remove(a); world.remove(b); g.add(a); g.add(b); return g;
}
const troopsUS64 = troopBlock(8, 8, MM.usBlue); troopsUS64.position.set(-14, DECK, -3);
const troopsUS420 = troopBlock(21, 20, MM.usBlue); troopsUS420.position.set(-40, DECK, -33);
const troopsUK = troopBlock(8, 6, MM.ukRed); troopsUK.position.set(42, DECK, -34);
// ---- cannons ----
const cannons = [];
for (let i = 0; i < 14; i++) {
  const g = new THREE.Group(); g.position.set(-24, DECK, 4 - i * 2.6); world.add(g);
  const bar = add(new THREE.CylinderGeometry(0.22, 0.33, 3, 12), MM.iron, 0.4, 1.05, 0, g); bar.rotation.z = -Math.PI / 2 + 0.12;
  add(box(2.4, 0.3, 0.7), M.wood, 0, 0.75, 0, g);
  for (const s of [-1, 1]) { const w = add(new THREE.CylinderGeometry(0.75, 0.75, 0.14, 16), M.wood, 0, 0.75, s * 0.5, g); w.rotation.x = Math.PI / 2; }
  g.rotation.y = 0.15; g.visible = false; cannons.push(g);
}
// ---- warships ----
const ships = [];
function makeShip(x, z, ry, s = 1) {
  const g = new THREE.Group(); g.position.set(x, SEA + 0.8 * s, z); g.rotation.y = ry; g.scale.setScalar(s); world.add(g);
  const sh = new THREE.Shape(); sh.moveTo(-12, 1.6); sh.lineTo(-11, -0.8); sh.lineTo(9, -0.8); sh.lineTo(14, 2.6); sh.lineTo(13, 3.2); sh.lineTo(-12, 3); sh.closePath();
  const hg = new THREE.ExtrudeGeometry(sh, { depth: 6, bevelEnabled: false }); hg.translate(0, 0, -3); add(hg, MM.hull, 0, 0, 0, g);
  add(box(25, 0.35, 6.1), MM.hullBand, 0.5, 2.2, 0, g);
  for (let i = 0; i < 8; i++) for (const sd of [-1, 1]) add(box(0.9, 0.8, 0.15), MM.port, -8.5 + i * 2.5, 1.5, sd * 3.0, g);
  add(box(5, 1.8, 5.4), M.wood, -9, 4, 0, g);
  add(new THREE.CylinderGeometry(0.12, 0.12, 8, 5), M.wood, 15, 4.2, 0, g).rotation.z = -1.25;
  for (const [mx, mh] of [[-6, 15], [0, 18], [6, 14]]) {
    add(new THREE.CylinderGeometry(0.22, 0.3, mh, 8), M.wood, mx, 3 + mh / 2, 0, g);
    for (let k = 0; k < 3; k++) { const w = (5.6 - k * 1.3), yy = 6 + k * 4.2 * mh / 18;
      add(box(0.22, 0.22, w + 0.8), M.wood, mx, yy + 1.6, 0, g);
      const sail = add(box(0.2, 3.2 * mh / 18 + 0.8, w), MM.sail, mx + 0.25, yy, 0, g); sail.scale.x = 1; }
  }
  const fl = makeFlag('uk', 0, 0, 1, 3); world.remove(fl); fl.position.set(-12, 3.1, 0); fl.scale.setScalar(0.9); g.add(fl);
  g.visible = false; ships.push(g); return g;
}
makeShip(88, -5, 1.77, 1); makeShip(112, -42, 1.77, 1.15); makeShip(136, -80, 1.77, 1.3);
// ---- judge's table with map ----
const tableG = new THREE.Group(); tableG.position.set(0, DECK, -1.4); world.add(tableG); tableG.visible = false;
add(tbox(4.4, 0.14, 1.9, 2), M.wood, 0, 0.9, 0, tableG);
for (const x of [-2, 2]) for (const z of [-0.8, 0.8]) add(box(0.2, 0.9, 0.2), M.wood, x, 0.45, z, tableG);
add(box(4.5, 1.0, 0.1), M.wood, 0, 0.5, 0.95, tableG);
{ const [c, g] = cvs(400, 240); g.fillStyle = '#efe2bd'; g.fillRect(0, 0, 400, 240); g.strokeStyle = '#8a6a3a'; g.lineWidth = 8; g.strokeRect(4, 4, 392, 232);
  g.fillStyle = '#9dc9e0'; g.fillRect(14, 14, 372, 212); g.fillStyle = '#78a95a'; g.strokeStyle = '#3a4a2a'; g.lineWidth = 5; g.beginPath(); g.moveTo(130, 60); g.bezierCurveTo(200, 30, 290, 60, 300, 120); g.bezierCurveTo(310, 190, 220, 210, 160, 180); g.bezierCurveTo(100, 160, 90, 90, 130, 60); g.fill(); g.stroke();
  g.fillStyle = '#b8282b'; g.font = '900 56px Arial Black'; g.textAlign = 'center'; g.fillText('X', 210, 135);
  const mapMesh = add(new THREE.PlaneGeometry(2.4, 1.44), toon({ map: P.tex(c) }), 0, 0.975, 0.1, tableG); mapMesh.rotation.x = -Math.PI / 2; }
// ---- grave ----
const grave = new THREE.Group(); grave.position.set(1.6, DECK, -1.3); world.add(grave); grave.visible = false;
{ const m = add(new THREE.SphereGeometry(0.9, 12, 8), MM.mound, 0, 0, 0, grave); m.scale.set(1.4, 0.32, 0.9); }
// ---- smoke/fire (3D) none; clouds below ----
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
  usTents.forEach((t, i) => { t.visible = i < S.usT; }); ukTents.forEach((t, i) => { t.visible = i < S.ukT; });
  cannons.forEach((c, i) => { const v = i < S.cannons; c.visible = v; if (v) c.scale.setScalar(Math.min(1, MO.back(clamp((S.cannons - i) / 1.0)))); });
  troopsUS64.visible = !!S.t64; if (S.t64) troopsUS64.position.x = S.t64.x;
  troopsUS420.visible = !!S.t420; troopsUK.visible = !!S.tUK;
  ships.forEach((s, i) => { s.visible = !!S.ships; s.position.y = SEA + 0.8 * s.scale.x + Math.sin(f * 0.07 + i * 2) * 0.12; s.rotation.z = Math.sin(f * 0.05 + i) * 0.015; });
  tableG.visible = !!S.table; grave.visible = !!S.grave;
  flagsAll.usBig.visible = S.bigFlag > 0; flagsAll.usBig.position.y = DECK - (1 - S.bigFlag) * 10;
  flags.forEach((m, i) => { const a = m.geometry.attributes.position, b0 = m.userData.base; for (let k = 0; k < a.count; k++) { const x = b0[k * 3], ax = Math.abs(x); a.setZ(k, Math.sin(ax * 1.3 - f * 0.28 + i) * 0.14 * ax * 0.45); a.setY(k, b0[k * 3 + 1] + Math.sin(ax * 1.1 - f * 0.2) * 0.04 * ax); } a.needsUpdate = true; m.geometry.computeVertexNormals(); });
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
