"use client";
import type { Bi } from "@/lib/i18n";
import { useTx } from "@/lib/i18n";

export type DeskTab = "inbox" | "orders" | "projects" | "stock" | "log";

export const DESK_TABS: { id: DeskTab; label: Bi }[] = [
  { id: "inbox", label: { he: "בקשות", en: "Requests" } },
  { id: "orders", label: { he: "הזמנות", en: "Orders" } },
  { id: "projects", label: { he: "פרויקטים פתוחים", en: "Open projects" } },
  { id: "stock", label: { he: "מלאי וזמני אספקה", en: "Stock & lead times" } },
  { id: "log", label: { he: "יומן", en: "Log" } },
];

export const isDeskTab = (v: string | null | undefined): v is DeskTab => !!v && DESK_TABS.some((x) => x.id === v);

/** A row of tabs on a hairline. The active one carries a warm underline; counts sit in mono. */
export function DeskTabs({ tab, onChange, counts, hot, flash = false }: { tab: DeskTab; onChange: (t: DeskTab) => void; counts: Partial<Record<DeskTab, number>>; hot?: Partial<Record<DeskTab, boolean>>; flash?: boolean }) {
  const t = useTx();
  return (
    <div role="tablist" aria-label={t({ he: "אזורי השולחן", en: "Desk areas" })} className="no-scrollbar -mx-4 flex overflow-x-auto border-b hairline px-4 md:mx-0 md:px-0">
      {DESK_TABS.map((x) => {
        const on = x.id === tab;
        const n = counts[x.id];
        return (
          <button
            key={x.id}
            type="button"
            role="tab"
            id={`desk-tab-${x.id}`}
            aria-selected={on}
            aria-controls={`desk-panel-${x.id}`}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(x.id)}
            onKeyDown={(e) => {
              const idx = DESK_TABS.findIndex((y) => y.id === x.id);
              const forward = getComputedStyle(e.currentTarget).direction === "rtl" ? "ArrowLeft" : "ArrowRight";
              const dir = e.key === forward ? 1 : e.key === "ArrowLeft" || e.key === "ArrowRight" ? -1 : 0;
              if (!dir) return;
              e.preventDefault();
              const next = DESK_TABS[(idx + dir + DESK_TABS.length) % DESK_TABS.length];
              onChange(next.id);
              document.getElementById(`desk-tab-${next.id}`)?.focus();
            }}
            className={`relative shrink-0 whitespace-nowrap px-3 py-3 text-[0.88rem] transition-colors first:ps-0 ${on ? "text-paper" : "text-muted hover:text-paper"} ${flash && x.id === "inbox" ? "flash-warm" : ""}`}
            data-autopilot={`desk-tab:${x.id}`}
          >
            {t(x.label)}
            {typeof n === "number" && (
              <span className={`num ms-2 text-[0.7rem] ${hot?.[x.id] ? "text-glow" : "text-muted"}`} dir="ltr">{n}</span>
            )}
            {hot?.[x.id] && <span aria-hidden className="absolute top-2.5 -inset-inline-end-0.5 h-1.5 w-1.5 rounded-full bg-glow shadow-glow" />}
            {on && <span aria-hidden className="absolute inset-x-0 -bottom-px h-px bg-glow shadow-glow" />}
          </button>
        );
      })}
    </div>
  );
}
