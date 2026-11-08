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
import type React from "react";
import { Filament } from "@/components/brand/Logo";
import { TransitionLink } from "@/components/brand/TransitionLink";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useLang, useTx } from "@/lib/i18n";
import { BRAND_NAME, TAGLINE } from "@/lib/i18n/common";
import { getGsap } from "@/lib/motion/gsap";
import { pageEnabled } from "@/lib/site";
import { CaptionLegend, NowLit } from "./Captions";
import { AUTO_OFF_AT, AUTO_TIMES, LIGHTS, TITLE_AT, type LightId } from "./light-controller";
import { HeroProgressContext, RoomSceneInternal, useHeroRenderer, type ProgressSource } from "./RoomScene";
import { computeHeroFrame, useElementSize, type HeroFrame } from "./use-cover-box";

const STAGE: CSSProperties = { top: "var(--header-h)", height: "calc(100dvh - var(--header-h))" };

/** Stage size → where the room and the title go. */
function useHeroFrame(ref: React.RefObject<HTMLElement | null>): HeroFrame | null {
  const size = useElementSize(ref);
  const lang = useLang();
  if (size.w <= 0) return null;
  return computeHeroFrame(size.w, size.h, lang === "he");
}

function HeroTitle({ on, instant = false, overlay = true, frame = null, onNeedLight }: { on: boolean; instant?: boolean; overlay?: boolean; frame?: HeroFrame | null; onNeedLight?: () => void }) {
  // Where the title has its own night (phones, the wide title column) it waits there unlit, then switches on.
  const ghost = !overlay || !!frame?.split;
  const t = useTx();
  const focusIn = () => { if (!on) onNeedLight?.(); };
  const split = overlay && !!frame?.split;
  // In the title column the text keeps to the site grid (the header's container edge) when there is room for it.
  let titleSize = overlay ? "clamp(3rem, 7.4vw, 9.2rem)" : "clamp(2.75rem, 12.5vw, 4rem)";
  let wrapper: React.CSSProperties | undefined;
  if (split && frame) {
    const stageW = frame.titleW + frame.w;
    const container = Math.min(stageW - 64, 1408);
    const padEnd = 56;
    const padStart = Math.max(32, Math.min((stageW - container) / 2, frame.titleW - padEnd - 460));
    const content = frame.titleW - padStart - padEnd;
    titleSize = `${Math.round(Math.min(147, content / 3.6))}px`;
    wrapper = { position: "absolute", top: 0, bottom: 0, [frame.titleSide]: 0, width: frame.titleW, paddingInlineStart: padStart, paddingInlineEnd: padEnd, paddingBottom: "11vh" };
  }
  return (
    <div
      className={split ? "pointer-events-none flex flex-col justify-end" : overlay ? "pointer-events-none absolute inset-x-0 bottom-0 pb-[max(6vh,4.75rem)]" : "pt-4"}
      style={wrapper}
    >
      {overlay && !split && (
        // Over the photograph the title gets a floor of night to stand on.
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%]"
          style={{ background: "linear-gradient(to top, rgb(5 5 5 / 0.92), rgb(5 5 5 / 0.55) 45%, rgb(5 5 5 / 0))", opacity: on ? 1 : 0, transition: `opacity ${on ? 240 : 80}ms linear` }}
        />
      )}
      <div className={split ? "" : "container-x relative"}>
        <div
          className={`switch-on ${on ? (instant ? "is-on-instant" : "is-on") : ""} w-fit max-w-full`}
          style={{ "--off-opacity": ghost ? 0.13 : 0 } as React.CSSProperties}
          data-on={on ? "1" : "0"}
        >
          <p className="eyebrow mb-3">{t(BRAND_NAME)} · {t({ he: "כ-80 שנה של אור", en: "About 80 years of light" })}</p>
          <h1
            className={`text-paper leading-[0.98] ${split ? "" : "md:whitespace-nowrap"}`}
            style={{ fontSize: titleSize, letterSpacing: "-0.01em", textShadow: split ? "none" : "0 2px 4px rgb(0 0 0 / 0.5), 0 6px 40px rgb(0 0 0 / 0.65)" }}
          >
            {t(TAGLINE)}
          </h1>
          <div className="pointer-events-auto mt-7 flex flex-wrap gap-2.5 sm:gap-3">
            <TransitionLink href={pageEnabled("/relight") ? "/relight" : "#ai"} className="btn btn-primary max-sm:px-4 max-sm:text-[0.88rem]" onFocus={focusIn}>
              {t({ he: "תאירו לי את הסלון", en: "Light my living room" })}
            </TransitionLink>
            <TransitionLink href={pageEnabled("/studio") ? "/studio" : "#portal"} className="btn max-sm:px-4 max-sm:text-[0.88rem]" onFocus={focusIn}>
              {t({ he: "אזור המעצבים", en: "Designers' area" })}
            </TransitionLink>
          </div>
          {overlay && !split && <CaptionLegend className="mt-6 hidden max-w-3xl md:block" />}
        </div>
      </div>
    </div>
  );
}

