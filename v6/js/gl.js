/* ==========================================================================
   Mini moteur 3D WebGL2 : maths, construction de maillages, ombres portées,
   ciel atmosphérique, brouillard, panneaux texturés (textes).
   Écrit à la main pour rester léger et sans dépendance.
   ========================================================================== */

/* ---------- Maths (matrices colonne-majeure, comme WebGL) ---------- */
const M4 = {
  id() { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
  mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  },
  persp(fovy, asp, n, f) { const t = 1 / Math.tan(fovy / 2), m = new Float32Array(16); m[0] = t / asp; m[5] = t; m[10] = (f + n) / (n - f); m[11] = -1; m[14] = 2 * f * n / (n - f); return m; },
  ortho(l, r, b, t, n, f) { const m = M4.id(); m[0] = 2 / (r - l); m[5] = 2 / (t - b); m[10] = -2 / (f - n); m[12] = -(r + l) / (r - l); m[13] = -(t + b) / (t - b); m[14] = -(f + n) / (f - n); return m; },
  lookAt(e, c, u) {
    let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2]; let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
    let xx = u[1] * zz - u[2] * zy, xy = u[2] * zx - u[0] * zz, xz = u[0] * zy - u[1] * zx; l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    const m = new Float32Array(16);
    m[0] = xx; m[1] = yx; m[2] = zx; m[4] = xy; m[5] = yy; m[6] = zy; m[8] = xz; m[9] = yz; m[10] = zz;
    m[12] = -(xx * e[0] + xy * e[1] + xz * e[2]); m[13] = -(yx * e[0] + yy * e[1] + yz * e[2]); m[14] = -(zx * e[0] + zy * e[1] + zz * e[2]); m[15] = 1;
    return m;
  },
  inv(m) {
    const a = m, o = new Float32Array(16);
    const b00 = a[0] * a[5] - a[1] * a[4], b01 = a[0] * a[6] - a[2] * a[4], b02 = a[0] * a[7] - a[3] * a[4], b03 = a[1] * a[6] - a[2] * a[5], b04 = a[1] * a[7] - a[3] * a[5], b05 = a[2] * a[7] - a[3] * a[6];
    const b06 = a[8] * a[13] - a[9] * a[12], b07 = a[8] * a[14] - a[10] * a[12], b08 = a[8] * a[15] - a[11] * a[12], b09 = a[9] * a[14] - a[10] * a[13], b10 = a[9] * a[15] - a[11] * a[13], b11 = a[10] * a[15] - a[11] * a[14];
    let d = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06; if (!d) return M4.id(); d = 1 / d;
    o[0] = (a[5] * b11 - a[6] * b10 + a[7] * b09) * d; o[1] = (a[2] * b10 - a[1] * b11 - a[3] * b09) * d; o[2] = (a[13] * b05 - a[14] * b04 + a[15] * b03) * d; o[3] = (a[10] * b04 - a[9] * b05 - a[11] * b03) * d;
    o[4] = (a[6] * b08 - a[4] * b11 - a[7] * b07) * d; o[5] = (a[0] * b11 - a[2] * b08 + a[3] * b07) * d; o[6] = (a[14] * b02 - a[12] * b05 - a[15] * b01) * d; o[7] = (a[8] * b05 - a[10] * b02 + a[11] * b01) * d;
    o[8] = (a[4] * b10 - a[5] * b08 + a[7] * b06) * d; o[9] = (a[1] * b08 - a[0] * b10 - a[3] * b06) * d; o[10] = (a[12] * b04 - a[13] * b02 + a[15] * b00) * d; o[11] = (a[9] * b02 - a[8] * b04 - a[11] * b00) * d;
    o[12] = (a[5] * b07 - a[4] * b09 - a[6] * b06) * d; o[13] = (a[0] * b09 - a[1] * b07 + a[2] * b06) * d; o[14] = (a[13] * b01 - a[12] * b03 - a[14] * b00) * d; o[15] = (a[8] * b03 - a[9] * b01 + a[10] * b00) * d;
    return o;
  },
  /* translation · rotation Y · rotation X · rotation Z · échelle */
  trs(x, y, z, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    const cy = Math.cos(ry), sy_ = Math.sin(ry), cx = Math.cos(rx), sx_ = Math.sin(rx), cz = Math.cos(rz), sz_ = Math.sin(rz);
    // R = Ry * Rx * Rz
    const r00 = cy * cz + sy_ * sx_ * sz_, r01 = -cy * sz_ + sy_ * sx_ * cz, r02 = sy_ * cx;
    const r10 = cx * sz_, r11 = cx * cz, r12 = -sx_;
    const r20 = -sy_ * cz + cy * sx_ * sz_, r21 = sy_ * sz_ + cy * sx_ * cz, r22 = cy * cx;
    const m = new Float32Array(16);
    m[0] = r00 * sx; m[1] = r10 * sx; m[2] = r20 * sx;
    m[4] = r01 * sy; m[5] = r11 * sy; m[6] = r21 * sy;
    m[8] = r02 * sz; m[9] = r12 * sz; m[10] = r22 * sz;
    m[12] = x; m[13] = y; m[14] = z; m[15] = 1;
    return m;
  }
};
function tp(m, x, y, z) { return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]]; }
function nmat(m) { // inverse transposée 3×3
  const a = m[0], b = m[4], c = m[8], d = m[1], e = m[5], f = m[9], g = m[2], h = m[6], i = m[10];
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, D = -(b * i - c * h), E = a * i - c * g, F = -(a * h - b * g), G = b * f - c * e, H = -(a * f - c * d), I = a * e - b * d;
  return [A, B, C, D, E, F, G, H, I];
}
function tn(n, x, y, z) { const v = [n[0] * x + n[3] * y + n[6] * z, n[1] * x + n[4] * y + n[7] * z, n[2] * x + n[5] * y + n[8] * z]; const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
const V3 = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sc: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
};

