"use client";
import { useEffect, useId, useRef, useState } from "react";
import { formatIls, useLang, useTx } from "@/lib/i18n";

type Props = {
  min?: number;
  max?: number;
  bounds: { min: number; max: number };
  onChange: (min: number | undefined, max: number | undefined) => void;
};

const STEPS = 1000;

/** Two significant digits: 7490 → 7500, 45678 → 46000. Prices read clean along the whole track. */
function nice(n: number): number {
  if (n <= 0) return 0;
  const mag = Math.pow(10, Math.floor(Math.log10(n)) - 1);
  return Math.round(n / mag) * mag;
}

/**
 * Min/max fields plus a quiet dual-range slider on a logarithmic track
 * (the catalogue runs ₪390 → ₪98,000; linear would cram everything under ₪10k into a corner).
 */
export function PriceRange({ min, max, bounds, onChange }: Props) {
  const t = useTx();
  const lang = useLang();
  const id = useId();
  const lnMin = Math.log(bounds.min);
  const lnMax = Math.log(bounds.max);
  const toPrice = (v: number) => (v <= 0 ? bounds.min : v >= STEPS ? bounds.max : nice(Math.exp(lnMin + ((lnMax - lnMin) * v) / STEPS)));
  const toSlider = (p: number) => Math.round(((Math.log(Math.max(bounds.min, Math.min(bounds.max, p))) - lnMin) / (lnMax - lnMin)) * STEPS);

  const [lo, setLo] = useState(min ?? bounds.min);
  const [hi, setHi] = useState(max ?? bounds.max);
  const [loText, setLoText] = useState(String(min ?? ""));
  const [hiText, setHiText] = useState(String(max ?? ""));
  const lastSent = useRef<string>(`${min ?? ""}|${max ?? ""}`);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Follow external changes (chip removal, "ניקוי", back/forward).
  useEffect(() => {
    const key = `${min ?? ""}|${max ?? ""}`;
    if (key === lastSent.current) return;
    lastSent.current = key;
    setLo(min ?? bounds.min);
    setHi(max ?? bounds.max);
    setLoText(min === undefined ? "" : String(min));
    setHiText(max === undefined ? "" : String(max));
  }, [min, max, bounds.min, bounds.max]);

  const emit = (nextLo: number, nextHi: number, immediate = false) => {
    const m = nextLo <= bounds.min ? undefined : nextLo;
    const x = nextHi >= bounds.max ? undefined : nextHi;
    const key = `${m ?? ""}|${x ?? ""}`;
    if (timer.current) clearTimeout(timer.current);
    const go = () => { lastSent.current = key; onChange(m, x); };
    if (immediate) go(); else timer.current = setTimeout(go, 160);
  };

  const onLoSlide = (v: number) => {
    const p = Math.min(toPrice(v), hi);
    setLo(p); setLoText(p <= bounds.min ? "" : String(p));
    emit(p, hi);
  };
  const onHiSlide = (v: number) => {
    const p = Math.max(toPrice(v), lo);
    setHi(p); setHiText(p >= bounds.max ? "" : String(p));
    emit(lo, p);
  };
  const commitFields = () => {
    const l = loText.trim() === "" ? bounds.min : Math.max(0, Math.round(Number(loText.replace(/[^\d]/g, "")) || 0));
    const h = hiText.trim() === "" ? bounds.max : Math.max(0, Math.round(Number(hiText.replace(/[^\d]/g, "")) || 0));
    const nl = Math.min(l, h);
    const nh = Math.max(l, h);
    setLo(nl); setHi(nh);
    setLoText(nl <= bounds.min ? "" : String(nl));
    setHiText(nh >= bounds.max ? "" : String(nh));
    emit(nl, nh, true);
  };

  const loPct = (toSlider(lo) / STEPS) * 100;
  const hiPct = (toSlider(hi) / STEPS) * 100;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-[0.7rem] text-muted">
          <span>{t({ he: "מינימום", en: "Min" })}</span>
          <span className="relative">
            <span aria-hidden className="num pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted">₪</span>
            <input
              type="text"
              inputMode="numeric"
              className="field num min-h-0 py-2 ps-7 text-sm"
              placeholder={String(bounds.min)}
              value={loText}
              onChange={(e) => setLoText(e.target.value)}
              onBlur={commitFields}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitFields(); } }}
              aria-label={t({ he: "מחיר מינימלי", en: "Minimum price" })}
              dir="ltr"
            />
          </span>
        </label>
        <label className="flex flex-col gap-1 text-[0.7rem] text-muted">
          <span>{t({ he: "מקסימום", en: "Max" })}</span>
          <span className="relative">
            <span aria-hidden className="num pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted">₪</span>
            <input
              type="text"
              inputMode="numeric"
              className="field num min-h-0 py-2 ps-7 text-sm"
              placeholder={String(bounds.max)}
              value={hiText}
              onChange={(e) => setHiText(e.target.value)}
              onBlur={commitFields}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitFields(); } }}
              aria-label={t({ he: "מחיר מקסימלי", en: "Maximum price" })}
              dir="ltr"
            />
          </span>
        </label>
      </div>
      <div className="price-range" role="group" aria-labelledby={`${id}-lbl`}>
        <span id={`${id}-lbl`} className="sr-only">{t({ he: "טווח מחירים", en: "Price range" })}</span>
        <span aria-hidden className="price-range__track" />
        <span aria-hidden className="price-range__fill" style={{ insetInlineStart: `${loPct}%`, insetInlineEnd: `${100 - hiPct}%` }} />
        <input
          type="range" min={0} max={STEPS} step={1}
          value={toSlider(lo)}
          onChange={(e) => onLoSlide(Number(e.target.value))}
          aria-label={t({ he: "מחיר מינימלי", en: "Minimum price" })}
          aria-valuetext={formatIls(lo, lang)}
          aria-valuemin={bounds.min} aria-valuemax={bounds.max} aria-valuenow={lo}
          style={{ zIndex: lo >= hi ? 3 : 2 }}
        />
        <input
          type="range" min={0} max={STEPS} step={1}
          value={toSlider(hi)}
          onChange={(e) => onHiSlide(Number(e.target.value))}
          aria-label={t({ he: "מחיר מקסימלי", en: "Maximum price" })}
          aria-valuetext={formatIls(hi, lang)}
          aria-valuemin={bounds.min} aria-valuemax={bounds.max} aria-valuenow={hi}
          style={{ zIndex: 2 }}
        />
      </div>
      <p className="num flex justify-between text-[0.66rem] text-muted" dir="ltr">
        <span>{formatIls(lo, lang)}</span>
        <span>{formatIls(hi, lang)}</span>
      </p>
    </div>
  );
}
