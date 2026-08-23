import * as THREE from "three";

// Procedural "sunray" roughness map for the dial — radial streaks like a
// brushed/guilloché watch face, generated once on a canvas rather than
// shipped as an image asset (matching how the rest of the scene avoids
// external textures).
let sunrayTexture = null;
function getSunrayTexture() {
  if (sunrayTexture) return sunrayTexture;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const cx = size / 2;
  const cy = size / 2;
  ctx.fillStyle = "#8a8a8a";
  ctx.fillRect(0, 0, size, size);
  const spokes = 240;
  for (let i = 0; i < spokes; i++) {
    const angle = (i / spokes) * Math.PI * 2;
    const shade = 100 + Math.round(Math.sin(i * 0.9) * 45 + Math.random() * 18);
    ctx.strokeStyle = `rgb(${shade}, ${shade}, ${shade})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * size, cy + Math.sin(angle) * size);
    ctx.stroke();
  }
  sunrayTexture = new THREE.CanvasTexture(canvas);
  sunrayTexture.wrapS = sunrayTexture.wrapT = THREE.ClampToEdgeWrapping;
  return sunrayTexture;
}

// Upgrades a plain glTF-imported MeshStandardMaterial to MeshPhysicalMaterial
// with a per-group physical treatment layered on top — anisotropy for
// brushed-metal case/strap, clearcoat for the sapphire crystal, a sunray
// roughness map for the dial. Explicit property copying (rather than
// material.clone()-then-mutate-type, which can't change class) keeps this
// safe to call from WatchModel's own setup effect without any ordering
// hazard around when the glTF import's materials become upgradeable.
export function upgradeMaterial(material) {
  const phys = new THREE.MeshPhysicalMaterial({
    name: material.name,
    color: material.color.clone(),
    metalness: material.metalness,
    roughness: material.roughness,
    transparent: material.transparent,
    opacity: material.opacity,
    side: material.side,
    emissive: material.emissive ? material.emissive.clone() : new THREE.Color(0x000000),
    emissiveIntensity: material.emissiveIntensity ?? 0,
  });

  if (material.name === "CaseMetal" || material.name === "StrapMetal" || material.name === "CaseBackMetal") {
    phys.anisotropy = 0.55;
    phys.anisotropyRotation = Math.PI / 2;
    phys.clearcoat = 0.35;
    phys.clearcoatRoughness = 0.15;
    // Boosts how strongly the studio HDRI's reflections read on the metal —
    // the default 1.0 under this rig's environment intensity was landing
    // closer to a flat brushed-plastic look than polished steel/gold.
    phys.envMapIntensity = 1.6;
  } else if (material.name === "Crystal") {
    phys.clearcoat = 1;
    phys.clearcoatRoughness = 0.04;
    phys.reflectivity = 0.9;
    phys.ior = 1.5; // sapphire crystal's real-world index of refraction
    phys.envMapIntensity = 1.3;
    // NOTE: real `transmission` was tried here for physical glass see-
    // through, but it doesn't compose with this material's existing
    // `transparent: true` + animated `.opacity` (used elsewhere to fade the
    // crystal during the Macro Zoom dial reveal and Mechanical Heart's
    // x-ray) — three.js runs transmissive objects through a separate
    // render-to-texture pass that conflicts with standard alpha blending,
    // and stacking both rendered as a muddy opaque disc over the dial
    // instead of clear glass. Clearcoat + reflectivity above already carry
    // the "glass on top of the dial" read without that conflict.
    // A thin-film iridescence layer for the faint blue/violet sheen a real
    // anti-reflective coating catches at a glancing angle — additive on
    // top of clearcoat, no conflict with the opacity animations.
    phys.iridescence = 0.3;
    phys.iridescenceIOR = 1.3;
    phys.iridescenceThicknessRange = [100, 400];
  } else if (material.name === "DialBlack") {
    phys.roughnessMap = getSunrayTexture();
    phys.roughness = Math.max(material.roughness, 0.32);
    phys.envMapIntensity = 1.2;
  }

  return phys;
}
