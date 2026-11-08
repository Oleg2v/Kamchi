"use client";
import { useDeferredValue, useMemo, useState } from "react";
import { FixtureThumb } from "@/components/studio/FixtureThumb";
import { FIXTURES, getBrand } from "@/lib/data";
import { formatIls, useLang, useTx } from "@/lib/i18n";
import { FIXTURE_TYPE_LABEL, LEAD_TIME_LABEL } from "@/lib/i18n/common";
import { useStore } from "@/lib/store";
import type { Fixture, LeadTime } from "@/lib/types";

const LEAD_TIMES: LeadTime[] = ["stock", "weeks-2-4", "weeks-6-8", "weeks-10-12"];

function StockRow({ fixture }: { fixture: Fixture }) {
  const t = useTx();
  const lang = useLang();
  const stock = useStore((s) => s.stock[fixture.id] ?? fixture.stock);
  const leadTime = useStore((s) => s.leadTimes[fixture.id] ?? fixture.leadTime);
  const setStock = useStore((s) => s.setStock);
  const setLeadTime = useStore((s) => s.setLeadTime);
  const [lit, setLit] = useState(false);
  const brand = getBrand(fixture.brand);
  const name = lang === "he" ? fixture.nameHe : fixture.name;
  return (
    <tr
      className="align-middle"
      onPointerEnter={() => setLit(true)}
      onPointerLeave={() => setLit(false)}
      onFocusCapture={() => setLit(true)}
      onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setLit(false); }}
      data-autopilot={`stock:${fixture.id}`}
    >
      <td className="py-2 pe-3 ps-0">
        <div className="flex items-center gap-3">
          <FixtureThumb fixture={fixture} lit={lit} className="w-9 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm text-paper">{name}</p>
            <p className="truncate font-mono text-[0.64rem] uppercase tracking-wider text-muted" dir="ltr">{brand?.name ?? fixture.brand} · {fixture.name}</p>
          </div>
        </div>
      </td>
      <td className="hidden px-3 py-2 text-xs text-muted md:table-cell">{t(FIXTURE_TYPE_LABEL[fixture.type])}</td>
      <td className="num hidden px-3 py-2 text-end text-xs text-muted md:table-cell" dir="ltr">{formatIls(fixture.price, lang)}</td>
      <td className="px-3 py-2">
        <div className="inline-flex items-stretch border hairline" role="group" aria-label={`${t({ he: "מלאי", en: "Stock" })} — ${name}`}>
          <button type="button" className="px-2 text-muted hover:text-glow" aria-label={t({ he: "פחות יחידה במלאי", en: "One less in stock" })} onClick={() => setStock(fixture.id, stock - 1)}>−</button>
          <span className={`num min-w-9 border-x hairline px-2 py-1 text-center text-sm ${stock > 0 ? "text-paper" : "text-muted"}`} dir="ltr" aria-live="polite">{stock}</span>
          <button type="button" className="px-2 text-muted hover:text-glow" aria-label={t({ he: "עוד יחידה במלאי", en: "One more in stock" })} onClick={() => setStock(fixture.id, stock + 1)}>+</button>
        </div>
      </td>
      <td className="px-0 py-2 ps-3">
        <select
          className={`field min-h-8 w-full min-w-[8.5rem] py-1 text-[0.8rem] ${leadTime === "stock" ? "text-brass-light" : ""}`}
          value={leadTime}
          onChange={(e) => setLeadTime(fixture.id, e.target.value as LeadTime)}
          aria-label={`${t({ he: "זמן אספקה", en: "Lead time" })} — ${name}`}
        >
          {LEAD_TIMES.map((lt) => <option key={lt} value={lt}>{t(LEAD_TIME_LABEL[lt])}</option>)}
        </select>
      </td>
    </tr>
  );
}

/** Stock in Bnei Brak and the lead time per fixture. Every change lands on the designers' boards at once. */
export function StockTab() {
  const t = useTx();
  const [q, setQ] = useState("");
  const dq = useDeferredValue(q.trim().toLowerCase());
  const stock = useStore((s) => s.stock);
  const list = useMemo(() => {
    const all = [...FIXTURES].sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name));
    if (!dq) return all;
    return all.filter((f) => {
      const brand = getBrand(f.brand)?.name.toLowerCase() ?? "";
      return f.name.toLowerCase().includes(dq) || f.nameHe.includes(dq) || brand.includes(dq) || f.brand.includes(dq) || `${FIXTURE_TYPE_LABEL[f.type].he} ${FIXTURE_TYPE_LABEL[f.type].en}`.toLowerCase().includes(dq);
    });
  }, [dq]);
  const inStock = FIXTURES.filter((f) => (stock[f.id] ?? f.stock) > 0).length;

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="flex-1 md:max-w-sm">
          <span className="sr-only">{t({ he: "חיפוש גוף תאורה", en: "Search fixtures" })}</span>
          <input type="search" className="field min-h-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t({ he: "חיפוש לפי שם, מותג או סוג", en: "Search by name, brand or type" })} />
        </label>
        <p className="num text-xs text-muted">
          <span dir="ltr">{list.length} / {FIXTURES.length}</span> · <span dir="ltr">{inStock}</span> {t({ he: "במלאי בבני ברק", en: "in stock in Bnei Brak" })}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b hairline text-[0.7rem] text-muted">
              <th scope="col" className="py-2 pe-3 ps-0 text-start font-normal">{t({ he: "גוף תאורה", en: "Fixture" })}</th>
              <th scope="col" className="hidden px-3 py-2 text-start font-normal md:table-cell">{t({ he: "סוג", en: "Type" })}</th>
              <th scope="col" className="hidden px-3 py-2 text-end font-normal md:table-cell">{t({ he: "מחירון", en: "List" })}</th>
              <th scope="col" className="px-3 py-2 text-start font-normal">{t({ he: "מלאי", en: "Stock" })}</th>
              <th scope="col" className="px-0 py-2 ps-3 text-start font-normal">{t({ he: "זמן אספקה", en: "Lead time" })}</th>
            </tr>
          </thead>
          <tbody className="divide-y hairline">
            {list.map((f) => <StockRow key={f.id} fixture={f} />)}
            {list.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted">{t({ he: "לא נמצא גוף תאורה מתאים.", en: "No fixture matches." })}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
