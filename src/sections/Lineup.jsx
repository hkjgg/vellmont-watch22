import { useMaterial } from "../context/MaterialContext";
import { useScene } from "../context/SceneContext";
import { lighten, darken } from "../utils/color";

export default function Lineup() {
  const { presets, materialIndex } = useMaterial();
  const { galleryFocusFnRef } = useScene();

  // Same camera-focus/dim behavior as clicking a watch directly in the 3D
  // array below — ModelGallery registers this function once it mounts,
  // and it already calls setMaterialIndex internally.
  const selectModel = (i) => {
    galleryFocusFnRef.current?.(i);
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
      <div className="lineup__bg-type" aria-hidden="true">
        <span>VELLMONT</span>
      </div>
      <div className="lineup__intro reveal">
        <p className="eyebrow">10 — Select Model</p>
        <h2>Choose Your Meridian.</h2>
      </div>

      <div className="lineup__grid reveal-stagger" data-cursor-zone="select">
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
