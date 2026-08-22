import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { EffectComposer, DepthOfField } from "@react-three/postprocessing";
import { useScene } from "../context/SceneContext";

// Camera sits on the Z axis facing the origin throughout the whole page
// (only its distance/fov ever change, never its own x/y or an explicit
// lookAt target), so position.z alone is a good enough stand-in for
// "world-space distance to the watch" — no extra plumbing needed to know
// when we're in a tight macro shot versus the ambient wide framing.
const WIDE_Z = 7.4;
const TIGHT_Z = 4.0;
const MAX_BOKEH = 3.0;

export default function PostFX() {
  const { cameraRef } = useScene();
  const dofRef = useRef(null);

  useFrame(() => {
    const dof = dofRef.current;
    const camera = cameraRef.current;
    if (!dof || !camera) return;

    dof.cocMaterial.focusDistance = camera.position.z;
    dof.cocMaterial.focusRange = 1.1;
    const closeness = (WIDE_Z - camera.position.z) / (WIDE_Z - TIGHT_Z);
    dof.bokehScale = Math.max(0, Math.min(1, closeness)) * MAX_BOKEH;
  });

  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <DepthOfField ref={dofRef} focusDistance={0} focusRange={1.1} bokehScale={0} resolutionScale={0.5} />
    </EffectComposer>
  );
}
