/* ==========================================================================
   Modèles Blender (v4) : chargement des fichiers .glb exportés depuis Blender
   et « tamponnage » de leurs maillages dans les tronçons du moteur.
   Si un modèle manque, le décor procédural de la v3 prend le relais.
   ========================================================================== */

const TPL = {};
const MODEL_FILES = ["models/rider.glb", "models/kit_batiments.glb", "models/kit_nature.glb", "models/kit_monuments.glb", "models/people.glb", "models/kit_faune.glb"];

/* --- lecture d'un .glb (glTF binaire) --- */
function parseGLB(buf, fileKey) {
  const dv = new DataView(buf); if (dv.getUint32(0, true) !== 0x46546c67) throw new Error("glb invalide");
  let off = 12, json = null, bin = null;
  while (off < buf.byteLength) { const len = dv.getUint32(off, true), type = dv.getUint32(off + 4, true); if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, off + 8, len))); else if (type === 0x004e4942) bin = buf.slice(off + 8, off + 8 + len); off += 8 + len; }
  const acc = (i) => { const a = json.accessors[i], bv = json.bufferViews[a.bufferView], o = (bv.byteOffset || 0) + (a.byteOffset || 0), n = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
    const C = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array }[a.componentType];
    if (bv.byteStride && bv.byteStride !== n * C.BYTES_PER_ELEMENT) { const out = new C(a.count * n), src = new C(bin, (bv.byteOffset || 0), bv.byteLength / C.BYTES_PER_ELEMENT), st = bv.byteStride / C.BYTES_PER_ELEMENT, base = (a.byteOffset || 0) / C.BYTES_PER_ELEMENT; for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) out[k * n + c] = src[base + k * st + c]; return out; }
    return new C(bin.slice(o, o + a.count * n * C.BYTES_PER_ELEMENT)); };
  const mats = (json.materials || []).map((m) => {
    const pb = m.pbrMetallicRoughness || {}, c = pb.baseColorFactor || [1, 1, 1, 1], e = m.emissiveFactor || [0, 0, 0], es = (m.extensions && m.extensions.KHR_materials_emissive_strength) ? m.extensions.KHR_materials_emissive_strength.emissiveStrength : 1;
    const toS = (x) => (x <= .0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - .055);
    return { name: (m.name || "").replace(/^v4_/, ""), col: [toS(c[0]), toS(c[1]), toS(c[2])], emit: Math.max(e[0], e[1], e[2]) * es > .05, metal: pb.metallicFactor ?? 0, rough: pb.roughnessFactor ?? .5 };
  });
  const nodeM = (n) => { if (n.matrix) return new Float32Array(n.matrix); const [qx, qy, qz, qw] = n.rotation || [0, 0, 0, 1], [sx, sy, sz] = n.scale || [1, 1, 1], [tx, ty, tz] = n.translation || [0, 0, 0];
    const m = new Float32Array(16); m[0] = (1 - 2 * (qy * qy + qz * qz)) * sx; m[1] = 2 * (qx * qy + qz * qw) * sx; m[2] = 2 * (qx * qz - qy * qw) * sx; m[4] = 2 * (qx * qy - qz * qw) * sy; m[5] = (1 - 2 * (qx * qx + qz * qz)) * sy; m[6] = 2 * (qy * qz + qx * qw) * sy; m[8] = 2 * (qx * qz + qy * qw) * sz; m[9] = 2 * (qy * qz - qx * qw) * sz; m[10] = (1 - 2 * (qx * qx + qy * qy)) * sz; m[12] = tx; m[13] = ty; m[14] = tz; m[15] = 1; return m; };
  const prims = (n) => { if (n.mesh == null) return []; const M = nodeM(n), N = nmat(M);
    return json.meshes[n.mesh].primitives.map((p) => { const P = acc(p.attributes.POSITION), Nn = p.attributes.NORMAL != null ? acc(p.attributes.NORMAL) : null, I = p.indices != null ? acc(p.indices) : null;
      const pos = new Float32Array(P.length), nor = new Float32Array(P.length);
      for (let i = 0; i < P.length; i += 3) { const q = tp(M, P[i], P[i + 1], P[i + 2]); pos[i] = q[0]; pos[i + 1] = q[1]; pos[i + 2] = q[2]; const w = Nn ? tn(N, Nn[i], Nn[i + 1], Nn[i + 2]) : [0, 1, 0]; nor[i] = w[0]; nor[i + 1] = w[1]; nor[i + 2] = w[2]; }
      return { pos, nor, idx: I || Uint32Array.from({ length: P.length / 3 }, (_, i) => i), mat: mats[p.material] || { name: "", col: [.8, .8, .8] } }; }); };
  const box = (ps) => { const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; ps.forEach((p) => { for (let i = 0; i < p.pos.length; i += 3) for (let c = 0; c < 3; c++) { mn[c] = Math.min(mn[c], p.pos[i + c]); mx[c] = Math.max(mx[c], p.pos[i + c]); } }); return { mn, mx }; };
  const skip = (n) => !n.name || /^(Cube|SOL_|PreviewCam|Light|Camera)/.test(n.name) || n.mesh == null;
  if (fileKey === "rider") { const ps = json.nodes.filter((n) => !skip(n)).flatMap(prims); TPL.rider = { prims: ps, ...box(ps) }; return; }
  /* v6 : sur les bâtiments, les grandes faces planes héritaient de normales lissées (murs « bombés »).
     Les triangles dont une normale s'écarte de plus de ~20° de la face reçoivent la normale plate. */
  const flatten = (p) => {
    const P = p.pos, I = p.idx, nor = p.nor, pos2 = [], nor2 = [], idx2 = [], keep = new Map(); let nv = P.length / 3;
    const outP = Array.from(P), outN = Array.from(nor), outI = [];
    for (let t = 0; t < I.length; t += 3) {
      const a = I[t], b = I[t + 1], c = I[t + 2];
      const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2], vx = P[c * 3] - P[a * 3], vy = P[c * 3 + 1] - P[a * 3 + 1], vz = P[c * 3 + 2] - P[a * 3 + 2];
      let fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx; const l = Math.hypot(fx, fy, fz); if (l < 1e-12) { outI.push(a, b, c); continue; }
      fx /= l; fy /= l; fz /= l;
      let bad = false; for (const k of [a, b, c]) if (nor[k * 3] * fx + nor[k * 3 + 1] * fy + nor[k * 3 + 2] * fz < .94) bad = true;
      if (!bad) { outI.push(a, b, c); continue; }
      for (const k of [a, b, c]) { outP.push(P[k * 3], P[k * 3 + 1], P[k * 3 + 2]); outN.push(fx, fy, fz); outI.push(nv++); }
    }
    p.pos = Float32Array.from(outP); p.nor = Float32Array.from(outN); p.idx = Uint32Array.from(outI); return p;
  };
  json.nodes.forEach((n) => { if (skip(n)) return; let ps = prims(n); if (fileKey === "kit_batiments") ps = ps.map(flatten); const g = n.name.split("__")[0]; // « personne__partie » : regroupé en un seul modèle
    if (TPL[g] && n.name.includes("__")) { TPL[g].prims.push(...ps); Object.assign(TPL[g], box(TPL[g].prims)); } else TPL[g] = { prims: ps, ...box(ps) }; });
}
async function loadModels(base = "") {
  const res = await Promise.allSettled(MODEL_FILES.map(async (f) => {
    const key = f.split("/").pop().replace(".glb", ""), emb = window.EMBED_GLB && window.EMBED_GLB[key];
    let buf;
    if (emb) { const bin = atob(emb), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); buf = u.buffer; } // version publiée en un seul fichier
    else if (window.GLB_SUFFIX) { const r = await fetch(base + f + window.GLB_SUFFIX); if (!r.ok) throw new Error(f); const bin = atob((await r.text()).trim()), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); buf = u.buffer; } // publié : fichiers texte base64
    else { const r = await fetch(base + f); if (!r.ok) throw new Error(f); buf = await r.arrayBuffer(); }
    parseGLB(buf, key);
  }));
  return res.filter((x) => x.status === "fulfilled").length;
}

