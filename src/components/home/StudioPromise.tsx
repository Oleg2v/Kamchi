"use client";
/**
 * "הסטודיו ושולחן הפרויקטים" — the two-sided promise as one split card:
 * what the designer sends arrives at Kamchi's desk live, and what Kamchi
 * updates comes straight back to the studio.
 */
import { TransitionLink } from "@/components/brand/TransitionLink";
import { SwitchOn } from "@/components/light/SwitchOn";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useTx } from "@/lib/i18n";
import { PORTAL_NAV } from "@/lib/i18n/common";
import { selectOpenRequests, useStore } from "@/lib/store";
import { SectionHeading } from "./SectionHeading";

function Side({ eyebrow, title, lines, stat, statLabel }: { eyebrow: string; title: string; lines: string[]; stat?: number; statLabel: string }) {
  const hydrated = useHydrated();
  return (
    <div className="flex flex-col gap-5 p-6 md:p-9">
      <p className="eyebrow">{eyebrow}</p>
      <h3 className="font-display text-2xl md:text-3xl">{title}</h3>
      <ul className="space-y-2 text-sm leading-relaxed text-muted">
        {lines.map((l) => (
          <li key={l} className="flex gap-3">
            <span aria-hidden className="mt-[0.6em] h-px w-4 shrink-0 bg-brass" />
            <span>{l}</span>
          </li>
        ))}
      </ul>
      <p className="mt-auto flex items-baseline gap-2 font-mono text-xs text-muted">
        {hydrated ? <span className="num text-xl text-paper">{stat ?? 0}</span> : <span className="skeleton inline-block h-6 w-8 align-middle" aria-hidden />}
        <span>{statLabel}</span>
      </p>
    </div>
  );
}

export function StudioPromise() {
  const t = useTx();
  const hydrated = useHydrated();
  const open = useStore((s) => selectOpenRequests(s).length);
  const projects = useStore((s) => s.projects.length);
  return (
    <section className="container-x py-24 md:py-32" aria-labelledby="portal-h">
      <SectionHeading
        id="portal-h"
        eyebrow={t({ he: "למעצבים ולצוות", en: "For designers and the team" })}
        title={t({ he: "הסטודיו ושולחן הפרויקטים", en: "The studio and the project desk" })}
        lede={t({
          he: "שני צדדים של אותו פרויקט. המעצב בונה חדרים ומבקש הצעת מחיר; הבקשה מגיעה לשולחן של קמחי בזמן אמת, וכל עדכון — זמן אספקה, הצעה, סטטוס הזמנה — חוזר לסטודיו באותו רגע.",
          en: "Two sides of the same project. The designer builds rooms and asks for a quote; the request lands on Kamchi's desk live, and every update — lead time, quote, order status — returns to the studio the same moment.",
        })}
      />
      <SwitchOn className="mt-12" offOpacity={0.14} glow="wash" glowSize={560} glowOffset={{ x: "50%", y: "50%" }}>
        <div className="panel relative grid md:grid-cols-[1fr_auto_1fr]">
          <Side
            eyebrow={t(PORTAL_NAV.studio.label)}
            title={t({ he: "צד המעצב", en: "The designer's side" })}
            lines={[
              t({ he: "פרויקטים לפי חדרים, עם כמויות ומחירי הדגמה", en: "Projects by room, with quantities and demo prices" }),
              t({ he: "בקשת הצעת מחיר בלחיצה אחת, והצעה חתומה כ-PDF", en: "A quote request in one click, and a signed quote as PDF" }),
              t({ he: "סטטוס הזמנה: הוזמן באיטליה, בדרך, במחסן, סופק", en: "Order status: ordered in Italy, in transit, in warehouse, delivered" }),
            ]}
            stat={hydrated ? projects : undefined}
            statLabel={t({ he: "פרויקטים פעילים בדמו", en: "active projects in the demo" })}
          />
          <div className="relative hidden w-px md:block" aria-hidden>
            <div className="brass-line absolute inset-y-6 w-px" />
            <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-glow shadow-glow animate-pulse-dot" />
          </div>
          <div className="relative h-px md:hidden" aria-hidden>
            <div className="brass-rule" />
          </div>
          <Side
            eyebrow={t(PORTAL_NAV.desk.label)}
            title={t({ he: "צד קמחי", en: "Kamchi's side" })}
            lines={[
              t({ he: "בקשות להצעת מחיר נכנסות חיות, בלי אימייל", en: "Quote requests arrive live, no email in between" }),
              t({ he: "עדכון זמני אספקה ומלאי מתוך הדף של הגוף", en: "Lead times and stock updated from the fixture's page" }),
              t({ he: "הנחת סטודיו וסטטוס הזמנה מתעדכנים אצל המעצב מיד", en: "Studio discount and order status update at the designer's end instantly" }),
            ]}
            stat={hydrated ? open : undefined}
            statLabel={t({ he: "בקשות פתוחות עכשיו", en: "requests open right now" })}
          />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <TransitionLink href="/live" className="btn btn-primary">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-night animate-pulse-dot" />
            {t(PORTAL_NAV.live.label)}
          </TransitionLink>
          <TransitionLink href="/live?autopilot=1" className="btn">{t({ he: "הפעל הדגמה", en: "Run the demo" })}</TransitionLink>
          <p className="font-mono text-[0.7rem] text-muted">{t({ he: "שני הצדדים זה לצד זה, או בשני חלונות — מסונכרנים.", en: "Both sides side by side, or in two windows — in sync." })}</p>
        </div>
      </SwitchOn>
    </section>
  );
}
