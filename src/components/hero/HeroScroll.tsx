"use client";
/**
 * HeroScroll — a 450vh section with a sticky stage. Scrolling is the switch:
 * GSAP ScrollTrigger scrubs 0..1 into RoomScene through a ref-based source,
 * the lights ramp on in order, and at 84% the H1 switches on with the CTAs.
 *
 * Fallbacks: low power / narrow / no WebGL → the looping video with captions
 * cycling in sync; reduced motion or "הכול דלוק" → the lit frame, everything on.
 */
import { useLenis } from "lenis/react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Filament } from "@/components/brand/Logo";
import { TransitionLink } from "@/components/brand/TransitionLink";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useTx } from "@/lib/i18n";
import { BRAND_NAME, TAGLINE } from "@/lib/i18n/common";
import { getGsap } from "@/lib/motion/gsap";
import { CaptionList } from "./Captions";
import { AUTO_TIMES, LIGHTS, TITLE_AT, type LightId } from "./light-controller";
import { HeroProgressContext, RoomScene, useHeroRenderer, type ProgressSource } from "./RoomScene";

const STAGE: CSSProperties = { top: "var(--header-h)", height: "calc(100dvh - var(--header-h))" };

function HeroTitle({ on, instant = false, overlay = true, onNeedLight }: { on: boolean; instant?: boolean; overlay?: boolean; onNeedLight?: () => void }) {
  const t = useTx();
  const focusIn = () => { if (!on) onNeedLight?.(); };
  return (
    <div className={overlay ? "pointer-events-none absolute inset-x-0 bottom-0 pb-[7vh]" : "pt-8"}>
      <div className="container-x">
        <div
          className={`switch-on ${on ? (instant ? "is-on-instant" : "is-on") : ""} max-w-full`}
          style={{ "--off-opacity": 0 } as CSSProperties}
          data-on={on ? "1" : "0"}
        >
          <p className="eyebrow mb-3">{t(BRAND_NAME)} · {t({ he: "כ-80 שנה של אור", en: "About 80 years of light" })}</p>
          <h1
            className="font-display text-paper leading-[0.98] md:whitespace-nowrap"
            style={{ fontSize: "clamp(3rem, 7.4vw, 9.2rem)", letterSpacing: "-0.01em", textShadow: "0 2px 24px rgb(0 0 0 / 0.55)" }}
          >
            {t(TAGLINE)}
          </h1>
          <div className="pointer-events-auto mt-7 flex flex-wrap gap-3">
            <TransitionLink href="/relight" className="btn btn-primary" onFocus={focusIn}>
              {t({ he: "תאירו לי את הסלון", en: "Light my living room" })}
            </TransitionLink>
            <TransitionLink href="/studio" className="btn" onFocus={focusIn}>
              {t({ he: "אזור המעצבים", en: "Designers' area" })}
            </TransitionLink>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hint({ visible }: { visible: boolean }) {
  const t = useTx();
  return (
    <div
      aria-hidden={!visible}
      className="pointer-events-none absolute inset-x-0 bottom-[6vh] flex flex-col items-center gap-2"
      style={{ opacity: visible ? 1 : 0, transition: `opacity ${visible ? 300 : 80}ms linear` }}
    >
      <Filament size={30} animate />
      <p className="font-mono text-[0.72rem] tracking-[0.14em] text-muted">{t({ he: "גללו כדי להדליק", en: "Scroll to switch on" })}</p>
    </div>
  );
}

function SkipHero() {
  const t = useTx();
  return (
    <a href="#after-hero" className="skip-link">
      {t({ he: "דלגו על הפתיח", en: "Skip the intro" })}
    </a>
  );
}

/* ───────────── scroll-driven (WebGL) ───────────── */

function ScrollHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const listeners = useRef(new Set<(p: number) => void>());
  const pRef = useRef(0);
  const [hint, setHint] = useState(true);
  const [title, setTitle] = useState(false);
  const lenis = useLenis();

  const source = useMemo<ProgressSource>(
    () => ({
      get: () => pRef.current,
      subscribe: (fn) => { listeners.current.add(fn); return () => { listeners.current.delete(fn); }; },
    }),
    [],
  );

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const { ScrollTrigger } = getGsap();
    const headerH = () => (document.querySelector("header")?.getBoundingClientRect().height ?? 72);
    const emit = (p: number) => {
      pRef.current = p;
      listeners.current.forEach((fn) => fn(p));
      setHint(p < LIGHTS[0].scrollStart);
      setTitle(p >= TITLE_AT);
    };
    const st = ScrollTrigger.create({
      trigger: el,
      start: () => `top ${headerH()}px`,
      end: "bottom bottom",
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => emit(self.progress),
    });
    emit(st.progress);
    return () => st.kill();
  }, []);

  const lightEverything = () => {
    const el = sectionRef.current;
    if (!el) return;
    const top = el.offsetTop + el.offsetHeight - window.innerHeight;
    if (lenis) lenis.scrollTo(top, { immediate: true });
    else window.scrollTo({ top, behavior: "auto" });
  };

  return (
    <section ref={sectionRef} aria-label="פתיח" className="relative" style={{ height: "450vh" }} data-hero="scroll">
      <SkipHero />
      <div className="sticky overflow-hidden" style={STAGE}>
        <HeroProgressContext.Provider value={source}>
          <RoomScene mode="scroll" renderer="webgl" />
        </HeroProgressContext.Provider>
        <Hint visible={hint} />
        <HeroTitle on={title} onNeedLight={lightEverything} />
      </div>
    </section>
  );
}

