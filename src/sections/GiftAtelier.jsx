const FEATURES = [
  {
    title: "The Presentation Case",
    copy: "Hand-lacquered walnut, lined in alcantara, closed with a hidden brass latch — built to outlast the box it ships in.",
  },
  {
    title: "Wax-Sealed Gift Card",
    copy: "A private note, pressed in a hand-stamped wax seal bearing the VELLMONT crest, slipped beneath the watch pillow.",
  },
  {
    title: "White-Glove Delivery",
    copy: "Delivered by appointment, in person, by a specialist who walks you through the piece before it ever leaves their hands.",
  },
];

export default function GiftAtelier() {
  return (
    <section id="gift-atelier" className="section gift-atelier">
      <div className="gift-atelier__intro reveal">
        <p className="eyebrow">07 — For Giving</p>
        <h2>The Gift Atelier.</h2>
        <p>A watch is rarely just for oneself. Every order can become a presentation, from case to seal to delivery.</p>
      </div>

      <div className="gift-atelier__showcase reveal">
        <div className="wax-seal">
          <span className="wax-seal__ribbon" />
          <div className="wax-seal__disc">
            <span>V</span>
          </div>
        </div>
      </div>

      <div className="gift-atelier__grid reveal-stagger">
        {FEATURES.map((f, i) => (
          <div className="gift-card reveal-item" key={f.title}>
            <span className="gift-card__index">{String(i + 1).padStart(2, "0")}</span>
            <h3>{f.title}</h3>
            <p>{f.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
