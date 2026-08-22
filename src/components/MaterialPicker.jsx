import { useMaterial } from "../context/MaterialContext";

// Persistent floating picker — unlike the Hero-only SwapControl dial, this
// stays available across the whole page so the active variation can be
// changed mid-scroll and the choreographed sections (explode, x-ray,
// macro) pick it up seamlessly since they all read off the same shared
// material refs.
export default function MaterialPicker() {
  const { presets, materialIndex, setMaterialIndex } = useMaterial();
  const active = presets[materialIndex];

  return (
    <div className="material-picker" role="group" aria-label="Watch material variation">
      <div className="material-picker__swatches">
        {presets.map((preset, i) => (
          <button
            key={preset.id}
            type="button"
            className={`material-picker__swatch ${i === materialIndex ? "is-active" : ""}`}
            style={{ "--swatch-color": preset.swatch }}
            onClick={() => setMaterialIndex(i)}
            aria-label={preset.name}
            aria-pressed={i === materialIndex}
          />
        ))}
      </div>
      <span className="material-picker__name">{active.name}</span>
    </div>
  );
}
