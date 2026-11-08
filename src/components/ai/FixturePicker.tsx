"use client";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { FixtureArt } from "@/components/light/FixtureArt";
import { FIXTURES } from "@/lib/data";
import { useLang, useTx } from "@/lib/i18n";
import { FIXTURE_TYPE_LABEL } from "@/lib/i18n/common";
import { FIXTURE_TYPES, type FixtureType } from "@/lib/types";
import { brandName } from "@/lib/ai/validate";

/**
 * Search + type chips over the catalogue; the chosen fixture is the lit one.
 * The grid is a single-select listbox with a roving tabindex: one Tab stop, arrows move
 * (and light) the selection, so a keyboard user is not walked through sixty tiles.
 */
export function FixturePicker({ value, onChange, id = "fixture-picker" }: { value: string; onChange: (id: string) => void; id?: string }) {
  const t = useTx();
  const lang = useLang();
  const [q, setQ] = useState("");
  const [type, setType] = useState<FixtureType | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const focusAfterChange = useRef(false);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return FIXTURES.filter((f) => (!type || f.type === type) && (!needle || `${f.name} ${f.nameHe} ${brandName(f.brand)} ${f.brand}`.toLowerCase().includes(needle)))
      .sort((a, b) => b.featured - a.featured || a.price - b.price);
  }, [q, type]);
  const selectedVisible = list.some((f) => f.id === value);

  // After an arrow key moved the selection, focus follows it.
  useEffect(() => {
    if (!focusAfterChange.current) return;
    focusAfterChange.current = false;
    const el = listRef.current?.querySelector<HTMLElement>('[role="option"][aria-selected="true"]');
    el?.focus();
    el?.scrollIntoView({ block: "nearest" });
  }, [value]);

  const onKey = (e: KeyboardEvent<HTMLLIElement>, idx: number) => {
    const cols = listRef.current ? getComputedStyle(listRef.current).gridTemplateColumns.split(" ").length : 3;
    const rtl = lang === "he";
    let next = idx;
    switch (e.key) {
      case "ArrowRight": next = rtl ? idx - 1 : idx + 1; break;
      case "ArrowLeft": next = rtl ? idx + 1 : idx - 1; break;
      case "ArrowDown": next = idx + cols; break;
      case "ArrowUp": next = idx - cols; break;
      case "Home": next = 0; break;
      case "End": next = list.length - 1; break;
      case "Enter": case " ": onChange(list[idx].id); e.preventDefault(); return;
      default: return;
    }
    e.preventDefault();
    next = Math.max(0, Math.min(list.length - 1, next));
    if (next !== idx) { focusAfterChange.current = true; onChange(list[next].id); }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="sr-only" htmlFor={`${id}-search`}>{t({ he: "חיפוש גוף תאורה", en: "Search fixtures" })}</label>
      <input id={`${id}-search`} type="search" value={q} onChange={(e) => setQ(e.target.value)} className="field placeholder:text-muted" placeholder={t({ he: "חיפוש לפי שם או מותג…", en: "Search by name or brand…" })} autoComplete="off" />
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t({ he: "סינון לפי סוג", en: "Filter by type" })}>
        <button type="button" className="chip" aria-pressed={type === null} onClick={() => setType(null)}>{t({ he: "הכול", en: "All" })}</button>
        {FIXTURE_TYPES.map((ft) => (
          <button key={ft} type="button" className="chip" aria-pressed={type === ft} onClick={() => setType(type === ft ? null : ft)}>{t(FIXTURE_TYPE_LABEL[ft])}</button>
        ))}
      </div>
      <ul
        ref={listRef}
        role="listbox"
        aria-label={t({ he: "גופי תאורה — חצים לדפדוף", en: "Fixtures — use the arrow keys" })}
        className="no-scrollbar grid max-h-[22rem] grid-cols-3 gap-px overflow-y-auto border hairline bg-ash/40 sm:grid-cols-4 lg:grid-cols-3"
      >
        {list.map((f, i) => {
          const on = f.id === value;
          const tabbable = selectedVisible ? on : i === 0;
          return (
            <li
              key={f.id}
              role="option"
              aria-selected={on}
              tabIndex={tabbable ? 0 : -1}
              onClick={() => onChange(f.id)}
              onKeyDown={(e) => onKey(e, i)}
              title={`${f.name} · ${brandName(f.brand)}`}
              className={`group flex cursor-pointer flex-col items-center gap-1 bg-night p-2 text-center transition-colors ${on ? "bg-charcoal" : "hover:bg-charcoal/60"}`}
            >
              <span className={`block w-full max-w-[5.5rem] ${on ? "" : "switch-on lit-hover is-on"}`} style={on ? undefined : ({ "--off-opacity": 0.55 } as React.CSSProperties)}>
                <FixtureArt fixture={f} lit={on} cast={on} />
              </span>
              <span className={`block w-full truncate text-[0.78rem] ${on ? "text-glow" : "text-paper"}`}>{lang === "he" ? f.nameHe : f.name}</span>
              <span className="block w-full truncate font-mono text-[0.62rem] tracking-wider text-muted" dir="ltr">{brandName(f.brand)}<span className="hidden sm:inline"> · {f.lumens} lm</span></span>
            </li>
          );
        })}
        {!list.length && <li className="col-span-full bg-night p-6 text-center text-sm text-muted">{t({ he: "אין גוף תאורה שמתאים לחיפוש.", en: "No fixture matches this search." })}</li>}
      </ul>
    </div>
  );
}
