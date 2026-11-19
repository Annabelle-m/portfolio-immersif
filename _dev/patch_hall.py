p='/home/claude/portfolio/v5/js/ride3d.js'; s=open(p).read()
def rep(a,b):
    global s
    assert s.count(a)==1, a[:70]; s=s.replace(a,b)
rep("""    else cnv = textCanvas(lines, spec.o || {});""","""    else if (spec.canvas) cnv = spec.canvas();
    else cnv = textCanvas(lines, spec.o || {});""")
# hall timing
rep("""hall.t += dt; if (hall.t > 3.1 && !hall.done)""","""hall.t += dt; if (hall.t > 5.2 && !hall.done)""")
rep("""      const a = smooth(t / 1.3), b = smooth((t - 1.5) / 1.4);
      want = V3.lerp(V3.lerp(hall.from.eye, A, a), B, b); look = V3.lerp(V3.lerp(hall.from.tgt, lookD, a), lookD, b);""","""      const a = smooth(t / 1.3), b = smooth((t - 1.5) / 1.4), c = smooth((t - 2.8) / 2.3);
      const rt = [Math.cos(D.ry), 0, -Math.sin(D.ry)], C = [D.p[0] - out[0] * 36 - rt[0] * 5, D.p[1] + 1.75, D.p[2] - out[2] * 36 - rt[2] * 5];
      const lookB = [D.p[0] - out[0] * 30, D.p[1] + 3.6, D.p[2] - out[2] * 30], lookC = [D.p[0] - out[0] * 120 + rt[0] * 10, D.p[1] + 3, D.p[2] - out[2] * 120 + rt[2] * 10];
      want = V3.lerp(V3.lerp(V3.lerp(hall.from.eye, A, a), B, b), C, c); look = V3.lerp(V3.lerp(V3.lerp(hall.from.tgt, lookD, a), lookB, b), lookC, c);""")
# render inside hall
rep("""    const { env } = currentEnv();
    const items = [], signs = [];""","""    let { env } = currentEnv();
    const items = [], signs = [];
    if (P.mode === "hall" && hall.sp.door) {
      const D = hall.sp.door, out = [Math.sin(D.ry), 0, Math.cos(D.ry)], inside = (cam.eye[0] - D.p[0]) * out[0] + (cam.eye[2] - D.p[2]) * out[2] < -.25;
      if (inside) {
        const H = hallOf(hall.sp); env = envMix(envOf(AMB3.airport), envOf(AMB3.losangeles), .8); env.shadowR = 40; env.fogN = 300; env.fogF = 1600;
        cam.shadowTarget = [D.p[0] - out[0] * 30, D.p[1], D.p[2] - out[2] * 30];
        GLR.render(cam, env, [{ mesh: H.mesh, spec: .35 }, { mesh: H.people, spec: .2 }], H.signs, time); drawSnow(0); return;
      }
    }""")
