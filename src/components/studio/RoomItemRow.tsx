"use client";
import { useState } from "react";
import { getFixture } from "@/lib/data";
import { formatIls, useLang, useTx } from "@/lib/i18n";
import { FIXTURE_TYPE_LABEL } from "@/lib/i18n/common";
import { useStore } from "@/lib/store";
import type { RoomItem } from "@/lib/types";
import { FixtureThumb } from "./FixtureThumb";
import { OrderPipeline } from "./OrderPipeline";
import { brandLine, fixtureName, leadTimeText } from "./labels";

/**
 * One fixture on a room board: portrait (lit on hover), identity, quantity, live lead time,
 * the order pipeline once it is quoted, and the spec files. Read-only (the desk's view of a
 * designer's board) drops the controls and the file chips.
 */
export function RoomItemRow({ projectId, roomId, item, flash = false, readOnly = false }: { projectId: string; roomId: string; item: RoomItem; flash?: boolean; readOnly?: boolean }) {
  const t = useTx();
  const lang = useLang();
  const setItemQty = useStore((s) => s.setItemQty);
  const removeItem = useStore((s) => s.removeItem);
  const leadTime = useStore((s) => s.leadTimes[item.fixtureId]);
  const [lit, setLit] = useState(false);
  const f = getFixture(item.fixtureId);
  if (!f) return null;
  const lt = leadTime ?? f.leadTime;

  return (
    <li
      className={`grid grid-cols-[3.25rem_1fr] gap-x-4 gap-y-2 py-3.5 md:grid-cols-[3.25rem_1fr_auto] ${flash ? "flash-warm" : ""}`}
      onPointerEnter={() => setLit(true)}
      onPointerLeave={() => setLit(false)}
      onFocusCapture={() => setLit(true)}
      onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setLit(false); }}
      data-autopilot={`board-item:${item.fixtureId}`}
    >
      <FixtureThumb fixture={f} lit={lit} className="row-span-2 w-[3.25rem] self-start" />

      <div className="min-w-0">
        <p className="font-mono text-[0.66rem] uppercase tracking-wider text-muted">
          <span dir="ltr">{brandLine(f, lang)}</span>
        </p>
        <p className="truncate text-[0.98rem] text-paper">
          {fixtureName(f, lang)}
          <span className="ms-2 text-xs text-muted">{t(FIXTURE_TYPE_LABEL[f.type])}</span>
        </p>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[0.78rem]">
          <span className="num text-muted" dir="ltr">{f.lumens} lm · {f.kelvin.join("/")}K · {formatIls(f.price, lang)}</span>
          <span className={lt === "stock" ? "text-brass-light" : "text-muted"}>{leadTimeText(lt, f.brand, lang)}</span>
        </p>
        {item.note && <p className="mt-1 text-[0.78rem] text-muted">— {item.note}</p>}
      </div>

      <div className="col-start-2 flex items-center gap-2 justify-self-end md:col-start-auto md:self-start">
        {readOnly ? (
          <span className="num text-sm text-paper" dir="ltr">×{item.qty}</span>
        ) : (
          <>
            <div className="inline-flex items-stretch border hairline" role="group" aria-label={t({ he: "כמות", en: "Quantity" })}>
              <button type="button" className="lit-link px-2.5 text-muted" aria-label={t({ he: "הפחתת יחידה", en: "One less" })} onClick={() => setItemQty(projectId, roomId, item.id, item.qty - 1)}>−</button>
              <span className="num min-w-8 border-x hairline px-2 py-1 text-center text-sm" dir="ltr" aria-live="polite">{item.qty}</span>
              <button type="button" className="lit-link px-2.5 text-muted" aria-label={t({ he: "הוספת יחידה", en: "One more" })} onClick={() => setItemQty(projectId, roomId, item.id, item.qty + 1)}>+</button>
            </div>
            <button type="button" className="px-2 py-1 text-xs text-muted hover:text-paper" onClick={() => removeItem(projectId, roomId, item.id)}>
              {t({ he: "הסרה", en: "Remove" })}
            </button>
          </>
        )}
      </div>

      <div className="col-start-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 md:col-span-2">
        {item.orderStatus ? <OrderPipeline status={item.orderStatus} /> : <span className="text-[0.72rem] text-muted">{t({ he: "טרם הוזמן", en: "Not ordered yet" })}</span>}
        {!readOnly && (
          <ul className="flex items-center gap-1.5" aria-label={t({ he: "קבצי מפרט", en: "Spec files" })}>
            <li><a href={f.files.spec} download className="chip hover:text-paper">PDF</a></li>
            <li><a href={f.files.ies} download className="chip hover:text-paper">IES</a></li>
            <li><a href={f.files.dwg} download className="chip hover:text-paper">{t({ he: "DWG/DXF (הדגמה)", en: "DWG/DXF (demo)" })}</a></li>
          </ul>
        )}
      </div>
    </li>
  );
}
