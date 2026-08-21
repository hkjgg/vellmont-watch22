export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <span className="footer__logo">VELLMONT</span>
        <div className="footer__links">
          <a href="#top">Home</a>
          <a href="#heritage">Heritage</a>
          <a href="#craftsmanship">Craftsmanship</a>
          <a href="#specs">The Meridian</a>
          <a href="#reserve">Reserve</a>
        </div>
      </div>
      <div className="footer__bottom">
        <span>© {new Date().getFullYear()} VELLMONT. All rights reserved.</span>
        <span>Geneva · New York · Tokyo</span>
      </div>
    </footer>
  );
}
