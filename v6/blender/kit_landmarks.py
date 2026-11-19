# Kit monuments et aéroport.
import bpy, math, os, sys, importlib, random
sys.path.insert(0, os.path.expanduser("~/dev/portfolio-v4/blender"))
import lib; importlib.reload(lib)
from lib import *
reset(); lib._mats.clear()
R = os.path.expanduser("~/dev/portfolio-v4")
out = []
def m(key, col, rough=.7, metal=0., emit=0.): return mat(key, col, rough, metal, emit)
TEX = bpy.data.textures.get("v4_bruit") or bpy.data.textures.new("v4_bruit", "CLOUDS"); TEX.noise_scale = .55

# --- Tour Eiffel (160 m) : arêtes, contreventement en treillis, arches, plateformes ---
k = Kit("eiffel"); fe = m("metal_eiffel", "#6a5444", .55, .5); H = 160
W = lambda z: 33 * (1 - z / (H * 1.02)) ** 2.3 + .9
Wi = lambda z: max(0, W(z) - 11 * (1 - min(1, z / 56)) ** .8 - .1 * W(z))  # arête intérieure des piliers jusqu'à leur jonction
zs = [0, 6, 13, 21, 30, 40, 50, 58, 68, 80, 94, 110, 126, 142, 156]
for sx in (-1, 1):
    for sy in (-1, 1):
        for i in range(len(zs) - 1):
            z0, z1 = zs[i], zs[i + 1]
            beam(k, (sx * W(z0), sy * W(z0), z0), (sx * W(z1), sy * W(z1), z1), 1.3 if z0 < 58 else .9, fe)
            if z1 <= 58:
                beam(k, (sx * Wi(z0), sy * W(z0), z0), (sx * Wi(z1), sy * W(z1), z1), .9, fe)
                beam(k, (sx * W(z0), sy * Wi(z0), z0), (sx * W(z1), sy * Wi(z1), z1), .9, fe)
                beam(k, (sx * W(z0), sy * W(z0), z0), (sx * Wi(z1), sy * W(z1), z1), .35, fe)
                beam(k, (sx * W(z0), sy * W(z0), z0), (sx * W(z1), sy * Wi(z1), z1), .35, fe)
            else:
                beam(k, (sx * W(z0), sy * W(z0), z0), (-sx * W(z1), sy * W(z1), z1), .3, fe)
                beam(k, (sx * W(z0), sy * W(z0), z0), (sx * W(z1), -sy * W(z1), z1), .3, fe)
for ax in range(4):  # arches entre les piliers
    for s in range(12):
        a0, a1 = math.pi * s / 12, math.pi * (s + 1) / 12; r = 20; c = 13
        P = lambda a: (math.cos(a) * r, -W(13) if ax == 0 else W(13), c + math.sin(a) * 9 - 2)
        if ax < 2: beam(k, P(a0), P(a1), .7, fe)
        else:
            Q = lambda a: ((-W(13) if ax == 2 else W(13)), math.cos(a) * r, c + math.sin(a) * 9 - 2); beam(k, Q(a0), Q(a1), .7, fe)
for z, w, h in ((58, W(58) * 2 + 4, 3), (110, W(110) * 2 + 2.5, 2), (152, 4.5, 4)): k.box((w, w, h), (0, 0, z), fe, .2)
k.cyl(.6, 14, (0, 0, H + 3), fe, 10); out.append(k.done())

# --- Place de la Bourse et son miroir d'eau ---
k = Kit("bourse"); st = m("pierre_blonde", "#e1cb9c", .85); sl = m("toit_ardoise", "#4f5761", .6); gl = m("verre", "#2c3846", .08, .2)
k.box((120, 16, 15), (0, 0, 7.5), st); k.add(hip(k.name, 120, 15, 5, (0, 0, 15), sl, .3)); k.box((24, 18, 22), (0, -1, 11), st)
k.add(hip(k.name, 24, 17, 5, (0, -1, 22), sl, .2))
for x in range(-57, 58, 4):
    window(k, x, 2, 2, 4, -8, gl, st, mull=False); k.add(cyl(k.name, 1.0, .25, (x, -8.06, 6.1), gl, rot=(math.pi / 2, 0, 0), verts=16)); window(k, x, 9, 1.8, 3.4, -8, gl, st)
