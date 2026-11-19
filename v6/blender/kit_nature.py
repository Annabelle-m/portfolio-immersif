# Kit végétation et mobilier : arbres à feuillage déformé par du bruit, palmiers à palmes, lampadaires...
import bpy, bmesh, math, os, sys, importlib, random
sys.path.insert(0, os.path.expanduser("~/dev/portfolio-v4/blender"))
import lib; importlib.reload(lib)
from lib import *
reset(); lib._mats.clear()
R = os.path.expanduser("~/dev/portfolio-v4")
out = []
def m(key, col, rough=.7, metal=0., emit=0.): return mat(key, col, rough, metal, emit)
TEX = bpy.data.textures.get("v4_bruit") or bpy.data.textures.new("v4_bruit", "CLOUDS"); TEX.noise_scale = .55

def canopy(k, loc, r, mm, squash=1., strength=.32, subd=3):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subd, radius=r, location=loc)
    o = bpy.context.object; o.scale = (1, 1, squash); bpy.ops.object.transform_apply(scale=True)
    d = o.modifiers.new("disp", "DISPLACE"); d.texture = TEX; d.strength = strength * r; d.mid_level = .5
    d.texture_coords = "GLOBAL"
    for p in o.data.polygons: p.use_smooth = True
    assign(o, mm); k.add(o)

def branchy(k, base, dirv, length, radius, mm, depth, rnd, spread=.5):
    import mathutils
    end = mathutils.Vector(base) + mathutils.Vector(dirv).normalized() * length
    k.add(tube(k.name, [tuple(base), tuple((mathutils.Vector(base) + end) / 2 + mathutils.Vector((rnd.uniform(-.1, .1), rnd.uniform(-.1, .1), 0))), tuple(end)], radius, mm))
    if depth <= 0: return [tuple(end)]
    tips = []
    for i in range(2):
        nd = mathutils.Vector(dirv).normalized() + mathutils.Vector((rnd.uniform(-spread, spread), rnd.uniform(-spread, spread), rnd.uniform(.1, .4)))
        tips += branchy(k, end, nd, length * .7, radius * .62, mm, depth - 1, rnd, spread)
    return tips

def leafy(name, seed, trunk_h, crown, col, bark="#6d5a48", n=6, squash=.85, spread=1.):
    r = random.Random(seed); k = Kit(name); bk = m("ecorce_" + name, bark, .9); lf = m("feuillage_" + name, col, .8)
    tips = branchy(k, (0, 0, 0), (0, 0, 1), trunk_h, .22 * crown / 2.6, bk, 2, r, .55)
    canopy(k, (0, 0, trunk_h + crown * .55), crown, lf, squash)
    for t in tips[:n]: canopy(k, (t[0] * spread, t[1] * spread, t[2] + crown * .15), crown * r.uniform(.55, .75), lf, squash)
    out.append(k.done())

leafy("platane_a", 1, 3.6, 2.6, "#5f7c3f", "#9a917c"); leafy("platane_b", 2, 3.9, 2.9, "#6b8845", "#9a917c")
leafy("arbre_a", 3, 2.8, 2.2, "#557a3a"); leafy("arbre_b", 4, 3.2, 2.5, "#4f6f3f")
leafy("cerisier_a", 5, 2.2, 2.2, "#f0b3c6", "#4a3329", 7, .75, 1.2); leafy("cerisier_b", 6, 2.4, 2.4, "#e796ae", "#4a3329", 7, .75, 1.2)
leafy("jacaranda_a", 7, 2.6, 2.6, "#9677d3", "#4a3a32", 7, .7, 1.25); leafy("eucalyptus_a", 8, 4.6, 2.0, "#73905c", "#e4ddd0", 5, .7, 1.5)

# cyprès
k = Kit("cypres_a"); k.add(tube(k.name, [(0, 0, 0), (0, 0, 1.2)], .15, m("ecorce", "#4a3a2a", .9))); canopy(k, (0, 0, 4.2), 1.0, m("feuillage_cypres", "#2f4a35", .8), 3.6, .18); out.append(k.done())
# pins (normaux et enneigés)
for name, snow in (("pin_a", False), ("pin_neige_a", True)):
    k = Kit(name); k.add(cyl(name, .2, 1.4, (0, 0, .7), m("ecorce", "#4a3a2a", .9), verts=12))
    for i in range(5):
        bpy.ops.mesh.primitive_cone_add(radius1=2.4 - i * .42, depth=2.3, location=(0, 0, 1.6 + i * 1.35), vertices=24)
        o = bpy.context.object; d = o.modifiers.new("disp", "DISPLACE"); d.texture = TEX; d.strength = .25
        for p in o.data.polygons: p.use_smooth = True
        assign(o, m("feuillage_pin", "#2c4c42", .85)); k.add(o)
        if snow:
            bpy.ops.mesh.primitive_cone_add(radius1=(2.4 - i * .42) * .6, depth=1.3, location=(0, 0, 2.15 + i * 1.35), vertices=24)
            o = bpy.context.object; assign(o, m("neige", "#f4f7fb", .4)); k.add(o)
    out.append(k.done())
