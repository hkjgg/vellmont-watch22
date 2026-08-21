import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useScene } from "../context/SceneContext";

// Builds a small "photo studio" scene — an enclosing room plus three bright
// softbox panels (key / fill / rim) — that PMREMGenerator captures into a
// convolved environment map. This is what gives fully metallic materials
// their directional highlights and color-graded reflections instead of a
// flat, uniform shine; a plain neutral room reads as much less "hyper-real".
// Fully procedural (no network/texture dependency).
function buildStudioScene() {
  const group = new THREE.Scene();

  const room = new THREE.Mesh(
    new THREE.BoxGeometry(16, 16, 16),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.12, 0.12, 0.13), side: THREE.BackSide })
  );
  group.add(room);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(7, 48),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.22, 0.21, 0.19) })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -4;
  group.add(floor);

  const softbox = (width, height, color, intensity, position, lookAtTarget) => {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
    mesh.position.set(...position);
    mesh.lookAt(...lookAtTarget);
    group.add(mesh);
    return mesh;
  };

  // Key light — large, warm-white, upper front-right.
  softbox(6, 8, "#fff4e0", 5.5, [6, 3, 5], [0, 0, 0]);
  // Fill light — cooler, dimmer, opposite side.
  softbox(5, 6, "#dce8ff", 2.2, [-6, 0.5, 3], [0, 0, 0]);
  // Rim light — small, warm gold, behind/above for edge highlights.
  softbox(3, 3, "#ffcf8a", 6, [-1, 5, -6], [0, 0, 0]);
  // Low top light — broad soft fill from directly above.
  softbox(7, 7, "#ffffff", 1.6, [0, 7.9, 0], [0, 0, 0]);

  return group;
}

export default function StudioEnvironment() {
  const { gl, scene } = useThree();
  const { setEnvironmentReady } = useScene();
  const studioScene = useMemo(() => buildStudioScene(), []);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileCubemapShader();
    const envTexture = pmrem.fromScene(studioScene, 0.035).texture;
    scene.environment = envTexture;
    pmrem.dispose();
    setEnvironmentReady(true);
    return () => {
      envTexture.dispose();
      scene.environment = null;
    };
  }, [gl, scene, studioScene, setEnvironmentReady]);

  return null;
}
