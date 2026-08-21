import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useScene } from "../context/SceneContext";

gsap.registerPlugin(ScrollTrigger);

// One keyframe per major section: [rotationY, position{x,y,z}, scale, fov]
const KEYFRAMES = [
  { rotY: 0, x: 0, y: 0.1, z: 0, scale: 1, fov: 32 }, // Hero — dial facing camera
  { rotY: Math.PI * 0.28, x: -2.2, y: 0.15, z: -0.2, scale: 0.95, fov: 30 }, // Heritage — 3/4 view, right
  { rotY: -Math.PI * 0.32, x: 2.3, y: -0.1, z: -0.15, scale: 1.05, fov: 28 }, // Craftsmanship — 3/4 view, left
  { rotY: Math.PI * 0.4, x: -2.2, y: 0.1, z: -0.2, scale: 0.95, fov: 30 }, // Specs — 3/4 view, right
  { rotY: Math.PI * 0.15, x: 1.9, y: -0.05, z: -0.9, scale: 0.65, fov: 34 }, // Reserve — small, off to the side
];

export function useScrollChoreography(contentRef) {
  const { watchGroupRef, cameraRef, onReady } = useScene();

  useEffect(() => {
    let ctx;

    onReady(() => {
      const group = watchGroupRef.current;
      const camera = cameraRef.current;
      if (!group || !camera || !contentRef.current) return;

      ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: contentRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          },
        });

        KEYFRAMES.forEach((kf, i) => {
          const pos = i;
          tl.to(
            group.rotation,
            { y: kf.rotY, duration: 1, ease: "none" },
            pos
          )
            .to(
              group.position,
              { x: kf.x, y: kf.y, z: kf.z, duration: 1, ease: "none" },
              pos
            )
            .to(group.scale, { x: kf.scale, y: kf.scale, z: kf.scale, duration: 1, ease: "none" }, pos)
            .to(camera, { fov: kf.fov, duration: 1, ease: "none", onUpdate: () => camera.updateProjectionMatrix() }, pos);
        });

        // Section reveal + parallax for text panels
        gsap.utils.toArray(".reveal").forEach((el) => {
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: 60 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 82%",
                end: "top 40%",
                scrub: false,
                toggleActions: "play none none reverse",
              },
            }
          );
        });

        gsap.utils.toArray(".reveal-stagger").forEach((group) => {
          const items = group.querySelectorAll(".reveal-item");
          gsap.fromTo(
            items,
            { autoAlpha: 0, y: 40 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.12,
              ease: "power3.out",
              scrollTrigger: {
                trigger: group,
                start: "top 78%",
                toggleActions: "play none none reverse",
              },
            }
          );
        });

        // Hero entrance
        gsap.fromTo(
          ".hero-title .word",
          { yPercent: 120 },
          { yPercent: 0, duration: 1.2, ease: "power4.out", stagger: 0.08, delay: 0.3 }
        );
        gsap.fromTo(
          ".hero-sub, .hero-scroll-cue",
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, duration: 1, ease: "power2.out", delay: 1 }
        );
      });
    });

    return () => {
      if (ctx) ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentRef]);
}
