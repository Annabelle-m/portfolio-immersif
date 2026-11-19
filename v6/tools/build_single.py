"""Construit la version publiable en un seul fichier : python3 tools/build_single.py <dossier_sortie>"""
import re, os, sys, base64, shutil
V = os.path.join(os.path.dirname(__file__), ".."); S = sys.argv[1]
os.makedirs(S + "/models", exist_ok=True); shutil.copytree(V + "/assets", S + "/assets", dirs_exist_ok=True)
for f in os.listdir(V + "/models"):
    if f.endswith(".glb"): open(S + "/models/" + f + ".txt", "w").write(base64.b64encode(open(V + "/models/" + f, "rb").read()).decode())
h = open(V + "/index.html").read()
h = h.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + open(V + "/css/style.css").read() + '\n</style>\n<script>window.GLB_SUFFIX=".txt";</script>')
h = re.sub(r'<script src="(js/[^"]+)"></script>', lambda m: '<script>\n' + open(V + "/" + m.group(1)).read().replace("</script", "<\\/script") + '\n</script>', h)
open(S + "/portfolio-v6.html", "w").write(h); print(len(h))
