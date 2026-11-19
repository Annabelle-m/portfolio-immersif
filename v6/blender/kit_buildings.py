# Kit de bâtiments : deux variantes par style de ville. Façade vers -y, origine au sol au centre.
import bpy, math, os, sys, importlib, random
sys.path.insert(0, os.path.expanduser("~/dev/portfolio-v4/blender"))
import lib; importlib.reload(lib)
from lib import *
reset(); lib._mats.clear()
R = os.path.expanduser("~/dev/portfolio-v4")

M = {}
def m(key, col, rough=.7, metal=0., emit=0.): M[key] = M.get(key) or mat(key, col, rough, metal, emit); return M[key]
GLASS = lambda: m("verre", "#2c3846", .08, .2)
LIT = lambda: m("verre_lumiere", "#ffd796", .3, 0, 2.5)
def G(rnd, p=.28): return LIT() if rnd.random() < p else GLASS()

out = []
def haussmann(v):
    r = random.Random(10 + v); w, d, gh, fh, n = 15, 12, 4.6, 3.1, 5
    stone = m("pierre_creme", ["#ddd0b6", "#e3d7bf"][v], .8); zinc = m("toit_zinc", "#5e6b76", .45, .3); iron = m("metal_fer", "#1d1f22", .5, .6)
    trim = m("menuiserie_blanche", "#efeae0", .5); k = Kit(f"haussmann_{'ab'[v]}"); front = -d / 2; H = gh + n * fh
    k.box((w, d, H), (0, 0, H / 2), stone)
    for z in [i * .55 for i in range(1, 8)]: k.box((w + .02, .04, .04), (0, front - .01, z), m("joint", "#b9ad94", .9))
    awn = m("toile_store", ["#6b1f2a", "#1f4636", "#23365e"][r.randint(0, 2)], .9)
    for i, x in enumerate((-4.8, 0, 4.8)):
        if i == 1: k.box((1.8, .3, 3.6), (x, front - .02, 1.8), m("bois_porte", "#3a2618", .6)); continue
        k.box((3.6, .1, 3.0), (x, front - .03, 1.7), G(r, .5) if r.random() < .5 else GLASS())
        k.box((3.9, .2, .25), (x, front - .1, 3.35), m("bois_vitrine", "#2c3a35", .6))
        k.box((3.9, 1.4, .06), (x, front - .7, 3.55), awn, rot=(math.radians(-18), 0, 0))
    k.box((w + .3, .4, .35), (0, front - .15, gh), stone, bevel=.05)
    cols = 5
    for f in range(n):
        z = gh + f * fh + .55
        for c in range(cols):
            x = -w / 2 + w / cols * (c + .5)
            window(k, x, z, 1.25, 2.05, front, G(r), trim, sill=stone)
            k.box((1.65, .12, .28), (x, front - .06, z + 2.25), stone, bevel=.03)
            if f in (0, 2, 3): railing(k, x - .7, x + .7, z - .05, front - .18, iron, .95)
        if f in (1, 4):
            k.box((w - .3, .9, .12), (0, front - .45, z - .12), stone, bevel=.03); railing(k, -w / 2 + .3, w / 2 - .3, z, front - .85, iron, .95)
    k.box((w + .6, .7, .45), (0, front - .2, H - .1), stone, bevel=.08)
    k.add(mansard(k.name, w + .2, d + .2, 3.8, (0, 0, H + .35), zinc, 1.2))
    for c in range(cols):
        x = -w / 2 + w / cols * (c + .5); k.box((1.3, 1.0, 1.9), (x, front + .95, H + 1.4), zinc)
        k.add(prism(k.name, 1.5, 1.2, .7, (x, front + .95, H + 2.35), zinc)); window(k, x, H + .9, .8, 1.1, front + .45, G(r, .2), trim, mull=False)
    for x in (-w / 2 + 1.5, w / 2 - 1.8): k.box((1.1, .7, 2.3), (x, 1, H + 4.6), m("brique", "#9b6a58", .9)); k.box((1.3, .9, .2), (x, 1, H + 5.75), stone)
    out.append(k.done())

