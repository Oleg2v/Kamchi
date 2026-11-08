"use client";
import { useTx } from "@/lib/i18n";
import { ORDER_STATUS_LABEL } from "@/lib/i18n/common";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

export const nextOrderStatus = (s: OrderStatus): OrderStatus | undefined => ORDER_STATUSES[ORDER_STATUSES.indexOf(s) + 1];

/**
 * Five small steps — quoted → ordered in Italy → in transit → in warehouse → delivered.
 * Only the current step is lit. The label repeats the state in words, never colour alone.
 */
export function OrderPipeline({ status, onAdvance, className = "" }: { status: OrderStatus; onAdvance?: () => void; className?: string }) {
  const t = useTx();
  const idx = ORDER_STATUSES.indexOf(status);
  const next = nextOrderStatus(status);
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 ${className}`}>
      <ol className="flex items-center" aria-label={t({ he: "מסלול ההזמנה", en: "Order pipeline" })}>
        {ORDER_STATUSES.map((s, i) => {
          const done = i < idx;
          const cur = i === idx;
          return (
            <li key={s} className="flex items-center" aria-current={cur ? "step" : undefined}>
              {i > 0 && <span aria-hidden className={`h-px w-4 ${i <= idx ? "bg-brass" : "bg-ash"}`} />}
              <span
                aria-hidden
                title={t(ORDER_STATUS_LABEL[s])}
                className={`block h-2 w-2 rounded-full ${cur ? "bg-glow shadow-[0_0_12px_rgb(var(--glow-rgb)/0.9)]" : done ? "bg-brass" : "border border-ash"}`}
              />
              <span className="sr-only">
                {t(ORDER_STATUS_LABEL[s])}
                {cur ? ` — ${t({ he: "השלב הנוכחי", en: "current step" })}` : ""}
              </span>
            </li>
          );
        })}
      </ol>
      <span className={`text-[0.78rem] ${status === "delivered" ? "text-muted" : "text-glow"}`}>{t(ORDER_STATUS_LABEL[status])}</span>
      {onAdvance && next && (
        <button type="button" onClick={onAdvance} className="btn btn-sm" title={t(ORDER_STATUS_LABEL[next])}>
          {t({ he: "קדם שלב", en: "Advance" })}
          <span className="font-mono text-[0.7rem] text-muted" aria-hidden>→</span>
          <span className="sr-only">{t({ he: "אל", en: "to" })} </span>
          <span className="text-[0.75rem] text-muted">{t(ORDER_STATUS_LABEL[next])}</span>
        </button>
      )}
    </div>
  );
}
