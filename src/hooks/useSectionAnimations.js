import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
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

// X-ray cutaway: instead of fading the case straight back to fully opaque
// as the movement reassembles, it settles at a translucent "smoked glass"
// level and holds there — the internal gears (spun continuously in
// WatchModel) read as visible, moving machinery through the shell — then
// resolves to fully solid metal right at the very end, just before the
// camera/framing hands off into Macro Zoom.
const XRAY_OPACITY = 0.3;
function xrayCaseOpacity(reassemble) {
  if (reassemble < 0.6) return lerp(0, XRAY_OPACITY, reassemble / 0.6);
  if (reassemble < 0.85) return XRAY_OPACITY;
  return lerp(XRAY_OPACITY, 1, (reassemble - 0.85) / 0.15);
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
  // Slim Profile: pushed close to a true 90° side-on rotation so the thin
  // case edge actually reads as a profile rather than a fast pass-through.
  { rotY: -Math.PI * 0.46, camZ: 4.1, fov: 21, groupY: 0 },
  { rotY: -Math.PI * 0.12, camZ: 4.6, fov: 26, groupY: -1.35 },
];

// Bracelet stage (the last macro stage, stageFloat in [2,3]) otherwise holds
// perfectly still at MACRO_STAGES' final pose — this sweeps the watch left/
// right in front of the fixed camera during that dwell so the links visibly
// pan across frame instead of sitting frozen.
const BRACELET_PAN_X = 0.55;

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
    dialMaterialRef,
    strapNodesRef,
    crystalGlareRef,
    boxGroupRef,
    boxLidRef,
    setDofEnabled,
    precisionFramingRef,
    assemblyActiveRef,
    assemblyExplodeRef,
    particleEnergyRef,
  } = useScene();

  // Lenis owns scroll physics for the whole app — independent of the 3D
  // model's load state (onReady below), since scrolling should feel right
  // from the very first frame on Hero. A cubic ease-out ("weighty" rather
  // than snappy) plus a duration a touch longer than the ~0.3-0.5s scrub
  // values used throughout this file gives scroll itself the same
  // hydraulic, damped-inertia feel as the section transitions.
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.1,
    });
    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Plain <a href="#id"> nav links would otherwise jump instantly via
    // native anchor navigation, bypassing Lenis entirely and fighting its
    // idea of where the scroll actually is — route them through it instead.
    const handleAnchorClick = (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.3 });
    };
    document.addEventListener("click", handleAnchorClick);

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  // Cinematic brand title — independent of the 3D model's load state (like
  // Lenis above), since it's pure DOM/CSS and should be animating from
  // first paint. Large and centered on Hero, it docks precisely onto the
  // (visually transparent) navbar logo's live position as that section
  // scrolls past, then keeps a subtle reactive scale for the rest of the
  // page: it swells back up a touch whenever the canvas itself has faded
  // toward the informational sections' ambient state, reading as the brand
  // mark reclaiming presence exactly when the watch isn't dominating.
  useEffect(() => {
    const title = document.getElementById("cinematicTitle");
    const logoAnchor = document.getElementById("navbarLogo");
    if (!title || !logoAnchor) return;

    const state = { heroX: 0, heroY: 0, heroScale: 2.3, dockX: 0, dockY: 0, dockProgress: 0, reactiveScale: 1 };

    const apply = () => {
      const p = state.dockProgress;
      const x = lerp(state.heroX, state.dockX, p);
      const y = lerp(state.heroY, state.dockY, p);
      const baseScale = lerp(state.heroScale, 1, p);
      title.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${baseScale * state.reactiveScale})`;
      // While still large/centered, this needs to sit BEHIND the watch
      // canvas (z-index 1) so it never paints over the dial — it only
      // needs to clear the navbar's blurred bar (z-index 30) once it has
      // actually moved into that corner. By p=0.35 it has already shrunk
      // and shifted well clear of the watch's on-screen bounds, so the
      // flip reads as part of the motion rather than a visible pop.
      title.style.zIndex = p > 0.35 ? "31" : "0";
    };

    const measure = () => {
      title.style.transform = "translate3d(0px, 0px, 0) scale(1)";
      const w = title.offsetWidth;
      const h = title.offsetHeight;
      state.heroX = window.innerWidth / 2 - (w * state.heroScale) / 2;
      state.heroY = window.innerHeight * 0.4 - (h * state.heroScale) / 2;
      const rect = logoAnchor.getBoundingClientRect();
      state.dockX = rect.left;
      state.dockY = rect.top;
      apply();
    };

    measure();
    window.addEventListener("resize", measure);

    // .navbar--scrolled (toggled past scrollY 40px) shrinks the navbar's
    // padding, which moves the logo a few px — re-measure once, after that
    // CSS transition settles, so the docked position stays pixel-accurate.
    // This crossing happens very early in Hero's scroll (well before
    // dockProgress is large enough for a few px to be visible), so there's
    // no perceptible correction snap.
    let wasScrolled = window.scrollY > 40;
    const handleScrollThreshold = () => {
      const isScrolled = window.scrollY > 40;
      if (isScrolled === wasScrolled) return;
      wasScrolled = isScrolled;
      // React's own state-update/re-render (Navbar.jsx toggles this same
      // class) adds latency before the CSS padding transition even starts,
      // so the full 400ms transition can take closer to 700-900ms
      // wall-clock to actually settle — measured empirically, a tighter
      // delay sampled the padding mid-transition and locked in a wrong dock
      // position.
      setTimeout(measure, 750);
    };
    window.addEventListener("scroll", handleScrollThreshold, { passive: true });

    const dockTrigger = ScrollTrigger.create({
      trigger: "#hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        state.dockProgress = easeInOut(clamp01(self.progress));
        apply();
      },
    });

    const reactiveTrigger = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: () => {
        const canvasEl = document.getElementById("canvasStage");
        const canvasOpacity = canvasEl ? parseFloat(canvasEl.style.opacity || "1") : 1;
        state.reactiveScale = lerp(1, 1.12, 1 - clamp01(canvasOpacity));
        apply();
      },
    });

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", handleScrollThreshold);
      dockTrigger.kill();
      reactiveTrigger.kill();
    };
  }, []);

  useEffect(() => {
    let ctx;

    onReady(() => {
      const group = watchGroupRef.current;
      const camera = cameraRef.current;
      if (!group || !camera || !contentRef.current) return;

      ctx = gsap.context(() => {
        setupThemeScrub();
        setupAmbientGlare();
        setupHeroBgFade();
        setupAssembly(group, camera);
        setupMechanicalHeart(group, camera);
        setupMacroZoom(group, camera);
        setupInfoSectionsTransition(group, camera);
        setupPersonalizeReveal(group, camera);
        setupUnboxing(group, camera);
        setupLineupReturn(group, camera);
        setupGenericReveals();
        setupDofGate();
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

  // Sapphire-crystal glare that reacts to scroll everywhere on the page —
  // a diagonal highlight that brightens with scroll speed and dims when
  // idle, reading as light catching the anti-reflective coating as the
  // watch moves. Paused during precisely-choreographed sections: Macro
  // Zoom drives this same mesh with its own dedicated dial-stage sweep
  // (see setupMacroZoom), and the others simply don't want a sweep
  // competing with their framing.
  function setupAmbientGlare() {
    let lastY = window.scrollY;
    let lastT = performance.now();

    ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: () => {
        const glare = crystalGlareRef.current;
        if (!glare) return;
        const now = performance.now();
        const y = window.scrollY;
        const dt = Math.max(now - lastT, 1);
        const speedNorm = clamp01((Math.abs(y - lastY) / dt) * 12);
        lastY = y;
        lastT = now;

        if (precisionFramingRef.current) {
          // Macro Zoom drives this same mesh right after this callback
          // runs (see setupMacroZoom) and will overwrite this 0 with its
          // own value; everywhere else precision framing is active, this
          // keeps the sweep from sitting stuck mid-highlight.
          glare.material.opacity = 0;
          return;
        }

        const t = (y / 340) % 1;
        glare.position.x = lerp(-0.75, 0.75, t);
        glare.position.y = lerp(-0.6, 0.6, Math.abs(t * 2 - 1));
        glare.material.opacity = speedNorm * 0.55;
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
          // The movement nests back together on its own, faster timeline
          // than the case/dial opacity curve below — it needs to be fully
          // assembled *before* the shell finishes its translucent "hold"
          // (see xrayCaseOpacity), otherwise the x-ray cutaway is looking
          // through a hazy dial at parts that are still mid-explode rather
          // than at a coherent, nested mechanism.
          const nestPhase = clamp01(reassemble / 0.6);
          const nodes = movementNodesRef.current;
          const restZ = movementRestZRef.current;
          Object.entries(EXPLODE_OFFSET).forEach(([name, offset]) => {
            const node = nodes[name];
            if (!node) return;
            node.position.z = (restZ[name] ?? 0) + offset * (1 - nestPhase);
          });
          applyStrapExplode(strapNodesRef, 1 - nestPhase);
          const caseOpacity = xrayCaseOpacity(reassemble);
          caseMaterialsRef.current.forEach((mat) => {
            mat.opacity = caseOpacity;
          });
          strapMaterialsRef.current.forEach((mat) => {
            mat.opacity = caseOpacity;
          });
          if (crystalMaterialRef.current) crystalMaterialRef.current.opacity = reassemble * 0.35;
          // The dial disc sits directly in front of the movement stack, so
          // it has to go even more translucent than the case for the
          // gears to actually read through it — hands/markers are separate
          // opaque meshes and stay crisp on top.
          if (dialMaterialRef.current) dialMaterialRef.current.opacity = caseOpacity * 0.6;
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
        if (dialMaterialRef.current) dialMaterialRef.current.opacity = 1;

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

        const braceletPhase = clamp01(stageFloat - (MACRO_STAGES.length - 1));
        group.position.x = braceletPhase > 0 ? lerp(-BRACELET_PAN_X, BRACELET_PAN_X, easeInOut(braceletPhase)) : 0;

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

  // Between Macro Zoom and Lineup sit five informational sections
  // (Specifications, Personalize, Gift Atelier, Services, Boutique) with no
  // 3D choreography of their own. Without this, the watch stays frozen at
  // Macro's last, heavily-zoomed framing — a huge tilted metal surface —
  // behind all of them. Settle it to a calm ambient pose and fade the canvas
  // down so it doesn't dominate that reading-focused stretch of the page.
  // Scoped to #specs (the first of the five) rather than #personalize so the
  // handoff completes before the reading stretch begins, not partway
  // through it.
  function setupInfoSectionsTransition(group, camera) {
    const from = MACRO_STAGES[MACRO_STAGES.length - 1];
    const canvasEl = document.getElementById("canvasStage");
    ScrollTrigger.create({
      trigger: "#specs",
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

  // Case-back reveal: scoped to #personalize. This section is a normal,
  // non-pinned, roughly-one-viewport-tall block, so "top top"->"bottom
  // bottom" would collapse to a near-zero scrub range — instead this uses
  // "top top"->"bottom top" (scroll distance == the section's own height),
  // which lines up exactly with where setupInfoSectionsTransition's entry
  // hands off (ends at "top top") and where setupUnboxing's #gift-atelier
  // trigger picks up next (starts at "top top" of the very next section, at
  // the same scrollY as this trigger's "bottom top") — a clean, non-
  // overlapping sequential handoff, matching that established pattern.
  // Self-resets to the ambient framing at both ends: peaks mid-section,
  // turning the watch to show its case back and brightening the canvas
  // enough for the live engraving texture (see Personalize.jsx's
  // caseBackMaterialRef binding) to actually read.
  function setupPersonalizeReveal(group, camera) {
    const canvasEl = document.getElementById("canvasStage");
    ScrollTrigger.create({
      trigger: "#personalize",
      start: "top top",
      end: "bottom top",
      scrub: 0.4,
      onToggle: makePrecisionToggle(precisionFramingRef, innerGroupRef),
      onUpdate: (self) => {
        const p = clamp01(self.progress);
        const revealPhase = easeInOut(clamp01(1 - Math.abs(p * 2 - 1)));

        group.rotation.y = lerp(AMBIENT_POSE.rotY, Math.PI, revealPhase);
        group.position.y = AMBIENT_POSE.groupY;
        group.position.x = 0;
        camera.position.z = lerp(AMBIENT_POSE.camZ, 6.1, revealPhase);
        camera.fov = lerp(AMBIENT_POSE.fov, 23, revealPhase);
        camera.updateProjectionMatrix();

        if (canvasEl) canvasEl.style.opacity = String(lerp(0.14, 0.85, revealPhase));
      },
    });
  }

  // 3D unboxing scene: scoped entirely to #gift-atelier, self-resetting at
  // both ends (progress 0 and 1 both map to openPhase 0), so it hands the
  // ambient framing straight back to Services without any coordination with
  // the surrounding info-section triggers. Peaks mid-section: the wooden
  // presentation box scales in and its lid hinges open, offset toward
  // screen-right so it clears the text column (see GiftAtelier.jsx's
  // two-column layout) instead of sitting centered behind it — the watch
  // itself just shrinks away rather than nesting inside the box, since a
  // watch-sized mesh behind foreground text was the actual collision.
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
        // dimensional container.
        box.scale.setScalar(lerp(0, 0.62, openPhase));
        box.position.x = lerp(0, 1.15, openPhase);
        box.rotation.x = lerp(0, -0.3, openPhase);
        box.rotation.y = lerp(0, 0.35, openPhase);
        lid.rotation.x = lerp(0, -2.0, openPhase);

        group.position.x = 0;
        group.scale.setScalar(lerp(1, 0.001, openPhase));
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

  // The depth-of-field EffectComposer pass (see PostFX.jsx) is expensive
  // enough on slow/software-rendered GPUs to noticeably delay first paint,
  // so it only mounts near where it's actually used — Mechanical Heart's
  // zoom-in tail through the end of Macro Zoom — rather than for the whole
  // page. rootMargin extends the trigger zone before #macro's own top edge
  // so it's already mounted by the time that zoom-in reaches its tightest.
  function setupDofGate() {
    const target = document.getElementById("macro");
    if (!target) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => setDofEnabled(entry.isIntersecting)),
      { rootMargin: "35% 0px 15% 0px", threshold: 0 }
    );
    io.observe(target);
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
