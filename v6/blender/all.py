# Reconstruit tous les modèles d'un coup.
import runpy, os
D = os.path.expanduser("~/dev/portfolio-v4/blender/")
for f in ("rider.py", "kit_buildings.py", "kit_nature.py", "kit_landmarks.py"):
    runpy.run_path(D + f, run_name="__main__")
print("ALL_DONE")