/* --- matières : le nom de la matière Blender choisit le rendu du shader --- */
function matKind(name) {
  const n = name;
  if (/verre|vitre|vitrine|hublot|hall_lumiere|shoji|garde_corps/.test(n)) return MAT.glass;
  if (/eau/.test(n)) return MAT.water;
  if (/brique/.test(n)) return MAT.brick;
  if (/pierre|joint|corniche|soubassement|rempart/.test(n)) return MAT.stone;
  if (/toit|tuile|ardoise/.test(n)) return MAT.roof;
  if (/feuillage|palme|rosette|cactus|buisson|touffe|coeur/.test(n)) return MAT.leaf;
  if (/neige/.test(n)) return MAT.snow;
  if (/sable|roche/.test(n)) return MAT.sand;
  if (/bois|menuiserie|ecorce|tronc|anneau|plancher|volet|lattis|clin|banc/.test(n)) return MAT.wood;
  if (/metal|chrome|alu|fonte|fer|dentelle|^or$|laque|peinture|fuselage|reacteur|aile|derive|jante|coque_opera/.test(n)) return MAT.metal;
  if (/veste|jean|toile|noren|sac|selle|cheveux/.test(n)) return MAT.cloth;
  return MAT.plain;
}
const ALWAYS_LIT = /neon|feu_|ampoule|phare|lanterne/, NIGHT_LIT = /verre_lumiere|lampe_verre|vitrine_lumiere|hall_lumiere/;

