import { createContext, useContext, useRef, useState } from "react";

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
  const crystalMaterialRef = useRef(null);

  // DOM label elements for the exploded-assembly section, keyed by layer name,
  // and a flag so the per-frame projection loop only runs while that section is in view.
  const assemblyLabelRefs = useRef({});
  const assemblyActiveRef = useRef(false);
  const assemblyExplodeRef = useRef(0);

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

  return (
    <SceneContext.Provider
      value={{
        watchGroupRef,
        innerGroupRef,
        cameraRef,
        movementNodesRef,
        movementRestZRef,
        caseMaterialsRef,
        crystalMaterialRef,
        assemblyLabelRefs,
        assemblyActiveRef,
        assemblyExplodeRef,
        particleEnergyRef,
        canvasPainted,
        setCanvasPainted,
        environmentReady,
        setEnvironmentReady,
        onReady,
        markReady,
        MOVEMENT_LAYER_NAMES,
      }}
    >
      {children}
    </SceneContext.Provider>
  );
}

export function useScene() {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error("useScene must be used within SceneProvider");
  return ctx;
}