def bordeaux(v):
    r = random.Random(20 + v); w, d, gh, fh, n = 13, 12, 4.4, 3.6, 3
    stone = m("pierre_blonde", ["#dcc596", "#e2cda2"][v], .85); slate = m("toit_ardoise", "#4f5761", .6); iron = m("metal_fer", "#1d1f22", .5, .6)
    trim = m("menuiserie_grise", "#d9d6cf", .5); k = Kit(f"bordeaux_{'ab'[v]}"); front = -d / 2; H = gh + n * fh
    k.box((w, d, H), (0, 0, H / 2), stone)
    for i, x in enumerate((-4.2, 0, 4.2)):
        k.box((2.5, .1, 2.6), (x, front - .02, 1.5), GLASS() if i != 1 else m("bois_porte", "#30251c", .6))
        k.add(cyl(k.name, 1.25, .1, (x, front - .02, 2.8), GLASS() if i != 1 else m("bois_porte", "#30251c", .6), rot=(math.pi / 2, 0, 0), verts=24))
        k.box((.5, .25, .55), (x, front - .12, 4.05), stone, bevel=.05)
    k.box((w + .2, .35, .3), (0, front - .12, gh), stone, bevel=.05)
    for f in range(n):
        z = gh + f * fh + .5
        for c in range(4):
            x = -w / 2 + w / 4 * (c + .5); window(k, x, z, 1.25, 2.5, front, G(r, .2), trim, sill=stone, shutters=None)
            k.box((1.6, .14, .35), (x, front - .07, z + 2.75), stone, bevel=.04)
        if f == 0: k.box((w - .4, .8, .12), (0, front - .4, z - .1), stone, bevel=.03); railing(k, -w / 2 + .3, w / 2 - .3, z, front - .75, iron)
    k.box((w + .5, .6, .4), (0, front - .2, H), stone, bevel=.08)
    for i in range(22): k.cyl(.09, .7, (-w / 2 + .5 + i * (w - 1) / 21, front + .1, H + .55), stone, verts=8)
    k.box((w, .3, .15), (0, front + .1, H + .95), stone)
    k.add(hip(k.name, w, d - .4, 2.6, (0, .3, H + .2), slate, .2))
    out.append(k.done())

def brownstone(v):
    r = random.Random(30 + v); w, d, fh, n = 8.5, 14, 3.3, 4
    brick = m("brique_rouge", ["#7a4535", "#6c3d30"][v], .9); lint = m("pierre_brune", "#b7a58c", .8); iron = m("metal_fer", "#1d1f22", .5, .6); trim = m("menuiserie_noire", "#2a2522", .5)
    k = Kit(f"brownstone_{'ab'[v]}"); front = -d / 2; H = n * fh + 1.4
    k.box((w, d, H), (0, 0, H / 2), brick)
    for f in range(n):
        z = 1.7 + f * fh
        for c in range(3):
            x = -w / 2 + w / 3 * (c + .5)
            if f == 0 and c == 0: continue
            window(k, x, z, 1.05, 1.95, front, G(r, .3), trim, sill=lint); k.box((1.4, .12, .25), (x, front - .06, z + 2.15), lint)
    k.box((w + .5, .8, .55), (0, front - .3, H - .1), m("corniche", "#3a2a24", .6), bevel=.06)
    for i in range(7): k.box((1.8, .35 + i * .35, .26), (-w / 3, front - .15 - i * .175, i * .26 + .13), lint)
    k.box((1.2, .15, 2.3), (-w / 3, front - .02, 3.0 - .2), m("bois_porte", "#3a2618", .6))
    for f in range(1, n):
        z = 1.5 + f * fh; k.box((w * .5, 1.1, .06), (w / 4, front - .6, z), iron); railing(k, 0, w / 2 - .2, z, front - 1.15, iron, .9, .25)
        k.box((.05, .8, 2.9), (w / 4, front - .6, z - 1.45), iron, rot=(math.radians(35), 0, 0))
    out.append(k.done())

