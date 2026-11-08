"use client";
import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { useFinePointer } from "@/lib/hooks/useMedia";
import { usePrefersReducedMotionOnly } from "@/lib/hooks/useReducedMotion";

/**
 * Desktop cursor: a small dimmer knob. A soft lamp follows the pointer in screen blend,
 * brightening whatever sits underneath — photos, type, fixtures. Decorative only.
 */
export function DimmerCursor() {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotionOnly();
  const enabled = useStore((s) => s.dimmerCursor);
  const knob = useRef<HTMLDivElement>(null);
  const lamp = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fine || !enabled) return;
    let x = window.innerWidth / 2, y = window.innerHeight / 2, tx = x, ty = y, raf = 0, hot = false, down = false;
    const onMove = (e: PointerEvent) => {
      tx = e.clientX; ty = e.clientY;
      const el = e.target as HTMLElement | null;
      hot = !!el?.closest("a, button, [role=button], input, select, textarea, label, [data-cursor=hot]");
    };
    const onDown = () => { down = true; };
    const onUp = () => { down = false; };
    const loop = () => {
      x += (tx - x) * (reduced ? 1 : 0.22);
      y += (ty - y) * (reduced ? 1 : 0.22);
      if (knob.current) {
        knob.current.style.transform = `translate3d(${tx}px, ${ty}px, 0) translate(-50%, -50%) scale(${down ? 0.8 : hot ? 1.6 : 1})`;
        knob.current.dataset.hot = hot ? "1" : "0";
      }
      if (lamp.current) lamp.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${hot ? 1.25 : 1})`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [fine, enabled, reduced]);

  if (!fine || !enabled) return null;
  return (
    <>
      <div
        ref={lamp}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[70] h-[420px] w-[420px] rounded-full mix-blend-screen"
        style={{ background: "radial-gradient(closest-side, rgb(var(--glow-rgb) / 0.16), rgb(var(--glow-rgb) / 0.05) 45%, transparent 72%)", willChange: "transform" }}
      />
      <div
        ref={knob}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[71] h-5 w-5 rounded-full border border-brass data-[hot=1]:border-glow"
        style={{ willChange: "transform", transition: "border-color 150ms", boxShadow: "0 0 10px rgb(var(--glow-rgb) / 0.35)" }}
      >
        <span className="absolute left-1/2 top-[2px] h-[5px] w-[1.5px] -translate-x-1/2 bg-brass" />
      </div>
    </>
  );
}
