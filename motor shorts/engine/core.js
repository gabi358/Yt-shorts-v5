// CORE v5 — motor de render del kit. Un mundo (world.js) + una historia (story.js) -> renderFrame(f).
// Frente a v4: materiales PBR suaves con textura pintada, luces prácticas (fuego/linternas) con parpadeo, cielo con luna/estrellas/nubes, personajes ILUMINADOS por la escena,
// bloom + rayos de luz (god rays) + tone mapping filmico + etalonaje con tintes de sombra/luces + grano, tinta fina, DOF con bokeh, partículas y rayos 3D.
import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import * as STORY from './story.js';
import * as WORLD from './world.js';
import { Particles, Lightning } from './fx.js';
import { makeKit } from './builders.js';

const { TOTAL, shotAt, camAt, dofAt, lightFor, actorsAt, worldAt, fxAt } = STORY;
const GROUND = STORY.DECK ?? 0, FPS = STORY.FPS ?? 30;
const SC = location.hash.includes('half') ? 0.5 : 1, W = Math.round(1080 * SC), H = Math.round(1920 * SC);
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.08, 2500);
const rx = (a) => a * Math.PI / 180;

// ---------- luces globales ----------
const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 2); sun.castShadow = true;
sun.shadow.mapSize.set(SC < 1 ? 2048 : 4096, SC < 1 ? 2048 : 4096); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3;
scene.add(sun); scene.add(sun.target);
scene.fog = new THREE.Fog('#ffffff', 40, 600);
const NPL = 6, pls = []; for (let i = 0; i < NPL; i++) { const l = new THREE.PointLight('#ffffff', 0, 0, 2); l.castShadow = false; scene.add(l); pls.push(l); }

// ---------- uniforms de iluminación compartidos con las tarjetas ----------
const LU = {
  sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color() }, hemiSky: { value: new THREE.Color() }, hemiGnd: { value: new THREE.Color() }, ref: { value: new THREE.Color(1, 1, 1) },
  litAmt: { value: 0.8 }, rimAmt: { value: 0.5 },
  plPos: { value: Array.from({ length: NPL }, () => new THREE.Vector3()) }, plCol: { value: Array.from({ length: NPL }, () => new THREE.Vector3()) }, plI: { value: new Array(NPL).fill(0) },
};

