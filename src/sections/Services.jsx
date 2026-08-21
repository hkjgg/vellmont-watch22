const SERVICES = [
  {
    title: "5-Year Movement Warranty",
    copy: "Every caliber is covered against manufacturing defects for five years from the day it reaches your wrist, no questions asked.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M24 5 L41 12 V23 C41 34 33.5 41 24 44 C14.5 41 7 34 7 23 V12 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M16 24 L21.5 29.5 L33 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Annual Mechanical Servicing",
    copy: "A complimentary yearly inspection at any boutique — full timing regulation, gasket check, and a hand polish.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="9" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M24 6 V11 M24 37 V42 M42 24 H37 M11 24 H6 M36.5 11.5 L33 15 M15 33 L11.5 36.5 M36.5 36.5 L33 33 M15 15 L11.5 11.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Secure Insured Shipping",
    copy: "Every piece travels in a tamper-evident case, fully insured door-to-door, with real-time tracking from atelier to arrival.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M24 4 L41 11 V22 C41 32.5 34 40 24 44 C14 40 7 32.5 7 22 V11 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M17 23 L24 17 L31 23 M24 17 V32" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Services() {
  return (
    <section id="services" className="section services">
      <div className="services__intro reveal">
        <p className="eyebrow">08 — Ownership</p>
        <h2>VIP Services.</h2>
      </div>
      <div className="services__grid reveal-stagger">
        {SERVICES.map((s) => (
          <div className="service-card reveal-item" key={s.title}>
            <div className="service-card__icon">{s.icon}</div>
            <h3>{s.title}</h3>
            <p>{s.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
