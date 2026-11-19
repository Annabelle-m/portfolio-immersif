p='/home/claude/portfolio/v5/js/ride3d.js'; s=open(p).read()
def rep(a,b):
    global s
    assert s.count(a)==1, a[:70]; s=s.replace(a,b)
rep("let canvas, snowCv, snowCtx, cb = {}, lang = \"fr\", rider = null, doorMesh = null, ok = false;",
    "let canvas, snowCv, snowCtx, cb = {}, lang = \"fr\", rider = null, doorMesh = null, chute = null, ok = false, fly = null;")
rep("""  function currentEnv() {
    if (P.path !== "ring") return { env: envOf(AMB3.airport) };""","""  function currentEnv() {
    if (fly) { const A = AMB3[NET.secAt(fly.s0).amb], B = AMB3[NET.secAt(fly.s1).amb], k = smooth((fly.t / fly.dur - .3) / .45); const env = envMix(envOf(A), envOf(B), k); env.snow = 0; return { env }; }
    if (P.path !== "ring") return { env: envOf(AMB3.airport) };""")
rep("""  function update(dt) {
    if (P.mode === "reading")""","""  function update(dt) {
    if (fly) { fly.t += dt; time += dt; if (fly.t >= fly.dur) landFly(); else { cb.onTick && cb.onTick({ kmh: fly.t < fly.dur * .45 ? 140 : 30, ring: NET.ring.wrap(fly.s0 + sd(fly.s1, fly.s0) * smooth(fly.t / fly.dur)) / NET.ring.len, mode: "fly" }); } upEdge = downEdge = false; return; }
    if (P.mode === "reading")""")
rep("""    const yaw = Math.atan2(fwd[0], fwd[2]) - P.yawOff;
    const rm = M4.trs(pos[0], pos[1], pos[2], yaw, -P.pitch, P.lean);""","""    const yaw = Math.atan2(fwd[0], fwd[2]) - P.yawOff;
    let rm = M4.trs(pos[0], pos[1], pos[2], yaw, -P.pitch, P.lean), chuteM = null, F = null;
    if (fly) { F = flyPose(); rm = F.m; chuteM = F.chute; }""")
rep("""    let doors = 0;
    if (P.mode === "hall" && hall.sp.door) {""","""    let doors = 0;
    if (F) {
      const back = F.dir, k = cam.snap ? 1 : 1 - Math.exp(-dt * 4), k2 = cam.snap ? 1 : 1 - Math.exp(-dt * 8);
      const want2 = [F.pos[0] - back[0] * 15, F.pos[1] + 5.5 + F.u * 3, F.pos[2] - back[2] * 15];
      cam.eye = V3.lerp(cam.eye, want2, k); cam.tgt = V3.lerp(cam.tgt, [F.pos[0], F.pos[1] + 1.2, F.pos[2]], k2); cam.snap = false;
    } else if (P.mode === "hall" && hall.sp.door) {""")
rep("""    cam.shadowTarget = P.mode === "hall" ? hall.sp.door.p : V3.add(pos, V3.sc(fwd, 16));""","""    cam.shadowTarget = F ? F.pos : P.mode === "hall" ? hall.sp.door.p : V3.add(pos, V3.sc(fwd, 16));""")
rep("""    items.push({ mesh: rider, m: rm, spec: .3 });""","""    items.push({ mesh: rider, m: rm, spec: .3 });
    if (chuteM) items.push({ mesh: chute, m: chuteM, spec: .1 });""")
