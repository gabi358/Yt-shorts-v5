// FX v5: partículas deterministas (posición = f(tiempo), sin estado) y rayos 3D. Pensado para render fotograma a fotograma y acceso aleatorio.
import * as THREE from './lib/three.module.js';
import { rng } from './paint.js';

// Presets: size en m, life en s, g = gravedad (m/s²), drag = frenado, grow = factor de crecimiento del tamaño, blend 'add' | 'alpha'
export const PRESETS = {
  spark: { blend: 'add', size: [0.03, 0.07], life: [0.5, 1.3], speed: [2.5, 7], g: -9.5, drag: 0.8, grow: 0.0, col: ['#ffd27a', '#ff9a3c', '#ffe9b0'], up: 0.9, hdr: 3.0 },
  ember: { blend: 'add', size: [0.03, 0.06], life: [1.6, 3.6], speed: [0.3, 1.1], g: 0.9, drag: 0.4, grow: -0.4, col: ['#ff9a3c', '#ff6a20'], up: 1.0, hdr: 2.4, drift: 0.6 },
  fire: { blend: 'add', size: [0.28, 0.5], life: [0.45, 0.9], speed: [0.2, 0.6], g: 2.2, drag: 0.5, grow: -0.6, col: ['#ff8a2a', '#ffb347', '#ff5a1a'], up: 1.0, hdr: 1.8, soft: true },
  smoke: { blend: 'alpha', size: [0.5, 0.9], life: [2.4, 4.2], speed: [0.2, 0.7], g: 0.55, drag: 0.5, grow: 2.2, col: ['#5a5f6e', '#6c7080', '#4a4e5c'], up: 1.0, alpha: 0.38, soft: true, drift: 0.5 },
  dust: { blend: 'alpha', size: [0.35, 0.8], life: [0.8, 1.7], speed: [0.8, 3.2], g: -0.25, drag: 2.2, grow: 1.7, col: ['#c9b48a', '#b8a27a', '#d8c9a4'], up: 0.25, alpha: 0.5, soft: true },
  puff: { blend: 'alpha', size: [0.4, 0.8], life: [0.5, 1.0], speed: [1.5, 3.5], g: 0.0, drag: 2.5, grow: 1.5, col: ['#f3f3f3', '#e4e4ea'], up: 0.5, alpha: 0.85, soft: true },
  flash: { blend: 'add', size: [1.6, 2.6], life: [0.12, 0.2], speed: [0, 0.1], g: 0, drag: 1, grow: 0.5, col: ['#fff3d0'], up: 1.0, hdr: 4.0, soft: true },
  confetti: { blend: 'alpha', size: [0.06, 0.1], life: [1.4, 2.6], speed: [2, 6], g: -4, drag: 0.6, grow: 0, col: ['#ff4a4a', '#ffd23c', '#4ac0ff', '#7ae05a', '#ff7ad0'], up: 1.0, alpha: 1 },
  rainsplash: { blend: 'alpha', size: [0.08, 0.14], life: [0.2, 0.35], speed: [0.3, 0.9], g: -3, drag: 1.5, grow: 1.2, col: ['#cfe6ff'], up: 1.0, alpha: 0.6, soft: true },
};

const col = (h) => new THREE.Color(h);

