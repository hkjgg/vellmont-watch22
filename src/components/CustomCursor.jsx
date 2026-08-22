import { useEffect, useRef } from "react";
import { useScene } from "../context/SceneContext";

const LABELS = { swap: "SWAP", select: "SELECT MODEL" };

// A single rAF-driven follower replaces the native pointer everywhere (see
// index.css's `cursor: none`) — position is lerped for a smooth, slightly
// trailing feel, and the zone (swap / select / generic hover / default dot)
// is resolved once per frame via elementFromPoint + data-cursor-zone
// attributes on the two special hit areas (Hero's swap zone, Lineup's
// gallery), rather than wiring pointerenter/leave handlers into every
// interactive component individually.
function resolveZone(el) {
  if (!el) return null;
  const zoneEl = el.closest("[data-cursor-zone]");
  if (zoneEl) return zoneEl.dataset.cursorZone;
  if (el.closest("a, button, [role='button']")) return "hover";
  return null;
}

export default function CustomCursor() {
  const { cursorZoneRef } = useScene();
  const dotRef = useRef(null);
  const textRef = useRef(null);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });
  const lastZone = useRef(undefined);
  const visible = useRef(false);

  useEffect(() => {
    const handleMove = (e) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      if (!visible.current) {
        visible.current = true;
        pos.current.x = e.clientX;
        pos.current.y = e.clientY;
      }
    };
    const handleLeaveDoc = () => {
      visible.current = false;
      if (dotRef.current) dotRef.current.style.opacity = "0";
    };
    window.addEventListener("pointermove", handleMove);
    document.addEventListener("mouseleave", handleLeaveDoc);

    let raf;
    const tick = () => {
      const el = dotRef.current;
      if (el && visible.current) {
        pos.current.x += (target.current.x - pos.current.x) * 0.22;
        pos.current.y += (target.current.y - pos.current.y) * 0.22;
        el.style.opacity = "1";
        el.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;

        const zone = resolveZone(document.elementFromPoint(target.current.x, target.current.y));
        cursorZoneRef.current = zone;
        if (zone !== lastZone.current) {
          lastZone.current = zone;
          if (zone) el.dataset.zone = zone;
          else delete el.dataset.zone;
          if (textRef.current) textRef.current.textContent = LABELS[zone] || "";
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("mouseleave", handleLeaveDoc);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="custom-cursor" ref={dotRef} aria-hidden="true">
      <span className="custom-cursor__text" ref={textRef} />
    </div>
  );
}
