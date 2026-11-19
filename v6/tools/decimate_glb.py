#!/usr/bin/env python3
"""Réduit le nombre de triangles d'un fichier .glb par regroupement de sommets (vertex clustering).

Les modèles sculptés en champs de distance (rider_sdf.py) sont très fins : environ 190 000 triangles pour la voyageuse
et son scooter, alors qu'ils occupent une petite zone de l'écran et sont dessinés deux fois par image (scène + ombre).
Ce script garde les noms, les matériaux et les transformations de nœuds ; seules les géométries sont simplifiées.

Usage : python3 tools/decimate_glb.py entrée.glb sortie.glb [ratio]      (ratio par défaut : 0.16)
Dépendance : numpy.
"""
import sys, json, struct
import numpy as np

CT = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}
NC = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}


def read(path):
    b = open(path, "rb").read(); off = 12; js = binb = None
    while off < len(b):
        ln, ty = struct.unpack("<II", b[off:off + 8])
        if ty == 0x4E4F534A: js = json.loads(b[off + 8:off + 8 + ln])
        else: binb = b[off + 8:off + 8 + ln]
        off += 8 + ln
    return js, binb


def acc(js, binb, i):
    a = js["accessors"][i]; bv = js["bufferViews"][a["bufferView"]]; dt = CT[a["componentType"]]; n = NC[a["type"]]
    o = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
    return np.frombuffer(binb, dt, count=a["count"] * n, offset=o).reshape(a["count"], n)


def cluster(P, N, I, cell):
    """Regroupe les sommets d'une même cellule de côté `cell`. Renvoie (P, N, I) simplifiés."""
    key = np.floor((P - P.min(0)) / cell).astype(np.int64)
    key = (key[:, 0] * 100003 + key[:, 1]) * 100019 + key[:, 2]
    _, first, inv = np.unique(key, return_index=True, return_inverse=True)
    inv = inv.reshape(-1); m = len(first)
    cnt = np.bincount(inv, minlength=m).astype(np.float64)
    P2 = np.stack([np.bincount(inv, P[:, c], m) / cnt for c in range(3)], 1)
    N2 = np.stack([np.bincount(inv, N[:, c], m) for c in range(3)], 1)
    L = np.linalg.norm(N2, axis=1, keepdims=True); N2 = np.where(L > 1e-8, N2 / np.maximum(L, 1e-8), N[first])
    T = inv[I.reshape(-1, 3)]
    T = T[(T[:, 0] != T[:, 1]) & (T[:, 1] != T[:, 2]) & (T[:, 0] != T[:, 2])]
    return P2.astype(np.float32), N2.astype(np.float32), T.astype(np.uint32)


def simplify(P, N, I, ratio):
    tris = len(I) // 3
    target = max(60, int(tris * ratio))
    if tris <= 300: return P, N, I.reshape(-1, 3).astype(np.uint32)
    diag = float(np.linalg.norm(P.max(0) - P.min(0)))
    best = None
    for k in (256, 200, 160, 128, 100, 80, 64, 50, 40, 32, 24, 16, 12, 8):
        r = cluster(P, N, I, diag / k)
        if len(r[2]) <= target: return r
        best = r
    return best


def main():
    src, dst = sys.argv[1], sys.argv[2]; ratio = float(sys.argv[3]) if len(sys.argv) > 3 else .16
    js, binb = read(src)
    out = bytearray(); views = []; accs = []
    def add(arr, target, typ, ctype, mm=False):
        while len(out) % 4: out.append(0)
        views.append({"buffer": 0, "byteOffset": len(out), "byteLength": arr.nbytes, "target": target}); out.extend(arr.tobytes())
        a = {"bufferView": len(views) - 1, "componentType": ctype, "count": len(arr) if typ != "SCALAR" else arr.size, "type": typ}
        if mm: a["min"] = arr.min(0).tolist(); a["max"] = arr.max(0).tolist()
        accs.append(a); return len(accs) - 1
    before = after = 0
    for me in js["meshes"]:
        for p in me["primitives"]:
            P = acc(js, binb, p["attributes"]["POSITION"]).astype(np.float32); N = acc(js, binb, p["attributes"]["NORMAL"]).astype(np.float32)
            I = acc(js, binb, p["indices"]).reshape(-1).astype(np.uint32)
            before += len(I) // 3
            P2, N2, T = simplify(P, N, I, ratio); after += len(T)
            idx = T.reshape(-1); big = len(P2) >= 65536
            p["attributes"] = {"POSITION": add(P2, 34962, "VEC3", 5126, True), "NORMAL": add(N2, 34962, "VEC3", 5126)}
            p["indices"] = add(idx.astype(np.uint32 if big else np.uint16), 34963, "SCALAR", 5125 if big else 5123)
    while len(out) % 4: out.append(0)
    js["accessors"], js["bufferViews"], js["buffers"] = accs, views, [{"byteLength": len(out)}]
    j = json.dumps(js, separators=(",", ":")).encode()
    while len(j) % 4: j += b" "
    data = struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(j) + 8 + len(out)) + struct.pack("<II", len(j), 0x4E4F534A) + j + struct.pack("<II", len(out), 0x004E4942) + bytes(out)
    open(dst, "wb").write(data)
    print(f"{src}: {before} -> {after} triangles ({100 * after / max(1, before):.0f} %), {len(data) / 1e6:.2f} Mo")


if __name__ == "__main__":
    main()