/* ───────────── static (reduced motion / הכול דלוק) ───────────── */

function StaticHero() {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 768px)");
    const on = () => setWide(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  const all = useMemo(() => new Set<LightId>(LIGHTS.map((l) => l.id)), []);
  return (
    <section aria-label="פתיח" className="relative" data-hero="static">
      <SkipHero />
      {wide ? (
        <div className="relative overflow-hidden" style={{ height: "calc(100dvh - var(--header-h))" }}>
          <RoomScene mode="static" />
          <HeroTitle on instant />
        </div>
      ) : (
        <>
          <div className="relative aspect-[3/2] w-full overflow-hidden">
            <RoomScene mode="static" className="absolute inset-0" />
          </div>
          <div className="container-x mt-6"><CaptionList lit={all} instant /></div>
          <HeroTitle on instant overlay={false} />
        </>
      )}
    </section>
  );
}

/* ───────────── video (low power / narrow / no WebGL) ───────────── */

function VideoHero() {
  const [wide, setWide] = useState(false);
  const [lit, setLit] = useState<ReadonlySet<LightId>>(new Set());
  const [title, setTitle] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 768px)");
    const on = () => setWide(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  // The 6 s clock for the stacked list (the pinned captions inside RoomScene follow the video itself).
  useEffect(() => {
    const t0 = performance.now();
    const id = window.setInterval(() => {
      const time = ((performance.now() - t0) / 1000) % 6;
      const next = new Set<LightId>();
      for (const l of LIGHTS) if (time >= AUTO_TIMES[l.id]) next.add(l.id);
      setLit((prev) => (prev.size === next.size ? prev : next));
      if (time >= AUTO_TIMES.floor + 0.2) setTitle(true);
    }, 100);
    return () => window.clearInterval(id);
  }, []);
  return (
    <section aria-label="פתיח" className="relative" data-hero="video">
      <SkipHero />
      {wide ? (
        <div className="relative overflow-hidden" style={{ height: "calc(100dvh - var(--header-h))" }}>
          <RoomScene mode="auto" renderer="video" />
          <HeroTitle on={title} />
        </div>
      ) : (
        <>
          <div className="relative aspect-[3/2] w-full overflow-hidden">
            <RoomScene mode="auto" renderer="video" className="absolute inset-0" />
          </div>
          <div className="container-x mt-6"><CaptionList lit={lit} /></div>
          <HeroTitle on={title} overlay={false} />
        </>
      )}
    </section>
  );
}

export function HeroScroll() {
  const reduced = useReducedMotion();
  const renderer = useHeroRenderer();
  if (reduced || renderer === "image") return <StaticHero />;
  if (renderer === "video" || renderer === "css") return <VideoHero />;
  if (renderer === "webgl") return <ScrollHero />;
  // Undecided (first paint): a dark stage, no layout jump at scroll 0.
  return (
    <section aria-label="פתיח" className="relative" data-hero="pending">
      <div className="relative bg-night" style={{ height: "calc(100dvh - var(--header-h))" }} />
    </section>
  );
}
