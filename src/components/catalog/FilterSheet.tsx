"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { useTx } from "@/lib/i18n";
import { useTrapTab } from "./useTrapTab";

type Props = { open: boolean; onClose: () => void; onClear: () => void; count: number; activeCount: number; children: ReactNode };

/** Mobile filters: a full-height sheet at inline-start, native <dialog> (Esc closes, focus trapped). */
export function FilterSheet({ open, onClose, onClear, count, activeCount, children }: Props) {
  const t = useTx();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  useTrapTab(ref, open);
  const results = count === 1 ? t({ he: "הצגת גוף תאורה אחד", en: "Show 1 fixture" }) : t({ he: `הצגת ${count} גופי תאורה`, en: `Show ${count} fixtures` });
  return (
    <dialog
      ref={ref}
      className="catalog-sheet"
      aria-labelledby="catalog-sheet-title"
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      data-testid="filter-sheet"
    >
      <div className="flex items-center justify-between gap-4 border-b hairline px-5 py-4">
        <h2 id="catalog-sheet-title" className="font-display text-2xl">
          {t({ he: "סינון", en: "Filters" })}
          {activeCount > 0 && <span className="num ms-2 text-base text-glow">{activeCount}</span>}
        </h2>
        <button type="button" onClick={onClose} className="btn btn-sm">{t({ he: "סגירה", en: "Close" })}</button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">{children}</div>
      <div className="flex items-center gap-3 border-t hairline px-5 py-4">
        <button type="button" onClick={onClose} className="btn btn-primary flex-1">{results}</button>
        <button type="button" onClick={onClear} className="btn" disabled={activeCount === 0}>{t({ he: "ניקוי", en: "Clear" })}</button>
      </div>
    </dialog>
  );
}
