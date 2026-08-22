import { useEffect, useState } from "react";

const LINKS = [
  { href: "#assembly", label: "Anatomy" },
  { href: "#macro", label: "Detail" },
  { href: "#personalize", label: "Personalize" },
  { href: "#boutique", label: "Boutiques" },
  { href: "#lineup", label: "Select Model" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      {/* Visually transparent — CinematicTitle renders the actual visible
          wordmark and docks precisely over this element once scrolled past
          Hero. This stays as the real, accessible click target and screen
          reader label. */}
      <a href="#hero" id="navbarLogo" className="navbar__logo">
        VELLMONT
      </a>
      <nav className={`navbar__links ${open ? "navbar__links--open" : ""}`}>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
      </nav>
      <button
        className="navbar__toggle"
        aria-label="Toggle navigation"
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
      </button>
    </header>
  );
}
