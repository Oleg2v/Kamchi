"use client";
import { useState } from "react";
import { TransitionLink } from "@/components/brand/TransitionLink";
import { LampFrame } from "./LampFrame";
import { getBrand } from "@/lib/data";
import { formatIls, useLang, useTx } from "@/lib/i18n";
import { DEMO_PRICE, FIXTURE_TYPE_LABEL, LEAD_TIME_LABEL } from "@/lib/i18n/common";
import { useLiveFixture } from "@/lib/store";
import { specLine } from "@/lib/catalog/filter";
import type { Fixture } from "@/lib/types";

type Props = { fixture: Fixture; compact?: boolean; headingLevel?: "h3" | "h2" };

/**
 * One fixture on black. Unlit until the pointer or keyboard focus reaches it,
 * then the whole piece switches on — body, emissive surface and cast light.
 * The entire card is a single link to the product page.
 */
export function ProductCard({ fixture, compact = false, headingLevel = "h3" }: Props) {
  const t = useTx();
  const lang = useLang();
  const [lit, setLit] = useState(false);
  const live = useLiveFixture(fixture.id);
  const leadTime = live?.leadTime ?? fixture.leadTime;
  const brand = getBrand(fixture.brand);
  const Heading = headingLevel;

  return (
    <TransitionLink
      href={`/catalog/${fixture.slug}`}
      className="group block h-full outline-offset-4"
      onPointerEnter={() => setLit(true)}
      onPointerLeave={() => setLit(false)}
      onFocus={() => setLit(true)}
      onBlur={() => setLit(false)}
      data-testid="product-card"
      data-fixture={fixture.id}
    >
      <div className="relative aspect-[10/13] overflow-hidden border hairline bg-night transition-colors duration-300 group-hover:border-glow/40 group-focus-visible:border-glow/40">
        <LampFrame fixture={fixture} lit={lit} offOpacity={0.5} className="absolute inset-[7%] flex items-center justify-center" />
      </div>
      <div className={`${compact ? "pt-3" : "pt-4"} flex flex-col gap-1`}>
        <p className="eyebrow truncate">{brand?.name ?? fixture.brand}</p>
        <Heading className={`font-display leading-tight text-paper ${compact ? "text-lg" : "text-xl md:text-2xl"}`} lang="en">{fixture.name}</Heading>
        <p className="text-sm text-muted">{lang === "he" ? fixture.nameHe : t(FIXTURE_TYPE_LABEL[fixture.type])}</p>
        <p className="font-mono text-[0.62rem] tracking-wide text-muted sm:text-[0.7rem]" dir="ltr">{specLine(fixture)}</p>
        {!compact && (
          <div className="mt-2 flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
            <div className="leading-none">
              <span className="num text-lg text-paper" dir="ltr">{formatIls(fixture.price, lang)}</span>
              <span className="mt-1 block text-[0.66rem] text-muted">{t(DEMO_PRICE)}</span>
            </div>
            <span className={`chip px-2 py-0.5 text-[0.66rem] ${leadTime === "stock" ? "is-on" : ""}`}>{t(LEAD_TIME_LABEL[leadTime])}</span>
          </div>
        )}
      </div>
    </TransitionLink>
  );
}
