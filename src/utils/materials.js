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
// material.clone()-then-mutate-type, which can't change class) so this is
// safe to call independently from both WatchModel (the shared, live-tweened
// instance) and ModelGallery (its own permanently-colored clones) with no
// ordering dependency between the two.
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
  } else if (material.name === "Crystal") {
    phys.clearcoat = 1;
    phys.clearcoatRoughness = 0.04;
    phys.reflectivity = 0.9;
  } else if (material.name === "DialBlack") {
    phys.roughnessMap = getSunrayTexture();
    phys.roughness = Math.max(material.roughness, 0.32);
  }

  return phys;
}
