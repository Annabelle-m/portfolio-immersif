# -*- coding: utf-8 -*-
"""Portfolio Annabelle Megy : kit de faune modelé dans Blender.
Chaque animal est sculpté par fusion de volumes (remaillage voxel + lissage), décimé pour le web,
puis coloré par zones (taches de girafe, crinière, ventre clair...). Export : kit_faune.glb + kit_faune.blend
Lancer dans Blender :  exec(open('/Users/annabelle/dev/annabelle-portfolio-blender/make_faune.py').read())
"""
import bpy, bmesh, math, os, traceback, random
from mathutils import Vector, Matrix

OUT = "/Users/annabelle/dev/annabelle-portfolio-blender"
LOG = []
def log(*a):
    LOG.append(" ".join(str(x) for x in a))
    open(os.path.join(OUT, "blender_log.txt"), "w").write("\n".join(LOG))

def mat(name, hexcol, rough=.8):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    c = [int(hexcol[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    lin = [(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4) for x in c]
    try:
        m.use_nodes = True
    except Exception:
        pass
    try:
        b = None
        for n in m.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED': b = n
        if b:
            b.inputs["Base Color"].default_value = (lin[0], lin[1], lin[2], 1)
            b.inputs["Roughness"].default_value = rough
    except Exception as e:
        log("mat", name, e)
    m.diffuse_color = (lin[0], lin[1], lin[2], 1)
    return m

class Shape:
    def __init__(self): self.bm = bmesh.new()
    def ball(self, c, r, s=(1, 1, 1), rot=(0, 0, 0), u=20, v=12):
        M = Matrix.Translation(Vector(c)) @ Matrix.Rotation(rot[2], 4, 'Z') @ Matrix.Rotation(rot[1], 4, 'Y') @ Matrix.Rotation(rot[0], 4, 'X') @ Matrix.Diagonal((s[0], s[1], s[2], 1))
        bmesh.ops.create_uvsphere(self.bm, u_segments=u, v_segments=v, radius=r, matrix=M)
        return self
    def limb(self, a, b, ra, rb, n=None):
        a, b = Vector(a), Vector(b); L = (b - a).length
        n = n or max(2, int(L / (min(ra, rb) * .7)) + 1)
        for i in range(n + 1):
            t = i / n; self.ball(a.lerp(b, t), ra + (rb - ra) * t, u=14, v=8)
        return self
    def chain(self, pts, radii):
        for i in range(len(pts) - 1): self.limb(pts[i], pts[i + 1], radii[i], radii[i + 1])
        return self
    def cone(self, a, b, ra, rb, seg=10):
        a, b = Vector(a), Vector(b); d = b - a; L = d.length
        q = Vector((0, 0, 1)).rotation_difference(d.normalized())
        M = Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4()
        bmesh.ops.create_cone(self.bm, cap_ends=True, segments=seg, radius1=ra, radius2=rb, depth=L, matrix=M)
        return self
    def mirror_y(self):
        geom = self.bm.verts[:] + self.bm.edges[:] + self.bm.faces[:]
        r = bmesh.ops.duplicate(self.bm, geom=geom)
        vs = [g for g in r["geom"] if isinstance(g, bmesh.types.BMVert)]
        bmesh.ops.scale(self.bm, vec=(1, -1, 1), verts=vs)
        fs = [g for g in r["geom"] if isinstance(g, bmesh.types.BMFace)]
        bmesh.ops.reverse_faces(self.bm, faces=fs)
        return self
    def mesh(self, name):
        me = bpy.data.meshes.new(name); self.bm.to_mesh(me); self.bm.free(); return me

def hash3(i, j, k, s=0):
    random.seed((i * 73856093) ^ (j * 19349663) ^ (k * 83492791) ^ (s * 7919)); return (random.random(), random.random(), random.random())
def worley(p, cell):
    x, y, z = p[0] / cell, p[1] / cell, p[2] / cell; ix, iy, iz = math.floor(x), math.floor(y), math.floor(z); d = []
    for a in (-1, 0, 1):
        for b in (-1, 0, 1):
            for c in (-1, 0, 1):
                h = hash3(ix + a, iy + b, iz + c); q = (ix + a + h[0], iy + b + h[1], iz + c + h[2])
                d.append(math.sqrt((q[0] - x) ** 2 + (q[1] - y) ** 2 + (q[2] - z) ** 2))
    d.sort(); return d[0], d[1]

def dgraph(scene):
    dg = bpy.context.evaluated_depsgraph_get()
    try:
        if dg.scene != scene: dg = scene.view_layers[0].depsgraph
    except Exception:
        pass
    dg.update(); return dg

def build(scene, col, name, sculpt, voxel, target, mats, zone=None, raws=()):
    """sculpt : Shape fusionnée par remaillage ; raws : [(suffixe, Shape, materiau)] gardés tels quels."""
    objs = []
    me = sculpt.mesh(name + "_brut"); ob = bpy.data.objects.new(name + "_brut", me); col.objects.link(ob)
    rm = ob.modifiers.new("remesh", 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = voxel
    sm = ob.modifiers.new("smooth", 'SMOOTH'); sm.factor = .55; sm.iterations = 8
    dg = dgraph(scene)
    n0 = len(ob.evaluated_get(dg).data.polygons)
    dc = ob.modifiers.new("decimate", 'DECIMATE'); dc.ratio = max(.02, min(1, target / max(1, n0 * 2)))
    dg = dgraph(scene)
    fin = bpy.data.meshes.new_from_object(ob.evaluated_get(dg)); fin.name = name + "_corps"
    for m in mats: fin.materials.append(m)
    for p in fin.polygons:
        p.use_smooth = True
        if zone: p.material_index = zone(p.center, p.normal)
    body = bpy.data.objects.new(name + "__corps", fin); col.objects.link(body); objs.append(body)
    col.objects.unlink(ob); bpy.data.objects.remove(ob)
    for suf, sh, m in raws:
        mm = sh.mesh(name + "_" + suf); mm.materials.append(m)
        for p in mm.polygons: p.use_smooth = True
        o2 = bpy.data.objects.new(name + "__" + suf, mm); col.objects.link(o2); objs.append(o2)
    log(name, "faces brut", n0, "final", len(fin.polygons))
    return objs

def kangourou(scene, col):
    S = Shape()
    S.limb((-.15, 0, .62), (.22, 0, 1.10), .27, .17)                      # tronc penché
    S.limb((.22, 0, 1.12), (.33, 0, 1.38), .11, .075)                     # cou
    S.ball((.39, 0, 1.46), 1, (.13, .085, .09), (0, .25, 0))              # tête
    S.limb((.42, 0, 1.45), (.55, 0, 1.40), .06, .042)                     # museau
    S.chain([(-.28, 0, .52), (-.6, 0, .26), (-.9, 0, .1), (-1.15, 0, .06)], [.13, .09, .06, .035])   # queue
    H = Shape()
    H.ball((-.08, .2, .5), 1, (.27, .11, .25), (0, -.5, 0))               # cuisse
    H.limb((.02, .2, .34), (-.2, .2, .1), .065, .045)                     # jambe
    H.limb((-.2, .2, .05), (.24, .2, .04), .045, .04)                     # long pied
    H.limb((.2, .13, 1.0), (.3, .12, .82), .042, .032); H.limb((.3, .12, .82), (.4, .11, .78), .03, .028)   # bras
    H.ball((.31, .065, 1.6), 1, (.03, .04, .11), (.2, -.15, 0))            # oreille
    H.mirror_y()
    for f in H.bm.faces: pass
    S.bm.from_mesh(H.mesh("tmp_k"))
    eyes = Shape().ball((.46, .07, 1.49), .017).ball((.46, -.07, 1.49), .017).ball((.585, 0, 1.4), .022)
    fur, belly, dark = mat("faune_kangourou", "#b27748"), mat("faune_kangourou_ventre", "#dcc09a"), mat("faune_noir", "#1c1612", .4)
    def zone(c, n):
        if c.z > .5 and c.z < 1.2 and n.x > .45 and c.x > .05: return 1
        return 0
    return build(scene, col, "kangourou", S, .028, 3200, [fur, belly], zone, [("yeux", eyes, dark)])

def girafe(scene, col):
    S = Shape()
    S.limb((-.75, 0, 2.2), (.7, 0, 2.6), .5, .55)                          # corps
    S.chain([(.8, 0, 2.85), (1.2, 0, 3.7), (1.55, 0, 4.55)], [.36, .24, .17])   # cou
    S.limb((1.55, 0, 4.6), (2.0, 0, 4.43), .17, .1)                        # tête
    S.limb((-1.2, 0, 2.3), (-1.32, 0, 1.3), .05, .03)                      # queue
    H = Shape()
    for x, top in ((.72, 2.3), (-.78, 2.1)):
        H.chain([(x, .27, top), (x + .02, .25, 1.15), (x, .25, .12)], [.2, .1, .075])
        H.ball((x, .25, 1.15), .115)                                       # genou
    H.limb((1.6, .08, 4.72), (1.56, .09, 4.98), .035, .04)                 # ossicônes
    H.ball((1.5, .19, 4.66), 1, (.05, .12, .07), (.5, 0, 0))                # oreilles
    H.mirror_y(); S.bm.from_mesh(H.mesh("tmp_g"))
    hoof = Shape()
    for x in (.72, -.78):
        for y in (.25, -.25): hoof.cone((x, y, 0), (x, y, .16), .1, .08)
    hoof.ball((-1.33, 0, 1.2), 1, (.05, .05, .14))
    eyes = Shape().ball((1.72, .13, 4.62), .03).ball((1.72, -.13, 4.62), .03)
    base, spot, dark = mat("faune_girafe", "#ecd29a"), mat("faune_girafe_taches", "#9a5a26"), mat("faune_sabot", "#2a211a", .5)
    def zone(c, n):
        if c.z < .9: return 0
        f1, f2 = worley((c.x, c.y * 1.0, c.z), .34)
        return 1 if (f2 - f1) > .11 else 0
    return build(scene, col, "girafe", S, .045, 9000, [base, spot], zone, [("sabots", hoof, dark), ("yeux", eyes, dark)])

def elephant(scene, col):
    S = Shape()
    S.ball((0, 0, 1.75), 1, (1.25, .78, .85))                               # corps
    S.ball((1.25, 0, 2.15), 1, (.55, .5, .6))                               # tête
    S.chain([(1.6, 0, 2.05), (1.95, 0, 1.5), (2.0, 0, .85), (2.12, 0, .45)], [.26, .19, .13, .09])   # trompe
    S.limb((-1.2, 0, 1.9), (-1.38, 0, 1.0), .05, .03)
    H = Shape()
    for x in (.7, -.7): H.limb((x, .42, 1.5), (x, .42, .16), .3, .25)
    H.ball((1.0, .62, 2.15), 1, (.12, .62, .72), (0, 0, .5))                 # oreille
    H.mirror_y(); S.bm.from_mesh(H.mesh("tmp_e"))
    tusk = Shape()
    for y in (.3, -.3): tusk.chain([(1.5, y, 1.8), (1.95, y * 1.15, 1.45), (2.3, y * 1.1, 1.55)], [.075, .055, .02])
    nails = Shape()
    for x in (.7, -.7):
        for y in (.42, -.42):
            for a in (-.5, 0, .5): nails.ball((x + .27 * math.cos(a), y + .27 * math.sin(a), .07), 1, (.05, .07, .07))
    eyes = Shape().ball((1.62, .36, 2.3), .04).ball((1.62, -.36, 2.3), .04)
    skin, ear, ivory, dark = mat("faune_elephant", "#8b8480"), mat("faune_elephant_oreille", "#7a716d"), mat("faune_ivoire", "#efe6cf", .35), mat("faune_noir", "#1c1612", .4)
    def zone(c, n): return 1 if (abs(c.y) > .58 and c.z > 1.5 and c.x > .5) else 0
    return build(scene, col, "elephant", S, .06, 7000, [skin, ear], zone, [("defenses", tusk, ivory), ("ongles", nails, ivory), ("yeux", eyes, dark)])

def lion(scene, col):
    S = Shape()
    S.limb((-.6, 0, .82), (.45, 0, .88), .3, .34)                           # corps
    S.ball((.72, 0, 1.12), .42, (1, 1, 1.05))                                # crinière
    S.ball((1.0, 0, 1.18), 1, (.24, .2, .2))                                 # tête
    S.limb((1.1, 0, 1.12), (1.3, 0, 1.08), .13, .1)                          # museau
    S.chain([(-.88, 0, .9), (-1.3, 0, .6), (-1.6, 0, .7)], [.05, .035, .03]); S.ball((-1.66, 0, .72), .075)
    H = Shape()
    for x, r0 in ((.42, .14), (-.6, .15)):
        H.chain([(x, .2, .75), (x + .03, .2, .38), (x, .2, .08)], [r0, .085, .075]); H.ball((x + .08, .2, .06), 1, (.13, .09, .06))
    H.ball((.88, .2, 1.42), 1, (.05, .08, .08))                              # oreille
    H.mirror_y(); S.bm.from_mesh(H.mesh("tmp_l"))
    eyes = Shape().ball((1.17, .1, 1.24), .025).ball((1.17, -.1, 1.24), .025).ball((1.4, 0, 1.1), 1, (.035, .05, .035))
    fur, mane, dark = mat("faune_lion", "#d2a55c"), mat("faune_lion_criniere", "#8a5626"), mat("faune_noir", "#1c1612", .4)
    def zone(c, n):
        d = (c - Vector((.72, 0, 1.12))).length
        if d < .47 and c.x < .97: return 1
        if c.x < -1.58: return 1
        return 0
    return build(scene, col, "lion", S, .03, 5000, [fur, mane], zone, [("yeux", eyes, dark)])

def crocodile(scene, col):
    S = Shape()
    S.ball((0, 0, .26), 1, (.95, .34, .2))                                   # corps
    S.chain([(-.8, 0, .24), (-1.5, 0, .18), (-2.2, 0, .12), (-2.75, 0, .08)], [.22, .15, .09, .035])   # queue
    S.limb((.8, 0, .27), (1.15, 0, .27), .2, .17)                            # cou / tête
    S.ball((1.55, 0, .22), 1, (.52, .13, .075))                              # mâchoire
    S.ball((1.2, .1, .4), .06); S.ball((1.2, -.1, .4), .06)                  # arcades
    H = Shape()
    for x, dx in ((.55, .12), (-.6, -.1)):
        H.limb((x, .25, .2), (x + dx, .5, .1), .09, .06); H.ball((x + dx + .06, .54, .04), 1, (.13, .09, .04))
    H.mirror_y(); S.bm.from_mesh(H.mesh("tmp_c"))
    sc = Shape()
    for i in range(22):
        x = .85 - i * .16; k = 1 - max(0, (i - 10) / 14)
        if i < 11:
            for y in (-.13, .13): sc.cone((x, y * k, .4 * (1 if i < 11 else k)), (x - .03, y * k, .5), .05, .005, 5)
        else:
            z = .24 - (i - 11) * .013; r = .22 - (i - 11) * .016
            sc.cone((x, 0, z + r * .7), (x - .04, 0, z + r * .7 + .1 * k + .03), .04, .004, 5)
    teeth = Shape()
    for i in range(9):
        for y in (-.105, .105): teeth.cone((1.2 + i * .09, y * (1 - i * .035), .2), (1.2 + i * .09, y * (1 - i * .035), .15), .014, .002, 4)
    eyes = Shape().ball((1.22, .12, .44), .028).ball((1.22, -.12, .44), .028)
    skin, belly, scale, ivory, eye = mat("faune_crocodile", "#566b3c"), mat("faune_crocodile_ventre", "#b9b784"), mat("faune_crocodile_ecailles", "#3d4f2b"), mat("faune_ivoire", "#efe6cf", .35), mat("faune_oeil_jaune", "#d9b62e", .3)
    def zone(c, n): return 1 if (n.z < -.35 and c.z < .2) else 0
    return build(scene, col, "crocodile", S, .028, 4500, [skin, belly], zone, [("ecailles", sc, scale), ("dents", teeth, ivory), ("yeux", eyes, eye)])

def flamant(scene, col):
    S = Shape()
    S.ball((0, 0, .82), 1, (.3, .15, .17), (0, .15, 0))                        # corps
    S.chain([(.22, 0, .9), (.36, 0, 1.08), (.3, 0, 1.3), (.36, 0, 1.47), (.46, 0, 1.5)], [.06, .04, .035, .035, .045])   # cou en S
    S.ball((.5, 0, 1.5), 1, (.07, .05, .05))
    S.limb((-.25, 0, .8), (-.4, 0, .7), .08, .03)                              # queue
    legs = Shape().cone((.02, .05, 0), (.02, .05, .72), .012, .016, 6).ball((.02, .05, .38), .024)
    legs.cone((0, -.05, .45), (.02, -.05, .72), .013, .016, 6).cone((0, -.05, .45), (-.16, -.05, .3), .013, .011, 6)   # patte repliée
    legs.ball((.06, .05, .012), 1, (.07, .045, .012)).ball((0, -.05, .45), .022)
    beak = Shape().chain([(.55, 0, 1.5), (.64, 0, 1.46), (.67, 0, 1.38)], [.032, .028, .012])
    tip = Shape().limb((.655, 0, 1.42), (.67, 0, 1.375), .022, .012)
    eyes = Shape().ball((.52, .042, 1.52), .009).ball((.52, -.042, 1.52), .009)
    pink, wing, legm, beakm, dark = mat("faune_flamant", "#f58fa0"), mat("faune_flamant_aile", "#e86a82"), mat("faune_flamant_pattes", "#e0788a"), mat("faune_bec", "#f3e3d6", .4), mat("faune_noir", "#1c1612", .4)
    def zone(c, n): return 1 if (abs(n.y) > .6 and c.z > .7 and c.z < .95 and c.x < .15) else 0
    return build(scene, col, "flamant", S, .012, 2200, [pink, wing], zone, [("pattes", legs, legm), ("bec", beak, beakm), ("bec_pointe", tip, dark), ("yeux", eyes, dark)])

def main():
    os.makedirs(OUT, exist_ok=True)
    log("Blender", bpy.app.version_string)
    win = bpy.context.window; orig = win.scene
    sc = bpy.data.scenes.new("FAUNE_PORTFOLIO"); win.scene = sc
    col = sc.collection; allo = []
    try:
        for i, fn in enumerate((kangourou, girafe, elephant, lion, crocodile, flamant)):
            try:
                objs = fn(sc, col)
                for o in objs: o.location.y += 0
                allo += objs
            except Exception:
                log("ERREUR", fn.__name__, traceback.format_exc())
        # export sans opérateur (l'exportateur glTF a fait planter Blender depuis une scène temporaire) : on écrit les données de maillage telles quelles
        import json
        out = []
        for o in allo:
            me = o.data; me.calc_loop_triangles()
            prims = {}
            for t in me.loop_triangles:
                mi = t.material_index; P = prims.setdefault(mi, {"pos": [], "nor": [], "idx": [], "map": {}})
                for vi in t.vertices:
                    k = P["map"].get(vi)
                    if k is None:
                        v = me.vertices[vi]; k = len(P["pos"]) // 3; P["map"][vi] = k
                        P["pos"] += [round(v.co.x, 4), round(v.co.z, 4), round(-v.co.y, 4)]
                        P["nor"] += [round(v.normal.x, 3), round(v.normal.z, 3), round(-v.normal.y, 3)]
                    P["idx"].append(k)
            for mi, P in prims.items():
                m = me.materials[mi]; del P["map"]
                P["mat"] = m.name; P["col"] = list(m.diffuse_color)[:3]
                out.append({"node": o.name, **P})
        jp = os.path.join(OUT, "kit_faune.json")
        open(jp, "w").write(json.dumps(out))
        log("JSON OK", jp, os.path.getsize(jp))
    finally:
        win.scene = orig
        try:
            for o in list(sc.objects): bpy.data.objects.remove(o)
            bpy.data.scenes.remove(sc)
            for m in list(bpy.data.meshes):
                if m.users == 0 and (m.name.startswith('tmp_') or m.name.endswith('_brut')): bpy.data.meshes.remove(m)
        except Exception:
            log("nettoyage", traceback.format_exc())
    log("FIN")

try:
    main()
except Exception:
    log("ERREUR main", traceback.format_exc())
