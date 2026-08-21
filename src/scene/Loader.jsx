import { useProgress } from "@react-three/drei";

export default function Loader() {
  const { progress, active } = useProgress();

  return (
    <div className={`loader ${active ? "" : "loader--hidden"}`}>
      <div className="loader__mark">VELLMONT</div>
      <div className="loader__bar">
        <div className="loader__fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="loader__pct">{Math.round(progress)}%</div>
    </div>
  );
}
