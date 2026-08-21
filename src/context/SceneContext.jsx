import { createContext, useContext, useRef } from "react";

const SceneContext = createContext(null);

export function SceneProvider({ children }) {
  const watchGroupRef = useRef(null);
  const cameraRef = useRef(null);
  const readyRef = useRef(false);
  const callbacksRef = useRef([]);

  const onReady = (cb) => {
    if (readyRef.current) {
      cb();
    } else {
      callbacksRef.current.push(cb);
    }
  };

  const markReady = () => {
    readyRef.current = true;
    callbacksRef.current.forEach((cb) => cb());
    callbacksRef.current = [];
  };

  return (
    <SceneContext.Provider value={{ watchGroupRef, cameraRef, onReady, markReady }}>
      {children}
    </SceneContext.Provider>
  );
}

export function useScene() {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error("useScene must be used within SceneProvider");
  return ctx;
}
