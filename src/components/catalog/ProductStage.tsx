"use client";
import { useState, type CSSProperties } from "react";
import { Glow } from "@/components/light/Glow";
import { LampFrame } from "./LampFrame";
import { PowerSwitch } from "./PowerSwitch";
import { useTx } from "@/lib/i18n";
import { kelvinLabel, kelvinRgbString } from "@/lib/light/kelvin";
import { useStore } from "@/lib/store";
import type { Fixture, Kelvin } from "@/lib/types";

type Props = { fixture: Fixture; on: boolean; onToggle: () => void };

/** The product's own temperature closest to the site-wide control (a 2700/3000K piece at 4000K shows 3000K). */
function nearestKelvin(available: readonly Kelvin[], target: Kelvin): Kelvin {
  return [...available].sort((a, b) => Math.abs(a - target) - Math.abs(b - target) || a - b)[0] ?? target;
}

/**
 * The dark stage: the fixture large, a rocker under it, and the product's own
 * Kelvin chips. The chips re-tint only this stage (a local --glow-rgb override);
 * the site-wide control in the header is untouched.
 */
export function ProductStage({ fixture, on, onToggle }: Props) {
  const t = useTx();
  const lang = useStore((s) => s.lang);
  const globalK = useStore((s) => s.kelvin);
  const allLit = useStore((s) => s.allLit);
  const [localK, setLocalK] = useState<Kelvin | null>(null);
  const k: Kelvin = localK ?? nearestKelvin(fixture.kelvin, globalK);
  // "הכול דלוק" keeps the stage lit; prefers-reduced-motion only lights it initially (ProductPage), the rocker stays live.
  const lit = on || allLit;
  const stageStyle = { "--glow-rgb": kelvinRgbString(k) } as CSSProperties;

  return (
    <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
      <div
        className="relative aspect-[10/13] overflow-hidden border hairline bg-[#030303] sm:aspect-[4/5] lg:aspect-auto lg:h-[calc(100dvh-var(--header-h)-14rem)] lg:max-h-[52rem] lg:min-h-[30rem]"
        style={stageStyle}
        data-testid="stage"
        data-stage-kelvin={k}
        data-lit={lit ? "1" : "0"}
      >
        {lit && <Glow shape="pool" size={560} x="50%" y="94%" opacity={0.55} />}
        <LampFrame fixture={fixture} lit={lit} manual offOpacity={0.55} className="absolute inset-[6%] flex items-center justify-center" />
        <p className="pointer-events-none absolute start-4 top-4 font-mono text-[0.66rem] tracking-[0.16em] text-muted">
          <span dir="ltr">{k}K · {fixture.lumens} lm · CRI {fixture.cri}</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-x border-b hairline px-4 py-4 sm:px-5">
        <PowerSwitch on={on} onToggle={onToggle} forced={allLit} />
        <div role="group" aria-label={t({ he: "טמפרטורת צבע על הבמה", en: "Stage colour temperature" })} className="flex items-center gap-1.5" dir="ltr" data-testid="stage-kelvin">
          {fixture.kelvin.map((kk) => (
            <button
              key={kk}
              type="button"
              className="chip num"
              aria-pressed={kk === k}
              onClick={() => setLocalK(kk)}
              title={kelvinLabel(kk, lang)}
            >
              {kk}K
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
