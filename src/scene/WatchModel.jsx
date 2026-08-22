import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { useScene } from "../context/SceneContext";
import { useMaterial, LEATHER_PRESET } from "../context/MaterialContext";
import Particles from "./Particles";

const MODEL_URL = "/models/watch.glb";
const BASE_TILT_X = 0.15;
const IDLE_SPIN_SPEED = 0.075; // rad/sec — a slow, subtle continuous drift
const SPRING_STIFFNESS = 70;
const SPRING_DAMPING = 11;

// Soft radial glow used for the crystal glare sweep — generated once on a
// canvas rather than shipped as an asset, matching how the rest of the
// scene avoids external texture files.
function makeGlareTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.3, "rgba(255,255,255,0.55)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

// Crystal sits flat, facing +Z, centered at z≈0.2 — this plane rides just
// above its surface. useSectionAnimations drives position/rotation/opacity
// directly on the ref during the Macro Zoom dial stage to sweep it across.
function CrystalGlare({ glareRef }) {
  const texture = useMemo(() => makeGlareTexture(), []);
  return (
    <mesh ref={glareRef} position={[-0.5, -0.35, 0.235]} rotation={[0, 0, Math.PI / 4]} scale={[1.8, 0.4, 1]}>
      <planeGeometry args={[0.9, 0.9]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0}
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

const CASE_ONLY_NAMES = ["Case", "Bezel", "Crown", "Lug_0", "Lug_1", "Lug_2", "Lug_3", "CaseBack"];
// Each bracelet link/clasp half is its own node (StrapTop_L0..L10,
// ClaspTop, StrapBottom_L0..L10, ClaspBottom) so it can be exploded
// individually — matched by prefix rather than an exact list.
const isStrapNode = (name) => name.startsWith("StrapTop") || name.startsWith("StrapBottom") || name.startsWith("Clasp");

// Tweens every property a watch variation preset can specify — color,
// metalness, roughness, and emissive/emissiveIntensity (only the Stealth
// Titanium preset's hands/accent groups actually glow, but every preset
// defines these fields so this never has to special-case which groups do).
function tweenMaterialGroup(materials, target, duration = 0.9) {
  const targetColor = new THREE.Color(target.color);
  const targetEmissive = new THREE.Color(target.emissive);
  materials.forEach((mat) => {
    gsap.to(mat.color, { r: targetColor.r, g: targetColor.g, b: targetColor.b, duration, ease: "power2.inOut" });
    gsap.to(mat.emissive, { r: targetEmissive.r, g: targetEmissive.g, b: targetEmissive.b, duration, ease: "power2.inOut" });
    gsap.to(mat, {
      metalness: target.metalness,
      roughness: target.roughness,
      emissiveIntensity: target.emissiveIntensity,
      duration,
      ease: "power2.inOut",
    });
  });
}

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
    dialMaterialRef,
    handMaterialsRef,
    accentMaterialsRef,
    strapNodesRef,
    crystalGlareRef,
    precisionFramingRef,
    MOVEMENT_LAYER_NAMES,
  } = useScene();
  const { presets, materialIndex, strapMode } = useMaterial();
  const pointer = useRef({ x: 0, y: 0 });
  // Velocity state for the spring-damped mouse-follow tilt (critically-damped
  // spring integrated per-frame, rather than a plain exponential lerp, so the
  // watch settles into the pointer target with a touch of natural overshoot).
  const spring = useRef({ vx: 0, vz: 0 });

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
    const handMaterials = new Set();
    const accentMaterials = new Set();
    const strapNodes = {};
    let crystalMaterial = null;
    let dialMaterial = null;

    scene.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      const strapNode = isStrapNode(child.name);
      if ((CASE_ONLY_NAMES.includes(child.name) || strapNode) && child.material) {
        child.material.transparent = true;
        if (strapNode) strapMaterials.add(child.material);
        else caseMaterials.add(child.material);
      }
      if (strapNode) {
        strapNodes[child.name] = { node: child, rest: { x: child.position.x, y: child.position.y, z: child.position.z } };
      }
      if (child.name === "Crystal" && child.material) {
        child.material.transparent = true;
        crystalMaterial = child.material;
      }
      // "Dial" names both the disc mesh and the parent node for its hands/
      // markers (separate, always-opaque meshes) — only the disc itself
      // should ever go translucent, so this checks the exact node name.
      if (child.name === "Dial" && child.material) {
        child.material.transparent = true;
        dialMaterial = child.material;
      }
      // Hands and accents are matched by their shared glTF material name
      // (build_watch_glb.py's "MarkerWhite"/"GoldAccent") rather than a
      // mesh-name list, since each is reused across several meshes.
      if (child.material?.name === "MarkerWhite") handMaterials.add(child.material);
      if (child.material?.name === "GoldAccent") accentMaterials.add(child.material);
    });

    caseMaterialsRef.current = Array.from(caseMaterials);
    strapMaterialsRef.current = Array.from(strapMaterials);
    crystalMaterialRef.current = crystalMaterial;
    dialMaterialRef.current = dialMaterial;
    handMaterialsRef.current = Array.from(handMaterials);
    accentMaterialsRef.current = Array.from(accentMaterials);
    strapNodesRef.current = strapNodes;

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

  // Tween all four material groups (case, dial, hands, accent) to the
  // active variation whenever it changes.
  useEffect(() => {
    const preset = presets[materialIndex];
    tweenMaterialGroup(caseMaterialsRef.current, preset.case);
    if (dialMaterialRef.current) tweenMaterialGroup([dialMaterialRef.current], preset.dial);
    tweenMaterialGroup(handMaterialsRef.current, preset.hands);
    tweenMaterialGroup(accentMaterialsRef.current, preset.accent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialIndex]);

  // Strap follows the case group in "steel" mode, or a fixed leather look
  // in "leather" mode — independent material, same tween helper.
  useEffect(() => {
    const target = strapMode === "leather" ? LEATHER_PRESET : presets[materialIndex].case;
    tweenMaterialGroup(strapMaterialsRef.current, target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialIndex, strapMode]);

  useFrame((_, rawDelta) => {
    const g = innerGroupRef.current;
    if (!g) return;
    // Clamp so a stalled/slow frame can't destabilize the spring integration.
    const dt = Math.min(rawDelta, 0.033);

    // Subtle continuous 360° drift — layered on the inner group so it never
    // fights the scroll-driven rotation the outer group carries per section.
    // Paused during precisely-choreographed sections (assembly, mechanical
    // heart, macro zoom, unboxing) so it can't rotate the dial/case off the
    // exact angle those scenes are staged for.
    if (!precisionFramingRef.current) g.rotation.y += dt * IDLE_SPIN_SPEED;

    // Critically-damped-ish spring toward the pointer target, in place of a
    // plain exponential lerp, for a touch of natural overshoot ("springy").
    const targetX = BASE_TILT_X + pointer.current.y * 0.12;
    const targetZ = -pointer.current.x * 0.09;
    const s = spring.current;

    s.vx += ((targetX - g.rotation.x) * SPRING_STIFFNESS - s.vx * SPRING_DAMPING) * dt;
    g.rotation.x += s.vx * dt;

    s.vz += ((targetZ - g.rotation.z) * SPRING_STIFFNESS - s.vz * SPRING_DAMPING) * dt;
    g.rotation.z += s.vz * dt;

    // The rotor, balance-wheel cage, and mainspring barrel always spin —
    // harmless wherever they're hidden inside an opaque case, and exactly
    // what sells the "alive machinery" read during the Mechanical Heart
    // x-ray cutaway, where the case turns translucent around them.
    const nodes = movementNodesRef.current;
    if (nodes.Weight) nodes.Weight.rotation.z += dt * 0.6;
    if (nodes.Tourbillon) nodes.Tourbillon.rotation.z += dt * 1.4;
    if (nodes.Barrel) nodes.Barrel.rotation.z += dt * 0.35;
  });

  return (
    <group ref={watchGroupRef} dispose={null}>
      <group ref={innerGroupRef} rotation={[BASE_TILT_X, 0, 0]} scale={0.95}>
        <primitive object={scene} />
        <CrystalGlare glareRef={crystalGlareRef} />
      </group>
      <Particles />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