for x in range(-10, 11, 3): k.cyl(.55, 14, (x, -10.2, 7), st, 16)
k.box((24, 1.5, 1.4), (0, -10.4, 14.5), st, .1)
k.box((110, 22, .08), (0, -22, .04), m("eau_miroir", "#1d2a38", .02, .6)); out.append(k.done())

# --- Torii ---
k = Kit("torii"); red = m("laque_vermillon", "#d8432f", .4); blk = m("laque_noire", "#1e1e22", .4)
for x in (-6.5, 6.5): k.cyl(.5, 9.6, (x, 0, 4.8), red, 24); k.cyl(.62, .8, (x, 0, .4), blk, 24)
k.box((15, .7, .7), (0, 0, 7.6), red, .05); k.box((17.4, .9, .55), (0, 0, 9.2), red, .05)
bm_pts = [(-9.6, 0, 9.85), (-5, 0, 9.65), (0, 0, 9.6), (5, 0, 9.65), (9.6, 0, 9.85)]
k.add(tube(k.name, bm_pts, .5, blk)); k.box((.8, .5, 1.6), (0, 0, 8.4), blk); out.append(k.done())

# --- Pagode à cinq toits ---
k = Kit("pagode"); wood = m("bois_vermillon", "#8a3a2a", .6); tile = m("tuile_sombre", "#363a40", .55); gold = m("or", "#c9a24a", .3, 1.)
for i in range(5):
    w = 11 - i * 1.5; z = i * 7.2
    k.box((w * .62, w * .62, 6), (0, 0, z + 3), wood); k.add(hip(k.name, w + 3.5, w + 3.5, 1.6, (0, 0, z + 5.6), tile, .55))
k.cyl(.35, 10, (0, 0, 41), gold, 12)
for z in range(37, 45, 2): k.cyl(.8, .25, (0, 0, z), gold, 16)
out.append(k.done())

# --- Opéra de Sydney ---
k = Kit("opera"); sh = m("coque_opera", "#f4f1e8", .35); base = m("socle_opera", "#c9b89a", .8)
k.box((110, 60, 6), (0, 0, 3), base)
for (x, h, w, d) in ((-34, 38, 26, 30), (-6, 32, 22, 26), (18, 25, 18, 22), (36, 18, 14, 18)):
    for sy in (-1, 1):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=(x, sy * 9, 6), segments=40, ring_count=20)
        o = bpy.context.object; o.scale = (w * .6, d * .45, h); o.rotation_euler = (0, math.radians(-25), 0)
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        for p in o.data.polygons: p.use_smooth = True
        bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="DESELECT"); bpy.ops.object.mode_set(mode="OBJECT")
        for v in o.data.vertices: v.select = v.co.z < -.1
        bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.delete(type="VERT"); bpy.ops.object.mode_set(mode="OBJECT")
        assign(o, sh); k.add(o)
out.append(k.done())

# --- Tour de Tokyo ---
k = Kit("tour_tokyo"); rd = m("metal_rouge", "#e0523f", .5, .4); wh = m("metal_blanc", "#f4f0ea", .5, .4); H = 230
Wt = lambda z: 28 * (1 - z / (H * 1.05)) ** 2 + .6
zs = [0, 15, 32, 50, 70, 92, 115, 140, 165, 190, 215, 230]
for sx in (-1, 1):
    for sy in (-1, 1):
        for i in range(len(zs) - 1):
            z0, z1 = zs[i], zs[i + 1]; col = wh if (i % 2) else rd
            beam(k, (sx * Wt(z0), sy * Wt(z0), z0), (sx * Wt(z1), sy * Wt(z1), z1), 1.1, col)
            beam(k, (sx * Wt(z0), sy * Wt(z0), z0), (-sx * Wt(z1), sy * Wt(z1), z1), .35, col)
            beam(k, (sx * Wt(z0), sy * Wt(z0), z0), (sx * Wt(z1), -sy * Wt(z1), z1), .35, col)
