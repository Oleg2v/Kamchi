"use client";
/** The showroom: 5,000 m² of light in Bnei Brak, a visit request and the club. */
import { useState, type FormEvent } from "react";
import { TransitionLink } from "@/components/brand/TransitionLink";
import { SwitchOn } from "@/components/light/SwitchOn";
import { Dialog } from "@/components/ui/Dialog";
import { useTx } from "@/lib/i18n";
import { ADDRESS } from "@/lib/i18n/common";
import { useStore } from "@/lib/store";
import { Arrow } from "./Arrow";

/** Opening hours; the time ranges are isolated (U+2066…U+2069) so bidi never flips "9:00–19:00". */
const HOURS = { he: "א׳–ה׳ \u20669:00–19:00\u2069 · ו׳ \u20669:00–13:00\u2069 (הדגמה)", en: "Sun–Thu 9:00–19:00 · Fri 9:00–13:00 (demo)" };

function VisitDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTx();
  const requestAppointment = useStore((s) => s.requestAppointment);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", when: "" });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    requestAppointment({ name: form.name.trim(), phone: form.phone.trim(), when: form.when || t({ he: "בתיאום טלפוני", en: "To be arranged by phone" }) });
    setDone(true);
  };
  const close = () => { onClose(); setTimeout(() => { setDone(false); setForm({ name: "", phone: "", when: "" }); }, 300); };
  return (
    <Dialog open={open} onClose={close} title={t({ he: "קבעו ביקור באולם", en: "Book a showroom visit" })}>
      {done ? (
        <div className="flash-warm border hairline p-5" role="status" aria-live="polite">
          <p className="font-display [&:lang(en)]:font-display-en text-2xl">{t({ he: "הבקשה התקבלה", en: "Request received" })}</p>
          <p className="mt-2 text-sm text-muted">{t({ he: "נחזור אליכם לתיאום. שעות האולם: ", en: "We'll call to arrange a time. Showroom hours: " })}<span className="font-mono text-xs">{t(HOURS)}</span></p>
          <button type="button" className="btn btn-sm mt-5" onClick={close}>{t({ he: "סגירה", en: "Close" })}</button>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          <p className="text-sm text-muted">{t(ADDRESS)}</p>
          <label className="grid gap-1.5 text-sm">
            <span>{t({ he: "שם", en: "Name" })}</span>
            <input className="field" required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span>{t({ he: "טלפון", en: "Phone" })}</span>
            <input className="field" required type="tel" inputMode="tel" autoComplete="tel" dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span>{t({ he: "מתי נוח לכם", en: "When suits you" })}</span>
            <input className="field font-mono" type="datetime-local" dir="ltr" value={form.when} onChange={(e) => setForm({ ...form, when: e.target.value })} />
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button type="submit" className="btn btn-primary">{t({ he: "שליחת בקשה", en: "Send request" })}</button>
            <span className="font-mono text-[0.68rem] text-muted">{t({ he: "הדגמה — הבקשה נשמרת בדפדפן בלבד", en: "Demo — the request is stored in this browser only" })}</span>
          </div>
        </form>
      )}
    </Dialog>
  );
}

export function Showroom() {
  const t = useTx();
  const [open, setOpen] = useState(false);
  return (
    <section className="container-x py-24 md:py-32" aria-labelledby="showroom-h">
      <div className="grid gap-12 md:grid-cols-[1.2fr_1fr] md:items-end">
        <SwitchOn offOpacity={0.12} glow="pool" glowSize={720} glowOffset={{ x: "40%", y: "92%" }}>
          <p className="eyebrow mb-3">{t({ he: "אולם התצוגה", en: "The showroom" })}</p>
          <h2 id="showroom-h" className="text-4xl leading-[1.05] md:text-5xl lg:text-6xl">
            <span className="num">5,000</span> {t({ he: "מ״ר של אור בבני ברק", en: "m² of light in Bnei Brak" })}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">
            {t({
              he: "כל הבתים דולקים זה לצד זה, בחללים שמדמים סלון, מטבח, חדר שינה וחדר רחצה. באים עם תוכנית, יוצאים עם רשימה.",
              en: "Every house lit side by side, in spaces that stand in for a living room, kitchen, bedroom and bathroom. Come with a plan, leave with a list.",
            })}
          </p>
          <p className="mt-5 text-paper">{t(ADDRESS)}</p>
          <p className="mt-1 font-mono text-xs text-muted">{t(HOURS)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>{t({ he: "קבעו ביקור", en: "Book a visit" })}</button>
            <TransitionLink href="/about" className="btn">{t({ he: "הסיפור של קמחי", en: "The Kamchi story" })}</TransitionLink>
          </div>
        </SwitchOn>
        <SwitchOn delay={200} offOpacity={0.12} className="panel p-6 md:p-8">
          <p className="eyebrow mb-3">{t({ he: "המועדון", en: "The club" })}</p>
          <p className="font-display [&:lang(en)]:font-display-en text-2xl leading-tight md:text-3xl">
            {t({ he: "כ-60 סטודיו במועדון האדריכלים והמעצבים", en: "About 60 studios in the architects' and designers' club" })}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {t({ he: "תנאי סטודיו, הצעות מחיר דרך הפורטל, ועדכוני אספקה בזמן אמת. היום זו רשימת שמות; כאן היא הופכת לשולחן עבודה.", en: "Studio terms, quotes through the portal and live delivery updates. Today it is a list of names; here it becomes a desk." })}
          </p>
          <TransitionLink href="/club" className="mt-6 inline-block font-mono text-[0.72rem] tracking-[0.14em] text-brass-light hover:text-glow">
            {t({ he: "למועדון", en: "To the club" })} <Arrow />
          </TransitionLink>
        </SwitchOn>
      </div>
      <VisitDialog open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
