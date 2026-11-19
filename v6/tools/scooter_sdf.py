"""Scooter italien vintage (v6), modélisé en champs de distance avec des arêtes franches.

Contrairement à la v5 (coque en « œuf »), chaque pièce est une plaque ou un volume
à rayons de congé très faibles : tablier plat, caisson moteur à flancs plats et
ouïes, plancher nervuré, garde-boue en coque, roues à pneu, jante et goujons.
Repère : x = côté, y = haut, z = avant. Roues de rayon .27, empattement 1,28 m.
"""
import numpy as np
from sdf import *

WR = .27                      # rayon des roues
RW, FW = V(0, WR, -.62), V(0, WR, .66)   # centres des roues arrière et avant


# ---------- petits outils ----------
def rb(P, c, half, r, R=None):
    return rbox(P, V(*c), half, r, R)


def cyl_x(P, c, r, hl, rd=.0):
    """Cylindre d'axe x (demi-longueur hl) avec congé rd."""
    q = P - V(*c); d = np.sqrt(q[..., 1] ** 2 + q[..., 2] ** 2) - r; e = np.abs(q[..., 0]) - hl
    a = np.maximum(np.stack([d + rd, e + rd], -1), 0); return np.sqrt((a ** 2).sum(-1)) + np.minimum(np.maximum(d, e), 0) - rd


def cyl_y(P, c, r, hl, rd=.0):
    q = P - V(*c); d = np.sqrt(q[..., 0] ** 2 + q[..., 2] ** 2) - r; e = np.abs(q[..., 1]) - hl
    a = np.maximum(np.stack([d + rd, e + rd], -1), 0); return np.sqrt((a ** 2).sum(-1)) + np.minimum(np.maximum(d, e), 0) - rd


def tube(P, pts, r, k=.004):
    return chain(P, [tuple(p) for p in pts], [r] * len(pts), k=k)


def wheel_tire(P, c, Rm=.222, rm=.05, sx=1.3):
    q = P - c; rr = np.sqrt(q[..., 1] ** 2 + q[..., 2] ** 2)
    d = np.sqrt((rr - Rm) ** 2 + (q[..., 0] / sx) ** 2) - rm
    ang = np.arctan2(q[..., 2], q[..., 1])
    return d + .0022 * np.sin(ang * 36) * (np.abs(q[..., 0]) < .05)   # crampons du pneu


def wheel_rim(P, c):
    """Jante pleine crème : disque creusé, moyeu et cinq trous de ventilation."""
    q = P - c; rr = np.sqrt(q[..., 1] ** 2 + q[..., 2] ** 2); ang = np.arctan2(q[..., 2], q[..., 1])
    disc = np.maximum(rr - .176, np.abs(q[..., 0]) - .042)
    holes = np.min(np.stack([np.sqrt((q[..., 1] - .105 * np.cos(a)) ** 2 + (q[..., 2] - .105 * np.sin(a)) ** 2) - .024 for a in np.arange(5) * 2 * np.pi / 5 + .3]), 0)
    d = np.maximum(disc, -holes)
    d = np.maximum(d, -(np.maximum(rr - .15, .0) * 0 + (.03 - np.abs(q[..., 0])) * (rr > .06) * (rr < .15) * 1.0) * 0)
    return smin(d, np.maximum(rr - .05, np.abs(q[..., 0]) - .062), .004)


