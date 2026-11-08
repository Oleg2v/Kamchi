"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;
export function getGsap() {
  if (!registered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  return { gsap, ScrollTrigger };
}

/** The incandescent curve: fast rise, slight overshoot, settle. */
export const INCANDESCENT_EASE = "power4.out";
export const INCANDESCENT_MS = 120;
export const BLACKOUT_MS = 240;
