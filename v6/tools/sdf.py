"""Petite boîte à outils SDF (champs de distance) pour sculpter des personnages lisses.

Chaque matière est une fonction SDF ; on la polygonise avec marching cubes
(scikit-image), les normales viennent du gradient du champ : surfaces organiques,
sans facettes ni arêtes « cubiques ».
Repère glTF : x = côté, y = haut, z = avant.
"""
import json, struct
import numpy as np
from skimage.measure import marching_cubes


def V(*a):
    return np.array(a, dtype=np.float32)


# ---------- primitives ----------
def sphere(P, c, r):
    return np.sqrt(((P - c) ** 2).sum(-1)) - r


def ell(P, c, rad):
    q = (P - c) / rad
    k0 = np.sqrt((q ** 2).sum(-1))
    k1 = np.sqrt(((q / rad) ** 2).sum(-1)) + 1e-9
    return k0 * (k0 - 1) / k1


def cone(P, a, b, ra, rb, sx=1.0, sz=1.0):
    """Segment arrondi a→b, rayon ra→rb ; sx/sz aplatissent la section."""
    s = np.array([1 / sx, 1, 1 / sz], np.float32)
    pa, ba = (P - a) * s, (b - a) * s
    h = np.clip((pa * ba).sum(-1) / (ba * ba).sum(), 0, 1)
    d = np.sqrt(((pa - ba * h[..., None]) ** 2).sum(-1))
    return (d - (ra + (rb - ra) * h)) * min(sx, sz)


def chain(P, pts, rads, k=.03, sx=1.0, sz=1.0):
    d = None
    for i in range(len(pts) - 1):
        e = cone(P, V(*pts[i]), V(*pts[i + 1]), rads[i], rads[i + 1], sx, sz)
        d = e if d is None else smin(d, e, k)
    return d


def rot(rx=0., ry=0., rz=0.):
    cx, sx_, cy, sy, cz, sz = np.cos(rx), np.sin(rx), np.cos(ry), np.sin(ry), np.cos(rz), np.sin(rz)
    Rx = np.array([[1, 0, 0], [0, cx, -sx_], [0, sx_, cx]]); Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]]); Rz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])
    return (Ry @ Rx @ Rz).astype(np.float32)


def rbox(P, c, half, r, R=None):
    q = P - c
    if R is not None: q = q @ R  # dans le repère de la boîte
    q = np.abs(q) - (np.array(half, np.float32) - r)
    return np.sqrt((np.maximum(q, 0) ** 2).sum(-1)) + np.minimum(q.max(-1), 0) - r


def torus_x(P, c, R_, r):
    """Tore d'axe x (doigts enroulés autour d'une poignée)."""
    q = P - c
    d = np.sqrt(q[..., 1] ** 2 + q[..., 2] ** 2) - R_
    return np.sqrt(d ** 2 + q[..., 0] ** 2) - r


