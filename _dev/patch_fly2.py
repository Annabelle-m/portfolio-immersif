p='/home/claude/portfolio/v5/js/ride3d.js'; s=open(p).read()
def rep(a,b):
    global s
    assert s.count(a)==1, a[:70]; s=s.replace(a,b)
rep("""    for (const k of visible()) { const c = chunks.get(k);""","""    if (F) { items.push({ mesh: seaMesh, spec: 0, shadow: false }); env.fogN = 380; env.fogF = 2600; }
    for (const k of (F ? chunks.keys() : visible())) { const c = chunks.get(k);""")
rep("""if (k[0] !== "r" || nb.has(+k.slice(1))) items.push""","""if (F || k[0] !== "r" || nb.has(+k.slice(1))) items.push""")
rep("""const back = F.dir, k = cam.snap ? 1 : 1 - Math.exp(-dt * 4), k2 = cam.snap ? 1 : 1 - Math.exp(-dt * 8);
      const want2 = [F.pos[0] - back[0] * 15, F.pos[1] + 5.5 + F.u * 3, F.pos[2] - back[2] * 15];""","""const back = F.dir, k = cam.snap ? 1 : 1 - Math.exp(-dt * 7), k2 = cam.snap ? 1 : 1 - Math.exp(-dt * 12);
      const want2 = [F.pos[0] - back[0] * 11, F.pos[1] + 4 + F.u * 2, F.pos[2] - back[2] * 11];""")
rep("""let canvas, snowCv, snowCtx, cb = {},""","""let seaMesh = null; let canvas, snowCv, snowCtx, cb = {},""")
rep("""      if (ok) { rider = buildRider(); doorMesh = buildDoor(); }""","""      if (ok) { rider = buildRider(); doorMesh = buildDoor(); const sm = new MB(); sm.mat = MAT.water; sm.aoY = null; const R = 3200; sm.quad([-R, -6.4, -R], [-R, -6.4, R], [R, -6.4, R], [R, -6.4, -R], "#2f6f9c"); seaMesh = GLR.mesh(sm); }""")
open(p,'w').write(s)
p='/home/claude/portfolio/v5/js/app.js'; s=open(p).read()
rep("""    if (target == null) { b.classList.remove("on"); return; }""","""    clearTimeout(onFly.t); if (target == null) { b.classList.remove("on"); return; }""")
open(p,'w').write(s)
