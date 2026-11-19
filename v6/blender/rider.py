# La voyageuse de l'accueil sur son scooter.
# Repère Blender : x = côté, -y = avant du scooter, z = haut. Export glTF : +z avant, +y haut.
import bpy, math, os, sys, importlib
HERE = os.path.expanduser("~/dev/portfolio-v4/blender"); sys.path.insert(0, HERE)
import lib; importlib.reload(lib)
from lib import *
reset(); lib._mats.clear()
R = os.path.expanduser("~/dev/portfolio-v4")

# --- matières ---
paint = mat("peinture_menthe", "#9fd3c4", .22, .15)
paintD = mat("peinture_menthe_fonce", "#7bbcab", .3, .1)
chrome = mat("chrome", "#d9dde2", .15, 1.)
rubber = mat("pneu", "#151515", .85)
black = mat("plastique_noir", "#222326", .5)
seatM = mat("selle_cuir", "#4a2f22", .45)
lightW = mat("phare", "#fff6dc", .1, 0, 6)
lightR = mat("feu_arriere", "#d81f2c", .2, 0, 3)
plate = mat("plaque", "#f2f2f2", .5)
skinM = mat("peau", "#e2b393", .45, 0, 0, .15)
hairM = mat("cheveux", "#4a2b1c", .45)
jacket = mat("veste_beige", "#d9c49b", .9)
jeans = mat("jean", "#2f3542", .85)
shoe = mat("chaussures", "#2a1d16", .6)
leather = mat("sac_cuir", "#8b4a25", .5)
leatherD = mat("sac_cuir_fonce", "#6a361a", .55)
brass = mat("boucles", "#c9a24a", .3, 1.)

parts = []
P = parts.append
# --- scooter ---
for y in (.62, -.66):
    bpy.ops.mesh.primitive_torus_add(major_radius=.2, minor_radius=.07, location=(0, y, .27), rotation=(0, math.pi / 2, 0), major_segments=48, minor_segments=16)
    t = bpy.context.object; assign(t, rubber); smooth(t, 0); P(t)
    P(cyl("jante", .13, .1, (0, y, .27), chrome, rot=(0, math.pi / 2, 0), bevel=.01))
P(smooth(sphere("coque", .5, (0, .42, .58), paint, scale=(.72, 1.15, .62), seg=48, ring=24), 0))
P(box("jupe", (.62, .9, .22), (0, .38, .42), paintD, bevel=.09, seg=4))
P(box("plancher", (.36, .7, .08), (0, -.12, .3), black, bevel=.02))
P(box("tablier", (.5, .1, .72), (0, -.5, .66), paint, rot=(math.radians(-12), 0, 0), bevel=.05, seg=4))
P(smooth(sphere("tablier_galbe", .5, (0, -.47, .6), paint, scale=(.5, .14, .7), seg=40, ring=20), 0))
P(box("klaxon", (.16, .06, .14), (0, -.6, .92), chrome, bevel=.03, seg=3))
P(smooth(sphere("garde_boue", .5, (0, -.68, .47), paint, scale=(.34, .56, .3), seg=40, ring=20), 0))
P(tube("colonne", [(0, -.6, .52), (0, -.56, .8), (0, -.52, 1.0)], .042, chrome))
P(box("tete_guidon", (.22, .2, .16), (0, -.52, 1.03), paint, bevel=.06, seg=4))
P(tube("guidon", [(-.38, -.47, 1.05), (-.2, -.5, 1.06), (0, -.52, 1.07), (.2, -.5, 1.06), (.38, -.47, 1.05)], .016, chrome))
for sx in (-1, 1):
    P(cyl("poignee", .028, .12, (sx * .36, -.47, 1.05), black, rot=(0, math.pi / 2, 0)))
    P(tube("tige_retro", [(sx * .28, -.49, 1.07), (sx * .34, -.48, 1.2), (sx * .4, -.46, 1.3)], .008, chrome))
    P(sphere("retro", .055, (sx * .41, -.46, 1.33), chrome, scale=(1, .35, .75), seg=24, ring=12))
P(sphere("phare", .075, (0, -.63, 1.03), lightW, scale=(1, .55, 1), seg=24, ring=12))
P(box("selle", (.3, .62, .1), (0, .3, .86), seatM, bevel=.045, seg=4))
P(box("feu", (.18, .05, .06), (0, .99, .62), lightR, bevel=.015))
P(box("plaque", (.22, .02, .11), (0, 1.0, .44), plate, bevel=.005, seg=1))
P(box("porte_bagage", (.32, .26, .03), (0, .82, .74), chrome, bevel=.01))

