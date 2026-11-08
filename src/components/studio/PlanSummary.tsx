"use client";
import { formatIls, useLang, useTx } from "@/lib/i18n";
import { BETA, SIMULATION } from "@/lib/i18n/common";
import type { LightingPlan } from "@/lib/types";

/** The attached AI lighting plan, folded to one line of numbers and its summary. */
export function PlanSummary({ plan }: { plan: LightingPlan }) {
  const t = useTx();
  const lang = useLang();
  const zones = plan.rooms.reduce((n, r) => n + r.zones.length, 0);
  const fixtures = plan.rooms.reduce((n, r) => n + r.zones.reduce((m, z) => m + z.qty, 0), 0);
  return (
    <aside className="border hairline px-4 py-3" aria-label={t({ he: "תוכנית תאורה מצורפת", en: "Attached lighting plan" })}>
      <p className="flex flex-wrap items-center gap-2 text-sm text-paper">
        {t({ he: "תוכנית תאורה מצורפת", en: "Lighting plan attached" })}
        <span className="badge-beta">{t(BETA)}</span>
        <span className="badge-beta">{t(SIMULATION)}</span>
      </p>
      <p className="num mt-1 text-xs text-muted" dir="ltr">
        {plan.rooms.length} {lang === "he" ? "חדרים" : "rooms"} · {zones} {lang === "he" ? "אזורים" : "zones"} · {fixtures} {lang === "he" ? "גופים" : "fixtures"} · {formatIls(plan.totalsIls, lang)}
      </p>
      <p className="mt-2 text-[0.8rem] leading-relaxed text-muted">{t(plan.summary)}</p>
    </aside>
  );
}
