# VELLMONT — The Art of Time

A 3D luxury watch marketing site for the fictional brand **VELLMONT**, built with React, Vite, Three.js (via react-three-fiber), and GSAP ScrollTrigger.

A single watch model floats in a fixed 3D canvas behind the page. As you scroll, GSAP drives its rotation, position, scale, and camera FOV in sync with each content section, while the page's text panels reveal alongside it.

## Stack

- **React 19 + Vite** — app shell and dev tooling
- **Three.js** via **@react-three/fiber** and **@react-three/drei** — 3D rendering, GLTF loading, contact shadow
- **GSAP + ScrollTrigger** — scroll-driven camera/model choreography and reveal animations
- **`public/models/watch.glb`** — a stylized watch model (case, bezel, sapphire crystal, dial, hands, crown, lugs, link bracelet) built procedurally from primitives with `trimesh` — see `scripts/build_watch_glb.py`

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
  scene/            3D layer: CanvasStage, WatchModel (GLTF), Lighting, Loader
  sections/         Page sections: Navbar, Hero, Heritage, Craftsmanship, Specs, Reserve, Footer
  hooks/            useScrollChoreography — the GSAP ScrollTrigger timeline
  context/          SceneContext — shares the watch group / camera refs between the 3D layer and the scroll hook
public/
  models/watch.glb  The 3D watch asset
scripts/
  build_watch_glb.py  Regenerates public/models/watch.glb
```

## Regenerating the watch model

```bash
pip install trimesh pygltflib numpy
python3 scripts/build_watch_glb.py
```

## Deploying

This is a static Vite app — `npm run build` produces a `dist/` folder that can be deployed to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages, etc.) with zero server-side requirements.
