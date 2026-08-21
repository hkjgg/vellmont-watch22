export default function Lighting() {
  return (
    <>
      <ambientLight intensity={0.18} color="#e8dfc8" />
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.1}
        color="#fff6e0"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-3, 1, 3]} intensity={0.8} color="#c9a668" distance={12} />
    </>
  );
}