/** events: [{ type, f0, f1, pos:[x,y,z], rate (partículas/s), burst (n en f0), spread:[sx,sy,sz] (caja de nacimiento), dir:[x,y,z] (sesgo de velocidad), speed:k (multiplicador), size:k, life:k, seed }] */
export class Particles {
  constructor(scene, events = [], fps = 30) {
    this.scene = scene; this.u = { tm: { value: 0 } }; this.meshes = [];
    const groups = { add: [], alpha: [] };
    events.forEach((e, ei) => {
      const P = PRESETS[e.type]; if (!P) return; const r = rng(((e.seed ?? 1) * 7919 + ei * 131) >>> 0);
      const dur = Math.max(0, (e.f1 ?? e.f0) - e.f0) / fps, n = (e.burst || 0) + Math.round((e.rate || 0) * dur);
      for (let i = 0; i < n; i++) {
        const burst = i < (e.burst || 0), birth = burst ? e.f0 / fps + r() * 0.05 : e.f0 / fps + r() * dur;
        const sp = e.spread || [0, 0, 0], d = e.dir || [0, 1, 0];
        const a = r() * Math.PI * 2, el = (r() * 2 - 1), sp0 = (P.speed[0] + r() * (P.speed[1] - P.speed[0])) * (e.speed ?? 1);
        const hx = Math.cos(a) * Math.sqrt(1 - el * el), hz = Math.sin(a) * Math.sqrt(1 - el * el), hy = Math.abs(el) * P.up + (P.up >= 1 ? 0.2 : 0);
        const v = [hx * sp0 + d[0] * sp0 * (P.drift ? 0 : 1) + (P.drift ? (r() - 0.5) * P.drift : 0), hy * sp0 * 0.8 + d[1] * sp0 * 0.6, hz * sp0 + d[2] * sp0 * (P.drift ? 0 : 1) + (P.drift ? (r() - 0.5) * P.drift : 0)];
        groups[P.blend].push({
          p: [e.pos[0] + (r() - 0.5) * sp[0], e.pos[1] + (r() - 0.5) * sp[1], e.pos[2] + (r() - 0.5) * sp[2]], v,
          birth, life: (P.life[0] + r() * (P.life[1] - P.life[0])) * (e.life ?? 1), size: (P.size[0] + r() * (P.size[1] - P.size[0])) * (e.size ?? 1),
          c: col(P.col[(r() * P.col.length) | 0]), P, rot: r() * 6.28, wind: e.wind || [0, 0, 0],
        });
      }
    });
    for (const blend of ['add', 'alpha']) if (groups[blend].length) this._build(groups[blend], blend);
  }
  _build(list, blend) {
    const n = list.length, pos = new Float32Array(n * 12), v0 = new Float32Array(n * 12), cr = new Float32Array(n * 8), at = new Float32Array(n * 16), cl = new Float32Array(n * 16), pm = new Float32Array(n * 16), idx = new Uint32Array(n * 6);
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    list.forEach((q, i) => {
      for (let k = 0; k < 4; k++) {
        const o3 = (i * 4 + k) * 3, o2 = (i * 4 + k) * 2, o4 = (i * 4 + k) * 4;
        pos.set(q.p, o3); v0.set(q.v, o3); cr[o2] = corners[k][0]; cr[o2 + 1] = corners[k][1];
        at[o4] = q.birth; at[o4 + 1] = q.life; at[o4 + 2] = q.size; at[o4 + 3] = q.rot;
        cl[o4] = q.c.r; cl[o4 + 1] = q.c.g; cl[o4 + 2] = q.c.b; cl[o4 + 3] = q.P.alpha ?? 1;
        pm[o4] = q.P.g; pm[o4 + 1] = q.P.drag; pm[o4 + 2] = q.P.grow; pm[o4 + 3] = (q.P.hdr ?? 1) * (q.P.soft ? 1 : -1);
      }
      idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('v0', new THREE.BufferAttribute(v0, 3)); g.setAttribute('corner', new THREE.BufferAttribute(cr, 2));
    g.setAttribute('at', new THREE.BufferAttribute(at, 4)); g.setAttribute('cl', new THREE.BufferAttribute(cl, 4)); g.setAttribute('pm', new THREE.BufferAttribute(pm, 4)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1e5);
    const m = new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), tm: this.u.tm }, fog: true, transparent: true, depthWrite: false,
      blending: blend === 'add' ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader: `#include <fog_pars_vertex>
        uniform float tm; attribute vec3 v0; attribute vec2 corner; attribute vec4 at, cl, pm; varying vec4 vC; varying vec2 vQ; varying float vSoft;
        void main(){ float t = tm - at.x; float age = t / at.y; vC = vec4(0.); vQ = corner; vSoft = pm.w;
          if (t < 0. || age > 1.){ gl_Position = vec4(2.,2.,2.,1.); return; }
          float k = max(pm.y, .001); vec3 p = position + v0 * ((1. - exp(-k*t))/k) + vec3(0., .5*pm.x*t*t, 0.);
          float sz = at.z * max(0.05, 1. + pm.z * age);
          float fade = smoothstep(0., .12, age) * (1. - smoothstep(.55, 1., age));
          vC = vec4(cl.rgb * abs(pm.w), cl.a * fade);
          vec4 mv = viewMatrix * vec4(p, 1.); float s = sin(at.w + age*1.5), c = cos(at.w + age*1.5);
          mv.xy += vec2(corner.x*c - corner.y*s, corner.x*s + corner.y*c) * sz;
          gl_Position = projectionMatrix * mv; vec4 mvPosition = mv;
          #include <fog_vertex>
        }`,
      fragmentShader: `#include <fog_pars_fragment>
        varying vec4 vC; varying vec2 vQ; varying float vSoft;
        void main(){ if (vC.a <= 0.) discard; float d = length(vQ); if (d > 1.) discard;
          float a = vSoft > 0. ? pow(1. - d, 1.6) : smoothstep(1., .55, d);
          gl_FragColor = vec4(vC.rgb, a * vC.a);
          #ifdef ADDITIVE_FOG
          #else
          #include <fog_fragment>
          #endif
        }`,
    });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = blend === 'add' ? 6 : 5; mesh.userData.ndSkip = true; this.scene.add(mesh); this.meshes.push(mesh);
  }
  update(f, fps = 30) { this.u.tm.value = f / fps; }
}

