"""Voyageurs debout pour le hall du terminal (v5), sculptés en champs de distance.
Chaque personne est un groupe de nœuds « nom__partie » ; le moteur les fusionne.
Lancer : python3 tools/people_sdf.py
"""
import os, sys, numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from sdf import *

ROOT = os.path.join(os.path.dirname(__file__), "..")
out = GLB()

def person(name, top, pants, hairc, shoe, skin="#e0b090", hair="short", bag=None, s=1.0, coat=False, turn=0.):
    c, sn = np.cos(turn), np.sin(turn)
    def T(f):  # mise à l'échelle et rotation autour de y
        def g(P):
            Q = P.copy(); x, z = Q[..., 0].copy(), Q[..., 2].copy()
            Q[..., 0] = c * x - sn * z; Q[..., 2] = sn * x + c * z
            return f(Q / s) * s
        return g
    def body_top(P):
        d = ell(P, V(0, 1.0, 0), V(.16, .12, .115))
        d = smin(d, ell(P, V(0, 1.13, 0), V(.145, .12, .1)), .05)
        d = smin(d, ell(P, V(0, 1.3, 0), V(.18, .15, .11)), .05)
        d = smin(d, cone(P, V(-.16, 1.42, 0), V(.16, 1.42, 0), .062, .062), .05)
        for k in (-1, 1):
            d = smin(d, chain(P, [(k * .2, 1.4, 0), (k * .25, 1.13, .015), (k * .27, .88, .05)], [.058, .048, .042], k=.03), .04)
        d = smax(d, -(P[..., 1] - (.62 if coat else .9)), .02)
        if coat: d = smin(d, ell(P, V(0, .8, 0), V(.19, .2, .14)), .06)
        return d
    def legs(P):
        d = ell(P, V(0, .96, 0), V(.155, .1, .11))
        for k in (-1, 1): d = smin(d, chain(P, [(k * .09, .93, 0), (k * .1, .5, .02), (k * .1, .11, 0)], [.075, .056, .044], k=.03), .04)
        return d
    def skinf(P):
        d = cone(P, V(0, 1.42, 0), V(0, 1.57, .012), .05, .046)
        d = smin(d, ell(P, V(0, 1.665, .02), V(.084, .108, .098)), .03)
        d = smin(d, ell(P, V(0, 1.61, .05), V(.064, .065, .07)), .03)
        d = smin(d, cone(P, V(0, 1.66, .11), V(0, 1.63, .13), .007, .012), .01)
        for k in (-1, 1):
            d = np.minimum(d, smin(ell(P, V(k * .277, .81, .056), V(.032, .058, .023)), cone(P, V(k * .27, .92, .05), V(k * .276, .83, .055), .035, .029), .02))
            d = smin(d, ell(P, V(k * .083, 1.655, .015), V(.012, .026, .018)), .008)
        return d
    def hairf(P):
        x, y, z = P[..., 0], P[..., 1], P[..., 2]
        d = ell(P, V(0, 1.684, .008), V(.094, .114, .107))
        d = smax(d, -np.maximum(z - .06, y - 1.715), .016)
        d = smax(d, -np.maximum(np.abs(x) - .068, np.maximum(y - 1.64, z - .0)), .014)
        if hair == "bun": d = smin(d, ell(P, V(0, 1.8, -.06), V(.06, .052, .056)), .02)
        if hair == "long": d = smin(d, rbox(P, V(0, 1.47, -.065), (.105, .2, .035), .03), .04)
        if hair == "pony": d = smin(d, chain(P, [(0, 1.72, -.09), (0, 1.62, -.14), (0, 1.45, -.13)], [.035, .03, .02], k=.02), .02)
        return d + .0007 * np.sin(np.arctan2(x, z) * 40)
    def shoes(P):
        return np.minimum(*(rbox(P, V(k * .1, .045, .04), (.045, .045, .12), .035) for k in (-1, 1)))
    parts = [("haut", body_top, (-.36, .55, -.25), (.36, 1.52, .25), .017, top, .85), ("bas", legs, (-.22, .05, -.15), (.22, 1.08, .17), .017, pants, .85),
             ("peau", skinf, (-.32, .74, -.12), (.32, 1.79, .17), .0095, skin, .5), ("cheveux", hairf, (-.13, 1.25, -.2), (.13, 1.88, .14), .0095, hairc, .45),
             ("chaussure", shoes, (-.17, -.01, -.1), (.17, .1, .18), .013, shoe, .6)]
    if bag == "valise":
        parts.append(("valise", lambda P: smin(rbox(P, V(.42, .36, .05), (.12, .3, .2), .03), np.minimum(cone(P, V(.42, .66, .05), V(.42, .9, .05), .012, .012), cone(P, V(.42, .9, .02), V(.42, .9, .08), .012, .012)), .01), (.27, -.01, -.18), (.57, .95, .28), .016, "#2f4a6b", .4))
    if bag == "sac":
        parts.append(("sac", lambda P: smin(rbox(P, V(0, 1.18, -.17), (.15, .2, .07), .05), np.minimum(*(chain(P, [(k * .12, 1.0, -.13), (k * .14, 1.43, -.06), (k * .13, 1.25, .1)], [.014] * 3, k=.02) for k in (-1, 1))), .01), (-.25, .9, -.3), (.25, 1.5, .16), .013, "#8b4a25", .5))
    for pn, fn, b0, b1, h, col, rough in parts:
        b0 = np.array(b0) * s; b1 = np.array(b1) * s; b0[[0, 2]] -= .1; b1[[0, 2]] += .1
        r = mesh(T(fn), b0, b1, h * s * 1.35)
        if r is None: continue
        v, n, f = r; mi = out.material(f"{name}_{pn}_{col}", col, rough)
        out.add(f"{name}__{pn}", v, n, f, mi)

person("voyageur_a", "#2f3e57", "#3b3f46", "#2a1d14", "#1d1d20", "#c98f6a", "short", "valise", 1.04, coat=True)
person("voyageuse_b", "#b84a4a", "#2b2f3a", "#6b3f22", "#3a2a22", "#e8c0a0", "long", None, .97)
person("voyageuse_c", "#d8c29b", "#353b48", "#4a2b1c", "#2a1d16", "#e2b393", "bun", "sac", 1.0)
person("voyageur_d", "#6d7a58", "#2c2c30", "#1a1410", "#4a3a2a", "#8a5a3c", "short", "valise", 1.08)
person("voyageuse_e", "#e6e2da", "#5a6b88", "#c79a5a", "#e8e8e8", "#f0cfb0", "pony", "valise", .95, coat=True)
dst = os.path.join(ROOT, "models", "people.glb"); out.save(dst); print(dst, os.path.getsize(dst) // 1024, "Ko")
