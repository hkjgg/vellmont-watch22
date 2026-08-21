import { useRef } from "react";
import { useMaterial } from "../context/MaterialContext";

const DRAG_THRESHOLD = 45;

export default function SwapControl() {
  const { cycleMaterial } = useMaterial();
  const dragState = useRef(null);
  const didDragRef = useRef(false);

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, lastStepX: e.clientX };
    didDragRef.current = false;
  };

  const handlePointerMove = (e) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.lastStepX;
    if (Math.abs(dx) >= DRAG_THRESHOLD) {
      cycleMaterial(dx > 0 ? 1 : -1);
      dragState.current.lastStepX = e.clientX;
      didDragRef.current = true;
    }
  };

  const handlePointerUp = () => {
    dragState.current = null;
  };

  const handleClick = () => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    cycleMaterial(1);
  };

  return (
    <button
      type="button"
      className="swap-control"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
      aria-label="Cycle case material"
    >
      <svg className="swap-control__ring" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="47" />
        <path id="swapRingPath" d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" fill="none" />
        <text>
          <textPath href="#swapRingPath" startOffset="0%">
            &#8226; DRAG OR CLICK TO SWAP &#8226; DRAG OR CLICK TO SWAP
          </textPath>
        </text>
      </svg>
      <span className="swap-control__label">SWAP</span>
    </button>
  );
}
