const FEATURES = [
  {
    title: "Automatic Movement",
    copy: "A 27-jewel self-winding caliber, regulated across six positions for chronometric precision.",
  },
  {
    title: "Sapphire Crystal",
    copy: "Domed, anti-reflective sapphire — nine times harder than steel, virtually scratchproof.",
  },
  {
    title: "Ceramic Bezel",
    copy: "High-tech ceramic fired at 1,400°C, fade-resistant and cool to the touch.",
  },
  {
    title: "100M Water Resistance",
    copy: "Triple-sealed crown and case back rated to 100 meters, tested to twice the standard.",
  },
];

export default function Craftsmanship() {
  return (
    <section id="craftsmanship" className="section panel panel--left">
      <div className="panel__text">
        <p className="eyebrow reveal">02 — Craftsmanship</p>
        <h2 className="reveal">Precision, Down to the Micron.</h2>
        <div className="feature-grid reveal-stagger">
          {FEATURES.map((f) => (
            <div className="feature-card reveal-item" key={f.title}>
              <h3>{f.title}</h3>
              <p>{f.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
