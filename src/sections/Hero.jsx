import SwapControl from "../components/SwapControl";
import MaterialLabel from "../components/MaterialLabel";

export default function Hero() {
  return (
    <section id="hero" className="section hero-v2">
      <p className="eyebrow hero-v2__eyebrow">Swiss-Inspired · Est. 2011</p>

      <div className="hero-v2__swap-zone">
        <SwapControl />
        <MaterialLabel className="hero-v2__material-label" />
      </div>

      <div className="hero-v2__bottom">
        <h1 className="hero-v2__tagline">The Art of Time, Engineered for Legacy.</h1>
        <div className="hero-scroll-cue hero-v2__scroll-cue">
          <span>Scroll to explore</span>
          <div className="hero-scroll-cue__line" />
        </div>
      </div>
    </section>
  );
}
