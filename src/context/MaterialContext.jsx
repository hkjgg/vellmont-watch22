import { createContext, useContext, useMemo, useState } from "react";

export const MATERIAL_PRESETS = [
  { name: "Silver Steel", color: "#c7c8cc", metalness: 1.0, roughness: 0.38 },
  { name: "Deep Black", color: "#1c1d20", metalness: 0.55, roughness: 0.48 },
  { name: "Pure Gold", color: "#d4af6a", metalness: 1.0, roughness: 0.32 },
  { name: "Rose Gold", color: "#caa084", metalness: 1.0, roughness: 0.34 },
];

const MaterialContext = createContext(null);

export function MaterialProvider({ children }) {
  const [materialIndex, setMaterialIndex] = useState(0);

  const value = useMemo(
    () => ({
      materialIndex,
      setMaterialIndex,
      cycleMaterial: (dir = 1) =>
        setMaterialIndex((i) => (i + dir + MATERIAL_PRESETS.length) % MATERIAL_PRESETS.length),
      presets: MATERIAL_PRESETS,
    }),
    [materialIndex]
  );

  return <MaterialContext.Provider value={value}>{children}</MaterialContext.Provider>;
}

export function useMaterial() {
  const ctx = useContext(MaterialContext);
  if (!ctx) throw new Error("useMaterial must be used within MaterialProvider");
  return ctx;
}
