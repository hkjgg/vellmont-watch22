const SPECS = [
  { label: "Dial", value: "Sunray-brushed black, applied indices", mono: "D" },
  { label: "Bezel", value: "Fixed, polished 316L stainless steel", mono: "B" },
  { label: "Lugs", value: "Integrated, hand-bevelled edges", mono: "L" },
  { label: "Movement", value: "In-house automatic tourbillon, 72h reserve", mono: "M" },
];

export default function Specifications() {
  return (
    <section id="specs" className="section specs">
      <div className="specs__intro reveal">
        <p className="eyebrow">05 — Specification</p>
        <h2>Every Detail, Accounted For.</h2>
      </div>

      <div className="specs__cascade reveal-stagger">
        {SPECS.map((s, i) => (
          <div className="specs__card reveal-item" key={s.label} style={{ "--tilt": `${(i - 1.5) * 4}deg` }}>
            <span className="specs__card-mono">{s.mono}</span>
            <span className="specs__card-label">{s.label}</span>
          </div>
        ))}
      </div>

      <dl className="specs__list reveal-stagger">
        {SPECS.map((s) => (
          <div className="specs__row reveal-item" key={s.label}>
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
