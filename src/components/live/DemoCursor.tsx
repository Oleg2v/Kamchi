"use client";
import { useEffect, useRef } from "react";
import type { AutopilotEngine, AutopilotState } from "@/lib/autopilot";

type PopoverEl = HTMLDivElement & { showPopover?: () => void; hidePopover?: () => void };

/**
 * The autopilot's hand: a small dimmer knob with a brass ring. Position is written straight to
 * the element on every engine tick (no React state per frame); a ring pulses on every press.
 */
export function DemoCursor({ engine, state }: { engine: AutopilotEngine; state: AutopilotState }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = state.cursorVisible && state.status !== "idle";

  useEffect(() => engine.onCursor((x, y) => { const el = ref.current; if (el) el.style.transform = `translate3d(${x}px, ${y}px, 0)`; }), [engine]);
  useEffect(() => {
    engine.attachCursor(ref.current);
    return () => engine.attachCursor(null);
  }, [engine]);
  useEffect(() => {
    const el = ref.current as PopoverEl | null;
    if (!el || typeof el.showPopover !== "function") return;
    try {
      const open = el.matches(":popover-open");
      if (visible && !open) el.showPopover();
      else if (!visible && open) el.hidePopover?.();
    } catch { /* not connected */ }
  }, [visible]);

  return (
    <div ref={ref} popover="manual" className="demo-cursor" aria-hidden data-visible={visible ? "1" : "0"} data-autopilot-cursor>
      <div className="relative" style={{ transform: "translate(-50%, -50%)" }}>
        {state.pulse > 0 && <span key={state.pulse} className="demo-cursor__ring absolute left-1/2 top-1/2 h-11 w-11 rounded-full border border-glow" />}
        <svg width="36" height="36" viewBox="0 0 36 36" className="transition-transform duration-150" style={{ transform: state.pressing ? "scale(0.82)" : "scale(1)", filter: "drop-shadow(0 0 10px rgb(var(--glow-rgb) / 0.55))" }}>
          <circle cx="18" cy="18" r="14.5" fill="rgb(5 5 5 / 0.82)" stroke="#B8955B" strokeWidth="1.5" />
          <circle cx="18" cy="18" r="10.5" fill="none" stroke="rgb(var(--glow-rgb) / 0.35)" strokeWidth="0.8" />
          <line x1="18" y1="5.5" x2="18" y2="10.5" stroke="rgb(var(--glow-rgb))" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="18" cy="18" r={state.pressing ? 5 : 3} fill="rgb(var(--glow-rgb))" />
        </svg>
      </div>
    </div>
  );
}
