"use client";
import { useMemo, useState } from "react";
import { brandLine, fixtureName } from "@/components/studio/labels";
import { getBrand, getFixture, getStudio } from "@/lib/data";
import { formatIls, tx, useLang, useTx } from "@/lib/i18n";
import { DEMO_PRICE, LEAD_TIME_LABEL } from "@/lib/i18n/common";
import { DEFAULT_QUOTE_NOTE } from "@/lib/autopilot/script";
import { bytesToObjectUrl, downloadBytes } from "@/lib/pdf/download";
import { generateQuotePdfLazy as generateQuotePdf } from "@/lib/pdf/lazy";
import { useStore } from "@/lib/store";
import type { LeadTime, Project, Quote, QuoteLine, QuoteRequest } from "@/lib/types";

const LEAD_TIMES: LeadTime[] = ["stock", "weeks-2-4", "weeks-6-8", "weeks-10-12"];

type Override = { leadTime?: LeadTime; discountPct?: number | null };

function leadOption(lt: LeadTime, brandId: string, lang: "he" | "en") {
  const label = lang === "he" ? LEAD_TIME_LABEL[lt].he : LEAD_TIME_LABEL[lt].en;
  if (lt === "stock") return label;
  const brand = getBrand(brandId)?.name ?? brandId;
  return `${brand}: ${label}`;
}

/**
 * The quote editor: the studio's tier discount, a lead time and an optional discount per line,
 * a note, live totals in mono — and one button that sends the quote and prints the PDF.
 */
