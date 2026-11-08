"use client";
import "./content.css";
import { TransitionLink } from "@/components/brand/TransitionLink";
import { SwitchOn } from "@/components/light/SwitchOn";
import { PageHeader } from "@/components/ui/PageHeader";
import { useLang, useTx, type Bi } from "@/lib/i18n";
import { PORTAL_NAV } from "@/lib/i18n/common";
import { ClubWall } from "./ClubWall";

const BENEFITS: { title: Bi; body: Bi }[] = [
  {
    title: { he: "הצעות מחיר חיות", en: "Live quotes" },
    body: { he: "בוחרים גופים לפי חדרים, מבקשים הצעה — והיא חוזרת לפורטל בתנאי הסטודיו, עם PDF להורדה.", en: "Pick fixtures by room, ask for a quote, and it comes back to the portal on studio terms, with a PDF to download." },
  },
  {
    title: { he: "זמני אספקה והזמנות", en: "Lead times and orders" },
    body: { he: "מלאי בבני ברק, מה הוזמן באיטליה ומה בדרך — לכל פריט בפרויקט, בלי טלפון.", en: "Stock in Bnei Brak, what was ordered in Italy and what is in transit, for every item in the project, without a phone call." },
  },
  {
    title: { he: "קבצי מפרט ו-IES/DWG", en: "Spec sheets and IES/DWG" },
    body: { he: "דף מפרט, קובץ פוטומטרי ובלוק DWG לכל גוף, מוכנים לתוכנית.", en: "A spec sheet, a photometric file and a DWG block for every fixture, ready for the drawing." },
  },
];

export function ClubPage() {
  const t = useTx();
  const lang = useLang();
  const he = lang === "he";
  return (
    <>
      <PageHeader
        eyebrow={t({ he: "המועדון", en: "The club" })}
        title={t({ he: "מועדון האדריכלים והמעצבים", en: "The architects\u2019 and designers\u2019 club" })}
        lede={t({
          he: "כשישים סטודיו עובדים עם קמחי בתנאי סטודיו. היום המועדון הוא רשימת שמות בעמוד. ההצעה: כל שם נדלק — ונהפך לשולחן עבודה.",
          en: "About sixty studios work with Kamchi on studio terms. Today the club is a list of names on a page. The proposal: every name lights up, and becomes a desk.",
        })}
        actions={
          <>
            <TransitionLink href={PORTAL_NAV.studio.href} className="btn btn-primary" data-testid="cta-studio">{t({ he: "כניסה לסטודיו", en: "Enter the studio" })}</TransitionLink>
            <TransitionLink href={PORTAL_NAV.live.href} className="btn" data-testid="cta-live">{t(PORTAL_NAV.live.label)}</TransitionLink>
          </>
        }
      />

      <section className="container-x" aria-labelledby="premise-h">
        <h2 id="premise-h" className="sr-only">{t({ he: "היום וההצעה", en: "Today and the proposal" })}</h2>
        <div className="grid gap-px border-y hairline md:grid-cols-2">
          <SwitchOn offOpacity={0.14} className="py-8 md:pe-10 md:py-10">
            <p className="eyebrow mb-3">{t({ he: "היום", en: "Today" })}</p>
            <p className="font-display text-2xl leading-tight text-muted md:text-3xl">
              {t({ he: "רשימה של שמות. כל הצעת מחיר בטלפון, כל זמן אספקה בשאלה, כל קובץ במייל.", en: "A list of names. Every quote by phone, every lead time a question, every file by email." })}
            </p>
          </SwitchOn>
          <SwitchOn offOpacity={0.14} delay={180} glow="wash" glowSize={360} glowOffset={{ x: he ? "94%" : "6%", y: "50%" }} className="border-t hairline py-8 md:border-s md:border-t-0 md:ps-10 md:py-10">
            <p className="eyebrow mb-3">{t({ he: "ההצעה", en: "The proposal" })}</p>
            <p className="font-display text-2xl leading-tight text-paper md:text-3xl">
              {t({ he: "אותה רשימה, דולקת: כל סטודיו נכנס בשמו, רואה את הפרויקטים שלו, ומקבל תשובות בזמן אמת.", en: "The same list, lit: each studio enters under its name, sees its projects, and gets answers in real time." })}
            </p>
          </SwitchOn>
        </div>
      </section>

      <ClubWall />

      <section className="container-x pb-8 md:pb-12" aria-labelledby="benefits-h">
        <h2 id="benefits-h" className="sr-only">{t({ he: "מה חברי המועדון מקבלים", en: "What club members get" })}</h2>
        <ol className="grid gap-10 border-t hairline pt-10 md:grid-cols-3 md:gap-8 md:pt-14">
          {BENEFITS.map((b, i) => (
            <li key={b.title.en}>
              <SwitchOn offOpacity={0.14} delay={i * 120} glow="spot" glowSize={200} glowOffset={{ x: he ? "90%" : "10%", y: "4%" }}>
                <p className="num font-mono text-[0.7rem] tracking-[0.14em] text-brass-light" dir="ltr">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 font-display text-3xl leading-[1.08] md:text-4xl lg:text-[2.75rem]">{t(b.title)}</h3>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted md:text-base">{t(b.body)}</p>
              </SwitchOn>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-x pb-24 md:pb-32" aria-labelledby="join-h">
        <SwitchOn offOpacity={0.12} glow="pool" glowSize={720} glowOffset={{ x: "50%", y: "100%" }} className="border-t hairline pt-12 text-center md:pt-16">
          <h2 id="join-h" className="font-display text-4xl leading-[1.05] md:text-6xl">{t({ he: "השם שלכם כבר ברשימה.", en: "Your name is already on the list." })}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted md:text-lg">{t({ he: "בהדגמה אפשר להיכנס כאחד מששת הסטודיו הדולקים, או לצפות בשני הצדדים זה לצד זה במצב חי.", en: "In the demo you can enter as one of the six lit studios, or watch both sides at once in live mode." })}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <TransitionLink href={PORTAL_NAV.studio.href} className="btn btn-primary">{t({ he: "כניסה לסטודיו", en: "Enter the studio" })}</TransitionLink>
            <TransitionLink href={PORTAL_NAV.live.href} className="btn btn-brass">{t(PORTAL_NAV.live.label)}</TransitionLink>
          </div>
        </SwitchOn>
      </section>
    </>
  );
}
