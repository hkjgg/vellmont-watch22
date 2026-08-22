import { useMaterial } from "../context/MaterialContext";
import { lighten, darken } from "../utils/color";

export default function Lineup() {
  const { presets, materialIndex, setMaterialIndex } = useMaterial();

  const selectModel = (i) => {
    setMaterialIndex(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section id="lineup" className="section lineup">
      <video
        className="lineup__video"
        src="/assets/ambient/on-the-wrist.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div className="lineup__intro reveal">
        <p className="eyebrow">05 — Select Model</p>
        <h2>Choose Your Meridian.</h2>
      </div>

      <div className="lineup__grid reveal-stagger">
        {presets.map((preset, i) => (
          <button
            key={preset.id}
            type="button"
            className={`lineup__card reveal-item ${i === materialIndex ? "lineup__card--active" : ""}`}
            onClick={() => selectModel(i)}
          >
            <span
              className="lineup__swatch"
              style={{
                background: `radial-gradient(circle at 35% 30%, ${lighten(preset.swatch)}, ${preset.swatch} 55%, ${darken(preset.swatch)} 100%)`,
              }}
            />
            <span className="lineup__card-name">{preset.name}</span>
            <span className="lineup__card-cta">View in 3D →</span>
          </button>
        ))}
      </div>
    </section>
  );
}
