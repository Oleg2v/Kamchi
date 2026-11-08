"use client";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { FIXTURES, getBrand } from "@/lib/data";
import { formatIls, useLang, useTx } from "@/lib/i18n";
import { FIXTURE_TYPE_LABEL, SPACE_LABEL } from "@/lib/i18n/common";
import { useStore } from "@/lib/store";
import { SPACES, type Fixture, type Space } from "@/lib/types";
import { FixtureThumb } from "./FixtureThumb";
import { brandLine, fixtureName, leadTimeText } from "./labels";
import { useTrapTab } from "./useTrapTab";

function PickCard({ fixture, onPick }: { fixture: Fixture; onPick: () => void }) {
  const t = useTx();
  const lang = useLang();
  const [lit, setLit] = useState(false);
  const leadTime = useStore((s) => s.leadTimes[fixture.id] ?? fixture.leadTime);
  const brand = getBrand(fixture.brand);
  return (
    <button
      type="button"
      onClick={onPick}
      onPointerEnter={() => setLit(true)}
      onPointerLeave={() => setLit(false)}
      onFocus={() => setLit(true)}
      onBlur={() => setLit(false)}
      className="lit-card grid gap-2 border hairline bg-night p-2 text-start"
      aria-label={`${t({ he: "הוספת", en: "Add" })} ${lang === "he" ? fixture.nameHe : fixture.name} — ${brand?.name ?? fixture.brand}`}
    >
      <FixtureThumb fixture={fixture} lit={lit} className="aspect-[200/260] w-full" />
      <div className="px-1 pb-1">
        <p className="font-mono text-[0.66rem] uppercase tracking-wider text-muted"><span dir="ltr">{brandLine(fixture, lang)}</span></p>
        <p className="lit-card__title text-sm text-paper">{fixtureName(fixture, lang)}</p>
        <p className="mt-1 flex items-baseline justify-between gap-2 text-[0.72rem] text-muted">
          <span>{t(FIXTURE_TYPE_LABEL[fixture.type])}</span>
          <span className="num" dir="ltr">{formatIls(fixture.price, lang)}</span>
        </p>
        <p className={`mt-0.5 text-[0.7rem] ${leadTime === "stock" ? "text-brass-light" : "text-muted"}`}>{leadTimeText(leadTime, fixture.brand, lang)}</p>
      </div>
    </button>
  );
}

/** Search by name / brand / type, filter by space, a grid of portraits that light on hover. */
export function FixturePicker({ open, onClose, roomName, onPick }: { open: boolean; onClose: () => void; roomName: string; onPick: (fixtureId: string) => void }) {
  const t = useTx();
  const lang = useLang();
  const [q, setQ] = useState("");
  const [space, setSpace] = useState<Space | null>(null);
  const dq = useDeferredValue(q.trim().toLowerCase());
  const bodyRef = useRef<HTMLDivElement>(null);
  useTrapTab(bodyRef, open);

  const list = useMemo(() => {
    return FIXTURES.filter((f) => {
      if (space && !f.spaces.includes(space)) return false;
      if (!dq) return true;
      const brand = getBrand(f.brand)?.name.toLowerCase() ?? "";
      const type = `${FIXTURE_TYPE_LABEL[f.type].he} ${FIXTURE_TYPE_LABEL[f.type].en}`.toLowerCase();
      return f.name.toLowerCase().includes(dq) || f.nameHe.includes(dq) || brand.includes(dq) || f.brand.includes(dq) || type.includes(dq) || f.tags.some((x) => x.includes(dq));
    }).sort((a, b) => b.featured - a.featured || a.price - b.price);
  }, [dq, space]);

  return (
    <Dialog open={open} onClose={onClose} wide title={<>{t({ he: "הוספת גוף תאורה", en: "Add a fixture" })} <span className="text-muted">· {roomName}</span></>}>
      <div ref={bodyRef} className="grid gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="flex-1">
            <span className="sr-only">{t({ he: "חיפוש", en: "Search" })}</span>
            <input
              type="search"
              className="field"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t({ he: "חיפוש לפי שם, מותג או סוג", en: "Search by name, brand or type" })}
              autoFocus
            />
          </label>
          <p className="font-mono text-xs text-muted" dir="ltr">{list.length} / {FIXTURES.length}</p>
        </div>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label={t({ he: "סינון לפי חלל", en: "Filter by space" })}>
          <button type="button" className="chip shrink-0" aria-pressed={space === null} onClick={() => setSpace(null)}>{t({ he: "כל החללים", en: "All spaces" })}</button>
          {SPACES.map((s) => (
            <button key={s} type="button" className="chip shrink-0" aria-pressed={space === s} onClick={() => setSpace(space === s ? null : s)}>
              {t(SPACE_LABEL[s])}
            </button>
          ))}
        </div>
        {list.length === 0 ? (
          <p className="py-10 text-center text-muted">{t({ he: "לא נמצא גוף תאורה מתאים. נסו חיפוש אחר.", en: "No fixture matches. Try another search." })}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-live="polite">
            {list.map((f) => (
              <li key={f.id}>
                <PickCard fixture={f} onPick={() => { onPick(f.id); onClose(); }} />
              </li>
            ))}
          </ul>
        )}
        <p className="font-mono text-[0.66rem] text-muted">{lang === "he" ? "מחירי הדגמה כולל מע״מ · זמני אספקה מתעדכנים משולחן הפרויקטים" : "Demo prices incl. VAT · lead times update from the project desk"}</p>
      </div>
    </Dialog>
  );
}
