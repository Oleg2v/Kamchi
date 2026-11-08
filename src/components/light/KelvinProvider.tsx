"use client";
import { useEffect } from "react";
import { useStore, useModeStore, wireSync } from "@/lib/store";
import { dirOf } from "@/lib/i18n";

/**
 * Mirrors store state onto <html>: data-kelvin re-tints every glow,
 * data-all-lit lights everything, lang/dir follow the language.
 * Also hydrates the persisted store and wires cross-tab sync.
 */
export function KelvinProvider({ children }: { children: React.ReactNode }) {
  const kelvin = useStore((s) => s.kelvin);
  const allLit = useStore((s) => s.allLit);
  const lang = useStore((s) => s.lang);
  const dimmer = useStore((s) => s.dimmerCursor);

  useEffect(() => {
    useStore.persist.rehydrate();
    useModeStore.persist.rehydrate();
    wireSync();
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    el.dataset.kelvin = String(kelvin);
    el.dataset.allLit = allLit ? "1" : "0";
    el.dataset.dimmerCursor = dimmer ? "1" : "0";
    el.lang = lang;
    el.dir = dirOf(lang);
  }, [kelvin, allLit, lang, dimmer]);

  return <>{children}</>;
}
