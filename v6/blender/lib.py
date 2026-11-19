# Outils communs aux scripts Blender du portfolio v4
import bpy, bmesh, math, os
from mathutils import Vector, Euler

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) if "__file__" in globals() else os.path.expanduser("~/dev/portfolio-v4")

SCENE = "PORTFOLIO_V4"
def reset(name=SCENE):
    """Travaille uniquement dans une scène dédiée : les autres scènes du fichier ne sont jamais touchées."""
    if bpy.context.window:
        sc = bpy.data.scenes.get(name) or bpy.data.scenes.new(name); bpy.context.window.scene = sc
    else:  # mode arrière-plan (blender -b) : fichier vierge, on utilise sa scène
        sc = bpy.context.scene; sc.name = name
    for o in list(sc.objects): bpy.data.objects.remove(o, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.cameras, bpy.data.lights, bpy.data.curves):
        for b in list(coll):
            if b.users == 0 and b.name.startswith(("v4_", "PreviewCam")): coll.remove(b)
    return sc

def srgb(h):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c] + [1]

_mats = {}
def mat(name, color, rough=.6, metal=0., emit=0., sss=0.):
    if name in _mats: return _mats[name]
    m = bpy.data.materials.get("v4_" + name) or bpy.data.materials.new("v4_" + name); m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = srgb(color)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        for k in ("Emission Color", "Emission"):
            if k in b.inputs: b.inputs[k].default_value = srgb(color); break
        if "Emission Strength" in b.inputs: b.inputs["Emission Strength"].default_value = emit
    if sss:
        for k in ("Subsurface Weight", "Subsurface"):
            if k in b.inputs: b.inputs[k].default_value = sss; break
    _mats[name] = m; return m

def link(o):
    bpy.context.collection.objects.link(o) if o.name not in bpy.context.collection.objects else None
    return o

def assign(o, m):
    o.data.materials.clear(); o.data.materials.append(m); return o

def smooth(o, level=2, bevel=0., seg=3):
    if bevel:
        md = o.modifiers.new("bevel", "BEVEL"); md.width = bevel; md.segments = seg; md.limit_method = "ANGLE"
    if level:
        md = o.modifiers.new("subd", "SUBSURF"); md.levels = level; md.render_levels = level
    for p in o.data.polygons: p.use_smooth = True
    return o

def box(name, size, loc, m, rot=(0, 0, 0), bevel=.02, seg=3, subd=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    assign(o, m); return smooth(o, subd, bevel, seg)

def sphere(name, r, loc, m, scale=(1, 1, 1), seg=32, ring=16, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=ring, rotation=rot)
    o = bpy.context.object; o.name = name; o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    assign(o, m); return smooth(o, 0)

def cyl(name, r, depth, loc, m, rot=(0, 0, 0), verts=32, bevel=.0):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.object; o.name = name; assign(o, m)
    if bevel: smooth(o, 0, bevel, 2)
    for p in o.data.polygons: p.use_smooth = True
    if hasattr(o.data, "use_auto_smooth"): o.data.use_auto_smooth = True
    return o

def tube(name, pts, r, m, verts=16):
    """Tube lisse passant par une liste de points (courbe bevel)."""
    cu = bpy.data.curves.new("v4_" + name, "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = r; cu.bevel_resolution = 4; cu.resolution_u = 8
    sp = cu.splines.new("NURBS"); sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts): sp.points[i].co = (*p, 1)
    sp.use_endpoint_u = True; sp.order_u = min(4, len(pts)); sp.use_smooth = True
    cu.use_fill_caps = True
    o = bpy.data.objects.new(name, cu); bpy.context.collection.objects.link(o); cu.materials.append(m)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.convert(target="MESH"); o = bpy.context.object
    for p in o.data.polygons: p.use_smooth = True
    return o

def skin(name, verts, edges, radii, m, subd=2):
    """Corps organique : squelette de points + modificateur Skin + subdivision."""
    me = bpy.data.meshes.new("v4_" + name); me.from_pydata(verts, edges, []); me.update()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    md = o.modifiers.new("skin", "SKIN"); md.use_smooth_shade = True
    sv = me.skin_vertices[0].data
    for i, r in enumerate(radii): sv[i].radius = r if isinstance(r, (tuple, list)) else (r, r)
    sv[0].use_root = True
    sd = o.modifiers.new("subd", "SUBSURF"); sd.levels = subd; sd.render_levels = subd
    assign(o, m); return o

def join(objs, name):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True); bpy.context.view_layer.objects.active = o
        for md in list(o.modifiers):
            try: bpy.ops.object.modifier_apply(modifier=md.name)
            except Exception: pass
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join(); o = bpy.context.object; o.name = name
    return o

