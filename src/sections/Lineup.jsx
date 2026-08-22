import { useRef } from "react";
import gsap from "gsap";
import * as THREE from "three";
import { useMaterial } from "../context/MaterialContext";
import { lighten, darken } from "../utils/color";

export default function Lineup() {
  const { presets, materialIndex, setMaterialIndex } = useMaterial();
  const accentRef = useRef(null);

  // Tints the giant background typography toward the selected variation's
  // own swatch — a dedicated CSS var (rather than the existing --gold/
  // --gold-bright) so this never fights the light/dark theme scrub that
  // already drives those continuously.
  const selectModel = (i) => {
    const swatch = new THREE.Color(presets[i].swatch);
    const proxy = { t: 0 };
    const root = document.documentElement;
    const fromVar = getComputedStyle(root).getPropertyValue("--model-accent").trim();
    const from = fromVar ? new THREE.Color(fromVar) : swatch;
    if (accentRef.current) accentRef.current.kill();
    accentRef.current = gsap.to(proxy, {
      t: 1,
      duration: 0.9,
      ease: "power2.inOut",
      onUpdate: () => {
        const r = Math.round((from.r + (swatch.r - from.r) * proxy.t) * 255);
        const g = Math.round((from.g + (swatch.g - from.g) * proxy.t) * 255);
        const b = Math.round((from.b + (swatch.b - from.b) * proxy.t) * 255);
        root.style.setProperty("--model-accent", `rgb(${r}, ${g}, ${b})`);
      },
    });
    setMaterialIndex(i);
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
        <p>Four finishes, one silhouette — select a variation to see it live on the piece above.</p>
      </div>

      <div className="lineup__capsules reveal-stagger" data-cursor-zone="select" role="group" aria-label="Watch material variation">
        {presets.map((preset, i) => (
          <button
            key={preset.id}
            type="button"
            className={`lineup__capsule reveal-item ${i === materialIndex ? "is-active" : ""}`}
            onClick={() => selectModel(i)}
            aria-pressed={i === materialIndex}
          >
            <span
              className="lineup__capsule-swatch"
              style={{
                background: `radial-gradient(circle at 35% 30%, ${lighten(preset.swatch)}, ${preset.swatch} 55%, ${darken(preset.swatch)} 100%)`,
              }}
            />
            <span className="lineup__capsule-name">{preset.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