/* --- tamponne un modèle dans un maillage : M = repère monde --- */
function stampM(mb, name, M, amb, ao) {
  const t = TPL[name]; if (!t) return false;
  const N = nmat(M), lit = amb ? (amb.night || (amb.lit || 0) > .15) : true;
  for (const p of t.prims) {
    const m = p.mat; mb.mat = matKind(m.name); if (name === "bourse" && mb.mat === MAT.water) continue;   // v6.3 : le miroir d'eau du modèle (110 m) recouvrait la route jusqu'à Paris
    const e = m.emit && (ALWAYS_LIT.test(m.name) || (NIGHT_LIT.test(m.name) && lit)) ? 1 : 0;
    let col = e || !NIGHT_LIT.test(m.name) || lit ? m.col : hex("#2c3846");
    if (e && /vitrine_lumiere|hall_lumiere/.test(m.name)) col = [col[0] * .55, col[1] * .5, col[2] * .45];
    mb.aoY = ao;
    const base = mb.n;
    const cl = name === "terminal" ? 96 : 1e9;
    const stoop = /^brownstone/.test(name) && m.name === "pierre_brune";   // v6.5 : perron modélisé à l'envers (la marche la plus haute dépassait le plus)
    const glassIn = /^residence/.test(name) && m.name === "verre_bleu";   // v6.6 : le vitrage est rentré de 45 cm, il scintillait contre le béton
    if (glassIn) { mb.mat = MAT.plain; col = [col[0] * .62, col[1] * .7, col[2] * .78]; }   // v6.5 : les flancs de la tour faisaient un damier   // v6.4 : les ailes du terminal faisaient 711 m (étoile blanche qui gâchait la vue aérienne)
    for (let i = 0; i < p.pos.length; i += 3) mb.vert(tp(M, glassIn ? p.pos[i] * .95 : Math.max(-cl, Math.min(cl, p.pos[i])), p.pos[i + 1], stoop && p.pos[i] < -1.9 && p.pos[i + 1] < 1.83 && p.pos[i + 2] > 7.0 ? 16.76 - p.pos[i + 2] : glassIn ? p.pos[i + 2] * .96 : p.pos[i + 2]), tn(N, p.nor[i], p.nor[i + 1], p.nor[i + 2]), col, e);
    for (let i = 0; i < p.idx.length; i++) mb.i.push(base + p.idx[i]);
  }
  mb.mat = 0; return true;
}
function stampTpl(L, name, x, y, z, ry = 0, s = 1, amb) { return stampM(L.mb, name, M4.mul(L.M, M4.trs(x, y, z, ry, 0, 0, s, s, s)), amb, L.ao); }

