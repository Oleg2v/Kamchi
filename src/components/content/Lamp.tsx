"use client";
import type { CSSProperties } from "react";
import { FixtureArt } from "@/components/light/FixtureArt";
import { useStore } from "@/lib/store";
import type { Fixture } from "@/lib/types";

type Props = {
  fixture: Pick<Fixture, "art" | "type" | "name">;
  /** Switched on? "הכול דלוק" overrides to on. */
  lit?: boolean;
  /** Opacity of the silhouette while unlit. */
  offOpacity?: number;
  className?: string;
  style?: CSSProperties;
  cast?: boolean;
  suspension?: boolean;
};

/**
 * A fixture portrait for the content pages. It starts unlit (a readable silhouette on black)
 * and runs the 120 ms incandescent ramp when switched on; the cast light is drawn by FixtureArt.
 */
export function Lamp({ fixture, lit = false, offOpacity = 0.45, className = "", style, cast = true, suspension = true }: Props) {
  const allLit = useStore((s) => s.allLit);
  const on = lit || allLit;
  const frameStyle: CSSProperties = { ...({ "--off-opacity": offOpacity } as CSSProperties), ...style };
  if (!on) frameStyle.filter = "brightness(0.8) saturate(0.7)";
  return (
    <div className={`switch-on ${on ? "is-on" : ""} ${className}`} style={frameStyle} data-lit={on ? "1" : "0"}>
      <FixtureArt fixture={fixture} lit={on} cast={cast} suspension={suspension} className="max-h-full" />
    </div>
  );
}
