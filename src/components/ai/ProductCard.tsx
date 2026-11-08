"use client";
import { FixtureArt } from "@/components/light/FixtureArt";
import { SwitchOn } from "@/components/light/SwitchOn";
import { TransitionLink } from "@/components/brand/TransitionLink";
import { FACT_LABEL, brandName, normalizeField, type Fact } from "@/lib/ai/validate";
import { getFixture } from "@/lib/data";
import { useLang, useTx } from "@/lib/i18n";

/** A consultant recommendation: lit portrait, brand/name, the quoted facts as mono chips, link to the catalogue. */
export function ProductCard({ fixtureId, facts, delay = 0 }: { fixtureId: string; facts: Fact[]; delay?: number }) {
  const t = useTx();
  const lang = useLang();
  const f = getFixture(fixtureId);
  if (!f) return null;
  return (
    <article data-fixture-id={f.id} aria-label={lang === "he" ? f.nameHe : f.name}>
    <SwitchOn delay={delay} className="panel flex h-full gap-4 p-4">
      <span className="block w-20 shrink-0 md:w-24"><FixtureArt fixture={f} lit suspension={f.type === "pendant" || f.type === "chandelier" || f.type === "linear"} /></span>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[0.62rem] tracking-[0.14em] text-brass-light">{brandName(f.brand).toUpperCase()}</p>
        <h3 className="mt-0.5 font-display text-xl leading-tight">{lang === "he" ? f.nameHe : f.name}</h3>
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={t({ he: "נתונים מהקטלוג", en: "Catalogue facts" })}>
          {facts.map((x, i) => {
            const field = normalizeField(x.field);
            return (
              <li key={i} className="chip gap-1.5 py-0.5 text-[0.7rem]">
                <span className="text-muted">{field ? t(FACT_LABEL[field]) : x.field}</span>
                <span className="font-mono text-paper" dir="ltr">{x.value}</span>
              </li>
            );
          })}
        </ul>
        <TransitionLink href={`/catalog/${f.slug}`} className="mt-3 inline-block text-[0.8rem] text-brass-light underline-offset-4 hover:text-glow hover:underline">{t({ he: "לדף המוצר ←", en: "Product page →" })}</TransitionLink>
      </div>
    </SwitchOn>
    </article>
  );
}
