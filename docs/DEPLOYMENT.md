# Deployment

## Static hosting

Deploy the repository root: the root `index.html` is the version-choice page and links to `v6/`. (Deploying `v6/` alone also works, you then land directly on the site.) Any static host works. For Vercel, `vercel.json`
sets a one-week cache on `.glb`, `.webp`, `.png`, `.jpg` and `.woff2` files:

```json
{ "source": "/(.*)\\.(glb|webp|png|jpg|woff2)",
  "headers": [{ "key": "Cache-Control", "value": "public, max-age=604800" }] }
```

To publish only the current version, point the host at `v6/` directly.

## Local preview

```bash
cd v6 && python3 -m http.server 8000
```

## Single-file build

Some hosts and sandboxes only accept text files. `tools/build_single.py`
inlines the CSS and every script into one HTML file and stores the models as
base64 `.txt` files (loaded when `window.GLB_SUFFIX` is set):

```bash
python3 v6/tools/build_single.py dist
```

Output:

```
dist/
├── portfolio-v6.html
├── assets/
└── models/*.glb.txt
```

The output folder is created if needed. Serve `dist/` over HTTP like any other site.

## External dependencies at runtime

- cdnjs (anime.js 3.2.1), unpkg (Lenis 1.1.14), Google Fonts.
- With no network the fonts fall back to system fonts, and the libraries need to be vendored locally.

## Checklist before publishing

- Replace the CV PDF if needed and check `PROFILE` in `data.js`.
- Test in French and English, with sound on and off.
- Test the flight skip, the map jump and the return to the airport.
- Test on a phone in landscape (touch pad) and on a browser without WebGL2 (classic fallback).
