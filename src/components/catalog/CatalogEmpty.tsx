"use client";
import { useState } from "react";
import { LampFrame } from "./LampFrame";
import { getFixture } from "@/lib/data";
import { useTx } from "@/lib/i18n";

/** Nothing matched: one unlit lamp, display type, and the way back. The lamp lights when you reach for the button. */
export function CatalogEmpty({ onClear }: { onClear: () => void }) {
  const t = useTx();
  const [lit, setLit] = useState(false);
  const lamp = getFixture("artemide-ramo-tavolo");
  return (
    <div className="grid place-items-center py-16 text-center md:py-24" data-testid="catalog-empty">
      {lamp && <LampFrame fixture={lamp} lit={lit} offOpacity={0.5} className="mb-6 w-40 md:w-52" />}
      <h3 className="font-display text-3xl md:text-5xl">{t({ he: "כאן עדיין חשוך", en: "Still dark here" })}</h3>
      <p className="mt-4 max-w-md text-muted">{t({ he: "אף גוף תאורה לא עונה על הסינון הזה. אפשר להסיר חלק מהתנאים, או לנקות הכול ולהתחיל מחדש.", en: "No fixture matches this combination. Remove a condition or two, or clear everything and start again." })}</p>
      <button
        type="button"
        onClick={onClear}
        onPointerEnter={() => setLit(true)}
        onPointerLeave={() => setLit(false)}
        onFocus={() => setLit(true)}
        onBlur={() => setLit(false)}
        className="btn mt-8"
      >
        {t({ he: "ניקוי הסינון", en: "Clear filters" })}
      </button>
    </div>
  );
}