// ---------- cielo ----------
const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color() }, sunSize: { value: 0 }, glow: { value: 0.3 }, glowCol: { value: new THREE.Color() },
  stars: { value: 0 }, cover: { value: 0.5 }, cloudCol: { value: new THREE.Color() }, cloudShade: { value: new THREE.Color() }, tm: { value: 0 }, flash: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(1800, 48, 24), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 top, hor, sunDir, sunCol, glowCol, cloudCol, cloudShade; uniform float sunSize, glow, stars, cover, tm, flash; varying vec3 vP;
    float hash(vec3 p){ p = fract(p*.3183099+.1); p *= 17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
    float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash2(i),hash2(i+vec2(1,0)),f.x), mix(hash2(i+vec2(0,1)),hash2(i+vec2(1,1)),f.x), f.y); }
    float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s += a*noise(p); p = p*2.03 + 7.1; a *= .5; } return s; }
    void main(){ vec3 d = normalize(vP); float h = max(d.y, 0.); vec3 c = mix(hor, top, pow(h, .5)); if (d.y < 0.) c = hor*.8;
      vec3 sd = normalize(sunDir); float s = dot(d, sd);
      c += glowCol * glow * (pow(max(s,0.), 6.)*.35 + pow(max(s,0.), 60.)*.9);
      if (stars > 0.) { vec3 sp = floor(d*220.); float hs = hash(sp); float tw = .6 + .4*sin(tm*3. + hs*40.); c += vec3(.8,.85,1.) * step(.9975, hs) * tw * stars * smoothstep(.05,.4,d.y); }
      if (cover > 0. && d.y > -.02) { vec2 uv = d.xz/(d.y+.28)*1.15 + vec2(tm*.012, tm*.004); float n = fbm(uv), n2 = fbm(uv*1.9 + 3.);
        float cl = smoothstep(1.-cover, 1.-cover+.32, n*.75 + n2*.35) * smoothstep(-.02, .22, d.y);
        float lt = clamp((fbm(uv + sd.xz*.35) - n)*2.6 + .55, 0., 1.);
        vec3 cc = mix(cloudShade, cloudCol, lt); cc += glowCol*pow(max(s,0.), 5.)*.6*(1.-cl*.3);
        c = mix(c, cc, cl*.92); }
      c += sunCol * smoothstep(1.-sunSize, 1.-sunSize*.55, s);
      c += vec3(flash)*vec3(.6,.7,1.)*(.4+h);
      gl_FragColor = vec4(c,1.); }`,
}));
sky.userData.sky = true; sky.userData.ndSkip = true; scene.add(sky);

// ---------- materiales ----------
const tex = P.tex;
const std = (o = {}) => new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, ...o });
const paintMat = (canvas, rx_ = 1, ry_ = 1, o = {}) => { const m = std({ map: tex(canvas, rx_, ry_), ...o }); return m; };
const add = (geo, mat, x = 0, y = 0, z = 0, parent = scene, opts = {}) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = opts.cast ?? true; m.receiveShadow = opts.receive ?? true; parent.add(m); return m; };

// ---------- normal+profundidad para tinta/DOF ----------
const ndMat = new THREE.ShaderMaterial({
  vertexShader: `varying vec3 vN; varying float vD; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vD); }`, side: THREE.DoubleSide,
});
/** nd plano (normal arriba): para hierba/follaje/multitudes — sin líneas de pliegue, solo profundidad */
const ndUp = new THREE.ShaderMaterial({
  vertexShader: `varying float vD; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `varying float vD; void main(){ gl_FragColor = vec4(.5,1.,.5,vD); }`, side: THREE.DoubleSide,
});
const cardNd = (map) => new THREE.ShaderMaterial({
  uniforms: { map: { value: map } },
  vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv=uv; vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vD; void main(){ if(texture2D(map,vUv).a<.5) discard; gl_FragColor=vec4(0.,0.,0.,vD); }`, side: THREE.DoubleSide,
});

// ---------- tarjetas de personaje ILUMINADAS ----------
const CW = 1200, CH = 2000, CM = 2.25;
const cardGeo = new THREE.PlaneGeometry(CM * 0.6, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
const blobTex = P.tex(P.radial('20,14,30', 0.6));
const cardMat = (map) => new THREE.ShaderMaterial({
  uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), map: { value: map }, tint: { value: new THREE.Color('#ffffff') }, opacity: { value: 1 }, cen: { value: new THREE.Vector3() }, sc: { value: 1 }, ...LU },
  transparent: true, side: THREE.DoubleSide, fog: true,
  vertexShader: `#include <fog_pars_vertex>
    varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
    #include <fog_vertex>
    }`,
  fragmentShader: `#include <fog_pars_fragment>
    uniform sampler2D map; uniform vec3 tint, cen, sunDir, sunCol, hemiSky, hemiGnd, ref; uniform float opacity, sc, litAmt, rimAmt; uniform vec3 plPos[${NPL}]; uniform vec3 plCol[${NPL}]; uniform float plI[${NPL}];
    varying vec2 vUv; varying vec3 vW;
    void main(){ vec4 t = texture2D(map, vUv); if (t.a < .02) discard;
      vec3 N0 = normalize(vec3(cameraPosition.x-cen.x, 0., cameraPosition.z-cen.z)); vec3 R = vec3(N0.z, 0., -N0.x);
      float px = clamp(dot(vW-cen, R)/(.34*sc), -1., 1.), py = clamp((vW.y-cen.y)/(1.1*sc), -1., 1.);
      vec3 n = normalize(N0*.85 + R*px*.85 + vec3(0.,1.,0.)*(.2+py*.4)); vec3 L = normalize(sunDir);
      vec3 lit = mix(hemiGnd, hemiSky, n.y*.5+.5) + sunCol*clamp((dot(n,L)+.35)/1.35, 0., 1.);
      for (int i=0;i<${NPL};i++){ vec3 d = plPos[i]-vW; float dd = dot(d,d); lit += plCol[i]*(plI[i]/(dd+.8))*clamp(dot(n,normalize(d))*.6+.4, 0., 1.); }
      vec3 k = clamp(lit/max(ref, vec3(.001)), vec3(.28), vec3(2.4));
      vec3 col = t.rgb*tint*mix(vec3(1.), k, litAmt);
      col += sunCol*pow(1.-max(dot(n,N0),0.), 2.5)*max(dot(n,L),0.)*rimAmt;
      gl_FragColor = vec4(col, t.a*opacity);
      #include <fog_fragment>
    }`,
});
class Card {
  constructor() {
    [this.c, this.g] = (() => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return [c, c.getContext('2d')]; })();
    this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 4;
    this.mat = cardMat(this.t);
    this.mesh = new THREE.Mesh(cardGeo, this.mat); this.mesh.userData.nd = cardNd(this.t); this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.t, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, fog: true }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.userData.ndSkip = true; this.blob.renderOrder = 1;
    scene.add(this.mesh); scene.add(this.blob); this.key = ''; this.mesh.visible = this.blob.visible = false;
  }
  draw(key, fn) { if (key === this.key) return; this.key = key; const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0); fn(new T.Pen(g)); this.t.needsUpdate = true; }
}
const cards = []; const getCard = (i) => cards[i] || (cards[i] = new Card());

// ---------- lámparas prácticas (fuego, linternas, antorchas) ----------
const lamps = [];
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
/** lamp({ pos, color, I (intensidad), size (m del halo), flicker (0-1), key (para apagarla desde worldAt: S.lamps[key]=0..1), always (ignora L.practical) }) */
const lamp = (o) => {
  const col = new THREE.Color(o.color || '#ffb060'), sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col.clone().multiplyScalar(o.glow ?? 2.2), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
  sp.position.set(...o.pos); sp.scale.setScalar(o.size ?? 1.6); sp.userData.ndSkip = true; sp.renderOrder = 6; scene.add(sp);
  const l = { pos: new THREE.Vector3(...o.pos), col, I: o.I ?? 30, size: o.size ?? 1.6, flicker: o.flicker ?? 0.2, key: o.key, always: !!o.always, seed: o.seed ?? lamps.length * 3.7, sp, level: 1, dist: 0 };
  lamps.push(l); return l;
};
const flickerAt = (l, f) => 1 + l.flicker * (0.55 * Math.sin(f * 0.43 + l.seed) + 0.3 * Math.sin(f * 1.17 + l.seed * 2.1) + 0.15 * Math.sin(f * 2.9 + l.seed * 5.3));

// ---------- API para mundos ----------
const ctx = { THREE, scene, renderer, P, T, std, paintMat, tex, add, lamp, GROUND, ndUp, ndMat, SC, W, H, FPS, camera, LU, rng: P.rng };
ctx.kit = makeKit(ctx);
ctx.world = WORLD.build ? WORLD.build(ctx) : {};
const particles = new Particles(scene, [...(ctx.world.fx || []), ...(STORY.FX_EVENTS || [])], FPS), lightning = new Lightning(scene, STORY.LIGHTNING || []);

// ---------- render targets y post ----------
const HF = { type: THREE.HalfFloatType };
const rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 4, ...HF });
const rtNd = new THREE.WebGLRenderTarget(W, H, { ...HF, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const rtInk = new THREE.WebGLRenderTarget(W, H, { ...HF });
const sz = (d) => [Math.max(4, Math.round(W / d)), Math.max(4, Math.round(H / d))];
const mkRT = (d) => new THREE.WebGLRenderTarget(...sz(d), { ...HF, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
const bl = [4, 8, 16].map((d) => ({ d, a: mkRT(d), b: mkRT(d) })), rtRays = mkRT(4);
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsGeo = new THREE.PlaneGeometry(2, 2);
const fs = (mat) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(fsGeo, mat)); return s; };
const VS = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;
const mk = (uniforms, fragmentShader) => fs(new THREE.ShaderMaterial({ uniforms, vertexShader: VS, fragmentShader, depthTest: false, depthWrite: false }));
const brightU = { src: { value: rtColor.texture }, thr: { value: 1.0 }, texel: { value: new THREE.Vector2(1 / W, 1 / H) } };
const brightS = mk(brightU, `uniform sampler2D src; uniform float thr; uniform vec2 texel; varying vec2 vUv;
  void main(){ vec3 c = (texture2D(src, vUv+texel*vec2(-1.,-1.)).rgb + texture2D(src, vUv+texel*vec2(1.,-1.)).rgb + texture2D(src, vUv+texel*vec2(-1.,1.)).rgb + texture2D(src, vUv+texel*vec2(1.,1.)).rgb)*.25;
    float l = max(max(c.r,c.g),c.b); float k = max(l - thr, 0.)/(max(l,1e-4)); gl_FragColor = vec4(min(c*k, vec3(24.)), 1.); }`);
const blurU = { src: { value: null }, dir: { value: new THREE.Vector2() } };
const blurS = mk(blurU, `uniform sampler2D src; uniform vec2 dir; varying vec2 vUv;
  void main(){ vec3 a = texture2D(src, vUv).rgb*.2270270; a += (texture2D(src, vUv+dir*1.3846153).rgb + texture2D(src, vUv-dir*1.3846153).rgb)*.3162162; a += (texture2D(src, vUv+dir*3.2307692).rgb + texture2D(src, vUv-dir*3.2307692).rgb)*.0702702; gl_FragColor = vec4(a,1.); }`);
const raysU = { src: { value: null }, nd: { value: rtNd.texture }, lp: { value: new THREE.Vector2(.5, .5) }, dens: { value: 0.95 }, decay: { value: 0.95 } };
const raysS = mk(raysU, `uniform sampler2D src, nd; uniform vec2 lp; uniform float dens, decay; varying vec2 vUv;
  void main(){ vec2 d = (vUv - lp) * dens/40.; vec2 uv = vUv; float il = 1.; vec3 acc = vec3(0.);
    for (int i=0;i<40;i++){ uv -= d; float occ = texture2D(nd, uv).a; acc += texture2D(src, uv).rgb * (occ > 0. ? 0. : 1.) * il; il *= decay; }
    gl_FragColor = vec4(acc/40., 1.); }`);
const inkU = {
  col: { value: rtColor.texture }, nd: { value: rtNd.texture }, b1: { value: bl[0].a.texture }, b2: { value: bl[1].a.texture }, b3: { value: bl[2].a.texture }, rays: { value: rtRays.texture }, res: { value: new THREE.Vector2(W, H) },
  px: { value: 1.4 }, sat: { value: 1.1 }, lift: { value: new THREE.Color(0, 0, 0) }, gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.25 }, flash: { value: 0 }, rain: { value: 0 }, tm: { value: 0 },
  bloomI: { value: 0.35 }, raysI: { value: 0 }, expo: { value: 1 }, gSh: { value: new THREE.Color('#d8e4ff') }, gHi: { value: new THREE.Color('#fff0dc') }, gAmt: { value: 0.5 }, contrast: { value: 0.25 }, grain: { value: 0.03 },
  inkAmt: { value: 0.8 }, inkCol: { value: new THREE.Color('#0d0a12') }, raysCol: { value: new THREE.Color('#ffffff') },
};
const inkScene = mk(inkU, `uniform sampler2D col, nd, b1, b2, b3, rays; uniform vec2 res; uniform float px, sat, vig, flash, rain, tm, bloomI, raysI, expo, gAmt, contrast, grain, inkAmt; uniform vec3 lift, gain, gSh, gHi, inkCol, raysCol; varying vec2 vUv;
  float edgeAt(vec2 uv, float r){
    vec4 c = texture2D(nd, uv); if (dot(c.rgb,c.rgb) < .01) return 0.; float d = c.a; vec3 n = c.rgb*2.-1.;
    float e = 0.; float rr = r * clamp(7./d, .62, 1.25);
    for (int i=0;i<16;i++){ float a = float(i)*.785398 + (i>7 ? .39 : 0.); float k = i>7 ? .5 : 1.;
      vec2 o = vec2(cos(a), sin(a))*rr*k/res; vec4 s = texture2D(nd, uv+o);
      float ds = s.a; bool card = dot(s.rgb,s.rgb) < .01;
      if (card && ds > 0.) continue;
      if (card) ds = 1e4;
      vec3 ns = s.rgb*2.-1.;
      e = max(e, smoothstep(.006, .02, (ds - d)/d));
      if (!card && abs(ds-d)/d < .06) e = max(e, smoothstep(.88, .72, dot(n, ns)) * .9);
    }
    return e * (1. - smoothstep(140., 520., d)*.8);
  }
  float h1(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
  void main(){
    vec3 c = texture2D(col, vUv).rgb;
    c += (texture2D(b1, vUv).rgb*.5 + texture2D(b2, vUv).rgb*.35 + texture2D(b3, vUv).rgb*.3) * bloomI;
    c += texture2D(rays, vUv).rgb * raysCol * raysI;
    c *= expo;
    c = (c*(2.51*c+.03))/(c*(2.43*c+.59)+.14);                      // ACES filmico
    float l = dot(c, vec3(.2126,.7152,.0722));
    c *= mix(vec3(1.), gSh, (1.-smoothstep(0.,.45,l))*gAmt);          // sombras frías
    c *= mix(vec3(1.), gHi, smoothstep(.35,1.,l)*gAmt);               // luces cálidas
    c = mix(c, c*c*(3.-2.*c), contrast);                              // curva S
    l = dot(c, vec3(.2126,.7152,.0722)); c = mix(vec3(l), c, sat);
    c = c*gain + lift;
    float e = edgeAt(vUv, px) * inkAmt; c = mix(c, inkCol, e);
    if (flash < -0.5) c = vec3(e/max(inkAmt,.01));
    if (rain > 0.) { for (int k=0;k<2;k++){ float sc = k==0 ? 170. : 95.; float u = vUv.x*sc + vUv.y*sc*.22*(k==0?1.:.8); float id = floor(u); float hh = fract(sin(id*91.7+float(k)*7.)*437.5);
        float y = fract(vUv.y*(1.6+hh) + tm*(2.4+hh*1.8) + hh*10.); float s1 = smoothstep(0.,.03,y)*smoothstep(.24,.08,y); float w = 1. - abs(fract(u)-.5)*2.; s1 *= smoothstep(.55,.9,w)*step(.45,hh);
        c = mix(c, vec3(.82,.9,1.), s1*rain*.5); } }
    vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.75), q*vec2(1.,.75))*2.2;
    c += (h1(vUv*res + tm*37.) - .5) * grain;
    c = mix(c, vec3(1.), max(flash, 0.));
    gl_FragColor = vec4(max(c, 0.),1.); }`);
const dofU = { src: { value: rtInk.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, focus: { value: 5 }, cinf: { value: 0 }, near: { value: 1 } };
const dofScene = fs(new THREE.ShaderMaterial({ uniforms: dofU, vertexShader: VS,
  fragmentShader: `uniform sampler2D src, nd; uniform vec2 res; uniform float focus, cinf, near; varying vec2 vUv;
  float coc(vec2 uv){ float d = texture2D(nd, uv).a; if (d <= 0.) d = 2000.; float k = 1. - focus/d; return k > 0. ? cinf*k : min(-k*cinf*near, cinf*1.4); }
  void main(){
    float c0 = coc(vUv);
    if (cinf < .5 || c0 < .6) { gl_FragColor = linearToOutputTexel(vec4(texture2D(src, vUv).rgb, 1.)); return; }
    vec3 acc = vec3(0.); float wsum = 0.;
    for (int i=0;i<48;i++){ float fi = float(i); float r = sqrt((fi+.5)/48.); float a = fi*2.39996;
      vec2 o = vec2(cos(a), sin(a))*r*c0/res; float cs = coc(vUv+o);
      vec3 s = texture2D(src, vUv+o).rgb; float w = smoothstep(r*c0-1.5, r*c0+.5, cs + .5) * (1. + pow(dot(s, vec3(.33)), 3.)*1.6);
      acc += s*w; wsum += w; }
    gl_FragColor = linearToOutputTexel(vec4(acc/max(wsum,1e-3), 1.)); }` }));
dofScene.children[0].material.toneMapped = false;
const run = (s, target) => { renderer.setRenderTarget(target); renderer.render(s, fsCam); };

// ---------- estado por fotograma ----------
const tmpV = new THREE.Vector3(), tmpC = new THREE.Color();
const setC = (c, v, d = '#000000') => c.set(v || d);
function applyLight(L, f) {
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemi;
  sun.color.set(L.sun); sun.intensity = L.sunI;
  scene.fog.color.set(L.fog); scene.fog.near = L.fogNear; scene.fog.far = L.fogFar;
  skyU.top.value.set(L.skyTop); skyU.hor.value.set(L.skyHor); skyU.sunCol.value.set(L.sunDisc || '#000').multiplyScalar(L.sunDiscI ?? 4); skyU.sunSize.value = L.sunSize || 0;
  skyU.glow.value = L.glow ?? 0.3; skyU.glowCol.value.set(L.glowCol || L.sun); skyU.stars.value = L.stars ?? 0; skyU.cover.value = L.clouds ?? 0.45;
  skyU.cloudCol.value.set(L.cloudCol || '#ffffff'); skyU.cloudShade.value.set(L.cloudShade || L.skyHor); skyU.tm.value = f / FPS;
  inkU.sat.value = L.sat ?? 1.1; inkU.gain.value.set(L.gain || '#ffffff'); inkU.lift.value.set(L.lift || '#000000'); inkU.vig.value = L.vig ?? 0.25;
  inkU.bloomI.value = L.bloom ?? 0.35; inkU.raysI.value = L.rays ?? 0; inkU.raysCol.value.set(L.raysCol || L.sun); inkU.expo.value = L.exposure ?? 1;
  inkU.gSh.value.set(L.gShadow || '#d4e0ff'); inkU.gHi.value.set(L.gHigh || '#fff0dc'); inkU.gAmt.value = L.gAmt ?? 0.55; inkU.contrast.value = L.contrast ?? 0.25; inkU.grain.value = L.grain ?? 0.03;
  inkU.inkAmt.value = L.ink ?? 0.8; inkU.inkCol.value.set(L.inkCol || '#0d0a12'); inkU.px.value = (L.inkPx ?? 1.4) * SC; inkU.rain.value = L.rain || 0; inkU.tm.value = f / FPS;
  brightU.thr.value = L.bloomThr ?? 0.95;
  ctx.kit.onLight(L); if (ctx.world.light) ctx.world.light(L, f);
  // tarjetas
  LU.hemiSky.value.set(L.sky).multiplyScalar(L.hemi); LU.hemiGnd.value.set(L.ground).multiplyScalar(L.hemi);
  LU.sunCol.value.set(L.sun).multiplyScalar(L.sunI * 0.45); LU.litAmt.value = L.cardLit ?? 0.8; LU.rimAmt.value = L.cardRim ?? 0.5;
  LU.ref.value.copy(LU.hemiSky.value).add(LU.hemiGnd.value).multiplyScalar(0.5).add(tmpC.copy(LU.sunCol.value).multiplyScalar(0.7));
}
function placeSun(L, focus) {
  const az = rx(L.az), el = rx(L.el); tmpV.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  skyU.sunDir.value.copy(tmpV); LU.sunDir.value.copy(tmpV);
  sun.position.copy(focus).addScaledVector(tmpV, 90); sun.target.position.copy(focus);
  const ext = L.shadowExt || 30, sc = sun.shadow.camera; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 260; sc.updateProjectionMatrix();
}
function placeLamps(L, S, f) {
  const prac = L.practical ?? 0;
  for (const l of lamps) {
    l.level = (l.always ? 1 : prac) * (S.lamps && l.key in S.lamps ? S.lamps[l.key] : 1) * flickerAt(l, f);
    l.dist = l.pos.distanceTo(camera.position); l.sp.visible = l.level > 0.02; l.sp.material.opacity = Math.min(1, l.level); l.sp.scale.setScalar(l.size * (0.9 + 0.1 * l.level));
  }
  const order = lamps.filter((l) => l.level > 0.02).sort((a, b) => a.dist - b.dist);
  pls.forEach((pl, i) => {
    const l = order[i]; if (!l) { pl.intensity = 0; LU.plI.value[i] = 0; return; }
    pl.position.copy(l.pos); pl.color.copy(l.col); pl.intensity = l.I * l.level;
    LU.plPos.value[i].copy(l.pos); LU.plCol.value[i].set(l.col.r, l.col.g, l.col.b); LU.plI.value[i] = l.I * l.level * 0.22;
  });
}
function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i); c.draw(a.key, a.draw);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0), a.roll || 0);
    c.mat.uniforms.tint.value.set(a.tint || '#ffffff'); c.mat.uniforms.opacity.value = a.alpha ?? 1; c.mat.uniforms.cen.value.set(a.x, a.y + 1.05 * s, a.z); c.mat.uniforms.sc.value = s;
    c.mat.uniforms.litAmt && (c.mat.uniforms.litAmt.value = a.lit ?? LU.litAmt.value);
    c.mesh.castShadow = a.shadow !== false; c.mesh.renderOrder = a.order || 2;
    if (a.blob !== false && a.y < GROUND + 0.5) { c.blob.visible = true; c.blob.position.set(a.x, (a.ground ?? GROUND) + 0.02, a.z); c.blob.scale.set(0.95 * s, 0.6 * s, 1); }
  });
}
const swapForNd = (on) => {
  scene.traverse((o) => {
    if (on) {
      if (o.userData.ndSkip) { o.userData.vis0 = o.visible; o.visible = false; return; }
      if (!o.isMesh) return;
      o.userData.mat0 = o.material; o.material = o.userData.nd || ndMat;
    } else {
      if (o.userData.vis0 !== undefined) { o.visible = o.userData.vis0; delete o.userData.vis0; }
      if (o.isMesh && o.userData.mat0) { o.material = o.userData.mat0; delete o.userData.mat0; }
    }
  });
};
const proj = new THREE.Vector3();
window.renderFrame = (f) => {
  const S = shotAt(f), L = lightFor(S, f), C = camAt(f);
  const W_ = worldAt(f);
  const actorList = [...actorsAt(f, T), ...fxAt(f, T)];
  ctx.kit.tm.value = f / FPS; applyLight(L, f);
  camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0));
  camera.fov = C.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  placeSun(L, new THREE.Vector3(...(C.shadowAt || C.look)));
  if (ctx.world.update) ctx.world.update(W_, f, L, C);
  placeLamps(L, W_, f); particles.update(f, FPS);
  const lf = lightning.update(f); hemi.intensity += lf * 1.6; skyU.flash.value = lf * 0.9;
  drawActors(actorList, camera);
  sky.position.copy(camera.position);
  // A: color (HDR lineal)
  run0(rtColor, () => renderer.render(scene, camera), 0x000000, 1);
  // B: normales + profundidad
  const fog = scene.fog; scene.fog = null; const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.shadowMap.autoUpdate = false;
  swapForNd(true); run0(rtNd, () => renderer.render(scene, camera), 0x000000, 0); swapForNd(false);
  scene.fog = fog; renderer.shadowMap.enabled = sm; renderer.shadowMap.autoUpdate = true;
  if (window.DEBUG_ND) { const dm = new THREE.MeshBasicMaterial({ map: rtNd.texture }); renderer.setRenderTarget(null); renderer.render(fs(dm), fsCam); return true; }
  // bloom
  run(brightS, bl[0].a); let prev = bl[0].a;
  bl.forEach((lv, i) => {
    if (i > 0) { brightU.src.value = prev.texture; const t0 = brightU.thr.value; brightU.thr.value = 0; brightU.texel.value.set(1 / lv.a.width, 1 / lv.a.height); run(brightS, lv.a); brightU.thr.value = t0; brightU.src.value = rtColor.texture; brightU.texel.value.set(1 / W, 1 / H); }
    blurU.src.value = lv.a.texture; blurU.dir.value.set(1.5 / lv.a.width, 0); run(blurS, lv.b);
    blurU.src.value = lv.b.texture; blurU.dir.value.set(0, 1.5 / lv.a.height); run(blurS, lv.a); prev = lv.a;
  });
  // rayos de luz (solo si el astro está delante de la cámara)
  if ((L.rays ?? 0) > 0) {
    proj.copy(camera.position).addScaledVector(skyU.sunDir.value, 1000).project(camera);
    const ahead = skyU.sunDir.value.dot(camera.getWorldDirection(tmpV)) > -0.05;
    raysU.src.value = bl[0].a.texture; raysU.lp.value.set(proj.x * 0.5 + 0.5, proj.y * 0.5 + 0.5); raysU.dens.value = L.raysDens ?? 0.95; raysU.decay.value = L.raysDecay ?? 0.955;
    inkU.raysI.value = ahead ? (L.rays ?? 0) : 0; run(raysS, rtRays);
  }
  inkU.flash.value = Math.max(C.flash || 0, 0) + lf * 0.35; if (window.DEBUG_E) inkU.flash.value = -1;
  run(inkScene, rtInk);
  const D = dofAt(f); dofU.focus.value = D.focus; dofU.cinf.value = D.cinf * SC; dofU.near.value = D.near ?? 1;
  run(dofScene, null);
  hemi.intensity = L.hemi;
  return true;
};
function run0(target, fn, clear, alpha) { renderer.setRenderTarget(target); renderer.setClearColor(clear, alpha); renderer.clear(); fn(); }
window.TOTAL = TOTAL;
window.ready = true;
