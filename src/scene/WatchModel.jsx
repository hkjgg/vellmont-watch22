import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { useScene } from "../context/SceneContext";
import { useMaterial, LEATHER_PRESET } from "../context/MaterialContext";
import Particles from "./Particles";

const MODEL_URL = "/models/watch.glb";
const BASE_TILT_X = 0.15;

const CASE_ONLY_NAMES = ["Case", "Bezel", "Crown", "Lug_0", "Lug_1", "Lug_2", "Lug_3", "CaseBack"];
const STRAP_NAMES = ["StrapTop", "StrapBottom"];
const SHELL_NAMES = [...CASE_ONLY_NAMES, ...STRAP_NAMES];

export default function WatchModel() {
  const { scene } = useGLTF(MODEL_URL);
  const {
    watchGroupRef,
    innerGroupRef,
    markReady,
    movementNodesRef,
    movementRestZRef,
    caseMaterialsRef,
    strapMaterialsRef,
    crystalMaterialRef,
    MOVEMENT_LAYER_NAMES,
  } = useScene();
  const { presets, materialIndex, strapMode } = useMaterial();
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
    const caseMaterials = new Set();
    const strapMaterials = new Set();
    let crystalMaterial = null;

    scene.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      if (SHELL_NAMES.includes(child.name) && child.material) {
        child.material.transparent = true;
        if (STRAP_NAMES.includes(child.name)) strapMaterials.add(child.material);
        else caseMaterials.add(child.material);
      }
      if (child.name === "Crystal" && child.material) {
        child.material.transparent = true;
        crystalMaterial = child.material;
      }
    });

    caseMaterialsRef.current = Array.from(caseMaterials);
    strapMaterialsRef.current = Array.from(strapMaterials);
    crystalMaterialRef.current = crystalMaterial;

    const nodes = {};
    const restZ = {};
    MOVEMENT_LAYER_NAMES.forEach((name) => {
      const node = scene.getObjectByName(name);
      if (node) {
        nodes[name] = node;
        restZ[name] = node.position.z;
      }
    });
    movementNodesRef.current = nodes;
    movementRestZRef.current = restZ;

    markReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  // Tween the shared case material(s) to the active preset whenever it changes.
  useEffect(() => {
    const preset = presets[materialIndex];
    const targetColor = new THREE.Color(preset.color);
    caseMaterialsRef.current.forEach((mat) => {
      gsap.to(mat.color, { r: targetColor.r, g: targetColor.g, b: targetColor.b, duration: 0.9, ease: "power2.inOut" });
      gsap.to(mat, { metalness: preset.metalness, roughness: preset.roughness, duration: 0.9, ease: "power2.inOut" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialIndex]);

  // Strap follows the case preset in "steel" mode, or a fixed leather look
  // in "leather" mode — independent material, same tween pattern.
  useEffect(() => {
    const preset = strapMode === "leather" ? LEATHER_PRESET : presets[materialIndex];
    const targetColor = new THREE.Color(preset.color);
    strapMaterialsRef.current.forEach((mat) => {
      gsap.to(mat.color, { r: targetColor.r, g: targetColor.g, b: targetColor.b, duration: 0.9, ease: "power2.inOut" });
      gsap.to(mat, { metalness: preset.metalness, roughness: preset.roughness, duration: 0.9, ease: "power2.inOut" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialIndex, strapMode]);

  useFrame(() => {
    if (innerGroupRef.current) {
      innerGroupRef.current.rotation.x +=
        (BASE_TILT_X + pointer.current.y * 0.1 - innerGroupRef.current.rotation.x) * 0.04;
      innerGroupRef.current.rotation.z +=
        (-pointer.current.x * 0.06 - innerGroupRef.current.rotation.z) * 0.04;
    }
  });

  return (
    <group ref={watchGroupRef} dispose={null}>
      <group ref={innerGroupRef} rotation={[BASE_TILT_X, 0, 0]} scale={0.95}>
        <primitive object={scene} />
      </group>
      <Particles />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
