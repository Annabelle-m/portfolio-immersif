/* ==========================================================================
   Monde 3D : ambiances lumineuses, réseau routier (boucle + rayons vers le
   hub central), et construction des décors de chaque ville.
   Unité : le mètre. La route fait 9 m de large, trottoirs de 4 m.
   ========================================================================== */

/* ---------- Ambiances ----------
   sky: [zénith, milieu, horizon] · sun: [élévation°, azimut°] · sunI: intensité */
const AMB3 = {
  paris:      { sky: ["#5272b4", "#e3a586", "#f5cf9f"], sun: [13, 250], sunC: "#ffcf9c", sunI: 3.1, hs: ["#a2b4d8", .55], hg: ["#8a7460", .35], fog: [110, 760], clouds: .45, ground: ["#6b7b49", "#768650"], amp: 22, road: "#48484d", walk: "#b8b0a3", style: "haussmann", lit: .2 },
  bordeaux:   { sky: ["#3c70c0", "#8db9e6", "#e5e3d6"], sun: [38, 140], sunC: "#fff0d6", sunI: 3.4, hs: ["#a9c3ea", .6], hg: ["#8a7c5c", .35], fog: [140, 820], clouds: .35, ground: ["#78894b", "#839557"], amp: 18, road: "#4d4d52", walk: "#c9bfa9", style: "bordeaux", lit: 0 },
  losangeles: { sky: ["#383d84", "#e07489", "#ffb676"], sun: [7, 268], sunC: "#ffac6c", sunI: 3.0, hs: ["#c58ca8", .55], hg: ["#7a5a48", .35], fog: [130, 820], clouds: .3, ground: ["#ad9465", "#a28a5e"], amp: 55, road: "#3f3d42", walk: "#bcae9a", style: "stucco", lit: .3 },
  newyork:    { sky: ["#4a7dce", "#9bbfec", "#dde6ee"], sun: [42, 205], sunC: "#fff5e6", sunI: 3.3, hs: ["#a6bfe0", .6], hg: ["#7d7a78", .35], fog: [140, 900], clouds: .4, ground: ["#7c7f84", "#868990"], amp: 0, road: "#3f4045", walk: "#a8a8a6", style: "newyork", lit: .05 },
  lasvegas:   { sky: ["#05061a", "#1b1340", "#5a2961"], sun: [32, 60], sunC: "#93a6ff", sunI: .8, hs: ["#3b3172", .7], hg: ["#41291c", .3], fog: [160, 950], clouds: 0, stars: 1, night: 1, emis: 3.2, ground: ["#6a4f37", "#5e462f"], amp: 75, road: "#2c2a30", walk: "#6c6460", style: "casino", lit: .6 },
  miami:      { sky: ["#1f86e0", "#7fd0f4", "#fde6d2"], sun: [42, 60], sunC: "#fff4de", sunI: 3.7, hs: ["#a4d4f0", .62], hg: ["#b0a084", .4], fog: [150, 900], clouds: .3, ground: ["#e9d9ac", "#e0cf9f"], amp: 0, road: "#4a4b50", walk: "#ead9c8", style: "artdeco", lit: .15 },
  tokyo:      { sky: ["#04071b", "#131943", "#3b2963"], sun: [38, 100], sunC: "#8898ff", sunI: .7, hs: ["#3b3b7c", .75], hg: ["#2a2430", .35], fog: [120, 760], clouds: 0, stars: .4, night: 1, emis: 3.4, ground: ["#2d2f35", "#33353b"], amp: 0, road: "#24252b", walk: "#4a4b52", style: "tokyo", lit: .65 },
  kyoto:      { sky: ["#6a9fd8", "#bad5ee", "#efe7e8"], sun: [40, 160], sunC: "#fff3e8", sunI: 3.2, hs: ["#b6cfe8", .6], hg: ["#7c7a5e", .35], fog: [130, 800], clouds: .45, ground: ["#7a9455", "#849e5d"], amp: 70, road: "#57565c", walk: "#c4bcae", style: "machiya", lit: 0 },
  osaka:      { sky: ["#2b3a72", "#c76b5d", "#f3ae7b"], sun: [6, 282], sunC: "#ff9c68", sunI: 2.6, hs: ["#9a7aa0", .5], hg: ["#5a4438", .35], fog: [110, 740], clouds: .4, emis: 2.6, ground: ["#5c654f", "#656e58"], amp: 30, road: "#3a3940", walk: "#8f8580", style: "osaka", lit: .55 },
  nara:       { sky: ["#5b96d1", "#acceec", "#e3ebdb"], sun: [50, 180], sunC: "#fff6e6", sunI: 3.3, hs: ["#aac8e6", .6], hg: ["#6f7a52", .35], fog: [130, 800], clouds: .5, ground: ["#6a9249", "#759d51"], amp: 55, road: "#5d5b56", walk: "#c2b9a6", style: "nara", lit: 0 },
  sapporo:    { sky: ["#8aa1be", "#c3d0de", "#e8edf2"], sun: [18, 150], sunC: "#f2f5ff", sunI: 1.7, hs: ["#d6e0ec", 1.0], hg: ["#e6ecf2", .7], fog: [60, 460], clouds: .8, ground: ["#eef2f6", "#e3e8ee"], amp: 60, road: "#575b63", walk: "#dde2e8", style: "snow", lit: .4, snow: 1, emis: 2 },
  sydney:     { sky: ["#2a72cf", "#83b8ee", "#d3e7f6"], sun: [55, 20], sunC: "#fff6e4", sunI: 3.6, hs: ["#9cc0ea", .6], hg: ["#6f7d5a", .35], fog: [150, 900], clouds: .35, ground: ["#6a984c", "#75a354"], amp: 20, road: "#47484d", walk: "#bdbab2", style: "sydney", lit: 0, sea: -1 },
  melbourne:  { sky: ["#657994", "#a2b0c1", "#ced5dc"], sun: [28, 200], sunC: "#eef0f2", sunI: 1.6, hs: ["#b9c5d3", 1.0], hg: ["#6e7066", .45], fog: [80, 540], clouds: .85, ground: ["#617a55", "#6b845e"], amp: 15, road: "#424449", walk: "#a6a6a2", style: "melbourne", lit: .1 },
  brisbane:   { sky: ["#3384d3", "#87c2ec", "#e1efe1"], sun: [60, 0], sunC: "#fff7de", sunI: 3.6, hs: ["#9ec6ea", .6], hg: ["#5f7a48", .35], fog: [140, 860], clouds: .4, ground: ["#5d9245", "#689e4d"], amp: 40, road: "#4a4a4e", walk: "#bcb6a8", style: "queenslander", sea: -1, lit: 0 },
  cairns:     { sky: ["#1c7fd6", "#79c6ee", "#dcf3ee"], sun: [52, 40], sunC: "#fff6e0", sunI: 3.7, hs: ["#9ed0ea", .62], hg: ["#6f8a58", .4], fog: [150, 900], clouds: .4, ground: ["#5f9a48", "#6aa650"], amp: 0, road: "#494b4e", walk: "#d6ccb6", style: "queenslander", sea: -1, lit: 0 },
  goldcoast:  { sky: ["#1b84dd", "#7bc9f2", "#e0f4fa"], sun: [60, 30], sunC: "#fff8e4", sunI: 3.7, hs: ["#9ccbee", .6], hg: ["#a8977a", .4], fog: [150, 900], clouds: .3, ground: ["#e4d19e", "#dac693"], amp: 0, road: "#4c4c50", walk: "#e2d8c0", style: "highrise", lit: 0, sea: -1 },
  uluru:      { sky: ["#3672c5", "#95bfe3", "#eed2ad"], sun: [30, 300], sunC: "#ffe4c0", sunI: 3.4, hs: ["#a8c4e4", .55], hg: ["#a0583a", .4], fog: [180, 1100], clouds: .2, ground: ["#b55a2c", "#a65028"], amp: 6, road: "#5c4335", walk: "#9c6c4c", style: "outback", lit: 0 },
  windhoek:   { sky: ["#2e3a6f", "#d27a5b", "#f3bc81"], sun: [8, 250], sunC: "#ffae76", sunI: 2.8, hs: ["#a07a96", .5], hg: ["#8a6444", .35], fog: [130, 820], clouds: .3, ground: ["#ad7f4e", "#a27748"], amp: 45, road: "#4f4642", walk: "#bfa88a", style: "colonial", lit: .3 },
  sossusvlei: { sky: ["#05071f", "#16205a", "#4a3a6e"], sun: [42, 120], sunC: "#aab6ff", sunI: 1.0, hs: ["#3a3a7a", .8], hg: ["#5a2c1c", .45], fog: [180, 1000], clouds: 0, stars: 1, night: 1, emis: 2.4, ground: ["#a2472a", "#943e24"], amp: 30, road: "#3a2c28", walk: "#7a4a34", style: "dunes", lit: .5 },
  ocean:      { sky: ["#3d82d5", "#97ccf2", "#dbeff8"], sun: [45, 90], sunC: "#fff6e6", sunI: 3.4, hs: ["#9fc6ec", .65], hg: ["#5a7a8a", .35], fog: [160, 950], clouds: .5, ground: ["#2b6f9e", "#2b6f9e"], amp: 0, road: "#4a4d53", walk: "#9aa2aa", style: "bridge", lit: 0, water: 1 },
  airport:    { sky: ["#3d5d91", "#a1b7d5", "#e5dbcc"], sun: [28, 230], sunC: "#fff0d8", sunI: 3.2, hs: ["#a8bcd8", .6], hg: ["#7a7a64", .35], fog: [140, 880], clouds: .5, ground: ["#788a5e", "#829468"], amp: 12, road: "#46484d", walk: "#b3b3ad", style: "airport", lit: .1 }
};
const lin = (c) => { c = hex(c); return [Math.pow(c[0], 2.2), Math.pow(c[1], 2.2), Math.pow(c[2], 2.2)]; };
const sunVec = (el, az) => { el *= Math.PI / 180; az *= Math.PI / 180; return [Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)]; };

function envOf(a) {
  return {
    sunDir: sunVec(...a.sun), sunCol: V3.sc(lin(a.sunC), a.sunI), sunGlow: hex(a.sunC), hemiSky: V3.sc(lin(a.hs[0]), a.hs[1]), hemiGnd: V3.sc(lin(a.hg[0]), a.hg[1]),
    skyTop: hex(a.sky[0]), skyMid: hex(a.sky[1]), skyHor: hex(a.sky[2]), fog: hex(a.sky[2]), fogN: a.fog[0], fogF: a.fog[1],
    clouds: a.clouds || 0, cloud: a.night ? [.2, .2, .3] : cmix(a.sky[2], "#ffffff", .6), stars: a.stars || 0, sunVis: a.night ? 0 : 1, moon: a.night ? 1 : 0,
    emis: a.emis || 1.6, expo: a.night ? 1.25 : 1.05
  };
}
function envMix(A, B, t) {
  if (t <= 0) return A; if (t >= 1) return B;
  const o = {}; for (const k in A) { const a = A[k], b = B[k]; o[k] = Array.isArray(a) ? V3.lerp(a, b, t) : a + (b - a) * t; }
  o.sunDir = V3.norm(o.sunDir); return o;
}

/* ---------- Chemins ---------- */
class Path {
  constructor(pts, closed) {
    // ré-échantillonnage tous les 1 m
    const acc = [0]; for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]));
    if (closed) acc.push(acc[acc.length - 1] + Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][2] - pts[pts.length - 1][2]));
    const P = closed ? [...pts, pts[0]] : pts, L = acc[acc.length - 1], n = Math.floor(L);
    this.len = closed ? L : L; this.closed = closed; this.x = new Float32Array(n + 1); this.z = new Float32Array(n + 1); this.y = new Float32Array(n + 1);
    let j = 0;
    for (let i = 0; i <= n; i++) { const s = Math.min(i, L); while (j < acc.length - 2 && acc[j + 1] < s) j++; const t = (s - acc[j]) / (acc[j + 1] - acc[j] || 1); this.x[i] = P[j][0] + (P[j + 1][0] - P[j][0]) * t; this.z[i] = P[j][2] + (P[j + 1][2] - P[j][2]) * t; this.y[i] = P[j][1] + (P[j + 1][1] - P[j][1]) * t; }
    this.n = n;
    this.tx = new Float32Array(n + 1); this.tz = new Float32Array(n + 1);
    for (let i = 0; i <= n; i++) { const a = closed ? (i - 3 + n) % n : Math.max(0, i - 3), b = closed ? (i + 3) % n : Math.min(n, i + 3); let tx = this.x[b] - this.x[a], tz = this.z[b] - this.z[a]; const l = Math.hypot(tx, tz) || 1; this.tx[i] = tx / l; this.tz[i] = tz / l; }
  }
  wrap(s) { return this.closed ? ((s % this.len) + this.len) % this.len : Math.max(0, Math.min(this.len - .001, s)); }
  at(s) {
    s = this.wrap(s); const i = Math.min(this.n - 1, Math.floor(s)), f = s - i, i2 = this.closed ? (i + 1) % (this.n + 1) : i + 1;
    const x = this.x[i] + (this.x[i2] - this.x[i]) * f, z = this.z[i] + (this.z[i2] - this.z[i]) * f, y = this.y[i] + (this.y[i2] - this.y[i]) * f;
    const j2 = Math.min(this.n, i + 1); let tx = this.tx[i] + (this.tx[j2] - this.tx[i]) * f, tz = this.tz[i] + (this.tz[j2] - this.tz[i]) * f; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    return { p: [x, y, z], t: [tx, 0, tz], r: [-tz, 0, tx] };
  }
}

/* ---------- Réseau : la boucle et les cinq rayons ---------- */
const NET = (() => {
  const CITY = 76, JUNC = 58, BRIDGE = 52;   // v6.12 : liaisons légèrement rallongées
  const sections = [];
  WORLDS.forEach((w, wi) => {
    const next = WORLDS[(wi + 1) % WORLDS.length];
    sections.push({ kind: "junction", wi, world: w, next, amb: "airport", len: JUNC });
    w.cities.forEach((c, ci) => sections.push({ kind: "city", wi, ci, world: w, city: c, amb: c.amb, len: CITY }));
    sections.push({ kind: "bridge", wi, world: w, next, amb: "ocean", len: BRIDGE });
  });
  const L0 = sections.reduce((a, s) => a + s.len, 0), R = L0 / (Math.PI * 2);
  const pts = [], N = 24000;
  for (let i = 0; i < N; i++) { const th = (i / N) * Math.PI * 2, r = R + 14 * Math.sin(th * 6) + 5 * Math.sin(th * 13 + 1) + 1.6 * Math.sin(th * 29 + 2); pts.push([Math.cos(th) * r, 0, Math.sin(th) * r]); }   // v6.13 : le hub (centre de la carte) est à droite de la route, les bretelles partent à droite
  const ring = new Path(pts, true), k = ring.len / L0;
  let acc = 0; sections.forEach((s) => { s.start = acc * k; s.len *= k; acc += s.len / k; s.end = s.start + s.len; });
  // relief de la route
  for (let i = 0; i <= ring.n; i++) {
    const s = i; const sec = sections.find((q) => s >= q.start && s < q.end) || sections[0], j = (s - sec.start) / sec.len;
    let y = 0; const a = AMB3[sec.amb];
    if (sec.kind === "city") y = (a.hilly ? 3.2 : .9) * Math.sin(Math.PI * j * 2) * Math.pow(Math.sin(Math.PI * j), 2);   // v6 : pente nulle aux extrémités
    if (sec.kind === "bridge") y = 4.2 * Math.pow(Math.sin(Math.PI * j), 2); // v6 : arc à pente nulle aux deux bouts (plus de « chute » à l'entrée d'un monde)
    ring.y[i] = y;
  }
  // rayons vers le hub
  const spokes = [], junctions = [];
  sections.filter((s) => s.kind === "junction").forEach((s) => {
    const sb = s.start + s.len * .55, f = ring.at(sb), inward = V3.norm([-f.p[0], 0, -f.p[2]]);
    const side = Math.sign(V3.cross(f.t, [0, 1, 0])[0] * inward[0] + V3.cross(f.t, [0, 1, 0])[2] * inward[2]) || 1; // +1 : le centre est à droite
    const P0 = f.p, P1 = V3.add(P0, V3.sc(f.t, 45)), P2 = V3.add(V3.add(P0, V3.sc(inward, 110)), V3.sc(f.t, 45)), P3 = V3.add(V3.add(P0, V3.sc(inward, 175)), V3.sc(f.t, 25));
    const bp = []; for (let i = 0; i <= 300; i++) { const t = i / 300, u = 1 - t; bp.push([0, 1, 2].map((c) => u * u * u * P0[c] + 3 * u * u * t * P1[c] + 3 * u * t * t * P2[c] + t * t * t * P3[c])); }
    bp.forEach((p) => (p[1] = 0));
    const path = new Path(bp, false);
    const spoke = { wi: s.wi, world: s.world, path, sb, side, junction: s };
    spokes.push(spoke); junctions.push({ wi: s.wi, sb, spoke, sec: s }); s.spoke = spoke; s.sb = sb;
  });
  const triggers = sections.filter((s) => s.kind === "city").map((s) => ({ s: s.start + s.len * .5, sec: s }));
  const HASH = new Map(), key = (x, z) => Math.floor(x / 20) + "," + Math.floor(z / 20);
  const addP = (x, z) => { const k = key(x, z); (HASH.get(k) || HASH.set(k, []).get(k)).push(x, z); };
  for (let i = 0; i <= ring.n; i += 2) addP(ring.x[i], ring.z[i]);
  spokes.forEach((sp) => { for (let i = 0; i <= sp.path.n; i += 2) addP(sp.path.x[i], sp.path.z[i]); });
  /* vrai si un objet de rayon rad posé en p ne touche aucune route */
  function clear(p, rad = .6) {
    const lim = (rad + 5.3) ** 2, cx = Math.floor(p[0] / 20), cz = Math.floor(p[2] / 20), rr = Math.ceil((rad + 6) / 20);
    for (let i = -rr; i <= rr; i++) for (let j = -rr; j <= rr; j++) { const a = HASH.get((cx + i) + "," + (cz + j)); if (!a) continue; for (let k = 0; k < a.length; k += 2) { const dx = a[k] - p[0], dz = a[k + 1] - p[2]; if (dx * dx + dz * dz < lim) return false; } }
    return true;
  }
  sections.forEach((s, i) => (s.index = i));
  function secAt(s) { s = ring.wrap(s); for (const q of sections) if (s >= q.start && s < q.end) return q; return sections[0]; }
  const inSide = spokes[0].side;
  return { ring, sections, spokes, junctions, triggers, secAt, R, clear, inSide };
})();