/* ---------- Couleurs ---------- */
const _hexC = {};
function hex(h) {
  if (Array.isArray(h)) return h;
  if (_hexC[h]) return _hexC[h];
  const v = parseInt(h.slice(1), 16); return (_hexC[h] = [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255]);
}
function cmix(a, b, t) { a = hex(a); b = hex(b); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function cvar(c, r, amt = .08) { c = hex(c); const k = 1 + (r() - .5) * 2 * amt; return [Math.min(1, c[0] * k), Math.min(1, c[1] * k), Math.min(1, c[2] * k)]; }
function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/* ---------- Construction de maillages ----------
   Format sommet : position (3) · normale (3) · couleur RGB + émissif (4). */
const MAT = { plain: 0, asphalt: 1, grass: 2, stone: 3, brick: 4, glass: 5, water: 6, leaf: 7, wood: 8, paving: 9, metal: 10, sand: 11, snow: 12, roof: 13, skin: 14, cloth: 15 };
class MB {
  constructor() { this.v = []; this.i = []; this.n = 0; this.mat = 0; this.aoY = null; }
  vert(p, n, c, e) {
    let k = 1; if (this.aoY !== null && !e) { const h = Math.max(0, Math.min(1, (p[1] - this.aoY) / 1.6)); k = .55 + .45 * h * h * (3 - 2 * h); }
    this.v.push(p[0], p[1], p[2], n[0], n[1], n[2], c[0] * k, c[1] * k, c[2] * k, e, this.mat); return this.n++;
  }
  /* grille lissée (terrain) : rows[i][j] = [x,y,z], cols[i][j] = couleur, mats[j] = matériau de la bande */
  grid(rows, cols, mats) {
    const R = rows.length, C = rows[0].length, base = this.n, N = [];
    for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) {
      const a = rows[Math.max(0, i - 1)][j], b = rows[Math.min(R - 1, i + 1)][j], c = rows[i][Math.max(0, j - 1)], d = rows[i][Math.min(C - 1, j + 1)];
      let n = V3.norm(V3.cross(V3.sub(d, c), V3.sub(b, a))); if (n[1] < 0) n = V3.sc(n, -1);
      const sm = this.mat; this.mat = mats[Math.min(j, C - 2)]; this.vert(rows[i][j], n, hex(cols[i][j]), 0); this.mat = sm;
    }
    for (let i = 0; i < R - 1; i++) for (let j = 0; j < C - 1; j++) { if (mats[j] < 0) continue; const a = base + i * C + j; this.i.push(a + C + 1, a, a + C, a + C + 1, a + 1, a); }   // v6.3 : dernier sommet = colonne j (matériau flat, plus de bande « herbe » au milieu de la chaussée)
  }
  /* boule de feuillage lisse, déformée par du bruit */
  foliage(x, y, z, r, col, rnd, sq = 1, ws = 12, hs = 8) {
    const sm = this.mat; this.mat = MAT.leaf; col = cvar(col, rnd, .08); const base = this.n, ph0 = rnd() * 10;
    for (let j = 0; j <= hs; j++) { const ph = j / hs * Math.PI; for (let k = 0; k <= ws; k++) {
      const th = k / ws * Math.PI * 2, d = [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)];
      const w = 1 + .16 * Math.sin(th * 3 + ph0) * Math.sin(ph * 2 + ph0) + .1 * Math.sin(th * 5 - ph * 3 + ph0 * 2);
      const kk = k === ws ? 0 : k; const th2 = kk / ws * Math.PI * 2; const w2 = 1 + .16 * Math.sin(th2 * 3 + ph0) * Math.sin(ph * 2 + ph0) + .1 * Math.sin(th2 * 5 - ph * 3 + ph0 * 2);
      this.vert([x + d[0] * r * w2, y + d[1] * r * w2 * sq, z + d[2] * r * w2], V3.norm([d[0], d[1] / sq, d[2]]), col, 0);
    } }
    for (let j = 0; j < hs; j++) for (let k = 0; k < ws; k++) { const a = base + j * (ws + 1) + k, b = a + ws + 1; this.i.push(a, a + 1, b, a + 1, b + 1, b); }
    this.mat = sm;
  }
  tri(a, b, c, col, e = 0) {
    const n = V3.norm(V3.cross(V3.sub(b, a), V3.sub(c, a))); col = hex(col);
    const i = this.vert(a, n, col, e); this.vert(b, n, col, e); this.vert(c, n, col, e); this.i.push(i, i + 1, i + 2);
  }
  quad(a, b, c, d, col, e = 0) { // a b c d dans le sens antihoraire vu de face
    const n = V3.norm(V3.cross(V3.sub(b, a), V3.sub(d, a))); col = hex(col);
    const i = this.vert(a, n, col, e); this.vert(b, n, col, e); this.vert(c, n, col, e); this.vert(d, n, col, e);
    this.i.push(i, i + 1, i + 2, i, i + 2, i + 3);
  }
  /* cube unitaire posé au sol : x,z ∈ [-0.5, 0.5], y ∈ [0, 1] ; topX/topZ rétrécissent le haut (toits mansardés) */
  box(m, col, e = 0, topX = 1, topZ = 1, skipBottom = true, bevel = 0) {
    const P = (x, y, z) => tp(m, y ? x * topX : x, y, y ? z * topZ : z);
    const p = [P(-.5, 0, -.5), P(.5, 0, -.5), P(.5, 0, .5), P(-.5, 0, .5), P(-.5, 1, -.5), P(.5, 1, -.5), P(.5, 1, .5), P(-.5, 1, .5)];
    this.quad(p[3], p[2], p[6], p[7], col, e); // +z
    this.quad(p[1], p[0], p[4], p[5], col, e); // -z
    this.quad(p[2], p[1], p[5], p[6], col, e); // +x
    this.quad(p[0], p[3], p[7], p[4], col, e); // -x
    this.quad(p[7], p[6], p[5], p[4], col, e); // haut
    if (!skipBottom) this.quad(p[0], p[1], p[2], p[3], col, e);
  }
  B(x, y, z, w, h, d, ry, col, e = 0, rx = 0, rz = 0) { this.box(M4.trs(x, y, z, ry, rx, rz, w, h, d), col, e); }
  /* toit à deux pans : faîtage le long de x */
  prism(m, col, e = 0) {
    const P = (x, y, z) => tp(m, x, y, z);
    const a = P(-.5, 0, -.5), b = P(.5, 0, -.5), c = P(.5, 0, .5), d = P(-.5, 0, .5), r1 = P(-.5, 1, 0), r2 = P(.5, 1, 0);
    this.quad(d, c, r2, r1, col, e); this.quad(b, a, r1, r2, col, e); this.tri(a, d, r1, col, e); this.tri(c, b, r2, col, e);
  }
  pyramid(m, col, e = 0) {
    const P = (x, y, z) => tp(m, x, y, z), t = P(0, 1, 0);
    const a = P(-.5, 0, -.5), b = P(.5, 0, -.5), c = P(.5, 0, .5), d = P(-.5, 0, .5);
    this.tri(d, c, t, col, e); this.tri(c, b, t, col, e); this.tri(b, a, t, col, e); this.tri(a, d, t, col, e);
  }
  /* cylindre / cône : rayon 1, y ∈ [0,1] */
  cyl(m, seg, col, e = 0, rTop = 1, caps = true, smooth = true) {
    col = hex(col); const N = nmat(m), base = this.n;
    for (let k = 0; k <= seg; k++) {
      const a = (k / seg) * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a);
      const slope = 1 - rTop, nl = tn(N, cx, slope, cz);
      this.vert(tp(m, cx, 0, cz), nl, col, e); this.vert(tp(m, cx * rTop, 1, cz * rTop), nl, col, e);
    }
    for (let k = 0; k < seg; k++) { const i = base + k * 2; this.i.push(i, i + 3, i + 1, i, i + 2, i + 3); }
    if (caps && rTop > 0) { const c0 = this.vert(tp(m, 0, 1, 0), tn(N, 0, 1, 0), col, e); const st = this.n; for (let k = 0; k <= seg; k++) { const a = (k / seg) * Math.PI * 2; this.vert(tp(m, Math.cos(a) * rTop, 1, Math.sin(a) * rTop), tn(N, 0, 1, 0), col, e); } for (let k = 0; k < seg; k++) this.i.push(c0, st + k + 1, st + k); }
  }
  C(x, y, z, r, h, seg, col, e = 0, rTop = 1, rx = 0, rz = 0, ry = 0) { this.cyl(M4.trs(x, y, z, ry, rx, rz, r, h, r), seg, col, e, rTop); }
  sphere(m, ws, hs, col, e = 0) {
    col = hex(col); const N = nmat(m), base = this.n;
    for (let j = 0; j <= hs; j++) { const v = j / hs, ph = v * Math.PI; for (let k = 0; k <= ws; k++) { const th = (k / ws) * Math.PI * 2; const x = Math.sin(ph) * Math.cos(th), y = Math.cos(ph), z = Math.sin(ph) * Math.sin(th); this.vert(tp(m, x, y, z), tn(N, x, y, z), col, e); } }
    for (let j = 0; j < hs; j++) for (let k = 0; k < ws; k++) { const a = base + j * (ws + 1) + k, b = a + ws + 1; this.i.push(a, a + 1, b, a + 1, b + 1, b); }
  }
  S(x, y, z, rx, ry, rz, col, e = 0, ws = 10, hs = 7, rot = 0) { this.sphere(M4.trs(x, y, z, rot, 0, 0, rx, ry, rz), ws, hs, col, e); }
  /* boule de feuillage facettée (icosaèdre déformé) */
  blob(x, y, z, r, col, rnd, sq = 1) {
    const t = (1 + Math.sqrt(5)) / 2;
    const P = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map((p) => { const l = Math.hypot(...p), j = .82 + rnd() * .36; return [x + p[0] / l * r * j, y + p[1] / l * r * j * sq, z + p[2] / l * r * j]; });
    const F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    F.forEach((f) => this.tri(P[f[0]], P[f[1]], P[f[2]], cvar(col, rnd, .1)));
  }
}

