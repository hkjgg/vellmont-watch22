import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScene } from "../context/SceneContext";

const worldPos = new THREE.Vector3();

export default function AssemblyLabelSync() {
  const { movementNodesRef, cameraRef, assemblyLabelRefs, assemblyActiveRef, assemblyExplodeRef } = useScene();

  useFrame(({ size }) => {
    const camera = cameraRef.current;
    if (!camera) return;
    const active = assemblyActiveRef.current;
    const opacity = active ? Math.min(1, assemblyExplodeRef.current * 1.6) : 0;

    Object.entries(movementNodesRef.current).forEach(([name, node]) => {
      const label = assemblyLabelRefs.current[name];
      if (!node || !label) return;
      label.style.opacity = String(opacity);
      if (!active) return;
      node.getWorldPosition(worldPos);
      worldPos.project(camera);
      const x = (worldPos.x * 0.5 + 0.5) * size.width;
      const y = (-worldPos.y * 0.5 + 0.5) * size.height;
      // Top-center anchor: the dot (first child) lands exactly on the
      // part's projected position; leader and text hang downward below it,
      // so each label reads cleanly below its component.
      label.style.transform = `translate(-50%, 0%) translate(${x}px, ${y}px)`;
    });
  });

  return null;
}
