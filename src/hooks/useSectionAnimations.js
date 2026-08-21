import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useScene } from "../context/SceneContext";

gsap.registerPlugin(ScrollTrigger);

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;

// How far each movement layer travels (added to its rest Z) at full explode.
const EXPLODE_OFFSET = {
  Baseplate: -0.95,
  Weight: -0.6,
  Barrel: -0.3,
  Mainplate: 0,
  Tourbillon: 0.4,
  Dial: 0.85,
};

const MACRO_STAGES = [
  { rotY: 0.18, camZ: 4.4, fov: 24, groupY: 0.05 },
  { rotY: -Math.PI * 0.4, camZ: 4.1, fov: 21, groupY: 0 },
  { rotY: -Math.PI * 0.12, camZ: 4.6, fov: 26, groupY: -1.35 },
];

export function useSectionAnimations(contentRef) {
  const {
    watchGroupRef,
    cameraRef,
    onReady,
    movementNodesRef,
    movementRestZRef,
    caseMaterialsRef,
    crystalMaterialRef,
    assemblyActiveRef,
    assemblyExplodeRef,
    particleEnergyRef,
  } = useScene();

  useEffect(() => {
    let ctx;

    onReady(() => {
      const group = watchGroupRef.current;
      const camera = cameraRef.current;
      if (!group || !camera || !contentRef.current) return;

      ctx = gsap.context(() => {
        setupHeroBgFade();
        setupAssembly(group, camera);
        setupMechanicalHeart(group, camera);
        setupMacroZoom(group, camera);
        setupLineupReturn(group, camera);
        setupGenericReveals();
      });
    });

    return () => {
      if (ctx) ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentRef]);

  function setupHeroBgFade() {
    ScrollTrigger.create({
      trigger: "#hero",
      start: "bottom 95%",
      end: "bottom 15%",
      scrub: true,
      onUpdate: (self) => {
        const el = document.getElementById("heroBgType");
        if (el) el.style.opacity = String(1 - self.progress);
      },
    });
  }

  function setupAssembly(group, camera) {
    ScrollTrigger.create({
      trigger: "#assembly",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
      onToggle: (self) => {
        assemblyActiveRef.current = self.isActive;
      },
      onUpdate: (self) => {
        const p = self.progress;
        const rotationPhase = clamp01(p / 0.5);
        const explodePhase = clamp01((p - 0.3) / 0.7);
        assemblyExplodeRef.current = explodePhase;

        group.rotation.y = lerp(0, -Math.PI * 0.46, easeInOut(rotationPhase));
        camera.position.z = lerp(7, 7.6, rotationPhase);
        camera.fov = lerp(28, 25, rotationPhase);
        camera.updateProjectionMatrix();

        const nodes = movementNodesRef.current;
        const restZ = movementRestZRef.current;
        Object.entries(EXPLODE_OFFSET).forEach(([name, offset]) => {
          const node = nodes[name];
          if (!node) return;
          node.position.z = (restZ[name] ?? 0) + offset * explodePhase;
        });

        const fadeOut = 1 - clamp01(explodePhase / 0.4);
        caseMaterialsRef.current.forEach((mat) => {
          mat.opacity = fadeOut;
        });
        if (crystalMaterialRef.current) crystalMaterialRef.current.opacity = fadeOut * 0.35;
      },
    });
  }

  function setupMechanicalHeart(group, camera) {
    ScrollTrigger.create({
      trigger: "#mechanical-heart",
      start: "top 55%",
      endTrigger: "#macro",
      end: "bottom 55%",
      toggleClass: { targets: document.body, className: "theme-dark" },
    });

    ScrollTrigger.create({
      trigger: "#mechanical-heart",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
      onUpdate: (self) => {
        const p = self.progress;
        const zoomPhase = clamp01(p / 0.6);
        particleEnergyRef.current = Math.sin(clamp01(p) * Math.PI);

        camera.fov = lerp(25, 23, easeInOut(zoomPhase));
        camera.position.z = lerp(7.6, 5.8, easeInOut(zoomPhase));

        if (p >= 0.6) {
          const reassemble = clamp01((p - 0.6) / 0.4);
          assemblyExplodeRef.current = 1 - reassemble;
          const nodes = movementNodesRef.current;
          const restZ = movementRestZRef.current;
          Object.entries(EXPLODE_OFFSET).forEach(([name, offset]) => {
            const node = nodes[name];
            if (!node) return;
            node.position.z = (restZ[name] ?? 0) + offset * (1 - reassemble);
          });
          caseMaterialsRef.current.forEach((mat) => {
            mat.opacity = reassemble;
          });
          if (crystalMaterialRef.current) crystalMaterialRef.current.opacity = reassemble * 0.35;
          camera.fov = lerp(23, MACRO_STAGES[0].fov, easeInOut(reassemble));
          camera.position.z = lerp(5.8, MACRO_STAGES[0].camZ, easeInOut(reassemble));
          group.rotation.y = lerp(-Math.PI * 0.46, MACRO_STAGES[0].rotY, easeInOut(reassemble));
        }
        camera.updateProjectionMatrix();
      },
    });
  }

  function setupMacroZoom(group, camera) {
    const backdrops = ["macro-dial", "macro-case", "macro-strap"].map((id) =>
      document.querySelector(`#${id} .macro-zoom__backdrop`)
    );

    ScrollTrigger.create({
      trigger: "#macro",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
      onUpdate: (self) => {
        // Macro Zoom always shows the fully assembled watch — force that
        // state on every update so a fast scroll/jump into this section
        // can never leave it mid-explode, regardless of whether the
        // Mechanical Heart reassemble tween had time to finish.
        assemblyExplodeRef.current = 0;
        const nodes = movementNodesRef.current;
        const restZ = movementRestZRef.current;
        Object.keys(EXPLODE_OFFSET).forEach((name) => {
          const node = nodes[name];
          if (node) node.position.z = restZ[name] ?? 0;
        });
        caseMaterialsRef.current.forEach((mat) => {
          mat.opacity = 1;
        });
        if (crystalMaterialRef.current) crystalMaterialRef.current.opacity = 0.35;

        const stageFloat = clamp01(self.progress) * MACRO_STAGES.length;
        const idx = Math.min(Math.floor(stageFloat), MACRO_STAGES.length - 1);
        const next = Math.min(idx + 1, MACRO_STAGES.length - 1);
        const localP = easeInOut(clamp01(stageFloat - idx));

        const a = MACRO_STAGES[idx];
        const b = MACRO_STAGES[next];

        group.rotation.y = lerp(a.rotY, b.rotY, localP);
        group.position.y = lerp(a.groupY, b.groupY, localP);
        camera.position.z = lerp(a.camZ, b.camZ, localP);
        camera.fov = lerp(a.fov, b.fov, localP);
        camera.updateProjectionMatrix();

        backdrops.forEach((el, i) => {
          if (!el) return;
          const dist = Math.abs(stageFloat - (i + 0.5));
          el.style.opacity = String(clamp01(1 - dist * 1.6) * 0.55);
        });
      },
    });
  }

  function setupLineupReturn(group, camera) {
    const from = MACRO_STAGES[MACRO_STAGES.length - 1];
    ScrollTrigger.create({
      trigger: "#lineup",
      start: "top 80%",
      end: "top 20%",
      scrub: 0.4,
      onUpdate: (self) => {
        const p = easeInOut(self.progress);
        group.rotation.y = lerp(from.rotY, 0, p);
        group.position.y = lerp(from.groupY, 0.05, p);
        group.position.x = 0;
        camera.position.z = lerp(from.camZ, 7, p);
        camera.fov = lerp(from.fov, 28, p);
        camera.updateProjectionMatrix();
      },
    });
  }

  function setupGenericReveals() {
    gsap.utils.toArray(".reveal").forEach((el) => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 50 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" },
        }
      );
    });

    gsap.utils.toArray(".reveal-stagger").forEach((group) => {
      const items = group.querySelectorAll(".reveal-item");
      gsap.fromTo(
        items,
        { autoAlpha: 0, y: 36 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: group, start: "top 80%", toggleActions: "play none none reverse" },
        }
      );
    });
  }
}

function easeInOut(t) {
  return t * t * (3 - 2 * t);
}