/* ---------- Renderer ---------- */
const GLR = (() => {
  const Q = { taps: 12, shadowEvery: 1 }; let lastL = null, frameNo = 0;
  let progCloud; let gl, canvas, progMain, progShadow, progSky, progTex, shadowFB, shadowTex, SHADOW = 2048, skyVAO;
  const VS = `#version 300 es
  layout(location=0) in vec3 aP; layout(location=1) in vec3 aN; layout(location=2) in vec4 aC; layout(location=3) in vec2 aUV; layout(location=4) in float aM;
  uniform mat4 uVP, uM, uL; out vec3 vN, vW; out vec4 vC, vL; out vec2 vUV; flat out float vM;
  void main(){ vec4 w = uM * vec4(aP,1.); vW = w.xyz; vN = mat3(uM) * aN; vC = aC; vUV = aUV; vM = aM; vL = uL * w; gl_Position = uVP * w; }`;
  const FS = `#version 300 es
  precision highp float; precision highp sampler2DShadow;
  in vec3 vN, vW; in vec4 vC, vL; in vec2 vUV; flat in float vM; out vec4 o;
  uniform vec3 uSun, uSunC, uSky, uGnd, uFog, uCam, uTopC, uHorC; uniform float uFogN, uFogF, uFogA, uSpec, uEmis, uExpo, uTex, uTexLight, uTime;
  uniform sampler2DShadow uSh; uniform sampler2D uT; uniform float uShOn, uTexel; uniform int uTaps;
  vec3 lin(vec3 c){ return pow(c, vec3(2.2)); }
  float gFar = 0.;
  float h3(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float n3(vec3 x){ if (gFar > .5) return .5; vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
    return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
  float fbm(vec3 p){ if (gFar > .5) return .5; float s = 0., a = .5; for (int i = 0; i < 3; i++) { s += a * n3(p); p *= 2.03; a *= .5; } return s * 1.14; }
  const vec2 PD[12] = vec2[12](vec2(-.326,-.406), vec2(-.840,-.074), vec2(-.696,.457), vec2(-.203,.621), vec2(.962,-.195), vec2(.473,-.480), vec2(.519,.767), vec2(.185,-.893), vec2(.507,.064), vec2(.896,.412), vec2(-.322,-.933), vec2(-.792,-.598));
  vec3 skyRef(vec3 r){ vec3 top = lin(uTopC), hor = lin(uHorC); return r.y > 0. ? mix(hor, top, pow(clamp(r.y * 1.4, 0., 1.), .7)) : hor * mix(.55, .35, clamp(-r.y * 3., 0., 1.)); }
  void main(){
    gFar = step(85., length(vW - uCam));
    vec3 n = normalize(vN); vec3 v = normalize(uCam - vW); if (dot(n, v) < 0.) n = -n;
    vec3 base; float em = vC.a; int m = int(vM + .5); vec3 wp = vW;
    if (uTex > .5) { vec4 t = texture(uT, vUV); if (t.a < .4) discard; base = lin(t.rgb); em = uTexLight; m = 0; } else base = lin(vC.rgb);
    float spec = uSpec, refl = 0., gloss = 24.;
    if (m == 1) { float g = fbm(wp * vec3(1.6, 1., 1.6)); base *= .78 + .38 * g + step(.985, h3(floor(wp * 30.))) * .3; spec = .05; }
    else if (m == 2) { float g = fbm(wp * .07), f = n3(wp * 2.2); base = mix(base * vec3(.8, .92, .74), base * vec3(1.12, 1.12, .86), g) * (.8 + .32 * f); spec = .02; }
    else if (m == 3) { base *= .88 + .2 * fbm(wp * 1.1); float r = abs(fract(wp.y / .62) - .5); base *= mix(.84, 1., smoothstep(.43, .5, 1. - r)); }
    else if (m == 4) { vec2 uv = vec2(abs(n.x) > abs(n.z) ? wp.z : wp.x, wp.y); uv.x += step(.5, fract(uv.y / .16)) * .11; vec2 b = fract(uv / vec2(.22, .08));
      vec3 pat = (b.x < .08 || b.y < .14) ? base * .55 + vec3(.12) : base * (.78 + .42 * h3(vec3(floor(uv / vec2(.22, .08)), 3.))); base = mix(pat, base * .86, smoothstep(14., 40., length(vW - uCam))); }
    else if (m == 5) { refl = .25 + .7 * pow(1. - max(dot(n, v), 0.), 4.); gloss = 220.; spec = 2.5; base *= .7; if (em > .01) refl *= .2; }
    else if (m == 6) { vec3 q = wp * .25 + vec3(uTime * .3, 0., uTime * .2); n = normalize(n + vec3(n3(q) - .5, 0., n3(q + 7.) - .5) * .35); refl = .3 + .65 * pow(1. - max(dot(n, v), 0.), 4.); gloss = 300.; spec = 3.; }
    else if (m == 7) { base *= .62 + .6 * fbm(wp * 1.7); spec = .04; }
    else if (m == 8) { base *= .78 + .3 * n3(vec3(wp.y * 9., wp.x * .4, wp.z * .4)) + .08 * n3(wp * 3.); }
    else if (m == 9) { vec2 q = fract(wp.xz / .75); float l = min(min(q.x, 1. - q.x), min(q.y, 1. - q.y)); base *= mix(.8, 1., smoothstep(0., .04, l)) * (.9 + .14 * n3(wp * 3.)); }
    else if (m == 10) { spec = 1.2; gloss = 90.; refl = .12 + .3 * pow(1. - max(dot(n, v), 0.), 3.); }
    else if (m == 11) { base *= .9 + .12 * n3(wp * 5.) + .05 * sin(wp.x * .8 + wp.z * .5 + fbm(wp * .15) * 6.); }
    else if (m == 12) { base *= .96 + .06 * n3(wp * 4.); spec = .5; gloss = 60.; }
    else if (m == 13) { float r = fract(wp.y / .28); base *= (.82 + .18 * smoothstep(0., .25, r)) * (.9 + .15 * n3(wp * 2.)); }
    else if (m == 15) { base *= .92 + .1 * n3(wp * 40.); spec = .05; }
    else if (m == 0) { base *= .93 + .1 * n3(wp * 1.7); }
    float sh = 1.;
    vec3 lp = vL.xyz / vL.w * .5 + .5;
    if (uShOn > .5 && lp.x > 0. && lp.x < 1. && lp.y > 0. && lp.y < 1. && lp.z < 1.) {
      float bias = .0008 + .0018 * (1. - abs(dot(n, uSun))); sh = 0.;
      float a = h3(wp * 13.) * 6.283; mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
      for (int i = 0; i < uTaps; i++) sh += texture(uSh, vec3(lp.xy + rot * PD[i] * uTexel * 2.2, lp.z - bias));
      sh /= float(uTaps);
    }
    float ndl = max(dot(n, uSun), 0.);
    float wrap = m == 7 ? max(dot(n, uSun) * .5 + .5, 0.) * .5 : 0.;
    vec3 hemi = mix(uGnd, uSky, n.y * .5 + .5) * (m == 7 ? .9 : 1.);
    vec3 sc = uSunC; if (m == 1 || m == 9 || m == 3 || m == 12) sc = mix(sc, vec3(dot(sc, vec3(.333))), .6) * .9; else if (m == 2) sc = mix(sc, vec3(dot(sc, vec3(.333))), .45);   // v6.2 : soleil couchant moins orangé sur la chaussée
    vec3 col = base * (hemi + sc * (ndl + wrap) * sh);
    vec3 h = normalize(v + uSun);
    col += sc * pow(max(dot(n, h), 0.), gloss) * spec * sh * (gloss > 100. ? 1. : .4);
    if (refl > 0.) col = mix(col, skyRef(reflect(-v, n)) * (m == 5 ? 1.1 : 1.), refl);
    col = mix(col, base * uEmis, em);
    col = vec3(1.) - exp(-col * uExpo);
    col = pow(col, vec3(1. / 2.2));
    float d = length(vW - uCam);
    float f = clamp((d - uFogN) / (uFogF - uFogN), 0., 1.); f = f * f * (3. - 2. * f) * uFogA;
    float sunAmt = pow(max(dot(normalize(vW - uCam), uSun), 0.), 8.);
    o = vec4(mix(col, mix(uFog, vec3(1., .92, .8), sunAmt * .25), f), 1.);
  }`;
  const SVS = `#version 300 es
  layout(location=0) in vec3 aP; uniform mat4 uL, uM; void main(){ gl_Position = uL * uM * vec4(aP,1.); }`;
  const SFS = `#version 300 es
  precision mediump float; out vec4 o; void main(){ o = vec4(1.); }`;
  const KVS = `#version 300 es
  layout(location=0) in vec2 aP; out vec2 vP; void main(){ vP = aP; gl_Position = vec4(aP, .9999, 1.); }`;
  const KFS = `#version 300 es
  precision highp float; in vec2 vP; out vec4 o;
  uniform mat4 uIVP; uniform vec3 uCam, uSunDir, uTop, uMid, uHor, uSunC, uCloud; uniform float uStars, uSunVis, uTime, uClouds, uMoon;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
  float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s += a*n2(p); p *= 2.03; a *= .5; } return s; }
  void main(){
    vec4 p = uIVP * vec4(vP, 1., 1.); vec3 d = normalize(p.xyz / p.w - uCam);
    float y = d.y;
    vec3 c = y > 0. ? mix(uHor, uMid, smoothstep(0., .22, y)) : uHor;
    c = mix(c, uTop, smoothstep(.18, .85, y));
    float sd = max(dot(d, uSunDir), 0.);
    c += uSunC * (pow(sd, 12.) * .35 + pow(sd, 1600.) * 6.) * uSunVis;
    c = mix(c, vec3(.96,.95,.9), uMoon * smoothstep(.9994, .9997, sd));
    if (y > 0.) {
      vec2 cp = d.xz / (y + .12) * 1.4 + vec2(uTime * .01, 0.);
      float cl = smoothstep(.52, .78, fbm(cp)) * uClouds * smoothstep(0., .18, y);
      c = mix(c, uCloud + uSunC * pow(sd, 6.) * .3, cl * .85);
      if (uStars > 0.) { vec3 q = floor(d * 380.); float s = fract(sin(dot(q, vec3(12.9898,78.233,37.719))) * 43758.5453); c += vec3(step(.9975, s) * uStars * (.6 + .4 * sin(uTime * 2. + s * 50.))) * smoothstep(0., .2, y) * (1. - cl);
        c += vec3(.5,.45,.75) * uStars * .12 * smoothstep(.25, 0., abs(dot(d, normalize(vec3(.7,.5,.5))) )) * fbm(d.xz * 8.) ; }
    }
    o = vec4(c, 1.);
  }`;

  function compile(vs, fs) {
    const p = gl.createProgram();
    [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(([t, src]) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); gl.attachShader(p, s); });
    gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
    return { p, u };
  }

  /* v5 : nuages volumétriques doux (sprites face caméra, bruit fractal, mélange alpha) */
  const CVS = `#version 300 es
  layout(location=0) in vec3 aC; layout(location=1) in vec2 aO; layout(location=2) in vec2 aS;
  uniform mat4 uVP; uniform vec3 uR, uU, uCam; out vec2 vO; out float vSeed, vD; out vec3 vW;
  void main(){ vec3 w = aC + uR * aO.x * aS.x + uU * aO.y * aS.x * .62; vO = aO; vSeed = aS.y; vW = w; vD = distance(uCam, aC); gl_Position = uVP * vec4(w, 1.); }`;
  const CFS = `#version 300 es
  precision highp float; in vec2 vO; in float vSeed, vD; in vec3 vW; out vec4 o;
  uniform vec3 uSun, uSunC, uFog, uLow; uniform float uFogN, uFogF, uOp;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
  float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * n(p); p = p * 2.1 + 1.7; a *= .5; } return s; }
  void main(){
    vec2 q = vO; float r = length(q * vec2(1., 1.25));
    float f = fbm(q * 2.2 + vSeed * 13.);
    float a = smoothstep(1., .25, r + (f - .5) * .9) * uOp;
    a *= smoothstep(8., 60., vD);
    if (a < .01) discard;
    float lit = clamp(.45 + .55 * vO.y + (f - .5) * .5 + uSun.y * .2, 0., 1.);
    vec3 c = mix(uLow, vec3(1.), lit) * mix(vec3(1.), uSunC, .25);
    float fog = smoothstep(uFogN, uFogF, vD); c = mix(c, uFog, fog * .85);
    o = vec4(c, a * (1. - fog * .6));
  }`;
  function cloudLayer(puffs) { // puffs : [x, y, z, taille, graine]
    const v = [], idx = []; puffs.forEach((p, k) => { [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([ox, oy]) => v.push(p[0], p[1], p[2], ox, oy, p[3], p[4])); const b = k * 4; idx.push(b, b + 1, b + 2, b, b + 2, b + 3); });
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao); const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 28, 12); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 28, 20);
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(idx), gl.STATIC_DRAW); gl.bindVertexArray(null);
    return { vao, count: idx.length };
  }
  function drawClouds(cam, env, layer, op = 1) {
    const u = progCloud.u, V = M4.inv(M4.lookAt(cam.eye, cam.tgt, [0, 1, 0]));
    gl.useProgram(progCloud.p); gl.uniformMatrix4fv(u.uVP, false, cam.vp); gl.uniform3fv(u.uR, [V[0], V[1], V[2]]); gl.uniform3fv(u.uU, [V[4], V[5], V[6]]); gl.uniform3fv(u.uCam, cam.eye);
    gl.uniform3fv(u.uSun, env.sunDir); gl.uniform3fv(u.uSunC, env.sunCol.map((x) => Math.min(1, x / 3))); gl.uniform3fv(u.uFog, env.fog); gl.uniform3fv(u.uLow, env.cloudLow || [.68, .72, .8]);
    gl.uniform1f(u.uFogN, env.fogN); gl.uniform1f(u.uFogF, env.fogF); gl.uniform1f(u.uOp, op);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    gl.bindVertexArray(layer.vao); gl.drawElements(gl.TRIANGLES, layer.count, gl.UNSIGNED_INT, 0);
    gl.depthMask(true); gl.disable(gl.BLEND); gl.bindVertexArray(null);
  }
  function init(c, opts = {}) {
    canvas = c; gl = c.getContext("webgl2", { antialias: opts.aa !== false, powerPreference: "high-performance", alpha: false, stencil: false });
    if (!gl) return false;
    SHADOW = opts.shadow || 2048; if (opts.taps) Q.taps = opts.taps; if (opts.shadowEvery) Q.shadowEvery = opts.shadowEvery;
    progMain = compile(VS, FS); progShadow = compile(SVS, SFS); progSky = compile(KVS, KFS); progCloud = compile(CVS, CFS);
    shadowTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, shadowTex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, SHADOW, SHADOW);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    shadowFB = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFB); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, shadowTex, 0);
    gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    skyVAO = gl.createVertexArray(); gl.bindVertexArray(skyVAO); const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null);
    return true;
  }

  function mesh(mb) {
    if (!mb.n) return null;
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mb.v), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 44, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 44, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 44, 24);
    gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 1, gl.FLOAT, false, 44, 40);
    gl.vertexAttrib2f(3, 0, 0);
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(mb.i), gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    return { vao, vb, ib, count: mb.i.length, dispose() { gl.deleteBuffer(vb); gl.deleteBuffer(ib); gl.deleteVertexArray(vao); } };
  }

  /* quad texturé (panneaux) : w × h, centré en x, posé en y=0, face +z */
  function texQuad(w, h) {
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const d = new Float32Array([-w / 2, 0, 0, 0, 0, 1, 0, 0, w / 2, 0, 0, 0, 0, 1, 1, 0, w / 2, h, 0, 0, 0, 1, 1, 1, -w / 2, h, 0, 0, 0, 1, 0, 1]);
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 32, 24);
    gl.vertexAttrib4f(2, 1, 1, 1, 0); gl.vertexAttrib1f(4, 0);
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    return { vao, vb, ib, count: 6, dispose() { gl.deleteBuffer(vb); gl.deleteBuffer(ib); gl.deleteVertexArray(vao); } };
  }
  function texture(cnv) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cnv); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    const ext = gl.getExtension("EXT_texture_filter_anisotropic"); if (ext) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 4);
    return t;
  }
  function delTex(t) { gl.deleteTexture(t); }

  /* Une frame complète. items: [{mesh, m, fog, spec, shadow}] · signs: [{q, tex, m, light}] */
  /* true si la boîte b = [x0,x1,y0,y1,z0,z1] (monde) est entièrement hors du volume défini par la matrice vp */
  function outside(vp, b) {
    let l = 0, r = 0, d = 0, u = 0, f = 0, bh = 0;
    for (let i = 0; i < 8; i++) {
      const x = b[i & 1], y = b[2 + ((i >> 1) & 1)], z = b[4 + ((i >> 2) & 1)];
      const cx = vp[0] * x + vp[4] * y + vp[8] * z + vp[12], cy = vp[1] * x + vp[5] * y + vp[9] * z + vp[13], cz = vp[2] * x + vp[6] * y + vp[10] * z + vp[14], cw = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
      if (cx < -cw) l++; if (cx > cw) r++; if (cy < -cw) d++; if (cy > cw) u++; if (cz > cw) f++; if (cz < -cw) bh++;
    }
    return l === 8 || r === 8 || d === 8 || u === 8 || f === 8 || bh === 8;
  }
  function render(cam, env, items, signs, time) {
    const W = canvas.width, H = canvas.height;
    frameNo++;
    // ombres
    const lt = cam.shadowTarget, sd = env.sunDir, R = env.shadowR || 70;
    const lv = M4.lookAt([lt[0] + sd[0] * 220, lt[1] + sd[1] * 220, lt[2] + sd[2] * 220], lt, Math.abs(sd[1]) > .98 ? [0, 0, 1] : [0, 1, 0]);
    let L = M4.mul(M4.ortho(-R, R, -R, R, 20, 480), lv);
    const shadowOn = env.shadows !== false && sd[1] > .05;
    const redo = !lastL || Q.shadowEvery <= 1 || frameNo % Q.shadowEvery === 0 || env.shadowR !== lastL.R;
    if (shadowOn && !redo) L = lastL.L;   // ombre de l'image précédente (mobile) : texture inchangée, même matrice
    if (shadowOn && redo) {
      lastL = { L, R, sd };
      gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFB); gl.viewport(0, 0, SHADOW, SHADOW);
      gl.clear(gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
      gl.useProgram(progShadow.p); gl.uniformMatrix4fv(progShadow.u.uL, false, L);
      for (const it of items) { if (it.shadow === false || !it.mesh || (it.b && !it.m && outside(L, it.b))) continue; gl.uniformMatrix4fv(progShadow.u.uM, false, it.m || IDM); gl.bindVertexArray(it.mesh.vao); gl.drawElements(gl.TRIANGLES, it.mesh.count, gl.UNSIGNED_INT, 0); }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.viewport(0, 0, W, H);
    gl.clearColor(env.fog[0], env.fog[1], env.fog[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // scène
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); gl.disable(gl.CULL_FACE);
    gl.useProgram(progMain.p); const u = progMain.u;
    gl.uniformMatrix4fv(u.uVP, false, cam.vp); gl.uniformMatrix4fv(u.uL, false, L);
    gl.uniform3fv(u.uSun, env.sunDir); gl.uniform3fv(u.uSunC, env.sunCol); gl.uniform3fv(u.uSky, env.hemiSky); gl.uniform3fv(u.uGnd, env.hemiGnd);
    gl.uniform3fv(u.uFog, env.fog); gl.uniform3fv(u.uCam, cam.eye); gl.uniform1f(u.uFogN, env.fogN); gl.uniform1f(u.uFogF, env.fogF);
    gl.uniform1f(u.uEmis, env.emis); gl.uniform1f(u.uExpo, env.expo); gl.uniform3fv(u.uTopC, env.skyTop); gl.uniform3fv(u.uHorC, env.skyHor); gl.uniform1f(u.uTime, time); gl.uniform1f(u.uShOn, shadowOn ? 1 : 0); gl.uniform1f(u.uTexel, 1 / SHADOW); gl.uniform1i(u.uTaps, Q.taps);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, shadowTex); gl.uniform1i(u.uSh, 0); gl.uniform1i(u.uT, 1);
    gl.uniform1f(u.uTex, 0);
    for (const it of items) {
      if (!it.mesh || (it.b && !it.m && outside(cam.vp, it.b))) continue;
      gl.uniformMatrix4fv(u.uM, false, it.m || IDM); gl.uniform1f(u.uFogA, it.fog ?? 1); gl.uniform1f(u.uSpec, it.spec ?? .12);
      gl.bindVertexArray(it.mesh.vao); gl.drawElements(gl.TRIANGLES, it.mesh.count, gl.UNSIGNED_INT, 0);
    }
    gl.uniform1f(u.uTex, 1); gl.uniform1f(u.uSpec, .05); gl.uniform1f(u.uFogA, 1); gl.activeTexture(gl.TEXTURE1);
    for (const s of signs) {
      gl.bindTexture(gl.TEXTURE_2D, s.tex); gl.uniformMatrix4fv(u.uM, false, s.m); gl.uniform1f(u.uTexLight, s.light ?? 0);
      gl.bindVertexArray(s.q.vao); gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
    }
    gl.activeTexture(gl.TEXTURE0);
    // ciel (v6.49 : après la scène, test de profondeur : seuls les pixels non couverts sont calculés)
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(false); gl.disable(gl.CULL_FACE); gl.useProgram(progSky.p); const su = progSky.u;
    gl.uniformMatrix4fv(su.uIVP, false, M4.inv(cam.vp)); gl.uniform3fv(su.uCam, cam.eye); gl.uniform3fv(su.uSunDir, env.sunDir);
    gl.uniform3fv(su.uTop, env.skyTop); gl.uniform3fv(su.uMid, env.skyMid); gl.uniform3fv(su.uHor, env.skyHor); gl.uniform3fv(su.uSunC, env.sunGlow); gl.uniform3fv(su.uCloud, env.cloud);
    gl.uniform1f(su.uStars, env.stars); gl.uniform1f(su.uSunVis, env.sunVis); gl.uniform1f(su.uTime, time); gl.uniform1f(su.uClouds, env.clouds); gl.uniform1f(su.uMoon, env.moon || 0);
    gl.bindVertexArray(skyVAO); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.depthMask(true); gl.depthFunc(gl.LESS);
    gl.bindVertexArray(null);
  }
  const IDM = M4.id();

  return { init, setQuality(o) { Object.assign(Q, o); }, mesh, texQuad, texture, delTex, render, cloudLayer, drawClouds, get gl() { return gl; } };
})();

