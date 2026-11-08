"use client";
import { useTx } from "@/lib/i18n";

type Props = { value: number; onChange: (n: number) => void; min?: number; max?: number; label?: string; size?: "sm" | "md"; id?: string };

/** Quantity as a physical stepper: minus · number · plus. */
export function QtyStepper({ value, onChange, min = 1, max = 99, label, size = "md", id }: Props) {
  const t = useTx();
  const set = (n: number) => onChange(Math.max(min, Math.min(max, Math.round(n) || min)));
  const h = size === "sm" ? "h-9" : "h-11";
  return (
    <div role="group" aria-label={label ?? t({ he: "כמות", en: "Quantity" })} className={`inline-flex items-stretch border hairline ${h}`}>
      <button type="button" onClick={() => set(value - 1)} disabled={value <= min} aria-label={t({ he: "פחות", en: "Fewer" })} className="num w-10 text-base text-muted hover:text-glow disabled:opacity-35 disabled:hover:text-muted">−</button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        aria-label={label ?? t({ he: "כמות", en: "Quantity" })}
        className="num w-12 border-x hairline bg-transparent text-center text-base [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button type="button" onClick={() => set(value + 1)} disabled={value >= max} aria-label={t({ he: "יותר", en: "More" })} className="num w-10 text-base text-muted hover:text-glow disabled:opacity-35 disabled:hover:text-muted">+</button>
    </div>
  );
}
