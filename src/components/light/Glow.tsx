import type { CSSProperties } from "react";

export type GlowShape = "pool" | "cone" | "halo" | "wash" | "spot" | "diffuse";

type Props = {
  shape?: GlowShape;
  /** Diameter in px (height derived per shape). */
  size?: number;
  /** CSS position of the centre (default: centre of parent). */
  x?: string;
  y?: string;
  opacity?: number;
  className?: string;
  /** Animate the switch-on ramp on mount. */
  ramp?: boolean;
  style?: CSSProperties;
};

/**
 * Light as decoration: three layered radial gradients in screen blend,
 * tinted by --glow-rgb (the Kelvin control). Never a flat sprite.
 */
export function Glow({ shape = "halo", size = 240, x = "50%", y = "50%", opacity = 1, className = "", ramp = true, style }: Props) {
  const cls = shape === "diffuse" ? "glow--halo" : `glow--${shape}`;
  return (
    <span
      aria-hidden
      className={`glow ${cls} ${ramp ? "is-on switch-on" : ""} ${className}`}
      style={{ left: x, top: y, "--glow-size": `${size}px`, "--glow-opacity": opacity, ...style } as CSSProperties}
    />
  );
}