/* ---------- Textes en texture ---------- */
function textCanvas(lines, o = {}) {
  const w = o.w || 1024, h = o.h || 256, c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = o.bg || "#1d5fbf"; if (o.round) { g.beginPath(); g.roundRect(0, 0, w, h, o.round); g.fill(); } else g.fillRect(0, 0, w, h);
  if (o.border) { g.strokeStyle = o.border; g.lineWidth = o.bw || h * .06; const i = g.lineWidth / 2 + (o.inset || h * .05); g.beginPath(); g.roundRect(i, i, w - i * 2, h - i * 2, o.round ? o.round * .7 : 4); g.stroke(); }
  g.fillStyle = o.fg || "#ffffff"; g.textAlign = "center"; g.textBaseline = "middle";
  const n = lines.length;
  lines.forEach((t, i) => {
    let size = (o.size || .5) * h / (n > 1 ? n * .85 : 1) * (i === 0 ? 1 : (o.sub || .62));
    const font = (s) => `${o.weight || 800} ${s}px ${o.font || "'Bricolage Grotesque', 'Avenir Next', 'Segoe UI', sans-serif"}`;
    g.font = font(size); const mw = w * (o.fit || .9); const tw = g.measureText(t).width; if (tw > mw) { size *= mw / tw; g.font = font(size); }
    const y = n === 1 ? h / 2 : h * (.5 + (i - (n - 1) / 2) * (.78 / n) * (i === 0 ? 1 : 1.05));
    g.fillStyle = i === 0 ? (o.fg || "#fff") : (o.fg2 || o.fg || "#fff"); g.fillText(t, w / 2, y + h * .02);
  });
  return c;
}
