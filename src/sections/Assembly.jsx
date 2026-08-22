import { useScene } from "../context/SceneContext";

const LAYERS = [
  { name: "Dial", blurb: "Hand-finished and fitted last — the face of the piece." },
  { name: "Tourbillon", blurb: "A rotating cage that cancels gravity's pull on the escapement." },
  { name: "Mainplate", blurb: "The load-bearing plate that anchors the entire gear train." },
  { name: "Barrel", blurb: "Houses the mainspring — the coiled source of stored power." },
  { name: "Baseplate", blurb: "The structural foundation every other component is built on." },
  { name: "Weight", blurb: "An oscillating rotor that winds the mainspring as you move." },
];

export default function Assembly() {
  const { assemblyLabelRefs } = useScene();

  return (
    <section id="assembly" className="section assembly">
      <div className="assembly__intro reveal">
        <p className="eyebrow">02 — Anatomy</p>
        <h2>Six Layers, One Mechanism.</h2>
        <p className="assembly__hint">Scroll to explode the movement.</p>
      </div>

      <div className="assembly__labels" aria-hidden="true">
        {LAYERS.map((layer) => (
          <div
            key={layer.name}
            className="assembly__label"
            ref={(el) => {
              assemblyLabelRefs.current[layer.name] = el;
            }}
          >
            <span className="assembly__label-dot" />
            <span className="assembly__label-leader" />
            <span className="assembly__label-text">{layer.name}</span>
          </div>
        ))}
      </div>

      <ol className="assembly__legend reveal-stagger">
        {LAYERS.map((layer, i) => (
          <li key={layer.name} className="assembly__legend-item reveal-item">
            <span className="assembly__legend-index">{String(i + 1).padStart(2, "0")}</span>
            <span className="assembly__legend-name">{layer.name}</span>
            <span className="assembly__legend-blurb">{layer.blurb}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