rep("""    cam.vp = M4.mul(M4.persp(56 * Math.PI / 180, W / H, .2, 2200)""","""    cam.vp = M4.mul(M4.persp((F ? 62 : 56) * Math.PI / 180, W / H, .2, 2200)""")
rep("""  function buildDoor() {""","""  /* ---------- Saut en parachute vers le point cliqué sur la carte ---------- */
  function ringPose(s) { const f = NET.ring.at(s); return { pos: f.p.slice(), yaw: Math.atan2(f.t[0], f.t[2]) }; }
  const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  function flyPose() {
    const u = Math.min(1, fly.t / fly.dur), A = fly.a, B = fly.b;
    const h = smooth(Math.min(1, u * 1.08)), base = V3.lerp(A.pos, B.pos, h);
    const lift = fly.H * Math.sin(Math.PI * Math.pow(u, .62));
    const pos = [base[0], base[1] + lift, base[2]];
    const travel = Math.atan2(B.pos[0] - A.pos[0], B.pos[2] - A.pos[2]);
    const yaw = u < .5 ? A.yaw + wrapA(travel - A.yaw) * smooth(u / .2) : travel + wrapA(B.yaw - travel) * smooth((u - .7) / .28);
    const flip = -Math.PI * 2 * smooth((u - .05) / .25);                      // salto arrière au décollage
    const open = smooth((u - .38) / .1), swing = open * .22 * Math.sin(fly.t * 3.2) * (1 - smooth((u - .88) / .1));
    const squash = u > .93 ? 1 - .14 * Math.sin(Math.PI * (u - .93) / .07) : 1;
    const m = M4.mul(M4.trs(pos[0], pos[1], pos[2], yaw, flip, swing), M4.trs(0, 0, 0, 0, 0, 0, 1, squash, 1));
    const cs = open * (u > .95 ? 1 - smooth((u - .95) / .05) : 1);
    const chute2 = cs > .01 ? M4.mul(M4.trs(pos[0], pos[1], pos[2], yaw, 0, swing), M4.trs(0, 1.4, -.25, 0, 0, 0, cs, cs, cs)) : null;
    const dir = V3.norm([B.pos[0] - A.pos[0] + 1e-4, 0, B.pos[2] - A.pos[2]]);
    return { m, chute: chute2, pos, u, dir };
  }
  function buildChute(cols) {
    const mb = new MB(); mb.mat = MAT.cloth; const N = 16, R = 2.6, Hc = 1.3, top = 4.2;
    const pt = (i, j) => { const a = (i / N) * Math.PI * 2, ph = (j / 4) * Math.PI / 2, rr = R * Math.sin(ph) * (1 + .05 * Math.cos(a * N / 2)); return [Math.cos(a) * rr, top + Hc * Math.cos(ph), Math.sin(a) * rr]; };
    for (let i = 0; i < N; i++) for (let j = 0; j < 4; j++) mb.quad(pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1), cols[(i >> 1) % cols.length]);
    mb.mat = MAT.plain;
    for (let i = 0; i < N; i += 2) segment(mb, pt(i, 4), [Math.cos(i / N * 6.283) * .16, .05, Math.sin(i / N * 6.283) * .16], .012, "#f2f2f2", 3);
    return GLR.mesh(mb);
  }
  function landFly() {
    const f = fly; fly = null;
    Object.assign(P, { path: "ring", s: f.s1, dir: 1, v: 0, x: 0, vx: 0, lean: 0, yawOff: 0, pitch: 0, mode: "drive" });
    cooldown = f.trig || null; lastSec = null; ensureVisible();
    cb.onFly && cb.onFly(null);
    if (f.trig) { P.mode = "reading"; cb.onPanel && cb.onPanel(f.trig.sec); }
  }
  function flyTo(sTarget, trig) {
    if (!ok || fly || P.mode === "hall") return false;
    if (P.mode === "reading") cb.onPanel && cb.onPanel(null);
    const onRing = P.path === "ring", s0 = onRing ? P.s : NET.spokes[P.path].sb;
    const f0 = pathOf(P.path).at(P.s), a = { pos: f0.p.slice(), yaw: Math.atan2(f0.t[0], f0.t[2]) };
    const b = ringPose(sTarget), dist = Math.hypot(b.pos[0] - a.pos[0], b.pos[2] - a.pos[2]);
    fly = { t: 0, dur: 3.4 + Math.min(1.4, dist / 900), a, b, s0, s1: sTarget, trig, H: 28 + Math.min(90, dist * .12) };
    if (!chute) chute = buildChute(["#ff6f61", "#ffd84a", "#ffffff", "#6fa8ff"]);
    for (const k of visible()) buildChunk(k);
    P.mode = "fly"; cb.onFly && cb.onFly(sTarget);
    return true;
  }

  function buildDoor() {""")
rep("""    get state() { return P; }, renderOnce(dt) { render(dt); },""","""    get state() { return P; }, renderOnce(dt) { render(dt); }, flyTo, get flying() { return !!fly; },""")
open(p,'w').write(s)
