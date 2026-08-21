import { useState } from "react";
import AppointmentModal from "../components/AppointmentModal";

const BOUTIQUES = [
  { city: "Geneva", address: "12 Quai du Mont-Blanc, 1201 Genève", top: "34%", left: "47%" },
  { city: "Paris", address: "8 Place Vendôme, 75001 Paris", top: "26%", left: "44%" },
  { city: "Beirut", address: "Foch Street, Beirut Central District", top: "44%", left: "58%" },
];

export default function BoutiqueLocator() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCity, setActiveCity] = useState(BOUTIQUES[0].city);
  const [selectedCity, setSelectedCity] = useState(null);

  const openAppointment = (city) => {
    setSelectedCity(city);
    setModalOpen(true);
  };

  return (
    <section id="boutique" className="section boutique">
      <div className="boutique__intro reveal">
        <p className="eyebrow">09 — Boutiques</p>
        <h2>Visit Us in Person.</h2>
        <p>Three flagship boutiques, each offering private viewings by appointment.</p>
        <button type="button" className="boutique__cta" onClick={() => openAppointment(activeCity)}>
          Book a Private Appointment
        </button>
      </div>

      <div className="boutique__map reveal" role="img" aria-label="Stylized map showing VELLMONT boutique locations">
        <div className="boutique__map-grid" />
        {BOUTIQUES.map((b) => (
          <button
            type="button"
            key={b.city}
            className={`boutique__pin ${activeCity === b.city ? "is-active" : ""}`}
            style={{ top: b.top, left: b.left }}
            onClick={() => setActiveCity(b.city)}
            aria-label={`${b.city} boutique`}
          >
            <span className="boutique__pin-dot" />
            <span className="boutique__pin-label">{b.city}</span>
          </button>
        ))}
      </div>

      <div className="boutique__list reveal-stagger">
        {BOUTIQUES.map((b) => (
          <div
            key={b.city}
            className={`boutique__card reveal-item ${activeCity === b.city ? "is-active" : ""}`}
            onMouseEnter={() => setActiveCity(b.city)}
          >
            <h3>{b.city}</h3>
            <p>{b.address}</p>
            <div className="boutique__card-links">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("VELLMONT " + b.city + " boutique " + b.address)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Directions →
              </a>
              <button type="button" onClick={() => openAppointment(b.city)}>
                Book Appointment →
              </button>
            </div>
          </div>
        ))}
      </div>

      <AppointmentModal open={modalOpen} onClose={() => setModalOpen(false)} defaultBoutique={selectedCity} />
    </section>
  );
}
