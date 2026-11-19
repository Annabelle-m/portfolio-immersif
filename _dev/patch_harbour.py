p='/home/claude/portfolio/v5/js/models.js'; s=open(p).read()
a=s.index('    const b = far(sec, .85, -260), B = new Loc(bg, [b.p[0], 0, b.p[2]], b.ry + Math.PI / 2);')
b=s.index('  if (ok("uluru"))')
s=s[:a]+'''    /* v5 : Harbour Bridge en arc continu (membrures lisses, suspentes accrochées au tablier) */
    const b = far(sec, .85, -260), B = new Loc(bg, [b.p[0], 0, b.p[2]], b.ry + Math.PI / 2), N = 32, DECK = 48, col = "#7d858d";
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
'''+s[b:]
open(p,'w').write(s)
