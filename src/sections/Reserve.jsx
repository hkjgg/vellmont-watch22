import { useState } from "react";

export default function Reserve() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <section id="reserve" className="section reserve">
      <div className="reserve__content">
        <p className="eyebrow reveal">04 — Reserve</p>
        <h2 className="reveal">Reserve the Meridian.</h2>
        <p className="reveal">
          Limited to 500 pieces per year. Join the list to be notified when
          your allocation opens.
        </p>
        {submitted ? (
          <p className="reveal reserve__thanks">
            Thank you — you're on the list. We'll be in touch.
          </p>
        ) : (
          <form className="reserve__form reveal" onSubmit={handleSubmit}>
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email address"
            />
            <button type="submit">Request Access</button>
          </form>
        )}
      </div>
    </section>
  );
}
