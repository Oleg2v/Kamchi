"use client";
import { ReactLenis, useLenis } from "lenis/react";
import { useEffect } from "react";
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

/** Lenis smooth scroll + GSAP ScrollTrigger bridge. Disabled under reduced motion. */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <ReactLenis root options={{ lerp: 0.09, smoothWheel: true, syncTouch: false, autoRaf: false }}>
      <Bridge />
      {children}
    </ReactLenis>
  );
}
