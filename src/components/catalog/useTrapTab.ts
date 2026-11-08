"use client";
import { useEffect, type RefObject } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps Tab inside the nearest open <dialog>. A native modal dialog makes the
 * page inert, but Tab from its last control still leaves for the browser chrome;
 * this wraps it around instead (WAI-ARIA dialog pattern). Esc and backdrop clicks
 * stay native.
 */
export function useTrapTab(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const dialog = ref.current?.closest("dialog");
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (current === first || !dialog.contains(current))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (current === last || !dialog.contains(current))) { e.preventDefault(); first.focus(); }
    };
    dialog.addEventListener("keydown", onKey);
    return () => dialog.removeEventListener("keydown", onKey);
  }, [ref, active]);
}
