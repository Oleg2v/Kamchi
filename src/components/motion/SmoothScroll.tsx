"use client";
import { ReactLenis, useLenis } from "lenis/react";
import { useEffect, useMemo } from "react";
import { getGsap } from "@/lib/motion/gsap";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

function Bridge() {
  const lenis = useLenis();
  useEffect(() => {
    if (!lenis) return;
    const { gsap, ScrollTrigger } = getGsap();
    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(tick);
    };
  }, [lenis]);
  return null;
}

/**
 * Lenis smooth scroll + GSAP ScrollTrigger bridge.
 * Under reduced motion (or "הכול דלוק") Lenis stays mounted but behaves natively
 * (lerp 1, no wheel smoothing), so toggling never remounts the page or drops focus.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const options = useMemo(
    () => ({ lerp: reduced ? 1 : 0.09, smoothWheel: !reduced, syncTouch: false, autoRaf: false }),
    [reduced],
  );
  return (
    <ReactLenis root options={options}>
      <Bridge />
      {children}
    </ReactLenis>
  );
}
