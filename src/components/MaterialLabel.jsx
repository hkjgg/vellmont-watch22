import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useMaterial } from "../context/MaterialContext";

export default function MaterialLabel({ className = "" }) {
  const { presets, materialIndex } = useMaterial();
  const textRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!textRef.current) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    gsap.fromTo(
      textRef.current,
      { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }
    );
  }, [materialIndex]);

  return (
    <div className={`material-label ${className}`}>
      <span className="material-label__index">
        {String(materialIndex + 1).padStart(2, "0")} / {String(presets.length).padStart(2, "0")}
      </span>
      <span ref={textRef} className="material-label__name">
        {presets[materialIndex].name}
      </span>
    </div>
  );
}