/* ---------- Terrain partagé : le sol et les objets utilisent la même hauteur ---------- */
const GM = { sapporo: MAT.snow, uluru: MAT.sand, sossusvlei: MAT.sand, windhoek: MAT.sand, lasvegas: MAT.sand, goldcoast: MAT.sand, miami: MAT.sand, losangeles: MAT.sand, newyork: MAT.paving, tokyo: MAT.paving };
function ambAt(path, s) { return path === NET.ring ? AMB3[NET.secAt(s).amb] : AMB3.airport; }
function terrH(x, s, a, path = NET.ring) {
  const ax = Math.abs(x); if (ax <= 4.5) return 0; if (ax <= 8.5) return .16;
  // côté intérieur de la boucle (vers le hub) et début des bretelles : sol plat, légèrement plus bas que les routes
  // v6.3 : côté hub, le sol de l'anneau redescend au niveau absolu des bretelles dès qu'on s'éloigne de la route (il recouvrait la route de l'aéroport dans les villes en relief)
  if (path === NET.ring && Math.sign(x) === NET.inSide) {
    const sec = NET.secAt(s), sp = sec.spoke || (sec.kind === "city" ? NET.spokes[sec.wi] : null); let h = -.12;
    if (sp) { const f = path.at(s); if (f.p[1] > .1) { const wx = f.p[0] + f.r[0] * x, wz = f.p[2] + f.r[2] * x, P = sp.path; let d = 1e9; for (let i = 0; i <= P.n; i += 4) { const q = (P.x[i] - wx) ** 2 + (P.z[i] - wz) ** 2; if (q < d) d = q; } d = Math.sqrt(d);
      if (d < 46) { const u = Math.min(1, Math.max(0, (d - 34) / 12)), k = 1 - u * u * (3 - 2 * u); h += (-.25 - f.p[1] - h) * k; } } }
    return h;
  }
  if (path !== NET.ring && s < path.len - 120) return -.12;
  if (a.sea && Math.sign(x) === a.sea && ax > 24) return -Math.min(3, (ax - 24) * .12);
  const t = Math.min(1, Math.max(0, (ax - 28) / 170)); const n = Math.sin(s * .011 + x * .013) * .6 + Math.sin(s * .029 - x * .021 + 2) * .4;
  return (a.amp || 0) * t * t * (.6 + .4 * n);
}
function groundAt(path, s, x) { const f = path.at(s); return f.p[1] + terrH(x, s, ambAt(path, s), path); }
function frameAt(path, s, x, y = 0, facing = "road") {
  const f = path.at(s), p = [f.p[0] + f.r[0] * x, groundAt(path, s, x) + y, f.p[2] + f.r[2] * x];
  let d = facing === "road" ? (x < 0 ? f.r : V3.sc(f.r, -1)) : facing === "back" ? V3.sc(f.t, -1) : f.t;
  return { p, ry: Math.atan2(d[0], d[2]), f };
}
/* Repère local : +z vers la route, +x le long de la rue (ou vers la gauche du véhicule pour un objet orienté) */
class Loc {
  constructor(mb, p, ry, s = 1, ao = true) { this.mb = mb; this.M = M4.trs(p[0], p[1], p[2], ry, 0, 0, s, s, s); this.ry = ry; this.p = p; this.ao = ao ? p[1] : null; mb.aoY = this.ao; }
  mt(m) { this.mb.mat = m; this.mb.aoY = this.ao; return this; }
  m(x, y, z, w, h, d, ry = 0, rx = 0, rz = 0) { return M4.mul(this.M, M4.trs(x, y, z, ry, rx, rz, w, h, d)); }
  box(x, y, z, w, h, d, col, e = 0, ry = 0, rx = 0, rz = 0, tX = 1, tZ = 1) { this.mb.aoY = this.ao; this.mb.box(this.m(x, y, z, w, h, d, ry, rx, rz), col, e, tX, tZ); }
  prism(x, y, z, w, h, d, col, ry = 0, e = 0) { this.mb.aoY = this.ao; this.mb.prism(this.m(x, y, z, w, h, d, ry), col, e); }
  pyr(x, y, z, w, h, d, col, ry = 0) { this.mb.aoY = this.ao; this.mb.pyramid(this.m(x, y, z, w, h, d, ry), col); }
  cyl(x, y, z, r, h, seg, col, e = 0, rTop = 1, rx = 0, rz = 0) { this.mb.aoY = this.ao; this.mb.cyl(this.m(x, y, z, r, h, r, 0, rx, rz), seg, col, e, rTop); }
  sph(x, y, z, rx, ry, rz, col, e = 0, ws = 14, hs = 10) { this.mb.aoY = this.ao; this.mb.sphere(this.m(x, y, z, rx, ry, rz), ws, hs, col, e); }
  quad(x, y, z, w, h, col, e = 0) { // panneau vertical face +z this.mb.aoY = this.ao;
    const a = tp(this.M, x - w / 2, y, z), b = tp(this.M, x + w / 2, y, z), c = tp(this.M, x + w / 2, y + h, z), d = tp(this.M, x - w / 2, y + h, z);
    this.mb.quad(a, b, c, d, col, e);
  }
  w(x, y, z) { return tp(this.M, x, y, z); }
  seg(a, b, r, col, seg = 6, rTop = 1) { this.mb.aoY = this.ao; segment(this.mb, this.w(...a), this.w(...b), r, col, seg, rTop); }
}
function segment(mb, a, b, r, col, seg = 6, rTop = 1, e = 0) {
  const d = V3.sub(b, a), L = Math.hypot(...d); if (L < 1e-4) return; const u = V3.sc(d, 1 / L);
  // base orthonormée telle que y local = u
  const ref = Math.abs(u[1]) < .9 ? [0, 1, 0] : [1, 0, 0]; const xA = V3.norm(V3.cross(ref, u)), zA = V3.cross(xA, u);
  const m = new Float32Array([xA[0] * r, xA[1] * r, xA[2] * r, 0, u[0] * L, u[1] * L, u[2] * L, 0, zA[0] * r, zA[1] * r, zA[2] * r, 0, a[0], a[1], a[2], 1]);
  mb.cyl(m, seg, col, e, rTop, false);
}
/* fenêtres sur une façade locale (face +z en z = zf) */
function windows(L, o) {
  const { x0, x1, y0, rows, rowH, cols, ww, wh, zf, r, lit, night, frame, glass = "#34404e", shut } = o;
  const cw = (x1 - x0) / cols, keep = L.mb.mat;
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const x = x0 + cw * (j + .5), y = y0 + i * rowH + (rowH - wh) / 2;
    if (frame) { L.mt(MAT.stone); L.quad(x, y - .14, zf + .01, ww + .34, wh + .28, frame); L.box(x, y - .2, zf, ww + .4, .12, .3, frame); }
    const on = r() < lit; L.mt(MAT.glass); L.quad(x, y, zf + .03, ww, wh, on ? (night ? pickR(r, ["#ffcf7a", "#ffe2a8", "#ffd48f", "#cfe0ff"]) : "#ffd99a") : cvar(glass, r, .15), on ? 1 : 0);
    L.mt(MAT.plain); if (ww > .8) L.quad(x, y, zf + .035, .06, wh, "#e8e4da");
    if (shut) { L.mt(MAT.wood); L.quad(x - ww / 2 - .28, y, zf + .02, .5, wh, shut); L.quad(x + ww / 2 + .28, y, zf + .02, .5, wh, shut); }
  }
  L.mt(keep);
}
const pickR = (r, a) => a[Math.floor(r() * a.length)];

/* ---------- Bâtiments ----------
   Chaque fonction reçoit un repère local L (façade en +z, base au sol),
   la largeur w (le long de la rue), la profondeur d, et r (aléatoire). */
const BLD = {
  haussmann(L, w, d, r, a) { L.mt(MAT.stone);
    const floors = 5, fh = 3.1, gh = 4.4, h = gh + floors * fh, stone = cvar("#d9ccb2", r, .05);
    L.box(0, 0, 0, w, gh, d, cvar("#cbbd9f", r, .04)); L.box(0, gh, 0, w, floors * fh, d, stone);
    L.quad(0, .3, d / 2 + .02, w * .82, 3.2, "#2a333b"); L.box(0, 3.6, d / 2 + .6, w * .86, .12, 1.4, pickR(r, ["#6b1f2a", "#1f4636", "#23365e", "#7a5228"]), 0, 0, -.25);
    windows(L, { x0: -w / 2 + .6, x1: w / 2 - .6, y0: gh, rows: floors, rowH: fh, cols: Math.max(2, Math.round(w / 3)), ww: 1.15, wh: 2.0, zf: d / 2, r, lit: a.lit, night: a.night, frame: "#e9e0cd" });
    [gh + fh * 1 + .1, gh + fh * 4 + .1].forEach((y) => { L.box(0, y, d / 2 + .35, w - .4, .1, .7, "#1d1f22"); L.box(0, y + .1, d / 2 + .68, w - .4, .9, .04, "#1d1f22"); });
    L.box(0, h - .05, 0, w + .5, .45, d + .5, "#e5dbc6");
    L.mt(MAT.roof); L.box(0, h + .4, 0, w, 3.6, d, "#56626d", 0, 0, 0, 0, .94, .55);
    for (let x = -w / 2 + 2; x < w / 2 - 1; x += 3.2) { L.box(x, h + 1.1, d * .3, 1, 1.6, 1, "#5e6a75"); L.prism(x, h + 2.7, d * .3, 1, .5, 1, "#4d5862", Math.PI / 2); }
    L.box(-w / 2 + 1.5, h + 3.2, -1, 1.1, 2.2, .7, "#9b6c58"); L.box(w / 2 - 1.8, h + 3, 0, 1.1, 2.4, .7, "#9b6c58");
    return h + 4;
  },
  bordeaux(L, w, d, r, a) { L.mt(MAT.stone);
    const floors = 3, fh = 3.6, gh = 4.2, h = gh + floors * fh, stone = cvar("#dcc597", r, .05);
    L.box(0, 0, 0, w, h, d, stone); L.box(0, gh - .3, 0, w + .2, .3, d + .2, shade3(stone, -.08));
    for (let x = -w / 2 + 2; x < w / 2 - 1; x += 3.4) { L.quad(x, .2, d / 2 + .02, 2.2, 3.1, "#30363c"); L.sph(x, 3.3, d / 2 + .01, 1.1, .5, .02, "#30363c", 0, 8, 3); }
    windows(L, { x0: -w / 2 + .6, x1: w / 2 - .6, y0: gh, rows: floors, rowH: fh, cols: Math.max(2, Math.round(w / 3.4)), ww: 1.25, wh: 2.4, zf: d / 2, r, lit: a.lit, night: a.night, frame: "#efe3c8" });
    L.box(0, gh + fh + .1, d / 2 + .4, w - 1, .12, .8, "#202224"); L.box(0, gh + fh + .2, d / 2 + .78, w - 1, .8, .04, "#202224");
    L.box(0, h, 0, w + .6, .5, d + .6, shade3(stone, .06));
    L.mt(MAT.roof); L.prism(0, h + .5, 0, w, 2.6, d * .9, "#59616b");
    return h + 3;
  },
  stucco(L, w, d, r, a) { L.mt(MAT.plain);
    const h = 4.5 + r() * 4.5, c = pickR(r, ["#efc6a6", "#e9d5b3", "#e3b1b4", "#c7dfd5", "#f1e3c4"]);
    L.box(0, 0, 0, w, h, d, c); L.box(0, h, 0, w + .3, .7, d + .3, shade3(c, -.08));
    L.quad(0, .4, d / 2 + .02, w * .7, 2.6, "#2b3742", r() < a.lit ? 1 : 0);
    L.box(0, 3.2, d / 2 + .7, w * .8, .1, 1.5, pickR(r, ["#1f5b6e", "#b9443b", "#2d2d33", "#e2a13a"]), 0, 0, -.3);
    if (h > 7) windows(L, { x0: -w / 2 + 1, x1: w / 2 - 1, y0: 4.2, rows: 1, rowH: 3.4, cols: Math.round(w / 3.5), ww: 1.8, wh: 1.4, zf: d / 2, r, lit: a.lit, night: a.night });
    return h + 1;
  },
  brownstone(L, w, d, r, a) { L.mt(MAT.brick);
    const floors = 4, fh = 3.3, h = floors * fh + 1.2, c = cvar(pickR(r, ["#7a4637", "#6e3f32", "#8a5240", "#5f3a30"]), r, .05);
    L.box(0, 0, 0, w, h, d, c);
    windows(L, { x0: -w / 2 + .8, x1: w / 2 - .8, y0: 1.6, rows: floors, rowH: fh, cols: 3, ww: 1.1, wh: 1.9, zf: d / 2, r, lit: a.lit + .1, night: a.night, frame: shade3(c, .25) });
    L.box(0, h, 0, w + .6, .7, d + .6, shade3(c, -.25));
    for (let i = 0; i < 6; i++) L.box(-w / 4, i * .28, d / 2 + 2.2 - i * .35, 2.2, .28, .7 + i * .0, shade3(c, .1));
    // escalier de secours
    for (let f = 1; f < floors; f++) { L.box(w / 4, f * fh + 1, d / 2 + .6, w * .4, .08, 1.2, "#1c1c1f"); L.box(w / 4, f * fh + 1.9, d / 2 + 1.18, w * .4, .05, .05, "#1c1c1f"); L.box(w / 4, f * fh + 1.0, d / 2 + .6, .06, 1.7, 1.2, "#1c1c1f", 0, .6); }
    return h + 1;
  },
  tower(L, w, d, r, a, hMin = 50, hMax = 140) {
    const h = hMin + r() * (hMax - hMin), glass = cvar(pickR(r, ["#5c7d9b", "#6c8ca6", "#4e6a84", "#7896ad"]), r, .06), slab = pickR(r, ["#cfd4d8", "#b9bec4", "#8f969d"]);
    L.box(0, -6, 0, w, 6, d, slab); L.mt(MAT.glass); L.box(0, 0, 0, w, h, d, glass); L.mt(MAT.metal);
    for (let y = 4; y < h; y += 3.6) { L.quad(0, y, d / 2 + .05, w, .5, slab); }
    for (let x = -w / 2; x <= w / 2 + .01; x += w / Math.round(w / 3)) L.quad(x, 0, d / 2 + .06, .18, h, slab);
    if (a.night || a.lit > .3) { const rr = r; for (let y = 4.6; y < h - 2; y += 3.6) for (let x = -w / 2 + 1.5; x < w / 2 - 1; x += 3) if (rr() < a.lit * .7) L.quad(x, y, d / 2 + .07, 2.4, 2.4, pickR(rr, ["#ffe0a6", "#d8e6ff", "#fff2cf"]), 1); }
    L.box(0, h, 0, w * .7, 3, d * .7, slab); if (r() < .4) L.cyl(0, h + 3, 0, .2, 12, 5, "#9aa0a6");
    L.mt(MAT.plain); return h + 3;
  },
  casino(L, w, d, r, a) { L.mt(MAT.plain);
    const h = 18 + r() * 30, body = pickR(r, ["#2a2036", "#30263f", "#3a2a2a", "#e8ddc8"]);
    const neon = pickR(r, ["#ff4fa0", "#4ff0ff", "#ffd84a", "#9b6bff", "#5dff9a"]), neon2 = pickR(r, ["#ff8a3d", "#4ff0ff", "#ff4fa0"]);
    L.box(0, 0, 0, w, h, d, body);
    windows(L, { x0: -w / 2 + 1, x1: w / 2 - 1, y0: 7, rows: Math.floor((h - 9) / 3), rowH: 3, cols: Math.round(w / 2.6), ww: 1.4, wh: 1.4, zf: d / 2, r, lit: .7, night: 1, glass: "#20182a" });
    [h - .4, 6.6].forEach((y) => L.quad(0, y, d / 2 + .1, w, .45, neon, 1));
    L.quad(-w / 2 + .2, 0, d / 2 + .1, .4, h, neon2, 1); L.quad(w / 2 - .2, 0, d / 2 + .1, .4, h, neon2, 1);
    L.box(0, 4.5, d / 2 + 2.5, w * .9, .5, 5, neon, 1); L.box(0, 0, d / 2 + 4.5, .5, 4.5, .5, "#ccc");
    for (let x = -w / 2 + 1; x < w / 2; x += 1.4) L.sph(x, 4.4, d / 2 + 5, .14, .14, .14, "#fff4c0", 1, 5, 4);
    return h;
  },
  artdeco(L, w, d, r, a) { L.mt(MAT.plain);   // v6.11 : hôtels Art déco de Collins Avenue
    const c = pickR(r, ["#f7c8d4", "#bfe8e0", "#fbe3a8", "#c9dcf7", "#f9d2b8", "#e6d4f5", "#fdfaf2"]), trim = "#ffffff", neon = pickR(r, ["#ff4fa0", "#19d3e0", "#ffb020", "#7a6cff"]), fl = 3 + Math.floor(r() * 3), h = 3.6 + fl * 3.1;
    L.box(0, 0, 0, w, h, d, c); L.box(0, h, 0, w + .3, .55, d + .3, trim); L.box(0, 0, d / 2 + .04, w, 3.5, .1, "#fbf6ee");
    for (let k = 1; k <= fl; k++) L.box(0, 3.4 + (k - 1) * 3.1, d / 2 + .4, w + .2, .16, .85, trim);
    windows(L, { x0: -w / 2 + 1.1, x1: w / 2 - 1.1, y0: 4.2, rows: fl, rowH: 3.1, cols: Math.max(2, Math.round(w / 2.6)), ww: 1.5, wh: 1.5, zf: d / 2 + .02, r, lit: .25, night: 0, glass: "#35586a" });
    L.box(0, 0, d / 2 + .3, 2.0, h + 3.2, .55, trim); [-.55, 0, .55].forEach((dx) => L.box(dx, 3.7, d / 2 + .6, .14, h - .6, .05, neon, 1)); L.box(0, h + 3.2, d / 2 + .3, 1.2, 1.4, .45, neon, 1);
    L.box(0, 3.15, d / 2 + 1.5, w * .62, .22, 2.6, trim); [-1, 1].forEach((k) => L.cyl(k * w * .28, 0, d / 2 + 2.6, .11, 3.15, 8, trim)); L.box(0, 3.37, d / 2 + 2.78, w * .62, .1, .06, neon, 1);
    L.quad(0, 0, d / 2 + .11, 2.2, 2.6, "#243a48"); [-1, 1].forEach((k) => { L.quad(k * (w / 2 - 2), .9, d / 2 + .11, 2.4, 1.9, "#3f6a7c"); L.box(k * (w / 2 - .4), 0, d / 2 - .4, .8, h, .8, shade3(c, -.08)); });
    return h; },
  victorian(L, w, d, r, a) { L.mt(MAT.wood);
    const c = cvar(pickR(r, ["#e7a5ac", "#a5c9e2", "#f1d58e", "#b6d7b1", "#d3b7e6", "#f0efe8"]), r, .04), trim = "#f6f2ea", h = 9.5;
    L.box(0, 0, 0, w, 1.4, d, shade3(c, -.15)); L.box(0, 1.4, 0, w, h - 1.4, d, c);
    L.box(-w * .2, 1.6, d / 2 + .5, w * .45, 6.6, 1.2, shade3(c, .08), 0, 0, 0, 0, .85, 1);
    windows(L, { x0: -w * .42, x1: w * .02, y0: 2, rows: 2, rowH: 3.2, cols: 2, ww: .9, wh: 1.9, zf: d / 2 + 1.12, r, lit: a.lit, night: a.night, frame: trim });
    windows(L, { x0: w * .1, x1: w * .45, y0: 5.3, rows: 1, rowH: 3.2, cols: 1, ww: 1, wh: 1.9, zf: d / 2, r, lit: a.lit, night: a.night, frame: trim });
    L.quad(w * .28, 1.4, d / 2 + .02, 1.1, 2.4, "#3a2a24"); for (let i = 0; i < 4; i++) L.box(w * .28, i * .35, d / 2 + 1.6 - i * .35, 1.6, .35, .7, "#efe9dc");
    L.box(0, h, 0, w + .3, .35, d + .3, trim);
    L.mt(MAT.roof); L.prism(0, h + .35, 0, d + .4, 4, w + .4, shade3(c, -.3), Math.PI / 2);
    return h + 4.5;
  },
  tokyo(L, w, d, r, a) { L.mt(MAT.plain);
    const h = 16 + r() * 40, c = cvar(pickR(r, ["#3a3c45", "#4a4c55", "#2e3038", "#5a5650"]), r, .08);
    L.box(0, 0, 0, w, h, d, c);
    for (let y = 4.5; y < h - 2; y += 3.2) { L.quad(0, y, d / 2 + .04, w - .6, 1.8, r() < a.lit ? pickR(r, ["#c9b48a", "#d8c08e", "#9fb0c8"]) : "#1f2229", r() < a.lit ? .75 : 0); L.quad(0, y + 1.9, d / 2 + .05, w, .25, shade3(c, .2)); }
    L.quad(0, .2, d / 2 + .05, w * .9, 3.4, pickR(r, ["#8f7a5e", "#5e7690", "#8a5f6a", "#6a8a7a"]), .35);
    const nc = ["#ff3d6e", "#3df2ff", "#ffe14d", "#a46bff", "#5dff9a", "#ff8a3d"];
    for (let i = 0; i < 2 + r() * 3; i++) { const sx = (r() - .5) * (w - 1.6), sy = 5 + r() * (h - 14), sh = 3 + r() * 7, col = pickR(r, nc); L.box(sx, sy, d / 2 + .8, .9, sh, 1.2, col, 1); }
    L.box(0, h, 0, w * .6, 2.2, d * .5, shade3(c, -.1)); if (r() < .5) L.box(w * .2, h + 2.2, 0, 2.6, 2.6, 2.6, "#888");
    return h + 3;
  },
  machiya(L, w, d, r, a) { L.mt(MAT.wood);
    const wood = cvar("#4a3324", r, .08), plaster = cvar("#e6dccb", r, .03), tile = "#3a3d44";
    L.box(0, 0, 0, w, 3.2, d, wood); L.box(0, 3.2, 0, w, 2.8, d - 1, plaster);
    for (let x = -w / 2 + .4; x < w / 2 - .2; x += .32) L.box(x, .3, d / 2 + .06, .06, 2.4, .08, "#2d1e14");
    L.quad(0, 3.7, d / 2 - .45, w * .6, 1.2, a.lit && r() < a.lit ? "#ffd59a" : "#cfc2ac", a.lit && r() < a.lit ? 1 : 0);
    L.box(0, 3.1, d / 2 + .4, w + .4, .3, 1.8, tile, 0, 0, -.35);
    L.mt(MAT.roof); L.prism(0, 6, -.5, w + .8, 2.2, d + 1.4, tile);
    L.box(0, 8.15, -.5, w + .8, .25, .4, "#2c2e33");
    if (r() < .3) { L.box(-w / 2 + 1, 2.2, d / 2 + .25, .7, .9, .1, "#e8e2d4"); }
    return 8.5;
  },
  osaka(L, w, d, r, a) {
    if (r() < .5) return BLD.tokyo(L, w, d, r, a);
    const h = BLD.machiya(L, w, d, r, a);
    for (let i = 0; i < 3; i++) L.sph(-w / 3 + i * w / 3, 2.6, d / 2 + .7, .35, .45, .35, "#e5483c", 1, 8, 6);
    L.quad(0, 1.6, d / 2 + .5, w * .45, 1.1, pickR(r, ["#283a6e", "#f2efe6", "#7a1f1f"]));
    return h;
  },
  nara(L, w, d, r, a) { return BLD.machiya(L, w, d, r, a); },
  snow(L, w, d, r, a) { L.mt(MAT.wood);
    const c = cvar(pickR(r, ["#7d5446", "#4f5f7e", "#9a4e3c", "#e6e0d2", "#5f7a6a"]), r, .05), h = 6.5;
    L.box(0, 0, 0, w, h, d, c);
    windows(L, { x0: -w / 2 + 1, x1: w / 2 - 1, y0: 1.2, rows: 2, rowH: 2.8, cols: Math.round(w / 3), ww: 1.3, wh: 1.3, zf: d / 2, r, lit: .7, night: 1, frame: "#f2f2f2" });
    L.mt(MAT.roof); L.prism(0, h, 0, w + 1, 4.2, d + 1.2, "#3e3a3a"); L.mt(MAT.snow); L.prism(0, h + .25, 0, w + 1.1, 4.2, d + 1.3, "#f5f8fb");
    L.box(0, 0, d / 2 + .8, w + .6, .5, 1.6, "#f5f8fb");
    return h + 4.5;
  },
  terrace(L, w, d, r, a) { L.mt(MAT.stone);
    const c = cvar(pickR(r, ["#e7dcc6", "#f1e7d3", "#d8c6ac", "#c99a7e", "#e9d9b8"]), r, .04), h = 7.4, iron = "#2a2c2e";
    L.box(0, 0, 0, w, h, d, c);
    windows(L, { x0: -w / 2 + .8, x1: w / 2 - .8, y0: .8, rows: 2, rowH: 3.4, cols: Math.max(2, Math.round(w / 3)), ww: 1.2, wh: 2.1, zf: d / 2, r, lit: a.lit, night: a.night, frame: "#f7f4ee" });
    L.box(0, 3.4, d / 2 + 1.1, w, .15, 2.2, "#efe9de"); L.box(0, h - .2, d / 2 + 1.1, w, .12, 2.4, pickR(r, ["#6b7d6a", "#8a3a32", "#3f5266"]), 0, -.08);
    for (let x = -w / 2 + .15; x <= w / 2; x += w / 4) L.box(x, 0, d / 2 + 2.1, .12, h - .2, .12, "#f2efe8");
    L.box(0, 3.55, d / 2 + 2.15, w, .9, .04, iron);
    L.box(0, h, 0, w + .2, .9, d + .2, shade3(c, -.1));
    return h + 1;
  },
  queenslander(L, w, d, r, a) { L.mt(MAT.wood);
    const c = pickR(r, ["#f4f2ec", "#e9efe6", "#f3ead8", "#dfe8ee"]), h0 = 2.4;
    for (let x = -w / 2 + .3; x <= w / 2; x += w / 4) for (const z of [-d / 2 + .3, d / 2 - .3]) L.box(x, 0, z, .3, h0, .3, "#8a7a68");
    L.box(0, h0, 0, w, 4, d, c);
    windows(L, { x0: -w / 2 + 1, x1: w / 2 - 1, y0: h0 + .7, rows: 1, rowH: 3, cols: 3, ww: 1.2, wh: 1.8, zf: d / 2, r, lit: a.lit, night: a.night, frame: "#ffffff", shut: pickR(r, ["#3d6e5a", "#8a4a3a", "#3a5a7a"]) });
    L.box(0, h0, d / 2 + 1.2, w, .15, 2.4, "#cbb79a"); L.box(0, h0 + .2, d / 2 + 2.35, w, .9, .06, "#ffffff");
    for (let i = 0; i < 6; i++) L.box(0, i * .4, d / 2 + 2.8 + i * .4 * 0 + (5 - i) * .4, 1.4, .4, .4, "#cbb79a");
    L.pyr(0, h0 + 4, 0, w + 3.2, 3.2, d + 5, pickR(r, ["#b9bec2", "#8c3a32", "#5d7a6a"]));
    return h0 + 7.5;
  },
  modern(L, w, d, r, a) { L.mt(MAT.plain);
    const white = "#f2f1ec", g = "#5f8db0";
    L.box(-w * .1, 0, 0, w * .8, 3.6, d, white); L.box(w * .1, 3.6, -1, w * .8, 3.4, d - 1, white);
    L.quad(-w * .1, .3, d / 2 + .02, w * .6, 3, g, r() < a.lit ? .6 : 0); L.quad(w * .1, 3.9, d / 2 - .98, w * .65, 2.7, g, r() < a.lit ? .6 : 0);
    L.box(w * .1, 7, -1, w * .9, .3, d + .6, "#d8d4cc"); L.box(-w * .45, 0, d / 2 + 2, w * .12, 1.2, 4, "#d8d4cc");
    return 7.5;
  },
  highrise(L, w, d, r, a) {
    const h = 50 + r() * 70, white = "#f3f2ee";
    L.mt(MAT.glass); L.box(0, 0, 0, w, h, d, "#6fa3c6"); L.mt(MAT.plain);
    for (let y = 3; y < h; y += 3) L.box(0, y, d / 2 + .6, w + .2, .22, 1.3, white);
    L.box(-w / 2 + .5, 0, 0, 1, h, d + 1.4, white); L.box(w / 2 - .5, 0, 0, 1, h, d + 1.4, white);
    L.box(0, h, 0, w * .5, 4, d * .5, white);
    return h + 4;
  },
  colonial(L, w, d, r, a) { L.mt(MAT.plain);
    const c = pickR(r, ["#ecc9a2", "#d9e2c9", "#f2dcb8", "#c9dce2", "#e9b9a2"]), h = 4.4;
    L.box(0, 0, 0, w, h, d, c);
    windows(L, { x0: -w / 2 + 1, x1: w / 2 - 1, y0: .8, rows: 1, rowH: 3, cols: Math.round(w / 3), ww: 1.1, wh: 1.7, zf: d / 2, r, lit: a.lit, night: a.night, frame: "#fbf6ec" });
    L.box(0, 3.4, d / 2 + 1.2, w, .1, 2.4, "#a6adb2", 0, -.12); for (let x = -w / 2 + .2; x <= w / 2; x += w / 3) L.box(x, 0, d / 2 + 2.3, .14, 3.4, .14, "#fbf6ec");
    L.pyr(0, h, 0, w + .6, 2.4, d + .6, "#a8b0b5");
    return h + 2.5;
  },
  terminal(L, w, d, r, a) {
    L.mt(MAT.glass); L.box(0, 0, 0, w, 12, d, "#7da4c4");
    for (let x = -w / 2 + 2; x < w / 2 - 1; x += 4) { L.quad(x, .2, d / 2 + .03, 3.7, 5.4, "#f3e6cc", .55); L.quad(x, 6.2, d / 2 + .03, 3.7, 5.4, "#bcd3e4", .15); }
    L.mt(MAT.metal); for (let x = -w / 2; x <= w / 2; x += 4) L.quad(x, 0, d / 2 + .05, .25, 12, "#e6eaee"); L.quad(0, 5.8, d / 2 + .05, w, .35, "#e6eaee");
    L.box(0, 12, 2, w + 8, .8, d + 10, "#eef0f2", 0, -.06); L.quad(0, 2, d / 2 + .06, w * .3, 2.4, "#ffffff", .3);
    return 14;
  }
};
function shade3(c, t) { c = hex(c); return t >= 0 ? cmix(c, "#ffffff", t) : cmix(c, "#000000", -t); }

