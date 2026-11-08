"use client";
import { FixtureArt } from "@/components/light/FixtureArt";
import { SwitchOn } from "@/components/light/SwitchOn";
import { TransitionLink } from "@/components/brand/TransitionLink";
import { ZONE_LABEL } from "@/lib/ai/plan-rules";
import { brandName } from "@/lib/ai/validate";
import { getFixture } from "@/lib/data";
import { formatIls, useLang, useTx } from "@/lib/i18n";
import { DEMO_PRICE } from "@/lib/i18n/common";
import type { LightingPlan } from "@/lib/types";

/** The plan as a bill of materials, grouped by room, priced in demo ILS. */
export function ShoppingList({ plan }: { plan: LightingPlan }) {
  const t = useTx();
  const lang = useLang();
  return (
    <div className="flex flex-col gap-8">
      {plan.rooms.map((room, ri) => {
        const subtotal = room.zones.reduce((s, z) => s + z.qty * (getFixture(z.fixtureId)?.price ?? 0), 0);
        return (
          <section key={room.id} aria-labelledby={`room-${room.id}`}>
          <SwitchOn delay={ri * 90}>
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b hairline pb-2">
              <h3 id={`room-${room.id}`} className="font-display text-2xl">{lang === "he" ? room.label.he : room.label.en}</h3>
              <span className="font-mono text-[0.7rem] tracking-wider text-muted" dir="ltr">{room.areaM2} m² · {room.targetLux} lx</span>
            </div>
            <ul className="divide-y hairline">
              {room.zones.map((z, zi) => {
                const f = getFixture(z.fixtureId);
                if (!f) return null;
                return (
                  <li key={zi} className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 py-3 md:grid-cols-[4rem_minmax(0,1fr)_7rem_6rem_7rem] md:gap-5">
                    <span className="block w-14 md:w-16"><FixtureArt fixture={f} lit cast={false} suspension={f.type === "pendant" || f.type === "chandelier" || f.type === "linear"} /></span>
                    <div className="min-w-0">
                      <p className="truncate text-[0.95rem]">
                        <TransitionLink href={`/catalog/${f.slug}`} className="hover:text-glow">{lang === "he" ? f.nameHe : f.name}</TransitionLink>
                        <span className="ms-2 font-mono text-[0.66rem] tracking-wider text-muted">{brandName(f.brand)}</span>
                      </p>
                      <p className="mt-0.5 text-[0.8rem] text-muted"><span className="text-brass-light">{t(ZONE_LABEL[z.zone])}</span> · {t(z.note)}</p>
                      <p className="mt-1 font-mono text-[0.68rem] tracking-wider text-muted md:hidden" dir="ltr">{z.qty} × {formatIls(f.price, lang)}</p>
                    </div>
                    <span className="hidden font-mono text-[0.78rem] text-muted md:block" dir="ltr">{f.lumens} lm</span>
                    <span className="hidden font-mono text-[0.78rem] md:block" dir="ltr">{z.qty} × {formatIls(f.price, lang)}</span>
                    <span className="font-mono text-[0.9rem] text-paper md:text-end" dir="ltr">{formatIls(z.qty * f.price, lang)}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 flex justify-between font-mono text-[0.72rem] tracking-wider text-muted">
              <span>{t({ he: "סה״כ לחדר", en: "Room subtotal" })}</span>
              <span dir="ltr">{formatIls(subtotal, lang)}</span>
            </p>
          </SwitchOn>
          </section>
        );
      })}
      <div className="brass-rule" />
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-sm text-muted">{t({ he: `סה״כ ${plan.rooms.length} חדרים · ${t(DEMO_PRICE)} כולל מע״מ`, en: `${plan.rooms.length} rooms · ${t(DEMO_PRICE)}, incl. VAT` })}</p>
        <p className="font-mono text-3xl text-glow" dir="ltr">{formatIls(plan.totalsIls, lang)}</p>
      </div>
    </div>
  );
}