rep("""  function buildDoor() {""","""  /* ---------- Hall du terminal en 3D (v5), dans l'esprit de l'image d'accueil ---------- */
  const halls = new Map();
  function boardCanvas() {
    const c = document.createElement("canvas"); c.width = 2048; c.height = 760; const g = c.getContext("2d");
    g.fillStyle = "#0b0f17"; g.fillRect(0, 0, 2048, 760); g.fillStyle = "#151b26"; g.fillRect(0, 0, 2048, 130);
    g.font = "800 72px 'Martian Mono', ui-monospace, monospace"; g.fillStyle = "#ffc23d"; g.textBaseline = "middle"; g.fillText(lang === "fr" ? "✈  DÉPARTS · DEPARTURES" : "✈  DEPARTURES · DÉPARTS", 50, 68);
    WORLDS.forEach((w, i) => { const y = 200 + i * 112; g.fillStyle = i % 2 ? "#0f141e" : "#121925"; g.fillRect(0, y - 52, 2048, 104);
      g.font = "700 58px 'Martian Mono', ui-monospace, monospace"; g.fillStyle = "#e9edf5"; g.fillText(w.time, 50, y); g.fillText(w.flight, 300, y);
      g.fillStyle = "#ffffff"; g.fillText(w.country[lang].toUpperCase(), 650, y); g.fillStyle = "#9fb0c8"; g.fillText(w.gate, 1350, y);
      g.fillStyle = w.accent; g.fillText(UI[lang].onTime.toUpperCase(), 1560, y); });
    return c;
  }
  function hallOf(sp) {
    if (halls.has(sp)) return halls.get(sp);
    const D = sp.door, mb = new MB(), pm = new MB(), L = new Loc(mb, D.p, D.ry, 1, false), r = rng(7 + sp.wi), signs = [];
    L.mt(MAT.glass); L.box(0, -.12, -31, 74, .12, 64, "#cfc6b8");                       // sol poli
    L.mt(MAT.plain); for (let z = -2; z > -62; z -= 4) L.box(0, .005, z, 74, .004, .05, "#b9b0a2");
    L.mt(MAT.metal); L.box(0, 13, -31, 74, .4, 64, "#2b3038");                           // plafond
    for (let z = -4; z > -60; z -= 6) L.box(0, 12.85, z, 62, .1, .45, "#fff1d6", 1);
    L.mt(MAT.stone); [-37, 37].forEach((x) => L.box(x, 0, -31, .6, 13.4, 64, "#ebe6dc"));
    L.box(-20.4, 0, 0, 33.4, 13.4, .5, "#ebe6dc"); L.box(20.4, 0, 0, 33.4, 13.4, .5, "#ebe6dc"); L.box(0, 3.5, 0, 7.4, 9.9, .5, "#ebe6dc");
    L.mt(MAT.metal);                                                                       // façade vitrée (montants)
    for (let x = -36; x <= 36; x += 6) L.box(x, 0, -62, .32, 13.2, .32, "#2a3038");
    [.5, 4.4, 8.6, 12.7].forEach((y) => L.box(0, y, -62, 74, .22, .3, "#2a3038"));
    L.mt(MAT.glass); L.box(0, 0, -62, 74, .5, .2, "#3a4048");
    L.mt(MAT.stone); [-16, 16].forEach((x) => [-14, -30, -46].forEach((z) => L.cyl(x, 0, z, .62, 13, 16, "#f1ede6")));
    // rangées de sièges
    L.mt(MAT.metal);
    [-24, -38].forEach((z) => [-1, 1].forEach((sd) => { for (let k = 0; k < 14; k++) { const x = sd * (6 + k * .72); L.box(x, .44, z, .6, .08, .52, "#3b4048"); L.box(x, .5, z - .27, .6, .62, .07, "#3b4048", 0, 0, -.12); if (k % 2 === 0) L.box(x - .36, .28, z, .05, .3, .5, "#9aa1a9"); } L.box(sd * (6 + 6.5 * .72), 0, z, 10.4, .3, .12, "#7d848c"); }));
    // tableau des départs suspendu
    L.box(0, 4.1, -9.2, 15, 4.9, .3, "#11151c"); [-6, 6].forEach((x) => L.box(x, 9, -9.2, .08, 4, .08, "#9aa1a9"));
    signs.push({ L, x: 0, y: 4.25, z: -9.03, w: 14.6, h: 4.6, canvas: boardCanvas, light: 1 });
    // plantes
    [[-31, -6], [31, -6], [-31, -56], [31, -56]].forEach(([x, z]) => { L.mt(MAT.stone); L.cyl(x, 0, z, .9, 1, 14, "#d9d3c8"); if (typeof TPL !== "undefined" && TPL.palmier_a) stampTpl(L, "palmier_a", x, .9, z, r() * 6, .55); else PROP.tree(new Loc(mb, L.w(x, .9, z), 0), 0, 0, r, .6); });
    // dehors : tarmac, avion au contact, passerelle, terminal voisin
    L.mt(MAT.asphalt); L.box(0, -.3, -330, 900, .1, 520, "#565a60");
    L.mt(MAT.plain); for (let x = -300; x < 300; x += 40) L.box(x, -.19, -110, 1, .02, 60, "#e8d27a");
    if (typeof TPL !== "undefined" && TPL.avion) { stampTpl(L, "avion", 14, 0, -105, Math.PI / 2, 1); stampTpl(L, "avion", -70, 0, -150, Math.PI / 2 + .3, 1); }
    L.mt(MAT.metal); L.box(14, 3.2, -72, 3.2, 3, 18, "#d5d9de"); L.cyl(14, 0, -78, .5, 3.2, 8, "#9aa1a9");
    L.mt(MAT.glass); L.box(-160, 0, -300, 220, 18, 40, "#7f9fb8"); L.box(150, 0, -330, 180, 14, 40, "#7f9fb8");
    // voyageurs
    const ppl = [["voyageuse_c", -6, -50, Math.PI], ["voyageur_a", 9, -15, .6], ["voyageuse_b", -12, -20, 2.6], ["voyageur_d", 22, -44, -2.4], ["voyageuse_e", -22, -32, 1.9], ["voyageur_a", 4, -54, 3.4]];
    if (typeof TPL !== "undefined") ppl.forEach(([n, x, z, ry]) => TPL[n] && stampM(pm, n, M4.mul(L.M, M4.trs(x, 0, z, ry)), null, null));
    const H = { mesh: GLR.mesh(mb), people: GLR.mesh(pm), signs: signs.map(signGPU) }; halls.set(sp, H); return H;
  }

  function buildDoor() {""")
open(p,'w').write(s)
p='/home/claude/portfolio/v5/js/app.js'; s=open(p).read()
a='setTimeout(() => { if (view === "ride") $("#fade").classList.add("on", "white"); }, 2300);'
assert a in s; s=s.replace(a,'setTimeout(() => { if (view === "ride") $("#fade").classList.add("on", "white"); }, 4300);'); open(p,'w').write(s)
