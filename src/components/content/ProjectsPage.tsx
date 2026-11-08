"use client";
/**
 * Reference wall: no photos, no stock. Each project is a dark typographic
 * card with a single fixture that switches on under the pointer or focus,
 * a mono sector line and one generic line on what the light had to do there.
 */
import "./content.css";
import { useState } from "react";
import { TransitionLink } from "@/components/brand/TransitionLink";
import { SwitchOn } from "@/components/light/SwitchOn";
import { PageHeader } from "@/components/ui/PageHeader";
import { getFixture } from "@/lib/data";
import { useLang, useTx, type Bi } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { Lamp } from "./Lamp";

type Reference = {
  id: string;
  title: Bi;
  sector: Bi;
  brief: Bi;
  fixtureId: string;
  /** Where the card leads in the catalogue. */
  href: string;
  catalogLabel: Bi;
  wide?: boolean;
};

const REFERENCES: Reference[] = [
  {
    id: "google",
    title: { he: "משרדי Google ישראל", en: "Google Israel offices" },
    sector: { he: "משרדים", en: "Offices" },
    brief: { he: "תאורת משרדים פתוחים ואזורי שיתוף.", en: "Lighting for open-plan offices and shared areas." },
    fixtureId: "artemide-luce-sospesa",
    href: "/catalog?space=office",
    catalogLabel: { he: "גופים למשרד", en: "Office fixtures" },
  },
  {
    id: "airport-city",
    title: { he: "Airport City", en: "Airport City" },
    sector: { he: "מסחר", en: "Commercial" },
    brief: { he: "לובאים, מעברים וחזיתות בפארק עסקים.", en: "Lobbies, passages and facades in a business park." },
    fixtureId: "exenia-linea-incasso",
    href: "/catalog?type=linear",
    catalogLabel: { he: "גופים ליניאריים", en: "Linear fixtures" },
  },
  {
    id: "migdal",
    title: { he: "מגדל מגדל, פתח תקווה", en: "Migdal tower, Petah Tikva" },
    sector: { he: "מגדלים", en: "Towers" },
    brief: { he: "לובי כניסה וקומות משרדים במגדל.", en: "An entrance lobby and office floors in a tower." },
    fixtureId: "artemide-anello-soffitto",
    href: "/catalog?type=ceiling",
    catalogLabel: { he: "צמודי תקרה", en: "Ceiling fixtures" },
  },
  {
    id: "cinema-city",
    title: { he: "Cinema City", en: "Cinema City" },
    sector: { he: "קולנוע", en: "Cinema" },
    brief: { he: "פואייה, מסדרונות ומעברים בעומס קהל.", en: "Foyers, corridors and high-traffic passages." },
    fixtureId: "neko-disco",
    href: "/catalog?space=commercial",
    catalogLabel: { he: "גופים לחלל מסחרי", en: "Commercial fixtures" },
  },
  {
    id: "mercedes",
    title: { he: "אולמות התצוגה של Mercedes", en: "Mercedes showrooms" },
    sector: { he: "רכב", en: "Automotive" },
    brief: { he: "תאורת הדגשה לכלי רכב באולם תצוגה.", en: "Accent lighting for vehicles on a showroom floor." },
    fixtureId: "neko-rail",
    href: "/catalog?type=track",
    catalogLabel: { he: "פסי צבירה", en: "Track" },
  },
  {
    id: "isrotel",
    title: { he: "מטה ישרוטל", en: "Isrotel headquarters" },
    sector: { he: "משרדים", en: "Offices" },
    brief: { he: "לובי מטה, חדרי ישיבות וחללי קבלה.", en: "A headquarters lobby, meeting rooms and reception areas." },
    fixtureId: "terzani-pioggia",
    href: "/catalog?type=chandelier",
    catalogLabel: { he: "נברשות", en: "Chandeliers" },
  },
  {
    id: "homes",
    title: { he: "בתים פרטיים של מעצבי הפנים המובילים בישראל", en: "Private homes by Israel's leading interior designers" },
    sector: { he: "בתים", en: "Homes" },
    brief: { he: "תאורה ביתית שמתוכננת יחד עם מעצב הפנים: סלון, מטבח, חדרי שינה ורחצה.", en: "Residential lighting planned together with the interior designer: living room, kitchen, bedrooms and bathrooms." },
    fixtureId: "bomma-perla",
    href: "/catalog?space=living",
    catalogLabel: { he: "גופים לסלון", en: "Living-room fixtures" },
    wide: true,
  },
];

