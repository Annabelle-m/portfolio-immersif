/* ==========================================================================
   Cinématique de vol en 3D (v5) : aéroport de Bordeaux modélisé (terminal,
   tour, avions Blender), campagne et vignes, Garonne, traversée d'une couche
   de nuages volumétriques, puis approche avec le monument du pays d'arrivée.
   Environ 6 secondes, interruptible (Échap / bouton « Passer »).
   ========================================================================== */

const Flight3D = (() => {
  let canvas, scene = null, plane = null, raf = 0, t0 = 0, dur = 6000, opts = null, done = null, withTpl = false;
  const dest = {}, cam = { eye: [0, 0, 0], tgt: [0, 0, 0], vp: null, shadowTarget: [0, 0, 0] };
  const hasT = (n) => typeof TPL !== "undefined" && TPL[n];

  function build() {
    withTpl = !!hasT("avion");
    const mb = new MB(), far = new MB(), r = rng(99);
    // sol : grande plaine, puis mosaïque de parcelles (prés, blés, vignes)
    mb.mat = MAT.grass; mb.aoY = null; mb.B(3000, -.5, 0, 16000, .5, 12000, 0, "#71864f");
    const field = ["#8a9a52", "#a8a25a", "#6f8a48", "#b59b62", "#5f7a44", "#9aa865", "#7b6b48"];
    for (let gx = -2400; gx < 9000; gx += 170) for (let gz = -3400; gz < 3400; gz += 150) {
      if (Math.abs(gz) < 260 && gx > -700 && gx < 3800) continue; // emprise de l'aéroport
      const w = 120 + r() * 60, d = 100 + r() * 60, c = field[Math.floor(r() * field.length)], y = .02 + r() * .02;
      const L = new Loc(mb, [gx + r() * 30, y, gz + r() * 30], (r() - .5) * .25); L.mt(MAT.grass); L.box(0, 0, 0, w, .02, d, c);
      if (r() < .22) { L.mt(MAT.leaf); for (let k = -d / 2 + 6; k < d / 2 - 4; k += 6) L.box(0, .02, k, w - 10, .9, 1.6, "#4d6a35"); } // rangs de vigne
    }
    // la Garonne
    mb.mat = MAT.water; let pz = -1500;
    for (let x = -2400; x < 9000; x += 60) { const z0 = -1500 + 260 * Math.sin(x / 700) + 120 * Math.sin(x / 260), z1 = -1500 + 260 * Math.sin((x + 60) / 700) + 120 * Math.sin((x + 60) / 260); mb.quad([x, .06, z0 - 55], [x, .06, z0 + 55], [x + 60, .06, z1 + 55], [x + 60, .06, z1 - 55], "#3f6f86"); pz = z0; }
    // bosquets et forêts de pins (silhouettes au loin)
    for (let i = 0; i < 520; i++) { const x = -2200 + r() * 11000, z = (r() < .5 ? -1 : 1) * (320 + r() * 3000); if (Math.abs(z + 1500) < 120) continue; far.mat = MAT.leaf; far.S(x, 6 + r() * 4, z, 7 + r() * 6, 7 + r() * 5, 7 + r() * 6, pickR(r, ["#3f5a2e", "#4b6a34", "#56733a"]), 0, 8, 6); far.mat = MAT.wood; far.B(x, 0, z, 1, 6, 1, 0, "#4a3726"); }
    // villages
    for (let v = 0; v < 9; v++) { const cx = -1500 + r() * 9000, cz = (r() < .5 ? -1 : 1) * (700 + r() * 2200); for (let k = 0; k < 26; k++) { const L = new Loc(far, [cx + (r() - .5) * 220, 0, cz + (r() - .5) * 160], r() * 6); L.mt(MAT.stone); L.box(0, 0, 0, 9 + r() * 8, 6 + r() * 5, 8 + r() * 6, pickR(r, ["#e8dcc4", "#e2d2b4", "#d9c9ab"])); L.mt(MAT.roof); L.box(0, 8, 0, 11 + r() * 6, 1.6, 9 + r() * 4, pickR(r, ["#b0583a", "#a24f34", "#9c5b40"])); } }
    // piste, voies de circulation, balisage
    mb.mat = MAT.asphalt; mb.B(1500, 0, 0, 4200, .06, 60, 0, "#3a3d42"); mb.B(1500, 0, -120, 3800, .05, 24, 0, "#45484d");   // v6.5 : piste prolongée, l'avion se posait dans l'herbe
    for (let x = -300; x < 3500; x += 400) mb.B(x, 0, -60, 24, .05, 120, 0, "#45484d");
    mb.mat = MAT.plain;
    for (let x = -300; x < 3500; x += 40) mb.B(x, .07, 0, 18, .02, 1.4, 0, "#ececec");
    for (let x = -300; x < 3500; x += 60) [-28, 28].forEach((z) => mb.B(x, .07, z, 2, .02, .6, 0, "#e8e8e8"));
    for (let x = -460; x < 3600; x += 30) [-31, 31].forEach((z) => mb.S(x, .25, z, .25, .25, .25, x < -300 || x > 3480 ? "#ff5a4a" : "#ffe6a8", 1, 6, 4));
    // terminal, tour, avions au contact, hangars
    const term = new Loc(mb, [150, 0, -260], 0); BLD.terminal(term, 300, 40, r, AMB3.airport);
    controlTower(new Loc(mb, [460, 0, -200], 0));
    if (withTpl) [[-40, -205], [60, -205], [160, -205], [260, -205]].forEach(([x, z]) => stampM(mb, "avion", M4.trs(x, 0, z, Math.PI, 0, 0, .85, .85, .85), null, null));
    for (let i = 0; i < 4; i++) { const L = new Loc(mb, [760 + i * 95, 0, -230], 0); L.mt(MAT.metal); L.box(0, 0, 0, 80, 22, 60, "#c9ced3"); L.box(0, 22, 0, 80, 3, 60, "#b4bac0"); }
    // arbres au bord de l'aéroport (modèles Blender si disponibles)
    for (let i = 0; i < 70; i++) { const x = -400 + r() * 3600, z = (r() < .5 ? -1 : 1) * (300 + r() * 400); PROP.tree(new Loc(mb, [x, 0, z], 0), 0, 0, r, 1 + r()); }
    // ville au loin (Bordeaux)
    for (let k = 0; k < 160; k++) { const L = new Loc(far, [1700 + r() * 1300, 0, -1900 - r() * 700], 0); L.mt(MAT.stone); L.box(0, 0, 0, 18 + r() * 20, 12 + r() * 14, 16 + r() * 16, pickR(r, ["#e6dac2", "#ddd0b6", "#efe6d4"])); }
    // nuages : couche continue + cumulus isolés que l'avion traverse
    const puffs = [];
    for (let i = 0; i < 300; i++) { const x = 600 + r() * 5200, z = (r() - .5) * 2200, y = 212 + r() * 22, R = 45 + r() * 60; for (let k = 0; k < 6; k++) puffs.push([x + (r() - .5) * R * 2.6, y + (r() - .5) * R * .35, z + (r() - .5) * R * 2.6, R * (.7 + r() * .6), r()]); }
    for (let i = 0; i < 60; i++) { const x = 300 + r() * 1500, z = (r() - .5) * 900, y = 110 + r() * 80, R = 22 + r() * 26; for (let k = 0; k < 5; k++) puffs.push([x + (r() - .5) * R * 2, y + (r() - .5) * R * .5, z + (r() - .5) * R * 2, R * (.7 + r() * .5), r()]); }
    const pm = new MB(); planeHD(pm);
    scene = { ground: GLR.mesh(mb), far: GLR.mesh(far), clouds: GLR.cloudLayer(puffs) }; plane = GLR.mesh(pm);
  }
  /* v6.10 : avion de ligne détaillé (fuselage profilé, ailes en flèche à winglets, réacteurs, hublots, livrée) */
  function planeHD(mb) {
    const L = new Loc(mb, [0, 0, 0], Math.PI / 2), W = "#f4f5f7", G = "#c9ced6", NAVY = "#1f2f5a", AMB = "#f6b93b", DK = "#161d28", Y = 3.3, R = 2.05;
    const slab = (pts, th, col) => { const T = pts.map((p) => L.w(p[0], p[1], p[2])), B = pts.map((p) => L.w(p[0], p[1] - th, p[2])); mb.aoY = null;
      mb.quad(T[0], T[1], T[2], T[3], col); mb.quad(T[3], T[2], T[1], T[0], col); mb.quad(B[0], B[1], B[2], B[3], col); mb.quad(B[3], B[2], B[1], B[0], col);
      for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; mb.quad(T[i], T[j], B[j], B[i], col); mb.quad(B[i], B[j], T[j], T[i], col); } };
    L.mt(MAT.plain);
    // fuselage : tube, nez ogival, cône de queue relevé
    L.cyl(0, Y, -15, R, 30, 24, W, 0, 1, Math.PI / 2);
    // v6.30 : nez ogival fait de tronçons de cône qui partagent les 24 arêtes du fuselage (l'ancienne sphère aux pôles verticaux laissait une encoche béante à la jonction)
    { const zs = Array.from({ length: 13 }, (_, i) => 15 + 6.5 * Math.sin((i / 12) * Math.PI / 2) * (i === 12 ? .992 : 1)), rr = zs.map((z) => R * Math.sqrt(Math.max(.02, 1 - ((z - 15) / 6.5) ** 2)));
      for (let i = 0; i < zs.length - 1; i++) L.cyl(0, Y, zs[i], rr[i], zs[i + 1] - zs[i], 24, W, 0, rr[i + 1] / rr[i], Math.PI / 2); }
    L.cyl(0, Y, -15, R, 11.5, 24, W, 0, .2, -Math.PI / 2 + .075); L.sph(0, Y + .85, -26.3, .45, .45, .9, W, 0, 10, 6);
    L.sph(0, Y - 1.2, -1, 2.2, 1.25, 8.5, G, 0, 18, 10);   // carénage de voilure
    // livrée : ventre gris, liseré ambre, bande marine
    [-1, 1].forEach((k) => { L.box(k * (R + .005), Y - .55, -1.5, .03, .16, 29, AMB); L.box(k * (R - .03), Y - .95, -1.5, .03, .36, 28, NAVY);
      for (let z = -13.4; z < 12.2; z += .92) { if (Math.abs(z - 1.2) < .7 || Math.abs(z + 9) < .5) continue; L.box(k * (R - .12), Y + .22, z, .16, .4, .3, DK); }
      [11.2, -11.6].forEach((z) => L.box(k * (R - .1), Y - .7, z, .14, 1.75, .78, "#dfe2e7")); });
    // pare-brise
    [-1, 1].forEach((k) => { L.box(k * .52, Y + .78, 17.55, .9, .5, .12, DK, 0, k * .42, -.55); L.box(k * 1.28, Y + .62, 16.75, .8, .46, .12, DK, 0, k * 1.0, -.3); });
    // ailes en flèche avec dièdre + winglets
    [-1, 1].forEach((k) => { slab([[k * 1.6, Y - 1.05, 5.2], [k * 17.6, Y - .1, -6.2], [k * 17.6, Y - .1, -8.6], [k * 1.6, Y - 1.05, -3.6]], .42, "#e9ecf0");
      slab([[k * 17.6, Y - .1, -6.3], [k * 18.3, Y + 2.3, -7.9], [k * 18.3, Y + 2.3, -9.2], [k * 17.6, Y - .1, -8.6]], .16, NAVY);
      slab([[k * 5, Y - 1.0, -2.2], [k * 16.5, Y - .28, -8.0], [k * 16.5, Y - .3, -9.0], [k * 5, Y - 1.02, -4.4]], .1, G);   // volets
      // empennage horizontal
      slab([[k * .8, Y + .95, -21.2], [k * 6.9, Y + 1.5, -25.6], [k * 6.9, Y + 1.5, -27.0], [k * .8, Y + .95, -25.2]], .22, "#e9ecf0");
      // réacteur : nacelle, entrée d'air, soufflante, tuyère, mât
      const ex = k * 6.4, ey = Y - 2.25; L.cyl(ex, ey, -2.4, 1.18, 4.6, 20, W, 0, 1, Math.PI / 2); L.cyl(ex, ey, 2.2, 1.18, .5, 20, "#b9bfc8", 0, .93, Math.PI / 2); L.cyl(ex, ey, 2.25, .98, .12, 20, DK, 0, 1, Math.PI / 2);
      L.sph(ex, ey, 2.3, .3, .3, .5, "#8a9099", 0, 10, 6); L.cyl(ex, ey, -2.4, 1.1, 1.5, 20, "#9aa1ab", 0, .55, -Math.PI / 2); L.cyl(ex, ey, -3.6, .5, 1.2, 12, "#5c626b", 0, .4, -Math.PI / 2);
      L.box(k * 6.4, ey + .9, -.6, .28, .75, 3.6, G); L.box(ex, ey + .25, .5, 2.4, .12, .9, NAVY);
      // train principal
      L.cyl(k * 2.6, .55, -1.4, .09, 1.6, 6, "#8a9099"); [-.28, .28].forEach((dx) => L.cyl(k * 2.6 + dx, .55, -1.4 - .12, .55, .24, 14, "#17181b", 0, 1, 0, Math.PI / 2)); });
    // dérive en flèche, aux couleurs
    slab([[.11, Y + 1.6, -18.2], [.11, Y + 8.6, -26.4], [.11, Y + 8.6, -28.9], [.11, Y + 1.2, -25.6]], 0, NAVY);
    { const T = [[-.11, Y + 1.6, -18.2], [-.11, Y + 8.6, -26.4], [-.11, Y + 8.6, -28.9], [-.11, Y + 1.2, -25.6]].map((p) => L.w(p[0], p[1], p[2])); mb.quad(T[0], T[1], T[2], T[3], NAVY); mb.quad(T[3], T[2], T[1], T[0], NAVY); }
    [-1, 1].forEach((k) => { L.box(k * .13, Y + 4.6, -24.9, .02, 1.5, 2.6, AMB, 0, 0, -.86); });
    // train avant, feux
    L.cyl(0, .5, 13.4, .08, 1.4, 6, "#8a9099"); [-.2, .2].forEach((dx) => L.cyl(dx, .42, 13.3, .42, .18, 12, "#17181b", 0, 1, 0, Math.PI / 2));
    L.sph(-18.3, Y + 2.3, -8.5, .14, .14, .14, "#ff3030", 1, 6, 5); L.sph(18.3, Y + 2.3, -8.5, .14, .14, .14, "#30ff60", 1, 6, 5); L.sph(0, Y + 2.15, 2, .16, .12, .16, "#ff3030", 1, 6, 5);
  }
  /* monument du pays d'arrivée, posé près de la piste à l'approche */
  function destMesh(world) {
    if (!world || !withTpl) return null; if (dest[world] !== undefined) return dest[world];
    const mb = new MB(), r = rng(hashStr(world)), S = (n, x, z, ry = 0, s = 1) => hasT(n) && stampM(mb, n, M4.trs(x, 0, z, ry, 0, 0, s, s, s), null, null);
    if (world === "france") { S("eiffel", 2950, -520, Math.PI / 4, 1.4); for (let i = 0; i < 18; i++) S(r() < .5 ? "haussmann_a" : "haussmann_b", 2700 + i * 26, -400 - (i % 3) * 40, 0); }
    if (world === "usa") for (let i = 0; i < 26; i++) S(r() < .5 ? "tour_a" : "tour_b", 2600 + (i % 7) * 70 + r() * 20, -520 - Math.floor(i / 7) * 80, 0, 1.4 + r() * 1.1);
    if (world === "japan") { S("pagode", 2850, -330, 0, 1.6); S("tour_tokyo", 3200, -700, 0, 1); S("torii", 2780, -300, Math.PI / 2, 1.4); const L = new Loc(mb, [3800, 0, -2200], 0); L.cyl(0, -20, 0, 900, 520, 20, "#6f7f9a", 0, .12); L.cyl(0, 330, 0, 330, 150, 20, "#f2f5fa", 0, .2); }
    if (world === "australia") { S("opera", 2950, -420, Math.PI / 2, 1.5); }
    if (world === "namibia") for (let i = 0; i < 7; i++) S("dune", 2500 + i * 260, (i % 2 ? -1 : 1) * (600 + r() * 400), r() * 6, 1 + r() * .6);
    dest[world] = mb.n ? GLR.mesh(mb) : null; return dest[world];
  }
  // vitesse / altitude
  const X = (t) => 60 * t + 75 * t * t;
  const Y = (t) => t < 1.2 ? 0 : t < 2.7 ? 300 * smooth((t - 1.2) / 1.5) : t < 3.9 ? 300 : 300 - 297 * smooth((t - 3.9) / 1.95);
  function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

  function frame(now) {
    const k = Math.min(1, (now - t0) / dur);
    draw(k);
    if (k >= 1) return finish();
    raf = requestAnimationFrame(frame);
  }
  function draw(k) {
    const t = k * 6;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25) * (matchMedia("(pointer: coarse)").matches ? .8 : 1), r = canvas.getBoundingClientRect();
    if (canvas.width !== Math.round(r.width * dpr)) { canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); }
    const x = X(t), y = Y(t) + 3.2, pitch = Math.max(-.12, Math.min(.2, Math.atan2(Y(t + .05) - Y(t), X(t + .05) - X(t)) * .9));
    const bank = .18 * Math.sin(Math.PI * smooth((t - 2.6) / 1.6)) * (opts.reverse ? -1 : 1);
    const pm = M4.trs(x, Y(t), 0, 0, 0, pitch, 1, 1, 1);
    const pmB = M4.mul(pm, M4.trs(0, 3, 0, 0, bank, 0)), pmF = M4.mul(pmB, M4.trs(0, -3, 0));
    const side = opts.reverse ? -1 : 1;
    // caméra : travelling latéral au sol, puis plan large au-dessus des nuages, puis vue d'approche
    const o = t < 2.6 ? [-34 + t * 6, 6 + t * 1.6, side * (28 + t * 5)] : t < 4.2 ? [-55 + (t - 2.6) * 18, 14 + (t - 2.6) * 4, side * (52 - (t - 2.6) * 10)] : [-48, 9, side * 30];
    cam.eye = [x + o[0], y + o[1], o[2]]; cam.tgt = [x + 10, y + 1, 0];
    cam.vp = M4.mul(M4.persp(50 * Math.PI / 180, canvas.width / canvas.height, .5, 9000), M4.lookAt(cam.eye, cam.tgt, [0, 1, 0]));
    cam.shadowTarget = [x, 0, 0];
    const from = envOf(AMB3.airport), to = envOf(AMB3[opts.amb] || AMB3.paris), env = envMix(from, to, smooth((k - .45) / .5));
    env.fogN = 600; env.fogF = 6000; env.shadowR = 90; env.clouds = Math.max(env.clouds, .35);
    const items = [{ mesh: scene.ground }, { mesh: scene.far, shadow: false, fog: .8 }, { mesh: plane, m: pmF, spec: .35 }];
    const dm = destMesh(opts.world); if (dm && k > .55) items.push({ mesh: dm, fog: .8 });
    GLR.render(cam, env, items, [], t);
    env.cloudLow = (AMB3[opts.amb] || {}).night && k > .6 ? [.25, .25, .35] : cmix(opts.reverse ? "#c9a89a" : "#9aa8bf", "#ffffff", .1);
    GLR.drawClouds(cam, env, scene.clouds, 1);
    opts.onProgress && opts.onProgress(k);
  }
  function finish() { cancelAnimationFrame(raf); const d = done; done = null; d && d(); }
  function ensure() { if (!scene || (!withTpl && hasT("avion"))) build(); }
  return {
    init(c) { canvas = c; },
    play(o, cb) {
      ensure();
      opts = o; done = cb; dur = matchMedia("(prefers-reduced-motion: reduce)").matches ? 1800 : 6000;
      t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    },
    skip() { if (done) finish(); },
    preview(k, o) { ensure(); opts = o; draw(k); }
  };
})();
