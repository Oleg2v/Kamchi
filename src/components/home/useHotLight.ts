"use client";
import { useCallback, useState, type PointerEvent } from "react";
import { useStore } from "@/lib/store";

/**
 * Hover, focus and tap are switches. A mouse lights the element while it is
 * over it; a tap (or click, or Enter/Space on a button) pins it on and off,
 * so touch screens get the same light. "הכול דלוק" lights everything.
 */
export function useHotLight() {
  const allLit = useStore((s) => s.allLit);
  const [hot, setHot] = useState(false);
  const [pinned, setPinned] = useState(false);
  const toggle = useCallback(() => setPinned((v) => !v), []);
  const bind = {
    onPointerEnter: (e: PointerEvent) => { if (e.pointerType === "mouse") setHot(true); },
    onPointerLeave: (e: PointerEvent) => { if (e.pointerType === "mouse") setHot(false); },
    onFocus: () => setHot(true),
    onBlur: () => setHot(false),
  };
  return { lit: hot || pinned || allLit, pinned, toggle, bind };
}
