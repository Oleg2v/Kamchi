"use client";
import { useEffect, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import { useInView } from "@/lib/hooks/useInView";
import { useStore } from "@/lib/store";
import { Glow, type GlowShape } from "./Glow";

type Props = {
  children: ReactNode;
  /** Controlled: on/off. When omitted, the element switches on as it scrolls into view. */
  on?: boolean;
  /** Delay before switching on (ms), for staggered rooms. */
  delay?: number;
  /** Also render a glow pool behind the content. */
  glow?: GlowShape | false;
  glowSize?: number;
  glowOffset?: { x?: string; y?: string };
  className?: string;
  style?: CSSProperties;
  as?: ElementType;
  /** Opacity while unlit (default 0.18). */
  offOpacity?: number;
  /** Light up on hover/focus too. */
  hover?: boolean;
  id?: string;
};

/**
 * Everything starts unlit. SwitchOn runs the 120 ms incandescent ramp —
 * never a fade — the first time the element is switched on.
 */
export function SwitchOn({ children, on, delay = 0, glow = false, glowSize, glowOffset, className = "", style, as: Tag = "div", offOpacity, hover = false, id }: Props) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const allLit = useStore((s) => s.allLit);
  const controlled = typeof on === "boolean";
  const target = controlled ? on : inView;
  const [lit, setLit] = useState(false);

  useEffect(() => {
    if (!target) { if (controlled) setLit(false); return; }
    if (delay <= 0) { setLit(true); return; }
    const t = setTimeout(() => setLit(true), delay);
    return () => clearTimeout(t);
  }, [target, delay, controlled]);

  const isOn = lit || allLit;
  return (
    <Tag
      ref={ref}
      id={id}
      className={`switch-on relative ${isOn ? "is-on" : ""} ${hover ? "lit-hover" : ""} ${className}`}
      style={{ ...(offOpacity !== undefined ? ({ "--off-opacity": offOpacity } as CSSProperties) : {}), ...style }}
      data-lit={isOn ? "1" : "0"}
    >
      {glow && isOn && <Glow shape={glow} size={glowSize} x={glowOffset?.x} y={glowOffset?.y} />}
      {children}
    </Tag>
  );
}
