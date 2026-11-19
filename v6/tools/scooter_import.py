"""Importe le modèle Blender/Godot « scooter_retro.glb » (projet theCreativeRide) dans le GLB de la voyageuse.

Le modèle d'origine regarde vers -z et mesure 2,9 m : on le retourne (avant = +z), on le met à l'échelle
(empattement ~1,26 m) et on renomme ses matières pour le moteur du portfolio.
"""
import os, numpy as np
from sdf import read_glb

SRC = os.path.join(os.path.dirname(__file__), "scooter_retro.glb")
SC, DZ = .60, -.06
MATS = [("chrome", "chrome", .15), ("noir satin", "plastique_noir", .6), ("verre ivoire", "phare", .2), ("vert sauge nacre", "peinture_menthe", .3),
        ("vert sauge clair", "peinture_menthe_claire", .3), ("caoutchouc", "pneu", .9), ("cuir brun", "selle_cuir", .55), ("feu rouge", "feu_arriere", .3)]


def lin2hex(c):
    s = [(x * 12.92 if x <= .0031308 else 1.055 * x ** (1 / 2.4) - .055) for x in c[:3]]
    return "#%02x%02x%02x" % tuple(int(round(max(0, min(1, v)) * 255)) for v in s)


def import_scooter(out, log=print):
    tri = 0
    for name, P, N, I, m in read_glb(SRC):
        mn = m["name"].lower(); key = next((k for k in MATS if k[0] in mn), None)
        mat = key[1] if key else "plastique_noir"; rough = key[2] if key else .6
        col = lin2hex(m["pbrMetallicRoughness"].get("baseColorFactor", [.5, .5, .5, 1]))
        P = P * np.array([-SC, SC, -SC], np.float32) + np.array([0, -.025 * SC, DZ], np.float32)
        N = N * np.array([-1, 1, -1], np.float32)
        emit = 1. if mat in ("phare", "feu_arriere") else 0.
        out.add(name.replace(" ", "_"), P.astype(np.float32), N.astype(np.float32), I.reshape(-1, 3), out.material(mat, col, rough, 0., emit))
        tri += len(I) // 3
    log("scooter importé :", tri, "triangles")
    return tri
