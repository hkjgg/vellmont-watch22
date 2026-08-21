export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <span className="footer__logo">VELLMONT</span>
        <div className="footer__links">
          <a href="#hero">Home</a>
          <a href="#assembly">Anatomy</a>
          <a href="#mechanical-heart">Mechanical Heart</a>
          <a href="#macro">Detail</a>
          <a href="#personalize">Personalize</a>
          <a href="#gift-atelier">Gifting</a>
          <a href="#services">Services</a>
          <a href="#boutique">Boutiques</a>
          <a href="#lineup">Select Model</a>
        </div>
      </div>
      <div className="footer__bottom">
        <span>© {new Date().getFullYear()} VELLMONT. All rights reserved.</span>
        <span>Geneva · Paris · Beirut</span>
      </div>
    </footer>
  );
}
