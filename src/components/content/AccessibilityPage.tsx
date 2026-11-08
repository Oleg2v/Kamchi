"use client";
/**
 * הצהרת נגישות — a proper document: one h1, h2 sections, lists. Rendered fully in
 * the current language, followed by the same statement in the other language.
 * Statement date: November 2026. Contact details are a clearly marked demo placeholder.
 */
import "./content.css";
import { TransitionLink } from "@/components/brand/TransitionLink";
import { SwitchOn } from "@/components/light/SwitchOn";
import { PageHeader } from "@/components/ui/PageHeader";
import { tx, useLang, type Bi } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { AllLitExplainer } from "./AllLitExplainer";

const DATE: Bi = { he: "נובמבר 2026", en: "November 2026" };

type Section = { id: string; title: Bi; intro?: Bi; items?: Bi[]; outro?: Bi };

const SECTIONS: Section[] = [
  {
    id: "commitment",
    title: { he: "המחויבות שלנו", en: "Our commitment" },
    intro: {
      he: "אתר הקונספט הזה נבנה מתוך ההנחה שאור טוב הוא אור שכולם יכולים להשתמש בו. האתר מתוכנן לעמוד בדרישות תקן ישראלי ת״י 5568 ובהנחיות WCAG 2.0 ברמה AA, ולהיות נוח לשימוש לכל אדם, בכל מכשיר ובכל דרך הפעלה — עכבר, מקלדת, מגע או קורא מסך.",
      en: "This concept site was built on the assumption that good light is light everyone can use. The site is designed to meet Israeli Standard 5568 and the WCAG 2.0 guidelines at level AA, and to be comfortable for every person, on every device and with every means of operation: mouse, keyboard, touch or screen reader.",
    },
    outro: {
      he: "ההצהרה מתייחסת לאתר הקונספט (הדגמה של Kikkey), לא לאתר הרשמי של קמחי תאורה.",
      en: "This statement refers to the concept site (a Kikkey demo), not to the official Kamchi Lighting website.",
    },
  },
  {
    id: "features",
    title: { he: "מה האתר עושה", en: "What the site does" },
    items: [
      { he: "ניגודיות: כל טקסט על רקע שחור ביחס של 7:1 לפחות (רמה AAA), כולל טקסט משני ומספרים.", en: "Contrast: every text on the black background has a ratio of at least 7:1 (level AAA), including secondary text and numerals." },
      { he: "הפעלה מלאה במקלדת: כל קישור, כפתור ושדה נגישים ב-Tab, בסדר הגיוני, עם סימון מיקוד נראה — בצורת אור.", en: "Full keyboard operation: every link, button and field is reachable with Tab, in a logical order, with a visible focus indicator drawn as light." },
      { he: "\"הכול דלוק\": כפתור בכותרת העליונה שמדליק את כל האלמנטים בבת אחת, בלי לחכות לאנימציות גלילה ובלי צורך בריחוף עכבר.", en: "“All lit”: a button in the header that lights every element at once, without waiting for scroll animations and without hovering." },
      { he: "תמיכה בהעדפת המערכת לצמצום תנועה (prefers-reduced-motion): ללא אנימציות, הכול דולק מיד.", en: "Respect for the system's reduced-motion preference (prefers-reduced-motion): no animations, everything lit at once." },
      { he: "קישור \"דלגו לתוכן הראשי\" בראש כל עמוד.", en: "A “skip to main content” link at the top of every page." },
      { he: "טקסט חלופי לכל תמונה ואיור; גופי התאורה המצוירים נושאים את שם הדגם; לווידאו יש חלופה סטטית.", en: "Alternative text for every image and drawing; the drawn fixtures carry the model name; video has a static alternative." },
      { he: "מבנה כותרות סדור (כותרת ראשית אחת בכל עמוד), תוויות לכל שדה טופס, ואזורי הודעה חיים לדברים שמגיעים — הצעות מחיר, תשובות היועץ.", en: "An ordered heading structure (one main heading per page), labels on every form field, and live regions for things that arrive: quotes, the consultant's answers." },
      { he: "שום מידע לא נמסר בצבע בלבד: מצב, מלאי וזמן אספקה מופיעים גם כטקסט.", en: "No information is conveyed by colour alone: status, stock and lead time also appear as text." },
      { he: "דו-לשוני: עברית ואנגלית, עם כיוון טקסט נכון לכל שפה ולכל ערך מספרי.", en: "Bilingual: Hebrew and English, with the correct text direction for each language and for every numeric value." },
    ],
  },
  {
    id: "limits",
    title: { he: "מגבלות ידועות של ההדגמה", en: "Known limitations of the demo" },
    items: [
      { he: "סצנת ה-WebGL בעמוד הבית עשויה להיות כבדה במכשירים ישנים; במקרה כזה מוצגת גרסת וידאו או תמונה סטטית, עם אותו תוכן.", en: "The WebGL scene on the home page may be heavy on older devices; in that case a video or static image is shown, with the same content." },
      { he: "יכולות ה\"בינה המלאכותית\" (תאירו לי את הסלון, תוכנית תאורה, היועץ) הן הדמיות לצורך הצגת הקונספט, מסומנות בטא והדמיה, ואינן ייעוץ מקצועי.", en: "The “AI” features (Light my living room, Lighting plan, The consultant) are simulations for presenting the concept, labelled beta and simulation, and are not professional advice." },
      { he: "סמן העמעום המותאם מופיע רק במצביע עדין (עכבר) ואינו משפיע על הפעלה במקלדת או במגע.", en: "The custom dimmer cursor appears only with a fine pointer (mouse) and does not affect keyboard or touch operation." },
      { he: "קובצי ה-PDF, IES ו-DWG להורדה הם קובצי הדגמה; המחירים הם מחירי הדגמה.", en: "The downloadable PDF, IES and DWG files are demo files; prices are demo prices." },
    ],
  },
  {
    id: "report",
    title: { he: "דיווח על בעיית נגישות", en: "Reporting an accessibility issue" },
    intro: {
      he: "נתקלתם בקושי? נשמח לדעת ולתקן. בגרסה האמיתית של האתר יופיעו כאן פרטי רכז/ת הנגישות של קמחי תאורה.",
      en: "Ran into a problem? We would like to know and fix it. In the real site, the details of Kamchi Lighting's accessibility coordinator will appear here.",
    },
  },
];

