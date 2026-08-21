import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScene } from "../context/SceneContext";

const COUNT = 2200;

export default function Particles() {
  const { particleEnergyRef } = useScene();
  const pointsRef = useRef(null);

  const { positions, base, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const base = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
      const radius = 1.5 + Math.random() * 2.1;
      const theta = Math.random() * Math.PI * 2;
      const flatten = 0.35 + Math.random() * 0.65;
      const phi = Math.acos(THREE.MathUtils.lerp(-1, 1, Math.random())) * flatten;
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
      const z = radius * Math.cos(phi);
      base[i * 3] = x;
      base[i * 3 + 1] = y;
      base[i * 3 + 2] = z;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      seeds[i * 4] = Math.random() * Math.PI * 2;
      seeds[i * 4 + 1] = 0.4 + Math.random() * 1.1;
      seeds[i * 4 + 2] = 0.15 + Math.random() * 0.35;
      seeds[i * 4 + 3] = Math.random();
    }
    return { positions, base, seeds };
  }, []);

  const colorA = useMemo(() => new THREE.Color("#c9a668"), []);
  const colorB = useMemo(() => new THREE.Color("#f2ece1"), []);
  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.05,
        sizeAttenuation: true,
        color: colorA,
        transparent: true,
        opacity: 0,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [colorA]
  );

  useFrame((state) => {
    const energy = particleEnergyRef.current;
    material.opacity = energy;
    if (energy < 0.01 || !pointsRef.current) return;

    const t = state.clock.elapsedTime;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const amp = 0.35 * energy;

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      const phase = seeds[i * 4];
      const speed = seeds[i * 4 + 1];
      const swirlAmp = seeds[i * 4 + 2];
      const bx = base[i3];
      const by = base[i3 + 1];
      const bz = base[i3 + 2];
      const angle = t * speed * 0.5 + phase;

      const swirl = Math.sin(angle) * swirlAmp * energy;
      posAttr.array[i3] = bx + Math.cos(angle) * swirl - by * swirl * 0.4;
      posAttr.array[i3 + 1] = by + Math.sin(angle * 1.3) * amp * 0.5;
      posAttr.array[i3 + 2] = bz + Math.sin(angle * 0.7) * swirl + bx * swirl * 0.3;
    }
    posAttr.needsUpdate = true;
    material.color.lerpColors(colorA, colorB, (Math.sin(t * 0.3) + 1) / 2);
  });

  return (
    <points ref={pointsRef} material={material}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
    </points>
  );
}
