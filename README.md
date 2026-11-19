# Annabelle Megy · Interactive 3D Portfolio

An interactive portfolio built as a trip. You start in an airport hall, pick a
flight on the departures board, fly to a country, then ride a scooter through
3D cities that each hold one part of the CV (about, skills, experience,
projects, contact).

It is written in plain HTML, CSS and JavaScript on top of a small hand-written
WebGL2 engine. There is no framework, no bundler and no build step.

- **Languages:** French and English (switch at runtime).
- **Modes:** immersive 3D, or a classic scrolling page for quick reading.
- **Sound:** generative music and ambience, synthesised with Web Audio (no audio files).
- **Hosting:** any static host. A `vercel.json` is included.

## Choosing a version

The root page (`index.html`) asks how to explore the portfolio and sends visitors to `v6/#immersive` (3D) or `v6/#classic` (readable page). It stores the choice (`am-mode`) and the language (`am-lang`) in `localStorage`. Visitors can switch at any time with the **Classic version** / **Immersive version** button at the top of each version, and the browser's Back button returns to the choice page. Old direct links such as `/#classic` or `/#paris` still work: the root page forwards them to `v6/` unchanged, and extra parameters like `?perf` are preserved. Without WebGL2, the immersive card is dimmed and leads to the classic version.

## Quick start

The 3D models are loaded with `fetch`, so the site must be served over HTTP.
Opening `index.html` from the file system will not work.

```bash
cd v6
python3 -m http.server 8000
# open http://localhost:8000
```

Any static server works (`npx serve`, `php -S`, and so on). The only runtime
requirement is a browser with **WebGL2**. A version without 3D is also
available, see [Classic version](#classic-version).

## How to explore

| Where | What to do |
| --- | --- |
| Home (airport hall) | Pick a flight on the departures board. |
| Cutscenes (intro walk, flight, terminal entrance, map jump) | Press `Space` (or `Esc` / `Enter`) to skip, or click "Skip". |
| Ride | `↑ ↓ ← →` or `W A S D` to drive. Stop at the glowing windows to open an info panel. |
| Fork to the airport | Press `Enter` or `E` when the prompt appears to head back to the central hub. |
| Minimap | Click a city to jump to it (with a parachute). |
| Top bar | Language (`EN`/`FR`), sound on/off, back to the airport. |
| Touch devices | On-screen arrow buttons. Landscape is more comfortable. |

## The five worlds

Each country matches one section of the CV.

| Flight | Country | Section | Cities |
| --- | --- | --- | --- |
| AM 101 | France | About | Paris, Bordeaux |
| AM 202 | United States | Skills | Los Angeles, New York, Las Vegas, Miami |
| AM 303 | Japan | Experience | Tokyo, Kyoto, Osaka, Nara, Sapporo |
| AM 404 | Australia | Projects | Sydney, Melbourne, Brisbane, Gold Coast, Uluru |
| AM 505 | Namibia | Contact | Windhoek, Sossusvlei (postcard) |

## Repository layout

```
.
├── index.html            Landing page: choose the immersive or the classic version
├── vercel.json           Cache headers for static assets
├── docs/                 Project documentation (see below)
├── _dev/                 Throw-away patch scripts used during development
└── v6/                   The current, deployable version of the site
    ├── index.html        Page shell: views, home-hall SVG, script tags
    ├── css/style.css     All styles, themes and responsive rules
    ├── js/               Application code (no modules, loaded in order)
    ├── models/           Binary glTF (.glb) model kits
    ├── assets/           Images and the CV PDF
    ├── tools/            Python generators for models and the hall SVG
    └── blender/          Blender scripts that build the model kits
```

## Documentation

| Document | Contents |
| --- | --- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Views, script load order, rendering engine, ride and flight logic, audio |
| [docs/CONTENT.md](docs/CONTENT.md) | How to edit the text, add a city or a world, and translate |
| [docs/ASSETS.md](docs/ASSETS.md) | The 3D pipeline: SDF tools, Blender scripts, GLB kits, the hall SVG |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Hosting, caching, and the single-file build |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Version history from v1 to v6 |
| [v6/README.md](v6/README.md) | Short guide specific to the v6 folder |

## Classic version

The "Classic version" button (top of the home page) shows the same content as a
regular scrolling page, rendered from the same data. It is also the fallback
when WebGL2 is not available.

## Tech notes

- **Rendering:** custom WebGL2 engine in `v6/js/gl.js` (matrices, mesh builder,
  shadow map, atmospheric sky, fog, textured text signs).
- **Models:** glTF binaries (`.glb`) parsed by hand in `v6/js/models.js`.
  If a model fails to load, procedural scenery takes over.
- **Third-party libraries (CDN):** [anime.js 3.2.1](https://animejs.com/) and
  [Lenis 1.1.14](https://github.com/darkroomengineering/lenis), plus Google Fonts.
- **Tools only (not needed to run the site):** Python 3 with NumPy and
  scikit-image, and Blender.

## Credits

- Design and development: Annabelle Megy.
- The scooter comes from the `scooter_retro` model of the author's Godot project *theCreativeRide*.

## Contact

[GitHub](https://github.com/Annabelle-m) ·
[LinkedIn](https://www.linkedin.com/in/annabelle-megy-515721223/)