# --- la voyageuse (vue de dos surtout) ---
# jean : bassin, cuisses, tibias
J = [(0, .32, .94), (-.11, .3, .93), (-.15, -.1, .92), (-.15, -.24, .36), (.11, .3, .93), (.15, -.1, .92), (.15, -.24, .36)]
P(skin("jean", J, [(0, 1), (1, 2), (2, 3), (0, 4), (4, 5), (5, 6)], [(.17, .15), (.1, .1), (.078, .078), (.056, .056), (.1, .1), (.078, .078), (.056, .056)], jeans))
# veste ample : buste et bras jusqu'aux poignets
V = [(0, .34, .9), (0, .31, 1.03), (0, .27, 1.28), (0, .24, 1.42), (-.19, .23, 1.39), (-.28, .02, 1.2), (-.34, -.34, 1.08), (.19, .23, 1.39), (.28, .02, 1.2), (.34, -.34, 1.08)]
P(skin("veste", V, [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 6), (3, 7), (7, 8), (8, 9)], [(.22, .17), (.2, .15), (.21, .15), (.15, .12), (.078, .078), (.066, .066), (.052, .052), (.078, .078), (.066, .066), (.052, .052)], jacket))
# col de veste
P(skin("col", [(0, .26, 1.43), (0, .25, 1.48)], [(0, 1)], [(.1, .085), (.085, .075)], jacket, 2))
# mains, cou, tête
for sx in (-1, 1): P(sphere("main", .045, (sx * .36, -.43, 1.06), skinM, scale=(.8, 1.3, .7), seg=20, ring=10))
P(cyl("cou", .048, .12, (0, .22, 1.52), skinM, verts=24))
P(smooth(sphere("tete", .1, (0, .2, 1.64), skinM, scale=(.92, 1.02, 1.12), seg=32, ring=16), 1))
for sx in (-1, 1): P(sphere("oreille", .022, (sx * .093, .21, 1.64), skinM, scale=(.5, 1, 1.3), seg=12, ring=8))
P(smooth(sphere("cheveux", .108, (0, .225, 1.665), hairM, scale=(.97, 1.02, 1.06), seg=40, ring=20), 1))
P(smooth(sphere("chignon", .062, (0, .27, 1.785), hairM, scale=(1.05, .95, .9), seg=32, ring=16), 1))
P(tube("meche", [(-.07, .27, 1.7), (-.02, .3, 1.76), (.04, .29, 1.79)], .018, hairM))
P(tube("meche2", [(.07, .27, 1.7), (.03, .31, 1.75), (-.03, .3, 1.8)], .016, hairM))
# chaussures
for sx in (-1, 1): P(box("chaussure", (.1, .24, .09), (sx * .15, -.3, .345), shoe, bevel=.035, seg=4))
# visage discret (vu surtout de dos, mais visible de 3/4)
P(sphere("nez", .017, (0, .105, 1.63), skinM, scale=(.8, 1.2, 1.1), seg=12, ring=8))
for sx in (-1, 1):
    P(sphere("oeil", .011, (sx * .036, .113, 1.66), mat("yeux", "#2a1f1a", .3), seg=10, ring=6))
    P(tube("sourcil", [(sx * .02, .108, 1.685), (sx * .04, .106, 1.69), (sx * .058, .112, 1.686)], .004, hairM))
P(sphere("levres", .02, (0, .108, 1.595), mat("levres", "#b8736a", .5), scale=(1.4, .5, .5), seg=12, ring=8))
# sac à dos en cuir
P(box("sac", (.34, .17, .42), (0, .47, 1.02), leather, bevel=.05, seg=4))
P(box("rabat", (.35, .19, .17), (0, .48, 1.27), leatherD, rot=(math.radians(-8), 0, 0), bevel=.05, seg=4))
P(box("poche", (.24, .05, .15), (0, .57, 1.06), leatherD, bevel=.03, seg=3))
for sx in (-1, 1):
    P(box("sangle", (.035, .02, .2), (sx * .07, .585, 1.17), leatherD, bevel=.005, seg=1))
    P(box("boucle", (.04, .015, .03), (sx * .07, .595, 1.1), brass, bevel=.004, seg=1))
    P(tube("bretelle", [(sx * .12, .44, 1.0), (sx * .14, .4, 1.25), (sx * .14, .32, 1.43), (sx * .13, .2, 1.43), (sx * .14, .12, 1.3)], .018, leatherD))
P(tube("poignee_sac", [(-.05, .46, 1.36), (0, .47, 1.4), (.05, .46, 1.36)], .012, leatherD))

setup_render()
bpy.ops.object.light_add(type="AREA", location=(-2, 2.5, 2.5)); bpy.context.object.data.energy = 120; bpy.context.object.data.size = 3
bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, 0)); g = bpy.context.object; g.name = "SOL_APERCU"; assign(g, mat("sol", "#8a8f96", .9))
shot(R + "/renders/rider_dos.png", (1.0, 4.2, 2.2), (0, .2, .95), 45)
shot(R + "/renders/rider_34.png", (-2.6, -2.4, 1.6), (0, 0, .85), 45)
shot(R + "/renders/rider_profil.png", (3.6, 0, 1.1), (0, 0, .85), 45)
export_glb(R + "/models/rider.glb", [o for o in bpy.context.scene.objects if o.type == "MESH" and o.name != "SOL_APERCU"])
print("RIDER_DONE")
