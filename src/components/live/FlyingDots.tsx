"use client";
import { AnimatePresence, motion } from "framer-motion";

export interface Flight {
  id: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

/** A warm dot that leaves the designer's pane, crosses the brass line and lands in the desk inbox. */
export function FlyingDots({ flights, onDone }: { flights: Flight[]; onDone: (id: number) => void }) {
  return (
    <AnimatePresence>
      {flights.map((f) => {
        const mx = (f.from.x + f.to.x) / 2;
        const my = Math.min(f.from.y, f.to.y) - Math.min(120, Math.abs(f.to.x - f.from.x) * 0.18);
        return (
          <motion.span
            key={f.id}
            aria-hidden
            className="pointer-events-none fixed left-0 top-0 z-[110] h-3 w-3 rounded-full bg-glow"
            style={{ translate: "-50% -50%", boxShadow: "0 0 18px 5px rgb(var(--glow-rgb) / 0.65)" }}
            initial={{ x: f.from.x, y: f.from.y, opacity: 0, scale: 0.4 }}
            animate={{ x: [f.from.x, mx, f.to.x], y: [f.from.y, my, f.to.y], opacity: [0, 1, 1], scale: [0.4, 1, 1.25] }}
            transition={{ duration: 0.95, ease: "easeInOut", times: [0, 0.5, 1] }}
            exit={{ opacity: 0, scale: 2.4, transition: { duration: 0.4 } }}
            onAnimationComplete={() => onDone(f.id)}
          />
        );
      })}
    </AnimatePresence>
  );
}
