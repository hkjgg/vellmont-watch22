export default function Lighting() {
  return (
    <>
      <ambientLight intensity={0.45} color="#e8dfc8" />
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.8}
        color="#fff6e0"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-4, 1.5, 2]} intensity={5} color="#c9a668" distance={12} />
      <pointLight position={[3, -2, -3]} intensity={3.5} color="#7fa6c9" distance={12} />
      <pointLight position={[0, 3, -4]} intensity={2.5} color="#ffffff" distance={14} />
      <spotLight
        position={[0, 6, 6]}
        angle={0.35}
        penumbra={0.8}
        intensity={2}
        color="#ffffff"
      />
    </>
  );
}