# ---------- carrosserie ----------
def body(P):
    x, y, z = P[..., 0], P[..., 1], P[..., 2]
    # caisson moteur : volume effilé vers l'arrière, flancs plats
    cowl = rb(P, (0, .52, -.50), (.185, .185, .47), .035)
    cowl = np.maximum(cowl, np.abs(x) - (.2 - .045 * np.clip((-z - .2) / .8, 0, 1)))                  # affine l'arrière
    cowl = np.maximum(cowl, y - (.70 - .04 * np.clip((-z - .1) / .8, 0, 1)))
    # bavolet / ouïes latérales : fentes régulières
    for s in (-1, 1):
        for k in range(5):
            zz = -.34 - k * .075
            cowl = smax(cowl, -rb(P, (s * .205, .50, zz), (.018, .085, .017), .006), .004)
    # arête de flanc (nervure)
    cowl += -.004 * np.exp(-(((y - .40) / .012) ** 2)) * (np.abs(x) > .1)
    # queue : petit volume arrière arrondi, feu intégré
    tail = rb(P, (0, .56, -.94), (.12, .09, .08), .03)
    d = smin(cowl, tail, .02)
    # tablier : plaque inclinée, plus étroite en haut
    ang = np.radians(-14)
    shield = rb(P, (0, .66, .5), (.255, .37, .034), .016, rot(rx=ang))
    shield = np.maximum(shield, np.abs(x) - (.265 - .1 * np.clip((y - .3) / .75, 0, 1)))
    d = smin(d, shield, .006)
    # raccord plancher / tablier / caisson (nervures d'angle)
    d = smin(d, rb(P, (0, .32, .4), (.2, .025, .06), .012), .02)
    d = smin(d, rb(P, (0, .45, .0), (.16, .15, .09), .03), .035)
    # col de direction (carter de phare)
    d = smin(d, ell(P, V(0, 1.0, .555), V(.115, .1, .085)), .05)
    # garde-boue avant : coque autour de la roue, ouverte vers le bas et l'arrière
    q = P - FW; rr = np.sqrt(q[..., 1] ** 2 + q[..., 2] ** 2)
    fend = np.maximum(np.abs(rr - .322) - .013, np.abs(x) - .095)
    fend = np.maximum(fend, -(q[..., 1] + .0))                       # moitié haute seulement
    fend = np.maximum(fend, -(q[..., 2] + .2))                       # s'arrête derrière l'axe
    d = smin(d, fend, .006)
    # garde-boue arrière : bavette sous la selle
    d = smin(d, rb(P, (0, .62, -.80), (.2, .012, .15), .008), .01)
    return d


def floor(P):
    d = rb(P, (0, .29, .12), (.19, .022, .36), .01)
    d = smin(d, rb(P, (-.185, .315, .06), (.012, .02, .3), .006), .004)      # rebords
    d = smin(d, rb(P, (.185, .315, .06), (.012, .02, .3), .006), .004)
    ribs = np.maximum(.0, np.sin(P[..., 2] * 140)) * .006 * (np.abs(P[..., 0]) < .15)
    return d - ribs * (P[..., 1] > .3)


def seat(P):
    x, y, z = P[..., 0], P[..., 1], P[..., 2]
    w = .15 - .015 * np.clip((z + .6) / .6, 0, 1)
    d = rb(P, (0, .81, -.32), (.15, .045, .31), .03)
    d = np.maximum(d, np.abs(x) - w - .02 * np.clip(-(z + .3) / .3, 0, 1))
    d = smin(d, rb(P, (0, .775, -.30), (.14, .035, .29), .02), .01)
    d = smin(d, rb(P, (0, .87, -.55), (.12, .03, .07), .02), .02)      # petit dosseret
    # coutures : fines gorges
    return d + .002 * np.maximum(0, np.sin(z * 55)) * (y > .84)


def chrome(P):
    d = tube(P, [(-.38, 1.052, .47), (.38, 1.052, .47)], .0125)                    # guidon
    for s in (-1, 1):
        d = smin(d, tube(P, [(s * .34, 1.06, .47), (s * .41, 1.32, .455)], .008), .003)      # tige de rétro
        d = smin(d, tube(P, [(s * .085, .72, .6), (s * .085, .27, .66)], .011), .004)   # fourche
        d = np.minimum(d, tube(P, [(s * .06, .735, -.66), (s * .17, .735, -.7), (s * .17, .735, -.93)], .008))  # porte-bagages
    d = np.minimum(d, tube(P, [(-.17, .735, -.78), (.17, .735, -.78)], .008))
    d = np.minimum(d, tube(P, [(-.17, .735, -.93), (.17, .735, -.93)], .008))
    # bague de phare
    ring = np.abs(np.sqrt(P[..., 0] ** 2 + (P[..., 1] - 1.03) ** 2) - .082) - .008
    d = np.minimum(d, np.maximum(ring, np.abs(P[..., 2] - .685) - .025))
    # pot d'échappement (côté droit)
    d = np.minimum(d, tube(P, [(.2, .33, -.4), (.235, .3, -.68), (.235, .3, -.98)], .028, .012))
    # moyeux
    for c in (RW, FW):
        d = np.minimum(d, cyl_x(P, (0, c[1], c[2]), .035, .068, .01))
    # charnière de selle + badge
    d = np.minimum(d, rb(P, (0, .62, .30), (.05, .012, .012), .004))
    return d


