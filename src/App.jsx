import { useRef } from "react";
import { SceneProvider } from "./context/SceneContext";
import { useScrollChoreography } from "./hooks/useScrollChoreography";
import CanvasStage from "./scene/CanvasStage";
import Loader from "./scene/Loader";
import Navbar from "./sections/Navbar";
import Hero from "./sections/Hero";
import Heritage from "./sections/Heritage";
import Craftsmanship from "./sections/Craftsmanship";
import Specs from "./sections/Specs";
import Reserve from "./sections/Reserve";
import Footer from "./sections/Footer";

function AppContent() {
  const contentRef = useRef(null);
  useScrollChoreography(contentRef);

  return (
    <>
      <Loader />
      <CanvasStage />
      <Navbar />
      <main ref={contentRef} className="content">
        <Hero />
        <Heritage />
        <Craftsmanship />
        <Specs />
        <Reserve />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <SceneProvider>
      <AppContent />
    </SceneProvider>
  );
}
