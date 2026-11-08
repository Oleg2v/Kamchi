"use client";
import { HeroScroll } from "@/components/hero/HeroScroll";

export function HomePage() {
  return (
    <>
      <HeroScroll />
      <div id="after-hero" tabIndex={-1} className="outline-none" />
    </>
  );
}
