"use client";
/**
 * RoomScene — "the room that lights up".
 *
 * Public contract (scene-types.ts): <RoomScene mode="scroll|auto|static" progress? onFullyLit? compact? className? renderer?/>
 *
 * Renderers, chosen on the client:
 *   webgl  — RelightCanvas (depth-aware relighting of /hero/room.jpg), the default on capable devices
 *   video  — /hero/room-loop.(webm|mp4), for low-power devices, narrow viewports and no-WebGL browsers
 *   image  — /hero/room-lit.jpg, under prefers-reduced-motion or "הכול דלוק" (everything lit, instantly)
 *   css    — the photo under CSS glows, if the video assets cannot load
 *
 * Scroll progress reaches the scene through HeroProgressContext (a ref-based
 * source, no React state per tick) or, for other callers, the `progress` prop.
 */
import dynamic from "next/dynamic";
import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type MutableRefObject } from "react";
import { Glow } from "@/components/light/Glow";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useLowPower } from "@/lib/hooks/useMedia";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useTx } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Captions } from "./Captions";
import { FixtureOverlay } from "./FixtureOverlay";
import { AUTO_OFF_AT, AUTO_TIMES, HeroLightController, LIGHTS, SCENE, type LightId } from "./light-controller";
import type { RoomSceneMode, RoomSceneProps } from "./scene-types";
import { useCoverBox, type HeroFrame } from "./use-cover-box";

const RelightCanvas = dynamic(() => import("./RelightCanvas"), { ssr: false });

export const HERO_ASSETS = {
  poster: "/hero/room-lit.jpg",
  mp4: "/hero/room-loop.mp4",
  webm: "/hero/room-loop.webm",
};

/* ───────────── progress source (ref-based, no re-render per tick) ───────────── */

export interface ProgressSource {
  get(): number;
  subscribe(fn: (p: number) => void): () => void;
}
export const HeroProgressContext = createContext<ProgressSource | null>(null);

/* ───────────── renderer detection ───────────── */

export type HeroRenderer = "webgl" | "video" | "css" | "image";

function supportsWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    return !!gl;
  } catch {
    return false;
  }
}

/** Decides the hero renderer once on the client (null until decided). */
export function useHeroRenderer(override?: RoomSceneProps["renderer"]): HeroRenderer | null {
  const hydrated = useHydrated();
  const reduced = useReducedMotion();
  const lowPower = useLowPower();
  const [r, setR] = useState<HeroRenderer | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    if (reduced) { setR("image"); return; }
    if (override) { setR(override); return; }
    const narrow = window.innerWidth < 768;
    if (!supportsWebGL() || lowPower || narrow) { setR("video"); return; }
    setR("webgl");
  }, [hydrated, reduced, lowPower, override]);
  return r;
}

const ALL_IDS: ReadonlySet<LightId> = new Set(LIGHTS.map((l) => l.id));
const NONE: ReadonlySet<LightId> = new Set();

/* ───────────── internal component (capture + hero use the extras) ───────────── */

export interface CaptureSpec {
  /** Scroll progress, ramps settled. */
  p?: number;
  /** Seconds into the auto sequence (mid-ramp frames included). */
  t?: number;
  static?: boolean;
}

export interface RoomSceneInternalProps extends RoomSceneProps {
  /** Show the fixture captions (default: !compact). */
  captions?: boolean;
  /** Deterministic rendering for frame capture; forces the WebGL renderer. */
  capture?: CaptureSpec;
  /** Called after every WebGL frame (capture sync). */
  onRendered?: () => void;
  /** Re-render the overlays (capture reads live intensities). */
  tick?: number;
  controllerRef?: MutableRefObject<HeroLightController | null>;
  /** Where the photograph sits on the stage (hero: beside the title on wide screens). */
  frame?: HeroFrame | null;
  /** Fade the pinned captions out (the title has taken the stage). */
  captionsDimmed?: boolean;
  /** Horizontal crop anchor of the photograph (0 = left edge kept, 0.5 = centred). */
  anchorX?: number;
}

