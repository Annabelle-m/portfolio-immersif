import json, struct, sys
src, dst = sys.argv[1], sys.argv[2]
D = json.load(open(src)); binb = bytearray(); views = []; accs = []; meshes = []; nodes = []; mats = []; mi = {}
def add(data, fmt, comp, typ, target, mm=None):
    while len(binb) % 4: binb.append(0)
    off = len(binb); binb.extend(struct.pack('<%d%s' % (len(data), fmt), *data))
    views.append({"buffer": 0, "byteOffset": off, "byteLength": len(binb) - off, "target": target})
    n = {"SCALAR": 1, "VEC3": 3}[typ]; a = {"bufferView": len(views) - 1, "componentType": comp, "count": len(data) // n, "type": typ}
    if mm: a["min"], a["max"] = mm
    accs.append(a); return len(accs) - 1
tot = 0
def cluster(P):
    pos, nor, idx = P["pos"], P["nor"], P["idx"]; n = len(pos) // 3
    mn = [min(pos[c::3]) for c in range(3)]; mx = [max(pos[c::3]) for c in range(3)]
    g = max(.008, sum((mx[c] - mn[c]) ** 2 for c in range(3)) ** .5 / 42)
    cell = {}; remap = [0] * n; acc = []
    for i in range(n):
        k = tuple(int((pos[i * 3 + c] - mn[c]) / g) for c in range(3))
        j = cell.get(k)
        if j is None: j = cell[k] = len(acc); acc.append([0, 0, 0, 0, 0, 0, 0])
        a = acc[j]
        for c in range(3): a[c] += pos[i * 3 + c]; a[3 + c] += nor[i * 3 + c]
        a[6] += 1; remap[i] = j
    np_, nn = [], []
    for a in acc:
        np_ += [a[0] / a[6], a[1] / a[6], a[2] / a[6]]; l = (a[3] ** 2 + a[4] ** 2 + a[5] ** 2) ** .5 or 1; nn += [a[3] / l, a[4] / l, a[5] / l]
    ni = []; seen = set()
    for t in range(0, len(idx), 3):
        a, b, c = remap[idx[t]], remap[idx[t + 1]], remap[idx[t + 2]]
        if a == b or b == c or a == c: continue
        key = tuple(sorted((a, b, c)))
        if key in seen: continue
        seen.add(key); ni += [a, b, c]
    P["pos"], P["nor"], P["idx"] = np_, nn, ni
for i, P in enumerate(D):
    if P["mat"] not in mi:
        mi[P["mat"]] = len(mats); mats.append({"name": P["mat"], "pbrMetallicRoughness": {"baseColorFactor": P["col"] + [1], "metallicFactor": 0, "roughnessFactor": .8}})
    if '__corps' not in P['node'] and len(P['idx']) > 900: cluster(P)
    pos = P["pos"]; xs, ys, zs = pos[0::3], pos[1::3], pos[2::3]
    ap = add(pos, 'f', 5126, "VEC3", 34962, ([min(xs), min(ys), min(zs)], [max(xs), max(ys), max(zs)]))
    an = add(P["nor"], 'f', 5126, "VEC3", 34962); ai = add(P["idx"], 'I', 5125, "SCALAR", 34963)
    meshes.append({"primitives": [{"attributes": {"POSITION": ap, "NORMAL": an}, "indices": ai, "material": mi[P["mat"]]}]})
    nm = P["node"] if not any(n["name"] == P["node"] for n in nodes) else P["node"] + "_" + P["mat"].split("_")[-1]
    nodes.append({"name": nm, "mesh": len(meshes) - 1}); tot += len(P["idx"]) // 3
    print(nm, P["mat"], len(P["idx"]) // 3)
g = {"asset": {"version": "2.0", "generator": "Blender 5.2 (maillages) + json2glb"}, "scene": 0, "scenes": [{"nodes": list(range(len(nodes)))}], "nodes": nodes, "meshes": meshes, "materials": mats, "accessors": accs, "bufferViews": views, "buffers": [{"byteLength": len(binb)}]}
js = json.dumps(g, separators=(',', ':')).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
while len(binb) % 4: binb.append(0)
open(dst, 'wb').write(struct.pack('<III', 0x46546c67, 2, 28 + len(js) + len(binb)) + struct.pack('<II', len(js), 0x4e4f534a) + js + struct.pack('<II', len(binb), 0x004e4942) + binb)
print("tris", tot, "bytes", 28 + len(js) + len(binb))
