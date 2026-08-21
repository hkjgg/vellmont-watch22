import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useScene } from "../context/SceneContext";

// Procedurally generated studio lighting environment (no network/texture
// dependency) so fully metallic materials show reflections instead of
// rendering flat black.
export default function StudioEnvironment() {
  const { gl, scene } = useThree();
  const { setEnvironmentReady } = useScene();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmrem.dispose();
    setEnvironmentReady(true);
    return () => {
      envTexture.dispose();
      scene.environment = null;
    };
  }, [gl, scene, setEnvironmentReady]);

  return null;
}
