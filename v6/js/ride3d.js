/* ==========================================================================
   Conduite 3D (v3) : scooter souple et fluide, décors préchargés,
   arrêts aux fenêtres d'information, bretelle vers le hub central,
   et entrée dans le hall du terminal pour revenir à l'accueil.
   ========================================================================== */

const Ride3D = (() => {
  const VMAX = 24, ACC = 7.5, BRAKE = 9, COAST = 1.4, VREV = -4, XMAX = 3.3, VLAT = 2.2;
  let seaMesh = null; let canvas, snowCv, snowCtx, cb = {}, lang = "fr", rider = null, doorMesh = null, chute = null, ok = false, fly = null;
  let running = false, raf = 0, last = 0, time = 0, dtS = 1 / 60;
  const keys = { up: false, down: false, left: false, right: false }; let upEdge = false, downEdge = false;
  const P = { path: "ring", s: 0, dir: 1, v: 0, x: 0, vx: 0, mode: "drive", lean: 0, yawOff: 0, pitch: 0 };
  let cooldown = null, armed = null, lastSec = null, lastPrompt = null, exiting = null, hall = null;
  const cam = { eye: [0, 5, 0], tgt: [0, 0, 0], vp: null, shadowTarget: [0, 0, 0], snap: true };
  const chunks = new Map(); let allKeys = [];
  const snow = Array.from({ length: 220 }, () => [Math.random(), Math.random(), .4 + Math.random()]);

  const pathOf = (p) => (p === "ring" ? NET.ring : NET.spokes[p].path);
  const L_RING = () => NET.ring.len;
  const sd = (a, b) => { const L = L_RING(); let d = ((a - b) % L + L) % L; return d > L / 2 ? d - L : d; };
  const smooth = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

  /* ---------- Tronçons : tout est construit une fois, on n'affiche que ce qui est proche ---------- */
  function signGPU(spec) {
    const lines = spec.linesObj ? [].concat(spec.linesObj[lang]) : spec.lines || [""];
    let cnv;
    if (spec.draw === "kangaroo") { cnv = document.createElement("canvas"); cnv.width = cnv.height = 256; const g = cnv.getContext("2d");   // v6.5 : losange droit, silhouette de kangourou
      g.beginPath(); g.moveTo(128, 6); g.lineTo(250, 128); g.lineTo(128, 250); g.lineTo(6, 128); g.closePath(); g.fillStyle = "#f5c518"; g.fill();
      g.beginPath(); g.moveTo(128, 22); g.lineTo(234, 128); g.lineTo(128, 234); g.lineTo(22, 128); g.closePath(); g.strokeStyle = "#111"; g.lineWidth = 7; g.lineJoin = "round"; g.stroke();
      g.fillStyle = "#111"; g.beginPath(); g.moveTo(206, 150); g.quadraticCurveTo(184, 150, 168, 132); g.quadraticCurveTo(150, 104, 122, 100); g.quadraticCurveTo(108, 98, 98, 86); g.lineTo(96, 68); g.lineTo(90, 80); g.lineTo(86, 66); g.lineTo(82, 82); g.quadraticCurveTo(70, 88, 64, 98); g.lineTo(72, 102); g.quadraticCurveTo(84, 100, 92, 104); g.quadraticCurveTo(96, 112, 104, 118); g.lineTo(96, 132); g.lineTo(86, 136); g.lineTo(88, 141); g.lineTo(101, 138); g.lineTo(112, 124); g.quadraticCurveTo(128, 134, 140, 150); g.lineTo(128, 172); g.lineTo(98, 180); g.lineTo(98, 187); g.lineTo(136, 184); g.lineTo(158, 160); g.quadraticCurveTo(176, 164, 206, 158); g.closePath(); g.fill(); }
    else if (spec.canvas) cnv = spec.canvas();
    else cnv = textCanvas(lines, spec.o || {});
    const tex = GLR.texture(cnv), q = GLR.texQuad(spec.w, spec.h);
    const m = M4.mul(spec.L.M, M4.trs(spec.x, spec.y, spec.z, spec.back ? Math.PI : 0, 0, spec.rot || 0));
    return { tex, q, m, light: spec.light, spec };
  }
  function bbox(mb) {   // boîte englobante [x0,x1,y0,y1,z0,z1] d'un maillage (sommets de 11 flottants, position en tête)
    if (!mb || !mb.v || !mb.v.length) return null; const v = mb.v; let a = 1e9, b = -1e9, c = 1e9, d = -1e9, e = 1e9, f = -1e9;
    for (let i = 0; i < v.length; i += 11) { const x = v[i], y = v[i + 1], z = v[i + 2]; if (x < a) a = x; if (x > b) b = x; if (y < c) c = y; if (y > d) d = y; if (z < e) e = z; if (z > f) f = z; }
    return [a - 1, b + 1, c - 1, d + 1, e - 1, f + 1];
  }
  function buildChunk(key) {
    if (chunks.has(key)) return chunks.get(key);
    const data = key[0] === "r" ? buildRingChunk(NET.sections[+key.slice(1)]) : buildSpokeChunk(NET.spokes[+key.slice(1)]);
    const c = { signs: data.signs.map(signGPU) };
    c.mainItems = GLR.meshCells(data.mb, 48).map((q) => ({ mesh: q.mesh, b: q.b }));                          // v6.49 : cellules de 48 m, écartées par le culling
    c.bgItems = GLR.meshCells(data.bg, 96).map((q) => ({ mesh: q.mesh, b: q.b, fog: .5, shadow: false }));
    c.waterItems = GLR.meshCells(data.water, 96).map((q) => ({ mesh: q.mesh, b: q.b, spec: 0, shadow: false }));
    chunks.set(key, c); return c;
  }
  let visKey = null, visVal = null;
  function visible() {
    const key = fly ? null : P.path + ":" + (P.path === "ring" ? Math.floor(P.s / 8) : 0);
    if (key && key === visKey) return visVal;
    const v = visible0(); visKey = key; visVal = v; return v;
  }
  function visible0() {
    if (fly) { const a = visibleAt(fly.s0), b = visibleAt(fly.s1); b.forEach((k) => a.add(k)); (fly.mid || []).forEach((k) => a.add(k)); return a; }
    return visibleAt(P.path === "ring" ? P.s : null);
  }
  function visibleAt(sRing) {
    const need = new Set(), L = L_RING();
    const around = (s, ahead, behind) => NET.sections.forEach((q, i) => { const a = ((q.start - s) % L + L) % L, b = ((s - q.end) % L + L) % L; const inside = sd(s, q.start) >= 0 && sd(q.end, s) >= 0; if (inside || a < ahead || b < behind) need.add("r" + i); });
    if (sRing != null && (fly || P.path === "ring")) { around(sRing, 360, 160); NET.junctions.forEach((j, k) => { const d = sd(j.sb, sRing); if (d > -120 && d < 300) need.add("s" + k); }); }
    else { need.add("s" + P.path); around(NET.spokes[P.path].sb, 260, 160); }
    return need;
  }
  function ensureVisible() { for (const k of visible()) buildChunk(k); }
  function prebuild(onDone) {
    allKeys = NET.sections.map((_, i) => "r" + i).concat(NET.spokes.map((_, i) => "s" + i));
    const todo = allKeys.filter((k) => !chunks.has(k));
    const tick = () => { const t0 = performance.now(); while (todo.length && performance.now() - t0 < 10) buildChunk(todo.shift()); if (todo.length) setTimeout(tick, 0); else onDone && onDone(); };
    tick();
  }

  /* ---------- Ambiance ---------- */
  function currentEnv() {
    if (fly) { const A = AMB3[NET.secAt(fly.s0).amb], B = AMB3[NET.secAt(fly.s1).amb], k = smooth((fly.t / fly.dur - .3) / .45); const env = envMix(envOf(A), envOf(B), k); env.snow = 0; return { env }; }
    if (P.path !== "ring") return { env: envOf(AMB3.airport) };
    const sec = NET.secAt(P.s), nx = NET.sections[(sec.index + 1) % NET.sections.length], into = P.s - sec.start;
    const t = Math.max(0, Math.min(1, (into - (sec.len - 45)) / 45));
    const A = AMB3[sec.amb], B = AMB3[nx.amb];
    const env = envMix(envOf(A), envOf(B), smooth(t)); env.snow = (A.snow ? 1 - t : 0) + (B.snow ? t : 0);
    return { env, sec };
  }

  /* ---------- Physique ---------- */
  function update(dt) {
    if (fly) { fly.t += dt; time += dt; if (!fly.chuted && fly.t > fly.dur * .38) { fly.chuted = 1; cb.onChute && cb.onChute(); } if (fly.t >= fly.dur) landFly(); else { cb.onTick && cb.onTick({ kmh: fly.t < fly.dur * .45 ? 140 : 30, ring: NET.ring.wrap(fly.s0 + sd(fly.s1, fly.s0) * smooth(fly.t / fly.dur)) / NET.ring.len, mode: "fly" }); } upEdge = downEdge = false; return; }
    if (P.mode === "reading") { P.v = 0; if (upEdge || downEdge) { P.mode = "drive"; cb.onPanel && cb.onPanel(null); } }
    if (P.mode === "hall") { P.v = Math.max(0, P.v - BRAKE * dt); hall.t += dt; if (hall.t > 4.2 && !hall.faded) { hall.faded = true; cb.onHallFade && cb.onHallFade(); } if (hall.t > 5.3 && !hall.done) { hall.done = true; cb.onHall && cb.onHall(); } }
    if (P.mode === "drive") {
      const k = exiting ? { up: true } : keys;
      if (k.up) P.v += (P.v < 0 ? BRAKE : ACC * (1 - Math.max(0, P.v) / (VMAX * 1.1))) * dt;
      else if (k.down) P.v -= (P.v > 0 ? BRAKE : ACC * .5) * dt;
      else P.v = P.v > 0 ? Math.max(0, P.v - COAST * dt) : Math.min(0, P.v + COAST * dt);
      P.v = Math.max(VREV, Math.min(VMAX, P.v));
      const steer = (keys.left ? -1 : 0) + (keys.right ? 1 : 0), grip = Math.min(1, Math.abs(P.v) / 5);
      P.vx += (steer * VLAT * grip - P.vx) * Math.min(1, dt * 3.2);
      P.x += P.vx * dt; if (Math.abs(P.x) > XMAX) { P.x = Math.sign(P.x) * XMAX; P.vx *= .3; }
    } else P.vx *= Math.max(0, 1 - dt * 4);
    P.yawOff += (Math.atan2(P.vx, Math.max(3, Math.abs(P.v))) * (P.v < 0 ? -1 : 1) - P.yawOff) * Math.min(1, dt * 5);
    P.lean += ((P.vx / VLAT) * .2 * Math.min(1, Math.abs(P.v) / 6) - P.lean) * Math.min(1, dt * 4);
    upEdge = downEdge = false;

    const s0 = P.s; let s1 = P.s + P.dir * P.v * dt;
    if (P.path === "ring") {
      s1 = NET.ring.wrap(s1);
      if (cooldown && Math.abs(sd(s1, cooldown.s)) > 10) cooldown = null;
      if (P.mode === "drive") for (const t of NET.triggers) {
        const a = sd(s0, t.s), b = sd(s1, t.s);
        if (a !== b && a * b <= 0 && Math.abs(a) < 20 && cooldown !== t) { s1 = t.s; P.v = 0; P.vx = 0; P.mode = "reading"; cooldown = t; cb.onPanel && cb.onPanel(t.sec); break; }
      }
      let near = null;
      for (const j of NET.junctions) { const d = sd(j.sb, s0); if (d > 0 && d < 62) near = j; }
      if (near && P.mode === "drive") {
        if (keys[near.spoke.side > 0 ? "right" : "left"] && P.x * near.spoke.side > 2.6) armed = near;
        if (sd(near.sb, s1) <= 0 && armed === near && P.v > 0) { P.path = NET.spokes.indexOf(near.spoke); s1 = Math.max(0, sd(s1, near.sb)); P.dir = 1; armed = null; }
      } else if (!near) armed = null;
    } else {
      const sp = NET.spokes[P.path], L = sp.path.len;
      if (s1 >= L - 1) { s1 = L - 1; if (P.mode === "drive") { P.mode = "hall"; hall = { t: 0, sp, from: { eye: cam.eye.slice(), tgt: cam.tgt.slice() } }; cb.onHallStart && cb.onHallStart(); } }
      if (s1 < 0) { P.path = "ring"; s1 = NET.ring.wrap(sp.sb + s1); P.dir = 1; }
    }
    P.s = s1; time += dt;

    const sec = P.path === "ring" ? NET.secAt(P.s) : { kind: "spoke", world: NET.spokes[P.path].world, spoke: NET.spokes[P.path] };
    const key = P.path === "ring" ? "r" + sec.index : "s" + P.path;
    if (key !== lastSec) { lastSec = key; cb.onSection && cb.onSection(sec); }
    const prompt = P.path === "ring" && P.mode === "drive" ? NET.junctions.find((j) => { const d = sd(j.sb, P.s); return d > 0 && d < 62; }) : null;
    const pk = prompt ? prompt.wi + (armed === prompt ? "a" : "") : null;
    if (pk !== lastPrompt) { lastPrompt = pk; cb.onPrompt && cb.onPrompt(prompt, armed === prompt); }
    if (exiting) { exiting.t += dt; if (exiting.t > 1.2 && !exiting.done) { exiting.done = true; cb.onExited && cb.onExited(); } }
    const frac = P.path === "ring" ? { ring: P.s / NET.ring.len } : { ring: NET.spokes[P.path].sb / NET.ring.len, spoke: P.s / NET.spokes[P.path].path.len };
    cb.onTick && cb.onTick({ kmh: Math.abs(P.v) * 3.6, ...frac, mode: P.mode });
  }

  /* ---------- Rendu ---------- */
  let fovDeg = 62;
  let hallPrep = false;
  function prepareHall() {   // v6.50 : le hall (maillages, avions, panneau) coûte une centaine de ms : on le prépare pendant la bretelle
    if (hallPrep || fly || P.path === "ring") return;
    const sp = NET.spokes[P.path]; if (!sp || !sp.door || halls.has(sp)) return;
    hallPrep = true; setTimeout(() => { const t0 = performance.now(); try { hallOf(sp); } catch (e) {} hallPrep = false; if (PERF) console.log("hall préparé en " + Math.round(performance.now() - t0) + " ms"); }, 150);
  }
  function render(dt = dtS) {
    prepareHall();
    const path = pathOf(P.path), f = path.at(P.s), fwd = V3.sc(f.t, P.dir), right = V3.sc(f.r, P.dir);
    const pos = [f.p[0] + right[0] * P.x, f.p[1], f.p[2] + right[2] * P.x];
    const ah = path.at(P.s + P.dir * 5), bh = path.at(P.s - P.dir * 5);
    P.pitch += (Math.atan2(ah.p[1] - bh.p[1], 10) - P.pitch) * Math.min(1, dt * 4);
    const yaw = Math.atan2(fwd[0], fwd[2]) - P.yawOff;
    let rm = M4.trs(pos[0], pos[1], pos[2], yaw, -P.pitch, P.lean), chuteM = null, F = null;
    if (fly) { F = flyPose(); rm = F.m; chuteM = F.chute; }
    let want = [pos[0] - fwd[0] * 6.8, pos[1] + 2.75, pos[2] - fwd[2] * 6.8], look = [pos[0] + fwd[0] * 6, pos[1] + 1.3, pos[2] + fwd[2] * 6];
    let doors = 0;
    if (F) {
      /* v6 : travelling orbital en trois temps — décollage serré, grand tour au-dessus, plongeon derrière la scooter à l'atterrissage */
      const u = F.u, sg = fly.side, fw = [Math.sin(F.yaw), 0, Math.cos(F.yaw)], rt = [fw[2], 0, -fw[0]];
      const swing = smooth((u - .06) / .5) * (1 - smooth((u - .62) / .34)) * 2.2 * sg;            // 0 → ~143° → 0
      const kk = Math.sin(Math.PI * smooth((u - .06) / .88)), dist = 6.8 + 120 * Math.pow(kk, 1.3), hgt = 2.75 + 240 * Math.pow(kk, 1.8) + F.lift * .1;   // v6.1 : montée en vue aérienne de toute la carte
      const ca = Math.cos(swing), sa = Math.sin(swing);
      const off = [-(fw[0] * ca + rt[0] * sa) * dist, 0, -(fw[2] * ca + rt[2] * sa) * dist];
      const eye = [F.pos[0] + off[0], F.pos[1] + hgt, F.pos[2] + off[2]];
      const endL = smooth((u - .86) / .14), tgt = [F.pos[0] + fw[0] * 4.5 * endL, F.pos[1] + 1.15 + (1 - endL) * .6, F.pos[2] + fw[2] * 4.5 * endL];
      cam.eye = eye; cam.tgt = tgt; cam.snap = false; fovDeg = 56 + 12 * Math.sin(Math.PI * Math.pow(u, .7)) + 8 * Math.exp(-u * 14);
    } else if (P.mode === "hall" && hall.sp.door) {
      const D = hall.sp.door, out = [Math.sin(D.ry), 0, Math.cos(D.ry)], t = hall.t;
      const A = [D.p[0] + out[0] * 9, D.p[1] + 1.8, D.p[2] + out[2] * 9], B = [D.p[0] - out[0] * 6, D.p[1] + 1.7, D.p[2] - out[2] * 6];
      const lookD = [D.p[0] - out[0] * 30, D.p[1] + 1.6, D.p[2] - out[2] * 30];
      const a = smooth(t / 1.3), b = smooth((t - 1.5) / 1.4), c = smooth((t - 2.8) / 2.3);
      const rt = [Math.cos(D.ry), 0, -Math.sin(D.ry)], C = [D.p[0] - out[0] * 36 - rt[0] * 5, D.p[1] + 1.75, D.p[2] - out[2] * 36 - rt[2] * 5];
      const lookB = [D.p[0] - out[0] * 30, D.p[1] + 3.6, D.p[2] - out[2] * 30], lookC = [D.p[0] - out[0] * 120 + rt[0] * 10, D.p[1] + 3, D.p[2] - out[2] * 120 + rt[2] * 10];
      want = V3.lerp(V3.lerp(V3.lerp(hall.from.eye, A, a), B, b), C, c); look = V3.lerp(V3.lerp(V3.lerp(hall.from.tgt, lookD, a), lookB, b), lookC, c);
      doors = smooth((t - 1.0) / .9);
      cam.eye = want; cam.tgt = look;
    } else {
      const k = cam.snap ? 1 : 1 - Math.exp(-dt * 7.5), k2 = cam.snap ? 1 : 1 - Math.exp(-dt * 10);
      cam.eye = V3.lerp(cam.eye, want, k); cam.tgt = V3.lerp(cam.tgt, look, k2); cam.snap = false;
    }
    const W = canvas.width, H = canvas.height;
    cam.vp = M4.mul(M4.persp((F ? fovDeg : 56) * Math.PI / 180, W / H, .2, 2200), M4.lookAt(cam.eye, cam.tgt, [0, 1, 0]));
    cam.shadowTarget = F ? F.pos : P.mode === "hall" ? hall.sp.door.p : V3.add(pos, V3.sc(fwd, 16));
    let { env } = currentEnv();
    const items = [], signs = [];
    if (P.mode === "hall" && hall.sp.door) {
      const D = hall.sp.door, out = [Math.sin(D.ry), 0, Math.cos(D.ry)], inside = (cam.eye[0] - D.p[0]) * out[0] + (cam.eye[2] - D.p[2]) * out[2] < -.25;
      if (inside) {
        const H = hallOf(hall.sp); env = envMix(envOf(AMB3.airport), envOf(AMB3.losangeles), .8); env.shadowR = 40; env.fogN = 300; env.fogF = 1600; env.shadows = false;   // v6.51 : pas de passe d'ombres à l'intérieur du hall
        cam.shadowTarget = [D.p[0] - out[0] * 30, D.p[1], D.p[2] - out[2] * 30];
        GLR.render(cam, env, [{ mesh: H.mesh, spec: .35 }, { mesh: H.people, spec: .2 }], H.signs, time); drawSnow(0); return;
      }
    }
    const cur = P.path === "ring" ? NET.secAt(P.s).index : -1, nb = new Set(cur < 0 ? [] : [cur, (cur + 1) % NET.sections.length]);
    if (F) { items.push({ mesh: seaMesh, spec: 0, shadow: false }); env.fogN = 380; env.fogF = 2600; }
    for (const k of (F ? chunks.keys() : visible())) { const c = chunks.get(k); if (!c) continue; for (const q of c.mainItems) items.push(q); for (const q of c.waterItems) items.push(q); if (F || k[0] !== "r" || nb.has(+k.slice(1))) for (const q of c.bgItems) items.push(q); signs.push(...c.signs); }
    items.push({ mesh: rider, m: rm, spec: .3 });
    if (chuteM) items.push({ mesh: chute, m: chuteM, spec: .1 });
    if (P.path !== "ring" && NET.spokes[P.path].door) {
      const D = NET.spokes[P.path].door, o = .95 + doors * 1.75;
      [-1, 1].forEach((sg) => items.push({ mesh: doorMesh, m: M4.mul(M4.trs(D.p[0], D.p[1], D.p[2], D.ry), M4.trs(sg * o, 0, .05)), spec: 0, shadow: false }));
    }
    env.shadowR = 55;
    GLR.render(cam, env, items, signs, time);
    drawSnow(env.snow || 0);
  }
  function drawSnow(a) {
    if (!snowCtx) return; const W = snowCv.width, H = snowCv.height; snowCtx.clearRect(0, 0, W, H); if (a <= 0) return;
    snowCtx.fillStyle = `rgba(255,255,255,${.85 * a})`;
    for (const f of snow) { const x = ((f[0] * W + time * 25 * f[2] - P.x * 40) % W + W) % W, y = ((f[1] + time * .1 * f[2] + P.s * .0004) % 1) * H; snowCtx.beginPath(); snowCtx.arc(x, y, 1.6 * f[2] * (W / 1400 + .6), 0, 6.3); snowCtx.fill(); }
  }
  const COARSE = matchMedia("(pointer: coarse)").matches, PERF = /[?&]perf/.test(location.search); let perfEl = null, perfT = 0;
  let rscale = COARSE ? .8 : 1, slow = 0, fast = 0, ema = 16.7;   // v6.48 : échelle de résolution adaptative
  function resize() {
    const r = canvas.getBoundingClientRect(), dpr = Math.max(.5, Math.min(window.devicePixelRatio || 1, r.width > 900 ? 1 : 1.25) * rscale);
    canvas.width = Math.max(2, Math.round(r.width * dpr)); canvas.height = Math.max(2, Math.round(r.height * dpr));
    if (snowCv) { snowCv.width = canvas.width; snowCv.height = canvas.height; }
  }
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const el = now - last;
    if (el < 12) return;   // écrans 120 Hz : on ne dessine qu'une image sur deux (60 i/s suffisent)
    ema += (Math.min(el, 100) - ema) * .1;
    if (PERF) { if (!perfEl) { perfEl = document.createElement("div"); perfEl.style.cssText = "position:fixed;z-index:99;left:8px;top:70px;padding:4px 8px;background:#000c;color:#0f0;font:12px monospace;pointer-events:none"; document.body.appendChild(perfEl); }
      if (now - perfT > 500) { perfT = now; perfEl.textContent = Math.round(1000 / ema) + " fps · " + canvas.width + "×" + canvas.height + " · échelle " + rscale.toFixed(2); } }
    if (!fly && !(P.mode === "hall")) {   // rien n'est ajusté pendant les cinématiques
      if (ema > 20) { if (++slow > 12 && rscale > .5) { rscale = Math.max(.5, rscale * .85); slow = 0; ema = 16.7; resize(); } } else slow = 0;
    }
    const raw = Math.min(.05, Math.max(.001, el / 1000 || dtS)); last = now;
    dtS += (raw - dtS) * .2; // pas de temps lissé : mouvement régulier même si une image arrive en retard
    update(dtS); render(dtS);
  }
  /* ---------- Saut en parachute vers le point cliqué sur la carte ---------- */
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
    const squash = u > .93 ? 1 - .14 * Math.sin(Math.PI * (u - .93) / .07) : 1, kk = Math.sin(Math.PI * smooth((u - .06) / .88)), big = 1 + 4 * Math.pow(kk, 1.5), cbig = 1 + .4 * (big - 1);   // v6.1 : la voyageuse grossit en altitude pour rester visible
    const m = M4.mul(M4.trs(pos[0], pos[1], pos[2], yaw, flip, swing), M4.trs(0, 0, 0, 0, 0, 0, big, big * squash, big));
    const cs = open * (u > .95 ? 1 - smooth((u - .95) / .05) : 1);
    const chute2 = cs > .01 ? M4.mul(M4.trs(pos[0], pos[1], pos[2], yaw, 0, swing), M4.trs(0, 1.4 * big, -.25 * big, 0, 0, 0, cs * cbig, cs * cbig, cs * cbig)) : null;
    const dir = V3.norm([B.pos[0] - A.pos[0] + 1e-4, 0, B.pos[2] - A.pos[2]]);
    return { m, chute: chute2, pos, u, dir, yaw, lift };
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
    cb.onFly && cb.onFly(null); cb.onLand && cb.onLand();
    if (f.trig) { P.mode = "reading"; cb.onPanel && cb.onPanel(f.trig.sec); }
  }
  function flyTo(sTarget, trig) {
    if (!ok || fly || P.mode === "hall") return false;
    if (P.mode === "reading") cb.onPanel && cb.onPanel(null);
    const onRing = P.path === "ring", s0 = onRing ? P.s : NET.spokes[P.path].sb;
    const f0 = pathOf(P.path).at(P.s), a = { pos: f0.p.slice(), yaw: Math.atan2(f0.t[0], f0.t[2]) };
    const b = ringPose(sTarget), dist = Math.hypot(b.pos[0] - a.pos[0], b.pos[2] - a.pos[2]);
    fly = { t: 0, side: Math.random() < .5 ? -1 : 1, dur: 5.6 + Math.min(1.6, dist / 800), a, b, s0, s1: sTarget, trig, H: 34 + Math.min(46, dist * .05) };
    { const d = sd(sTarget, s0), mid = []; for (let i = 1; i < 6; i++) mid.push("r" + NET.secAt(s0 + d * i / 6).index); fly.mid = mid; }   // v6 : décor sur tout le trajet
    if (!chute) chute = buildChute(["#ff6f61", "#ffd84a", "#ffffff", "#6fa8ff"]);
    for (const k of visible()) buildChunk(k);
    P.mode = "fly"; cb.onFly && cb.onFly(sTarget);
    return true;
  }

  /* ---------- Hall du terminal en 3D (v5), dans l'esprit de l'image d'accueil ---------- */
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
    L.box(0, 3.6, -20, 15, 4.9, .3, "#11151c"); [-6, 6].forEach((x) => L.box(x, 8.5, -20, .08, 4.5, .08, "#9aa1a9"));
    signs.push({ L, x: 0, y: 3.75, z: -19.83, w: 14.6, h: 4.6, canvas: boardCanvas, light: 1 });
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

  function buildDoor() { const mb = new MB(); mb.mat = MAT.glass; mb.box(M4.trs(0, 0, 0, 0, 0, 0, 1.8, 3.2, .08), "#8fb4cf"); mb.mat = MAT.metal; mb.box(M4.trs(0, 3.1, 0, 0, 0, 0, 1.84, .1, .1), "#c9ced3"); mb.box(M4.trs(.88, 0, 0, 0, 0, 0, .06, 3.2, .1), "#c9ced3"); mb.box(M4.trs(-.88, 0, 0, 0, 0, 0, .06, 3.2, .1), "#c9ced3"); return GLR.mesh(mb); }

  return {
    init(c, snowCanvas, callbacks) {
      canvas = c; snowCv = snowCanvas; snowCtx = snowCanvas && snowCanvas.getContext("2d"); cb = callbacks || {};
      ok = !!GLR.gl || GLR.init(c, COARSE ? { shadow: 1024, aa: false, taps: 5, shadowEvery: 2 } : { shadow: 2048, taps: 8 });
      if (ok) { rider = buildRider(); doorMesh = buildDoor(); const sm = new MB(); sm.mat = MAT.water; sm.aoY = null; const R = 3200; sm.quad([-R, -6.4, -R], [-R, -6.4, R], [R, -6.4, R], [R, -6.4, -R], "#2f6f9c"); seaMesh = GLR.mesh(sm); }
      window.addEventListener("resize", () => canvas && resize());
      return ok;
    },
    get ok() { return ok; },
    refreshRider() { if (ok) rider = buildRider(); },
    prebuild,
    start(worldId) {
      const j = NET.junctions.find((q) => q.sec.world.id === worldId) || NET.junctions[0];
      Object.assign(P, { path: "ring", s: j.sb + 18, dir: 1, v: 0, x: 0, vx: 0, mode: "drive", lean: 0, yawOff: 0, pitch: 0 });
      cooldown = armed = exiting = hall = fly = null; lastSec = lastPrompt = null; Object.keys(keys).forEach((k) => (keys[k] = false));
      resize(); ensureVisible(); cam.snap = true; render(); cam.snap = true;
      running = true; last = performance.now(); dtS = 1 / 60; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    },
    stop() { running = false; cancelAnimationFrame(raf); },
    pause() { running = false; cancelAnimationFrame(raf); },
    resume() { if (!running && ok) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } },
    setKey(k, v) { if (v && !keys[k]) { if (k === "up") upEdge = true; if (k === "down") downEdge = true; } keys[k] = v; },
    closePanel() { if (P.mode === "reading") { P.mode = "drive"; cb.onPanel && cb.onPanel(null); } },
    armShortcut() { const j = NET.junctions.find((q) => { const d = sd(q.sb, P.s); return d > 0 && d < 62; }); if (j) { armed = j; lastPrompt = null; } },
    skipFly() { if (fly) fly.t = fly.dur; },
    skipHall() { if (hall && !hall.done) { hall.done = true; cb.onHall && cb.onHall(); } },
    exitToAirport() { exiting = { t: 0 }; },
    setLang(l) { lang = l; for (const c of chunks.values()) c.signs = c.signs.map((s) => { if (!s.spec.linesObj) return s; GLR.delTex(s.tex); s.q.dispose(); return signGPU(s.spec); }); },
    jump(secIndex, frac = .5) { const q = NET.sections[secIndex]; P.path = "ring"; P.s = q.start + q.len * frac; P.mode = "drive"; P.v = 0; cooldown = NET.triggers.find((t) => t.sec === q) || null; ensureVisible(); cam.snap = true; },
    jumpSpoke(k, s) { P.path = k; P.s = s; P.dir = 1; P.mode = "drive"; ensureVisible(); cam.snap = true; },
    get state() { return P; }, renderOnce(dt) { render(dt); }, flyTo, get flying() { return !!fly; },
    step(n, dt = 1 / 30) { for (let i = 0; i < n; i++) update(dt); }
  };
})();