def export_glb(path, objs=None):
    bpy.ops.object.select_all(action="DESELECT")
    for o in bpy.context.view_layer.objects: o.select_set(False)
    for o in (objs or bpy.context.scene.objects):
        if o.type == "MESH": o.select_set(True)
    kw = dict(filepath=path, export_format="GLB", use_selection=True, export_apply=True)
    for extra in ({"export_texcoords": False}, {"export_texcoord": False}, {}):
        try: bpy.ops.export_scene.gltf(**kw, **extra); return
        except TypeError: pass

def setup_render(res=(900, 700)):
    sc = bpy.context.scene
    for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "CYCLES"):
        try: sc.render.engine = eng; break
        except Exception: pass
    sc.render.resolution_x, sc.render.resolution_y = res; sc.render.film_transparent = False
    w = bpy.data.worlds.get("v4_world") or bpy.data.worlds.new("v4_world"); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get("Background"); bg.inputs[0].default_value = srgb("#c9d6e6"); bg.inputs[1].default_value = 1.0
    if True:
        bpy.ops.object.light_add(type="SUN", location=(3, -4, 6), rotation=(math.radians(50), 0, math.radians(35)))
        bpy.context.object.data.energy = 3.5; bpy.context.object.data.angle = math.radians(4)

def shot(path, loc, target=(0, 0, 1), lens=50):
    sc = bpy.context.scene
    cam = bpy.data.objects.get("PreviewCam")
    if not cam:
        cam = bpy.data.objects.new("PreviewCam", bpy.data.cameras.new("PreviewCam")); sc.collection.objects.link(cam)
    cam.data.lens = lens; cam.location = loc
    d = Vector(target) - Vector(loc); cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    sc.camera = cam; sc.render.filepath = path; bpy.ops.render.render(write_still=True)

# ---------- outils de modélisation architecturale ----------
import random
def mesh_obj(name, verts, faces, m):
    me = bpy.data.meshes.new("v4_" + name); me.from_pydata(verts, [], faces); me.update()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o); assign(o, m); return o

def prism(name, w, d, h, loc, m, ry=0):
    """Toit à deux pans, faîtage parallèle à x."""
    x, y, z = loc; hw, hd = w / 2, d / 2
    v = [(-hw, -hd, 0), (hw, -hd, 0), (hw, hd, 0), (-hw, hd, 0), (-hw, 0, h), (hw, 0, h)]
    o = mesh_obj(name, v, [(0, 1, 5, 4), (2, 3, 4, 5), (0, 4, 3), (1, 2, 5), (0, 3, 2, 1)], m)
    o.location = loc; o.rotation_euler = (0, 0, ry); return o

def hip(name, w, d, h, loc, m, top=.0):
    """Toit en croupe (pyramide tronquée)."""
    hw, hd = w / 2, d / 2; tw, td = max(0, hw - d / 2 * (1 - top)), hd * top
    v = [(-hw, -hd, 0), (hw, -hd, 0), (hw, hd, 0), (-hw, hd, 0), (-tw, -td, h), (tw, -td, h), (tw, td, h), (-tw, td, h)]
    o = mesh_obj(name, v, [(0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7), (4, 5, 6, 7), (0, 3, 2, 1)], m)
    o.location = loc; return o

