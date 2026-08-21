import { useRef } from "react";
import { SceneProvider } from "./context/SceneContext";
import { MaterialProvider } from "./context/MaterialContext";
import { useSectionAnimations } from "./hooks/useSectionAnimations";
import CanvasStage from "./scene/CanvasStage";
import Loader from "./scene/Loader";
import HeroBgType from "./components/HeroBgType";
import Navbar from "./sections/Navbar";
import Hero from "./sections/Hero";
import Assembly from "./sections/Assembly";
import MechanicalHeart from "./sections/MechanicalHeart";
import MacroZoom from "./sections/MacroZoom";
import Lineup from "./sections/Lineup";
import Footer from "./sections/Footer";

function AppContent() {
  const contentRef = useRef(null);
  useSectionAnimations(contentRef);

  return (
    <>
      <Loader />
      <HeroBgType />
      <CanvasStage />
      <Navbar />
      <main ref={contentRef} className="content">
        <Hero />
        <Assembly />
        <MechanicalHeart />
        <MacroZoom />
        <Lineup />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <SceneProvider>
      <MaterialProvider>
        <AppContent />
      </MaterialProvider>
    </SceneProvider>
  );
}
