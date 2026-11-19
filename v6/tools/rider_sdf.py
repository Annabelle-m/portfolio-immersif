"""La voyageuse de l'accueil, sculptée en champs de distance (v5).

Le scooter est repris du modèle Blender de la v4 ; le personnage est remplacé
par une version organique : visage, chignon, veste ample, jean, baskets,
sac à dos en cuir. Lancer : python3 tools/rider_sdf.py
"""
import os, sys, numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from sdf import *

ROOT = os.path.join(os.path.dirname(__file__), "..")
out = GLB()
from scooter_import import import_scooter
import_scooter(out)

def sym(f):  # applique une fonction aux deux côtés (x et -x)
    return lambda P: np.minimum(f(P, 1), f(P, -1))

# ---------- veste ample ----------
def jacket(P):
    """Veste structurée : volumes à arêtes adoucies (pas de ballons), épaules, col, poignets, ourlet."""
    x, y, z = P[..., 0], P[..., 1], P[..., 2]
    d = chain(P, [(0, .98, -.31), (0, 1.17, -.295), (0, 1.33, -.268)], [.138, .156, .142], k=.07, sx=1.2, sz=.84)     # tronc ovale, évasé aux épaules
    d = smin(d, chain(P, [(-.19, 1.355, -.255), (.19, 1.355, -.255)], [.064, .064], k=.02, sz=.9), .05)                 # épaules rondes
    for s in (-1, 1):
        d = smin(d, chain(P, [(s * .19, 1.37, -.25), (s * .262, 1.19, -.04), (s * .292, 1.13, .205)], [.066, .056, .046], k=.02), .025)
        # revers de manche
        cuf = chain(P, [(s * .284, 1.135, .165), (s * .291, 1.129, .22)], [.05, .05], k=.01)
        d = smin(d, cuf, .005)
    col = cone(P, V(0, 1.425, -.245), V(0, 1.5, -.232), .082, .076)
    col = smax(col, -cone(P, V(0, 1.4, -.24), V(0, 1.6, -.225), .05, .05), .01)
    d = smin(d, col, .02)
    d = smax(d, -(y - .955), .006)                                                # ourlet net
    d = smax(d, (z - .30), .01)
    # plis : arêtes dans le dos et aux coudes
    d = d + .0025 * np.sin(y * 30 + x * 6) * np.exp(-((z + .38) / .12) ** 2) * (y > 1.0)
    d = d + .003 * np.exp(-(((y - 1.17) / .03) ** 2)) * (np.abs(x) > .2)
    d = d - .004 * np.exp(-(((y - 1.03) / .007) ** 2)) * (z < -.3)               # couture de taille
    return d

# ---------- jean ----------
def jeans(P):
    d = ell(P, V(0, .995, -.32), V(.165, .1, .145))
    for s in (-1, 1):
        d = smin(d, chain(P, [(s * .095, .975, -.29), (s * .155, .945, .085), (s * .15, .43, .225)], [.088, .066, .047], k=.03), .04)
    d = d + .0018 * np.sin(P[..., 2] * 70) * np.sin(P[..., 0] * 40)
    return d

# ---------- peau : tête, cou, mains ----------
def head(P):
    d = ell(P, V(0, 1.655, -.2), V(.087, .11, .1))
    d = smin(d, ell(P, V(0, 1.6, -.165), V(.066, .068, .075)), .035)   # mâchoire et menton
    d = smin(d, cone(P, V(0, 1.41, -.23), V(0, 1.58, -.205), .046, .043), .03)  # cou
    d = smin(d, cone(P, V(0, 1.658, -.11), V(0, 1.626, -.093), .007, .013), .012)  # nez
    for s in (-1, 1):
        d = smin(d, ell(P, V(s * .086, 1.648, -.21), V(.012, .027, .018)), .008)  # oreilles
        d = smax(d, -ell(P, V(s * .033, 1.666, -.103), V(.016, .01, .012)), .006)  # orbites
        d = smin(d, ell(P, V(s * .045, 1.625, -.13), V(.025, .02, .02)), .02)  # pommettes
    return d

def hands(P):
    d = None
    for s in (-1, 1):
        o = V(s * -.038, .048, -.095)
        c = V(s * .358, 1.052, .47) + o
        palm = ell(P, V(s * .35, 1.077, .445) + o, V(.038, .028, .052))
        fing = torus_x(P, c, .034, .0125)
        fing = smax(fing, np.abs(P[..., 0] - c[0]) - .036, .006)
        fing = smax(fing, -(P[..., 2] - (c[2] - .005)), .01)
        thumb = cone(P, V(s * .325, 1.07, .43) + o, V(s * .33, 1.07, .5) + o, .014, .011)
        wrist = cone(P, V(s * .33, 1.085, .32) + o, V(s * .347, 1.075, .43) + o, .03, .028)
        h = smin(smin(smin(palm, fing, .015), thumb, .012), wrist, .02)
        d = h if d is None else np.minimum(d, h)
    return d

# ---------- cheveux : casque lisse, chignon haut, mèches ----------
def hair(P):
    x, y, z = P[..., 0], P[..., 1], P[..., 2]
    d = ell(P, V(0, 1.672, -.212), V(.097, .116, .109))
    face = np.maximum(-z - .155, y - 1.715)          # dégage le front et le visage
    d = smax(d, -face, .018)
    side = np.maximum(np.abs(x) - .07, np.maximum(y - 1.63, -z - .25))  # dégage le bas des tempes
    d = smax(d, -side, .015)
    d = d + .0008 * np.sin(np.arctan2(x, -(z + .2)) * 40)  # stries peignées vers l'arrière
    bun = ell(P, V(0, 1.795, -.27), V(.064, .056, .06))
    bun = bun + .003 * np.sin(np.arctan2(x, z + .27) * 5 + y * 60)
    d = smin(d, bun, .02)
    for s in (-1, 1):  # mèches libres devant les oreilles
        d = smin(d, chain(P, [(s * .079, 1.705, -.165), (s * .085, 1.64, -.16), (s * .078, 1.585, -.152)], [.008, .007, .004], k=.01), .006)
    return d

