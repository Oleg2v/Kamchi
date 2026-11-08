"use client";
import "./catalog.css";
import { useMemo, useState } from "react";
import { TransitionLink } from "@/components/brand/TransitionLink";
import { SwitchOn } from "@/components/light/SwitchOn";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { LampFrame } from "./LampFrame";
import { QtyStepper } from "./QtyStepper";
import { QuoteRequestDialog } from "./QuoteRequestDialog";
import { FinishSwatch } from "./SpecTable";
import { Toasts, useToasts } from "./Toast";
import { getBrand, getFixture } from "@/lib/data";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useInView } from "@/lib/hooks/useInView";
import { formatIls, useLang, useTx } from "@/lib/i18n";
import { FINISH_LABEL, LEAD_TIME_LABEL } from "@/lib/i18n/common";
import { useLiveFixture, useStore } from "@/lib/store";
import type { CartItem, Fixture, LeadTime } from "@/lib/types";

const LEAD_ORDER: LeadTime[] = ["stock", "weeks-2-4", "weeks-6-8", "weeks-10-12"];

function CartLine({ item, fixture }: { item: CartItem; fixture: Fixture }) {
  const t = useTx();
  const lang = useLang();
  const setCartQty = useStore((s) => s.setCartQty);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const live = useLiveFixture(fixture.id);
  const [ref, inView] = useInView<HTMLLIElement>();
  const brand = getBrand(fixture.brand);
  const leadTime = live?.leadTime ?? fixture.leadTime;
  return (
    <li ref={ref} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 border-b hairline py-5 md:grid-cols-[5.5rem_minmax(0,1fr)_auto_7rem_7rem] md:items-center md:gap-x-6" data-testid="cart-line" data-fixture={fixture.id}>
      <TransitionLink href={`/catalog/${fixture.slug}`} className="block aspect-[10/13] border hairline bg-night" aria-label={fixture.name}>
        <LampFrame fixture={fixture} lit={inView} offOpacity={0.5} className="h-full w-full p-1.5" />
      </TransitionLink>
      <div className="min-w-0">
        <p className="eyebrow truncate">{brand?.name ?? fixture.brand}</p>
        <TransitionLink href={`/catalog/${fixture.slug}`} className="font-display text-xl leading-tight hover:text-glow md:text-2xl" lang="en">{fixture.name}</TransitionLink>
        <p className="text-sm text-muted">{fixture.nameHe}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {item.finish && <span className="inline-flex items-center gap-1.5"><FinishSwatch id={item.finish} className="h-3 w-3" />{t(FINISH_LABEL[item.finish])}</span>}
          <span className={leadTime === "stock" ? "text-glow" : ""}>{t(LEAD_TIME_LABEL[leadTime])}</span>
        </p>
      </div>
      <div className="col-start-2 flex flex-wrap items-center justify-between gap-3 md:col-start-auto md:justify-start">
        <QtyStepper value={item.qty} onChange={(n) => setCartQty(fixture.id, n)} size="sm" label={t({ he: `כמות — ${fixture.nameHe}`, en: `Quantity — ${fixture.name}` })} />
        <button type="button" onClick={() => removeFromCart(fixture.id)} className="text-xs text-muted underline-offset-4 hover:text-glow hover:underline md:hidden" aria-label={t({ he: `הסרת ${fixture.nameHe} מהסל`, en: `Remove ${fixture.name} from cart` })}>{t({ he: "הסרה", en: "Remove" })}</button>
      </div>
      <p className="hidden text-sm md:block md:text-end"><span className="num" dir="ltr">{formatIls(fixture.price, lang)}</span><span className="block text-[0.66rem] text-muted">{t({ he: "ליחידה", en: "each" })}</span></p>
      <p className="col-start-2 text-sm md:col-start-auto md:text-end">
        <span className="num text-base text-paper" dir="ltr" data-testid="line-total">{formatIls(fixture.price * item.qty, lang)}</span>
        <button type="button" onClick={() => removeFromCart(fixture.id)} className="ms-4 hidden text-xs text-muted underline-offset-4 hover:text-glow hover:underline md:inline" aria-label={t({ he: `הסרת ${fixture.nameHe} מהסל`, en: `Remove ${fixture.name} from cart` })}>{t({ he: "הסרה", en: "Remove" })}</button>
      </p>
    </li>
  );
}

function CartEmpty() {
  const t = useTx();
  const [lit, setLit] = useState(false);
  const lamp = getFixture("artemide-ramo-tavolo");
  return (
    <section className="container-x grid place-items-center py-16 text-center md:py-24" data-testid="cart-empty">
      {lamp && <LampFrame fixture={lamp} lit={lit} offOpacity={0.5} className="mb-8 w-44 md:w-60" />}
      <h1 className="font-display text-4xl md:text-6xl">{t({ he: "הסל ריק", en: "The cart is empty" })}</h1>
      <p className="mt-4 max-w-md text-muted">{t({ he: "עדיין לא בחרתם גוף תאורה. בקטלוג כל גוף נדלק כשמגיעים אליו.", en: "No fixture chosen yet. In the catalogue every piece lights up as you reach it." })}</p>
      <TransitionLink
        href="/catalog"
        className="btn btn-primary mt-8"
        onPointerEnter={() => setLit(true)}
        onPointerLeave={() => setLit(false)}
        onFocus={() => setLit(true)}
        onBlur={() => setLit(false)}
        data-testid="to-catalog"
      >
        {t({ he: "לקטלוג", en: "To the catalogue" })}
      </TransitionLink>
    </section>
  );
}

