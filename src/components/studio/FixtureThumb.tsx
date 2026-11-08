"use client";
import { FixtureArt } from "@/components/light/FixtureArt";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import type { Fixture } from "@/lib/types";

/**
 * A fixture portrait on black. Unlit until `lit` (hover/focus from the parent row),
 * then it runs the 120 ms incandescent ramp. "הכול דלוק" and prefers-reduced-motion
 * light every thumbnail at once, without the ramp.
 */
export function FixtureThumb({ fixture, lit = false, className = "" }: { fixture: Fixture; lit?: boolean; className?: string }) {
  const reduced = useReducedMotion();
  const on = lit || reduced;
  return (
    <div className={`relative overflow-hidden bg-night ${className}`} aria-hidden>
      <div className={on && !reduced ? "animate-incandescent" : ""}>
        <FixtureArt fixture={fixture} lit={on} cast suspension />
      </div>
    </div>
  );
}