/* --- correspondances style de ville → modèles Blender --- */
const TPL_BLD = { haussmann: ["haussmann_a", "haussmann_b"], bordeaux: ["bordeaux_a", "bordeaux_b"], brownstone: ["brownstone_a", "brownstone_b"], tower: ["tour_a", "tour_b"], victorian: ["victorienne_a", "victorienne_b"], stucco: ["stucco_a", "stucco_b"], tokyo: ["tokyo_a", "tokyo_b"], machiya: ["machiya_a", "machiya_b"], nara: ["machiya_a", "machiya_b"], osaka: ["osaka_a", "osaka_b", "tokyo_a"], snow: ["maison_neige_a", "maison_neige_b"], terrace: ["terrace_a", "terrace_b"], queenslander: ["queenslander_a", "queenslander_b"], modern: ["moderne_a", "moderne_b"], highrise: ["residence_a", "residence_b"], colonial: ["colonial_a", "colonial_b"], casino: ["casino_a", "casino_b"] };
function tplBuilding(type, r) {
  const list = (TPL_BLD[type] || []).filter((n) => TPL[n]); if (!list.length) return null;
  const name = list[Math.floor(r() * list.length)], t = TPL[name];
  return { name, w: t.mx[0] - t.mn[0] + .4, d: t.mx[2] - t.mn[2] };
}
const TPL_PROP = { tree: ["arbre_a", "arbre_b"], plane: ["platane_a", "platane_b"], cherry: ["cerisier_a", "cerisier_b"], jacaranda: ["jacaranda_a"], cypress: ["cypres_a"], palm: ["palmier_a", "palmier_b"], gum: ["eucalyptus_a"], quiver: ["carquois_a"], acacia: ["acacia_a"], deadtree: ["arbre_mort_a"], cactus: ["cactus_a"], rock: ["rocher_a"], spinifex: ["touffe_a"], shrub: ["buisson_a"], parisLamp: ["lampadaire_paris"], lamp: ["lampadaire_moderne"], lantern: ["lanterne_japon"], stoneLantern: ["lanterne_pierre"], bench: ["banc"], vending: ["distributeur"], deer: ["cerf"] };

