import { memo, useRef } from "react";
import { SceneProvider } from "./context/SceneContext";
import { MaterialProvider } from "./context/MaterialContext";
import { useSectionAnimations } from "./hooks/useSectionAnimations";
import CanvasStageRaw from "./scene/CanvasStage";
import LoaderRaw from "./scene/Loader";
import HeroBgTypeRaw from "./components/HeroBgType";
import NavbarRaw from "./sections/Navbar";
import HeroRaw from "./sections/Hero";
import AssemblyRaw from "./sections/Assembly";
import MechanicalHeartRaw from "./sections/MechanicalHeart";
import MacroZoomRaw from "./sections/MacroZoom";
import SpecificationsRaw from "./sections/Specifications";
import PersonalizeRaw from "./sections/Personalize";
import GiftAtelierRaw from "./sections/GiftAtelier";
import ServicesRaw from "./sections/Services";
import BoutiqueLocatorRaw from "./sections/BoutiqueLocator";
import LineupRaw from "./sections/Lineup";
import FooterRaw from "./sections/Footer";
import MaterialPickerRaw from "./components/MaterialPicker";
import CinematicTitleRaw from "./components/CinematicTitle";
import CustomCursorRaw from "./components/CustomCursor";

// None of these take props, so a parent (AppContent) re-render — triggered
// by unrelated context state elsewhere in the tree (e.g. the loading-signal
// booleans in SceneContext, or a material swap) — should never cascade into
// re-rendering them. Without this, React reconciles their JSX className on
// every such re-render, silently wiping any class an effect (like the
// scroll-reveal IntersectionObserver) added directly to the DOM outside
// React. memo() still lets each one re-render for its OWN state/context.
const CanvasStage = memo(CanvasStageRaw);
const Loader = memo(LoaderRaw);
const HeroBgType = memo(HeroBgTypeRaw);
const Navbar = memo(NavbarRaw);
const Hero = memo(HeroRaw);
const Assembly = memo(AssemblyRaw);
const MechanicalHeart = memo(MechanicalHeartRaw);
const MacroZoom = memo(MacroZoomRaw);
const Specifications = memo(SpecificationsRaw);
const Personalize = memo(PersonalizeRaw);
const GiftAtelier = memo(GiftAtelierRaw);
const Services = memo(ServicesRaw);
const BoutiqueLocator = memo(BoutiqueLocatorRaw);
const Lineup = memo(LineupRaw);
const Footer = memo(FooterRaw);
const MaterialPicker = memo(MaterialPickerRaw);
const CinematicTitle = memo(CinematicTitleRaw);
const CustomCursor = memo(CustomCursorRaw);

function AppContent() {
  const contentRef = useRef(null);
  useSectionAnimations(contentRef);

  return (
    <>
      <Loader />
      <HeroBgType />
      <CanvasStage />
      <Navbar />
      <CinematicTitle />
      <main ref={contentRef} className="content">
        <Hero />
        <Assembly />
        <MechanicalHeart />
        <MacroZoom />
        <Specifications />
        <Personalize />
        <GiftAtelier />
        <Services />
        <BoutiqueLocator />
        <Lineup />
      </main>
      <Footer />
      <MaterialPicker />
      <CustomCursor />
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
