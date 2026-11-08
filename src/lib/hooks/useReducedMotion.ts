"use client";
import { useEffect, useState } from "react";
import { useStore } from "../store";

/** True when the OS asks for reduced motion OR the visitor pressed "הכול דלוק". */
export function useReducedMotion(): boolean {
  const allLit = useStore((s) => s.allLit);
  const [mq, setMq] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setMq(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return mq || allLit;
}

export function usePrefersReducedMotionOnly(): boolean {
  const [mq, setMq] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setMq(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return mq;
}