function Hint({ visible, frame = null }: { visible: boolean; frame?: HeroFrame | null }) {
  const t = useTx();
  const col: React.CSSProperties = frame?.split ? { [frame.titleSide]: 0, width: frame.titleW } : { left: 0, right: 0 };
  return (
    <div
      aria-hidden={!visible}
      className="pointer-events-none absolute bottom-[6vh] flex flex-col items-center gap-2"
      style={{ ...col, opacity: visible ? 1 : 0, transition: `opacity ${visible ? 300 : 80}ms linear` }}
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

const INTRO = { he: "פתיח", en: "Intro" };

function ScrollHero() {
  const t = useTx();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frame = useHeroFrame(stageRef);
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
    <section ref={sectionRef} aria-label={t(INTRO)} className="relative" style={{ height: "450vh" }} data-hero="scroll">
      <SkipHero />
      <div ref={stageRef} className="sticky overflow-hidden" style={STAGE}>
        <HeroProgressContext.Provider value={source}>
          <RoomSceneInternal mode="scroll" renderer="webgl" frame={frame} captionsDimmed={title && !frame?.split} />
        </HeroProgressContext.Provider>
        <Hint visible={hint} frame={frame} />
        <HeroTitle on={title} frame={frame} onNeedLight={lightEverything} />
      </div>
    </section>
  );
}

/* ───────────── phones: the room above, the title in the night below — one screen ───────────── */

function PhoneHero({ mode, lit, title }: { mode: "auto" | "static"; lit: ReadonlySet<LightId>; title: boolean }) {
  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100svh - var(--header-h))" }}>
      {/* The photograph takes what the title leaves: the title and both buttons always fit the first screen. */}
      <div className="relative w-full overflow-hidden" style={{ height: "min(120vw, max(14rem, calc(100svh - var(--header-h) - 15.5rem)))" }}>
        {/* Cropped to the kitchen side: the pendant over the table and both sconces stay in frame. */}
        <RoomSceneInternal mode={mode} renderer={mode === "auto" ? "video" : undefined} captions={false} anchorX={0.06} className="absolute inset-0" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-28" style={{ background: "linear-gradient(to top, var(--color-night), rgb(5 5 5 / 0))" }} />
        {mode === "auto" && <div className="container-x absolute inset-x-0 bottom-3"><NowLit lit={lit} /></div>}
      </div>
      <div className="flex flex-1 flex-col justify-end pb-14">
        <HeroTitle on={title} instant={mode === "static"} overlay={false} />
      </div>
    </div>
  );
}

/* ───────────── static (reduced motion / הכול דלוק) ───────────── */

/** These heroes mount on the client only (after renderer detection), so the first value is already right. */
function useWide(): boolean {
  const [wide, setWide] = useState(() => (typeof window === "undefined" ? true : window.matchMedia("(min-width: 768px)").matches));
  useEffect(() => {
    const m = window.matchMedia("(min-width: 768px)");
    const on = () => setWide(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return wide;
}

function StaticHero() {
  const t = useTx();
  const wide = useWide();
  const stageRef = useRef<HTMLDivElement>(null);
  const frame = useHeroFrame(stageRef);
  const all = useMemo(() => new Set<LightId>(LIGHTS.map((l) => l.id)), []);
  return (
    <section aria-label={t(INTRO)} className="relative" data-hero="static">
      <SkipHero />
      {wide ? (
        <div ref={stageRef} className="relative overflow-hidden" style={{ height: "calc(100dvh - var(--header-h))" }}>
          <RoomSceneInternal mode="static" frame={frame} captionsDimmed={!frame?.split} />
          <HeroTitle on instant frame={frame} />
        </div>
      ) : (
        <PhoneHero mode="static" lit={all} title />
      )}
    </section>
  );
}

/* ───────────── video (low power / narrow / no WebGL) ───────────── */

function VideoHero() {
  const t = useTx();
  const wide = useWide();
  const stageRef = useRef<HTMLDivElement>(null);
  const frame = useHeroFrame(stageRef);
  const [lit, setLit] = useState<ReadonlySet<LightId>>(new Set());
  const [title, setTitle] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  // Follow the video's own clock (falls back to a 6 s timer if it is not playing).
  useEffect(() => {
    const t0 = performance.now();
    const id = window.setInterval(() => {
      const v = sectionRef.current?.querySelector("video");
      const time = v && !v.paused && !v.error && v.readyState >= 2 ? v.currentTime % 6 : ((performance.now() - t0) / 1000) % 6;
      const next = new Set<LightId>();
      for (const l of LIGHTS) if (time >= AUTO_TIMES[l.id] && time < AUTO_OFF_AT) next.add(l.id);
      setLit((prev) => (prev.size === next.size ? prev : next));
      if (time >= AUTO_TIMES.floor + 0.2) setTitle(true);
    }, 100);
    return () => window.clearInterval(id);
  }, []);
  return (
    <section ref={sectionRef} aria-label={t(INTRO)} className="relative" data-hero="video">
      <SkipHero />
      {wide ? (
        <div ref={stageRef} className="relative overflow-hidden" style={{ height: "calc(100dvh - var(--header-h))" }}>
          <RoomSceneInternal mode="auto" renderer="video" frame={frame} captionsDimmed={title && !frame?.split} />
          <HeroTitle on={title} frame={frame} />
        </div>
      ) : (
        <PhoneHero mode="auto" lit={lit} title={title} />
      )}
    </section>
  );
}

export function HeroScroll() {
  const t = useTx();
  const reduced = useReducedMotion();
  const renderer = useHeroRenderer();
  if (reduced || renderer === "image") return <StaticHero />;
  if (renderer === "video" || renderer === "css") return <VideoHero />;
  if (renderer === "webgl") return <ScrollHero />;
  // Undecided (first paint): a dark stage, no layout jump at scroll 0.
  return (
    <section aria-label={t(INTRO)} className="relative" data-hero="pending">
      <div className="relative bg-night" style={{ height: "calc(100dvh - var(--header-h))" }} />
    </section>
  );
}
