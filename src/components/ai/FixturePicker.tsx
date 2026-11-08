"use client";
import { useMemo, useState } from "react";
import { FixtureArt } from "@/components/light/FixtureArt";
import { FIXTURES } from "@/lib/data";
import { useLang, useTx } from "@/lib/i18n";
import { FIXTURE_TYPE_LABEL } from "@/lib/i18n/common";
import { FIXTURE_TYPES, type FixtureType } from "@/lib/types";
import { brandName } from "@/lib/ai/validate";

/** Search + type chips over the catalogue; the chosen fixture is the lit one. */
export function FixturePicker({ value, onChange, id = "fixture-picker" }: { value: string; onChange: (id: string) => void; id?: string }) {
  const t = useTx();
  const lang = useLang();
  const [q, setQ] = useState("");
  const [type, setType] = useState<FixtureType | null>(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return FIXTURES.filter((f) => (!type || f.type === type) && (!needle || `${f.name} ${f.nameHe} ${brandName(f.brand)} ${f.brand}`.toLowerCase().includes(needle)))
      .sort((a, b) => b.featured - a.featured || a.price - b.price);
  }, [q, type]);

  return (
    <div className="flex flex-col gap-3">
      <label className="sr-only" htmlFor={`${id}-search`}>{t({ he: "חיפוש גוף תאורה", en: "Search fixtures" })}</label>
      <input id={`${id}-search`} type="search" value={q} onChange={(e) => setQ(e.target.value)} className="field" placeholder={t({ he: "חיפוש לפי שם או מותג…", en: "Search by name or brand…" })} autoComplete="off" />
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t({ he: "סינון לפי סוג", en: "Filter by type" })}>
        <button type="button" className="chip" aria-pressed={type === null} onClick={() => setType(null)}>{t({ he: "הכול", en: "All" })}</button>
        {FIXTURE_TYPES.map((ft) => (
          <button key={ft} type="button" className="chip" aria-pressed={type === ft} onClick={() => setType(type === ft ? null : ft)}>{t(FIXTURE_TYPE_LABEL[ft])}</button>
        ))}
      </div>
      <ul className="no-scrollbar grid max-h-[22rem] grid-cols-3 gap-px overflow-y-auto border hairline bg-ash/40 sm:grid-cols-4 lg:grid-cols-3" aria-label={t({ he: "גופי תאורה", en: "Fixtures" })}>
        {list.map((f) => {
          const on = f.id === value;
          return (
            <li key={f.id} className="bg-night">
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onChange(f.id)}
                className={`group flex w-full flex-col items-center gap-1 p-2 text-center transition-colors ${on ? "bg-charcoal" : "hover:bg-charcoal/60"}`}
                title={`${f.name} · ${brandName(f.brand)}`}
              >
                <span className={`block w-full max-w-[5.5rem] ${on ? "" : "switch-on lit-hover is-on"}`} style={on ? undefined : ({ "--off-opacity": 0.55 } as React.CSSProperties)}>
                  <FixtureArt fixture={f} lit={on} cast={on} />
                </span>
                <span className={`block w-full truncate text-[0.78rem] ${on ? "text-glow" : "text-paper"}`}>{lang === "he" ? f.nameHe : f.name}</span>
                <span className="block w-full truncate font-mono text-[0.62rem] tracking-wider text-muted" dir="ltr">{brandName(f.brand)} · {f.lumens} lm</span>
              </button>
            </li>
          );
        })}
        {!list.length && <li className="col-span-full bg-night p-6 text-center text-sm text-muted">{t({ he: "אין גוף תאורה שמתאים לחיפוש.", en: "No fixture matches this search." })}</li>}
      </ul>
    </div>
  );
}