/* ---------- Végétation et mobilier ---------- */
const PROP = {
  tree(L, x, z, r, s = 1, col = "#5d7a3e") { L.mt(MAT.wood).cyl(x, 0, z, .22 * s, 3.2 * s, 6, "#5a4636", 0, .7); const c = L.w(x, 3.6 * s, z); for (let i = 0; i < 5; i++) L.mb.foliage(c[0] + (r() - .5) * 2.4 * s, c[1] + (r() - .3) * 1.8 * s, c[2] + (r() - .5) * 2.4 * s, (1.3 + r() * .7) * s, col, r); },
  plane(L, x, z, r) { L.mt(MAT.wood).cyl(x, 0, z, .25, 4, 6, "#8f8774", 0, .75); const c = L.w(x, 5.6, z); for (let i = 0; i < 6; i++) L.mb.foliage(c[0] + (r() - .5) * 3.4, c[1] + (r() - .3) * 2.4, c[2] + (r() - .5) * 3.4, 1.6 + r() * .8, pickR(r, ["#5f7c3f", "#6b8845", "#56723a"]), r); },
  cherry(L, x, z, r) { L.mt(MAT.wood).cyl(x, 0, z, .2, 2.4, 6, "#4a3329", 0, .7); const c = L.w(x, 3.2, z); for (let i = 0; i < 6; i++) L.mb.foliage(c[0] + (r() - .5) * 3, c[1] + (r() - .3) * 1.6, c[2] + (r() - .5) * 3, 1.1 + r() * .6, pickR(r, ["#f2b6c8", "#e99ab2", "#f7cdd8"]), r, .8); },
  jacaranda(L, x, z, r) { L.mt(MAT.wood).cyl(x, 0, z, .22, 2.8, 6, "#4a3a32", 0, .7); const c = L.w(x, 3.8, z); for (let i = 0; i < 6; i++) L.mb.foliage(c[0] + (r() - .5) * 3.4, c[1] + (r() - .3) * 1.6, c[2] + (r() - .5) * 3.4, 1.3 + r() * .6, pickR(r, ["#9a78d6", "#8462c4", "#a98ae0"]), r, .8); },
  cypress(L, x, z, r) { L.mt(MAT.wood).cyl(x, 0, z, .15, 1, 5, "#4a3a2a"); const c = L.w(x, 4.6, z); L.mb.foliage(c[0], c[1], c[2], 1.1, "#2f4a35", r, 3.4); },
  pine(L, x, z, r, snow) { L.cyl(x, 0, z, .2, 1.4, 6, "#4a3a2a"); for (let i = 0; i < 4; i++) { L.mt(MAT.leaf).cyl(x, 1.2 + i * 1.5, z, 2.2 - i * .45, 2.2, 14, "#2f4f45", 0, 0); L.mt(MAT.snow); if (snow) L.cyl(x, 2.1 + i * 1.5, z, (2.2 - i * .45) * .55, 1.3, 8, "#f4f7fa", 0, 0); } },
  palm(L, x, z, r) {
    const lean = (r() - .5) * .25, H = 10 + r() * 3;   // v6.1 : palmes plus hautes et plus étroites (plus de « toit » sur la route) let px = x, py = 0; L.mt(MAT.wood);
    for (let i = 0; i < 8; i++) { const nx = px + lean * H / 8 * .35, ny = py + H / 8; L.seg([px, py, z], [nx, ny, z], .23 - i * .012, i % 2 ? "#8a7358" : "#7d6850", 9); px = nx; py = ny; }
    L.sph(px, py - .1, z, .45, .4, .45, "#6a5a3a"); L.mt(MAT.leaf);
    for (let k = 0; k < 11; k++) {
      const an = k / 11 * Math.PI * 2 + r() * .3, dx = Math.cos(an), dz = Math.sin(an), len = 2.7 + r() * .8, up = .5 + r() * .5, pts = [];
      for (let t = 0; t <= 1.001; t += .125) pts.push([px + dx * len * t, py + up * Math.sin(t * 2.2) - 2.2 * t * t, z + dz * len * t, .55 * Math.sin(Math.PI * Math.min(1, t * 1.15 + .05)) + .04]);
      const sx = -dz, sz = dx, col = cvar("#4a7a36", r, .12);
      for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; const A = (p, sgn) => L.w(p[0] + sx * p[3] * sgn, p[1] - p[3] * .35, p[2] + sz * p[3] * sgn);
        L.mb.aoY = null; L.mb.quad(A(a, -1), A(b, -1), L.w(b[0], b[1], b[2]), L.w(a[0], a[1], a[2]), col); L.mb.quad(L.w(a[0], a[1], a[2]), L.w(b[0], b[1], b[2]), A(b, 1), A(a, 1), shade3(col, -.08)); }
    }
  },
  gum(L, x, z, r) { L.mt(MAT.wood).seg([x, 0, z], [x + .3, 5, z], .3, "#e7e0d4", 6, .7); L.seg([x + .3, 5, z], [x - 1.5, 8, z + .5], .16, "#e7e0d4", 5); L.seg([x + .3, 5, z], [x + 2, 8.5, z - .4], .16, "#e7e0d4", 5); for (let i = 0; i < 5; i++) { const c = L.w(x + (r() - .5) * 4, 8 + r() * 2, z + (r() - .5) * 3); L.mb.foliage(c[0], c[1], c[2], 1.2 + r() * .6, "#6f8a5a", r, .6); } },
  quiver(L, x, z, r, night) { const col = night ? "#3a2a24" : "#c9b48a"; L.cyl(x, 0, z, .45, 2.4, 7, col, 0, .55); for (let i = 0; i < 6; i++) { const an = i / 6 * 6.28, e = [x + Math.cos(an) * 1.3, 3.6 + r() * .6, z + Math.sin(an) * 1.3]; L.seg([x, 2.3, z], e, .12, col, 4); const c = L.w(...e); L.mb.foliage(c[0], c[1] + .2, c[2], .55, night ? "#24302a" : "#7a8a5a", r, .7, 8, 6); } },
  acacia(L, x, z, r) { L.mt(MAT.wood).seg([x, 0, z], [x, 2.6, z], .22, "#4a3428", 6); L.seg([x, 2.6, z], [x - 2, 4.4, z], .14, "#4a3428", 5); L.seg([x, 2.6, z], [x + 2, 4.6, z], .14, "#4a3428", 5); const c = L.w(x, 4.8, z); for (let i = 0; i < 6; i++) L.mb.foliage(c[0] + (r() - .5) * 5, c[1], c[2] + (r() - .5) * 5, 1.4, "#56603a", r, .35); },
  deadtree(L, x, z, r) { const br = (a, dir, len, w, d) => { if (!d) return; const b = V3.add(a, V3.sc(dir, len)); L.seg(a, b, w, "#16100e", 5, .7); for (let i = 0; i < 2; i++) { const nd = V3.norm([dir[0] + (r() - .5) * 1.4, dir[1] + .1, dir[2] + (r() - .5) * 1.4]); br(b, nd, len * .68, w * .62, d - 1); } }; br([x, 0, z], [0, 1, 0], 2.4, .28, 5); },
  cactus(L, x, z, r) { const c = "#3b6a45"; L.cyl(x, 0, z, .35, 5, 8, c); L.sph(x, 5, z, .35, .35, .35, c); L.seg([x, 2.2, z], [x + 1.2, 2.2, z], .25, c); L.seg([x + 1.2, 2.2, z], [x + 1.2, 3.8, z], .25, c); L.seg([x, 2.8, z], [x - 1, 2.8, z], .22, c); L.seg([x - 1, 2.8, z], [x - 1, 4.2, z], .22, c); },
  spinifex(L, x, z, r) { const c = L.w(x, .3, z); L.mb.foliage(c[0], c[1], c[2], .9 + r() * .5, "#a89a4a", r, .45); },
  rock(L, x, z, r) { const c = L.w(x, .4, z); L.mb.blob(c[0], c[1], c[2], 1.4 + r() * 1.2, "#9a4a26", r, .6); },
  shrub(L, x, z, r, col) { if (typeof col !== "string") col = "#4f6a3a"; const c = L.w(x, .5, z); L.mb.foliage(c[0], c[1], c[2], .8 + r() * .4, col, r, .7); },
  lamp(L, x, z, r, a) { L.cyl(x, 0, z, .1, 5.2, 6, "#2a2d30"); L.box(x, 5.1, z + .7, .12, .12, 1.5, "#2a2d30"); L.box(x, 4.9, z + 1.4, .5, .25, .7, a.night || a.lit > .15 ? "#fff0c8" : "#d8d8d0", a.night || a.lit > .15 ? 1 : 0); },
  parisLamp(L, x, z, r, a) { L.cyl(x, 0, z, .14, .6, 8, "#1f3a2e"); L.cyl(x, .6, z, .07, 3.6, 6, "#1f3a2e"); L.box(x, 4.1, z, .55, .7, .55, a.lit > .1 ? "#ffe2a2" : "#e8e0c8", a.lit > .1 ? 1 : 0, 0, 0, 0, 1.3, 1.3); L.pyr(x, 4.8, z, .8, .4, .8, "#1f3a2e"); },
  lantern(L, x, z, r) { L.cyl(x, 0, z, .07, 3.2, 5, "#3a2a24"); L.box(x, 3.2, z, .05, .05, .8, "#3a2a24"); L.sph(x, 2.8, z + .4, .32, .42, .32, "#e5483c", 1, 8, 6); },
  stoneLantern(L, x, z, r) { const c = "#9a978e"; L.box(x, 0, z, .7, .3, .7, c); L.cyl(x, .3, z, .14, 1, 6, c); L.box(x, 1.3, z, .6, .5, .6, "#ffd28a", .6); L.pyr(x, 1.8, z, 1, .5, 1, c); },
  vending(L, x, z, r) { L.box(x, 0, z, 1, 1.9, .8, "#eef2f4"); L.quad(x, .8, z + .41, .8, .9, "#bfe6ff", 1); L.quad(x, .2, z + .41, .5, .3, "#2a2a2a"); },
  bench(L, x, z) { L.box(x, .42, z, 1.8, .08, .5, "#6a4a32"); L.box(x, .5, z - .25, 1.8, .45, .06, "#6a4a32"); L.box(x - .7, 0, z, .08, .45, .45, "#222"); L.box(x + .7, 0, z, .08, .45, .45, "#222"); },
  deer(L, x, z, r) { const c = "#a06e3e", f = r() < .5 ? 1 : -1; L.sph(x, .95, z, .55, .3, .25, c); [-.35, .35].forEach((dx) => [-.12, .12].forEach((dz) => L.cyl(x + dx, 0, z + dz, .05, .8, 4, c))); L.seg([x + f * .45, 1, z], [x + f * .65, 1.5, z], .1, c); L.sph(x + f * .75, 1.55, z, .18, .13, .12, c); L.seg([x + f * .7, 1.65, z], [x + f * .6, 1.95, z + .1], .03, "#5a4030", 3); },
  car(L, x, z, r, ry = 0, col) { col = col || pickR(r, ["#b8bec4", "#2a2d33", "#8a1f22", "#1f3a5e", "#e8e6e0", "#4a5a4a"]); const M = (dx, dy, dz, w, h, d, c, e = 0) => L.box(x + dx * Math.cos(ry), dy, z - dx * Math.sin(ry) + dz, w, h, d, c, e, ry); L.box(x, .35, z, 4.2, .75, 1.8, col, 0, ry); L.box(x, 1.1, z, 2.3, .65, 1.6, "#2b3540", 0, ry, 0, 0, .85, .9); [-1.3, 1.3].forEach((dx) => [-.85, .85].forEach((dz) => L.cyl(x + dx * Math.cos(ry), .33, z - dx * Math.sin(ry) + dz, .33, .25, 8, "#141414", 0, 1, Math.PI / 2))); },
  billboard(L, x, z, signs, txt, col) { L.cyl(x - 2.5, 0, z, .18, 6, 6, "#55585c"); L.cyl(x + 2.5, 0, z, .18, 6, 6, "#55585c"); L.box(x, 6, z - .1, 7.4, 3.6, .3, "#1c1c22"); signs.push({ L, x, y: 6.2, z: z + .07, w: 7, h: 3.2, lines: [txt], o: { bg: col, fg: "#14121c", font: "'Martian Mono', ui-monospace, monospace", size: .6 }, light: .25 }); },
  kangaroo(L, x, z, r) { if (typeof TPL !== "undefined" && TPL.kangourou) { stampTpl(L, "kangourou", x, 0, z, 0, .9 + r() * .3); return; }   /* v6.13 : animal modelé dans Blender (kit_faune.glb) */    // v6.7 : silhouette modelée en ellipsoïdes orientés (corps penché, cuisses, longue queue, museau, oreilles)
    const c = pickR(r, ["#b07a4a", "#a8703f", "#bb8656"]), d = "#7d5230", b = "#d9b98c", s = .95 + r() * .35;
    const E = (dx, y, dz, rx, ry, rz, tz, col, ws = 14, hs = 10) => { L.mb.aoY = L.ao; L.mb.sphere(L.m(x + dx * s, y * s, z + dz * s, rx * s, ry * s, rz * s, 0, 0, tz), ws, hs, col, 0); };
    const P = (dx, y, dz) => [x + dx * s, y * s, z + dz * s];
    L.mt(MAT.plain);
    E(-.16, .64, 0, .27, .31, .25, 0, c); E(.03, .96, 0, .2, .42, .19, -.6, c); E(.11, .9, 0, .14, .33, .15, -.6, b);
    E(.28, 1.37, 0, .085, .2, .085, -.4, c); E(.37, 1.57, 0, .105, .11, .095, 0, c); E(.48, 1.53, 0, .115, .062, .062, -.2, c); E(.585, 1.5, 0, .026, .024, .03, 0, "#2a1c14", 8, 6);
    [-1, 1].forEach((k) => { E(.33, 1.75, k * .07, .034, .115, .02, .12, d, 8, 6); E(.43, 1.6, k * .088, .017, .017, .012, 0, "#1a120c", 6, 5);
      E(-.1, .52, k * .2, .2, .28, .1, .5, c); L.seg(P(-.24, .38, k * .2), P(-.03, .1, k * .2), .05 * s, d, 10); E(.12, .055, k * .2, .23, .05, .065, 0, d, 12, 8);
      L.seg(P(.2, 1.16, k * .15), P(.3, .97, k * .14), .045 * s, c, 8); L.seg(P(.3, .97, k * .14), P(.4, .88, k * .13), .035 * s, d, 8); E(.42, .87, k * .13, .045, .04, .04, 0, d, 8, 6); });
    L.seg(P(-.3, .6, 0), P(-.75, .28, 0), .115 * s, c, 12, .7); L.seg(P(-.75, .28, 0), P(-1.2, .07, 0), .08 * s, c, 12, .4); E(-.75, .28, 0, .085, .085, .085, 0, c, 10, 8); },
  // v6.10
  morris(L, x, z) { L.mt(MAT.metal); L.cyl(x, 0, z, .55, .35, 14, "#1f3d2c"); L.cyl(x, .35, z, .5, 2.6, 14, "#2a5a3e"); L.cyl(x, 2.95, z, .62, .14, 14, "#1f3d2c"); L.sph(x, 3.1, z, .56, .5, .56, "#1f3d2c", 0, 14, 8); L.cyl(x, 3.5, z, .05, .35, 6, "#1f3d2c"); L.mt(MAT.plain); ["#e8d9a8", "#c8452f", "#e9e4d8", "#3a6fa8"].forEach((c, i) => { const an = i * 1.5708 + .4; L.box(x + Math.sin(an) * .5, .8, z + Math.cos(an) * .5, .55, 1.6, .03, c, .15, an); }); },
  barrel(L, x, z) { L.mt(MAT.wood); [[-.5, 0, 0], [.5, 0, 0], [0, .86, 0]].forEach(([dx, dy]) => { L.cyl(x + dx, dy, z, .36, .9, 12, "#7a5230"); L.sph(x + dx, dy + .45, z, .46, .4, .46, "#8a5e36", 0, 12, 6); [.14, .76].forEach((h) => L.cyl(x + dx, dy + h, z, .43, .05, 12, "#2c2c2e")); }); L.mt(MAT.plain); },
  trafficLight(L, x, z, sd) { L.mt(MAT.metal); L.cyl(x, 0, z, .07, 3.3, 8, "#2b2d31"); L.box(x, 2.5, z + .12, .3, .86, .24, "#17181b"); L.mt(MAT.plain); [["#ff3b30", 3.14, 0], ["#ffb020", 2.86, 0], ["#30d158", 2.58, 1]].forEach(([c, y, on]) => L.sph(x, y, z + .25, .09, .09, .04, on ? c : shade3(c, -.55), on, 8, 5)); },
  _E(L, x, z, s) { return (dx, y, dz, rx, ry, rz, tz, col, ws = 14, hs = 10) => { L.mb.aoY = L.ao; L.mb.sphere(L.m(x + dx * s, y * s, z + dz * s, rx * s, ry * s, rz * s, 0, 0, tz), ws, hs, col, 0); }; },
  elephant(L, x, z, r) { if (typeof TPL !== "undefined" && TPL.elephant) { stampTpl(L, "elephant", x, 0, z, 0, .85 + r() * .25); return; }   /* v6.13 : animal modelé dans Blender (kit_faune.glb) */  const s = .9 + r() * .25, E = PROP._E(L, x, z, s), P = (dx, y, dz) => [x + dx * s, y * s, z + dz * s], c = "#807a73", d = "#6c665f"; L.mt(MAT.plain);
    E(0, 1.85, 0, 1.55, 1.05, .95, 0, c, 18, 12); E(-.9, 1.75, 0, .95, .95, .9, 0, c); E(1.55, 2.25, 0, .72, .78, .66, -.25, c, 16, 10); E(1.75, 2.75, 0, .5, .32, .5, 0, c);
    [-1, 1].forEach((k) => { E(1.25, 2.3, k * .72, .1, .82, .62, .25, d, 12, 8); L.seg(P(2.0, 1.75, k * .26), P(2.55, 1.3, k * .34), .065 * s, "#efe8d8", 8, .4);
      [[.95, 0], [-1.0, 0]].forEach(([lx]) => { L.seg(P(lx, 1.5, k * .5), P(lx, 0, k * .5), .3 * s, d, 12, 1.05); L.cyl(x + lx * s, 0, z + k * .5 * s, .34 * s, .12 * s, 12, "#5a554f"); }); E(1.95, 2.42, k * .42, .05, .05, .03, 0, "#15110e", 6, 5); });
    L.seg(P(2.1, 2.1, 0), P(2.45, 1.2, 0), .24 * s, c, 12, .75); L.seg(P(2.45, 1.2, 0), P(2.4, .45, 0), .18 * s, c, 12, .7); L.seg(P(2.4, .45, 0), P(2.6, .25, 0), .125 * s, c, 10, .8); E(2.45, 1.2, 0, .24, .24, .24, 0, c, 10, 8);
    L.seg(P(-1.8, 2.0, 0), P(-2.0, 1.0, 0), .05 * s, d, 6); },
  giraffe(L, x, z, r) { if (typeof TPL !== "undefined" && TPL.girafe) { stampTpl(L, "girafe", x, 0, z, 0, .85 + r() * .25); return; }   /* v6.13 : animal modelé dans Blender (kit_faune.glb) */  const s = .9 + r() * .25, E = PROP._E(L, x, z, s), P = (dx, y, dz) => [x + dx * s, y * s, z + dz * s], c = "#e0b468", d = "#8a5226", b = "#f0dcae"; L.mt(MAT.plain);
    E(0, 2.45, 0, 1.0, .62, .5, .22, c, 16, 10); E(.55, 2.75, 0, .5, .6, .42, -.5, c);
    L.seg(P(.75, 2.8, 0), P(1.55, 4.75, 0), .26 * s, c, 12, .55); E(1.78, 4.92, 0, .4, .17, .16, -.35, c, 12, 8); E(2.1, 4.8, 0, .13, .11, .12, 0, b, 8, 6);
    [-1, 1].forEach((k) => { L.seg(P(1.6, 5.02, k * .08), P(1.57, 5.3, k * .09), .028 * s, d, 6); E(1.57, 5.32, k * .09, .045, .045, .045, 0, "#3a2414", 6, 5); E(1.5, 5.0, k * .2, .05, .1, .12, 0, c, 8, 6); E(1.9, 4.97, k * .14, .03, .03, .02, 0, "#15110e", 6, 5);
      [[.62, .12], [-.68, -.08]].forEach(([lx, lean]) => { L.seg(P(lx, 2.1, k * .3), P(lx + lean, 1.0, k * .3), .12 * s, c, 10, .65); L.seg(P(lx + lean, 1.0, k * .3), P(lx + lean, .12, k * .3), .075 * s, b, 10, .85); L.cyl(x + (lx + lean) * s, 0, z + k * .3 * s, .095 * s, .14 * s, 8, "#3a2a1c"); E(lx, 2.1, k * .3, .2, .34, .15, 0, c); });
      for (let i = 0; i < 9; i++) { const u = -.8 + r() * 1.6, v = r() * 2.4 - 1.2, cy = Math.cos(v) * .55, sz = Math.abs(Math.sin(v)) * .47 + .02; E(u * .9, 2.45 + u * .2 + cy * .5, k * sz, .13 + r() * .08, .12 + r() * .07, .03, 0, d, 8, 5); }
      for (let i = 0; i < 6; i++) { const t = .08 + i * .15; E(.75 + .8 * t, 2.8 + 1.95 * t, k * (.24 - .1 * t), .1, .13, .03, -.38, d, 8, 5); } });
    for (let i = 0; i < 7; i++) { const t = i / 7; E(.62 + .8 * t, 2.95 + 1.95 * t, 0, .05, .16, .03, -.38, d, 6, 5); }
    L.seg(P(-.95, 2.5, 0), P(-1.15, 1.5, 0), .03 * s, d, 6); E(-1.16, 1.42, 0, .05, .13, .05, 0, "#3a2414", 6, 5); },
  lion(L, x, z, r) { if (typeof TPL !== "undefined" && TPL.lion) { stampTpl(L, "lion", x, 0, z, 0, .95 + r() * .2); return; }   /* v6.13 : animal modelé dans Blender (kit_faune.glb) */  const s = .95 + r() * .2, E = PROP._E(L, x, z, s), P = (dx, y, dz) => [x + dx * s, y * s, z + dz * s], c = "#cfa55e", m = "#8a5a28", b = "#e6cf9a"; L.mt(MAT.plain);
    E(0, .86, 0, .78, .36, .3, 0, c, 16, 10); E(.5, .92, 0, .36, .4, .32, 0, c); E(-.55, .88, 0, .34, .36, .3, 0, c);
    E(.74, 1.1, 0, .34, .46, .44, -.2, m, 16, 10); E(.98, 1.18, 0, .25, .25, .23, 0, c, 14, 10); E(1.2, 1.1, 0, .14, .12, .13, 0, b, 10, 8); E(1.33, 1.13, 0, .04, .035, .05, 0, "#2a1a12", 6, 5);
    [-1, 1].forEach((k) => { E(.9, 1.42, k * .17, .07, .08, .04, 0, m, 8, 6); E(1.14, 1.24, k * .1, .028, .028, .02, 0, "#15110e", 6, 5);
      [[.5, .08], [-.55, -.06]].forEach(([lx, lean]) => { L.seg(P(lx, .8, k * .2), P(lx + lean, .08, k * .2), .095 * s, c, 10, .8); E(lx + lean + .05, .06, k * .2, .13, .06, .09, 0, c, 8, 6); }); });
    L.seg(P(-.85, .95, 0), P(-1.35, .75, 0), .04 * s, c, 8, .8); L.seg(P(-1.35, .75, 0), P(-1.55, 1.0, 0), .032 * s, c, 8); E(-1.56, 1.04, 0, .07, .09, .07, 0, m, 8, 6); },
  // v6.11
  crocodile(L, x, z, r) { if (typeof TPL !== "undefined" && TPL.crocodile) { stampTpl(L, "crocodile", x, 0, z, 0, .9 + r() * .5); return; }   /* v6.13 : animal modelé dans Blender (kit_faune.glb) */  const s = .9 + r() * .5, E = PROP._E(L, x, z, s), P = (dx, y, dz) => [x + dx * s, y * s, z + dz * s], c = pickR(r, ["#4f5f38", "#56633a", "#465532"]), b = "#9a9668", d = "#3a472a"; L.mt(MAT.plain);
    E(0, .27, 0, 1.15, .23, .36, 0, c, 16, 10); E(0, .17, 0, 1.05, .14, .3, 0, b, 12, 8); E(1.25, .27, 0, .5, .17, .26, 0, c); E(1.85, .22, 0, .5, .095, .16, 0, c, 12, 8); E(2.25, .22, 0, .14, .09, .15, 0, c, 8, 6);
    L.seg(P(-1.0, .26, 0), P(-2.0, .2, .25), .2 * s, c, 10, .55); L.seg(P(-2.0, .2, .25), P(-3.0, .1, .75), .11 * s, c, 10, .3); E(-2.0, .2, .25, .2, .2, .2, 0, c, 8, 6);
    [-1, 1].forEach((k) => { E(1.42, .43, k * .14, .07, .06, .06, 0, c, 8, 6); E(1.46, .45, k * .15, .03, .03, .03, 0, "#e8c020", 6, 5); E(2.28, .28, k * .07, .035, .03, .03, 0, d, 6, 5);
      [[.75, .25], [-.75, -.2]].forEach(([lx, sw]) => { L.seg(P(lx, .22, k * .3), P(lx + sw, .1, k * .62), .075 * s, c, 8, .8); E(lx + sw + .1, .05, k * .66, .14, .04, .1, 0, d, 8, 5); });
      for (let i = 0; i < 9; i++) E(-1.0 + i * .26, .48 - Math.abs(i - 4) * .012, k * .11, .07, .05, .05, 0, d, 6, 5);
      for (let i = 0; i < 6; i++) E(1.55 + i * .13, .2, k * (.15 - i * .004), .018, .035, .018, 0, "#f2ecd8", 5, 4); }); },
  flamingo(L, x, z, r) { if (typeof TPL !== "undefined" && TPL.flamant) { stampTpl(L, "flamant", x, 0, z, 0, .9 + r() * .3); return; }   /* v6.13 : animal modelé dans Blender (kit_faune.glb) */  const s = .9 + r() * .3, E = PROP._E(L, x, z, s), P = (dx, y, dz) => [x + dx * s, y * s, z + dz * s], c = pickR(r, ["#ff8fa8", "#ff7f9c", "#ffa0b4"]), d = "#f0607e"; L.mt(MAT.plain);
    E(0, 1.05, 0, .3, .19, .15, .12, c, 14, 10); E(-.26, 1.1, 0, .16, .09, .07, .5, d, 8, 6);
    L.seg(P(.22, 1.1, 0), P(.42, 1.42, 0), .045 * s, c, 8); L.seg(P(.42, 1.42, 0), P(.3, 1.75, 0), .04 * s, c, 8); L.seg(P(.3, 1.75, 0), P(.4, 1.95, 0), .037 * s, c, 8); [[.42, 1.42], [.3, 1.75]].forEach(([a, b]) => E(a, b, 0, .045, .045, .045, 0, c, 6, 5));
    E(.45, 1.99, 0, .075, .06, .055, 0, c, 8, 6); L.seg(P(.5, 1.98, 0), P(.6, 1.9, 0), .03 * s, "#f4e6d8", 6, .8); L.seg(P(.6, 1.9, 0), P(.62, 1.8, 0), .024 * s, "#1c1c1c", 6, .4); E(.47, 2.01, .05, .012, .012, .01, 0, "#111", 5, 4); E(.47, 2.01, -.05, .012, .012, .01, 0, "#111", 5, 4);
    L.seg(P(.02, .95, .05), P(.03, 0, .05), .018 * s, d, 5); if (r() < .5) { L.seg(P(-.02, .95, -.05), P(.16, .6, -.05), .018 * s, d, 5); L.seg(P(.16, .6, -.05), P(-.05, .45, -.05), .016 * s, d, 5); } else L.seg(P(-.02, .95, -.05), P(-.04, 0, -.05), .018 * s, d, 5); },
  parasol(L, x, z, r) { const c = pickR(r, ["#ff5a5f", "#19b5c8", "#ffc93c", "#ff8fb1", "#ffffff", "#3aa0ff"]); L.mt(MAT.plain); L.cyl(x, 0, z, .035, 2.1, 6, "#e8e4da"); L.cyl(x, 1.75, z, 1.35, .42, 12, c, 0, .05);
    [-.8, .8].forEach((dx) => { L.box(x + dx, .22, z + .9, .62, .07, 1.8, "#f4f1e8"); L.box(x + dx, .28, z + 1.55, .62, .07, .7, c, 0, 0, -.6); [[-.25, .2], [.25, .2], [-.25, 1.6], [.25, 1.6]].forEach(([a, b]) => L.box(x + dx + a, 0, z + b, .05, .22, .05, "#d8d4c8")); }); },
  lifeguard(L, x, z, r) { const c = pickR(r, ["#ff8fb1", "#19c8c0", "#ffd23a", "#ff7a3d", "#7a8cff"]), c2 = pickR(r, ["#fff6e8", "#ffe36a", "#bff0ea"]); L.mt(MAT.wood); [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => L.cyl(x + a * 1.1, 0, z + b * 1.1, .09, 1.7, 6, "#f2ece0"));
    L.box(x, 1.7, z, 3.2, .14, 3.2, c2); L.box(x, 1.84, z - .2, 2.4, 1.9, 2.2, c); L.box(x, 3.74, z - .2, 3.0, .16, 2.9, c2, 0, 0, .12); L.quad(x, 2.4, z + .91, 1.1, .9, "#2a3a48"); L.box(x - .6, 2.0, z + .92, .5, 1.3, .04, c2);
    [-1.55, 1.55].forEach((dx) => L.box(x + dx, 2.4, z + 1.0, .05, .05, 1.2, "#fff")); L.box(x, 2.4, z + 1.58, 3.1, .05, .05, "#fff"); for (let i = 0; i < 5; i++) L.box(x + 1.0, .28 + i * .3, z + 2.0 + (4 - i) * .32, .9, .06, .3, "#f2ece0"); L.mt(MAT.plain); },
  // v6.9 : mobilier urbain (détails de rue)
  bin(L, x, z) { L.mt(MAT.metal); L.cyl(x, 0, z, .26, .85, 10, "#2f4a3a"); L.cyl(x, .85, z, .29, .06, 10, "#1e2f26"); L.mt(MAT.plain); },
  planter(L, x, z, r) { L.mt(MAT.stone); L.box(x, 0, z, 1.5, .5, .55, "#b9b2a4"); L.mt(MAT.leaf); for (let i = 0; i < 4; i++) L.sph(x - .55 + i * .37, .62, z, .24, .2, .22, pickR(r, ["#4f7a3a", "#5d8a43", "#44703a"]), 0, 8, 6); L.mt(MAT.plain); for (let i = 0; i < 6; i++) L.sph(x - .6 + r() * 1.2, .74 + r() * .08, z + (r() - .5) * .3, .06, .06, .06, pickR(r, ["#e8506a", "#f4c542", "#f2f2f2", "#c86fd8"]), 0, 6, 4); },
  hydrant(L, x, z) { L.mt(MAT.metal); L.cyl(x, 0, z, .13, .55, 10, "#c8322a"); L.sph(x, .58, z, .14, .1, .14, "#c8322a", 0, 10, 6); L.box(x, .32, z, .42, .1, .1, "#a82a24"); L.mt(MAT.plain); },
  mailbox(L, x, z, col = "#2a4f9a") { L.mt(MAT.metal); L.box(x, .1, z, .5, 1.05, .46, col); L.cyl(x, 1.15, z - .23, .25, .46, 10, col, 0, 1, Math.PI / 2); L.box(x - .2, 0, z - .18, .06, .12, .06, "#222"); L.box(x + .2, 0, z + .18, .06, .12, .06, "#222"); L.mt(MAT.plain); },
  bollard(L, x, z) { L.mt(MAT.metal); L.cyl(x, 0, z, .08, .85, 8, "#2b2d31"); L.sph(x, .87, z, .1, .08, .1, "#2b2d31", 0, 8, 5); L.mt(MAT.plain); },
  bike(L, x, z, r) { const c = pickR(r, ["#c8322a", "#2a6fb8", "#2f8a55", "#e0a020", "#222"]); L.mt(MAT.metal); [-.5, .5].forEach((dx) => L.cyl(x + dx, .34, z - .02, .34, .04, 14, "#18181a", 0, 1, Math.PI / 2)); L.seg([x - .5, .34, z], [x - .1, .78, z], .025, c, 5); L.seg([x - .1, .78, z], [x + .38, .8, z], .025, c, 5); L.seg([x + .38, .8, z], [x + .5, .34, z], .025, c, 5); L.seg([x - .1, .78, z], [x + .05, .36, z], .025, c, 5); L.seg([x + .05, .36, z], [x - .5, .34, z], .02, c, 5); L.seg([x + .38, .8, z], [x + .36, 1.0, z], .02, "#333", 5); L.box(x + .36, 1.0, z, .06, .04, .5, "#222"); L.box(x - .12, .86, z, .26, .05, .12, "#2a1c14"); L.mt(MAT.plain); },
  terrace(L, x, z, r) { const col = pickR(r, ["#c8452f", "#2f6a4a", "#e8dcc0", "#2a4f7a"]); for (const dx of [-1.3, 1.3]) { L.mt(MAT.metal); L.cyl(x + dx, 0, z, .04, .72, 6, "#333"); L.cyl(x + dx, .72, z, .4, .04, 14, "#e9e4d8"); L.cyl(x + dx, 0, z, .22, .03, 10, "#333"); L.mt(MAT.wood); [-.62, .62].forEach((cz) => { L.box(x + dx, .42, z + cz, .4, .05, .4, "#7a5a3a"); L.box(x + dx, .45, z + cz + Math.sign(cz) * .19, .4, .42, .04, "#7a5a3a"); [-.17, .17].forEach((lx) => L.box(x + dx + lx, 0, z + cz, .04, .42, .04, "#3a2a1c")); }); }
    L.mt(MAT.metal); L.cyl(x, 0, z, .04, 2.3, 6, "#4a4a4a"); L.mt(MAT.plain); L.cyl(x, 2.05, z, 1.9, .5, 12, col, 0, .04); },
  person(L, x, z, r, ry) { const n = pickR(r, ["voyageur_a", "voyageuse_b", "voyageuse_c", "voyageur_d", "voyageuse_e"]); if (typeof TPL !== "undefined" && TPL[n]) stampTpl(L, n, x, 0, z, ry, 1); },
  kangSign(L, x, z, signs) { L.cyl(x, 0, z - .08, .05, 2.9, 6, "#8a8a8a"); signs.push({ L, x, y: 1.7, z: z, w: 1.6, h: 1.6, draw: "kangaroo", light: .25 }); }
};

