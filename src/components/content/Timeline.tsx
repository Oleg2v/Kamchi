"use client";
/**
 * "שמונים שנה של אור" — a vertical timeline where every era is a lamp.
 * Each era switches on as it scrolls into view: the fixture lights, its rail
 * segment glows, the node on the rail turns to light and the text ramps up.
 * No dates we do not have: eras are phrased relatively.
 */
import { getFixture } from "@/lib/data";
import { useInView } from "@/lib/hooks/useInView";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useTx, type Bi } from "@/lib/i18n";
import { Lamp } from "./Lamp";

export type Era = {
  id: string;
  eyebrow: Bi;
  title: Bi;
  body: Bi;
  /** The fixture (from the catalogue) whose silhouette matches the era's feel. */
  fixtureId: string;
  /** Art box width classes. */
  width?: string;
};

export const ERAS: Era[] = [
  {
    id: "workshop",
    eyebrow: { he: "לפני כשמונים שנה", en: "About eighty years ago" },
    title: { he: "סדנה בדרום תל אביב", en: "A workshop in south Tel Aviv" },
    body: {
      he: "אברהם קמחי פתח סדנה בדרום תל אביב. לא בית יבוא ולא אולם תצוגה — מקום עבודה אחד, ואור אחד מעל השולחן. מכאן מתחיל הכול.",
      en: "Avraham Kamchi opened a workshop in south Tel Aviv. Not an import house, not a showroom: one place of work, and one light above the bench. Everything starts here.",
    },
    fixtureId: "cangini-tucci-bolla",
  },
  {
    id: "second",
    eyebrow: { he: "הדור השני", en: "The second generation" },
    title: { he: "בית יבוא", en: "An import house" },
    body: {
      he: "הדור השני הפך את הסדנה לבית יבוא. במקום לייצר כאן, הביאו לכאן: בתי התאורה של איטליה, ספרד, צ׳כיה ואוסטריה, ובהם Artemide. קמחי נעשתה הכתובת בישראל לתאורה מעוצבת.",
      en: "The second generation turned the workshop into an import house. Instead of making here, they brought here: the lighting houses of Italy, Spain, the Czech Republic and Austria, Artemide among them. Kamchi became Israel's address for designer lighting.",
    },
    fixtureId: "artemide-ramo-tavolo",
  },
  {
    id: "showroom",
    eyebrow: { he: "לח״י 23, בני ברק", en: "23 Lehi St., Bnei Brak" },
    title: { he: "אולם התצוגה", en: "The showroom" },
    body: {
      he: "ליד מרכז העיצוב בבני ברק נפתח אולם תצוגה של 5,000 מ״ר. כאן רואים את האור עצמו, לא תמונה שלו: סלון ליד מטבח ליד חדר שינה, וכל גוף דולק במקומו.",
      en: "Next to the Design Center in Bnei Brak, a 5,000 m² showroom opened. Here you see the light itself, not a picture of it: a living room beside a kitchen beside a bedroom, every fixture lit in its place.",
    },
    fixtureId: "vibia-nube",
  },
  {
    id: "projects",
    eyebrow: { he: "מהבית אל העיר", en: "From the home to the city" },
    title: { he: "הפרויקטים", en: "The projects" },
    body: {
      he: "משרדי Google ישראל, Airport City, מגדל מגדל בפתח תקווה, Cinema City, אולמות התצוגה של Mercedes ומטה ישרוטל. ולצדם, בתים פרטיים עם מעצבי הפנים המובילים בישראל.",
      en: "Google Israel's offices, Airport City, the Migdal tower in Petah Tikva, Cinema City, the Mercedes showrooms and Isrotel's headquarters. And alongside them, private homes with Israel's leading interior designers.",
    },
    fixtureId: "neko-rail",
  },
  {
    id: "third",
    eyebrow: { he: "עכשיו", en: "Now" },
    title: { he: "הדור השלישי", en: "The third generation" },
    body: {
      he: "הדור השלישי מצטרף עכשיו. החברה מדורגת ב-Dun's 100, והפרק הבא נכתב כאן: פורטל שבו כל סטודיו במועדון רואה מלאי, זמני אספקה והצעות מחיר — בזמן אמת.",
      en: "The third generation is joining now. The company is listed in Dun's 100, and the next chapter is written here: a portal where every studio in the club sees stock, lead times and quotes in real time.",
    },
    fixtureId: "bomma-korale",
  },
];

function EraRow({ era, index }: { era: Era; index: number }) {
  const t = useTx();
  const [ref, inView] = useInView<HTMLLIElement>({ threshold: 0.3, rootMargin: "0px 0px -18% 0px" });
  const reduced = useReducedMotion();
  const lit = inView || reduced;
  const fixture = getFixture(era.fixtureId);
  const num = String(index + 1).padStart(2, "0");
  return (
    <li ref={ref} id={`era-${era.id}`} className="relative grid gap-y-6 py-14 md:grid-cols-[minmax(0,5fr)_4rem_minmax(0,7fr)] md:gap-y-0 md:py-24" data-lit={lit ? "1" : "0"} data-era={era.id}>
      <span aria-hidden className="c-seg" data-lit={lit ? "1" : "0"} />
      <div className="relative mx-auto w-44 ps-7 md:w-60 md:ps-0 lg:w-72">
        {fixture && <Lamp fixture={fixture} lit={lit} offOpacity={0.42} />}
      </div>
      <div aria-hidden className="hidden md:block" />
      <div className={`switch-on relative ps-7 md:ps-0 ${lit ? "is-on" : ""}`} style={{ "--off-opacity": 0.14 } as React.CSSProperties}>
        <p className="eyebrow mb-3"><span className="num" dir="ltr">{num}</span> · {t(era.eyebrow)}</p>
        <h3 className="relative font-display text-3xl leading-[1.08] md:text-5xl">
          <span aria-hidden className="c-node" data-lit={lit ? "1" : "0"} />
          {t(era.title)}
        </h3>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">{t(era.body)}</p>
      </div>
    </li>
  );
}

export function Timeline() {
  const t = useTx();
  return (
    <section className="container-x pb-8 md:pb-16" aria-labelledby="timeline-h">
      <h2 id="timeline-h" className="sr-only">{t({ he: "ציר הזמן", en: "Timeline" })}</h2>
      <ol className="c-timeline border-t hairline">
        <span aria-hidden className="c-rail" />
        {ERAS.map((era, i) => (
          <EraRow key={era.id} era={era} index={i} />
        ))}
      </ol>
    </section>
  );
}
