"use client";
import { HeroScroll } from "@/components/hero/HeroScroll";
import { AiTeasers } from "./AiTeasers";
import { BrandWall } from "./BrandWall";
import { FeaturedStrip } from "./FeaturedStrip";
import { References } from "./References";
import { Showroom } from "./Showroom";
import { StudioPromise } from "./StudioPromise";

/** The home page: the room that lights up as you scroll, then the house itself. */
export function HomePage() {
  return (
    <>
      <HeroScroll />
      <div id="after-hero" tabIndex={-1} className="outline-none" />
      <BrandWall />
      <AiTeasers />
      <StudioPromise />
      <FeaturedStrip />
      <References />
      <Showroom />
    </>
  );
}
