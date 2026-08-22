import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { useScene } from "../context/SceneContext";
import { useMaterial, MATERIAL_PRESETS } from "../context/MaterialContext";
import { upgradeMaterial } from "../utils/materials";

const MODEL_URL = "/models/watch.glb";
const GALLERY_SPACING = 1.7;
const GALLERY_SCALE = 0.62;

const GROUP_MATCH = {
  CaseMetal: "case",
  StrapMetal: "case",
  DialBlack: "dial",
  MarkerWhite: "hands",
  GoldAccent: "accent",
};
const UPGRADE_NAMES = new Set(["CaseMetal", "StrapMetal", "Crystal", "DialBlack"]);

// Deep-clones the shared watch scene and bakes one preset's colors in
// permanently — unlike the single shared WatchModel instance (whose
// materials are tweened live by the global material picker), each gallery
// clone always shows its own variation, side by side, so the four can be
// compared directly. Independently applies the same physical-material
// upgrade WatchModel does (rather than relying on cloning an
// already-upgraded source) since this can run before or after WatchModel's
// own upgrade effect — both read from the same cached useGLTF() scene.
function buildInstance(sourceScene, preset) {
  const clone = sourceScene.clone(true);
  const upgradedByName = new Map();
  clone.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const sourceName = child.material.name;
    let mat;
    if (UPGRADE_NAMES.has(sourceName)) {
      if (!upgradedByName.has(sourceName)) {
        const upgraded = upgradeMaterial(child.material);
        upgraded.transparent = true;
        upgradedByName.set(sourceName, upgraded);
      }
      mat = upgradedByName.get(sourceName);
    } else {
      mat = child.material.clone();
      mat.transparent = true;
    }
    child.material = mat;
    const groupKey = GROUP_MATCH[mat.name];
    const target = groupKey && preset[groupKey];
    if (!target) return;
    mat.color = new THREE.Color(target.color);
    mat.metalness = target.metalness;
    mat.roughness = target.roughness;
    mat.emissive = new THREE.Color(target.emissive);
    mat.emissiveIntensity = target.emissiveIntensity;
  });
  return clone;
}

export default function ModelGallery() {
  const { scene } = useGLTF(MODEL_URL);
  const { galleryGroupRef, galleryInstanceRefs, galleryFocusFnRef, cameraRef } = useScene();
  const { setMaterialIndex } = useMaterial();

  const instances = useMemo(
    () => MATERIAL_PRESETS.map((preset) => ({ preset, object: buildInstance(scene, preset) })),
    [scene]
  );

  // Reset any per-instance dim/highlight state when the gallery is rebuilt
  // (effectively only on mount, since `instances` is stable thereafter).
  useEffect(() => {
    return () => {
      galleryInstanceRefs.current = {};
    };
  }, [galleryInstanceRefs]);

  const focusOn = (index) => {
    const camera = cameraRef.current;
    if (!camera) return;

    // Shift the site's accent tone toward this model's own swatch — the
    // "select a model, the theme follows it" touch. A dedicated variable
    // (rather than the existing --gold/--gold-bright) so this never fights
    // the light/dark theme scrub that already drives those continuously.
    const swatch = new THREE.Color(MATERIAL_PRESETS[index].swatch);
    const proxy = { t: 0 };
    const fromVar = getComputedStyle(document.documentElement).getPropertyValue("--model-accent").trim();
    const from = fromVar ? new THREE.Color(fromVar) : swatch;
    gsap.to(proxy, {
      t: 1,
      duration: 0.9,
      ease: "power2.inOut",
      onUpdate: () => {
        const r = Math.round((from.r + (swatch.r - from.r) * proxy.t) * 255);
        const g = Math.round((from.g + (swatch.g - from.g) * proxy.t) * 255);
        const b = Math.round((from.b + (swatch.b - from.b) * proxy.t) * 255);
        document.documentElement.style.setProperty("--model-accent", `rgb(${r}, ${g}, ${b})`);
      },
    });

    setMaterialIndex(index);
    const targetX = (index - (MATERIAL_PRESETS.length - 1) / 2) * GALLERY_SPACING * 0.4;
    gsap.to(camera.position, { x: targetX, duration: 1.1, ease: "power3.inOut" });
    gsap.to(camera, {
      fov: 24,
      duration: 1.1,
      ease: "power3.inOut",
      onUpdate: () => camera.updateProjectionMatrix(),
    });

    Object.entries(galleryInstanceRefs.current).forEach(([id, obj]) => {
      if (!obj) return;
      const isSelected = id === MATERIAL_PRESETS[index].id;
      gsap.to(obj.scale, {
        x: GALLERY_SCALE * (isSelected ? 1.12 : 1),
        y: GALLERY_SCALE * (isSelected ? 1.12 : 1),
        z: GALLERY_SCALE * (isSelected ? 1.12 : 1),
        duration: 0.7,
        ease: "power2.out",
      });
      obj.traverse((child) => {
        // Crystal keeps its own intentional glass-like alpha regardless of
        // focus state — dimming/undimming it here would fight that.
        if (!child.isMesh || child.material?.name === "Crystal") return;
        gsap.to(child.material, { opacity: isSelected ? 1 : 0.35, duration: 0.7, ease: "power2.out" });
      });
    });
  };

  useEffect(() => {
    galleryFocusFnRef.current = focusOn;
  });

  return (
    <group ref={galleryGroupRef} scale={0}>
      {instances.map(({ preset, object }, i) => (
        <primitive
          key={preset.id}
          ref={(el) => {
            galleryInstanceRefs.current[preset.id] = el;
          }}
          object={object}
          position={[(i - (MATERIAL_PRESETS.length - 1) / 2) * GALLERY_SPACING, 0, 0]}
          scale={GALLERY_SCALE}
          onClick={(e) => {
            e.stopPropagation();
            focusOn(i);
          }}
          onPointerOver={() => {
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "auto";
          }}
        />
      ))}
    </group>
  );
}

useGLTF.preload(MODEL_URL);
