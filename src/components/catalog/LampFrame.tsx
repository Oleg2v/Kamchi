"use client";
import type { CSSProperties } from "react";
import { FixtureArt } from "@/components/light/FixtureArt";
import { useStore } from "@/lib/store";
import type { Fixture } from "@/lib/types";

type Props = {
  fixture: Fixture;
  /** Switched on? "הכול דלוק" overrides to on. */
  lit?: boolean;
  /** Opacity of the silhouette while unlit (default 0.5 so the shape stays readable). */
  offOpacity?: number;
  /** Brightness of the silhouette while unlit; the global .switch-on default (0.35) hides glass bodies on black. */
  offBrightness?: number;
  className?: string;
  style?: CSSProperties;
  cast?: boolean;
  suspension?: boolean;
  artClassName?: string;
};

/**
 * A fixture portrait that starts unlit and runs the 120 ms incandescent ramp
 * when switched on. The ramp is CSS (.switch-on.is-on); the cast light is
 * drawn by FixtureArt itself.
 */
export function LampFrame({ fixture, lit = false, offOpacity = 0.5, offBrightness = 0.8, className = "", style, cast = true, suspension = true, artClassName = "" }: Props) {
  const allLit = useStore((s) => s.allLit);
  const on = lit || allLit;
  // Inline filter only while off: the incandescent keyframes (and "הכול דלוק") override it when on.
  const frameStyle: CSSProperties = { ...({ "--off-opacity": offOpacity } as CSSProperties), ...style };
  if (!on) frameStyle.filter = `brightness(${offBrightness}) saturate(0.7)`;
  return (
    <div
      className={`switch-on ${on ? "is-on" : ""} ${className}`}
      style={frameStyle}
      data-lit={on ? "1" : "0"}
    >
      <FixtureArt fixture={fixture} lit={on} cast={cast} suspension={suspension} className={`max-h-full ${artClassName}`} />
    </div>
  );
}