function CartSkeleton() {
  return (
    <div className="container-x pt-10 md:pt-16" aria-busy="true">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-4 h-14 w-40 md:h-20 md:w-56" />
      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-4">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

/** /cart — lines, totals, a quote request for private customers. Persisted state arrives after mount. */
export function CartPage() {
  const t = useTx();
  const lang = useLang();
  const hydrated = useHydrated();
  const cart = useStore((s) => s.cart);
  const clearCart = useStore((s) => s.clearCart);
  const leadTimes = useStore((s) => s.leadTimes);
  const { toasts, push, dismiss } = useToasts();
  const [quoteOpen, setQuoteOpen] = useState(false);

  const lines = useMemo(() => cart.map((c) => ({ item: c, fixture: getFixture(c.fixtureId) })).filter((l): l is { item: CartItem; fixture: Fixture } => !!l.fixture), [cart]);
  const count = lines.reduce((n, l) => n + l.item.qty, 0);
  const subtotal = lines.reduce((n, l) => n + l.fixture.price * l.item.qty, 0);
  const vat = Math.round(subtotal - subtotal / 1.18);
  const slowest = lines.reduce<LeadTime>((acc, l) => {
    const lt = leadTimes[l.fixture.id] ?? l.fixture.leadTime;
    return LEAD_ORDER.indexOf(lt) > LEAD_ORDER.indexOf(acc) ? lt : acc;
  }, "stock");

  if (!hydrated) return <CartSkeleton />;
  if (lines.length === 0) return <CartEmpty />;

  return (
    <>
      <PageHeader
        eyebrow={t({ he: "הסל", en: "Cart" })}
        title={count === 1 ? t({ he: "גוף תאורה אחד", en: "One fixture" }) : <>{count} {t({ he: "גופי תאורה", en: "fixtures" })}</>}
        lede={t({ he: "המחירים הם מחירי הדגמה וכוללים מע״מ. מעצבים ואדריכלים מקבלים הצעה דרך הסטודיו; לקוחות פרטיים מוזמנים לבקש הצעת מחיר כאן.", en: "Prices are demo prices and include VAT. Designers and architects quote through the studio; private customers can request a quote here." })}
      />
      <section className="container-x grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-16" aria-label={t({ he: "תוכן הסל", en: "Cart contents" })}>
        <ul className="border-t hairline" data-testid="cart-lines">
          {lines.map((l) => <CartLine key={l.item.fixtureId} item={l.item} fixture={l.fixture} />)}
        </ul>

        <SwitchOn as="aside" offOpacity={0.3} delay={120} className="panel p-6 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]" aria-label={t({ he: "סיכום", en: "Summary" })}>
          <h2 className="eyebrow">{t({ he: "סיכום", en: "Summary" })}</h2>
          <dl className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex items-baseline justify-between gap-4"><dt className="text-muted">{t({ he: "סכום ביניים", en: "Subtotal" })}</dt><dd className="num text-2xl text-paper" dir="ltr" data-testid="subtotal">{formatIls(subtotal, lang)}</dd></div>
            <div className="flex items-baseline justify-between gap-4"><dt className="text-muted">{t({ he: "מתוכו מע״מ (18%)", en: "of which VAT (18%)" })}</dt><dd className="num text-muted" dir="ltr">{formatIls(vat, lang)}</dd></div>
            <div className="flex items-baseline justify-between gap-4"><dt className="text-muted">{t({ he: "זמן אספקה משוער", en: "Estimated lead time" })}</dt><dd className={slowest === "stock" ? "text-glow" : "text-paper"}>{t(LEAD_TIME_LABEL[slowest])}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-muted">{t({ he: "מחירי הדגמה כולל מע״מ. הובלה והתקנה בנפרד.", en: "Demo prices incl. VAT. Delivery and installation separate." })}</p>
          <div className="mt-6 flex flex-col gap-3">
            <button type="button" onClick={() => setQuoteOpen(true)} className="btn btn-primary" data-testid="request-quote">{t({ he: "בקשת הצעת מחיר", en: "Request a quote" })}</button>
            <TransitionLink href="/catalog" className="btn">{t({ he: "המשך לקטלוג", en: "Back to the catalogue" })}</TransitionLink>
            <button
              type="button"
              onClick={() => { clearCart(); push({ text: t({ he: "הסל רוקן", en: "Cart emptied" }) }); }}
              className="text-sm text-muted underline-offset-4 hover:text-glow hover:underline"
              data-testid="clear-cart"
            >
              {t({ he: "רוקן סל", en: "Empty cart" })}
            </button>
          </div>
        </SwitchOn>
      </section>

      <QuoteRequestDialog open={quoteOpen} onClose={() => setQuoteOpen(false)} cart={cart} total={subtotal} />
      <Toasts toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
