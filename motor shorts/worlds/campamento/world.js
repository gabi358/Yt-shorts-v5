// MUNDO "campamento": campamento de ejército junto a una ciudad amurallada (original del kit). Sirve de base para cualquier historia medieval/antigua/oriental:
// cambia colores, banderas, tejados y atrezo. El suelo está en y = 0 (story: DECK = 0).
export const build = (ctx) => {
  const { kit, scene } = ctx, mats = kit.mats, rng = ctx.rng(11);
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // --- terreno: llano en el campamento y la calzada, colinas suaves fuera ---
  const H = (x, z) => { const flat = sm(26, 78, Math.hypot(x * 0.85, z + 22)); return flat * (4.2 * Math.sin(x * 0.042 + 1) * Math.cos(z * 0.033) + 2.6 * Math.sin(x * 0.11) * Math.sin(z * 0.09 + 2)) + Math.max(0, -z - 90) * 0.04 * 0; };
  kit.heightAt = H;
  kit.terrain({ size: 520, seg: 170, cz: -30, height: H, map: 'meadow', tile: 5, color: (x, z) => {
    const road = sm(3.6, 1.2, Math.abs(x + Math.sin(z * 0.06) * 1.2)) * sm(-44, -40, z) * sm(34, 28, z), camp = sm(13, 5, Math.hypot(x, z));
    const t = Math.max(road, camp * 0.85), n = 0.9 + 0.12 * Math.sin(x * 0.7) * Math.sin(z * 0.8), mix = (u, v) => Math.round((u + (v - u) * t) * n);
    return `rgb(${mix(255, 200)},${mix(255, 168)},${mix(235, 130)})`;
  } });
  kit.mountains({ r0: 760, r1: 1150, n: 30, h: [110, 300], color: '#4d5c80', cz: -200 });
  // --- hierba: densa en el prado, nada en calzada/tiendas/fuego ---
  const avoid = (x, z) => 1 - Math.max(sm(3.4, 2.0, Math.abs(x + Math.sin(z * 0.06) * 1.2)) * (z < 34 && z > -44 ? 1 : 0), sm(9, 5.5, Math.hypot(x, z)), sm(5.5, 3.5, Math.hypot(x + 6.2, z + 3.4)), sm(5.5, 3.5, Math.hypot(x - 6.4, z + 4.2)), sm(8, 5, Math.hypot(x, z + 12)));
  kit.grass({ area: [-60, -46, 60, 36], n: ctx.SC < 1 ? 70000 : 150000, h: [0.3, 0.75], w: 0.07, mask: avoid, seed: 4 });
  kit.grass({ area: [-14, 12, 14, 30], n: ctx.SC < 1 ? 25000 : 60000, h: [0.5, 1.1], w: 0.08, mask: (x, z) => avoid(x, z) * (0.7 + 0.3 * Math.sin(x * 0.4)), seed: 9, colors: ['#4a6a30', '#9bb25a', '#6d9440'] });
  // --- árboles ---
  const pines = []; for (let i = 0; i < 70; i++) { const side = i % 2 ? 1 : -1, x = side * (30 + rng() * 55), z = 28 - rng() * 80; pines.push([x, z, 1 + rng() * 0.9]); }
  kit.pines(pines, { seed: 3 }); const rts = []; for (let i = 0; i < 26; i++) rts.push([(rng() - 0.5) * 120, -50 - rng() * 60, 1 + rng() * 0.8]); kit.roundTrees(rts, { seed: 8 });
  // --- ciudad amurallada ---
  const Z = -48; kit.gate({ pos: [0, Z], w: 5, h: 6.5, W: 13, HH: 10.5, t: 2.8 });
  kit.wall({ a: [-6.5, Z], b: [-34, Z], h: 9.5, t: 2.4 }); kit.wall({ a: [6.5, Z], b: [34, Z], h: 9.5, t: 2.4 });
  kit.wall({ a: [-34, Z], b: [-72, Z - 8], h: 9.5, t: 2.4 }); kit.wall({ a: [34, Z], b: [72, Z - 8], h: 9.5, t: 2.4 });
  for (const x of [-34, 34]) kit.tower({ pos: [x, Z], r: 3.4, h: 13, roof: 'red' }); for (const x of [-72, 72]) kit.tower({ pos: [x, Z - 8], r: 3.4, h: 13, roof: 'dark' });
  for (let i = 0; i < 9; i++) kit.house({ pos: [-34 + i * 8.6 + (i % 2) * 1.6, Z - 12 - (i % 3) * 5], w: 6 + (i % 3), d: 5 + (i % 2), h: 4 + (i % 3) * 0.6, rotY: (i % 3 - 1) * 0.08, roof: i % 4 === 0 ? 'dark' : 'red' });
  kit.tower({ pos: [-12, Z - 30], r: 4.2, h: 22, roof: 'red' });
  kit.banner({ pos: [-9.5, Z + 3], h: 12, color: '#b83a2a' }); kit.banner({ pos: [9.5, Z + 3], h: 12, color: '#2a4a8a', emblem: '#e8e0c8' });
  // --- campamento ---
  const fx = [];
  fx.push(...kit.campfire({ pos: [0, 0], I: 52, size: 3.6 }));
  kit.tent({ pos: [-6.2, -3.4], rotY: 0.5, w: 4.6, d: 5.6, h: 3.4, fabric: ['#e0d3ae', '#a9473b'], seed: 3 }); kit.tent({ pos: [6.4, -4.2], rotY: -0.55, w: 4.6, d: 5.6, h: 3.4, fabric: ['#d9d0b6', '#2f5f8f'], seed: 5 });
  kit.tent({ pos: [0, -12], rotY: 0, w: 7.5, d: 9, h: 5.2, wall: 2.1, fabric: ['#e8dcc0', '#7a2a2e'], seed: 9 });
  kit.carpet({ pos: [0, -12], w: 4.2, d: 6, seed: 12 }); kit.table({ pos: [1.6, -12.5], w: 1.8, d: 0.9, h: 0.75 }); kit.table({ pos: [-2.0, -14], w: 1.5, d: 0.8, h: 0.7, rotY: 0.3 });
  kit.lantern({ pos: [-0.5, 3.0, -11.5], hang: true, I: 20, size: 1.6, key: 'tent' }); kit.lantern({ pos: [2.5, 0.95, -12.5], I: 9, size: 1.0, key: 'tent' });
  kit.shaft({ from: [3.8, 5.6, -10], to: [0.2, 0, -14], w0: 0.5, w1: 2.2, color: '#9fb6e8', I: 0.35 });
  kit.barrel({ pos: [3.8, 2.6], s: 1 }); kit.barrel({ pos: [4.6, 3.0], s: 0.9 }); kit.barrel({ pos: [-3.4, 3.2], s: 1, gold: true }); kit.crate({ pos: [4.2, 3.9], s: 1 }); kit.crate({ pos: [-4.3, 2.4], s: 0.9, rotY: 0.5 });
  kit.sack({ pos: [-3.0, 4.0] }); kit.sack({ pos: [-3.5, 4.4], s: 0.9 }); kit.cart({ pos: [-9, 6], rotY: 0.6 });
  kit.fence({ a: [-16, 14], b: [16, 14] });
  for (const [x, z] of [[-3.4, -38], [3.4, -38], [-3.4, -22], [3.4, -22], [-3.6, -6], [3.6, -6]]) fx.push(...kit.torch({ pos: [x, z], I: 18 }));
  // --- multitud: columna de soldados en la calzada y reunión al fondo ---
  const variants = ['legion', 'dA', 'dC', 'dE', 'gA', 'gC', 'gD', 'workA', 'dF', 'gF', 'aus', 'usS'].map((who, i) => ({ who, tint: ['#ffffff', '#f0e6dc', '#e6ecf4', '#f4e8d8'][i % 4] }));
  const list = []; for (let i = 0; i < 110; i++) { const row = Math.floor(i / 6), z = -38 + row * 1.7 + (i % 2) * 0.4; list.push([-4.2 + (i % 6) * 1.5 + (rng() - 0.5) * 0.5, H(0, z), z, -1, 1.15 + rng() * 0.14]); }
  for (let i = 0; i < 70; i++) list.push([(rng() - 0.5) * 38, 0, -26 - rng() * 12, -1, 1.15 + rng() * 0.15]);
  kit.crowd({ variants, list, seed: 5 });
  return { fx, update: () => {}, light: (L) => { } };
};
