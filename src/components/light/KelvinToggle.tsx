"use client";
import { useStore } from "@/lib/store";
import { KELVINS, kelvinLabel } from "@/lib/light/kelvin";
import { useTx } from "@/lib/i18n";
import type { Kelvin } from "@/lib/types";

/** Light temperature is a UI control: re-tints every glow on the site. */
export function KelvinToggle({ compact = false }: { compact?: boolean }) {
  const kelvin = useStore((s) => s.kelvin);
  const setKelvin = useStore((s) => s.setKelvin);
  const lang = useStore((s) => s.lang);
  const t = useTx();
  return (
    <div role="radiogroup" aria-label={t({ he: "טמפרטורת אור", en: "Colour temperature" })} className="inline-flex items-stretch border hairline">
      {KELVINS.map((k) => {
        const on = k === kelvin;
        return (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={on}
            title={kelvinLabel(k as Kelvin, lang)}
            onClick={() => setKelvin(k as Kelvin)}
            className={`font-mono text-[0.72rem] tracking-wider ${compact ? "px-2 py-1" : "px-2.5 py-1.5"} transition-colors ${on ? "text-night bg-glow" : "text-muted hover:text-paper"}`}
          >
            {k}K
          </button>
        );
      })}
    </div>
  );
}
