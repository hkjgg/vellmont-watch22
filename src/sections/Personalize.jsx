import { useState } from "react";
import { useMaterial } from "../context/MaterialContext";

const MAX_LEN = 12;

export default function Personalize() {
  const [engraving, setEngraving] = useState("A.V.");
  const { strapMode, setStrapMode } = useMaterial();

  return (
    <section id="personalize" className="section personalize">
      <div className="personalize__grid">
        <div className="personalize__intro reveal">
          <p className="eyebrow">06 — Customization</p>
          <h2>Personalize Your Obscura.</h2>
          <p>
            Every case back can be hand-engraved with your initials or a
            private message — a mark of the piece being yours alone.
          </p>

          <label className="personalize__field">
            <span>Case Back Engraving</span>
            <input
              type="text"
              value={engraving}
              maxLength={MAX_LEN}
              placeholder="YOUR INITIALS"
              onChange={(e) => setEngraving(e.target.value.toUpperCase())}
            />
            <span className="personalize__counter">
              {engraving.length}/{MAX_LEN}
            </span>
          </label>

          <div className="personalize__strap-toggle">
            <span className="personalize__field-label">Strap</span>
            <div className="personalize__toggle-group" role="group" aria-label="Strap material">
              <button
                type="button"
                className={strapMode === "steel" ? "is-active" : ""}
                onClick={() => setStrapMode("steel")}
              >
                Steel Bracelet
              </button>
              <button
                type="button"
                className={strapMode === "leather" ? "is-active" : ""}
                onClick={() => setStrapMode("leather")}
              >
                Leather
              </button>
            </div>
          </div>
        </div>

        <div className="personalize__preview reveal">
          <div className="engraving-plate">
            <div className="engraving-plate__ring" />
            <span className="engraving-plate__text">{engraving || "YOUR MARK"}</span>
          </div>
          <p className="personalize__preview-caption">Case back preview</p>
        </div>
      </div>
    </section>
  );
}
