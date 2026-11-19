# Architecture

The site is a static single-page app. Everything lives in `v6/`.

## Views

`index.html` holds every view as a `<section class="view">`. `app.js` switches
between them through the `data-view` attribute on `#app`.

| View | Element | Purpose |
| --- | --- | --- |
| `home` | `#home` | Airport hall (SVG) with the departures board `#board` |
| `flight` | `#flight` | Flight HUD (ticket, progress bar) over the 3D flight canvas |
| `ride` | `#ride` | Driving HUD: location, speedometer, banner, hub, info panel, touch pad |
| `classic` | `#classic` | Plain scrolling version built from the same data |

Two canvases are shared: `#gl` (WebGL2 scene for flight and ride) and `#snow`
(2D overlay for snow in Sapporo).

## Script load order

Scripts are classic (non-module) and share the global scope, so order matters.
It is defined at the bottom of `v6/index.html`:

1. `anime.js` and `Lenis` (CDN)
2. `data.js` content and UI strings
3. `gl.js` engine
4. `world.js` moods, road network, scenery
5. `models.js` GLB loader
6. `rider.js` rider mesh
7. `ride3d.js`, `flight3d.js` the two 3D modes
8. `audio.js` sound
9. `app.js` orchestration (starts everything)

## Modules

### `data.js`: content
Defines three globals: `PROFILE` (identity, links, pitch), `UI` (interface
strings per language) and `WORLDS` (the five countries and their cities).
See [CONTENT.md](CONTENT.md).

### `gl.js`: engine
A small WebGL2 engine written for this project.

- `M4`, `V3`: column-major matrix and vector maths.
- `MAT`: material ids (asphalt, grass, glass, water, leaf, snow, and so on) used by the shader.
- `MB` (mesh builder): boxes, cylinders and other primitives accumulated into one buffer.
- `GLR`: renderer. Context creation (`webgl2`), shadow map (1024 on touch devices, 2048 otherwise), atmospheric sky, fog, textured text panels.

### `world.js`: worlds
- `AMB3`: one lighting mood per city (sky gradient, sun elevation and azimuth, fog range, clouds, ground colours, night and emissive flags).
- `NET`: the road network. A ring road through every world plus spokes to a central hub. Roads are 9 m wide with 4 m pavements, and units are metres.
- `BLD`, `PROP`, `STYLE_*`, `LANDMARK`: procedural buildings, props and monuments, plus the table that maps each city to its style.

### `models.js`: models
Fetches the six `.glb` kits listed in `MODEL_FILES`, parses them in
`parseGLB`, and stores the meshes in `TPL`. `stampM` places a template mesh
into a road segment. Materials whose names match `ALWAYS_LIT` or `NIGHT_LIT`
get emissive treatment. If a file fails to load, the procedural scenery from
`world.js` is used.

### `ride3d.js`: riding
`Ride3D` owns the driving mode.

- Speed model: `VMAX 24`, `ACC 7.5`, `BRAKE 9`, `COAST 1.4`, reverse `-4`, lateral limit `XMAX 3.3`.
- State `P`: path (`ring` or a spoke), arc length `s`, direction, speed, lateral offset, lean and pitch.
- Stops: when the rider reaches a city window the scooter slows, a banner shows, and the info panel opens.
- Exit: a fork leads to the central hub, then into the terminal hall to return home.
- Controls: `↑↓←→` or `WASD`, and on-screen buttons on touch devices.

### `flight3d.js`: flight
`Flight3D` plays a roughly 6 second cutscene: Bordeaux airport, countryside,
a volumetric cloud layer, then the destination monument. It can be skipped
with `Esc`, `Space` or `Enter`. The map jump reuses it with a parachute.

### `audio.js`: sound
`Sound` is fully procedural (Web Audio, no files).

- `SCENE`: per-scene weights for each ambience layer (traffic, crowd, birds, wind, waves, gulls, insects, crickets, sirens).
- `KEY`: musical key, chord set and scale per country. Japan uses a koto-style pluck.
- Starts after the first user gesture (browser autoplay rules) and is toggled by the "Sound" button.

### `app.js`: orchestration
- Language: stored in `localStorage` as `am-lang`. `applyLang()` re-renders everything marked `data-i18n` / `data-i18n-html`.
- Departures board and the hub list built from `WORLDS`.
- Panels (`showPanel`), contact block, postcard form (opens a `mailto:` draft).
- Minimap and map jump (`mmGo`).
- Keyboard and touch input, then the classic version (`buildClassic`).

## Performance

- `GLR.init(canvas, { shadow, aa, taps, shadowEvery })` sets the quality profile. `ride3d.js` picks a light profile on touch devices (`pointer: coarse`).
- `Ride3D` scales the canvas resolution down automatically (`rscale`, minimum 0.5) when the smoothed frame time stays above about 24 ms, and caps rendering at about 60 fps.
- Every chunk stores a bounding box. `GLR.render` skips items outside the camera frustum and outside the shadow box (`outside()` in `gl.js`).
- Memory matters: a browser reloads a tab that uses too much. Do not keep references to the mesh builder (`MB`, `Loc`) after upload, share identical textures, and keep sign textures at about 160 px per metre. Add `?perf` to the URL to log chunk build times.
- Avoid `backdrop-filter` and heavy SVG filters on elements that sit above the 3D canvas.

## Robustness

- No WebGL2: the app falls back to the classic version.
- `localStorage` access is wrapped in `try/catch`.
- Models missing: procedural scenery replaces them.
- Mail links are opened explicitly, since a plain `mailto:` can be blocked inside an iframe.