# palmier
for name, seed in (("palmier_a", 11), ("palmier_b", 12)):
    r = random.Random(seed); k = Kit(name); H = 9 + r.random() * 3; lean = r.uniform(-.8, .8)
    pts = [(lean * (i / 6) ** 2, 0, H * i / 6) for i in range(7)]
    k.add(tube(name, pts, .24, m("tronc_palmier", "#8a7358", .9)))
    for i in range(14): k.add(cyl(name, .27 - i * .004, .12, (lean * (i / 14) ** 2, 0, .4 + i * H / 15), m("anneau_palmier", "#6f5c45", .9), verts=12))
    top = pts[-1]; k.sph(.42, top, m("coeur_palmier", "#5d5132", .9))
    lf = m("palme", "#4a7a36", .75)
    for f in range(12):
        an = f / 12 * math.tau + r.random() * .3; L = 3.6 + r.random() * 1.3; up = .5 + r.random() * .6
        bm = bmesh.new(); prev = None
        for s in range(13):
            t = s / 12; cx = top[0] + math.cos(an) * L * t; cy = top[1] + math.sin(an) * L * t; cz = top[2] + up * math.sin(t * 2.4) - 2.3 * t * t
            w = .55 * math.sin(math.pi * min(1, t * 1.1 + .05)) + .05; px, py = -math.sin(an), math.cos(an)
            row = [bm.verts.new((cx + px * w, cy + py * w, cz - w * .4)), bm.verts.new((cx, cy, cz + .04)), bm.verts.new((cx - px * w, cy - py * w, cz - w * .4))]
            if prev: bm.faces.new((prev[0], row[0], row[1], prev[1])); bm.faces.new((prev[1], row[1], row[2], prev[2]))
            prev = row
        me = bpy.data.meshes.new("v4_palme"); bm.to_mesh(me); bm.free()
        o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o); assign(o, lf)
        for p in o.data.polygons: p.use_smooth = True
        k.add(o)
    out.append(k.done())
# arbre carquois (Namibie), acacia, arbre mort de Deadvlei
k = Kit("carquois_a"); bark = m("ecorce_carquois", "#c9b48a", .9); r = random.Random(21)
k.add(tube(k.name, [(0, 0, 0), (0, 0, 1.2), (0, 0, 2.4)], .45, bark))
for i in range(7):
    a = i / 7 * math.tau; e = (math.cos(a) * 1.4, math.sin(a) * 1.4, 3.7 + r.random() * .5)
    k.add(tube(k.name, [(0, 0, 2.3), (e[0] * .5, e[1] * .5, 3.1), e], .12, bark)); canopy(k, (e[0], e[1], e[2] + .25), .55, m("rosette_aloe", "#7a8a5a", .8), .7, .4, 2)
out.append(k.done())
k = Kit("acacia_a"); r = random.Random(22); bk = m("ecorce_acacia", "#4a3428", .9)
for t in branchy(k, (0, 0, 0), (0, 0, 1), 2.6, .22, bk, 2, r, .9): pass
canopy(k, (0, 0, 4.7), 3.2, m("feuillage_acacia", "#56603a", .8), .28, .5); out.append(k.done())
k = Kit("arbre_mort_a"); r = random.Random(23); branchy(k, (0, 0, 0), (0, 0, 1), 2.4, .26, m("bois_noir", "#17110e", .8), 4, r, .9); out.append(k.done())
# cactus saguaro
k = Kit("cactus_a"); cm = m("cactus", "#3b6a45", .7)
k.add(tube(k.name, [(0, 0, 0), (0, 0, 3), (0, 0, 5)], .36, cm)); k.add(tube(k.name, [(0, 0, 2.1), (.9, 0, 2.2), (1.2, 0, 2.6), (1.2, 0, 3.9)], .26, cm)); k.add(tube(k.name, [(0, 0, 2.8), (-.8, 0, 2.9), (-1, 0, 3.2), (-1, 0, 4.3)], .23, cm)); out.append(k.done())
# rochers, touffes
for name, col, sc in (("rocher_a", "#9a4a26", (1.6, 1.2, .8)), ("touffe_a", "#a89a4a", (.9, .9, .45)), ("buisson_a", "#4f6a3a", (1, 1, .7))):
    k = Kit(name); canopy(k, (0, 0, sc[2] * .6), 1, m(name, col, .9), 1, .45 if "rocher" in name else .3, 3)
    o = k.parts[-1]; o.scale = sc; bpy.context.view_layer.objects.active = o; out.append(k.done())
