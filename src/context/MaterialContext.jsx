import { createContext, useContext, useMemo, useState } from "react";

// Each preset drives four independently-tweened material groups on the
// watch — case (+ strap, in "steel" mode — see LEATHER_PRESET), dial,
// hands, and accent (hour markers + second hand + center pin). Every group
// always specifies emissive/emissiveIntensity, even at 0, so the tween
// helper in WatchModel.jsx can animate every property uniformly without
// needing to special-case which groups glow — only Stealth Titanium's
// hands/accent actually use a nonzero emissiveIntensity, for the
// luminescent read.
export const MATERIAL_PRESETS = [
  {
    id: "royal-steel",
    name: "Royal Steel",
    swatch: "#c6c9d1",
    case: { color: "#c9cbd2", metalness: 1.0, roughness: 0.24, emissive: "#000000", emissiveIntensity: 0 },
    dial: { color: "#0e1c3d", metalness: 0.4, roughness: 0.38, emissive: "#000000", emissiveIntensity: 0 },
    hands: { color: "#eef1f5", metalness: 0.55, roughness: 0.28, emissive: "#000000", emissiveIntensity: 0 },
    accent: { color: "#c9cbd2", metalness: 0.7, roughness: 0.3, emissive: "#000000", emissiveIntensity: 0 },
  },
  {
    id: "rose-gold-atelier",
    name: "Rose Gold Atelier",
    swatch: "#caa084",
    case: { color: "#caa084", metalness: 1.0, roughness: 0.2, emissive: "#000000", emissiveIntensity: 0 },
    dial: { color: "#efe4d2", metalness: 0.2, roughness: 0.32, emissive: "#000000", emissiveIntensity: 0 },
    hands: { color: "#d9ab8b", metalness: 0.85, roughness: 0.26, emissive: "#000000", emissiveIntensity: 0 },
    accent: { color: "#d9ab8b", metalness: 0.85, roughness: 0.26, emissive: "#000000", emissiveIntensity: 0 },
  },
  {
    id: "stealth-titanium",
    name: "Stealth Titanium",
    swatch: "#2b2d31",
    case: { color: "#2b2d31", metalness: 0.75, roughness: 0.62, emissive: "#000000", emissiveIntensity: 0 },
    dial: { color: "#0a0c10", metalness: 0.3, roughness: 0.55, emissive: "#000000", emissiveIntensity: 0 },
    hands: { color: "#bff7cf", metalness: 0.1, roughness: 0.4, emissive: "#8fe6ac", emissiveIntensity: 0.85 },
    accent: { color: "#bff7cf", metalness: 0.1, roughness: 0.4, emissive: "#8fe6ac", emissiveIntensity: 0.6 },
  },
  {
    id: "obsidian-gold",
    name: "Obsidian Gold",
    swatch: "#141416",
    case: { color: "#101012", metalness: 0.18, roughness: 0.16, emissive: "#000000", emissiveIntensity: 0 },
    dial: { color: "#0c0c0d", metalness: 0.2, roughness: 0.34, emissive: "#000000", emissiveIntensity: 0 },
    hands: { color: "#d8b559", metalness: 1.0, roughness: 0.24, emissive: "#000000", emissiveIntensity: 0 },
    accent: { color: "#d8b559", metalness: 1.0, roughness: 0.22, emissive: "#000000", emissiveIntensity: 0 },
  },
];

// The strap is either "steel" (follows whichever case material is active,
// for a cohesive all-metal look) or "leather" (a fixed leather appearance,
// independent of the case material).
export const LEATHER_PRESET = {
  name: "Leather",
  color: "#4a3225",
  metalness: 0.02,
  roughness: 0.78,
  emissive: "#000000",
  emissiveIntensity: 0,
};

const MaterialContext = createContext(null);

export function MaterialProvider({ children }) {
  const [materialIndex, setMaterialIndex] = useState(0);
  const [strapMode, setStrapMode] = useState("steel");

  const value = useMemo(
    () => ({
      materialIndex,
      setMaterialIndex,
      cycleMaterial: (dir = 1) =>
        setMaterialIndex((i) => (i + dir + MATERIAL_PRESETS.length) % MATERIAL_PRESETS.length),
      presets: MATERIAL_PRESETS,
      strapMode,
      setStrapMode,
    }),
    [materialIndex, strapMode]
  );

  return <MaterialContext.Provider value={value}>{children}</MaterialContext.Provider>;
}

export function useMaterial() {
  const ctx = useContext(MaterialContext);
  if (!ctx) throw new Error("useMaterial must be used within MaterialProvider");
  return ctx;
}