def brows(P):
    return np.minimum(*(chain(P, [(s * .018, 1.69, -.1), (s * .036, 1.695, -.103), (s * .055, 1.689, -.113)], [.0035, .004, .003], k=.004) for s in (-1, 1)))

def eyes(P):
    return np.minimum(*(ell(P, V(s * .033, 1.666, -.113), V(.0095, .0075, .005)) for s in (-1, 1)))

def lips(P):
    return ell(P, V(0, 1.593, -.1), V(.021, .0075, .009))

# ---------- baskets ----------
def shoes(P):
    return np.minimum(*(smin(rbox(P, V(s * .15, .395, .3), (.048, .042, .12), .038), ell(P, V(s * .15, .43, .23), V(.045, .035, .05)), .03) for s in (-1, 1)))

def soles(P):
    return np.minimum(*(rbox(P, V(s * .15, .352, .3), (.052, .012, .128), .01) for s in (-1, 1)))

# ---------- sac à dos en cuir ----------
Rb = rot(rx=np.radians(-6))
def bag(P):
    d = ell(P, V(0, 1.03, -.47), V(.165, .2, .088))
    d = smin(d, ell(P, V(0, .93, -.47), V(.155, .13, .088)), .05)
    return d + .0012 * np.sin(P[..., 1] * 90) * np.sin(P[..., 0] * 70)

def bag_dark(P):
    d = ell(P, V(0, 1.245, -.49), V(.17, .09, .098))                                   # rabat arrondi
    d = np.minimum(d, ell(P, V(0, 1.03, -.558), V(.11, .075, .032)))                    # poche avant
    for s in (-1, 1):
        d = np.minimum(d, ell(P, V(s * .07, 1.14, -.583), V(.016, .1, .01)))            # sangles du rabat
        d = np.minimum(d, chain(P, [(s * .12, .97, -.4), (s * .135, 1.2, -.385), (s * .145, 1.42, -.31), (s * .14, 1.43, -.2), (s * .135, 1.3, -.13), (s * .13, 1.17, -.14)], [.015] * 6, k=.02, sx=1.5))  # bretelles
    d = np.minimum(d, chain(P, [(-.05, 1.33, -.465), (0, 1.375, -.47), (.05, 1.33, -.465)], [.01, .01, .01], k=.01))  # poignée
    return d

def brass(P):
    return np.minimum(*(ell(P, V(s * .07, 1.09, -.59), V(.022, .016, .008)) for s in (-1, 1)))

PARTS = [
    ("veste", jacket, (-.43, .93, -.47), (.43, 1.56, .34), 0.011, ("veste_beige", "#d8c29b", .9)),
    ("jean", jeans, (-.3, .38, -.5), (.3, 1.11, .3), 0.012, ("jean", "#353b48", .85)),
    ("tete", head, (-.115, 1.38, -.33), (.115, 1.79, -.07), 0.0058, ("peau", "#e2b393", .5)),
    ("main", hands, (-.42, 1.0, .3), (.42, 1.12, .53), 0.0058, ("peau", "#e2b393", .5)),
    ("cheveux", hair, (-.125, 1.52, -.345), (.125, 1.87, -.09), 0.006, ("cheveux", "#4a2b1c", .45)),
    ("sourcil", brows, (-.07, 1.68, -.125), (.07, 1.705, -.09), 0.003, ("cheveux_sourcils", "#3a2216", .6)),
    ("oeil", eyes, (-.05, 1.655, -.118), (.05, 1.678, -.095), 0.0025, ("yeux", "#24191a", .3)),
    ("levres", lips, (-.025, 1.583, -.112), (.025, 1.603, -.088), 0.0025, ("levres", "#b8736a", .5)),
    ("chaussure", shoes, (-.21, .34, .16), (.21, .48, .44), 0.009, ("chaussures", "#2a1d16", .6)),
    ("semelle", soles, (-.21, .33, .16), (.21, .37, .44), 0.008, ("chaussures_semelle", "#ece6dc", .7)),
    ("sac", bag, (-.24, .78, -.6), (.24, 1.26, -.34), 0.011, ("sac_cuir", "#8b4a25", .5)),
    ("rabat", bag_dark, (-.24, .86, -.62), (.24, 1.47, -.1), 0.0075, ("sac_cuir_fonce", "#6a361a", .55)),
    ("boucle", brass, (-.11, 1.08, -.61), (.11, 1.12, -.58), 0.003, ("boucles", "#c9a24a", .3)),
]
tot = 0
for name, fn, b0, b1, h, (mn, col, rough) in PARTS:
    r = mesh(fn, b0, b1, h)
    if r is None: print("vide", name); continue
    v, n, f = r; tot += len(f)
    mi = out.material(mn, col, rough, 1. if mn == "boucles" else 0.)
    out.add(name, v, n, f, mi); print(name, len(v), "sommets", len(f), "triangles")
dst = os.path.join(ROOT, "models", "rider.glb"); out.save(dst)
print("total", tot, "triangles ->", dst, os.path.getsize(dst) // 1024, "Ko")