def mirrors(P):
    return np.minimum(*(np.maximum(np.sqrt((P[..., 0] - s * .42) ** 2 + (P[..., 1] - 1.34) ** 2) - .05, np.abs(P[..., 2] - .44) - .008) for s in (-1, 1)))


def mirror_glass(P):
    return np.minimum(*(np.maximum(np.sqrt((P[..., 0] - s * .42) ** 2 + (P[..., 1] - 1.34) ** 2) - .043, np.abs(P[..., 2] - .434) - .01) for s in (-1, 1)))


def grips(P):
    return np.minimum(*(cyl_x(P, (s * .35, 1.052, .47), .021, .06, .008) for s in (-1, 1)))


def headlight(P):
    q = P - V(0, 1.03, .655)
    return smax(np.sqrt((q ** 2 * np.array([1, 1, 2.6], np.float32)).sum(-1)) - .075, -(q[..., 2] + .03), .01)


def tailight(P):
    return rb(P, (0, .585, -1.015), (.062, .028, .012), .008)


def plate(P):
    return rb(P, (0, .43, -1.0), (.1, .06, .004), .004)


def tires(P):
    return np.minimum(wheel_tire(P, RW), wheel_tire(P, FW))


def rims(P):
    return np.minimum(wheel_rim(P, RW), wheel_rim(P, FW))


PARTS = [
    ("carrosserie", body, (-.3, .24, -1.08), (.3, 1.16, .96), .0105, ("peinture_menthe", "#8dd0bb", .3, 0)),
    ("plancher", floor, (-.22, .26, -.3), (.22, .36, .52), .009, ("plastique_noir", "#26282b", .85, 0)),
    ("selle", seat, (-.19, .72, -.7), (.19, .93, .06), .011, ("selle_cuir", "#6b3d22", .55, 0)),
    ("chrome", chrome, (-.45, .2, -1.04), (.45, 1.36, .74), .009, ("chrome", "#dfe4e8", .15, 0)),
    ("retro", mirrors, (-.48, 1.27, .42), (.48, 1.4, .47), .004, ("chrome_retro", "#dfe4e8", .15, 0)),
    ("retro_verre", mirror_glass, (-.48, 1.27, .42), (.48, 1.4, .46), .004, ("verre_retro", "#8fb4d0", .1, 0)),
    ("poignee", grips, (-.43, 1.02, .44), (.43, 1.09, .5), .004, ("plastique_noir", "#26282b", .85, 0)),
    ("pneu", tires, (-.09, -.01, -.93), (.09, .56, .95), .012, ("pneu", "#1d1e20", .9, 0)),
    ("jante", rims, (-.08, .08, -.84), (.08, .47, .86), .008, ("jante", "#efe7d3", .3, 0)),
    ("phare", headlight, (-.09, .94, .58), (.09, 1.12, .76), .004, ("phare", "#fff1c4", .2, 1)),
    ("feu", tailight, (-.08, .55, -1.04), (.08, .62, -.99), .003, ("feu_arriere", "#e1262f", .3, 1)),
    ("plaque", plate, (-.12, .36, -1.02), (.12, .5, -.98), .003, ("plaque", "#f2f2ee", .6, 0)),
]


def build_scooter(out, resolution=1.0, log=print):
    tri = 0
    for name, fn, b0, b1, h, (mn, col, rough, emit) in PARTS:
        r = mesh(fn, b0, b1, h * resolution)
        if r is None: log("vide", name); continue
        v, n, f = r; tri += len(f)
        out.add(name, v, n, f, out.material(mn, col, rough, 0., emit))
        log(f"  {name}: {len(f)} triangles")
    return tri