/* ---------- Construction d'un tronçon ---------- */
function buildRingChunk(sec) {
  const a = AMB3[sec.amb], mb = new MB(), bg = new MB(), water = new MB(), signs = [], r = rng(hashStr(sec.amb + sec.index));
  const path = NET.ring, s0 = sec.start, s1 = sec.end;
  ribbon(mb, water, path, s0, s1, a, sec);
  const nextA = AMB3[NET.sections[(sec.index + 1) % NET.sections.length].amb];
  if (sec.kind === "city") buildCity(sec, a, mb, bg, signs, r);
  else if (sec.kind === "junction") buildJunction(sec, a, mb, bg, signs, r);
  else buildBridge(sec, a, mb, bg, water, signs, r);
  return { mb, bg, water, signs };
}
function ribbon(mb, water, path, s0, s1, a, sec, yOff = 0) {
  const key = sec.amb || "airport", gm = GM[key] ?? MAT.grass, bridge = sec.kind === "bridge", sea = a.sea || 0, rr = rng(hashStr("rb" + s0));
  const XS = [-260, -160, -100, -60, -35, -20, -12, -8.5, -8.5, -4.5, -4.5, 4.5, 4.5, 8.5, 8.5, 12, 20, 35, 60, 100, 160, 260];
  const WALK = new Set([8, 9, 12, 13]), ROAD = new Set([10, 11]);
  // bandes : sol · bordure · trottoir · bordure · chaussée · bordure · trottoir · bordure · sol
  const band = (j) => j <= 6 || j >= 14 ? (bridge ? -1 : gm) : (j === 8 || j === 12) ? MAT.paving : j === 10 ? MAT.asphalt : MAT.stone;
  // bretelle : on aplanit le trottoir du côté où part la route du hub
  const flat = (ss, x) => { if (sec.kind === "junction") { const d = ss - sec.sb; return d > -14 && d < 55 && Math.sign(x) === sec.spoke.side; } if (sec.kind === "spoke") return ss < 70; return false; };
  const rows = [], cols = [], wrows = []; let gTh = 0;
  const hubE = path.at(path.len - 1), hubX = hubE.p[0], hubZ = hubE.p[2];
  const SS = []; for (let ss = s0; ss < s1 - 1; ss += 3) SS.push(ss); SS.push(s1);   // v6.3 : la dernière rangée tombe exactement sur la fin du tronçon (plus de fente en travers de la route)
  for (const ss of SS) {
    const t = Math.min(ss, s1), f = path.at(t), row = [], col = [];
    XS.forEach((x, j) => {
      let y = f.p[1] + yOff, c;
      if (ROAD.has(j)) c = cvar(a.road, rr, .03);
      else if (WALK.has(j)) { y += flat(t, x) ? 0 : .16; c = flat(t, x) ? a.road : a.walk; }
      else { gTh = terrH(x, t, a, path); if (sec.kind === "junction" && flat(t, x)) gTh = Math.min(gTh, -.07);   /* v6.4 */ y += gTh - (Math.abs(x) > 8.6 ? .01 : 0); c = sea && Math.sign(x) === sea && Math.abs(x) > 11 ? "#e6d3a6" : cvar(a.ground[(j + Math.floor(t / 37)) % 2], rr, .04); }
      if (sec.kind === "spoke" && !ROAD.has(j)) { const q = Math.min(1, Math.max(0, (t - 30) / 45)); y -= .7 * (1 - q * q * (3 - 2 * q)); }   // v6.1 : au départ, trottoirs et sol de la bretelle passent sous ceux de la route annulaire (plus de plaques qui se croisent)
      const cap = sec.kind === "spoke" ? (t < path.len - 120 ? 22 : 200) : (Math.sign(x) === NET.inSide ? 100 : 999), xx0 = Math.sign(x) * Math.min(Math.abs(x), cap);
      let xx = xx0;
      // v6.3 : le sol des bretelles reste à l'intérieur de l'anneau (il recouvrait la route des villes : scooter « enfoncé »)
      if (sec.kind === "spoke" && Math.abs(xx) > 8.6 && Math.hypot(f.p[0] + f.r[0] * xx, f.p[2] + f.r[2] * xx) > 268) { let lo = 8.6, hi = Math.abs(xx); for (let q = 0; q < 12; q++) { const md = (lo + hi) / 2, sx = Math.sign(x) * md; if (Math.hypot(f.p[0] + f.r[0] * sx, f.p[2] + f.r[2] * sx) > 268) hi = md; else lo = md; } xx = Math.sign(x) * lo; }
      const wx = f.p[0] + f.r[0] * xx, wz = f.p[2] + f.r[2] * xx;
      // v6.2 : côté hub, le sol de l'anneau tend vers le vert de l'aéroport (plus de plaques de sable/terre au hub)
      if (sec.kind !== "spoke" && Math.sign(x) === NET.inSide && Math.abs(x) > 30 && !ROAD.has(j) && !WALK.has(j)) { const k = Math.min(1, (Math.abs(x) - 30) / 50), g = hex(AMB3.airport.ground[j % 2]), q = hex(c); c = [q[0] + (g[0] - q[0]) * k, q[1] + (g[1] - q[1]) * k, q[2] + (g[2] - q[2]) * k]; }
      // v6.2 : les collines du hub s'estompent avant d'atteindre l'anneau (elles formaient un « toit » au-dessus de la route)
      if (sec.kind === "spoke" && !ROAD.has(j) && !WALK.has(j) && gTh > -.12) { const dh = Math.hypot(wx - hubX, wz - hubZ), k = Math.min(1, Math.max(0, (dh - 70) / 90)), kk = k * k * (3 - 2 * k); y += (-.12 - gTh) * kk; }
      if (xx !== xx0) y = f.p[1] + yOff - .13;   // sol replié à la limite : à plat
      row.push([wx, y, wz]); col.push(c);
    });
    rows.push(row); cols.push(col);
    if (bridge) wrows.push((NET.inSide > 0 ? [-320, -120, 0, 60, 110] : [-110, -60, 0, 120, 320]).map((x) => [f.p[0] + f.r[0] * x, -6, f.p[2] + f.r[2] * x]));
    else if (sea) wrows.push([30, 80, 160, 320].map((x) => [f.p[0] + f.r[0] * x * sea, -.45, f.p[2] + f.r[2] * x * sea]));
  }
  const mats = XS.slice(0, -1).map((_, j) => { const m = band(j); return bridge && (j === 7 || j === 13) ? -1 : m; });
  mb.aoY = null; mb.grid(rows, cols, mats);
  if (wrows.length) { water.aoY = null; water.grid(wrows, wrows.map((r) => r.map(() => "#2f6f9c")), wrows[0].map(() => MAT.water)); }
  // marquage
  mb.mat = MAT.plain;
  // v6.4 : le marquage suit exactement les facettes de la chaussée (il disparaissait par morceaux sur les ponts et dans les descentes)
  mb.aoY = null;
  const rowY = (s) => { const k = Math.min(SS.length - 2, Math.max(0, Math.floor((s - s0) / 3))), a0 = SS[k], b0 = SS[k + 1], u = Math.min(1, Math.max(0, (s - a0) / (b0 - a0))); return path.at(a0).p[1] * (1 - u) + path.at(b0).p[1] * u; };
  const strip = (x, a0, b0, wd, col) => { a0 = Math.max(s0, a0); b0 = Math.min(s1, b0); if (b0 - a0 < .05) return; const cuts = [a0, ...SS.filter((q) => q > a0 + .01 && q < b0 - .01), b0];
    for (let i = 0; i < cuts.length - 1; i++) { const fa = path.at(cuts[i]), fb = path.at(cuts[i + 1]), ya = rowY(cuts[i]) + .035 + yOff, yb = rowY(cuts[i + 1]) + .035 + yOff, P = (f, xx, y) => [f.p[0] + f.r[0] * xx, y, f.p[2] + f.r[2] * xx];
      mb.quad(P(fa, x - wd / 2, ya), P(fa, x + wd / 2, ya), P(fb, x + wd / 2, yb), P(fb, x - wd / 2, yb), col, 0); } };
  // v6.14 : aux embranchements, les lignes de la bretelle ne commencent qu'une fois séparée de la route, et la ligne de rive s'interrompt devant la sortie (les traits se croisaient)
  const m0 = sec.kind === "spoke" ? s0 + 34 : s0;
  for (let ss = m0 + 2; ss < s1 - 2; ss += 9) strip(0, ss - 1.5, ss + 1.5, .14, "#e8e4da");
  [-4.15, 4.15].forEach((ex) => { if (sec.kind === "junction" && sec.spoke && Math.sign(ex) === Math.sign(sec.spoke.side)) { strip(ex, s0, sec.sb - 3, .12, "#d8d4ca"); strip(ex, sec.sb + 30, s1, .12, "#d8d4ca"); } else strip(ex, m0, s1, .12, "#d8d4ca"); });
  if (sec.kind === "junction" && sec.spoke) for (let ss = sec.sb - 3; ss < sec.sb + 30; ss += 3.2) strip(Math.sign(sec.spoke.side) * 4.15, ss, ss + 1.4, .12, "#d8d4ca");   // v6.43 : voie de sortie en pointillés (plus de trou dans la ligne de rive)
}
function lineQuad(mb, f, x, len, w, col, yOff = 0, e = 0) {
  mb.aoY = null;
  const y = f.p[1] + .03 + yOff, c = [f.p[0] + f.r[0] * x, y, f.p[2] + f.r[2] * x], t = V3.sc(f.t, len / 2), rr = V3.sc(f.r, w / 2);
  mb.quad(V3.sub(V3.sub(c, t), rr), V3.add(V3.sub(c, t), rr), V3.add(V3.add(c, t), rr), V3.sub(V3.add(c, t), rr), col, e);
}

