"use client";
import { useEffect, useState } from "react";

export function useMedia(query: string, initial = false): boolean {
  const [v, setV] = useState(initial);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setV(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [query]);
  return v;
}

export const useIsDesktop = () => useMedia("(min-width: 1024px)");
export const useFinePointer = () => useMedia("(pointer: fine)");

/** Low-power heuristics: coarse pointer + few cores, or Save-Data, or battery saver hints. */
export function useLowPower(): boolean {
  const [low, setLow] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string }; deviceMemory?: number };
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const cores = navigator.hardwareConcurrency ?? 8;
    const mem = nav.deviceMemory ?? 8;
    const save = !!nav.connection?.saveData || /(^|-)2g/.test(nav.connection?.effectiveType ?? "");
    setLow(save || (coarse && (cores <= 4 || mem <= 4)) || window.innerWidth < 768);
  }, []);
  return low;
}