def tower(v):
    r = random.Random(40 + v); w, d, H = (20, 18, 90) if v == 0 else (16, 16, 130)
    glass = m("verre_facade", ["#5f84a6", "#6d8fa8"][v], .06, .4); slab = m("metal_alu", "#c7ccd1", .35, .8); k = Kit(f"tour_{'ab'[v]}")
    k.box((w, d, H), (0, 0, H / 2), glass)
    for z in range(4, int(H), 4):
        k.box((w + .3, d + .3, .35), (0, 0, z), slab)
        for i in range(int(w / 3)):
            if r.random() < .3: k.box((2.6, .05, 2.4), (-w / 2 + 1.6 + i * 3, -d / 2 - .03, z + 1.6), LIT())
    for x in [-w / 2 + i * w / 6 for i in range(7)]: k.box((.25, .6, H), (x, -d / 2 - .25, H / 2), slab)
    k.box((w * .7, d * .7, 5), (0, 0, H + 2.5), slab); k.cyl(.35, 14, (w * .2, 0, H + 12), slab, verts=8)
    out.append(k.done())

def victorian(v):
    r = random.Random(50 + v); w, d, H = 7.6, 12, 9.4
    paint = m("bois_peint_" + "ab"[v], ["#e7a5ac", "#a5c9e2"][v], .6); trimM = m("menuiserie_blanche", "#efeae0", .5); roof = m("toit_ardoise", "#4f5761", .6)
    k = Kit(f"victorienne_{'ab'[v]}"); front = -d / 2
    k.box((w, d, 1.5), (0, 0, .75), m("soubassement", "#8a7e72", .9)); k.box((w, d, H - 1.5), (0, 0, 1.5 + (H - 1.5) / 2), paint)
    for z in [1.7 + i * .22 for i in range(34)]: k.box((w + .02, .03, .03), (0, front - .01, z), m("clin", "#000000", 1.) if False else paint)
    bx = -w * .2
    for f in range(2):
        z = 2 + f * 3.4
        k.box((3.6, 1.0, 3.2), (bx, front - .5, z + 1.6), paint, bevel=.04)
        for dx, ang in ((-1.25, 30), (0, 0), (1.25, -30)): window(k, bx + dx, z + .5, .85, 2.0, front - 1.02, G(r, .25), trimM, mull=False)
        window(k, w * .28, z + .5, .9, 2.0, front, G(r, .2), trimM)
    k.box((1.1, .12, 2.4), (w * .28, front - .02, 2.7), m("bois_porte", "#3a2618", .6))
    for i in range(5): k.box((1.6, .35, .28), (w * .28, front - .35 - i * .32, 1.4 - i * .28), trimM)
    k.box((w + .4, .5, .35), (0, front - .2, H), trimM, bevel=.04)
    k.add(prism(k.name, d + .6, w + .6, 4.2, (0, 0, H + .2), roof, ry=math.pi / 2))
    k.add(prism(k.name, .5, w + .9, 4.3, (0, front + .05, H + .15), trimM, ry=math.pi / 2))
    out.append(k.done())

def stucco(v):
    r = random.Random(60 + v); w, d, H = 14, 12, [5.2, 8.5][v]
    c = m("enduit_" + "ab"[v], ["#efc6a6", "#cfe3d8"][v], .85); k = Kit(f"stucco_{'ab'[v]}"); front = -d / 2
    k.box((w, d, H), (0, 0, H / 2), c); k.box((w + .4, d + .4, .7), (0, 0, H + .35), c, bevel=.05)
    k.box((w * .7, .1, 2.8), (0, front - .02, 1.6), G(r, .3)); k.box((w * .75, 1.6, .08), (0, front - .8, 3.3), m("toile_store", "#1f5b6e", .9), rot=(math.radians(-15), 0, 0))
    if H > 7: [window(k, x, 4.6, 2.2, 1.5, front, G(r, .3), m("menuiserie_blanche", "#efeae0", .5)) for x in (-4, 0, 4)]
    k.box((2.2, 1.5, 1.2), (3, 2, H + 1.3), m("metal_alu", "#c7ccd1", .4, .7))
    out.append(k.done())

