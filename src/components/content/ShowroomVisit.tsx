"use client";
/**
 * "ביקור באולם" — address, hours (demo), a drawn floor plan (no map embeds)
 * and a short contact form. The form logs an appointment.requested event in
 * the shared demo store and shows a warm confirmation. Everything is a demo.
 */
import { useId, useState, type FormEvent } from "react";
import { SwitchOn } from "@/components/light/SwitchOn";
import { useInView } from "@/lib/hooks/useInView";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useTx } from "@/lib/i18n";
import { ADDRESS } from "@/lib/i18n/common";
import { useStore } from "@/lib/store";
import { SectionHead } from "./SectionHead";
import { ShowroomPlan } from "./ShowroomPlan";

function VisitForm() {
  const t = useTx();
  const logEvent = useStore((s) => s.logEvent);
  const id = useId();
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [sent, setSent] = useState<null | { name: string }>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const phone = form.phone.trim();
    const message = form.message.trim();
    if (!name || !phone) return;
    logEvent({
      actor: "designer",
      type: "appointment.requested",
      title: { he: `פנייה לביקור באולם — ${name}`, en: `Showroom visit enquiry — ${name}` },
      payload: { name, phone, message, source: "about" },
    });
    setSent({ name });
  };

  const reset = () => { setSent(null); setForm({ name: "", phone: "", message: "" }); };

  return (
    <div className="panel p-6 md:p-8" id="visit-form">
      <p className="eyebrow mb-2">{t({ he: "תיאום ביקור", en: "Book a visit" })}</p>
      <h3 className="font-display text-2xl leading-tight md:text-3xl">{t({ he: "בואו לראות את האור", en: "Come and see the light" })}</h3>
      <div aria-live="polite" role="status">
        {sent && (
          <div className="flash-warm mt-6 border hairline p-5" data-testid="visit-success">
            <p className="font-display text-2xl text-glow">{t({ he: "הפנייה התקבלה", en: "Enquiry received" })}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {t({ he: `תודה, ${sent.name}. נחזור אליכם לתיאום ביקור באולם.`, en: `Thank you, ${sent.name}. We will call to arrange a showroom visit.` })}
            </p>
            <p className="mt-3 font-mono text-[0.68rem] text-brass-light">{t({ he: "הדגמה — הפנייה נשמרת בדפדפן זה בלבד ואינה נשלחת לקמחי.", en: "Demo — the enquiry is stored in this browser only and is not sent to Kamchi." })}</p>
            <button type="button" className="btn btn-sm mt-5" onClick={reset}>{t({ he: "פנייה נוספת", en: "Another enquiry" })}</button>
          </div>
        )}
      </div>
      {!sent && (
        <form onSubmit={submit} className="mt-6 grid gap-4" aria-describedby={`${id}-demo`} data-testid="visit-form">
          <label className="grid gap-1.5 text-sm" htmlFor={`${id}-name`}>
            <span>{t({ he: "שם", en: "Name" })}</span>
            <input id={`${id}-name`} className="field" required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="grid gap-1.5 text-sm" htmlFor={`${id}-phone`}>
            <span>{t({ he: "טלפון", en: "Phone" })}</span>
            <input id={`${id}-phone`} className="field" required type="tel" inputMode="tel" autoComplete="tel" dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label className="grid gap-1.5 text-sm" htmlFor={`${id}-msg`}>
            <span>{t({ he: "הודעה", en: "Message" })} <span className="text-muted">({t({ he: "לא חובה", en: "optional" })})</span></span>
            <textarea id={`${id}-msg`} className="field min-h-28 resize-y" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={t({ he: "פרויקט, חדר, או גוף שראיתם בקטלוג", en: "A project, a room, or a piece you saw in the catalogue" })} />
          </label>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <button type="submit" className="btn btn-primary">{t({ he: "שליחת פנייה", en: "Send enquiry" })}</button>
            <span id={`${id}-demo`} className="font-mono text-[0.68rem] text-muted">{t({ he: "הדגמה — הפנייה נשמרת בדפדפן בלבד", en: "Demo — stored in this browser only" })}</span>
          </div>
        </form>
      )}
    </div>
  );
}

export function ShowroomVisit() {
  const t = useTx();
  const [planRef, planIn] = useInView<HTMLDivElement>({ threshold: 0.35 });
  const reduced = useReducedMotion();
  const planLit = planIn || reduced;

  return (
    <section className="container-x scroll-mt-24 py-20 md:py-28" id="visit" aria-labelledby="visit-h">
      <SectionHead
        id="visit-h"
        eyebrow={t({ he: "ביקור באולם", en: "Visiting the showroom" })}
        title={<><span className="num">5,000</span> {t({ he: "מ״ר דולקים", en: "m², switched on" })}</>}
        lede={t({
          he: "האולם בבני ברק עומד ליד מרכז העיצוב. באים עם תוכנית, הולכים בין החללים, ורואים כל גוף דולק במקומו.",
          en: "The showroom in Bnei Brak stands next to the Design Center. Come with a plan, walk between the rooms, and see every fixture lit in its place.",
        })}
      />

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        <div>
          <SwitchOn offOpacity={0.14} className="grid gap-6 border-t hairline pt-6 sm:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="eyebrow mb-2">{t({ he: "כתובת", en: "Address" })}</p>
              <p className="text-lg text-paper">{t(ADDRESS)}</p>
            </div>
            <div>
              <p className="eyebrow mb-2">{t({ he: "שעות פתיחה", en: "Opening hours" })} <span className="badge-beta ms-2 align-baseline">{t({ he: "הדגמה", en: "Demo" })}</span></p>
              <dl className="inline-grid grid-cols-[auto_auto] gap-x-5 gap-y-1 text-sm">
                <dt className="text-muted">{t({ he: "א׳–ה׳", en: "Sun–Thu" })}</dt>
                <dd className="num" dir="ltr">9:00–19:00</dd>
                <dt className="text-muted">{t({ he: "ו׳", en: "Fri" })}</dt>
                <dd className="num" dir="ltr">9:00–13:00</dd>
                <dt className="text-muted">{t({ he: "שבת", en: "Sat" })}</dt>
                <dd>{t({ he: "סגור", en: "Closed" })}</dd>
              </dl>
            </div>
          </SwitchOn>

          <div ref={planRef} className="relative mt-10 border hairline bg-night p-3 md:p-5" data-lit={planLit ? "1" : "0"} data-testid="showroom-plan">
            <ShowroomPlan lit={planLit} />
          </div>
          <p className="mt-3 flex flex-wrap items-baseline justify-between gap-2 font-mono text-[0.68rem] text-muted">
            <span>{t({ he: "תוכנית סכמטית של האולם — הדגמה, לא תוכנית מדידה.", en: "A schematic plan of the showroom — a demo, not a measured drawing." })}</span>
            <span className="text-brass-light">{t({ he: "ללא מפות מוטמעות", en: "No embedded maps" })}</span>
          </p>
        </div>

        <SwitchOn offOpacity={0.14} delay={160}>
          <VisitForm />
        </SwitchOn>
      </div>
    </section>
  );
}