def smin(a, b, k):
    h = np.clip(.5 + .5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


def plane(P, n, d0):
    n = np.array(n, np.float32); n = n / np.linalg.norm(n)
    return (P * n).sum(-1) - d0


# ---------- polygonisation ----------
def mesh(fn, b0, b1, h):
    b0, b1 = np.array(b0, np.float32), np.array(b1, np.float32)
    xs = [np.arange(b0[i], b1[i] + h, h, dtype=np.float32) for i in range(3)]
    G = np.stack(np.meshgrid(*xs, indexing="ij"), -1)
    F = fn(G)
    if F.min() > 0 or F.max() < 0: return None
    v, f, _, _ = marching_cubes(F, 0.0, spacing=(h, h, h))
    v = v.astype(np.float32) + b0
    # normales : gradient du champ (doux)
    e = h * .5
    n = np.stack([fn(v + V(e, 0, 0)) - fn(v - V(e, 0, 0)), fn(v + V(0, e, 0)) - fn(v - V(0, e, 0)), fn(v + V(0, 0, e)) - fn(v - V(0, 0, e))], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True) + 1e-9
    f = f[:, ::-1].copy()  # sens antihoraire vu de l'extérieur
    return v, n.astype(np.float32), f.astype(np.uint32)


def srgb2lin(hexc):
    c = [int(hexc[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c]


# ---------- écriture glb ----------
class GLB:
    def __init__(self):
        self.nodes, self.meshes, self.mats, self.acc, self.views, self.bin = [], [], [], [], [], bytearray()
        self.matix = {}

    def _view(self, arr, target):
        while len(self.bin) % 4: self.bin += b"\0"
        off = len(self.bin); self.bin += arr.tobytes()
        self.views.append({"buffer": 0, "byteOffset": off, "byteLength": arr.nbytes, "target": target}); return len(self.views) - 1

    def material(self, name, hexc, rough=.6, metal=0., emit=0.):
        if name in self.matix: return self.matix[name]
        m = {"name": name, "pbrMetallicRoughness": {"baseColorFactor": srgb2lin(hexc) + [1], "metallicFactor": metal, "roughnessFactor": rough}}
        if emit: m["emissiveFactor"] = srgb2lin(hexc)
        self.mats.append(m); self.matix[name] = len(self.mats) - 1; return self.matix[name]

    def add(self, name, v, n, f, mat):
        v = np.ascontiguousarray(v, np.float32); n = np.ascontiguousarray(n, np.float32); f = np.ascontiguousarray(f, np.uint16 if len(v) < 65536 else np.uint32).reshape(-1)
        a0 = len(self.acc)
        self.acc.append({"bufferView": self._view(v, 34962), "componentType": 5126, "count": len(v), "type": "VEC3", "min": v.min(0).tolist(), "max": v.max(0).tolist()})
        self.acc.append({"bufferView": self._view(n, 34962), "componentType": 5126, "count": len(n), "type": "VEC3"})
        self.acc.append({"bufferView": self._view(f, 34963), "componentType": 5123 if f.dtype == np.uint16 else 5125, "count": len(f), "type": "SCALAR"})
        self.meshes.append({"name": name, "primitives": [{"attributes": {"POSITION": a0, "NORMAL": a0 + 1}, "indices": a0 + 2, "material": mat}]})
        self.nodes.append({"name": name, "mesh": len(self.meshes) - 1})

    def save(self, path):
        while len(self.bin) % 4: self.bin += b"\0"
        j = {"asset": {"version": "2.0", "generator": "portfolio-v5 sdf"}, "scene": 0, "scenes": [{"nodes": list(range(len(self.nodes)))}], "nodes": self.nodes, "meshes": self.meshes,
             "materials": self.mats, "accessors": self.acc, "bufferViews": self.views, "buffers": [{"byteLength": len(self.bin)}]}
        js = json.dumps(j, separators=(",", ":")).encode()
        while len(js) % 4: js += b" "
        out = struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(self.bin)) + struct.pack("<II", len(js), 0x4E4F534A) + js + struct.pack("<II", len(self.bin), 0x004E4942) + bytes(self.bin)
        open(path, "wb").write(out)


def read_glb(path):
    """Renvoie [(nom, pos, nor, idx, matériau)] avec transformations appliquées."""
    b = open(path, "rb").read(); off = 12; js = binb = None
    while off < len(b):
        ln, ty = struct.unpack("<II", b[off:off + 8])
        if ty == 0x4E4F534A: js = json.loads(b[off + 8:off + 8 + ln])
        else: binb = b[off + 8:off + 8 + ln]
        off += 8 + ln
    CT = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}; NC = {"SCALAR": 1, "VEC3": 3, "VEC2": 2, "VEC4": 4}
    def acc(i):
        a = js["accessors"][i]; bv = js["bufferViews"][a["bufferView"]]; dt = CT[a["componentType"]]; n = NC[a["type"]]
        o = bv.get("byteOffset", 0) + a.get("byteOffset", 0); st = bv.get("byteStride")
        if st and st != n * np.dtype(dt).itemsize:
            raw = np.frombuffer(binb, np.uint8, count=st * a["count"], offset=o).reshape(a["count"], st)
            return raw[:, :n * np.dtype(dt).itemsize].copy().view(dt).reshape(a["count"], n)
        return np.frombuffer(binb, dt, count=a["count"] * n, offset=o).reshape(a["count"], n) if n > 1 else np.frombuffer(binb, dt, count=a["count"], offset=o)
    out = []
    for nd in js["nodes"]:
        if nd.get("mesh") is None: continue
        qx, qy, qz, qw = nd.get("rotation", [0, 0, 0, 1]); s = np.array(nd.get("scale", [1, 1, 1])); t = np.array(nd.get("translation", [0, 0, 0]))
        R = np.array([[1 - 2 * (qy * qy + qz * qz), 2 * (qx * qy - qz * qw), 2 * (qx * qz + qy * qw)], [2 * (qx * qy + qz * qw), 1 - 2 * (qx * qx + qz * qz), 2 * (qy * qz - qx * qw)], [2 * (qx * qz - qy * qw), 2 * (qy * qz + qx * qw), 1 - 2 * (qx * qx + qy * qy)]])
        for p in js["meshes"][nd["mesh"]]["primitives"]:
            P = acc(p["attributes"]["POSITION"]).astype(np.float32); N = acc(p["attributes"]["NORMAL"]).astype(np.float32)
            I = acc(p["indices"]).astype(np.uint32)
            P = (P * s) @ R.T + t; N = (N / s) @ R.T; N /= np.linalg.norm(N, axis=1, keepdims=True) + 1e-9
            m = js["materials"][p["material"]] if p.get("material") is not None else {"name": "x", "pbrMetallicRoughness": {}}
            out.append((nd["name"], P, N, I, m))
    return out