def tokyo(v):
    r = random.Random(70 + v); w, d, H = 12, 14, [28, 44][v]
    conc = m("beton", ["#5b5d64", "#6c6a66"][v], .85); k = Kit(f"tokyo_{'ab'[v]}"); front = -d / 2
    k.box((w, d, H), (0, 0, H / 2), conc)
    for z in range(5, int(H) - 2, 3):
        k.box((w - .6, .05, 1.7), (0, front - .02, z + 1.1), LIT() if r.random() < .55 else GLASS()); k.box((w + .2, .5, .2), (0, front - .2, z + 2.2), conc)
    k.box((w * .9, .1, 3.5), (0, front - .03, 1.9), m("vitrine_lumiere", "#fff0d8", .3, 0, 1.6))
    neons = [("neon_rose", "#ff3d6e"), ("neon_cyan", "#3df2ff"), ("neon_jaune", "#ffe14d"), ("neon_violet", "#a46bff")]
    for i in range(3):
        key, col = neons[r.randint(0, 3)]; hh = 5 + r.random() * 9; x = -w / 2 + 1 + r.random() * (w - 2)
        k.box((1.0, 1.2, hh), (x, front - .8, 6 + r.random() * (H - hh - 8) + hh / 2), m(key, col, .3, 0, 4))
    k.box((w * .5, d * .4, 2.5), (0, 1, H + 1.25), conc); k.box((3, 3, 3), (2, 2, H + 4), m("metal_alu", "#c7ccd1", .4, .7))
    out.append(k.done())

def machiya(v, lanterns=False):
    r = random.Random(80 + v); w, d = 10, 12
    wood = m("bois_sombre", "#4a3324", .7); plaster = m("enduit_blanc", "#e6dccb", .9); tile = m("tuile_sombre", "#363a40", .55)
    k = Kit(("osaka" if lanterns else "machiya") + "_" + "ab"[v]); front = -d / 2
    k.box((w, d, 3.2), (0, 0, 1.6), wood); k.box((w, d - 1.2, 2.8), (0, .6, 4.6), plaster)
    for i in range(int(w / .3)): k.box((.06, .1, 2.6), (-w / 2 + .2 + i * .3, front - .06, 1.45), m("bois_lattis", "#2d1e14", .7))
    k.box((w * .6, .05, 1.2), (0, front + 1.15, 4.7), LIT() if r.random() < .4 else m("shoji", "#efe6d2", .9))
    for i in range(14): k.box((.04, .06, 1.25), (-w * .3 + i * w * .6 / 13, front + 1.12, 4.7), m("bois_lattis", "#2d1e14", .7))
    k.box((w + .6, 2.0, .18), (0, front - .5, 3.35), tile, rot=(math.radians(-22), 0, 0))
    k.add(prism(k.name, w + 1.2, d + 1.0, 2.4, (0, .3, 6.0), tile)); k.box((w + 1.3, .5, .35), (0, .3, 8.4), m("tuile_faitage", "#2a2d32", .5))
    if lanterns:
        for x in (-3, 0, 3): k.sph(.38, (x, front - .9, 2.6), m("lanterne", "#e5483c", .5, 0, 2.5), scale=(1, 1, 1.3))
        k.box((w * .45, .05, 1.0), (0, front - .45, 2.2), m("noren", "#283a6e", .9))
    out.append(k.done())

def snowhouse(v):
    r = random.Random(90 + v); w, d, H = 10, 10, 6.5
    c = m("bois_peint_neige_" + "ab"[v], ["#7d5446", "#4f5f7e"][v], .7); snow = m("neige", "#f4f7fb", .4); k = Kit(f"maison_neige_{'ab'[v]}"); front = -d / 2
    k.box((w, d, H), (0, 0, H / 2), c)
    for x in (-3, 0, 3):
        for z in (1.0, 3.9): window(k, x, z, 1.3, 1.5, front, LIT() if r.random() < .7 else GLASS(), m("menuiserie_blanche", "#efeae0", .5))
    k.add(prism(k.name, w + 1.2, d + 1.4, 4.4, (0, 0, H), m("toit_tole", "#3e3a3a", .5, .4)))
    k.add(prism(k.name, w + 1.3, d + 1.5, 4.45, (0, 0, H + .22), snow)); k.box((w + 1.2, 1.4, .6), (0, front - .5, .3), snow, bevel=.25)
    out.append(k.done())