export function RoomSceneInternal({
  mode,
  progress,
  onFullyLit,
  compact = false,
  className = "",
  renderer: rendererProp,
  captions,
  capture,
  onRendered,
  controllerRef,
  frame = null,
  captionsDimmed = false,
  anchorX = 0.5,
}: RoomSceneInternalProps) {
  const t = useTx();
  const frameRef = useRef<HTMLDivElement>(null);
  const split = !!frame?.split && !compact;
  const box = useCoverBox(frameRef, SCENE.aspect, anchorX);
  const objectPosition = `${Math.round(anchorX * 100)}% 0`;
  const capturing = !!capture;
  const detected = useHeroRenderer(rendererProp);
  const [forced, setForced] = useState<HeroRenderer | null>(null);
  const renderer: HeroRenderer | null = capturing ? "webgl" : forced ?? detected;
  const reduced = useReducedMotion();
  const effectiveMode: RoomSceneMode = capturing ? mode : renderer === "image" || reduced ? "static" : mode;
  const source = useContext(HeroProgressContext);

  const ctrlRef = useRef<HeroLightController | null>(null);
  if (!ctrlRef.current) ctrlRef.current = new HeroLightController();
  const ctrl = ctrlRef.current;
  useEffect(() => {
    if (controllerRef) controllerRef.current = ctrl;
    return () => ctrl.reset();
  }, [ctrl, controllerRef]);

  // Lit set for the overlays — changes only on switch events (≤ 7 per sequence).
  const [lit, setLit] = useState<ReadonlySet<LightId>>(NONE);
  useEffect(
    () =>
      ctrl.onSwitch((id, on) =>
        setLit((prev) => {
          if (prev.has(id) === on) return prev;
          const next = new Set(prev);
          if (on) next.add(id); else next.delete(id);
          return next;
        }),
      ),
    [ctrl],
  );

  // onFullyLit — once.
  const fullyRef = useRef(onFullyLit);
  fullyRef.current = onFullyLit;
  const firedRef = useRef(false);
  useEffect(
    () =>
      ctrl.onFlags((f) => {
        if (f.fullyLit && !firedRef.current) { firedRef.current = true; fullyRef.current?.(); }
      }),
    [ctrl],
  );

  // Drive the controller by mode.
  useEffect(() => {
    if (!renderer) return;
    if (capture) {
      if (capture.static) ctrl.setStatic();
      else if (typeof capture.t === "number") ctrl.setTime(capture.t);
      else ctrl.setProgressSettled(capture.p ?? 0);
      return;
    }
    if (renderer === "video") return; // the clock below follows the video
    if (effectiveMode === "static") { ctrl.setStatic(); return; }
    if (effectiveMode === "auto") { ctrl.startAuto(); return () => ctrl.stopAuto(); }
    if (typeof progress === "number") { ctrl.setProgress(progress); return; }
    if (source) {
      ctrl.setProgress(source.get());
      return source.subscribe((p) => ctrl.setProgress(p));
    }
    ctrl.setProgress(0);
  }, [ctrl, renderer, effectiveMode, capture, progress, source]);

  // Video renderer: captions follow the 6 s loop.
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (renderer !== "video") return;
    const v = videoRef.current;
    const id = window.setInterval(() => {
      const time = v && !v.paused && !v.error ? v.currentTime : ((performance.now() / 1000) % 6);
      const next = new Set<LightId>();
      for (const l of LIGHTS) if (time >= AUTO_TIMES[l.id] && time < AUTO_OFF_AT) next.add(l.id);
      setLit((prev) => (prev.size === next.size && [...next].every((x) => prev.has(x)) ? prev : next));
      if (next.size === LIGHTS.length && !firedRef.current) { firedRef.current = true; fullyRef.current?.(); }
    }, 90);
    return () => window.clearInterval(id);
  }, [renderer]);

  useEffect(() => {
    if (renderer === "image" && !firedRef.current) { firedRef.current = true; fullyRef.current?.(); }
  }, [renderer]);

  const litEff = renderer === "image" ? ALL_IDS : lit;
  const instant = renderer === "image" || capturing || effectiveMode === "static";
  const showCaptions = captions ?? !compact;
  const label = t({ he: "סלון בפרויקט של קמחי תאורה, נדלק גוף אחרי גוף", en: "A living room from a Kamchi project, switching on one fixture at a time" });

  const placeholderStyle: CSSProperties = { objectPosition, filter: "brightness(0.07) saturate(0.6)" };

  const frameStyle: CSSProperties = split && frame
    ? { position: "absolute", top: 0, bottom: 0, left: frame.x, width: frame.w }
    : { position: "absolute", inset: 0 };
  const fadeW = split && frame ? Math.min(220, Math.round(frame.w * 0.14)) : 0;

  return (
    <div
      role="group"
      aria-label={label}
      className={cn("relative overflow-hidden bg-night", !compact && "h-full w-full", className)}
      style={compact ? { aspectRatio: "16 / 10" } : undefined}
      data-renderer={renderer ?? "pending"}
      data-lit={litEff.size}
      data-mode={effectiveMode}
    >
      <div ref={frameRef} style={frameStyle} className="overflow-hidden" data-frame={split ? "split" : "cover"}>
      {/* The room is dark before anything loads. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SCENE.image} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" style={placeholderStyle} />

      {renderer === "webgl" && box.w > 0 && (
        <RelightCanvas controller={ctrl} box={box} onRendered={onRendered} preserveDrawingBuffer={capturing} />
      )}

      {renderer === "video" && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={HERO_ASSETS.poster}
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition }}
        >
          <source src={HERO_ASSETS.webm} type="video/webm" />
          <source src={HERO_ASSETS.mp4} type="video/mp4" onError={() => setForced("css")} />
        </video>
      )}

      {renderer === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={HERO_ASSETS.poster}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition }}
          onError={() => setForced(supportsWebGL() ? "webgl" : "css")}
        />
      )}

      {renderer === "css" && box.w > 0 && (
        <div className="absolute" style={{ left: box.x, top: box.y, width: box.w, height: box.h }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SCENE.image} alt="" aria-hidden className="absolute inset-0 h-full w-full" style={{ filter: `brightness(${0.08 + 0.42 * (litEff.size / LIGHTS.length)})` }} />
          {LIGHTS.filter((l) => litEff.has(l.id)).map((l) => (
            <Glow key={l.id} shape={l.shape} size={Math.round(box.w * l.radius * 1.6)} x={`${l.lightPos.x * 100}%`} y={`${l.lightPos.y * 100}%`} opacity={0.9} />
          ))}
        </div>
      )}

      {renderer !== "video" && <FixtureOverlay box={box} lit={litEff} instant={instant} />}
      {split && frame && (
        // The room falls off into the night on the title's side.
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0"
          style={{
            width: fadeW,
            [frame.titleSide === "right" ? "right" : "left"]: 0,
            background: `linear-gradient(to ${frame.titleSide}, rgb(5 5 5 / 0), var(--color-night))`,
          }}
        />
      )}
      {showCaptions && renderer !== null && (
        <div
          className="pointer-events-none absolute inset-0 hidden md:block"
          style={{ opacity: captionsDimmed ? 0 : 1, transition: `opacity ${captionsDimmed ? 160 : 120}ms linear` }}
          aria-hidden={captionsDimmed || undefined}
        >
          <Captions box={box} lit={litEff} instant={instant} />
        </div>
      )}
      </div>
    </div>
  );
}

/** The contract component. */
export function RoomScene(props: RoomSceneProps) {
  return <RoomSceneInternal {...props} />;
}