/* ---------- Villes ---------- */
const STYLE_PROPS = {
  haussmann: { tree: "plane", lamp: "parisLamp", step: 13 }, bordeaux: { tree: "tree", lamp: "parisLamp", step: 16 }, stucco: { tree: "palm", lamp: "lamp", step: 14 },
  newyork: { tree: "tree", lamp: "lamp", step: 18 }, casino: { tree: "palm", lamp: "lamp", step: 15 }, victorian: { tree: "tree", lamp: "lamp", step: 16 },
  tokyo: { tree: null, lamp: "lantern", step: 9 }, machiya: { tree: "cherry", lamp: "stoneLantern", step: 11 }, osaka: { tree: null, lamp: "lantern", step: 7 }, nara: { tree: "tree", lamp: "stoneLantern", step: 14 },
  snow: { tree: "pine", lamp: "lamp", step: 14 }, sydney: { tree: "palm", lamp: "lamp", step: 15 }, melbourne: { tree: "tree", lamp: "lamp", step: 15 }, queenslander: { tree: "palm", lamp: "lamp", step: 14 },
  modern: { tree: "palm", lamp: "lamp", step: 15 }, artdeco: { tree: "palm", lamp: "lamp", step: 12 }, highrise: { tree: "palm", lamp: "lamp", step: 13 }, outback: { tree: "gum", lamp: null, step: 30 }, colonial: { tree: "quiver", lamp: "lamp", step: 18 }, dunes: { tree: "deadtree", lamp: null, step: 26 }
};
const STYLE_BLD = {
  haussmann: ["haussmann"], bordeaux: ["bordeaux"], stucco: ["stucco", "artdeco", "stucco", "modern"], newyork: ["tower", "brownstone", "tower", "brownstone"], casino: ["casino"], victorian: ["victorian"],
  tokyo: ["tokyo"], machiya: ["machiya"], osaka: ["osaka"], nara: ["nara"], snow: ["snow"], sydney: ["tower", "highrise", "tower", "terrace"], melbourne: ["terrace", "tower", "brownstone"],
  queenslander: ["queenslander"], modern: ["modern"], artdeco: ["artdeco"], highrise: ["highrise"], colonial: ["colonial"], outback: [], dunes: []
};
const BB = { losangeles: ["HTML5", "CSS", "JavaScript", "Angular", "Node.js", "Swift", "Kotlin", "Unity"], newyork: ["Java", "C#", "Python", "PHP", "Symfony", "MVC", "Twig"], lasvegas: ["SQL", "MySQL", "MongoDB", "Merise", "JOIN"], miami: ["Git", "GitHub", "GitLab", "Docker", "Scrum", "Figma", "IA ?"] };
const BBC = ["#ffd84a", "#7ff0d0", "#ffb0c8", "#b0d0ff", "#ffffff"];

