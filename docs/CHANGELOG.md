# Version history

Only `v6/` is present in this repository. Earlier versions were separate folders.

| Version | Highlights |
| --- | --- |
| v1 | 2D arcade-style scenery on Canvas. |
| v2 | First real-time 3D version (WebGL2), blocking windows, connections hub. |
| v3 | More realistic 3D (procedural materials), shorter roads, smoother riding, return to the home page through the hall. |
| v4 | v3 with the rider, scooter and scenery modelled in Blender (`models/*.glb`). |
| v5 | Organic characters, 3D flight and hall, shorter road, large windows, clickable map with parachute jump, scenery fixes. |
| v6 | Sharper scooter and rider, even shorter roads, Paris and Skills scenery fixed, redesigned postcard, orbital map jump, new sound (generative music and ambience). |

## v6.48: map fix and performance

- **Minimap no longer clipped.** The SVG kept an old `border-radius: 50%` from the round map, which crops replaced elements. It is now square on desktop and round only on phones.
- **Adaptive resolution.** The 3D canvas starts at 80% (touch) or 100% (desktop) of its target resolution and drops to as low as 50% if the frame time stays above about 24 ms.
- **60 fps cap.** On 120 Hz screens only every other frame is drawn.
- **Culling.** Road and scenery chunks outside the camera view, or outside the shadow box, are no longer drawn (bounding boxes computed once per chunk).
- **Cheaper shadows.** The PCF sampler uses 8 taps on desktop and 5 on touch devices (was 12). On touch devices the shadow map is 1024 and refreshed every second frame.
- **Cheaper shaders.** Procedural noise uses 3 octaves instead of 4.
- **No antialiasing on touch devices**, no stencil buffer, opaque canvas.
- **No `backdrop-filter` over the 3D view.** Blurring a live WebGL canvas is very expensive. The HUD backgrounds are slightly more opaque instead.
- **Lighter minimap.** The blur and shadow SVG filters are gone, and the speed and minimap DOM updates run at about 15 Hz instead of every frame.
- **Classic page loop** no longer runs while the 3D view is shown.

## v6.49: lighter sky and shaders, cleaner minimap

- **Sky drawn last.** It was a full-screen cloud shader drawn before the scene. It now runs after the scene and only on pixels the scene did not cover (depth test).
- **Noise skipped at a distance.** Procedural material noise is disabled beyond 85 m, where it is invisible but covers most of the screen.
- **Lower default resolution on desktop** (device pixel ratio capped at 1.0) and a more reactive adaptive scale (drops from about 50 fps, down to 40%).
- **Cached visible-chunk set** instead of rebuilding it every frame.
- **Frame counter:** add `?perf` to the URL to show fps, canvas size and the resolution scale.
- **Minimap simplified:** larger monuments, small plates with only the country name and flag, no compass or stamp, more margin so nothing is cut.

### v6.49 (continued)

- **Rider model simplified** from 189 252 to 26 312 triangles (3.7 MB to 0.6 MB). It was drawn twice per frame (scene and shadow) while covering a tiny part of the screen. New tool: `tools/decimate_glb.py`.
- **Scenery chunks split into 48 m cells** (`GLR.meshCells`), so culling removes whatever is out of view or out of the shadow box. Triangles per frame went from about 1.3 million to about 0.7 million.
- Adaptive resolution floor raised to 50 %.

## v6.50: smoother return to the home hall

- **Return animation** (`hallIn`) no longer animates `filter: blur() brightness()` on the whole SVG hall. It uses `transform` on its own GPU layer plus a fading overlay for the light flash.
- **White veil** is lifted only after the first painted frame of the home view, so the heavy first paint is hidden.
- **3D terminal hall** is prepared during the access road instead of at the door (about 20 ms, so now invisible).
- **Return flight:** the ground no longer casts shadows (about half the triangles per frame).
- **Minimap:** removed the extra US flag planted in the Statue of Liberty illustration (the plate already has one).

## v6.51: skip with Space everywhere, lighter terminal

- **Space skips every cutscene**: the intro walk on the home page, the flight, the terminal entrance and the parachute jump from the map (`Esc` and `Enter` work too, except `Enter` during the map jump).
- **`people.glb` simplified** from 103 092 to 11 612 triangles (1.8 MB to 0.2 MB). The six travellers alone cost about 125 000 triangles per pass inside the terminal.
- **No shadow pass inside the terminal.**
- The "Skip" button no longer overlaps the speedometer.

## v6.52: memory (the browser was reloading the page)

Safari and Chrome reload a tab that uses too much memory ("This page was reloaded because it was using significant memory"), which sent the visitor back to the start. Measured memory after loading a world:

| | Before | After |
| --- | --- | --- |
| JavaScript heap | about 185 MB | about 16 MB |
| Sign textures | 226 MB (154 textures) | about 110 MB (89 textures, including the 17 MB shadow map) |
| Geometry buffers | 152 MB | 96 MB |

- **Leak fixed.** Every sign kept a reference to its `Loc`, which holds the whole scenery mesh being built, so about 160 MB of arrays could never be freed. Signs now keep only their matrix.
- **Shared, right-sized sign textures.** Identical signs share one texture, resolution is capped at about 160 px per metre, and the 2D canvas is released right after upload. This also removes the one-second freezes while scenery chunks were built during the first flight.
- **Packed vertices** (24 bytes instead of 44): normals and colours as bytes.
- **Space during the parachute jump.** After clicking a city on the map, that map pin kept the keyboard focus and swallowed Space (it re-triggered a jump). The focus is now released and the pin ignores Space and Esc while flying.

## v6.53: Safari freeze, minimap branches, lamp posts

- **Freeze at the start of the home zoom fixed.** Measured on WebKit (Safari's engine): one frame of about 950 ms when the home hall appeared. The cause was the 33 Gaussian-blur SVG filters in the hall illustration. They are replaced by radial gradients (ceiling glows) and soft strokes (floor light beams), so the look is almost unchanged. Worst frame is now about 40 ms. `tools/gen_hall.py` was updated, and `index.html` regenerated from it. Do not reintroduce SVG `filter` blurs on the hall.
- **Minimap shows the branches to the airport.** Each junction is drawn as a dashed line, in its world's colour, from the ring to the central airport. The scooter follows it when it takes the access road.
- **No more lamp post in the access-road lane.** The airport-side lamps in junction sections were placed without checking the roads (`NET.clear`), so one stood in the branch lane right after the junction.
- **Diagnostics:** `?perf` in the URL shows fps, canvas size and the adaptive resolution scale (green box, top left).
