const SPECS = [
  ["Model", "The Meridian Collection"],
  ["Case Diameter", "41mm"],
  ["Case Material", "316L Stainless Steel / 18k Gold PVD"],
  ["Movement", "VM-27 Automatic, 27 Jewels"],
  ["Power Reserve", "70 Hours"],
  ["Water Resistance", "100m / 10 ATM"],
  ["Crystal", "Domed Sapphire, Anti-Reflective"],
  ["Strap", "Five-Link Bracelet, Butterfly Clasp"],
];

export default function Specs() {
  return (
    <section id="specs" className="section panel panel--right">
      <div className="panel__text">
        <p className="eyebrow reveal">03 — The Meridian</p>
        <h2 className="reveal">Specifications</h2>
        <dl className="specs-list reveal-stagger">
          {SPECS.map(([label, value]) => (
            <div className="specs-list__row reveal-item" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