function applyTemplates() {
  const ok = (n) => !!TPL[n];
  // végétation et mobilier
  for (const [k, names] of Object.entries(TPL_PROP)) {
    const list = names.filter(ok); if (!list.length || !PROP[k]) continue; const orig = PROP[k];
    PROP[k] = function (L, x, z, r, arg4, arg5) {
      let n = list[Math.floor(r() * list.length)]; if (k === "pine" && arg4 && ok("pin_neige_a")) n = "pin_neige_a";
      const turn = /lampadaire|lanterne|distributeur|banc|cerf/.test(n) ? 0 : r() * Math.PI * 2, sc = typeof arg4 === "number" && k === "tree" ? arg4 : (/arbre|platane|cerisier|jacaranda|palmier|eucalyptus|pin|cypres/.test(n) ? .85 + r() * .3 : 1);
      return stampTpl(L, n, x, 0, z, turn, sc, typeof arg4 === "object" ? arg4 : null) || orig.apply(this, arguments);
    };
  }
  if (ok("pin_a")) { const orig = PROP.pine; PROP.pine = (L, x, z, r, snow) => stampTpl(L, snow && ok("pin_neige_a") ? "pin_neige_a" : "pin_a", x, 0, z, r() * 6.28, .9 + r() * .3) || orig(L, x, z, r, snow); }
  if (ok("panneau_pub")) { const orig = PROP.billboard; PROP.billboard = (L, x, z, signs, txt, col) => { L.mt(MAT.stone); L.box(x, 0, z, 7, .3, 1.8, "#8d8f93"); L.cyl(x - 2.5, 0, z, .3, 1.2, 8, "#7a7d82"); L.cyl(x + 2.5, 0, z, .3, 1.2, 8, "#7a7d82"); stampTpl(L, "panneau_pub", x, -2.7, z, 0, 1); signs.push({ L, x, y: 3.5, z: z + .04, w: 7, h: 3.2, lines: [txt], o: { bg: col, fg: "#14121c", font: "'Martian Mono', ui-monospace, monospace", size: .6 }, light: .25 }); }; }
  // bâtiments de silhouette (arrière-plan) et terminal
  if (ok("tour_a")) { const orig = BLD.tower; BLD.tower = (L, w, d, r, a, hMin, hMax) => { const low = hMax && hMax < 40; if (low) return orig(L, w, d, r, a, hMin, hMax); stampTpl(L, r() < .5 ? "tour_a" : "tour_b", 0, 0, 0, 0, Math.max(.4, ((hMin || 50) + r() * ((hMax || 140) - (hMin || 50))) / 110), a); return 100; }; }
  if (ok("terminal")) BLD.terminal = (L, w, d, r, a) => (stampTpl(L, "terminal", 0, 0, 0, 0, w / 150, a), 14);
  if (ok("tour_controle")) { window.controlTower = (L) => stampTpl(L, "tour_controle", 0, 0, 0, 0, 1); }
  if (ok("avion")) { window.plane3D = (mb, fr, r, scale = 1) => stampM(mb, "avion", M4.trs(fr.p[0], (fr.f ? fr.f.p[1] : fr.p[1]), fr.p[2], fr.ry + Math.PI / 2, 0, 0, scale, scale, scale), null, null); }
  if (ok("torii")) { window.torii = (sec, s, mb) => { const fr = frameAt(NET.ring, s, 0, 0, "back"); stampTpl(new Loc(mb, fr.p, fr.ry), "torii", 0, 0, 0, 0, 1); }; }
  // monuments
  const LM = LANDMARK;
  if (ok("eiffel")) LM.paris.build = ((orig) => function (sec, a, mb, bg, r, signs) { const o = far(sec, .72, -50 * NET.inSide), EL = new Loc(mb, o.p, o.ry); stampTpl(EL, "eiffel", 0, 0, 0, Math.PI / 4, .72, a);   // v6.10 : la tour au premier plan, sur une esplanade
    EL.mt(MAT.paving); EL.box(0, -2, 0, 46, 2.06, 46, "#cfc7b6"); EL.mt(MAT.grass); [-1, 1].forEach((k) => EL.box(k * 17, .06, 0, 9, .05, 40, "#6f9a4c")); EL.mt(MAT.plain);
    const sc = far(sec, .3, 240), SC = new Loc(bg, sc.p, sc.ry); SC.cyl(0, 30, 0, 14, 18, 12, "#efe9de"); SC.sph(0, 48, 0, 14, 16, 14, "#f2ede4"); SC.box(0, 0, 0, 60, 32, 30, "#e9e2d4"); })(LM.paris.build);
  if (ok("bourse")) LM.bordeaux.build = function (sec, a, mb) { const o = far(sec, .24, 48); const BL = new Loc(mb, o.p, o.ry, 1, false); stampTpl(BL, "bourse", 0, 0, 0, 0, 1, a); BL.mt(MAT.paving); BL.box(0, -1.2, 25, 38, 1.3, 20, "#cfc6b4"); BL.mt(MAT.water); BL.box(0, .1, 25, 35, .04, 17, "#182430"); BL.mt(MAT.plain); };
  if (ok("pagode")) LM.kyoto.build = function (sec, a, mb, bg) { [.26, .88].forEach((t) => torii(sec, sec.start + sec.len * t, mb)); const o = far(sec, .78, -46); stampTpl(new Loc(mb, o.p, o.ry), "pagode", 0, 0, 0, 0, 1, a); fuji(sec, bg, 1, .5); };
  if (ok("tour_tokyo")) LM.tokyo.build = function (sec, a, mb, bg) { const o = far(sec, .7, 260); stampTpl(new Loc(bg, o.p, o.ry), "tour_tokyo", 0, 0, 0, 0, 1, a); fuji(sec, bg, -1, .3); };
  if (ok("chateau_osaka")) LM.osaka.build = function (sec, a, mb, bg) { const o = far(sec, .6, -260); stampTpl(new Loc(bg, o.p, o.ry), "chateau_osaka", 0, 0, 0, 0, 1, a); };
  if (ok("opera")) LM.sydney.build = ((orig) => function (sec, a, mb, bg, r, signs) { orig.call(this, sec, a, new MB(), bg, r, signs); beachKit(sec, mb, r, null, 0, [.38, .8]); const o = far(sec, .58, -52 * NET.inSide), yy = NET.ring.at(sec.start + sec.len * .58).p[1], OL = new Loc(mb, [o.p[0], yy, o.p[2]], o.ry); OL.mt(MAT.paving); OL.box(0, -6, 0, 62, 6.5, 44, "#d9cdb6"); OL.box(0, -6, 26, 18, 6.3, 12, "#d9cdb6"); OL.mt(MAT.plain); stampTpl(OL, "opera", 0, .5, 0, Math.PI / 2, .5, a);   /* v6.10 : l'Opéra au premier plan, sur son quai */ })(function (sec, a, mb, bg, r) {
    if (mb.v.length > 0 || true) { /* plage */ }
    /* v5 : Harbour Bridge en arc continu (membrures lisses, suspentes accrochées au tablier) */
    const b = far(sec, .85, -600), B = new Loc(bg, [b.p[0], 0, b.p[2]], b.ry + Math.PI / 2), N = 32, DECK = 48, col = "#7d858d";
    const top = (t) => 136 * (1 - t * t) + 6, bot = (t) => 118 * (1 - t * t);
    for (const z of [-12, 12]) for (let i = 0; i < N; i++) {
      const t0 = i / N * 2 - 1, t1 = (i + 1) / N * 2 - 1;
      segment(bg, B.w(t0 * 250, top(t0), z), B.w(t1 * 250, top(t1), z), 2.2, col, 6);
      segment(bg, B.w(t0 * 250, bot(t0), z), B.w(t1 * 250, bot(t1), z), 2.6, col, 6);
      segment(bg, B.w(t0 * 250, top(t0), z), B.w(t1 * 250, bot(t1), z), .9, col, 4);
      if (bot(t0) > DECK + 3 && i % 2 === 0) segment(bg, B.w(t0 * 250, DECK + 1, z), B.w(t0 * 250, bot(t0), z), .6, "#9aa1a8", 4);
    }
    for (let i = 2; i < N - 1; i += 3) { const t = i / N * 2 - 1; segment(bg, B.w(t * 250, top(t), -12), B.w(t * 250, top(t), 12), .8, col, 4); }
    B.box(0, DECK - 2.5, 0, 600, 3, 30, "#8a929a");
    [-262, 262].forEach((x) => B.box(x, 0, 0, 26, 92, 42, "#c9bfae")); });
  if (false && ok("uluru")) LM.uluru.build =   /* v6.6 : rocher procédural, plus proche et lisible (world.js) */ function (sec, a, mb, bg) { const o = far(sec, .55, -460); stampTpl(new Loc(bg, o.p, o.ry), "uluru", 0, -8, 0, 0, 1, a); };
  if (ok("dune")) LM.sossusvlei.build = function (sec, a, mb, bg, r) { for (let i = 0; i < 6; i++) { const sd = i % 2 ? 1 : -1, o = far(sec, i / 6 + .05, sd * (230 + r() * 260)); stampTpl(new Loc(bg, o.p, o.ry), "dune", 0, -4, 0, r() * 6.28, .7 + r() * .6, a); } };
}
