"use client";
import { useTx } from "@/lib/i18n";
import { DEMO_BADGE } from "@/lib/i18n/common";

/** Demo hygiene: always visible, never mistaken for the real site. */
export function DemoBadge() {
  const t = useTx();
  return (
    <div
      role="note"
      className="fixed bottom-3 start-3 z-[80] max-w-[calc(100vw-1.5rem)] border border-brass/70 bg-night/85 backdrop-blur px-3 py-1.5 font-mono text-[0.66rem] tracking-wide text-brass-light"
    >
      {t(DEMO_BADGE)}
    </div>
  );
}
