"use client";
import "./catalog.css";
import { useMemo, useState } from "react";
import { TransitionLink } from "@/components/brand/TransitionLink";
import { SwitchOn } from "@/components/light/SwitchOn";
import { AddToBoardDialog } from "./AddToBoardDialog";
import { AppointmentDialog } from "./AppointmentDialog";
import { ProductCard } from "./ProductCard";
import { ProductStage } from "./ProductStage";
import { QtyStepper } from "./QtyStepper";
import { FinishSwatch, SpecTable } from "./SpecTable";
import { Toasts, useToasts } from "./Toast";
import { fixturesByBrand, getBrand, getFixtureBySlug } from "@/lib/data";
import { formatIls, useLang, useTx } from "@/lib/i18n";
import { DEMO_PRICE, FINISH_LABEL, LEAD_TIME_LABEL, PORTAL_NAV, SPACE_LABEL } from "@/lib/i18n/common";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useLiveFixture, useStore } from "@/lib/store";
import { specLine } from "@/lib/catalog/filter";
import type { FinishId } from "@/lib/types";

/** /catalog/[slug] — stage at inline-start, the facts at inline-end. Starts unlit. */
export function ProductPage({ slug }: { slug: string }) {
  const t = useTx();
  const lang = useLang();
  const fixture = getFixtureBySlug(slug);
  const hydrated = useHydrated();
  const live = useLiveFixture(fixture?.id ?? "");
  const addToCart = useStore((s) => s.addToCart);
  const { toasts, push, dismiss } = useToasts();

  const [on, setOn] = useState(false);
  const [qty, setQty] = useState(1);
  const [finish, setFinish] = useState<FinishId | undefined>(fixture?.finishes[0]);
  const [boardOpen, setBoardOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);

  const others = useMemo(() => (fixture ? fixturesByBrand(fixture.brand).filter((f) => f.id !== fixture.id) : []), [fixture]);

  if (!fixture) return null;
  const brand = getBrand(fixture.brand);
  const brandName = brand?.name ?? fixture.brand;
  const leadTime = live?.leadTime ?? fixture.leadTime;
  const stock = live?.stock ?? fixture.stock;

  const onAddToCart = () => {
    addToCart(fixture.id, qty, finish);
    push({
      text: t({ he: `נוסף לסל: ${fixture.nameHe} ×${qty}`, en: `Added to cart: ${fixture.name} ×${qty}` }),
      href: "/cart",
      linkLabel: t({ he: "לסל", en: "Cart" }),
    });
  };

  const downloads = [
    { href: fixture.files.spec, label: t({ he: "גיליון מפרט (PDF)", en: "Spec sheet (PDF)" }), name: `${fixture.slug}-spec.pdf` },
    { href: fixture.files.ies, label: t({ he: "קובץ IES", en: "IES file" }), name: `${fixture.slug}.ies` },
    { href: fixture.files.dwg, label: t({ he: "DWG/DXF (הדגמה)", en: "DWG/DXF (demo)" }), name: `${fixture.slug}.dxf` },
  ];

  return (
    <>
      <article className="container-x pt-6 md:pt-10" data-testid="product-page" data-fixture={fixture.id}>
        <nav aria-label={t({ he: "מיקום באתר", en: "Breadcrumb" })} className="mb-6 flex flex-wrap items-center gap-2 font-mono text-[0.7rem] tracking-wider text-muted md:mb-8">
          <TransitionLink href="/catalog" className="hover:text-glow">{t({ he: "קטלוג", en: "Catalogue" })}</TransitionLink>
          <span aria-hidden>/</span>
          <TransitionLink href={`/catalog?brand=${fixture.brand}`} className="hover:text-glow" lang="en">{brandName}</TransitionLink>
          <span aria-hidden>/</span>
          <span className="text-paper" lang="en" aria-current="page">{fixture.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start lg:gap-16">
          <ProductStage fixture={fixture} on={on} onToggle={() => setOn((v) => !v)} />

          <SwitchOn offOpacity={0.3} delay={140} className="flex flex-col gap-8">
            <header>
              <p className="eyebrow">
                <TransitionLink href={`/catalog?brand=${fixture.brand}`} className="hover:text-glow" lang="en">{brandName}</TransitionLink>
                {brand && <span className="ms-2 normal-case tracking-normal text-muted">· {brand.country}</span>}
              </p>
              <h1 className="mt-3 font-display text-4xl leading-[1.02] md:text-6xl" lang="en">{fixture.name}</h1>
              <p className="mt-2 text-lg text-muted">{fixture.nameHe}</p>
              {(fixture.designer || fixture.year) && (
                <p className="mt-3 font-mono text-[0.72rem] tracking-wider text-muted" dir="ltr">
                  {fixture.designer && <span lang="en">{fixture.designer}</span>}
                  {fixture.designer && fixture.year && " · "}
                  {fixture.year}
                </p>
              )}
              <p className="mt-6 max-w-prose text-base leading-relaxed text-paper/90">{t(fixture.description)}</p>
              <p className="mt-4 font-mono text-[0.72rem] tracking-wide text-muted" dir="ltr">{specLine(fixture)}</p>
            </header>

            <section aria-labelledby="price-h" className="border-t hairline pt-6">
              <h2 id="price-h" className="sr-only">{t({ he: "מחיר והזמנה", en: "Price and order" })}</h2>
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <div>
                  <p className="num text-3xl text-paper md:text-4xl" dir="ltr" data-testid="price">{formatIls(fixture.price, lang)}</p>
                  <p className="mt-1 text-xs text-muted">{t({ he: "מחיר הדגמה כולל מע״מ", en: "Demo price incl. VAT" })}</p>
                </div>
                <span className={`chip ${leadTime === "stock" ? "is-on" : ""}`}>{hydrated ? t(LEAD_TIME_LABEL[leadTime]) : t(LEAD_TIME_LABEL[fixture.leadTime])}</span>
              </div>

              <fieldset className="m-0 mt-6 border-0 p-0">
                <legend className="eyebrow mb-3">{t({ he: "גימור", en: "Finish" })}</legend>
                <div role="radiogroup" aria-label={t({ he: "גימור", en: "Finish" })} className="flex flex-wrap gap-1.5">
                  {fixture.finishes.map((fin) => (
                    <button key={fin} type="button" role="radio" aria-checked={finish === fin} className={`chip ${finish === fin ? "is-on" : ""}`} onClick={() => setFinish(fin)} data-testid={`finish-${fin}`}>
                      <FinishSwatch id={fin} />{t(FINISH_LABEL[fin])}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <QtyStepper value={qty} onChange={setQty} />
                <button type="button" onClick={onAddToCart} className="btn btn-primary min-w-[10rem] flex-1 sm:flex-none" data-testid="add-to-cart">
                  {t({ he: "הוספה לסל", en: "Add to cart" })}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" onClick={() => setBoardOpen(true)} className="btn" data-testid="open-board">{t({ he: "הוספה ללוח פרויקט", en: "Add to project board" })}</button>
                <button type="button" onClick={() => setVisitOpen(true)} className="btn btn-brass" data-testid="open-appointment">{t({ he: "ראו באולם", en: "See it in the showroom" })}</button>
              </div>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <TransitionLink href={`/consultant?fixture=${fixture.id}`} className="text-muted underline-offset-4 hover:text-glow hover:underline">
                  {t({ he: "לשאול את היועץ", en: "Ask the consultant" })} <span className="badge-beta ms-1">{t({ he: "בטא", en: "Beta" })}</span>
                </TransitionLink>
                <TransitionLink href={`/relight?fixture=${fixture.id}`} className="text-muted underline-offset-4 hover:text-glow hover:underline">
                  {t({ he: "תאירו לי את הסלון עם הגוף הזה", en: "Light my living room with this one" })}
                </TransitionLink>
              </div>
            </section>

            <section aria-labelledby="spec-h">
              <h2 id="spec-h" className="eyebrow mb-3">{t({ he: "מפרט", en: "Specification" })}</h2>
              <SpecTable fixture={fixture} leadTime={hydrated ? leadTime : fixture.leadTime} stock={hydrated ? stock : fixture.stock} />
            </section>

            <section aria-labelledby="dl-h">
              <h2 id="dl-h" className="eyebrow mb-3">{t({ he: "קבצים", en: "Files" })}</h2>
              <div className="flex flex-wrap gap-2" data-testid="downloads">
                {downloads.map((d) => (
                  <a key={d.href} href={d.href} download={d.name} className="btn btn-sm">{d.label}</a>
                ))}
              </div>
            </section>
          </SwitchOn>
        </div>
      </article>

      {others.length > 0 && (
        <section className="container-x mt-20 md:mt-28" aria-labelledby="more-h">
          <SwitchOn offOpacity={0.3}>
            <div className="flex items-baseline justify-between gap-4 border-b hairline pb-4">
              <h2 id="more-h" className="font-display text-2xl md:text-3xl">
                {t({ he: "עוד מ-", en: "More from " })}<span lang="en">{brandName}</span>
              </h2>
              <TransitionLink href={`/catalog?brand=${fixture.brand}`} className="text-sm text-muted hover:text-glow">
                {t({ he: `כל הגופים של ${brandName}`, en: `All ${brandName}` })}
              </TransitionLink>
            </div>
          </SwitchOn>
          <ul className="no-scrollbar -mx-4 mt-8 flex snap-x gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:px-0 xl:grid-cols-4" data-testid="more-from-brand">
            {others.slice(0, 4).map((f) => (
              <li key={f.id} className="w-[64vw] shrink-0 snap-start sm:w-[42vw] md:w-auto">
                <ProductCard fixture={f} compact />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="container-x mt-16 md:mt-20" aria-labelledby="spaces-h">
        <SwitchOn offOpacity={0.3}>
          <h2 id="spaces-h" className="eyebrow mb-4">{t({ he: "מתאים גם ל…", en: "Also suits…" })}</h2>
          <ul className="flex flex-wrap gap-2" data-testid="spaces">
            {fixture.spaces.map((s) => (
              <li key={s}>
                <TransitionLink href={`/catalog?space=${s}`} className="chip hover:border-glow hover:text-glow">{t(SPACE_LABEL[s])}</TransitionLink>
              </li>
            ))}
          </ul>
        </SwitchOn>
      </section>

      <AddToBoardDialog
        open={boardOpen}
        onClose={() => setBoardOpen(false)}
        fixture={fixture}
        qty={qty}
        onDone={({ projectName, roomName }) =>
          push({
            text: t({ he: `נוסף ללוח: ${projectName} · ${roomName}`, en: `Added to board: ${projectName} · ${roomName}` }),
            href: PORTAL_NAV.studio.href,
            linkLabel: t(PORTAL_NAV.studio.label),
          })
        }
      />
      <AppointmentDialog open={visitOpen} onClose={() => setVisitOpen(false)} fixture={fixture} />
      <Toasts toasts={toasts} onDismiss={dismiss} />
      <p className="sr-only">{t(DEMO_PRICE)}</p>
    </>
  );
}
