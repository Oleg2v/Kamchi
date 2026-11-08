"use client";
import { useTx } from "@/lib/i18n";

type Props = { on: boolean; onToggle: () => void; className?: string; id?: string };

/**
 * The product's switch: a rocker (down = on). role="switch", Space/Enter toggle
 * (native button), the label says what pressing it will do.
 */
export function PowerSwitch({ on, onToggle, className = "", id }: Props) {
  const t = useTx();
  const label = on ? t({ he: "כיבוי", en: "Switch off" }) : t({ he: "הדלקה", en: "Switch on" });
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`power-switch inline-flex items-center gap-3 text-start ${className}`}
      data-testid="power-switch"
    >
      <span aria-hidden className="rocker"><span className="rocker__thumb" /></span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm text-paper">{label}</span>
        <span className="font-mono text-[0.62rem] tracking-[0.16em] text-muted" dir="ltr">{on ? "ON" : "OFF"}</span>
      </span>
    </button>
  );
}
