import { useMemo } from "react";
import * as THREE from "three";
import { useScene } from "../context/SceneContext";

// Luxury presentation box for the Gift Atelier unboxing scene. Starts at
// scale 0 (hidden) — useSectionAnimations scales it in, hinges the lid open,
// and nests the watch inside as the user scrolls through #gift-atelier.
export default function PresentationBox() {
  const { boxGroupRef, boxLidRef } = useScene();

  // Lighter, warmer walnut tones than a "realistic" dark wood would use —
  // against the near-black Gift Atelier backdrop, a truly dark wood reads
  // as invisible, so contrast against the theme wins over material realism.
  const woodMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#7a4a28", roughness: 0.36, metalness: 0.12 }),
    []
  );
  const lidMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#8f5a30", roughness: 0.32, metalness: 0.14 }),
    []
  );
  const liningMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#241608", roughness: 0.9, metalness: 0 }),
    []
  );
  const rimMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#c9a668", roughness: 0.28, metalness: 1 }),
    []
  );

  return (
    <group ref={boxGroupRef} position={[0, -0.85, -0.1]} scale={0}>
      {/* base shell */}
      <mesh position={[0, -0.16, 0]} material={woodMat} castShadow receiveShadow>
        <boxGeometry args={[2.3, 0.34, 1.55]} />
      </mesh>
      {/* thin brass trim along the rim */}
      <mesh position={[0, 0.015, 0]} material={rimMat}>
        <boxGeometry args={[2.32, 0.02, 1.57]} />
      </mesh>
      {/* interior cavity lining */}
      <mesh position={[0, 0.005, 0]} material={liningMat} receiveShadow>
        <boxGeometry args={[2.0, 0.3, 1.25]} />
      </mesh>
      {/* soft cushion the watch rests on */}
      <mesh position={[0, 0.09, 0.05]} material={liningMat}>
        <cylinderGeometry args={[0.62, 0.68, 0.14, 40]} />
      </mesh>

      {/* hinged lid, pivoting from the back edge */}
      <group ref={boxLidRef} position={[0, 0.01, -0.775]}>
        <mesh position={[0, 0.06, 0.775]} material={lidMat} castShadow>
          <boxGeometry args={[2.3, 0.12, 1.55]} />
        </mesh>
        <mesh position={[0, 0.125, 0.775]} material={rimMat}>
          <boxGeometry args={[2.32, 0.015, 1.57]} />
        </mesh>
      </group>
    </group>
  );
}
