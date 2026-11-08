"use client";
/**
 * /hero-capture — deterministic full-window render of the hero room for
 * scripts/record-hero-video.ts (and for eyeballing the shader).
 *
 *   ?p=0.37        scroll progress, ramps settled
 *   ?t=2.4         seconds into the auto sequence (mid-ramp frames)
 *   ?mode=static   everything on
 *
 * Exposes window.__heroSetTime(t) / __heroSetProgress(p) / __heroSetStatic(),
 * each resolving once the WebGL frame has been drawn and composited.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RoomSceneInternal, type CaptureSpec } from "@/components/hero/RoomScene";

declare global {
  interface Window {
    __heroSetTime?: (t: number) => Promise<number>;
    __heroSetProgress?: (p: number) => Promise<number>;
    __heroSetStatic?: () => Promise<number>;
    __heroFrames?: number;
  }
}

function parseSpec(search: string): CaptureSpec {
  const q = new URLSearchParams(search);
  if (q.get("mode") === "static") return { static: true };
  if (q.has("t")) return { t: Number(q.get("t")) || 0 };
  return { p: Number(q.get("p")) || 0 };
}

export default function HeroCapturePage() {
  const [spec, setSpec] = useState<CaptureSpec | null>(null);
  const [tick, setTick] = useState(0);
  const pending = useRef<((n: number) => void) | null>(null);
  const frames = useRef(0);

  // Bare stage: hide the chrome without touching other modules.
  useEffect(() => {
    setSpec(parseSpec(window.location.search));
    const hidden: HTMLElement[] = [];
    const hide = (el: Element | null) => {
      if (el instanceof HTMLElement) { el.style.setProperty("display", "none", "important"); hidden.push(el); }
    };
    hide(document.querySelector("header"));
    hide(document.querySelector("footer"));
    hide(document.querySelector('[role="note"]'));
    document.querySelectorAll("body > div.fixed, body div[aria-hidden].fixed").forEach(hide);
    document.querySelectorAll(".skip-link").forEach(hide);
    document.documentElement.style.cursor = "none";
    document.body.style.cursor = "none";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.dataset.heroCapture = "1";
    return () => {
      hidden.forEach((el) => el.style.removeProperty("display"));
      document.documentElement.style.cursor = "";
      document.body.style.cursor = "";
      document.documentElement.style.overflow = "";
      delete document.documentElement.dataset.heroCapture;
    };
  }, []);

  const request = useCallback((next: CaptureSpec) => {
    return new Promise<number>((resolve) => {
      pending.current = resolve;
      setSpec(next);
      setTick((n) => n + 1);
    });
  }, []);

  useEffect(() => {
    window.__heroSetTime = (t) => request({ t });
    window.__heroSetProgress = (p) => request({ p });
    window.__heroSetStatic = () => request({ static: true });
    return () => {
      delete window.__heroSetTime;
      delete window.__heroSetProgress;
      delete window.__heroSetStatic;
    };
  }, [request]);

  const onRendered = useCallback(() => {
    frames.current += 1;
    window.__heroFrames = frames.current;
    document.documentElement.dataset.heroReady = "1";
    const resolve = pending.current;
    if (resolve) {
      pending.current = null;
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(frames.current)));
    }
  }, []);

  const captureSpec = useMemo(() => spec ?? undefined, [spec]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 95, background: "#050505" }} data-tick={tick}>
      {captureSpec && (
        <RoomSceneInternal mode="scroll" capture={captureSpec} captions={false} onRendered={onRendered} tick={tick} className="h-full w-full" />
      )}
    </div>
  );
}