def terrace(v):
    r = random.Random(100 + v); w, d, H = 9, 13, 7.6
    c = m("enduit_" + "cd"[v], ["#e7dcc6", "#c99a7e"][v], .85); iron = m("dentelle_fonte", "#2a2c2e", .5, .5); white = m("menuiserie_blanche", "#efeae0", .5)
    k = Kit(f"terrace_{'ab'[v]}"); front = -d / 2
    k.box((w, d, H), (0, 0, H / 2), c)
    for x in (-2.4, 2.4):
        window(k, x, .8, 1.3, 2.2, front, G(r, .2), white); window(k, x, 4.3, 1.3, 2.2, front, G(r, .2), white)
    k.box((w, 2.3, .15), (0, front - 1.15, 3.6), white)
    k.box((w + .2, 2.6, .1), (0, front - 1.3, H - .3), m("toit_tole", ["#6b7d6a", "#8a3a32"][v], .45, .5), rot=(math.radians(-6), 0, 0))
    for x in [-w / 2 + .15 + i * (w - .3) / 3 for i in range(4)]: k.cyl(.07, H - .3, (x, front - 2.3, (H - .3) / 2), white, verts=10)
    railing(k, -w / 2 + .2, w / 2 - .2, 3.68, front - 2.3, iron, .95, .1)
    for x in [-w / 2 + .3 + i * .6 for i in range(int(w / .6))]: k.sph(.12, (x, front - 2.3, H - .55), iron, scale=(1.5, .3, 1))
    k.box((w + .2, d + .2, .9), (0, 0, H + .45), c, bevel=.06)
    out.append(k.done())

def queenslander(v):
    r = random.Random(110 + v); w, d, h0 = 12, 11, 2.4
    white = m("bois_blanc", ["#f4f2ec", "#e3ecee"][v], .6); post = m("bois_brut", "#8a7a68", .8); roof = m("toit_tole", ["#b9bec2", "#8c3a32"][v], .45, .5)
    k = Kit(f"queenslander_{'ab'[v]}"); front = -d / 2
    for x in [-w / 2 + .3 + i * (w - .6) / 4 for i in range(5)]:
        for y in (front + .3, -front - .3): k.box((.3, .3, h0), (x, y, h0 / 2), post)
    k.box((w, d, 4), (0, 0, h0 + 2), white)
    for z in [h0 + .2 + i * .25 for i in range(15)]: k.box((w + .02, .03, .04), (0, front - .01, z), white)
    for x in (-3.5, 0, 3.5): window(k, x, h0 + .8, 1.3, 1.9, front, G(r, .2), white, shutters=m("volet", ["#3d6e5a", "#3a5a7a"][v], .6))
    k.box((w, 2.4, .15), (0, front - 1.2, h0), m("plancher_bois", "#cbb79a", .7)); railing(k, -w / 2, w / 2, h0, front - 2.35, white, 1.0, .18)
    for i in range(7): k.box((1.4, .4, .25), (0, front - 2.6 - i * .4, h0 - .2 - i * .34), m("plancher_bois", "#cbb79a", .7))
    k.add(hip(k.name, w + 3.2, d + 5, 3.4, (0, -1.2, h0 + 4), roof, .15))
    out.append(k.done())

def modern(v):
    r = random.Random(120 + v); w, d = 16, 12
    white = m("enduit_blanc_lisse", "#f2f1ec", .4); k = Kit(f"moderne_{'ab'[v]}"); front = -d / 2
    k.box((w * .8, d, 3.6), (-w * .1, 0, 1.8), white); k.box((w * .85, d - 1, 3.4), (w * .1, -.5 + 1, 5.3), white)
    k.box((w * .6, .08, 3.0), (-w * .1, front - .02, 1.7), G(r, .35)); k.box((w * .6, .08, 2.7), (w * .1, front + .48, 5.2), G(r, .3))
    k.box((w * .9, d + .6, .3), (w * .1, .5, 7.15), m("beton_clair", "#d8d4cc", .6))
    k.box((w * .14, 4, 1.1), (-w * .44, front - 2, .55), m("bois_bardage", "#9a7452", .7))
    out.append(k.done())