function buildCity(sec, a, mb, bg, signs, r) {
  const n0 = mb.n, b0 = bg.n;
  const path = NET.ring, S0 = sec.start, S1 = sec.end, trig = S0 + sec.len * .5, sp = STYLE_PROPS[a.style] || {}, bl = STYLE_BLD[a.style] || [];
  const landmark = LANDMARK[sec.amb] || {};
  const blocked = (s, side) => (landmark.block || []).some(([b0, b1, sd]) => sd === side && s - S0 > b0 * sec.len && s - S0 < b1 * sec.len);
  // v6 : emplacements des panneaux de compétences, dégagés de tout bâtiment
  const bbS = (BB[sec.amb] || []).map((_, i, A) => [S0 + 22 + i * (sec.len - 36) / A.length, i % 2 ? 1 : -1]);   // v6.6 : premier panneau reculé (il était masqué par la fin de la ville précédente)
  // bâtiments
  if (bl.length) for (const side of [-1, 1]) {
    if (a.sea === side) continue;
    let s = S0 + 6 + r() * 4;
    while (s < S1 - 14) {
      const type = pickR(r, bl), tv = type !== "casino" && typeof tplBuilding === "function" ? tplBuilding(type, r) : null;   // v6.11 : casinos compacts (les modèles larges ne tenaient plus dans la ville)
      const w = tv ? tv.w : type === "victorian" ? 7.5 + r() * 2 : type === "tower" || type === "highrise" ? 18 + r() * 10 : type === "casino" ? 16 + r() * 6 : 11 + r() * 9, d = tv ? tv.d : type === "casino" ? 16 : 14 + r() * 4;
      const sMid = s + w / 2;
      if (Math.abs(sMid - trig) < 7 + w / 2 || blocked(sMid, side)) { s += 3; continue; }   // v6.11 : les panneaux ne chassent plus les immeubles (villes vides)
      const fr = frameAt(path, sMid, side * ((type === "casino" ? 12 : 9) + d / 2), 0);   // v6.4 : casinos reculés (marquises au-dessus de la route)
      if (!NET.clear(fr.p, Math.min(w, d) * .45)) { s += 6; continue; }
      const L = new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry);
      L.mt(MAT.stone); L.box(0, -3, 0, w, 3, d, shade3(a.walk, -.2));
      if (tv) stampTpl(L, tv.name, 0, 0, 0, 0, 1, a); else BLD[type](L, w, d, r, a);
      s += w + (type === "victorian" || type === "haussmann" || type === "bordeaux" || type === "brownstone" || type === "terrace" ? .05 : r() < .2 ? 4 + r() * 6 : .4);
    }
  }
  // arrière-plan : seconde rangée plus haute (silhouette urbaine)
  if (bl.length && !["machiya", "nara", "colonial", "queenslander", "modern", "snow", "stucco", "casino"].includes(a.style)) for (const side of [-1, 1]) {
    if (a.sea === side) continue;
    for (let s = S0; s < S1; s += 16 + r() * 14) {
      const fr = frameAt(path, s, side * (60 + r() * 80)); if (!NET.clear(fr.p, 30) || bbS.some(([q, sd]) => sd === side && Math.abs(q - s) < 40)) continue;
      const L = new Loc(bg, [fr.p[0], fr.p[1] - 2, fr.p[2]], fr.ry);
      BLD.tower(L, 18 + r() * 14, 18 + r() * 10, r, a, a.style === "haussmann" || a.style === "bordeaux" ? 14 : 30, a.style === "haussmann" || a.style === "bordeaux" ? 24 : 120);
    }
  }
  // trottoirs : arbres, lampadaires, mobilier
  for (const side of [-1, 1]) {
    for (let s = S0 + 4; s < S1 - 4; s += sp.step || 14) {
      if (Math.abs(s - trig) < 9 || bbS.some(([q, sd]) => sd === side && q - s > -3 && q - s < 12)) continue;   // v6.5 : rien devant les panneaux de compétences
      const fr = frameAt(path, s, side * 7.2), L = new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry);
      const k = Math.round((s - S0) / (sp.step || 14));
      if (!NET.clear(fr.p, .6)) continue;
      if (side === 1 && (s < S0 + 17 || s > S1 - 22)) continue;   // v6.3 : rien devant le panneau d'entrée de ville
      if (sp.tree && k % 2 === 0) { const T = sp.tree; T === "pine" ? PROP.pine(L, 0, 0, r, a.snow) : T === "quiver" ? PROP.quiver(L, 0, 0, r, a.night) : PROP[T](L, 0, 0, r); }
      else if (sp.lamp) PROP[sp.lamp](L, 0, 0, r, a);
      if (!bl.length) { // paysages ouverts
        for (let i = 0; i < 3; i++) { const fr2 = frameAt(path, s + r() * 10, side * (12 + r() * 60)); if (!NET.clear(fr2.p, 3) || (a.sea === side)) continue; const L2 = new Loc(mb, [fr2.p[0], fr2.p[1], fr2.p[2]], fr2.ry); const pick = a.style === "outback" ? pickR(r, ["spinifex", "spinifex", "rock", "gum", "shrub"]) : pickR(r, ["deadtree", "shrub", "quiver", "spinifex"]); PROP[pick](L2, 0, 0, r, a.night); }
      }
    }
  }
  // détails par style
  const extra = {
    bordeaux: () => {},   // v6.12 : rails gris retirés (ils ressemblaient à des traits parasites sur la chaussée)
    tokyo: () => vend(sec, mb, r), nara: () => deer(sec, mb, r), kyoto: () => {}, sapporo: () => {}, uluru: () => kang(sec, mb, signs, r), goldcoast: () => surf(sec, mb, r)
  };
  (extra[sec.amb] || extra[a.style] || (() => {}))();
  // v6.11 : panneaux de compétences en potence au-dessus du trottoir, devant les façades
  if (BB[sec.amb]) BB[sec.amb].forEach((txt, i) => { const s = S0 + 22 + i * (sec.len - 36) / BB[sec.amb].length; if (Math.abs(s - trig) < 9) return; const side = i % 2 ? 1 : -1, fr = frameAt(path, s, side * 8.7, 0, "back"), L = new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry), k = -side * (fr.ry, 1) * (side === 1 ? 1 : 1);
    const dx = (L.w(1, 0, 0)[0] - L.w(0, 0, 0)[0]) * path.at(s).r[0] + (L.w(1, 0, 0)[2] - L.w(0, 0, 0)[2]) * path.at(s).r[2], tw = -side * Math.sign(dx);   // sens « vers la route » dans le repère du panneau
    L.mt(MAT.metal); L.cyl(0, 0, 0, .13, 7.6, 8, "#3c4046"); L.box(tw * 2.2, 7.3, 0, 4.6, .14, .14, "#3c4046"); L.mt(MAT.plain); L.box(tw * 2.45, 4.75, -.09, 4.5, 2.5, .12, "#16181d");
    signs.push({ L, x: tw * 2.45, y: 4.85, z: .02, w: 4.3, h: 2.3, lines: [txt], o: { bg: BBC[i % BBC.length], fg: "#14121c", font: "'Martian Mono', ui-monospace, monospace", size: .5, fit: .82 }, light: .35 }); });
  // monument / arrière-plan propre à la ville
  landmark.build && landmark.build(sec, a, mb, bg, r, signs);
  // panneau d'entrée de ville
  townSign(sec, S0 + 4, sec.city.name.toUpperCase(), sec.world.id, mb, signs);
  // portique de la zone d'information
  infoGate(sec, trig, mb, signs);
  townDetails(sec, a, mb, bg, r, n0, b0, bl, bbS, trig);
}
/* v6.9 : de vraies petites villes — rues arrière bâties (2 rangées de plus), passage piéton, mobilier, terrasses, passants */
function townDetails(sec, a, mb, bg, r, n0, b0, bl, bbS, trig) {
  const path = NET.ring, S0 = sec.start, S1 = sec.end, wid = sec.world.id;
  // v6.10 : rues arrière retirées (tout est au premier plan)
  // 3. passage piéton avant le portique
  { mb.mat = MAT.plain; const f = path.at(trig - 13); for (let x = -3.9; x <= 3.9; x += .78) lineQuad(mb, f, x, 2.6, .42, "#e6e2d8", .02);
    [-1, 1].forEach((sd) => { const fr = frameAt(path, trig - 15, sd * 5.2, 0, "back"); PROP.trafficLight(new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry), 0, 0, sd); }); }
  // 4. mobilier et passants sur les trottoirs
  if (bl.length) for (const side of [-1, 1]) {
    let n = 0;
    for (let s = S0 + 7; s < S1 - 6; s += 5.5) {
      n++; if (Math.abs(s - trig) < 11 || (side === 1 && (s < S0 + 18 || s > S1 - 22)) || bbS.some(([q, sd]) => sd === side && Math.abs(q - s) < 6)) continue;
      const fr = frameAt(path, s, side * 6.1, 0), L = new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry); if (!NET.clear(fr.p, .5)) continue;
      const stp = (STYLE_PROPS[a.style] || {}).step || 14, dm = ((s - S0 - 4) % stp + stp) % stp; if (Math.min(dm, stp - dm) < 1.6) continue;   // pas sur un arbre ou un lampadaire
      const pick = r();
      if (a.sea === side) { if (pick < .4) PROP.bench(L, 0, 0, r); else if (pick < .6) PROP.bin(L, 0, 0); else if (pick < .8) PROP.planter(L, 0, 0, r); continue; }
      if (pick < .16) PROP.bench(L, 0, -.9, r);
      else if (pick < .28) PROP.bin(L, 0, -.3);
      else if (pick < .42) PROP.planter(L, 0, -1.3, r);
      else if (pick < .52) { if (sec.amb === "paris") PROP.morris(L, 0, -1.2); else if (sec.amb === "bordeaux") PROP.barrel(L, 0, -1.3); else PROP.planter(L, 0, -1.3, r); }
      else if (pick < .62) { PROP.bollard(L, -.8, 1.2); PROP.bollard(L, .8, 1.2); }
      else if (pick < .72) PROP.bin(L, 0, -.3);
      else if (pick < .8) { if (wid === "usa") PROP.hydrant(L, 0, 1.1); else if (wid === "japan") PROP.vending(L, 0, -1.6, r); else PROP.mailbox(L, 0, -1.2, wid === "france" ? "#e8b820" : wid === "australia" ? "#c8322a" : "#2a4f9a"); }
      else if (pick < .9 && (wid === "france" || wid === "australia" || a.style === "victorian")) PROP.terrace(L, 0, -1.0, r);
    }
  }
}
function carsAlong(sec, mb, r, n, col) { for (let i = 0; i < n; i++) { const s = sec.start + 20 + r() * (sec.len - 40); if (Math.abs(s - (sec.start + sec.len / 2)) < 18) continue; const side = r() < .5 ? -1 : 1; const fr = frameAt(NET.ring, s, side * 3.1, 0, "forward"); PROP.car(new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry + Math.PI / 2), 0, 0, r, 0, col && r() < .6 ? col : null); } }
function rails(sec, mb) { for (let s = sec.start; s < sec.end; s += 4) { const f = NET.ring.at(s); [-2.6, -1.2].forEach((x) => lineQuad(mb, f, x, 4, .1, "#8f9398")); } }
function tram(sec, mb, r, col = "#2f6a4a") { const s = sec.start + sec.len * .25, fr = frameAt(NET.ring, s, -1.9, 0, "forward"), L = new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry + Math.PI / 2); L.box(0, .3, 0, 24, 2.8, 2.5, col); L.box(0, 1.4, 0, 23.6, 1.1, 2.56, "#2a3440"); L.box(0, .3, 0, 24.1, .4, 2.55, "#f2c230"); L.box(0, 3.1, 0, 3, .3, .6, "#333"); }
function vend(sec, mb, r) { for (let i = 0; i < 8; i++) { const s = sec.start + 10 + i * sec.len / 8, side = i % 2 ? 1 : -1; if (Math.abs(s - sec.start - sec.len / 2) < 10) continue; const fr = frameAt(NET.ring, s, side * 8, 0); PROP.vending(new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry), 0, 0, r); } }
function deer(sec, mb, r) { for (let i = 0; i < 10; i++) { const s = sec.start + 15 + r() * (sec.len - 30), side = r() < .5 ? -1 : 1; const fr = frameAt(NET.ring, s, side * (6 + r() * 2.5)); PROP.deer(new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry + r() * 6), 0, 0, r); } }
function kang(sec, mb, signs, r) { for (let i = 0; i < 12; i++) { const s = sec.start + 8 + r() * (sec.len - 16), side = r() < .6 ? -1 : 1, fr = frameAt(NET.ring, s, side * (10 + r() * 22)); if (!NET.clear(fr.p, 1)) continue; PROP.kangaroo(new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry + r() * 6.3), 0, 0, r); } [.2, .7].forEach((t) => { const fr = frameAt(NET.ring, sec.start + sec.len * t, 6.5, 0, "back"); PROP.kangSign(new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry), 0, 0, signs); }); }
function surf(sec, mb, r) { for (let i = 0; i < 3; i++) { const fr = frameAt(NET.ring, sec.start + sec.len * (.2 + i * .28), -15 * NET.inSide, 0);   /* v6.5 : les planches débordaient jusqu'à Uluru */ const L = new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry); ["#ff8a3d", "#3dc7ff", "#ffd84a"].forEach((c, k) => L.sph(-.8 + k * .8, 1.1, 0, .28, 1.1, .06, c, 0, 8, 6)); } }

function townSign(sec, s, text, wid, mb, signs) {
  const fr = frameAt(NET.ring, s, 7.2, 0, "back"), L = new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry);
  const st = { france: { bg: "#ffffff", fg: "#141414", border: "#c8312f" }, usa: { bg: "#1f6a44", fg: "#fff", border: "#fff" }, japan: { bg: "#1d58b5", fg: "#fff", border: "#fff" }, australia: { bg: "#1f6a44", fg: "#fff", border: "#fff" }, namibia: { bg: "#6b3a22", fg: "#fff", border: "#f2e2c8" } }[wid];
  // v6.3 : poteaux derrière le panneau, dos gris, texte toujours à l'intérieur du liseré
  L.cyl(-1.1, 0, -.2, .06, 3.0, 6, "#8a8a8a"); L.cyl(1.1, 0, -.2, .06, 3.0, 6, "#8a8a8a"); L.box(0, 2.2, -.13, 3.24, 1.14, .06, "#7d8288");
  signs.push({ L, x: 0, y: 2.22, z: -.04, w: 3.2, h: 1.1, lines: [text], o: { ...st, w: 768, h: 256, size: .5, fit: .74, round: 18 }, light: .3 });
}
function infoGate(sec, s, mb, signs) {
  const acc = sec.world.accent, fr = frameAt(NET.ring, s, 0, 0, "back"), L = new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry);
  [-6.2, 6.2].forEach((x) => { L.box(x, 0, 0, .5, 6.6, .5, "#1d2028"); L.box(x, .4, 0, .54, 5.6, .1, acc, 1); });
  L.box(0, 6.3, 0, 13, 1.7, .5, "#14161d");
  const f = NET.ring.at(s); // pad lumineux au sol
  // v6.2 : les deux barres lumineuses en travers de la chaussée sont supprimées (elles ressemblaient à des fissures)
  const T = { fr: `${sec.city.name.toUpperCase()} · ${sec.world.label.fr.toUpperCase()}`, en: `${sec.city.name.toUpperCase()} · ${sec.world.label.en.toUpperCase()}` };
  signs.push({ L, x: 0, y: 6.42, z: .27, w: 12.6, h: 1.45, linesObj: T, o: { bg: acc, fg: "#101218", w: 1536, h: 176, size: .62, font: "'Martian Mono', ui-monospace, monospace" }, light: .9 });
  signs.push({ L, x: 0, y: 6.42, z: -.27, w: 12.6, h: 1.45, linesObj: T, o: { bg: acc, fg: "#101218", w: 1536, h: 176, size: .62, font: "'Martian Mono', ui-monospace, monospace" }, light: .9, back: true });
}

