import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useMaterial } from "../context/MaterialContext";
import { useScene } from "../context/SceneContext";

const MAX_LEN = 12;

// CaseBack's UV is a planar projection of the disc (u,v = (x+1)/2, (y+1)/2 —
// see build_watch_glb.py), so a square canvas maps directly onto it. The
// base tone is light/near-neutral because material.map multiplies against
// material.color — this way the engraving stays correctly tinted whatever
// preset (steel, rose gold, titanium, obsidian) is currently active, rather
// than baking one fixed color into the texture itself.
function makeEngravingTexture(text) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#eaeaee";
  ctx.fillRect(0, 0, size, size);

  // Faint concentric brushed-metal rings so an empty case back still reads
  // as a machined surface rather than a flat gray square.
  ctx.strokeStyle = "rgba(0,0,0,0.05)";
  ctx.lineWidth = 1;
  for (let r = 36; r < size / 2 - 8; r += 16) {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (text) {
    // The case back only turns to face the camera by rotating the whole
    // watch group 180° around Y (see setupPersonalizeReveal) rather than
    // flipping the mesh itself. Between that Y-axis rotation, the mesh's
    // own UV parameterization, and CanvasTexture's default flipY, the net
    // effect the viewer actually sees is a full point rotation of the
    // texture (verified empirically — a plain horizontal-only mirror left
    // every glyph upside down), so a matching 180° pre-rotation here is
    // what cancels it out and makes the text read correctly once the case
    // back is facing the viewer.
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(Math.PI);
    ctx.fillStyle = "#48484d";
    ctx.font = "600 48px Georgia, 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function Personalize() {
  const [engraving, setEngraving] = useState("A.V.");
  const { strapMode, setStrapMode } = useMaterial();
  const { caseBackMaterialRef, onReady } = useScene();
  const textureRef = useRef(null);

  // Bound directly to the case-back mesh's own material — separate from the
  // rest of the case shell (see build_watch_glb.py's CaseBackMetal) — so the
  // engraving shows up live on the 3D model itself, not just this DOM
  // preview card. onReady defers until WatchModel has finished its material
  // setup pass; it fires immediately on every call once that's already true.
  useEffect(() => {
    onReady(() => {
      const material = caseBackMaterialRef.current;
      if (!material) return;
      const prevTexture = textureRef.current;
      const texture = makeEngravingTexture(engraving.trim());
      material.map = texture;
      material.needsUpdate = true;
      textureRef.current = texture;
      if (prevTexture) prevTexture.dispose();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engraving]);

  useEffect(
    () => () => {
      if (textureRef.current) textureRef.current.dispose();
    },
    []
  );

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
