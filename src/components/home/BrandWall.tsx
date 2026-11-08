"use client";
/**
 * "16 בתים, אור אחד" — the brands as typographic marks. Each mark is unlit
 * until hovered or focused; then its own hero fixture switches on above the
 * name and the name turns paper. Under "הכול דלוק" every mark is lit.
 */
import { TransitionLink } from "@/components/brand/TransitionLink";
import { FixtureArt } from "@/components/light/FixtureArt";
import { BRANDS, fixturesByBrand, getFixture } from "@/lib/data";
import { useTx } from "@/lib/i18n";
import { pageEnabled } from "@/lib/site";
import { useHotLight } from "./useHotLight";
import type { Brand } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";

function BrandMark({ brand }: { brand: Brand }) {
  const t = useTx();
  const { lit, pinned, toggle, bind } = useHotLight();
  const href = `/catalog?brand=${brand.id}`;
  const linked = pageEnabled(href);
  const fixture = getFixture(brand.heroFixtureId);
  const count = fixturesByBrand(brand.id).length;
  const countLabel = t({ he: count === 1 ? "דגם" : "דגמים", en: count === 1 ? "piece" : "pieces" });
  return (
    <li className="relative border-b border-e hairline">
      {(() => {
        const cls = "group relative flex aspect-[4/3] w-full flex-col justify-end overflow-hidden p-5 text-start outline-offset-[-3px] md:p-6";
        const label = `${brand.name} — ${count} ${countLabel}`;
        const body = (<>
        {fixture && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[82%] w-[62%]" style={{ opacity: lit ? 1 : 0.42 }}>
            <FixtureArt fixture={fixture} lit={lit} cast suspension className="h-full w-full" />
          </div>
        )}
        <div className="relative">
          <p
            lang="en"
            className={`font-display [&:lang(en)]:font-display-en text-[1.65rem] leading-none tracking-wide md:text-[2rem] ${lit ? "text-paper" : "text-muted"}`}
            style={lit ? { animation: "incandescent 120ms var(--ease-incandescent) forwards", textShadow: "0 0 24px rgb(var(--glow-rgb) / 0.25)" } : undefined}
          >
            {brand.name}
          </p>
          <p className={`mt-2 flex items-baseline justify-between gap-3 font-mono text-[0.68rem] tracking-[0.12em] ${lit ? "text-brass-light" : "text-muted"}`}>
            <span dir="ltr" className="hidden truncate sm:inline">{brand.country} · {brand.founded}</span>
            <span className="whitespace-nowrap"><span className="num">{String(count).padStart(2, "0")}</span> {countLabel}</span>
          </p>
        </div>
</>);
        return linked ? (
          <TransitionLink href={href} className={cls} {...bind} data-lit={lit ? "1" : "0"} aria-label={label}>{body}</TransitionLink>
        ) : (
          <button type="button" className={cls} {...bind} onClick={toggle} aria-pressed={pinned} data-lit={lit ? "1" : "0"} aria-label={label}>{body}</button>
        );
      })()}
    </li>
  );
}

export function BrandWall() {
  const t = useTx();
  return (
    <section className="container-x py-16 md:py-32" aria-labelledby="brands-h">
      <SectionHeading
        id="brands-h"
        eyebrow={t({ he: "המותגים", en: "The brands" })}
        title={t({ he: "16 בתים, אור אחד", en: "Sixteen houses, one light" })}
        lede={t({
          he: "קמחי מייבאת את בתי התאורה שמעצבים עובדים איתם: ארטמידה, ויביה, בומה, טרצאני ועוד. עוברים על שם או נוגעים בו — והגוף של אותו בית נדלק.",
          en: "Kamchi imports the lighting houses designers work with: Artemide, Vibia, Bomma, Terzani and more. Move over a name, or tap it, and that house's fixture switches on.",
        })}
        action={
          pageEnabled("/catalog") ? (
            <TransitionLink href="/catalog" className="btn btn-sm">
              {t({ he: "לקטלוג המלא", en: "Full catalogue" })}
            </TransitionLink>
          ) : undefined
        }
      />
      <ul className="mt-12 grid grid-cols-2 border-s border-t hairline md:grid-cols-4" aria-label={t({ he: "קיר המותגים", en: "Brand wall" })}>
        {BRANDS.map((b) => (
          <BrandMark key={b.id} brand={b} />
        ))}
      </ul>
    </section>
  );
}