function ReferenceCard({ r, index }: { r: Reference; index: number }) {
  const t = useTx();
  const allLit = useStore((s) => s.allLit);
  const [hot, setHot] = useState(false);
  const lit = hot || allLit;
  const fixture = getFixture(r.fixtureId);
  const num = String(index + 1).padStart(2, "0");
  return (
    <li className={r.wide ? "sm:col-span-2 lg:col-span-3" : ""}>
      <SwitchOn offOpacity={0.14} delay={index * 60} className="h-full">
        <TransitionLink
          href={r.href}
          className={`c-card group relative flex h-full flex-col border hairline bg-charcoal p-6 outline-offset-[-3px] md:p-7 ${r.wide ? "sm:grid sm:grid-cols-[14rem_minmax(0,1fr)] sm:items-center sm:gap-x-10 lg:grid-cols-[18rem_minmax(0,1fr)]" : ""}`}
          onPointerEnter={() => setHot(true)}
          onPointerLeave={() => setHot(false)}
          onFocus={() => setHot(true)}
          onBlur={() => setHot(false)}
          data-lit={lit ? "1" : "0"}
          data-testid={`ref-${r.id}`}
        >
          <div className={`relative mx-auto ${r.wide ? "h-60 w-44 md:h-72 md:w-56" : "h-52 w-40 md:h-60 md:w-48"}`}>
            {fixture && <Lamp fixture={fixture} lit={lit} offOpacity={0.36} className="h-full" />}
          </div>
          <div className={`flex min-w-0 flex-1 flex-col ${r.wide ? "mt-6 sm:mt-0" : "mt-5"}`}>
            <p className="font-mono text-[0.7rem] tracking-[0.14em] text-brass-light">
              <span className="num" dir="ltr">{num}</span> · {t(r.sector)}
            </p>
            <h2 className={`c-card-title mt-2 font-display leading-tight text-paper ${r.wide ? "text-3xl md:text-5xl" : "text-2xl md:text-[1.9rem]"}`}>{t(r.title)}</h2>
            <p className={`mt-3 leading-relaxed text-muted ${r.wide ? "max-w-xl text-base md:text-lg" : "text-sm"}`}>{t(r.brief)}</p>
            <p className="mt-auto pt-6 font-mono text-[0.68rem] tracking-[0.1em] text-muted group-hover:text-glow group-focus-visible:text-glow">
              {t({ he: "בקטלוג", en: "In the catalogue" })}: {t(r.catalogLabel)} ←
            </p>
          </div>
        </TransitionLink>
      </SwitchOn>
    </li>
  );
}

export function ProjectsPage() {
  const t = useTx();
  const lang = useLang();
  const startX = lang === "he" ? "72%" : "28%";
  return (
    <>
      <PageHeader
        eyebrow={t({ he: "פרויקטים", en: "Projects" })}
        title={t({ he: "אור שעובד שנים", en: "Light that works for years" })}
        lede={t({
          he: "בפרויקט, האור צריך לעשות את עבודתו בלי שישימו לב אליו: ללובי, לקומת משרדים, לאולם תצוגה. אלה כמה מהמקומות שבהם קמחי עשתה את זה. עברו על קלף — והגוף נדלק.",
          en: "In a project, light has to do its job without being noticed: a lobby, an office floor, a showroom. These are some of the places where Kamchi did that. Pass over a card and its fixture switches on.",
        })}
        actions={
          <>
            <TransitionLink href="/club" className="btn btn-primary">{t({ he: "מועדון האדריכלים והמעצבים", en: "Architects & designers club" })}</TransitionLink>
            <TransitionLink href="/catalog?space=commercial" className="btn">{t({ he: "גופים לפרויקטים", en: "Project fixtures" })}</TransitionLink>
          </>
        }
      />

      <section className="container-x pb-20 md:pb-28" aria-labelledby="refs-h">
        <h2 id="refs-h" className="sr-only">{t({ he: "קיר הפרויקטים", en: "Reference wall" })}</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {REFERENCES.map((r, i) => (
            <ReferenceCard key={r.id} r={r} index={i} />
          ))}
        </ul>
        <SwitchOn offOpacity={0.14} className="mt-8 flex flex-wrap items-baseline justify-between gap-3 border-t hairline pt-5">
          <p className="font-mono text-[0.7rem] leading-relaxed text-muted">
            {t({ he: "מתוך רשימת הפרויקטים של קמחי; הפריטים המוצגים הם הדגמה.", en: "From Kamchi's project list; the fixtures shown are a demo." })}
          </p>
          <p className="font-mono text-[0.7rem] text-brass-light">{t({ he: "ללא צילומים — כל גוף מצויר", en: "No photographs — every fixture is drawn" })}</p>
        </SwitchOn>
      </section>

      <section className="container-x pb-24 md:pb-32" aria-labelledby="next-h">
        <SwitchOn offOpacity={0.12} glow="pool" glowSize={640} glowOffset={{ x: startX, y: "100%" }} className="border-t hairline pt-12 md:pt-16">
          <p className="eyebrow mb-3">{t({ he: "הפרויקט הבא", en: "The next project" })}</p>
          <h2 id="next-h" className="font-display text-4xl leading-[1.05] md:text-5xl lg:text-6xl">{t({ he: "יש לכם תוכנית? בואו עם הקבצים.", en: "Have a plan? Bring the files." })}</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
            {t({
              he: "סטודיו במועדון מקבל הצעת מחיר חיה, זמני אספקה וקובצי IES/DWG לכל גוף — דרך הפורטל. לקוחות פרטיים מוזמנים לאולם בבני ברק.",
              en: "A studio in the club gets a live quote, lead times and IES/DWG files for every fixture through the portal. Private clients are welcome at the Bnei Brak showroom.",
            })}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <TransitionLink href="/studio" className="btn btn-primary">{t({ he: "כניסה לסטודיו", en: "Enter the studio" })}</TransitionLink>
            <TransitionLink href="/about#visit" className="btn">{t({ he: "ביקור באולם", en: "Visit the showroom" })}</TransitionLink>
          </div>
        </SwitchOn>
      </section>
    </>
  );
}
