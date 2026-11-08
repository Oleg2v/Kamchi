"use client";
/** Eight featured fixtures in a horizontal strip; each one unlit until hovered or focused. */
import { useState } from "react";
import { TransitionLink } from "@/components/brand/TransitionLink";
import { FixtureArt } from "@/components/light/FixtureArt";
import { SwitchOn } from "@/components/light/SwitchOn";
import { featuredFixtures, getBrand } from "@/lib/data";
import { formatIls, useLang, useTx } from "@/lib/i18n";
import { DEMO_PRICE, FIXTURE_TYPE_LABEL } from "@/lib/i18n/common";
import { useStore } from "@/lib/store";
import type { Fixture } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";

function Card({ f, index, allLit }: { f: Fixture; index: number; allLit: boolean }) {
  const t = useTx();
  const lang = useLang();
  const [hot, setHot] = useState(false);
  const lit = hot || allLit;
  const brand = getBrand(f.brand);
  return (
    <SwitchOn as="li" delay={index * 60} offOpacity={0.16} className="w-[15.5rem] shrink-0 snap-start md:w-[17rem]">
      <TransitionLink
        href={`/catalog/${f.slug}`}
        className="panel group flex h-full flex-col p-4"
        onPointerEnter={() => setHot(true)}
        onPointerLeave={() => setHot(false)}
        onFocus={() => setHot(true)}
        onBlur={() => setHot(false)}
        data-lit={lit ? "1" : "0"}
      >
        <div className="relative aspect-[10/11] overflow-hidden bg-night" style={{ opacity: lit ? 1 : 0.42 }}>
          <FixtureArt fixture={f} lit={lit} cast suspension className="absolute inset-0 h-full w-full" />
        </div>
        <p className="mt-4 flex items-baseline justify-between font-mono text-[0.66rem] tracking-[0.12em] text-brass-light">
          <span dir="ltr">{brand?.name.toUpperCase()}</span>
          <span className="text-muted">{t(FIXTURE_TYPE_LABEL[f.type])}</span>
        </p>
        <p lang="en" className={`font-display mt-1 text-xl leading-tight ${lit ? "text-paper" : "text-paper/85"}`}>{f.name}</p>
        <p className="text-sm text-muted">{lang === "he" ? f.nameHe : f.designer ?? ""}</p>
        <p className="mt-3 font-mono text-[0.78rem]">
          <span className="num text-paper">{formatIls(f.price, lang)}</span>
          <span className="text-muted"> · {t(DEMO_PRICE)}</span>
        </p>
      </TransitionLink>
    </SwitchOn>
  );
}

export function FeaturedStrip() {
  const t = useTx();
  const allLit = useStore((s) => s.allLit);
  const items = featuredFixtures(8);
  return (
    <section className="py-24 md:py-32" aria-labelledby="featured-h">
      <div className="container-x">
        <SectionHeading
          id="featured-h"
          eyebrow={t({ he: "מהאולם", en: "From the showroom" })}
          title={t({ he: "שמונה גופים שמדליקים חדר", en: "Eight fixtures that switch a room on" })}
          action={
            <TransitionLink href="/catalog" className="btn btn-sm">
              {t({ he: "כל 60 הגופים", en: "All 60 fixtures" })}
            </TransitionLink>
          }
        />
      </div>
      <div className="container-x mt-12">
        <ul className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8" aria-label={t({ he: "גופים נבחרים", en: "Featured fixtures" })}>
          {items.map((f, i) => (
            <Card key={f.id} f={f} index={i} allLit={allLit} />
          ))}
        </ul>
      </div>
    </section>
  );
}
