// Purely decorative — the real, accessible "VELLMONT" control is the
// navbar logo link (kept visually transparent once this docks over it,
// see Navbar.jsx / index.css). Position/scale are driven entirely by
// useSectionAnimations' setupCinematicTitle: large and centered on Hero,
// it shrinks and migrates to sit exactly over the navbar logo's slot as
// you scroll past it, then stays there — subtly swelling again during the
// faded, reading-focused sections later in the page.
export default function CinematicTitle() {
  return (
    <div className="cinematic-title" id="cinematicTitle" aria-hidden="true">
      VELLMONT
    </div>
  );
}
