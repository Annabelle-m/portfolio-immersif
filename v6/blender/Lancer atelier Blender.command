#!/bin/bash
# Atelier Blender du portfolio v4 : lance en arrière-plan (sans fenêtre) les scripts déposés par Claude.
# Ton Blender ouvert n'est jamais touché. Ferme cette fenêtre pour arrêter.
B="/Applications/Blender.app/Contents/MacOS/Blender"
D="$HOME/dev/portfolio-v4/blender"
mkdir -p "$D/queue" "$D/logs"
echo "Atelier Blender v4 prêt. Laisse cette fenêtre ouverte (tu peux la réduire)."
while true; do
  if [ -f "$D/queue/job.txt" ]; then
    job=$(tr -d '\r\n ' < "$D/queue/job.txt"); rm -f "$D/queue/job.txt"
    echo "$(date +%H:%M:%S) -> $job"
    "$B" -b --factory-startup --python-exit-code 1 -P "$D/$job" > "$D/logs/$job.log" 2>&1
    echo $? > "$D/logs/$job.exit"; echo "$(date +%H:%M:%S) termine ($job, code $(cat "$D/logs/$job.exit"))"
  fi
  sleep 2
done
