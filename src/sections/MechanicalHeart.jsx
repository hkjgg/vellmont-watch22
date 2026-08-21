export default function MechanicalHeart() {
  return (
    <section id="mechanical-heart" className="section mechanical-heart">
      <div className="mechanical-heart__sticky">
        <video
          className="mechanical-heart__video"
          src="/assets/ambient/atelier.mp4"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div className="mechanical-heart__content">
          <p className="eyebrow reveal">03 — Inside</p>
          <h2 className="reveal mechanical-heart__title">MECHANICAL HEART</h2>
          <p className="reveal mechanical-heart__copy">
            27 jewels. 218 components. A single balance wheel beating five
            times a second, regulated by hand until it holds time within
            seconds a day — for a decade, and the decade after.
          </p>
        </div>
      </div>
    </section>
  );
}