def highrise(v):
    r = random.Random(130 + v); w, d, H = 18, 14, [70, 105][v]
    white = m("beton_blanc", "#f3f2ee", .5); glass = m("verre_bleu", "#6fa3c6", .06, .3); k = Kit(f"residence_{'ab'[v]}"); front = -d / 2
    k.box((w, d, H), (0, 0, H / 2), glass)
    for z in range(3, int(H), 3):
        k.box((w + .2, 1.6, .22), (0, front - .7, z), white); k.box((w + .2, .05, 1.0), (0, front - 1.45, z + .6), m("verre_garde_corps", "#bcd8e6", .1, .1))
    for x in (-w / 2 + .5, w / 2 - .5): k.box((1, d + 1.6, H), (x, -.8, H / 2), white)
    k.box((w * .5, d * .5, 4), (0, 0, H + 2), white)
    out.append(k.done())

def colonial(v):
    r = random.Random(140 + v); w, d, H = 13, 10, 4.4
    c = m("enduit_" + "ef"[v], ["#ecc9a2", "#c9dce2"][v], .85); white = m("menuiserie_blanche", "#efeae0", .5); roof = m("toit_tole", "#a8b0b5", .45, .5)
    k = Kit(f"colonial_{'ab'[v]}"); front = -d / 2
    k.box((w, d, H), (0, 0, H / 2), c)
    for x in (-4, -1.3, 1.3, 4): window(k, x, .8, 1.1, 1.8, front, G(r, .3), white, shutters=m("volet", "#3d6e5a", .6))
    k.box((w, 2.6, .1), (0, front - 1.3, 3.5), roof, rot=(math.radians(-8), 0, 0))
    for x in [-w / 2 + .2 + i * (w - .4) / 4 for i in range(5)]: k.cyl(.08, 3.4, (x, front - 2.4, 1.7), white, verts=10)
    k.add(hip(k.name, w + .6, d + .6, 2.4, (0, 0, H), roof, .1))
    out.append(k.done())

def casino(v):
    r = random.Random(150 + v); w, d, H = 34, 26, [26, 42][v]
    body = m("facade_casino_" + "ab"[v], ["#2a2036", "#e8ddc8"][v], .5); k = Kit(f"casino_{'ab'[v]}"); front = -d / 2
    n1, c1 = [("neon_rose", "#ff4fa0"), ("neon_cyan", "#4ff0ff")][v]
    k.box((w, d, H), (0, 0, H / 2), body)
    for z in range(8, int(H) - 2, 3):
        for i in range(10): k.box((2.2, .05, 1.6), (-w / 2 + 1.8 + i * 3.4, front - .02, z + .8), LIT() if r.random() < .65 else GLASS())
    for z in (7, H - .5): k.box((w + .2, .2, .45), (0, front - .1, z), m(n1, c1, .3, 0, 5))
    for x in (-w / 2, w / 2): k.box((.4, .3, H), (x, front - .1, H / 2), m("neon_or", "#ffd84a", .3, 0, 4))
    k.box((w * .8, 6, .6), (0, front - 3, 5), m(n1, c1, .3, 0, 5))
    for i in range(28): k.sph(.16, (-w * .4 + i * w * .8 / 27, front - 6, 4.7), m("ampoule", "#fff4c0", .2, 0, 6), seg=8, ring=6)
    for x in (-w * .38, w * .38): k.cyl(.3, 5, (x, front - 5.6, 2.5), m("metal_or", "#c9a24a", .3, 1.), verts=12)
    out.append(k.done())

for fn in (haussmann, bordeaux, brownstone, tower, victorian, stucco, tokyo, snowhouse, terrace, queenslander, modern, highrise, colonial, casino):
    for v in (0, 1): fn(v)
for v in (0, 1): machiya(v); machiya(v, lanterns=True)

setup_render((1800, 1100))
bpy.ops.mesh.primitive_plane_add(size=600, location=(60, -60, 0)); g = bpy.context.object; g.name = "SOL_APERCU"; assign(g, mat("sol", "#8a8f96", .9))
lay_out(out, cols=8, step=34)
shot(R + "/renders/kit_batiments.png", (120, -330, 160), (120, -60, 10), 35)
reset_layout(out)
export_glb(R + "/models/kit_batiments.glb", out)
print("KIT_BUILDINGS_DONE", len(out), sum(len(o.data.vertices) for o in out))
