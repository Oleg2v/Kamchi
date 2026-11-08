"use client";
import { FixtureArt } from "@/components/light/FixtureArt";
import { useStore } from "@/lib/store";
import type { Fixture } from "@/lib/types";

/**
 * A fixture portrait on black. Unlit until `lit` (hover/focus from the parent row),
 * then it runs the 120 ms incandescent ramp. "הכול דלוק" lights every thumbnail.
 */
export function FixtureThumb({ fixture, lit = false, className = "" }: { fixture: Fixture; lit?: boolean; className?: string }) {
  const allLit = useStore((s) => s.allLit);
  const on = lit || allLit;
  return (
    <div className={`relative overflow-hidden bg-night ${className}`} aria-hidden>
      <div className={on && !allLit ? "animate-incandescent" : ""}>
        <FixtureArt fixture={fixture} lit={on} cast suspension />
      </div>
    </div>
  );
}