export function QuoteEditor({ request, project, onSent, embedded = false }: { request: QuoteRequest; project: Project; onSent: (quote: Quote, pdf: Uint8Array) => void; embedded?: boolean }) {
  const t = useTx();
  const lang = useLang();
  const storeDiscount = useStore((s) => s.studioDiscounts[request.studioId]);
  const leadTimes = useStore((s) => s.leadTimes);
  const setStudioDiscount = useStore((s) => s.setStudioDiscount);
  const sendQuote = useStore((s) => s.sendQuote);
  const studio = getStudio(request.studioId);
  const base = storeDiscount ?? studio?.discountPct ?? 20;

  const [discountText, setDiscountText] = useState(String(base));
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [note, setNote] = useState(() => tx(lang, DEFAULT_QUOTE_NOTE));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const discount = Math.min(60, Math.max(0, Number(discountText) || 0));

  const lines = useMemo(() => {
    const out: (QuoteLine & { key: string; roomName: string; brandId: string; nameHe: string; name: string; label: string; brand: string; override: boolean })[] = [];
    for (const room of project.rooms) {
      for (const it of room.items) {
        const f = getFixture(it.fixtureId);
        if (!f) continue;
        const key = `${room.id}:${it.id}`;
        const ov = overrides[key] ?? {};
        const lineDisc = ov.discountPct ?? null;
        out.push({
          key,
          fixtureId: it.fixtureId,
          roomId: room.id,
          qty: it.qty,
          listPrice: f.price,
          discountPct: lineDisc ?? discount,
          leadTime: ov.leadTime ?? leadTimes[it.fixtureId] ?? f.leadTime,
          roomName: lang === "he" ? room.name : room.nameEn,
          brandId: f.brand,
          nameHe: f.nameHe,
          name: f.name,
          label: fixtureName(f, lang),
          brand: brandLine(f, lang),
          override: lineDisc !== null,
        });
      }
    }
    return out;
  }, [project.rooms, overrides, discount, leadTimes, lang]);

  const subtotal = lines.reduce((s, l) => s + l.listPrice * l.qty, 0);
  const total = Math.round(lines.reduce((s, l) => s + l.listPrice * l.qty * (1 - l.discountPct / 100), 0));
  const stockCount = lines.filter((l) => l.leadTime === "stock").length;

  const commitDiscount = () => {
    setDiscountText(String(discount));
    if (discount !== base) setStudioDiscount(request.studioId, discount);
  };

  const send = async () => {
    if (!lines.length || !studio) return;
    setBusy(true);
    setError(null);
    try {
      const quote = sendQuote({
        requestId: request.id,
        lines: lines.map(({ fixtureId, roomId, qty, listPrice, discountPct, leadTime }) => ({ fixtureId, roomId, qty, listPrice, discountPct, leadTime })),
        discountPct: discount,
        note: note.trim() || undefined,
      });
      if (!quote) throw new Error("request missing");
      const fresh = useStore.getState().projects.find((p) => p.id === project.id) ?? project;
      const pdf = await generateQuotePdf({ quote, project: fresh, studio, lang, getFixture });
      onSent(quote, pdf);
    } catch (e) {
      console.error(e);
      setError(t({ he: "משהו השתבש בהכנת ה־PDF. ההצעה נשמרה — אפשר לנסות שוב.", en: "The PDF could not be prepared. The quote was saved — try again." }));
    } finally {
      setBusy(false);
    }
  };

  const Heading = embedded ? "h5" : "h4";

  return (
    <section className="panel min-w-0" aria-labelledby={`qe-${request.id}`} data-autopilot="quote-editor">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b hairline px-4 py-3">
        <Heading id={`qe-${request.id}`} className="font-display text-xl text-paper md:text-2xl">{t({ he: "הצעת מחיר", en: "Quote" })}</Heading>
        <label className="flex items-center gap-2 text-sm text-muted">
          <span>{t({ he: "הנחת סטודיו", en: "Studio discount" })}{studio && <span className="num ms-1 text-[0.7rem]" dir="ltr">({t({ he: "דרגה", en: "tier" })} {studio.tier})</span>}</span>
          <span className="inline-flex items-stretch border hairline">
            <input
              type="number"
              min={0}
              max={60}
              step={1}
              inputMode="numeric"
              dir="ltr"
              className="num w-16 bg-night px-2 py-1 text-end text-sm text-paper outline-none focus:bg-charcoal"
              value={discountText}
              onChange={(e) => setDiscountText(e.target.value)}
              onBlur={commitDiscount}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              aria-label={t({ he: "אחוז הנחת סטודיו", en: "Studio discount percent" })}
              data-autopilot="studio-discount"
            />
            <span className="num border-s hairline px-2 py-1 text-sm text-muted">%</span>
          </span>
        </label>
      </header>

      <div className="overflow-x-auto">
        <table className="portal-table w-full text-sm">
          <thead>
            <tr className="text-[0.7rem] text-muted">
              <th scope="col" className="px-4 py-2 text-start font-normal">{t({ he: "גוף תאורה", en: "Fixture" })}</th>
              <th scope="col" className="px-2 py-2 text-end font-normal">{t({ he: "כמות", en: "Qty" })}</th>
              <th scope="col" className="px-2 py-2 text-end font-normal">{t({ he: "מחירון", en: "List" })}</th>
              <th scope="col" className="px-2 py-2 text-start font-normal">{t({ he: "זמן אספקה", en: "Lead time" })}</th>
              <th scope="col" className="px-2 py-2 text-end font-normal">{t({ he: "הנחה", en: "Disc." })}</th>
              <th scope="col" className="px-4 py-2 text-end font-normal">{t({ he: "נטו", en: "Net" })}</th>
            </tr>
          </thead>
          <tbody className="divide-y hairline">
            {lines.map((ln, i) => {
              const net = Math.round(ln.listPrice * ln.qty * (1 - ln.discountPct / 100));
              return (
                <tr key={ln.key} className="px-4 md:align-top">
                  <td className="cell-wide md:px-4 md:py-2.5">
                    <p className="text-paper">{ln.label}</p>
                    <p className="font-mono text-[0.66rem] uppercase tracking-wider text-muted"><span dir="ltr">{ln.brand}</span></p>
                    <p className="text-[0.72rem] text-muted">{ln.roomName}</p>
                  </td>
                  <td className="num md:px-2 md:py-2.5 md:text-end"><span className="cell-label me-1.5 text-[0.7rem] text-muted">{t({ he: "כמות", en: "Qty" })}</span><span dir="ltr">{ln.qty}</span></td>
                  <td className="num cell-end text-muted md:px-2 md:py-2.5"><span className="cell-label me-1.5 text-[0.7rem]">{t({ he: "מחירון", en: "List" })}</span><span dir="ltr">{formatIls(ln.listPrice, lang)}</span></td>
                  <td className="md:px-2 md:py-2.5">
                    <select
                      className={`field min-h-8 w-full py-1 text-[0.8rem] md:min-w-[9.5rem] ${ln.leadTime === "stock" ? "text-brass-light" : ""}`}
                      value={ln.leadTime}
                      onChange={(e) => setOverrides((o) => ({ ...o, [ln.key]: { ...o[ln.key], leadTime: e.target.value as LeadTime } }))}
                      aria-label={`${t({ he: "זמן אספקה", en: "Lead time" })} — ${lang === "he" ? ln.nameHe : ln.name}`}
                      data-autopilot={`lead-time:${i}`}
                    >
                      {LEAD_TIMES.map((lt) => (
                        <option key={lt} value={lt}>{leadOption(lt, ln.brandId, lang)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="cell-end md:px-2 md:py-2.5">
                    <span className="inline-flex items-stretch border hairline">
                      <input
                        type="number"
                        min={0}
                        max={60}
                        step={1}
                        inputMode="numeric"
                        dir="ltr"
                        className={`num w-12 bg-night px-1.5 py-0.5 text-end text-[0.8rem] outline-none focus:bg-charcoal ${ln.override ? "text-paper" : "text-muted"}`}
                        value={ln.discountPct}
                        onChange={(e) => {
                          const v = e.target.value === "" ? null : Math.min(60, Math.max(0, Number(e.target.value) || 0));
                          setOverrides((o) => ({ ...o, [ln.key]: { ...o[ln.key], discountPct: v } }));
                        }}
                        aria-label={`${t({ he: "הנחה לשורה", en: "Line discount" })} — ${lang === "he" ? ln.nameHe : ln.name}`}
                        data-autopilot={`line-discount:${i}`}
                      />
                      <span className="num border-s hairline px-1 py-0.5 text-[0.75rem] text-muted">%</span>
                    </span>
                  </td>
                  <td className="num cell-wide cell-end text-paper md:px-4 md:py-2.5"><span className="cell-label me-1.5 text-[0.7rem] text-muted">{t({ he: "נטו", en: "Net" })}</span><span dir="ltr">{formatIls(net, lang)}</span></td>
                </tr>
              );
            })}
            {lines.length === 0 && (
              <tr><td colSpan={6} className="cell-wide px-4 py-6 text-center text-muted">{t({ he: "הלוח ריק — אין מה לתמחר.", en: "The board is empty — nothing to price." })}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 border-t hairline px-4 py-4 md:grid-cols-[minmax(0,1fr)_16rem]">
        <label className="grid gap-1.5 text-sm">
          <span className="text-muted">{t({ he: "הערה בהצעה", en: "Note on the quote" })}</span>
          <textarea className="field min-h-20 resize-y text-[0.85rem]" value={note} onChange={(e) => setNote(e.target.value)} data-autopilot="quote-note" />
        </label>
        <dl className="grid content-start gap-1 text-sm" aria-live="polite">
          <div className="flex justify-between gap-3"><dt className="text-muted">{t({ he: "סה״כ מחירון", en: "List subtotal" })}</dt><dd className="num text-muted" dir="ltr">{formatIls(subtotal, lang)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted">{t({ he: "הנחה", en: "Discount" })}</dt><dd className="num text-muted" dir="ltr">−{formatIls(subtotal - total, lang)}</dd></div>
          <div className="flex justify-between gap-3 border-t hairline pt-1.5"><dt className="text-paper">{t({ he: "לתשלום (כולל מע״מ)", en: "Total (incl. VAT)" })}</dt><dd className="num text-xl text-glow" dir="ltr" data-autopilot="quote-total">{formatIls(total, lang)}</dd></div>
          <div className="num text-[0.7rem] text-muted" dir="ltr">{lines.length} {lang === "he" ? "שורות" : "lines"} · {stockCount} {lang === "he" ? "במלאי" : "in stock"} · {t(DEMO_PRICE)}</div>
        </dl>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t hairline px-4 py-3">
        <p className="text-xs text-muted">{t({ he: "ההצעה נשלחת לסטודיו עם PDF, ומופיעה אצל המעצב מיד.", en: "The quote goes to the studio with a PDF and appears for the designer at once." })}</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={send} disabled={busy || lines.length === 0} data-autopilot="send-quote">
          {busy ? t({ he: "מכין PDF…", en: "Preparing PDF…" }) : t({ he: "שליחת הצעת מחיר (PDF)", en: "Send quote (PDF)" })}
        </button>
      </footer>
      {error && <p role="alert" className="border-t border-brass/50 px-4 py-2 text-xs text-brass-light">{error}</p>}
    </section>
  );
}

/** After sending: the quote at a glance, with the PDF ready to download or preview. */
export function SentQuotePanel({ quote, project, pdf, justSent = false, onBack, embedded = false }: { quote: Quote; project: Project; pdf: Uint8Array | null; justSent?: boolean; onBack?: () => void; embedded?: boolean }) {
  const t = useTx();
  const lang = useLang();
  const [bytes, setBytes] = useState<Uint8Array | null>(pdf);
  const [busy, setBusy] = useState<"pdf" | "preview" | null>(null);
  const studio = getStudio(quote.studioId);
  const Heading = embedded ? "h5" : "h4";

  const ensure = async () => {
    if (bytes) return bytes;
    if (!studio) throw new Error("studio missing");
    const b = await generateQuotePdf({ quote, project, studio, lang, getFixture });
    setBytes(b);
    return b;
  };
  const download = async () => { setBusy("pdf"); try { downloadBytes(await ensure(), `kamchi-quote-${quote.id}.pdf`); } finally { setBusy(null); } };
  const preview = async () => {
    const w = window.open("about:blank", "_blank");
    setBusy("preview");
    try { const url = bytesToObjectUrl(await ensure()); if (w) w.location.href = url; else window.open(url, "_blank"); } finally { setBusy(null); }
  };

  return (
    <section className={`panel ${justSent ? "flash-warm" : ""}`} aria-labelledby={`sent-${quote.id}`} data-autopilot="quote-sent" aria-live="polite">
      <div className="grid gap-3 px-4 py-4">
        <p className="flex flex-wrap items-center gap-2 text-sm text-brass-light">
          <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${justSent ? "bg-glow shadow-glow" : "bg-brass"}`} />
          {justSent ? t({ he: "הצעת המחיר נשלחה לסטודיו עכשיו", en: "The quote has just gone to the studio" }) : t({ he: "הצעת מחיר נשלחה", en: "Quote sent" })}
          {quote.acceptedAt && <span className="chip is-on px-2 py-0.5 text-[0.68rem]">{t({ he: "אושרה", en: "Accepted" })}</span>}
        </p>
        <Heading id={`sent-${quote.id}`} className="font-display text-2xl text-paper">
          <span className="num text-glow" dir="ltr">{formatIls(quote.total, lang)}</span>
          <span className="ms-3 text-base text-muted">{t({ he: "כולל מע״מ", en: "incl. VAT" })}</span>
        </Heading>
        <p className="num text-xs text-muted" dir={lang === "he" ? "rtl" : "ltr"}>
          <span dir="ltr">{quote.id}</span> · <span dir="ltr">{quote.lines.length}</span> {lang === "he" ? "שורות" : "lines"} · <span dir="ltr">{quote.discountPct}%</span> · {new Intl.DateTimeFormat(lang === "he" ? "he-IL" : "en-GB", { day: "numeric", month: "short" }).format(new Date(quote.sentAt))} {lang === "he" ? "←" : "→"} {new Intl.DateTimeFormat(lang === "he" ? "he-IL" : "en-GB", { day: "numeric", month: "short" }).format(new Date(quote.validUntil))}
        </p>
        {quote.note && <p className="text-[0.8rem] text-muted">{quote.note}</p>}
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t hairline px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-sm" onClick={download} disabled={busy !== null} data-autopilot="desk-quote-pdf">
            {busy === "pdf" ? t({ he: "מכין PDF…", en: "Preparing PDF…" }) : t({ he: "הורדת PDF", en: "Download PDF" })}
          </button>
          <button type="button" className="btn btn-sm" onClick={preview} disabled={busy !== null}>{t({ he: "תצוגה מקדימה", en: "Preview" })}</button>
        </div>
        {onBack && <button type="button" className="lit-link text-sm text-muted" onClick={onBack}>{t({ he: "חזרה לבקשות", en: "Back to requests" })}</button>}
      </footer>
    </section>
  );
}
