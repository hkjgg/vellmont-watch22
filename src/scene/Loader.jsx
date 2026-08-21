import { useProgress } from "@react-three/drei";
import { useScene } from "../context/SceneContext";

export default function Loader() {
  const { progress, active } = useProgress();
  const { canvasPainted } = useScene();
  const showLoader = active || !canvasPainted;

  return (
    <div className={`loader ${showLoader ? "" : "loader--hidden"}`}>
      <div className="loader__mark">VELLMONT</div>
      <div className="loader__bar">
        <div className="loader__fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="loader__pct">{Math.round(progress)}%</div>
    </div>
  );
}
