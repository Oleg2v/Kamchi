"use client";
/**
 * Three AI teasers as one row of dark panels. A single fixture lights each
 * panel on hover/focus: a pendant for the living room, a recessed spot for
 * the floor plan, a table lamp for the consultant. Labelled beta.
 */
import { useState } from "react";
import { TransitionLink } from "@/components/brand/TransitionLink";
import { FixtureArt } from "@/components/light/FixtureArt";
import { SwitchOn } from "@/components/light/SwitchOn";
import { FIXTURES, featuredFixtures } from "@/lib/data";
import { useTx } from "@/lib/i18n";
import { BETA } from "@/lib/i18n/common";
import { useStore } from "@/lib/store";
import type { Fixture, FixtureType } from "@/lib/types";
import { Arrow } from "./Arrow";
import { SectionHeading } from "./SectionHeading";

const RANKED = featuredFixtures(FIXTURES.length);
const pick = (type: FixtureType): Fixture => RANKED.find((f) => f.type === type) ?? FIXTURES[0];

const TEASERS = [
  {
    href: "/relight",
    type: "pendant" as FixtureType,
    title: { he: "תאירו לי את הסלון", en: "Light my living room" },
    text: { he: "מעלים תמונה של החדר, בוחרים גוף תאורה מהקטלוג, ורואים אותו דולק בתוך התמונה — עם כתם האור במקום הנכון.", en: "Upload a photo of the room, choose a fixture from the catalogue and see it switched on inside the picture, with the pool of light where it belongs." },
    cta: { he: "להעלות תמונה", en: "Upload a photo" },
  },
  {
    href: "/plan",
    type: "recessed" as FixtureType,
    title: { he: "תוכנית תאורה מתוכנית דירה", en: "A lighting plan from a floor plan" },
    text: { he: "מעלים תוכנית דירה ומקבלים פריסת תאורה לפי חדרים: אור כללי, אור משימה ואור הדגשה, עם כמויות ומחירי הדגמה.", en: "Upload a floor plan and get a room-by-room layout: ambient, task and accent light, with quantities and demo prices." },
    cta: { he: "להעלות תוכנית", en: "Upload a plan" },
  },
  {
    href: "/consultant",
    type: "table" as FixtureType,
    title: { he: "היועץ", en: "The consultant" },
    text: { he: "שאלה על עמעום, טמפרטורת צבע או גוף שמתאים לחדר רחצה — תשובה מתוך הקטלוג בלבד, עם המפרט לצידה.", en: "A question about dimming, colour temperature or a fixture for a bathroom — an answer drawn only from the catalogue, with the spec beside it." },
    cta: { he: "לשאול", en: "Ask" },
  },
];

function Teaser({ item, index, allLit }: { item: (typeof TEASERS)[number]; index: number; allLit: boolean }) {
  const t = useTx();
  const [hot, setHot] = useState(false);
  const lit = hot || allLit;
  const fixture = pick(item.type);
  return (
    <SwitchOn as="li" delay={index * 90} offOpacity={0.14} className="min-w-0">
      <TransitionLink
        href={item.href}
        className="panel group relative flex h-full min-h-[26rem] flex-col justify-end overflow-hidden p-6 md:min-h-[30rem] md:p-7"
        onPointerEnter={() => setHot(true)}
        onPointerLeave={() => setHot(false)}
        onFocus={() => setHot(true)}
        onBlur={() => setHot(false)}
        data-lit={lit ? "1" : "0"}
      >
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[64%] w-[56%]" style={{ opacity: lit ? 1 : 0.3 }}>
          <FixtureArt fixture={fixture} lit={lit} cast suspension className="h-full w-full" />
        </div>
        <div className="relative">
          <p className="eyebrow mb-3 flex items-center gap-2">
            <span>AI</span>
            <span className="badge-beta">{t(BETA)}</span>
          </p>
          <h3 className={`text-2xl leading-tight md:text-[1.75rem] ${lit ? "text-paper" : "text-paper/80"}`}>{t(item.title)}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t(item.text)}</p>
          <p className={`mt-5 font-mono text-[0.72rem] tracking-[0.14em] ${lit ? "text-glow" : "text-brass-light"}`}>{t(item.cta)} <Arrow /></p>
        </div>
      </TransitionLink>
    </SwitchOn>
  );
}

export function AiTeasers() {
  const t = useTx();
  const allLit = useStore((s) => s.allLit);
  return (
    <section className="container-x py-24 md:py-32" aria-labelledby="ai-h">
      <SectionHeading
        id="ai-h"
        eyebrow={<>{t({ he: "כלים חדשים", en: "New tools" })} · <span className="badge-beta">{t(BETA)}</span></>}
        title={t({ he: "שלושה כלים שמדליקים את התכנון", en: "Three tools that switch planning on" })}
        lede={t({ he: "הדמיות ותוצאות בשלב בטא, מסומנות ככאלה. המפרטים והמחירים תמיד מהקטלוג.", en: "Simulations and results in beta, labelled as such. Specs and prices always come from the catalogue." })}
      />
      <ul className="mt-12 grid gap-4 md:grid-cols-3">
        {TEASERS.map((item, i) => (
          <Teaser key={item.href} item={item} index={i} allLit={allLit} />
        ))}
      </ul>
    </section>
  );
}