/* ---------- Bifurcation et ponts ---------- */
function buildJunction(sec, a, mb, bg, signs, r) {
  const path = NET.ring, sb = sec.sb, side = sec.spoke.side, w = sec.world;
  // portique de signalisation
  const g = sb - 22, fr = frameAt(path, g, 0, 0, "back"), L = new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry);
  [-7.5, 7.5].forEach((x) => L.box(x, 0, 0, .4, 7.4, .4, "#8a8f96")); L.box(0, 7, 0, 15.4, .4, .4, "#8a8f96");
  const hubX = side * 3.6, nxtX = -side * 3.6; // en face « back », +x local = droite du conducteur
  L.box(hubX, 5.1, -.15, 6.8, 2.2, .12, "#0e3f8a"); L.box(nxtX, 5.1, -.15, 6.8, 2.2, .12, "#1f6a44");
  const arrow = side > 0 ? "→" : "←";
  signs.push({ L, x: hubX, y: 5.15, z: -.07, w: 6.6, h: 2.1, linesObj: { fr: [`✈ HUB CENTRAL ${arrow}`, "Correspondances · Accueil"], en: [`✈ CENTRAL HUB ${arrow}`, "Connections · Home"] }, o: { bg: "#0e3f8a", fg: "#fff", w: 1024, h: 330, size: .5, border: "#ffffff", bw: 8 }, light: .2 });
  signs.push({ L, x: nxtX, y: 5.15, z: -.07, w: 6.6, h: 2.1, linesObj: { fr: [`${w.country.fr.toUpperCase()} ↑`, w.cities.map((c) => c.name).join(" · ")], en: [`${w.country.en.toUpperCase()} ↑`, w.cities.map((c) => c.name).join(" · ")] }, o: { bg: "#1f6a44", fg: "#fff", w: 1024, h: 330, size: .5, border: "#ffffff", bw: 8 }, light: .2 });
  // arche de bienvenue
  const wa = frameAt(path, sec.end - 1.5, 0, 0, "back")   /* v6.3 : après la séparation, la bretelle ne traverse plus un pilier */, WL = new Loc(mb, [wa.p[0], wa.p[1], wa.p[2]], wa.ry);
  [-6.4, 6.4].forEach((x) => WL.box(x, 0, 0, .6, 7, .6, "#1d2028")); WL.box(0, 6.4, 0, 13.4, 1.6, .5, "#14161d");
  signs.push({ L: WL, x: 0, y: 6.5, z: .27, w: 13, h: 1.4, linesObj: { fr: `BIENVENUE · ${w.country.fr.toUpperCase()} · ${w.label.fr.toUpperCase()}`, en: `WELCOME · ${w.country.en.toUpperCase()} · ${w.label.en.toUpperCase()}` }, o: { bg: w.accent, fg: "#101218", w: 1536, h: 166, size: .6, font: "'Martian Mono', ui-monospace, monospace" }, light: .8 });
  // v6.43 : balises blanches sur l'îlot entre la route et la bretelle, et chevrons au sol à la séparation
  { const sp = sec.spoke.path; for (let d = 34; d < 96; d += 6) { const f = NET.ring.at(sec.sb + d), q = sp.at(d), lat = ((q.p[0] - f.p[0]) * f.r[0] + (q.p[2] - f.p[2]) * f.r[2]) * side;
      if (lat < 10.8 || sec.sb + d > sec.end - 3) continue; const fm = frameAt(path, sec.sb + d, side * (lat / 2), 0, "back"), Lm = new Loc(mb, [fm.p[0], fm.p[1] + .02, fm.p[2]], fm.ry);
      Lm.mt(MAT.plain); Lm.cyl(0, 0, 0, .07, 1.05, 8, "#f2f2ee"); Lm.cyl(0, .62, 0, .075, .14, 8, "#d8432f"); Lm.cyl(0, .8, 0, .075, .14, 8, "#f2f2ee"); } }
  // décor aéroportuaire, côté opposé à la bretelle
  for (let s = sec.start + 6; s < sec.end; s += 16) [-1, 1].forEach((sd) => { const f2 = frameAt(path, s, sd * 7.2); if (!NET.clear(f2.p, .6)) return; /* v6.53 : pas de lampadaire dans la voie de la bretelle */ PROP.lamp(new Loc(mb, [f2.p[0], f2.p[1], f2.p[2]], f2.ry), 0, 0, r, a); });
  // v6.13 : plus de faux terminal ni de tour de contrôle côté opposé (on croyait l'aéroport à gauche) ; le seul aéroport est le hub, au bout de la bretelle
  for (let k = 0; k < 6; k++) { const f3 = frameAt(path, sec.start + 5 + k * 9, -side * (13 + (k % 3) * 7)); if (NET.clear(f3.p, 2)) PROP.tree(new Loc(mb, [f3.p[0], f3.p[1], f3.p[2]], f3.ry), 0, 0, r, a); }
}
function buildBridge(sec, a, mb, bg, water, signs, r) {
  /* v5 : pont à haubans continu — tablier lissé qui suit la route, haubans ancrés sur le tablier */
  const path = NET.ring, S0 = sec.start, S1 = sec.end, E = 8.6, WAT = -6;
  const at = (s, x, dy = 0) => { const f = path.at(s); return [f.p[0] + f.r[0] * x, f.p[1] + dy, f.p[2] + f.r[2] * x]; };
  mb.aoY = null; mb.mat = MAT.stone;
  for (let s = S0; s < S1 - .01; s += 2) {
    const s2 = Math.min(S1, s + 2);
    [-1, 1].forEach((sd) => { // flancs du tablier
      const a0 = at(s, sd * E, .16), a1 = at(s2, sd * E, .16), b0 = at(s, sd * E, -1.35), b1 = at(s2, sd * E, -1.35);
      if (sd > 0) mb.quad(b0, b1, a1, a0, "#a9b1ba"); else mb.quad(b1, b0, a0, a1, "#a9b1ba");
      // garde-corps : lisse continue + panneau vitré
      const t0 = at(s, sd * (E - .15), 1.25), t1 = at(s2, sd * (E - .15), 1.25);
      segment(mb, t0, t1, .06, "#7f8891", 6);
      const g0 = at(s, sd * (E - .15), .2), g1 = at(s2, sd * (E - .15), .2);
      mb.mat = MAT.glass; if (sd > 0) mb.quad(g0, g1, t1, t0, "#9fc3d8"); else mb.quad(g1, g0, t0, t1, "#9fc3d8"); mb.mat = MAT.stone;
    });
    const u0 = at(s, -E, -1.35), u1 = at(s, E, -1.35), u2 = at(s2, E, -1.35), u3 = at(s2, -E, -1.35);
    mb.quad(u0, u3, u2, u1, "#8f979f"); // sous-face
  }
  mb.mat = MAT.metal;
  for (let s = S0 + 1; s < S1; s += 3) [-1, 1].forEach((sd) => { const p0 = at(s, sd * (E - .15), .16), p1 = at(s, sd * (E - .15), 1.25); segment(mb, p0, p1, .045, "#7f8891", 5); });
  // piles : verticales, du fond de l'eau au dessous du tablier
  mb.mat = MAT.stone;
  for (let s = S0 + 10; s < S1 - 6; s += 18) { const f = path.at(s); if (f.p[1] < 1.2) continue; [-5, 5].forEach((x) => { const top = at(s, x, -1.35), bot = [top[0], WAT - 1, top[2]]; segment(mb, bot, top, .9, "#9aa3ad", 10); }); }
  // pylône central en H et haubans en éventail
  const sc = S0 + sec.len * .5, fc = path.at(sc), yaw = Math.atan2(fc.t[0], fc.t[2]), H = 34;
  const L = new Loc(mb, [fc.p[0], 0, fc.p[2]], yaw); mb.mat = MAT.metal;
  [-1, 1].forEach((sd) => { const b0 = at(sc, sd * 10.4, 0), top = at(sc, sd * 9.4, H); b0[1] = WAT - 1; segment(mb, b0, top, 1.05, "#d9553b", 10, .78); });
  [fc.p[1] - 1.6, fc.p[1] + H * .55, fc.p[1] + H - 1].forEach((y) => { const p0 = at(sc, -10.2, 0), p1 = at(sc, 10.2, 0); p0[1] = p1[1] = y; segment(mb, p0, p1, .55, "#c9452f", 8); });
  mb.mat = MAT.plain;
  [-1, 1].forEach((sd) => [-1, 1].forEach((dir) => { for (let k = 1; k <= 6; k++) { const ds = dir * k * (sec.len * .45 / 6), anc = at(sc, sd * 9.5, H - 3 - k * 1.6), deck = at(sc + ds, sd * (E - .35), .4); segment(mb, anc, deck, .07, "#e4e8ec", 4); } }));
  // panneau de direction
  // v6.4 : panneau posé contre le garde-corps, poteaux derrière, dos plein
  const fr = frameAt(path, S0 + 12, 7.0, 0, "back"), P = new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry);
  P.cyl(-1.25, 0, -.2, .07, 3.9, 6, "#7d8288"); P.cyl(1.25, 0, -.2, .07, 3.9, 6, "#7d8288"); P.box(0, 2.58, -.12, 3.84, 1.34, .06, "#17503a");
  signs.push({ L: P, x: 0, y: 2.6, z: -.02, w: 3.8, h: 1.3, linesObj: { fr: [`→ ${sec.next.country.fr.toUpperCase()}`, sec.next.label.fr], en: [`→ ${sec.next.country.en.toUpperCase()}`, sec.next.label.en] }, o: { bg: "#1f6a44", fg: "#fff", w: 768, h: 264, size: .5, border: "#fff", bw: 6 }, light: .15 });
  // bateaux au loin
  for (let i = 0; i < 4; i++) { const f = frameAt(path, S0 + r() * sec.len, (r() < .5 ? -1 : 1) * (80 + r() * 160)); const B = new Loc(mb, [f.p[0], -5.6, f.p[2]], r() * 6); B.box(0, 0, 0, 14, 1.4, 4, "#f2f2f0", 0, 0, 0, 0, .9, .8); B.box(-2, 1.4, 0, 6, 1.6, 3, "#e6e8ea"); }
}
function controlTower(L) { L.cyl(0, 0, 0, 2.2, 26, 12, "#d8dade", 0, .75); L.cyl(0, 26, 0, 4.2, 4, 12, "#3b5a78", .2, 1.1); L.cyl(0, 30, 0, 4.6, .6, 12, "#e8eaec"); L.cyl(0, 30.6, 0, .15, 5, 5, "#999"); L.sph(0, 35.6, 0, .3, .3, .3, "#ff3030", 1, 6, 4); }
function plane3D(mb, fr, r, scale = 1) {
  const L = new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry + Math.PI / 2, scale);
  L.cyl(0, 3.2, -19, 2.1, 38, 14, "#f2f4f7", 0, 1, Math.PI / 2); L.sph(0, 3.2, 19, 2.1, 2.1, 4.2, "#f2f4f7"); L.cyl(0, 3.4, -19, 2.1, 8, 12, "#f2f4f7", 0, .2, -Math.PI / 2);
  L.box(0, 2.4, 0, 34, .4, 6, "#dfe4ea"); L.box(0, 5.6, -24, 12, .3, 3, "#dfe4ea"); L.box(0, 6.6, -23.5, .4, 7, 4.5, "#3b6fd8", 0, -.35);
  [-7, 7].forEach((x) => L.cyl(x, 1.4, -1, 1.1, 4, 10, "#c9d0da", 0, 1, Math.PI / 2));
  [[0, 15], [-3, -2], [3, -2]].forEach(([x, z]) => L.cyl(x, 0, z, .5, .5, 8, "#222", 0, 1, Math.PI / 2));
}