/** Rayos 3D: tubos finos aditivos (HDR para que brillen con el bloom). events: [{ f, pos:[x,z], top:[x,y,z]?, h:alto, seed, width }] visibles 7 fotogramas con parpadeo. */
export class Lightning {
  constructor(scene, events = []) {
    this.scene = scene; this.items = events.map((e, ei) => {
      const r = rng((e.seed ?? 1) * 97 + ei * 13), h = e.h ?? 60, top = e.top || [e.pos[0] + (r() - 0.5) * 12, h, e.pos[1] + (r() - 0.5) * 12], bot = [e.pos[0], e.y ?? 0, e.pos[1]];
      const segs = [], bolt = (a, b, depth, w) => {
        const n = depth === 0 ? 14 : 6; let p = a.slice();
        for (let i = 1; i <= n; i++) { const t = i / n, q = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; if (i < n) { const j = (h / 14) * (depth === 0 ? 0.5 : 0.7); q[0] += (r() - 0.5) * j; q[2] += (r() - 0.5) * j; q[1] += (r() - 0.5) * j * 0.3; }
          segs.push([p, q, w]); if (depth < 2 && r() < 0.22) bolt(q, [q[0] + (r() - 0.5) * h * 0.35, q[1] - h * (0.12 + r() * 0.2), q[2] + (r() - 0.5) * h * 0.35], depth + 1, w * 0.55); p = q; }
      };
      bolt(top, bot, 0, e.width ?? 0.16);
      const group = new THREE.Group();
      const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 7, 10), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false });
      for (const [a, b, w] of segs) {
        const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B), g = new THREE.CylinderGeometry(w * 0.5, w * 0.5, len, 5, 1, true);
        const mesh = new THREE.Mesh(g, m); mesh.position.copy(A).add(B).multiplyScalar(0.5); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); mesh.userData.ndSkip = true; group.add(mesh);
      }
      group.visible = false; group.renderOrder = 7; scene.add(group); return { f: e.f, group, m, pos: bot };
    });
  }
  /** devuelve intensidad de destello 0..1 para el fotograma f (para usarla en el flash de cámara o la luz) */
  update(f) {
    let flash = 0;
    for (const it of this.items) { const d = f - it.f, on = d >= 0 && d < 9; it.group.visible = on; if (on) { const k = [1, 0.15, 1, 0.55, 0.9, 0.4, 0.5, 0.2, 0.1][d] ?? 0; it.m.opacity = k; flash = Math.max(flash, k * (1 - d / 9)); } }
    return flash;
  }
}
