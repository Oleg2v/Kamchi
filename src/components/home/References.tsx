"use client";
/** Reference projects as one typographic row. No motion — only the switch-on on entry. */
import { TransitionLink } from "@/components/brand/TransitionLink";
import { SwitchOn } from "@/components/light/SwitchOn";
import { useTx } from "@/lib/i18n";
import { Arrow } from "./Arrow";

const REFERENCES = [
  { he: "משרדי Google ישראל", en: "Google Israel offices" },
  { he: "Airport City", en: "Airport City" },
  { he: "מגדל מגדל, פתח תקווה", en: "Migdal tower, Petah Tikva" },
  { he: "Cinema City", en: "Cinema City" },
  { he: "אולמות התצוגה של Mercedes", en: "Mercedes showrooms" },
  { he: "מטה ישרוטל", en: "Isrotel headquarters" },
  { he: "בתים פרטיים עם מעצבי הפנים המובילים בישראל", en: "Homes by leading Israeli interior designers" },
];

export function References() {
  const t = useTx();
  return (
    <section className="container-x py-20 md:py-24" aria-labelledby="refs-h">
      <SwitchOn offOpacity={0.12} className="border-y hairline py-10 md:py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-baseline md:justify-between">
          <h2 id="refs-h" className="eyebrow">{t({ he: "פרויקטים נבחרים", en: "Selected projects" })}</h2>
          <TransitionLink href="/projects" className="font-mono text-[0.72rem] tracking-[0.14em] text-brass-light hover:text-glow">
            {t({ he: "לכל הפרויקטים", en: "All projects" })} <Arrow />
          </TransitionLink>
        </div>
        <ul className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-3 font-display [&:lang(en)]:font-display-en text-2xl leading-tight text-paper md:text-[2rem]">
          {REFERENCES.map((r, i) => (
            <li key={r.en} className="flex items-baseline gap-5">
              <span>{t(r)}</span>
              {i < REFERENCES.length - 1 && <span aria-hidden className="inline-block h-1.5 w-1.5 translate-y-[-0.3em] rounded-full bg-brass" />}
            </li>
          ))}
        </ul>
        <p className="mt-6 font-mono text-[0.7rem] text-muted">{t({ he: "מתוך רשימת הפרויקטים של קמחי", en: "From Kamchi's project list" })}</p>
      </SwitchOn>
    </section>
  );
}