/* v6.11 : côté mer — plage aménagée (parasols, poste de secours, palmiers) + animaux éventuels */
function beachKit(sec, mb, r, animal, nAnimal = 5, skip) {
  const sea = AMB3[sec.amb].sea; if (!sea) return;
  for (let i = 0; i < 9; i++) { const t = .06 + i * .105; if (skip && t > skip[0] && t < skip[1]) continue; const s = sec.start + sec.len * t, fr = frameAt(NET.ring, s, sea * (12.5 + (i % 3) * 3.2), 0), L = new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry);
    if (i % 4 === 2) PROP.lifeguard(L, 0, 0, r); else if (i % 2) PROP.parasol(L, 0, 0, r); else PROP.palm(L, 0, 0, r); }
  if (animal) for (let i = 0; i < nAnimal; i++) { const fr = frameAt(NET.ring, sec.start + sec.len * (.1 + .8 * (i + r() * .6) / nAnimal), sea * (10 + r() * 9), 0); PROP[animal](new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry + r() * 6.3), 0, 0, r); }
}
/* animaux côté terre, dans les espaces libres entre la route et les façades */
function fauna(sec, mb, r, animal, side, t0, t1, n, x0 = 9.5, x1 = 22) { for (let i = 0; i < n; i++) { const fr = frameAt(NET.ring, sec.start + sec.len * (t0 + (t1 - t0) * (i + r() * .7) / n), side * (x0 + r() * (x1 - x0)), 0); if (NET.clear(fr.p, 1.5)) PROP[animal](new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry + r() * 6.3), 0, 0, r); } }
function streetSign(sec, t, x, text, mb, signs, col = "#1f6a44") { const fr = frameAt(NET.ring, sec.start + sec.len * t, x, 0, "back"), L = new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry); L.mt(MAT.metal); L.cyl(0, 0, -.08, .05, 3.6, 6, "#8a8a8a"); L.mt(MAT.plain); L.box(0, 3.0, -.06, 2.5, .56, .04, "#7d8288"); signs.push({ L, x: 0, y: 3.0, z: 0, w: 2.5, h: .56, lines: [text], o: { bg: col, fg: "#fff", border: "#fff", w: 640, h: 144, size: .56, fit: .86, round: 10 }, light: .35 }); }
/* v6.10 : faune de Namibie au bord de la route */
function safari(sec, mb, r, t0, t1, side, x0, x1) {
  const list = ["giraffe", "elephant", "lion", "giraffe", "elephant", "lion", "giraffe"], n = list.length;
  list.forEach((k, i) => { const t = t0 + (t1 - t0) * (i + .5) / n, fr = frameAt(NET.ring, sec.start + sec.len * t, side * (x0 + ((i * 7) % 3) / 2 * (x1 - x0) * .8 + r() * 3)); if (!NET.clear(fr.p, 3)) return;
    PROP[k](new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry + Math.PI / 2 * (r() < .5 ? 1 : -1) + (r() - .5) * 1.2), 0, 0, r); });
  for (let i = 0; i < 5; i++) { const fr = frameAt(NET.ring, sec.start + sec.len * (t0 + (t1 - t0) * r()), side * (x0 + r() * (x1 - x0))); if (NET.clear(fr.p, 3)) PROP.acacia(new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry), 0, 0, r); }
}
/* v6.10 : Times Square — tours d'écrans lumineux de part et d'autre de la route, escalier rouge */
function timesSquare(sec, a, mb, signs, r) {
  const ADS = [["TIMES SQUARE", "#e8222a", "#fff"], ["PHP 8", "#7a86f0", "#10122a"], ["SYMFONY", "#111", "#fff"], ["BROADWAY", "#ffd23a", "#141414"], ["TWIG", "#3ecf6a", "#0c2412"], ["MVC", "#ff4fa0", "#fff"], ["NEW YORK", "#1a6cf0", "#fff"], ["I ♥ CODE", "#fff", "#e8222a"], ["OPEN 24/7", "#ff8a1e", "#1a1004"], ["NYC", "#19d3e0", "#06262a"]];
  let q = 0; const ad = () => ADS[q++ % ADS.length], mono = "'Martian Mono', ui-monospace, monospace";
  [-1, 1].forEach((side) => [.68, .88].forEach((t, ti) => {
    const w = 13, d = 12, h = 30 + ((ti + (side > 0 ? 1 : 0)) % 2) * 12, fr = frameAt(NET.ring, sec.start + sec.len * t, side * (11.5 + d / 2), 0), L = new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry);
    L.mt(MAT.stone); L.box(0, -3, 0, w, 3, d, shade3(a.walk, -.2)); L.mt(MAT.glass); L.box(0, 0, 0, w, h, d, "#232a36"); L.mt(MAT.plain); L.box(0, h, 0, w * .7, 2.5, d * .7, "#2c3440"); L.box(0, 0, d / 2 + .05, w, 4.2, .1, "#101318");
    // façade côté route : écrans empilés ; flancs : écrans visibles en arrivant
    let y = 5; while (y < h - 4) { const hh = 4 + ((q * 3) % 3) * 1.6, A = ad(); signs.push({ L, x: 0, y: y, z: d / 2 + .12, w: w - .8, h: hh, lines: [A[0]], o: { bg: A[1], fg: A[2], font: mono, size: .5, fit: .8 }, light: 1 }); y += hh + .5; }
    [-1, 1].forEach((fl) => { const F = new Loc(mb, L.w(fl * (w / 2 + .12), 0, 0), fr.ry + fl * Math.PI / 2); let yy = 9; while (yy < h - 5) { const A = ad(), hh = 3.6; signs.push({ L: F, x: 0, y: yy, z: 0, w: d - 3, h: hh, lines: [A[0]], o: { bg: A[1], fg: A[2], font: mono, size: .5, fit: .8 }, light: 1 }); yy += hh + 3; } for (let k = -2; k <= 2; k++) F.box(k * 2.1, 1, .02, 1.5, 2.6, .08, "#ffe9a8", .8); });
    // bandeau défilant et néons
    L.box(0, 4.2, d / 2 + .1, w, .5, .2, "#ffd23a", 1); [-1, 1].forEach((e) => L.box(e * (w / 2 - .1), 0, d / 2 + .1, .2, h, .2, pickR(r, ["#ff4fa0", "#19d3e0", "#ffd23a"]), 1));
  }));
  // escalier rouge (TKTS) et taxi jaune
  const fs = frameAt(NET.ring, sec.start + sec.len * .78, -8.4, 0), S = new Loc(mb, [fs.p[0], fs.p[1], fs.p[2]], fs.ry + Math.PI / 2);
  S.mt(MAT.plain); for (let i = 0; i < 7; i++) S.box(0, 0, -1.8 + i * .55, 4.2, .28 * (i + 1), .55, "#d5202a", .55);
  // v6.14 : taxi retiré (il était garé sur le trottoir)
}
/* ---------- Monuments et arrière-plans par ville ---------- */
const far = (sec, t, x, y = 0) => { if (Math.sign(x) === NET.inSide && Math.abs(x) > 130) x = -x;   /* v6.4 : montagnes et décors lointains toujours à l'extérieur de l'anneau (ils tombaient sur le hub : gros bloc blanc en vue aérienne) */ const fr = frameAt(NET.ring, sec.start + sec.len * t, x, 0); return { p: [fr.p[0], (Math.abs(x) > 130 ? NET.ring.at(sec.start + sec.len * t).p[1] - .5 : fr.p[1]) + y, fr.p[2]], ry: fr.ry, f: fr.f }; };
const HSIGN = 1;   // orientation de l enseigne Hollywood vers la route
const LANDMARK = {
  paris: { block: [[.42, 1, -NET.inSide]], build(sec, a, mb, bg) {
    const o = far(sec, .97, -85), L = new Loc(mb, o.p, o.ry), c = "#6a5444";
    const legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    legs.forEach(([sx, sz]) => { segment(mb, L.w(sx * 26, 0, sz * 26), L.w(sx * 9, 58, sz * 9), 3, c, 4, .6); });
    L.box(0, 56, 0, 30, 3, 30, c, 0, 0, 0, 0, .8, .8);
    legs.forEach(([sx, sz]) => segment(mb, L.w(sx * 9, 58, sz * 9), L.w(sx * 3.6, 112, sz * 3.6), 1.6, c, 4, .7));
    L.box(0, 112, 0, 10, 2, 10, c); segment(mb, L.w(0, 114, 0), L.w(0, 160, 0), 2.4, c, 4, .3); L.cyl(0, 158, 0, .5, 12, 5, c);
    for (let y = 8; y < 56; y += 9) L.box(0, y, 0, 46 - y * .62, .6, 46 - y * .62, c, 0, 0, 0, 0, 1, 1);
    [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1]].forEach(() => {});
    L.box(0, 18, 0, 34, 1.4, 1.2, c); L.box(0, 18, 0, 1.2, 1.4, 34, c);
    if (a.lit) for (let i = 0; i < 40; i++) { const t = i / 40, y = t * 150, rad = 26 * (1 - Math.pow(t, .45)) + 2; L.sph(Math.cos(i * 2.4) * rad, y, Math.sin(i * 2.4) * rad, .35, .35, .35, "#ffd98a", 1, 4, 3); }
    const sc = far(sec, .3, 240), SC = new Loc(bg, sc.p, sc.ry); SC.cyl(0, 30, 0, 14, 18, 12, "#efe9de"); SC.sph(0, 48, 0, 14, 16, 14, "#f2ede4"); SC.box(0, 0, 0, 60, 32, 30, "#e9e2d4"); [-22, 22].forEach((x) => { SC.cyl(x, 30, 0, 6, 8, 10, "#efe9de"); SC.sph(x, 38, 0, 6, 8, 6, "#f2ede4"); });
  } },
  bordeaux: { block: [[.06, .42, 1]], build(sec, a, mb, bg) {
    const o = far(sec, .24, 46), L = new Loc(mb, o.p, o.ry), stone = "#e1cb9c";
    L.box(0, 0, 0, 120, 15, 16, stone); L.box(0, 15, 0, 120, 5, 15, "#5a6470", 0, 0, 0, 0, .96, .6); L.box(0, 0, 3, 24, 22, 12, shade3(stone, .06)); L.box(0, 22, 3, 24, 4, 11, "#5a6470", 0, 0, 0, 0, .9, .5);
    for (let x = -57; x < 58; x += 4.2) { L.quad(x, 2, 8.02, 2.1, 4.2, "#3e4752"); L.sph(x, 6.2, 8.01, 1.05, .6, .02, "#3e4752", 0, 8, 3); L.quad(x, 9, 8.02, 1.8, 3.4, "#3e4752"); }
    for (let x = -10; x < 11; x += 2.6) L.box(x, 0, 9.4, .9, 14, .9, shade3(stone, .1));
    // le miroir d'eau
    const m = new Loc(mb, o.p, o.ry); m.box(0, -.04, -16, 110, .06, 22, "#1d2a38", .0);
  } },
  losangeles: { build(sec, a, mb, bg, r, signs) {   // v6.12 : Hollywood Boulevard — palmiers géants, étoiles du Walk of Fame, enseigne Hollywood sur la colline
    const o = far(sec, .5, -420), L = new Loc(bg, o.p, o.ry); for (let i = 0; i < 18; i++) BLD.tower(new Loc(bg, L.w(-140 + i * 16, 0, (i % 3) * 20), o.ry), 14, 14, rng(i + 9), a, 40, 160);
    { const sm = sec.start + sec.len * .45, hx = -135 * NET.inSide, h = frameAt(NET.ring, sm, hx, 0), road = NET.ring.at(sm).p; let HL = new Loc(bg, [h.p[0], road[1] + 34, h.p[2]], h.ry + Math.PI / 2);
      const o0 = HL.w(0, 0, 0), z1 = HL.w(0, 0, 1); if ((z1[0] - o0[0]) * (road[0] - o0[0]) + (z1[2] - o0[2]) * (road[2] - o0[2]) > 0) HL = new Loc(bg, [h.p[0], road[1] + 34, h.p[2]], h.ry - Math.PI / 2);   // la face lisible (−z) regarde la route
      HL.mt(MAT.sand); HL.box(0, -36, 2, 110, 36, 3.6, "#a8805a"); HL.box(0, -36, 16, 150, 28, 30, "#9a744f"); signs.push({ L: HL, x: 0, y: 7, z: -.1, w: 84, h: 11, lines: ["HOLLYWOOD"], o: { bg: "rgba(0,0,0,0)", fg: "#fff", w: 1200, h: 160, size: .8, fit: .98 }, light: .9 }); }
    streetSign(sec, .3, -6.9 * NET.inSide, "HOLLYWOOD BLVD", mb, signs, "#1b3f7a"); streetSign(sec, .6, -6.9 * NET.inSide, "SUNSET BLVD", mb, signs, "#1b3f7a");
    [-1, 1].forEach((sd) => { for (let i = 0; i < 16; i++) { const fr = frameAt(NET.ring, sec.start + sec.len * (.05 + i * .06), sd * 9.2, 0); const S = new Loc(mb, [fr.p[0], fr.p[1] + .03, fr.p[2]], fr.ry); S.mt(MAT.plain); S.box(0, 0, 0, .9, .02, .9, i % 2 ? "#d94a8a" : "#e8b13a"); S.box(0, .02, 0, .5, .01, .5, "#1a1a1a"); } });
  } },
  newyork: { block: [[.6, 1, -1], [.6, 1, 1]], build(sec, a, mb, bg, r, signs) { timesSquare(sec, a, mb, signs, r); const o = far(sec, .85, 300), L = new Loc(bg, o.p, o.ry); L.box(0, 0, 0, 40, 200, 40, "#8a8f98"); L.box(0, 200, 0, 28, 40, 28, "#9096a0"); L.box(0, 240, 0, 16, 30, 16, "#9aa0a8"); L.cyl(0, 270, 0, 2, 50, 6, "#a0a6ae", 0, .3); } },
  lasvegas: { build(sec, a, mb, bg, r, signs) { fauna(sec, mb, r, "flamingo", 1, .05, .95, 4, 9.2, 10.5); fauna(sec, mb, r, "flamingo", -1, .05, .95, 4, 9.2, 10.5); streetSign(sec, .2, -6.9 * NET.inSide, "THE STRIP", mb, signs, "#1a3fa8"); const o = far(sec, .7, -260), L = new Loc(bg, o.p, o.ry); L.cyl(0, 0, 0, 9, 240, 10, "#d8d2c8", 0, .6); L.cyl(0, 230, 0, 22, 18, 16, "#e8e2d8"); L.cyl(0, 236, 0, 23, 2, 16, "#ff4fa0", 1); L.cyl(0, 248, 0, 2, 50, 6, "#ccc", 0, .2);
    for (let i = 0; i < 8; i++) { const m = far(sec, i / 8, (i % 2 ? 1 : -1) * (950 + i * 40)); new Loc(bg, [m.p[0], -10, m.p[2]], 0).cyl(0, 0, 0, 240 + i * 12, 120 + (i % 3) * 30, 28, "#3a2a40", 0, .12); } } }, // v5 : montagnes lointaines, plus de « mur »
  miami: { block: [[.6, .95, -NET.inSide]], build(sec, a, mb, bg, r, signs) {   // v6.11 : Collins Avenue — hôtels Art déco des deux côtés, square de plage avec flamants roses
    const o = -NET.inSide; streetSign(sec, .14, 6.9 * o, "COLLINS AVE", mb, signs); streetSign(sec, .56, -6.9 * o, "OCEAN DRIVE", mb, signs);
    const fl = frameAt(NET.ring, sec.start + sec.len * .78, o * 15, 0); PROP.lifeguard(new Loc(mb, [fl.p[0], fl.p[1], fl.p[2]], fl.ry), 0, 0, r);
    [.64, .7, .86, .92].forEach((t, i) => { const f = frameAt(NET.ring, sec.start + sec.len * t, o * (11 + (i % 2) * 6), 0), L = new Loc(mb, [f.p[0], f.p[1], f.p[2]], f.ry); i % 2 ? PROP.parasol(L, 0, 0, r) : PROP.palm(L, 0, 0, r); });
    fauna(sec, mb, r, "flamingo", o, .62, .94, 7, 9.5, 20); fauna(sec, mb, r, "flamingo", -o, .04, .3, 3, 9.2, 10.5);
  } },
  tokyo: { build(sec, a, mb, bg) {
    const o = far(sec, .7, 260), L = new Loc(bg, o.p, o.ry), red = "#e0523f", wh = "#f4f0ea";
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([x, z]) => segment(bg, L.w(x * 30, 0, z * 30), L.w(x * 6, 140, z * 6), 2.5, red, 4, .6));
    L.box(0, 120, 0, 22, 10, 22, wh, .3); segment(bg, L.w(0, 130, 0), L.w(0, 230, 0), 4, red, 6, .2); L.box(0, 200, 0, 8, 6, 8, wh, .4); L.cyl(0, 230, 0, .6, 30, 4, "#ddd");
    fuji(sec, bg, -1, .3);
  } },
  kyoto: { build(sec, a, mb, bg, r) {
    [.26, .88].forEach((t) => torii(sec, sec.start + sec.len * t, mb));
    const o = far(sec, .78, -46), L = new Loc(mb, o.p, o.ry);
    for (let i = 0; i < 5; i++) { const y = i * 7, w = 12 - i * 1.4; L.box(0, y, 0, w * .62, 6, w * .62, "#8a3a2a"); L.box(0, y + 5.6, 0, w + 3, .5, w + 3, "#2f3236", 0, 0, 0, 0, .82, .82); }
    L.cyl(0, 35, 0, .4, 9, 6, "#c9a24a");
    fuji(sec, bg, 1, .5);
  }, block: [[.7, .86, -1]] },
  osaka: { build(sec, a, mb, bg) {
    const o = far(sec, .6, -260), L = new Loc(bg, o.p, o.ry);
    L.box(0, 0, 0, 90, 18, 90, "#6f6a62", 0, 0, 0, 0, .86, .86);
    const tiers = [[48, 12], [40, 10], [32, 9], [24, 8], [16, 8]]; let y = 18;
    tiers.forEach(([w, h]) => { L.box(0, y, 0, w, h, w * .8, "#f2f0ea"); L.box(0, y + h, 0, w + 6, 2.4, w * .8 + 6, "#3f7a6a", 0, 0, 0, 0, .8, .8); y += h + 2.4; });
    L.box(0, y, 0, 3, 2, 3, "#e0b84a", .3);
  } },
  nara: { build(sec, a, mb, bg) {
    torii(sec, sec.start + 30, mb, "#c8402c");
    const o = far(sec, .7, 160), L = new Loc(bg, o.p, o.ry);
    L.box(0, 0, 0, 80, 4, 60, "#8f8a80"); L.box(0, 4, 0, 64, 18, 46, "#6b4a30"); L.box(0, 22, 0, 86, 3, 64, "#2f3236", 0, 0, 0, 0, .8, .7); L.box(0, 25, 0, 56, 12, 40, "#6b4a30"); L.prism(0, 37, 0, 76, 12, 56, "#2f3236"); L.box(-36, 47, 0, 3, 4, 3, "#e0b84a", .3); L.box(36, 47, 0, 3, 4, 3, "#e0b84a", .3);
  } },
  sapporo: { build(sec, a, mb, bg) { for (let i = 0; i < 6; i++) { const o = far(sec, i / 6, (i % 2 ? 1 : -1) * (420 + i * 40)); const L = new Loc(bg, o.p, 0); L.cyl(0, -10, 0, 260, 220, 9, "#aebccd", 0, .08); L.cyl(0, 140, 0, 110, 70, 9, "#f4f7fb", 0, .1); } } },
  sydney: { build(sec, a, mb, bg) {
    const o = far(sec, .45, -170), L = new Loc(bg, [o.p[0], -1, o.p[2]], o.ry);
    L.box(0, 0, 0, 120, 4, 70, "#d8cbb4");
    [[-30, 34, 30], [-4, 30, 26], [18, 24, 22], [36, 18, 16]].forEach(([x, h, w]) => { [-14, 14].forEach((z) => { L.sph(x, 4, z, w * .55, h, w * .32, "#f6f3ea", 0, 12, 8); }); });
    const b = far(sec, .85, -260), B = new Loc(bg, [b.p[0], 0, b.p[2]], b.ry + Math.PI / 2);
    for (let i = 0; i <= 30; i++) { const t = i / 30 * 2 - 1, x = t * 250, y = 130 * (1 - t * t); B.box(x, y, -12, 18, 6, 4, "#7d858d"); B.box(x, y, 12, 18, 6, 4, "#7d858d"); if (i % 2 === 0) { segment(bg, B.w(x, 50, -12), B.w(x, y, -12), .8, "#7d858d", 4); segment(bg, B.w(x, 50, 12), B.w(x, y, 12), .8, "#7d858d", 4); } }
    B.box(0, 48, 0, 560, 4, 30, "#8a929a"); [-260, 260].forEach((x) => { B.box(x, 0, 0, 24, 90, 40, "#c9bfae"); });
  } },
  brisbane: { build(sec, a, mb, bg, r) { beachKit(sec, mb, r, null); } },
  melbourne: { build(sec, a, mb, bg) { const o = far(sec, .6, 300), L = new Loc(bg, o.p, o.ry); L.box(0, 0, 0, 34, 290, 34, "#6a7888"); L.box(0, 290, 0, 22, 12, 22, "#c9a24a", .2); } },
  cairns: { block: [[.5, .9, NET.inSide]], build(sec, a, mb, bg, r, signs) {   // v6.11 : esplanade tropicale, crocodiles sur la plage et dans la mangrove côté terre
    beachKit(sec, mb, r, "crocodile", 5); const h = NET.inSide;
    const fp = frameAt(NET.ring, sec.start + sec.len * .7, h * 19, 0), P = new Loc(mb, [fp.p[0], fp.p[1], fp.p[2]], fp.ry); P.mt(MAT.water); P.box(0, .02, 0, 22, .05, 13, "#2f7f8a"); P.mt(MAT.sand); P.box(0, -.3, 0, 25, .31, 16, "#cdbf8f"); P.mt(MAT.plain);
    fauna(sec, mb, r, "crocodile", h, .54, .88, 5, 10, 24); [.52, .62, .8, .9].forEach((t) => { const f = frameAt(NET.ring, sec.start + sec.len * t, h * (24 + r() * 5), 0); PROP.palm(new Loc(mb, [f.p[0], f.p[1], f.p[2]], f.ry), 0, 0, r); });
    streetSign(sec, .46, h * 6.9, "⚠ CROCODILES", mb, signs, "#e8b820");
  } },
  uluru: { build(sec, a, mb, bg, r) {
    // v6.6 : le rocher est rapproché (il se perdait dans la brume) et reprend la silhouette d'Uluru : long dôme aplati, flancs striés
    const o = far(sec, .55, -118 * NET.inSide), L = new Loc(bg, o.p, o.ry + Math.PI / 2);   // v6.7 : sur la terre d'Uluru, grand axe vers l'extérieur (il débordait sur la mer de Gold Coast)
    L.sph(0, 0, 0, 78, 26, 44, "#c2562a", 0, 26, 12); L.sph(-27, 0, 3, 50, 29, 39, "#bd5228", 0, 22, 12); L.sph(32, 0, -3, 47, 23, 37, "#c65a2d", 0, 22, 12); L.sph(0, 13, 0, 68, 13, 38, "#c8602f", 0, 22, 8);
    L.sph(-55, 0, 20, 22, 17, 20, "#b85027", 0, 14, 8); L.sph(58, 0, 18, 20, 14, 18, "#c05529", 0, 14, 8);   // épaulements
    const k = far(sec, .2, 560), K = new Loc(bg, k.p, k.ry); for (let i = 0; i < 5; i++) K.sph(i * 70 - 140, 0, 0, 40, 70 + (i % 2) * 30, 40, "#a54a26", 0, 10, 6);
  } },
  goldcoast: { build(sec, a, mb, bg, r) { beachKit(sec, mb, r, null); } },
  windhoek: { block: [[.5, 1, -1], [.5, 1, 1]], build(sec, a, mb, bg, r) { safari(sec, mb, r, .5, .98, -1, 10, 30); safari(sec, mb, r, .5, .98, 1, 10, 30);   /* v6.12 : animaux des deux côtés */ [-1, 1].forEach((sd, i) => { const o = far(sec, .3 + i * .4, sd * 420), L = new Loc(bg, o.p, o.ry); L.box(0, 0, 0, 380, 55, 160, "#8a5a4a", 0, 0, 0, 0, .88, .82); }); } },
  sossusvlei: { build(sec, a, mb, bg, r) {
    safari(sec, mb, r, .08, .92, -1, 11, 30); safari(sec, mb, r, .1, .9, 1, 11, 26);
    for (let i = 0; i < 10; i++) { const sd = i % 2 ? 1 : -1, o = far(sec, i / 10, sd * (220 + r() * 320)), L = new Loc(bg, o.p, o.ry + r());
      const H = 40 + r() * 90, W = 140 + r() * 160; L.prism(0, -2, 0, W, H, W * .7, i % 3 ? "#c5562e" : "#d8693a"); L.prism(W * .12, -2, W * .05, W * .7, H * .97, W * .5, "#8a3a20"); }
  } }
};
function torii(sec, s, mb, red = "#d8432f") {
  const fr = frameAt(NET.ring, s, 0, 0, "back"), L = new Loc(mb, [fr.p[0], fr.p[1], fr.p[2]], fr.ry);
  [-6.5, 6.5].forEach((x) => L.cyl(x, 0, 0, .5, 9.5, 10, red)); L.box(0, 7.6, 0, 15, .7, .7, red); L.box(0, 9.4, 0, 18.5, .9, 1.1, "#1e1e22", 0, 0, 0, 0, 1.06, 1); L.box(0, 9.2, 0, 17.6, .5, .9, red); L.box(0, 7.9, 0, .8, 1.6, .5, "#1e1e22");
}
function fuji(sec, bg, side, t) { const o = far(sec, t, side * 900), L = new Loc(bg, o.p, 0); L.cyl(0, -20, 0, 620, 360, 18, "#6f7f9a", 0, .12); L.cyl(0, 230, 0, 230, 105, 18, "#f2f5fa", 0, .2); }

/* ---------- Rayons et hub ---------- */
function buildSpokeChunk(sp) {
  const a = AMB3.airport, mb = new MB(), bg = new MB(), water = new MB(), signs = [], r = rng(sp.wi * 77 + 5), path = sp.path;
  ribbon(mb, water, path, 0, path.len, a, { kind: "spoke" }, .03);
  // v6.7 : disque de pelouse sous tout le hub (on voyait l'eau des ponts entre les routes de l'aéroport)
  { mb.mat = MAT.grass; mb.aoY = null; const yy = -.32 - sp.wi * .012, N = 48, g = a.ground[0]; for (let i = 0; i < N; i++) { const a0 = i / N * 6.2832, a1 = (i + 1) / N * 6.2832, p0 = [Math.cos(a0) * 262, yy, Math.sin(a0) * 262], p1 = [Math.cos(a1) * 262, yy, Math.sin(a1) * 262], q0 = [Math.cos(a0) * .05, yy, Math.sin(a0) * .05], q1 = [Math.cos(a1) * .05, yy, Math.sin(a1) * .05]; mb.quad(q0, q1, p1, p0, g, 0); mb.quad(q1, q0, p0, p1, g, 0); } mb.mat = MAT.plain; }
  for (let s = 70; s < path.len - 20; s += 18) [-1, 1].forEach((sd) => { const f = frameAt(path, s, sd * 7.2); if (NET.clear(f.p, .6)) PROP.lamp(new Loc(mb, f.p, f.ry), 0, 0, r, a); });
  for (let s = 30; s < path.len - 30; s += 7) [-1, 1].forEach((sd) => { if (r() < .55) { const f = frameAt(path, s, sd * (14 + r() * 40)); if (NET.clear(f.p, 3.5)) PROP.tree(new Loc(mb, f.p, f.ry), 0, 0, r, .9 + r() * .4, pickR(r, ["#5d7a3e", "#6b8845", "#4f6a38"])); } });
  // hub : parvis, terminal (portes vitrées), tour de contrôle, avions
  const end = path.at(path.len - 1), ry = Math.atan2(end.t[0], end.t[2]), Lc = new Loc(mb, end.p, ry, 1, false);
  Lc.mt(MAT.paving); Lc.box(0, -.3, 18, 70, .32, 40, "#c9c6bd");
  const TL = new Loc(mb, Lc.w(0, 0, 30), ry + Math.PI), D = 36; BLD.terminal(TL, 150, D, r, a);
  TL.mt(MAT.metal); TL.box(0, 3.6, D / 2 + 3, 16, .4, 6, "#e8eaec"); [-7.6, 7.6].forEach((x) => TL.box(x, 0, D / 2 + 5.6, .25, 3.6, .25, "#c9ced3"));
  TL.mt(MAT.metal); TL.box(0, 0, D / 2 + .02, 7.4, 3.4, .12, "#2a3340");
  sp.door = { p: TL.w(0, 0, D / 2 + .16), ry: TL.ry, fwd: [Math.sin(ry), 0, Math.cos(ry)] };
  signs.push({ L: TL, x: 0, y: 12.6, z: D / 2 + .25, w: 34, h: 3.4, linesObj: { fr: "✈ TERMINAL · RETOUR À L'ACCUEIL", en: "✈ TERMINAL · BACK HOME" }, o: { bg: "#0e1626", fg: "#ffc23d", w: 2048, h: 205, size: .55, font: "'Martian Mono', ui-monospace, monospace" }, light: .9 });
  controlTower(new Loc(mb, Lc.w(-55, 0, 10), 0));
  [[-90, 70], [80, 75], [130, 20]].forEach(([x, z], i) => { const p = Lc.w(x, 0, z); plane3D(mb, { p, f: { p }, ry: ry + i * 1.2 }, r, .9); });
  const rw = new Loc(mb, Lc.w(0, 0, 150), ry + Math.PI / 2, 1, false); rw.mt(MAT.asphalt); rw.box(0, -.02, 0, 340, .06, 50, "#3c3f44"); rw.mt(MAT.plain); for (let x = -150; x <= 150; x += 30) rw.box(x, .05, 0, 14, .02, 1.2, "#e8e8e8");
  return { mb, bg, water, signs };
}
