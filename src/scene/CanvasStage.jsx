import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, ContactShadows } from "@react-three/drei";
import WatchModel from "./WatchModel";
import Lighting from "./Lighting";
import AssemblyLabelSync from "./AssemblyLabelSync";
import StudioEnvironment from "./StudioEnvironment";
import PaintSignal from "./PaintSignal";
import PresentationBox from "./PresentationBox";
import ModelGallery from "./ModelGallery";
import PostFX from "./PostFX";
import { useScene } from "../context/SceneContext";

export default function CanvasStage() {
  const { cameraRef, dofEnabled } = useScene();

  return (
    <div className="canvas-stage" id="canvasStage" aria-hidden="true">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <PerspectiveCamera ref={cameraRef} makeDefault fov={28} position={[0, 0, 7]} />
        <Lighting />
        <StudioEnvironment />
        <Suspense fallback={null}>
          <WatchModel />
          <ModelGallery />
          <PaintSignal />
          <ContactShadows
            position={[0, -1.35, 0]}
            opacity={0.3}
            scale={10}
            blur={2.6}
            far={3}
            color="#000000"
          />
        </Suspense>
        <PresentationBox />
        <AssemblyLabelSync />
        {dofEnabled && <PostFX />}
      </Canvas>
    </div>
  );
}
