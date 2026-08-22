import { createContext, useContext, useMemo, useRef, useState } from "react";

const SceneContext = createContext(null);

const MOVEMENT_LAYER_NAMES = ["Baseplate", "Weight", "Barrel", "Mainplate", "Tourbillon", "Dial"];

export function SceneProvider({ children }) {
  const watchGroupRef = useRef(null);
  const innerGroupRef = useRef(null);
  const cameraRef = useRef(null);
  const readyRef = useRef(false);
  const callbacksRef = useRef([]);

  // Populated by WatchModel once the GLTF loads: { Baseplate, Weight, Barrel, Mainplate, Tourbillon, Dial }
  const movementNodesRef = useRef({});
  // Rest (assembled) local position for each movement layer, captured at load time.
  const movementRestZRef = useRef({});
  // Materials to recolor on material swap / fade during explode.
  const caseMaterialsRef = useRef([]);
  // Strap materials — recolored independently (steel matches the case
  // preset, leather is a fixed appearance) but still faded during explode.
  const strapMaterialsRef = useRef([]);
  const crystalMaterialRef = useRef(null);
  // The dial disc's own material — separate from the case, since an x-ray
  // "see through to the gears" cutaway needs the dial (which sits directly
  // in front of the movement stack) to go translucent too, not just the
  // outer case shell. Hands/markers are separate opaque meshes parented to
  // this same node and stay solid on top, like an open-worked dial.
  const dialMaterialRef = useRef(null);
  // The case-back's own material — separate from the shared case material
  // (see build_watch_glb.py) so Personalize.jsx can drop a live-generated
  // engraving canvas texture onto it via .map without that texture
  // appearing on the rest of the case shell.
  const caseBackMaterialRef = useRef(null);
  // Hands (hour/minute) and accent (markers + second hand + center pin) —
  // the other two material groups a watch variation preset drives, matched
  // by glTF material name ("MarkerWhite"/"GoldAccent") rather than mesh
  // name lists, since both are shared across several meshes.
  const handMaterialsRef = useRef([]);
  const accentMaterialsRef = useRef([]);
  // Bracelet link + clasp nodes: { name -> { node, rest: {x,y,z} } }. Rest
  // position is captured at load time so the assembly explode can fan each
  // one outward on X/Z (relative to its own resting spot) and cleanly
  // reset it afterward, the same pattern movementRestZRef uses.
  const strapNodesRef = useRef({});
  // Thin additive-blended highlight mesh swept across the crystal during
  // the Macro Zoom dial stage.
  const crystalGlareRef = useRef(null);

  // 3D presentation box (Gift Atelier unboxing scene): outer group scales
  // in/out, lid group hinges open/closed.
  const boxGroupRef = useRef(null);
  const boxLidRef = useRef(null);

  // Model Selection gallery (Lineup section): outer group scales in/out
  // opposite the main watch, instanceRefs holds each of the 4 permanently-
  // colored clones keyed by preset id for click-to-focus.
  const galleryGroupRef = useRef(null);
  const galleryInstanceRefs = useRef({});
  // Imperative focus-on-index function, set by ModelGallery once mounted —
  // lets the DOM card buttons in Lineup.jsx trigger the exact same
  // camera-focus/dim behavior as clicking a watch directly in 3D.
  const galleryFocusFnRef = useRef(null);

  // DOM label elements for the exploded-assembly section, keyed by layer name,
  // and a flag so the per-frame projection loop only runs while that section is in view.
  const assemblyLabelRefs = useRef({});
  const assemblyActiveRef = useRef(false);
  const assemblyExplodeRef = useRef(0);

  // True while the scroll position sits inside a section whose 3D framing
  // is exactly choreographed (assembly, mechanical heart, macro zoom,
  // unboxing) — the idle 360° drift in WatchModel pauses during these so it
  // never rotates the watch off the precise angle those scenes depend on.
  const precisionFramingRef = useRef(false);

  // 0 → 1 intensity for the Mechanical Heart particle swirl, driven by scroll.
  const particleEnergyRef = useRef(0);

  // True once the canvas has actually painted a handful of frames — distinct
  // from "resources downloaded", which drei's useProgress reports much
  // earlier than shader compilation / first paint actually complete.
  const [canvasPainted, setCanvasPainted] = useState(false);
  // True once the studio environment (PMREM) has been generated — metallic
  // materials render nearly black/blown-out until this is ready, so frame
  // counting for canvasPainted should only start once this is true.
  const [environmentReady, setEnvironmentReady] = useState(false);
  // Whether the depth-of-field post-processing pass is currently mounted —
  // scoped to near Mechanical Heart/Macro Zoom (see PostFXGate) rather than
  // running for the whole page, since an always-on EffectComposer pass is
  // expensive enough on slow/software-rendered GPUs to noticeably delay
  // canvasPainted itself.
  const [dofEnabled, setDofEnabled] = useState(false);

  const onReady = (cb) => {
    if (readyRef.current) cb();
    else callbacksRef.current.push(cb);
  };

  const markReady = () => {
    readyRef.current = true;
    callbacksRef.current.forEach((cb) => cb());
    callbacksRef.current = [];
  };

  const value = useMemo(
    () => ({
      watchGroupRef,
      innerGroupRef,
      cameraRef,
      movementNodesRef,
      movementRestZRef,
      caseMaterialsRef,
      strapMaterialsRef,
      crystalMaterialRef,
      dialMaterialRef,
      caseBackMaterialRef,
      handMaterialsRef,
      accentMaterialsRef,
      strapNodesRef,
      crystalGlareRef,
      boxGroupRef,
      boxLidRef,
      galleryGroupRef,
      galleryInstanceRefs,
      galleryFocusFnRef,
      assemblyLabelRefs,
      assemblyActiveRef,
      assemblyExplodeRef,
      precisionFramingRef,
      particleEnergyRef,
      canvasPainted,
      setCanvasPainted,
      environmentReady,
      setEnvironmentReady,
      dofEnabled,
      setDofEnabled,
      onReady,
      markReady,
      MOVEMENT_LAYER_NAMES,
    }),
    // Refs/functions are stable identities from useRef/closures over them;
    // only these booleans ever actually change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canvasPainted, environmentReady, dofEnabled]
  );

  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>;
}

export function useScene() {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error("useScene must be used within SceneProvider");
  return ctx;
}
