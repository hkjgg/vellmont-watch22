import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, ContactShadows } from "@react-three/drei";
import WatchModel from "./WatchModel";
import Lighting from "./Lighting";
import { useScene } from "../context/SceneContext";

export default function CanvasStage() {
  const { cameraRef } = useScene();

  return (
    <div className="canvas-stage" aria-hidden="true">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#0a0a0b"]} />
        <fog attach="fog" args={["#0a0a0b", 6, 14]} />
        <PerspectiveCamera ref={cameraRef} makeDefault fov={32} position={[0, 0, 6]} />
        <Lighting />
        <Suspense fallback={null}>
          <WatchModel />
          <ContactShadows
            position={[0, -1.35, 0]}
            opacity={0.45}
            scale={10}
            blur={2.6}
            far={3}
            color="#000000"
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