for z, w in ((120, 24), (200, 9)): k.box((w, w, 8), (0, 0, z), wh, .3)
k.cyl(.9, 40, (0, 0, H + 20), wh, 10); out.append(k.done())

# --- Château d'Osaka ---
k = Kit("chateau_osaka"); stn = m("pierre_rempart", "#7a756b", .9); wl = m("enduit_blanc", "#f2f0ea", .8); gr = m("tuile_verte", "#3f7a6a", .5); gold = m("or", "#c9a24a", .3, 1.)
k.add(hip(k.name, 80, 80, 18, (0, 0, 0), stn, .82)); z = 18
for (w, h) in ((46, 11), (38, 9), (30, 8), (22, 7), (15, 7)):
    k.box((w, w * .8, h), (0, 0, z + h / 2), wl); k.add(hip(k.name, w + 7, w * .8 + 7, 3, (0, 0, z + h), gr, .55))
    for x in range(-int(w / 2) + 3, int(w / 2) - 2, 4): window(k, x, z + h * .35, 1.2, 1.6, -w * .4, m("verre", "#2c3846", .08, .2), m("bois_sombre", "#3a2a24", .7), mull=False)
    z += h + 3
k.box((3, 3, 3), (0, 0, z + 1.5), gold); out.append(k.done())

# --- Uluru, dunes ---
k = Kit("uluru"); bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=64, ring_count=32); o = bpy.context.object; o.scale = (330, 150, 95); bpy.ops.object.transform_apply(scale=True)
d = o.modifiers.new("disp", "DISPLACE"); t2 = bpy.data.textures.new("v4_strates", "STUCCI"); t2.noise_scale = .4; d.texture = t2; d.strength = 6; d.texture_coords = "GLOBAL"
for p in o.data.polygons: p.use_smooth = True
assign(o, m("roche_uluru", "#b14f28", .85)); k.add(o); out.append(k.done())
k = Kit("dune"); bm_v = []; N = 24
import bmesh
bm = bmesh.new(); grid = []
for i in range(N + 1):
    row = []
    for j in range(N + 1):
        x = (i / N - .5) * 300; y = (j / N - .5) * 220; crest = 1 - abs(y + 20 * math.sin(x / 60)) / 110
        h = max(0, crest) ** 1.6 * 110 * (1 - (abs(i / N - .5) * 2) ** 3)
        row.append(bm.verts.new((x, y, h)))
    grid.append(row)
for i in range(N):
    for j in range(N): bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))
me = bpy.data.meshes.new("v4_dune"); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new("dune", me); bpy.context.collection.objects.link(o)
for p in o.data.polygons: p.use_smooth = True
assign(o, m("sable_rouge", "#c5562e", .9)); k.add(o); out.append(k.done())