function Statement({ lang, primary }: { lang: Lang; primary: boolean }) {
  const t = (s: Bi) => tx(lang, s);
  const H = primary ? "h2" : "h3";
  return (
    <div lang={lang} dir={lang === "he" ? "rtl" : "ltr"} className="c-doc text-start">
      {SECTIONS.map((s, i) => (
        <SwitchOn key={s.id} as="section" offOpacity={0.14} className="border-t hairline py-10 md:py-12" id={`${lang}-${s.id}`}>
          <H className="font-display text-3xl leading-tight md:text-4xl">{t(s.title)}</H>
          {s.intro && <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted md:text-lg">{t(s.intro)}</p>}
          {s.items && (
            <ul className="mt-5 max-w-2xl space-y-3 text-base leading-relaxed text-paper">
              {s.items.map((it) => <li key={it.en}>{t(it)}</li>)}
            </ul>
          )}
          {s.id === "features" && (
            <p className="mt-6 text-sm text-muted">
              {t({ he: "ראו גם: ", en: "See also: " })}
              <a href={`#${lang}-all-lit`} className="text-brass-light underline-offset-4 hover:text-glow hover:underline">{t({ he: "\"הכול דלוק\"", en: "“All lit”" })}</a>
            </p>
          )}
          {s.id === "report" && (
            <div className="mt-6 max-w-2xl border hairline p-5">
              <p className="eyebrow mb-3">{t({ he: "רכז/ת נגישות", en: "Accessibility coordinator" })} <span className="badge-beta ms-2">{t({ he: "הדגמה", en: "Demo" })}</span></p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-muted">{t({ he: "דוא״ל", en: "Email" })}</dt>
                <dd className="font-mono" dir="ltr">accessibility@example.com</dd>
                <dt className="text-muted">{t({ he: "טלפון", en: "Phone" })}</dt>
                <dd className="font-mono" dir="ltr">03-000-0000</dd>
                <dt className="text-muted">{t({ he: "דואר", en: "Post" })}</dt>
                <dd>{t({ he: "לח״י 23, בני ברק", en: "23 Lehi St., Bnei Brak" })}</dd>
              </dl>
              <p className="mt-4 font-mono text-[0.68rem] leading-relaxed text-brass-light">
                {t({ he: "פרטי הדגמה בלבד — אינם פרטי קשר אמיתיים. שם הרכז/ת יופיע בגרסה הרשמית.", en: "Demo details only, not real contact details. The coordinator's name will appear in the official version." })}
              </p>
            </div>
          )}
          {s.outro && <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">{t(s.outro)}</p>}
          {s.id === "commitment" && i === 0 && (
            <div id={`${lang}-all-lit`} className="scroll-mt-24">
              <AllLitExplainer lang={lang} />
            </div>
          )}
        </SwitchOn>
      ))}
      <SwitchOn as="section" offOpacity={0.14} className="border-t hairline py-8">
        <p className="font-mono text-[0.72rem] tracking-[0.1em] text-muted">
          {t({ he: "תאריך ההצהרה: ", en: "Statement date: " })}<span className="text-paper">{t(DATE)}</span>
          {" · "}
          {t({ he: "ההצהרה תעודכן עם כל שינוי מהותי באתר.", en: "The statement will be updated with every material change to the site." })}
        </p>
      </SwitchOn>
    </div>
  );
}

export function AccessibilityPage() {
  const lang = useLang();
  const other: Lang = lang === "he" ? "en" : "he";
  const t = (s: Bi) => tx(lang, s);
  return (
    <>
      <PageHeader
        eyebrow={t({ he: "נגישות", en: "Accessibility" })}
        title={t({ he: "הצהרת נגישות", en: "Accessibility statement" })}
        lede={
          <>
            {t({ he: "האור נדלק לכולם. האתר נבנה לפי WCAG 2.0 AA ות״י 5568, ומוסיף מתג אחד משלו: \"הכול דלוק\".", en: "The light comes on for everyone. The site follows WCAG 2.0 AA and Israeli Standard 5568, and adds one switch of its own: “All lit”." })}
            <span className="mt-3 block font-mono text-xs tracking-[0.1em] text-brass-light">{t({ he: "תאריך ההצהרה: ", en: "Statement date: " })}{t(DATE)}</span>
          </>
        }
        actions={
          <>
            <a href={`#${lang}-features`} className="btn btn-sm">{t({ he: "מה האתר עושה", en: "What the site does" })}</a>
            <a href={`#${lang}-report`} className="btn btn-sm">{t({ he: "דיווח על בעיה", en: "Report an issue" })}</a>
            <a href={`#statement-${other}`} className="btn btn-sm" lang={other}>{other === "en" ? "English" : "עברית"}</a>
          </>
        }
      />
      <article className="container-x pb-24 md:pb-32">
        <div className="max-w-3xl">
          <Statement lang={lang} primary />
          <section id={`statement-${other}`} lang={other} dir={other === "he" ? "rtl" : "ltr"} className="mt-16 scroll-mt-24 text-start">
            <div className="brass-rule" />
            <SwitchOn offOpacity={0.14} className="pt-10">
              <p className="eyebrow mb-3">{other === "en" ? "English version" : "גרסה עברית"}</p>
              <h2 className="font-display text-4xl leading-[1.05] md:text-5xl">{other === "en" ? "Accessibility statement" : "הצהרת נגישות"}</h2>
            </SwitchOn>
            <div className="mt-8">
              <Statement lang={other} primary={false} />
            </div>
          </section>
          <SwitchOn offOpacity={0.14} className="mt-12 flex flex-wrap gap-3">
            <TransitionLink href="/" className="btn">{t({ he: "לעמוד הבית", en: "Home" })}</TransitionLink>
            <TransitionLink href="/about" className="btn">{t({ he: "אודות", en: "About" })}</TransitionLink>
          </SwitchOn>
        </div>
      </article>
    </>
  );
}
