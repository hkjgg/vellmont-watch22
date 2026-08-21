import { useMaterial } from "../context/MaterialContext";

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
            key={preset.name}
            type="button"
            className={`lineup__card reveal-item ${i === materialIndex ? "lineup__card--active" : ""}`}
            onClick={() => selectModel(i)}
          >
            <span
              className="lineup__swatch"
              style={{
                background: `radial-gradient(circle at 35% 30%, ${lighten(preset.color)}, ${preset.color} 55%, ${darken(preset.color)} 100%)`,
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

function lighten(hex) {
  return adjust(hex, 60);
}
function darken(hex) {
  return adjust(hex, -60);
}
function adjust(hex, amt) {
  const num = parseInt(hex.slice(1), 16);
  const r = clamp((num >> 16) + amt);
  const g = clamp(((num >> 8) & 0xff) + amt);
  const b = clamp((num & 0xff) + amt);
  return `rgb(${r}, ${g}, ${b})`;
}
function clamp(v) {
  return Math.max(0, Math.min(255, v));
}
