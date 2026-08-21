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
      strapNodesRef,
      crystalGlareRef,
      boxGroupRef,
      boxLidRef,
      assemblyLabelRefs,
      assemblyActiveRef,
      assemblyExplodeRef,
      precisionFramingRef,
      particleEnergyRef,
      canvasPainted,
      setCanvasPainted,
      environmentReady,
      setEnvironmentReady,
      onReady,
      markReady,
      MOVEMENT_LAYER_NAMES,
    }),
    // Refs/functions are stable identities from useRef/closures over them;
    // only these two booleans ever actually change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canvasPainted, environmentReady]
  );

  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>;
}

export function useScene() {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error("useScene must be used within SceneProvider");
  return ctx;
}
