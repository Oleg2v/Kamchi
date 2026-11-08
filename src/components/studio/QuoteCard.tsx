"use client";
import { useState } from "react";
import { getFixture, getStudio } from "@/lib/data";
import { formatDate, formatIls, useLang, useTx } from "@/lib/i18n";
import { bytesToObjectUrl, downloadBytes, generateQuotePdf } from "@/lib/pdf/quote-pdf";
import { useStore } from "@/lib/store";
import type { Project, Quote } from "@/lib/types";
import { leadTimeText } from "./labels";

/** A quote that arrived from the desk: lines, discounts, totals, validity, the PDF, acceptance. */
export function QuoteCard({ quote, project, flash = false, embedded = false }: { quote: Quote; project: Project; flash?: boolean; embedded?: boolean }) {
  const t = useTx();
  const lang = useLang();
  const acceptQuote = useStore((s) => s.acceptQuote);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [busy, setBusy] = useState<"pdf" | "preview" | null>(null);
  const [pdfError, setPdfError] = useState(false);
  const studio = getStudio(quote.studioId);
  const Heading = embedded ? "h4" : "h3";

  const ensurePdf = async () => {
    if (bytes) return bytes;
    if (!studio) throw new Error("studio missing");
    const b = await generateQuotePdf({ quote, project, studio, lang, getFixture });
    setBytes(b);
    return b;
  };
  const download = async () => {
    setBusy("pdf");
    setPdfError(false);
    try { downloadBytes(await ensurePdf(), `kamchi-quote-${quote.id}.pdf`); } catch (e) { console.error(e); setPdfError(true); } finally { setBusy(null); }
  };
  const preview = async () => {
    const w = window.open("about:blank", "_blank");
    setBusy("preview");
    setPdfError(false);
    try {
      const url = bytesToObjectUrl(await ensurePdf());
      if (w) w.location.href = url; else window.open(url, "_blank");
    } catch (e) { console.error(e); w?.close(); setPdfError(true); } finally { setBusy(null); }
  };
  const saving = quote.subtotal - quote.total;

  return (
    <article className={`panel ${flash ? "flash-warm" : ""}`} aria-labelledby={`quote-${quote.id}`} data-autopilot={`quote-card:${quote.id}`}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b hairline px-4 py-3">
        <Heading id={`quote-${quote.id}`} className="font-display text-xl text-paper md:text-2xl">
          {t({ he: "הצעת מחיר", en: "Quote" })} <span className="num text-sm text-muted" dir="ltr">{quote.id}</span>
        </Heading>
        <p className="num text-xs text-muted" dir={lang === "he" ? "rtl" : "ltr"}>
          {formatDate(quote.sentAt, lang)} {lang === "he" ? "←" : "→"} {formatDate(quote.validUntil, lang)}
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-start text-[0.7rem] font-normal text-muted">
              <th scope="col" className="px-4 py-2 text-start font-normal">{t({ he: "גוף תאורה", en: "Fixture" })}</th>
              <th scope="col" className="px-2 py-2 text-start font-normal">{t({ he: "חדר", en: "Room" })}</th>
              <th scope="col" className="px-2 py-2 text-end font-normal">{t({ he: "כמות", en: "Qty" })}</th>
              <th scope="col" className="hidden px-2 py-2 text-end font-normal sm:table-cell">{t({ he: "מחירון", en: "List" })}</th>
              <th scope="col" className="px-2 py-2 text-end font-normal">{t({ he: "הנחה", en: "Disc." })}</th>
              <th scope="col" className="px-4 py-2 text-end font-normal">{t({ he: "נטו", en: "Net" })}</th>
            </tr>
          </thead>
          <tbody className="divide-y hairline">
            {quote.lines.map((ln, i) => {
              const f = getFixture(ln.fixtureId);
              const room = project.rooms.find((r) => r.id === ln.roomId);
              const net = Math.round(ln.listPrice * ln.qty * (1 - ln.discountPct / 100));
              return (
                <tr key={`${ln.fixtureId}-${ln.roomId}-${i}`}>
                  <td className="px-4 py-2.5">
                    <p className="text-paper">{f ? (lang === "he" ? f.nameHe : f.name) : ln.fixtureId}</p>
                    <p className={`text-[0.72rem] ${ln.leadTime === "stock" ? "text-brass-light" : "text-muted"}`}>{leadTimeText(ln.leadTime, f?.brand, lang)}</p>
                  </td>
                  <td className="px-2 py-2.5 text-muted">{room ? (lang === "he" ? room.name : room.nameEn) : "—"}</td>
                  <td className="num px-2 py-2.5 text-end" dir="ltr">{ln.qty}</td>
                  <td className="num hidden px-2 py-2.5 text-end text-muted sm:table-cell" dir="ltr">{formatIls(ln.listPrice, lang)}</td>
                  <td className="num px-2 py-2.5 text-end text-muted" dir="ltr">{ln.discountPct}%</td>
                  <td className="num px-4 py-2.5 text-end text-paper" dir="ltr">{formatIls(net, lang)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <dl className="grid gap-1 border-t hairline px-4 py-3 text-sm sm:grid-cols-[1fr_auto] sm:justify-items-end">
        <dt className="text-muted sm:justify-self-start">{t({ he: "סה״כ מחירון", en: "List subtotal" })}</dt>
        <dd className="num text-muted" dir="ltr">{formatIls(quote.subtotal, lang)}</dd>
        <dt className="text-muted sm:justify-self-start">{t({ he: `הנחת מועדון (${quote.discountPct}%)`, en: `Club discount (${quote.discountPct}%)` })}</dt>
        <dd className="num text-muted" dir="ltr">−{formatIls(saving, lang)}</dd>
        <dt className="text-paper sm:justify-self-start">{t({ he: "לתשלום (כולל מע״מ)", en: "Total (incl. VAT)" })}</dt>
        <dd className="num text-xl text-glow" dir="ltr">{formatIls(quote.total, lang)}</dd>
      </dl>
      {quote.note && <p className="border-t hairline px-4 py-3 text-[0.8rem] text-muted">{quote.note}</p>}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t hairline px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-sm" onClick={download} disabled={busy !== null} data-autopilot="quote-pdf">
            {busy === "pdf" ? t({ he: "מכין PDF…", en: "Preparing PDF…" }) : t({ he: "הורדת PDF", en: "Download PDF" })}
          </button>
          <button type="button" className="btn btn-sm" onClick={preview} disabled={busy !== null}>
            {t({ he: "תצוגה מקדימה", en: "Preview" })}
          </button>
        </div>
        {pdfError && <p role="alert" className="basis-full text-xs text-brass-light">{t({ he: "ה־PDF לא הוכן. ההצעה עצמה שמורה — נסו שוב בעוד רגע.", en: "The PDF could not be prepared. The quote itself is saved — try again in a moment." })}</p>}
        {quote.acceptedAt ? (
          <p className="text-sm text-brass-light">
            {t({ he: "ההצעה אושרה", en: "Accepted" })} · <span className="num" dir="ltr">{formatDate(quote.acceptedAt, lang)}</span>
          </p>
        ) : (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => acceptQuote(quote.id)} data-autopilot="quote-accept">
            {t({ he: "אישור ההצעה", en: "Accept quote" })}
          </button>
        )}
      </footer>
    </article>
  );
}
