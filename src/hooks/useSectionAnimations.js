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

// Bracelet link index, parsed from "StrapTop_L3" -> 3, "ClaspTop" -> 11
// (the clasp sits one slot past the last link so it fans out furthest).
function strapNodeIndex(name) {
  if (name.startsWith("Clasp")) return 11;
  const m = name.match(/_L(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

// Fans every bracelet link and the clasp outward on X/Z (alternating sides,
// travelling further from the case with each link) alongside the movement
// explode, then folds the clasp open a little for a "disassembled" read.
function applyStrapExplode(strapNodesRef, explodePhase) {
  Object.entries(strapNodesRef.current).forEach(([name, { node, rest }]) => {
    const i = strapNodeIndex(name);
    const dirSign = i % 2 === 0 ? 1 : -1;
    node.position.x = rest.x + dirSign * (0.12 + i * 0.045) * explodePhase;
    node.position.z = rest.z - (0.05 + i * 0.055) * explodePhase;
    if (name.startsWith("Clasp")) {
      node.rotation.z = (name === "ClaspTop" ? 1 : -1) * 0.7 * explodePhase;
    }
  });
}

// Ordered zones the page scrolls through; each names whether that section
// should read on the light or dark palette. The scrub below smoothly
// crossfades --bg/--ink/etc. as the viewport center crosses each boundary,
// rather than snapping with a class toggle.
const THEME_ZONES = [
  { id: "hero", dark: false },
  { id: "assembly", dark: false },
  { id: "mechanical-heart", dark: true },
  { id: "macro", dark: true },
  { id: "personalize", dark: false },
  { id: "gift-atelier", dark: true },
  { id: "services", dark: false },
  { id: "boutique", dark: true },
  { id: "lineup", dark: false },
];

const LIGHT_PALETTE = {
  bg: [246, 244, 239],
  bgAlt: [237, 234, 225],
  ink: [22, 20, 15],
  inkDim: [110, 103, 89],
  gold: [156, 116, 52],
  goldBright: [185, 141, 71],
  line: [22, 20, 15],
};
const DARK_PALETTE = {
  bg: [10, 10, 11],
  bgAlt: [17, 17, 19],
  ink: [242, 236, 225],
  inkDim: [168, 162, 154],
  gold: [201, 166, 104],
  goldBright: [232, 202, 160],
  line: [242, 236, 225],
};

const MACRO_STAGES = [
  { rotY: 0.18, camZ: 4.4, fov: 24, groupY: 0.05 },
  { rotY: -Math.PI * 0.4, camZ: 4.1, fov: 21, groupY: 0 },
  { rotY: -Math.PI * 0.12, camZ: 4.6, fov: 26, groupY: -1.35 },
];

// Resting camera/group pose used both to settle the watch after Macro Zoom
// (before the informational sections) and as the starting point for the
// Lineup return — keeping the two in sync avoids a visual snap between them.
const AMBIENT_POSE = { rotY: 0, camZ: 7.4, fov: 27, groupY: 0.05 };

export function useSectionAnimations(contentRef) {
  const {
    watchGroupRef,
    innerGroupRef,
    cameraRef,
    onReady,
    movementNodesRef,
    movementRestZRef,
    caseMaterialsRef,
    strapMaterialsRef,
    crystalMaterialRef,
    strapNodesRef,
    crystalGlareRef,
    boxGroupRef,
    boxLidRef,
    precisionFramingRef,
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
        setupThemeScrub();
        setupHeroBgFade();
        setupAssembly(group, camera);
        setupMechanicalHeart(group, camera);
        setupMacroZoom(group, camera);
        setupInfoSectionsTransition(group, camera);
        setupUnboxing(group, camera);
        setupLineupReturn(group, camera);
        setupGenericReveals();
      });
    });

    return () => {
      if (ctx) ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentRef]);

  function setupThemeScrub() {
    const zones = THEME_ZONES.map((z) => ({ ...z, el: document.getElementById(z.id) })).filter((z) => z.el);
    if (!zones.length) return;
    const CROSSFADE = 160; // px, viewport-center crossfade window at each boundary
    const root = document.documentElement;
    const CSS_VAR_NAMES = { bg: "--bg", bgAlt: "--bg-alt", ink: "--ink", inkDim: "--ink-dim", gold: "--gold", goldBright: "--gold-bright" };
    const lerpRgb = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

    const applyTheme = (amount) => {
      Object.entries(CSS_VAR_NAMES).forEach(([key, cssVar]) => {
        const [r, g, b] = lerpRgb(LIGHT_PALETTE[key], DARK_PALETTE[key], amount);
        root.style.setProperty(cssVar, `rgb(${r.toFixed(0)}, ${g.toFixed(0)}, ${b.toFixed(0)})`);
      });
      const [lr, lg, lb] = lerpRgb(LIGHT_PALETTE.line, DARK_PALETTE.line, amount);
      root.style.setProperty("--line", `rgba(${lr.toFixed(0)}, ${lg.toFixed(0)}, ${lb.toFixed(0)}, 0.14)`);
      root.style.setProperty("--gold-graphic", `rgb(${lerpRgb(LIGHT_PALETTE.gold, DARK_PALETTE.goldBright, amount).map((v) => v.toFixed(0)).join(", ")})`);
    };

    ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: () => {
        const centerY = window.scrollY + window.innerHeight * 0.4;
        let amount = zones[0].dark ? 1 : 0;
        for (let i = 0; i < zones.length; i++) {
          const zone = zones[i];
          const top = zone.el.offsetTop;
          const bottom = top + zone.el.offsetHeight;
          if (centerY < top || centerY > bottom) continue;
          amount = zone.dark ? 1 : 0;
          const next = zones[i + 1];
          const prev = zones[i - 1];
          if (next && next.dark !== zone.dark && centerY > bottom - CROSSFADE) {
            const t = clamp01((centerY - (bottom - CROSSFADE)) / CROSSFADE);
            amount = lerp(zone.dark ? 1 : 0, next.dark ? 1 : 0, t);
          } else if (prev && prev.dark !== zone.dark && centerY < top + CROSSFADE) {
            const t = clamp01(((top + CROSSFADE) - centerY) / CROSSFADE);
            amount = lerp(zone.dark ? 1 : 0, prev.dark ? 1 : 0, t);
          }
          break;
        }
        applyTheme(amount);
      },
    });
  }

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
        makePrecisionToggle(precisionFramingRef, innerGroupRef)(self);
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
        applyStrapExplode(strapNodesRef, explodePhase);

        const fadeOut = 1 - clamp01(explodePhase / 0.4);
        caseMaterialsRef.current.forEach((mat) => {
          mat.opacity = fadeOut;
        });
        strapMaterialsRef.current.forEach((mat) => {
          mat.opacity = fadeOut;
        });
        if (crystalMaterialRef.current) crystalMaterialRef.current.opacity = fadeOut * 0.35;
      },
    });
  }

  function setupMechanicalHeart(group, camera) {
    ScrollTrigger.create({
      trigger: "#mechanical-heart",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
      onToggle: makePrecisionToggle(precisionFramingRef, innerGroupRef),
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
          applyStrapExplode(strapNodesRef, 1 - reassemble);
          caseMaterialsRef.current.forEach((mat) => {
            mat.opacity = reassemble;
          });
          strapMaterialsRef.current.forEach((mat) => {
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
      onToggle: makePrecisionToggle(precisionFramingRef, innerGroupRef),
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
        applyStrapExplode(strapNodesRef, 0);
        caseMaterialsRef.current.forEach((mat) => {
          mat.opacity = 1;
        });
        strapMaterialsRef.current.forEach((mat) => {
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

        // Crystal glare sweep, confined to the dial stage (stageFloat 0→1):
        // clamp01(stageFloat) tracks progress through that stage and then
        // holds at 1 once past it, so this triangular curve naturally rises
        // and falls back to 0 without needing to branch on which stage is
        // active.
        const glare = crystalGlareRef.current;
        if (glare) {
          const dialPhase = clamp01(stageFloat);
          const glareStrength = clamp01(1 - Math.abs(dialPhase * 2 - 1));
          glare.position.x = lerp(-0.75, 0.75, dialPhase);
          glare.position.y = lerp(-0.6, 0.6, dialPhase);
          glare.material.opacity = glareStrength * 0.85;
        }
      },
    });
  }

  // Between Macro Zoom and Lineup sit four informational sections
  // (Personalize, Gift Atelier, Services, Boutique) with no 3D choreography
  // of their own. Without this, the watch stays frozen at Macro's last,
  // heavily-zoomed framing — a huge tilted metal surface — behind all of
  // them. Settle it to a calm ambient pose and fade the canvas down so it
  // doesn't dominate that reading-focused stretch of the page.
  function setupInfoSectionsTransition(group, camera) {
    const from = MACRO_STAGES[MACRO_STAGES.length - 1];
    const canvasEl = document.getElementById("canvasStage");
    ScrollTrigger.create({
      trigger: "#personalize",
      start: "top bottom",
      end: "top top",
      scrub: 0.4,
      onUpdate: (self) => {
        const p = easeInOut(self.progress);
        group.rotation.y = lerp(from.rotY, AMBIENT_POSE.rotY, p);
        group.position.y = lerp(from.groupY, AMBIENT_POSE.groupY, p);
        group.position.x = 0;
        camera.position.z = lerp(from.camZ, AMBIENT_POSE.camZ, p);
        camera.fov = lerp(from.fov, AMBIENT_POSE.fov, p);
        camera.updateProjectionMatrix();
        if (canvasEl) canvasEl.style.opacity = String(lerp(1, 0.14, p));
      },
    });
  }

  // 3D unboxing scene: scoped entirely to #gift-atelier, self-resetting at
  // both ends (progress 0 and 1 both map to openPhase 0), so it hands the
  // ambient framing straight back to Services without any coordination with
  // the surrounding info-section triggers. Peaks mid-section: the wooden
  // presentation box scales in, its lid hinges open, and the watch shrinks
  // and settles down into it as the canvas brightens back up.
  function setupUnboxing(group, camera) {
    const box = boxGroupRef.current;
    const lid = boxLidRef.current;
    const canvasEl = document.getElementById("canvasStage");
    if (!box || !lid) return;

    ScrollTrigger.create({
      trigger: "#gift-atelier",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
      onToggle: makePrecisionToggle(precisionFramingRef, innerGroupRef),
      onUpdate: (self) => {
        const p = clamp01(self.progress);
        const openPhase = easeInOut(clamp01(1 - Math.abs(p * 2 - 1)));

        // Tilted, 3/4 "looking down into the open box" framing — a
        // straight-on view reads the box as a flat rectangle rather than a
        // dimensional container, so both the box and the nested watch pick
        // up a matching X/Y tilt as they settle into place.
        box.scale.setScalar(lerp(0, 0.62, openPhase));
        box.rotation.x = lerp(0, -0.3, openPhase);
        box.rotation.y = lerp(0, 0.35, openPhase);
        lid.rotation.x = lerp(0, -2.0, openPhase);

        group.position.x = 0;
        group.position.y = lerp(AMBIENT_POSE.groupY, -0.95, openPhase);
        group.scale.setScalar(lerp(1, 0.32, openPhase));
        group.rotation.x = lerp(0, -0.24, openPhase);
        group.rotation.y = lerp(AMBIENT_POSE.rotY, 0.35, openPhase);
        camera.position.z = lerp(AMBIENT_POSE.camZ, 6.6, openPhase);
        camera.fov = lerp(AMBIENT_POSE.fov, 30, openPhase);
        camera.updateProjectionMatrix();

        if (canvasEl) canvasEl.style.opacity = String(lerp(0.14, 0.55, openPhase));
      },
    });
  }

  function setupLineupReturn(group, camera) {
    const from = AMBIENT_POSE;
    const canvasEl = document.getElementById("canvasStage");
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
        if (canvasEl) canvasEl.style.opacity = String(lerp(0.14, 1, p));
      },
    });
  }

  // Plain CSS transitions + IntersectionObserver, not GSAP — reveals are
  // simple one-shot fade/slide-ins with no reason to depend on a
  // continuously-progressing tween. GSAP's ticker is rAF-driven and can be
  // starved for long stretches by a busy, continuously-rendering Canvas
  // (observed on slow/software-rendered GPUs), which would otherwise leave
  // a section's reveal stuck invisible forever if it happened to trigger
  // during a stall. IntersectionObserver + CSS has no such dependency.
  function setupGenericReveals() {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
    );

    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    document.querySelectorAll(".reveal-stagger .reveal-item").forEach((el) => io.observe(el));
  }
}

function easeInOut(t) {
  return t * t * (3 - 2 * t);
}

// Shared by every precisely-choreographed section's onToggle: pause the
// idle 360° drift (see WatchModel) and ease any drift it already
// accumulated back to 0 so the section's exact framing isn't off-angle.
function makePrecisionToggle(precisionFramingRef, innerGroupRef) {
  return (self) => {
    precisionFramingRef.current = self.isActive;
    if (self.isActive && innerGroupRef.current) {
      gsap.to(innerGroupRef.current.rotation, { y: 0, duration: 0.5, ease: "power2.out" });
    }
  };
}
