"use client";
import { useTx } from "@/lib/i18n";
import { DEMO_BADGE } from "@/lib/i18n/common";

/** Demo hygiene: always visible, never mistaken for the real site. */
export function DemoBadge() {
  const t = useTx();
  return (
    <aside
      aria-label={t({ he: "הודעת דמו", en: "Demo notice" })}
      className="fixed bottom-3 start-3 z-[80] max-w-[calc(100vw-1.5rem)] truncate border border-brass/70 bg-night/85 px-2.5 py-1 font-mono text-[0.58rem] tracking-normal text-brass-light backdrop-blur sm:px-3 sm:py-1.5 sm:text-[0.66rem] sm:tracking-wide"
    >
      {t(DEMO_BADGE)}
    </aside>
  );
}