# mobilier
iron = m("metal_fonte", "#1f3a2e", .5, .6); glow = m("lampe_verre", "#ffe2a2", .3, 0, 3)
k = Kit("lampadaire_paris"); k.cyl(.16, .7, (0, 0, .35), iron, 16); k.add(tube(k.name, [(0, 0, .6), (0, 0, 2.5), (0, 0, 4.0)], .07, iron)); k.box((.5, .5, .75), (0, 0, 4.45), glow, bevel=.03)
for sx in (-1, 1):
    for sy in (-1, 1): k.box((.04, .04, .8), (sx * .26, sy * .26, 4.45), iron)
k.add(hip(k.name, .8, .8, .45, (0, 0, 4.85), iron, .1)); k.sph(.07, (0, 0, 5.35), iron); out.append(k.done())
k = Kit("lampadaire_moderne"); alu = m("metal_alu", "#8a8f96", .4, .8); k.add(tube(k.name, [(0, 0, 0), (0, 0, 5.6), (0, -.6, 6.1), (0, -1.6, 6.2)], .08, alu)); k.box((.4, .9, .14), (0, -1.6, 6.15), alu, bevel=.03); k.box((.3, .7, .03), (0, -1.6, 6.07), glow); out.append(k.done())
k = Kit("lanterne_japon"); wood = m("bois_sombre", "#3a2a24", .7); k.cyl(.07, 3.2, (0, 0, 1.6), wood, 10); k.box((.06, .9, .06), (0, -.4, 3.15), wood); k.sph(.33, (0, -.8, 2.75), m("lanterne", "#e5483c", .5, 0, 2.5), scale=(1, 1, 1.35), seg=20, ring=12); k.cyl(.2, .06, (0, -.8, 3.2), wood); k.cyl(.2, .06, (0, -.8, 2.3), wood); out.append(k.done())
k = Kit("lanterne_pierre"); st = m("pierre_grise", "#9a978e", .9); k.box((.8, .8, .3), (0, 0, .15), st, .03); k.cyl(.15, 1, (0, 0, .8), st, 12); k.box((.7, .7, .55), (0, 0, 1.55), st, .03); k.box((.36, .05, .3), (0, -.36, 1.55), glow); k.add(hip(k.name, 1.2, 1.2, .55, (0, 0, 1.82), st, .1)); k.sph(.1, (0, 0, 2.45), st); out.append(k.done())
k = Kit("banc"); wd = m("bois_banc", "#7a5434", .7); k.box((1.8, .45, .07), (0, 0, .45), wd, .015); k.box((1.8, .07, .4), (0, .24, .75), wd, .015)
for x in (-.75, .75): k.box((.07, .5, .45), (x, 0, .22), iron)
out.append(k.done())
k = Kit("distributeur"); k.box((1, .8, 1.9), (0, 0, .95), m("plastique_blanc", "#eef2f4", .4), .03); k.box((.8, .04, .9), (0, -.41, 1.25), m("vitrine_lumiere", "#bfe6ff", .2, 0, 2)); k.box((.5, .04, .25), (0, -.41, .4), m("plastique_noir", "#222326", .5)); out.append(k.done())
k = Kit("cerf"); fur = m("pelage_cerf", "#a06e3e", .8)
k.sph(.55, (0, 0, .95), fur, scale=(1, .5, .55), seg=20, ring=12)
for x in (-.35, .35):
    for y in (-.13, .13): k.add(tube(k.name, [(x, y, .9), (x, y, .45), (x, y, 0)], .05, fur))
k.add(tube(k.name, [(.45, 0, 1.05), (.6, 0, 1.4), (.65, 0, 1.55)], .1, fur)); k.sph(.16, (.78, 0, 1.58), fur, scale=(1.4, .8, .8))
for y in (-.06, .06): k.add(tube(k.name, [(.72, y, 1.7), (.68, y * 2, 1.9), (.62, y * 3, 2.0)], .015, m("bois_cerf", "#5a4030", .7)))
out.append(k.done())
k = Kit("panneau_pub"); fr = m("metal_alu", "#55585c", .5, .6); k.cyl(.18, 6, (-2.5, 0, 3), fr, 12); k.cyl(.18, 6, (2.5, 0, 3), fr, 12); k.box((7.4, .3, 3.6), (0, .15, 7.8), m("cadre_pub", "#1c1c22", .5), .03)
for x in (-2.4, 0, 2.4): k.box((.1, .8, .1), (x, -.4, 9.7), fr)
out.append(k.done())

setup_render((1800, 1000))
bpy.ops.mesh.primitive_plane_add(size=400, location=(40, -20, 0)); g = bpy.context.object; g.name = "SOL_APERCU"; assign(g, mat("sol", "#8a8f96", .9))
lay_out(out, cols=11, step=9)
shot(R + "/renders/kit_nature.png", (45, -95, 30), (45, -14, 3), 40)
reset_layout(out)
export_glb(R + "/models/kit_nature.glb", out)
print("KIT_NATURE_DONE", len(out), sum(len(o.data.vertices) for o in out))
