const STAGES = [
  {
    id: "macro-dial",
    eyebrow: "04 — Detail",
    title: "ELEGANT CONTOURS",
    copy: "Every curve of the dial is polished by hand, catching light differently with each degree of the wrist.",
    image: "/assets/macro/dial.jpg",
  },
  {
    id: "macro-case",
    eyebrow: "04 — Detail",
    title: "SLIM PROFILE",
    copy: "A 7.4mm case, faceted and brushed in eleven separate passes before a single component goes inside.",
    image: "/assets/macro/case.jpg",
  },
  {
    id: "macro-strap",
    eyebrow: "04 — Detail",
    title: "BRACELET",
    copy: "Five-link construction, each link hand-polished and fitted with a concealed butterfly clasp.",
    image: "/assets/macro/strap.jpg",
  },
];

export default function MacroZoom() {
  return (
    <section id="macro" className="section macro-zoom">
      {STAGES.map((stage) => (
        <div key={stage.id} id={stage.id} className="macro-zoom__stage">
          <div
            className="macro-zoom__backdrop"
            style={{ backgroundImage: `url(${stage.image})` }}
          />
          <div className="macro-zoom__text">
            <p className="eyebrow reveal">{stage.eyebrow}</p>
            <h2 className="macro-zoom__title reveal">{stage.title}</h2>
            <p className="reveal">{stage.copy}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