def mansard(name, w, d, h, loc, m, inset=.9):
    hw, hd = w / 2, d / 2
    v = [(-hw, -hd, 0), (hw, -hd, 0), (hw, hd, 0), (-hw, hd, 0), (-hw + inset * .4, -hd + inset, h), (hw - inset * .4, -hd + inset, h), (hw - inset * .4, hd - inset, h), (-hw + inset * .4, hd - inset, h)]
    o = mesh_obj(name, v, [(0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7), (4, 5, 6, 7)], m)
    o.location = loc; return o

class Kit:
    """Accumule les pièces d'un modèle puis les fusionne en un seul objet, origine au sol au centre."""
    def __init__(self, name): self.name = name; self.parts = []
    def add(self, o): self.parts.append(o); return o
    def box(self, size, loc, m, bevel=0., rot=(0, 0, 0)): return self.add(box(self.name, size, loc, m, rot=rot, bevel=bevel, seg=2 if bevel else 1))
    def cyl(self, r, h, loc, m, verts=16, rot=(0, 0, 0)): return self.add(cyl(self.name, r, h, loc, m, rot=rot, verts=verts))
    def sph(self, r, loc, m, scale=(1, 1, 1), seg=16, ring=10): return self.add(sphere(self.name, r, loc, m, scale=scale, seg=seg, ring=ring))
    def done(self):
        o = join(self.parts, self.name)
        bpy.context.scene.cursor.location = (0, 0, 0); bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
        return o

def window(k, x, z, w, h, front, glass, frame, lit=False, sill=None, depth=.18, shutters=None, mull=True):
    """Fenêtre en retrait : vitre, encadrement, meneau et appui. front = y de la façade (vers -y)."""
    y = front
    k.box((w, .02, h), (x, y - .012, z + h / 2), glass)
    t = .08
    for (sx, sz, px, pz) in ((w + t * 2, t, x, z + h + t / 2), (w + t * 2, t, x, z - t / 2), (t, h, x - w / 2 - t / 2, z + h / 2), (t, h, x + w / 2 + t / 2, z + h / 2)):
        k.box((sx, depth, sz), (px, y - depth / 2, pz), frame)
    if mull and w > .9: k.box((.05, .06, h), (x, y - .04, z + h / 2), frame)
    if mull and h > 1.4: k.box((w, .06, .05), (x, y - .04, z + h * .62), frame)
    if sill: k.box((w + .3, .3, .08), (x, y - .06, z - .1), sill)
    if shutters:
        for sx in (-1, 1): k.box((w / 2 + .05, .06, h), (x + sx * (w * .75 + .12), y - .04, z + h / 2), shutters)

def railing(k, x0, x1, z, y, m, h=1.0, gap=.14):
    k.box((x1 - x0, .06, .05), ((x0 + x1) / 2, y, z + h), m)
    k.box((x1 - x0, .05, .04), ((x0 + x1) / 2, y, z + .08), m)
    n = max(2, int((x1 - x0) / gap))
    for i in range(n + 1): k.box((.025, .025, h), (x0 + (x1 - x0) * i / n, y, z + h / 2), m)

def lay_out(objs, cols=6, step=26):
    for i, o in enumerate(objs): o.location = ((i % cols) * step, -(i // cols) * step, 0)

def reset_layout(objs):
    for o in objs: o.location = (0, 0, 0)

def beam(k, a, b, t, m):
    """Poutre à section carrée entre deux points (8 sommets)."""
    from mathutils import Vector
    a, b = Vector(a), Vector(b); d = b - a; L = d.length
    if L < 1e-4: return
    u = d / L; ref = Vector((0, 0, 1)) if abs(u.z) < .9 else Vector((1, 0, 0))
    x = u.cross(ref).normalized() * t / 2; y = u.cross(x).normalized() * t / 2
    V = [tuple(p) for p in (a - x - y, a + x - y, a + x + y, a - x + y, b - x - y, b + x - y, b + x + y, b - x + y)]
    F = [(0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7), (0, 3, 2, 1), (4, 5, 6, 7)]
    k.add(mesh_obj(k.name, V, F, m))
