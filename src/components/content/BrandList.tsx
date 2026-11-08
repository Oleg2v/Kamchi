"use client";
/**
 * "המותגים" — the sixteen houses as one typographic list. Nothing but type:
 * name, country · founding year, tagline and the number of pieces in the demo
 * catalogue. Each name switches on under the pointer or under focus and links
 * to the catalogue filtered by brand.
 */
import { TransitionLink } from "@/components/brand/TransitionLink";
import { BRANDS, fixturesByBrand } from "@/lib/data";
import { useTx } from "@/lib/i18n";
import { SectionHead } from "./SectionHead";

export function BrandList() {
  const t = useTx();
  return (
    <section className="container-x py-20 md:py-28" aria-labelledby="brands-h">
      <SectionHead
        id="brands-h"
        eyebrow={t({ he: "המותגים", en: "The brands" })}
        title={t({ he: "שישה-עשר בתים, אור אחד", en: "Sixteen houses, one light" })}
        lede={t({
          he: "בתי התאורה שקמחי מייבאת לישראל. כל שם נדלק כשעוברים עליו, ומוביל לגופים שלו בקטלוג.",
          en: "The lighting houses Kamchi brings to Israel. Every name lights as you pass over it, and leads to its pieces in the catalogue.",
        })}
        action={<TransitionLink href="/catalog" className="btn btn-sm">{t({ he: "לקטלוג המלא", en: "Full catalogue" })}</TransitionLink>}
      />
      <ol className="mt-12 border-t hairline">
        {BRANDS.map((b, i) => {
          const count = fixturesByBrand(b.id).length;
          const countLabel = t({ he: count === 1 ? "דגם" : "דגמים", en: count === 1 ? "piece" : "pieces" });
          return (
            <li key={b.id} className="border-b hairline">
              <TransitionLink
                href={`/catalog?brand=${b.id}`}
                className="c-switch grid grid-cols-[2.25rem_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1.5 py-5 outline-offset-[-3px] md:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1.3fr)_11rem] md:gap-x-8 md:py-6"
              >
                <span className="num text-xs text-muted" dir="ltr">{String(i + 1).padStart(2, "0")}</span>
                <span lang="en" className="c-name font-display text-[1.75rem] leading-none tracking-wide md:text-[2.4rem]">{b.name}</span>
                <span className="col-start-2 text-sm leading-relaxed text-muted md:col-start-3 md:text-base">{t(b.tagline)}</span>
                <span className="col-start-2 flex items-baseline justify-between gap-3 font-mono text-[0.7rem] tracking-[0.12em] text-muted md:col-start-4 md:block md:text-end">
                  <span dir="ltr" className="whitespace-nowrap">{b.country} · {b.founded}</span>
                  <span className="md:mt-1 md:block"><span className="num">{String(count).padStart(2, "0")}</span> {countLabel}</span>
                </span>
              </TransitionLink>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
