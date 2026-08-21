import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useScene } from "../context/SceneContext";

const FRAMES_BEFORE_READY = 20;

// Signals canvasPainted once the scene has actually rendered a few frames —
// resource loading (tracked by drei's useProgress) finishes well before
// shader compilation and the first real paint, so the loading screen needs
// this separate signal to avoid hiding over a still-blank canvas.
export default function PaintSignal() {
  const { canvasPainted, setCanvasPainted, environmentReady } = useScene();
  const count = useRef(0);

  useFrame(() => {
    if (canvasPainted || !environmentReady) return;
    count.current += 1;
    if (count.current >= FRAMES_BEFORE_READY) setCanvasPainted(true);
  });

  return null;
}
