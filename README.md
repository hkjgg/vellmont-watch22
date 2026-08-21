# VELLMONT — The Art of Time

A 3D luxury watch marketing site for the fictional brand **VELLMONT**, built with React, Vite, Three.js (via react-three-fiber), and GSAP ScrollTrigger.

A single watch model floats in a fixed 3D canvas behind the page. Scroll drives it through five acts:

1. **Hero** — light canvas, giant background typography, and a floating "SWAP" control that cycles the case material (Silver Steel / Deep Black / Pure Gold / Rose Gold) on click or drag.
2. **Anatomy** — the watch rotates to a side profile and its six movement layers (Dial, Tourbillon, Mainplate, Barrel, Baseplate, Weight) explode apart along the case's thickness axis, each with a screen-space-projected label.
3. **Mechanical Heart** — the page switches to a dark theme, the camera pushes in on the exposed movement, and a swirling gold/white particle system builds around it.
4. **Detail** — the watch reassembles and the camera cinematically dollies through three macro framings (dial, case profile, bracelet), each with a matching macro-texture backdrop and synced typography.
5. **Select Model** — a four-material lineup grid; clicking a card sets that material and smooth-scrolls back to the Hero in full 3D.

## Stack

- **React 19 + Vite** — app shell and dev tooling
- **Three.js** via **@react-three/fiber** and **@react-three/drei** — 3D rendering, GLTF loading, contact shadow
- **GSAP + ScrollTrigger** — scroll-driven camera/model choreography and reveal animations
- **`public/models/watch.glb`** — a material-swappable, exploded-assembly-ready watch model built procedurally from primitives with `trimesh` — see `scripts/build_watch_glb.py`. Node names are load-bearing: the app looks up `Case`/`Bezel`/`Crown`/`Lug_0..3`/`StrapTop`/`StrapBottom`/`CaseBack` (share one `CaseMetal` material, recolored at runtime) and `Dial`/`Tourbillon`/`Mainplate`/`Barrel`/`Baseplate`/`Weight` (independent top-level nodes, animated for the exploded view) by exact name.
- **`public/assets/macro/*.jpg`** — abstract macro-photography-style placeholder textures (case/dial/movement/strap), generated with Pillow — see `scripts/build_macro_placeholders.py`.
- **`public/assets/ambient/*.mp4`** — short ambient loop placeholders generated procedurally with ffmpeg (no external footage) — see the `ffmpeg -f lavfi ... gradients=...` commands in git history, or regenerate with any similar procedural source.

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build      # production build to dist/
npm run preview    # serve the production build locally
```

## Project structure

```
src/
  scene/            3D layer: CanvasStage, WatchModel (GLTF + material swap),
                     Lighting, StudioEnvironment (procedural PMREM so metals
                     aren't flat black), Particles, AssemblyLabelSync,
                     PaintSignal (first-frames-rendered signal), Loader
  sections/         Hero, Assembly, MechanicalHeart, MacroZoom, Lineup,
                     Navbar, Footer
  components/       SwapControl, MaterialLabel, HeroBgType
  hooks/            useSectionAnimations — the master GSAP ScrollTrigger
                     choreography for every section
  context/          SceneContext (watch/camera refs, movement-node refs,
                     readiness signals) and MaterialContext (the 4 material
                     presets + active index)
public/
  models/watch.glb        The 3D watch asset
  assets/macro/*.jpg       Macro backdrop placeholders
  assets/ambient/*.mp4     Ambient video placeholders
scripts/
  build_watch_glb.py           Regenerates public/models/watch.glb
  build_macro_placeholders.py  Regenerates public/assets/macro/*.jpg
```

## Regenerating assets

```bash
# Watch model (needs a CSG backend + shapely for the tourbillon geometry)
pip install trimesh pygltflib numpy manifold3d shapely
python3 scripts/build_watch_glb.py

# Macro placeholder textures
pip install pillow
python3 scripts/build_macro_placeholders.py

# Ambient placeholder videos (any procedural ffmpeg source works; example)
ffmpeg -y -f lavfi -i "gradients=size=960x540:duration=8:speed=0.015:nb_colors=4:c0=0x1a1208:c1=0x000000:c2=0x3d2a10:c3=0x0c0805" \
  -vf "noise=alls=6:allf=t+u,vignette=PI/4,gblur=sigma=1.2,format=yuv420p" \
  -c:v libx264 -crf 26 -movflags +faststart -an -r 24 public/assets/ambient/atelier.mp4
```

## Notes on the 3D setup

- **No environment map → flat black metal.** `StudioEnvironment` generates a procedural PMREM (via three's `RoomEnvironment`, no network/texture dependency) so `metalness: 1` materials render as real metal instead of near-black — physically-based metals need reflected environment light for their diffuse/specular response.
- **Camera transform must be set declaratively.** `<PerspectiveCamera position={...} fov={...}>` — not an imperative `useEffect` keyed on the ref object, since a ref's `.current` can still be `null` on that effect's first run, silently no-opping and leaving the camera at Three.js's raw defaults.
- **One-time entrance animations are pure CSS**, not GSAP. GSAP's ticker is `requestAnimationFrame`-driven and can be starved by a expensive, continuously-rendering Canvas (e.g. on a slow/software-rendered GPU) long enough that a timeline never advances past its first frame. Scroll-linked `ScrollTrigger` animations are unaffected (they're driven by native scroll events, not the ticker), but the Hero's load-in reveal is deliberately CSS `@keyframes` so it can't get stuck invisible.
- **The loading screen waits for a real rendered frame**, not just resource download. `useProgress()` reports "loaded" as soon as the GLTF finishes fetching — well before shader compilation and the environment PMREM are ready — so `PaintSignal` additionally counts a few real frames post-environment-setup before the loader hides.

## Deploying

This is a static Vite app — `npm run build` produces a `dist/` folder that can be deployed to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages, etc.) with zero server-side requirements.
