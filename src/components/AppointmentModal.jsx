import { useEffect, useState } from "react";

const BOUTIQUES = ["Geneva", "Paris", "Beirut"];

export default function AppointmentModal({ open, onClose, defaultBoutique }) {
  const [submitted, setSubmitted] = useState(false);
  const [boutique, setBoutique] = useState(defaultBoutique || BOUTIQUES[0]);

  useEffect(() => {
    if (open) {
      setBoutique(defaultBoutique || BOUTIQUES[0]);
      setSubmitted(false);
    }
  }, [open, defaultBoutique]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {submitted ? (
          <div className="modal__confirm">
            <p className="eyebrow">Request Received</p>
            <h3>We'll Be in Touch.</h3>
            <p>
              Your private appointment request at our {boutique} boutique has
              been received. A specialist will confirm your time within one
              business day.
            </p>
            <button type="button" className="modal__done" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <form className="modal__form" onSubmit={handleSubmit}>
            <p className="eyebrow">Private Appointment</p>
            <h3 id="appointment-modal-title">Book Your Visit.</h3>

            <label>
              <span>Full Name</span>
              <input type="text" required placeholder="Jane Appleseed" />
            </label>
            <label>
              <span>Email</span>
              <input type="email" required placeholder="jane@email.com" />
            </label>
            <div className="modal__row">
              <label>
                <span>Boutique</span>
                <select value={boutique} onChange={(e) => setBoutique(e.target.value)}>
                  {BOUTIQUES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Preferred Date</span>
                <input type="date" />
              </label>
            </div>
            <label>
              <span>Message (optional)</span>
              <textarea rows={3} placeholder="Which piece would you like to see?" />
            </label>

            <button type="submit" className="modal__submit">
              Request Appointment
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
