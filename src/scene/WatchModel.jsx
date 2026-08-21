import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useScene } from "../context/SceneContext";

const MODEL_URL = "/models/watch.glb";
const BASE_TILT_X = 0.15;

export default function WatchModel() {
  const { scene } = useGLTF(MODEL_URL);
  const { watchGroupRef, markReady } = useScene();
  const innerRef = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handlePointerMove = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    markReady();
  }, [scene, markReady]);

  useFrame(() => {
    if (innerRef.current) {
      innerRef.current.rotation.x +=
        (BASE_TILT_X + pointer.current.y * 0.12 - innerRef.current.rotation.x) * 0.04;
      innerRef.current.rotation.z +=
        (-pointer.current.x * 0.08 - innerRef.current.rotation.z) * 0.04;
    }
  });

  return (
    <group ref={watchGroupRef} dispose={null}>
      <group ref={innerRef} rotation={[0.15, 0, 0]} scale={0.95}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

useGLTF.preload(MODEL_URL);
