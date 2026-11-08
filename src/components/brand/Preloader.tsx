"use client";
import { useEffect, useState } from "react";
import { usePrefersReducedMotionOnly } from "@/lib/hooks/useReducedMotion";

/**
 * Under one second: a single filament warms up and becomes the logo.
 * Shown once per session; skipped entirely under prefers-reduced-motion.
 */
export function Preloader() {
  const reduced = usePrefersReducedMotionOnly();
  const [phase, setPhase] = useState<"idle" | "filament" | "logo" | "done">("idle");

  useEffect(() => {
    if (reduced) return;
    try {
      if (sessionStorage.getItem("kamchi-preloaded") === "1") return;
      sessionStorage.setItem("kamchi-preloaded", "1");
    } catch { /* private mode */ }
    setPhase("filament");
    const t1 = setTimeout(() => setPhase("logo"), 520);
    const t2 = setTimeout(() => setPhase("done"), 940);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [reduced]);

  if (phase === "idle" || phase === "done") return null;
  return (
    <div aria-hidden className="fixed inset-0 z-[100] grid place-items-center bg-night" style={{ opacity: phase === "logo" ? 1 : 1, transition: "opacity 200ms linear" }}>
      <div className="relative flex flex-col items-center gap-4">
        <svg width="160" height="90" viewBox="0 0 160 90" className="overflow-visible">
          <path
            d="M14 70 C 30 10, 44 10, 56 48 S 84 86, 98 36 S 126 8, 146 60"
            fill="none"
            stroke="rgb(var(--glow-rgb))"
            strokeWidth="2"
            strokeLinecap="round"
            pathLength={1}
            style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: "filament 700ms var(--ease-incandescent) forwards" }}
          />
        </svg>
        <div
          className="font-display text-paper text-3xl"
          style={{ opacity: phase === "logo" ? 1 : 0, animation: phase === "logo" ? "incandescent 120ms var(--ease-incandescent) forwards" : "none" }}
        >
          קמחי <span className="font-ui text-muted text-sm tracking-[0.18em] align-middle">תאורה</span>
        </div>
      </div>
    </div>
  );
}