# --- Aéroport : terminal, tour de contrôle, avion ---
k = Kit("terminal"); gls = m("verre_terminal", "#86aecb", .05, .4); alu = m("metal_alu", "#d9dde2", .3, .8); warm = m("hall_lumiere", "#f3e6cc", .5, 0, .9)
k.box((150, 36, 12), (0, 0, 6), gls)
for x in range(-74, 75, 4): k.box((.3, .5, 12), (x, -18.1, 6), alu)
k.box((150, .5, .4), (0, -18.1, 6), alu); k.box((146, .05, 5.4), (0, -18.02, 2.9), warm)
bpy.ops.mesh.primitive_cylinder_add(radius=1, depth=158, location=(0, 0, 12), rotation=(0, math.pi / 2, 0), vertices=48)
o = bpy.context.object; o.scale = (1, 26, 4.5); bpy.ops.object.transform_apply(scale=True)
for p in o.data.polygons: p.use_smooth = True
assign(o, alu); k.add(o)
k.box((16, 6, .4), (0, -21, 3.6), alu); [k.box((.25, .25, 3.6), (x, -23.6, 1.8), alu) for x in (-7.6, 7.6)]
k.box((7.6, .1, 3.5), (0, -18.08, 1.75), m("cadre_portes", "#2a3340", .4, .6)); out.append(k.done())
k = Kit("tour_controle"); con = m("beton_clair", "#d8dade", .7)
k.add(tube(k.name, [(0, 0, 0), (0, 0, 14), (0, 0, 28)], 2.4, con)); k.cyl(4.6, 1.2, (0, 0, 28.6), con, 32)
bpy.ops.mesh.primitive_cone_add(radius1=4.0, radius2=5.0, depth=4, location=(0, 0, 31.2), vertices=32); o = bpy.context.object; assign(o, m("verre_teinte", "#2f4a63", .05, .5)); k.add(o)
k.cyl(5.3, .7, (0, 0, 33.5), con, 32); k.cyl(.15, 6, (0, 0, 37), alu, 8); k.sph(.35, (0, 0, 40), m("feu_balise", "#ff3030", .3, 0, 6)); out.append(k.done())
k = Kit("avion"); wh = m("fuselage", "#f2f4f7", .35, .2); bl = m("derive_bleue", "#3b6fd8", .4); gr = m("aile", "#dfe4ea", .4, .3)
bpy.ops.mesh.primitive_cylinder_add(radius=2.1, depth=36, location=(0, 0, 3.4), rotation=(math.pi / 2, 0, 0), vertices=32); o = bpy.context.object; assign(o, wh)
for p in o.data.polygons: p.use_smooth = True
k.add(o); k.sph(2.1, (0, -18, 3.4), wh, scale=(1, 2.1, .95), seg=32, ring=16)
bpy.ops.mesh.primitive_cone_add(radius1=2.1, radius2=.5, depth=9, location=(0, 22.4, 3.9), rotation=(-math.pi / 2, 0, 0), vertices=32); o = bpy.context.object; assign(o, wh)
for p in o.data.polygons: p.use_smooth = True
k.add(o)
for sx in (-1, 1):
    beam(k, (sx * 1.5, 0, 2.6), (sx * 17, 6, 3.4), .5, gr)
    k.add(mesh_obj(k.name, [(sx * 1.5, -3, 2.4), (sx * 17, 4.5, 3.3), (sx * 17, 6.5, 3.3), (sx * 1.5, 3, 2.4)], [(0, 1, 2, 3)], gr))
    k.add(mesh_obj(k.name, [(sx * .5, 21, 4.2), (sx * 6.5, 25, 4.6), (sx * 6.5, 26.2, 4.6), (sx * .5, 25, 4.2)], [(0, 1, 2, 3)], gr))
    bpy.ops.mesh.primitive_cylinder_add(radius=1.1, depth=4, location=(sx * 7, -1.5, 1.6), rotation=(math.pi / 2, 0, 0), vertices=24); o = bpy.context.object; assign(o, m("reacteur", "#c9d0da", .3, .6)); k.add(o)
k.add(mesh_obj(k.name, [(0, 19, 5.3), (0, 26, 12.5), (0, 27.5, 12.5), (0, 26.5, 5.3)], [(0, 1, 2, 3)], bl))
for i in range(22): k.box((.05, .35, .35), (2.08, -12 + i * 1.3, 4.0), m("hublot", "#2a3a4a", .2))
for i in range(22): k.box((.05, .35, .35), (-2.08, -12 + i * 1.3, 4.0), m("hublot", "#2a3a4a", .2))
for (x, y) in ((0, -14), (-3, 2), (3, 2)): k.cyl(.5, .5, (x, y, .5), m("pneu", "#151515", .85), 16, rot=(0, math.pi / 2, 0))
out.append(k.done())

setup_render((1800, 1000))
bpy.ops.mesh.primitive_plane_add(size=3000, location=(0, 0, 0)); g = bpy.context.object; g.name = "SOL_APERCU"; assign(g, mat("sol", "#8a8f96", .9))
lay_out(out, cols=7, step=200)
shot(R + "/renders/kit_monuments.png", (600, -900, 380), (600, -100, 40), 35)
reset_layout(out)
export_glb(R + "/models/kit_monuments.glb", out)
print("KIT_LANDMARKS_DONE", len(out), sum(len(o.data.vertices) for o in out))
