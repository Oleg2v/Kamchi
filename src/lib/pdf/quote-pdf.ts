"use client";
import { PDFDocument, PDFFont, PDFPage, rgb, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { toVisual } from "./bidi";
import type { Fixture, Lang, Project, Quote, Studio } from "../types";
import { LEAD_TIME_LABEL, ADDRESS } from "../i18n/common";
import { tx } from "../i18n";

const NIGHT = rgb(0.02, 0.02, 0.02);
const CHARCOAL = rgb(0.08, 0.08, 0.08);
const PAPER = rgb(0.949, 0.933, 0.902);
const MUTED = rgb(0.663, 0.647, 0.616);
const BRASS = rgb(0.722, 0.584, 0.357);
const WARM = rgb(1, 0.851, 0.659);

const A4 = { w: 595.28, h: 841.89 };
const M = 42; // margin

interface Fonts { ui: PDFFont; uiBold: PDFFont; display: PDFFont; mono: PDFFont }

let fontCache: Promise<Record<string, ArrayBuffer>> | null = null;
async function loadFontBytes() {
  if (!fontCache) {
    fontCache = (async () => {
      const names = ["Heebo-Regular", "Heebo-Bold", "DavidLibre-Bold", "IBMPlexMono-Regular"];
      const out: Record<string, ArrayBuffer> = {};
      await Promise.all(names.map(async (n) => { out[n] = await (await fetch(`/fonts/${n}.ttf`)).arrayBuffer(); }));
      return out;
    })();
  }
  return fontCache;
}

export interface QuotePdfInput {
  quote: Quote;
  project: Project;
  studio: Studio;
  lang: Lang;
  getFixture: (id: string) => Fixture | undefined;
}

/** Draws text aligned to the right edge (RTL) or left edge (LTR), applying bidi reordering. */
function text(page: PDFPage, s: string, opts: { x: number; y: number; size: number; font: PDFFont; color?: RGB; align?: "right" | "left" | "center"; rtl?: boolean; maxWidth?: number }) {
  const { x, y, size, font, color = PAPER, align = "right", rtl = true } = opts;
  let str = s;
  if (opts.maxWidth) {
    while (str.length > 1 && font.widthOfTextAtSize(str, size) > opts.maxWidth) str = str.slice(0, -2) + "…";
  }
  const vis = rtl ? toVisual(str, "rtl") : str;
  const w = font.widthOfTextAtSize(vis, size);
  const dx = align === "right" ? x - w : align === "center" ? x - w / 2 : x;
  page.drawText(vis, { x: dx, y, size, font, color });
  return w;
}

function fmtIls(n: number, lang: Lang) {
  return `₪${new Intl.NumberFormat(lang === "he" ? "he-IL" : "en-IL", { maximumFractionDigits: 0 }).format(n)}`;
}
function fmtDate(iso: string, lang: Lang) {
  return new Intl.DateTimeFormat(lang === "he" ? "he-IL" : "en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
}

/**
 * Quote PDF: dark paper, warm type, brass rules. Hebrew is reordered with the UBA
 * because pdf-lib has no shaping; Hebrew has no contextual forms so reordering suffices.
 */
export async function generateQuotePdf(input: QuotePdfInput): Promise<Uint8Array> {
  const { quote, project, studio, lang, getFixture } = input;
  const rtl = lang === "he";
  const t = (s: { he: string; en: string }) => tx(lang, s);
  const bytes = await loadFontBytes();

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fonts: Fonts = {
    ui: await doc.embedFont(bytes["Heebo-Regular"], { subset: true }),
    uiBold: await doc.embedFont(bytes["Heebo-Bold"], { subset: true }),
    display: await doc.embedFont(bytes["DavidLibre-Bold"], { subset: true }),
    mono: await doc.embedFont(bytes["IBMPlexMono-Regular"], { subset: true }),
  };
  doc.setTitle(`${t({ he: "הצעת מחיר", en: "Quote" })} ${quote.id} — ${t({ he: "קמחי תאורה (הדמיה)", en: "Kamchi Lighting (demo)" })}`);
  doc.setAuthor("Kamchi Lighting — Kikkey concept demo");
  doc.setSubject("Demo quote. Not a binding offer.");

  const R = A4.w - M; // right edge
  const L = M;        // left edge
  const start = rtl ? R : L;         // inline-start x
  const end = rtl ? L : R;           // inline-end x
  const alignStart = rtl ? "right" : "left";
  const alignEnd = rtl ? "left" : "right";

  let page = doc.addPage([A4.w, A4.h]);
  const paintBg = (p: PDFPage) => p.drawRectangle({ x: 0, y: 0, width: A4.w, height: A4.h, color: NIGHT });
  paintBg(page);

  // ── Header: filament + wordmark
  const drawHeader = (p: PDFPage) => {
    p.drawSvgPath("M 0 0 C 10 -36, 22 -36, 30 -12 S 50 18, 60 -14 S 80 -40, 92 -6", { x: rtl ? R - 92 : L, y: A4.h - 44, borderColor: WARM, borderWidth: 1.4, scale: 0.6 });
    text(p, t({ he: "קמחי תאורה", en: "Kamchi Lighting" }), { x: rtl ? R - 70 : L + 70, y: A4.h - 52, size: 18, font: fonts.display, align: alignStart, rtl });
    text(p, t({ he: "הצעת מחיר · הדמיה", en: "Quote · demo" }), { x: end, y: A4.h - 50, size: 9, font: fonts.mono, color: BRASS, align: alignEnd, rtl: false });
    p.drawLine({ start: { x: L, y: A4.h - 66 }, end: { x: R, y: A4.h - 66 }, thickness: 0.6, color: BRASS });
  };
  drawHeader(page);

  // ── Title block
  let y = A4.h - 110;
  text(page, t({ he: "הצעת מחיר", en: "Quotation" }), { x: start, y, size: 30, font: fonts.display, align: alignStart, rtl });
  text(page, quote.id.toUpperCase(), { x: end, y: y + 6, size: 10, font: fonts.mono, color: MUTED, align: alignEnd, rtl: false });
  y -= 22;
  text(page, `${t({ he: "תאריך", en: "Date" })}: ${fmtDate(quote.sentAt, lang)}   ·   ${t({ he: "בתוקף עד", en: "Valid until" })}: ${fmtDate(quote.validUntil, lang)}`, { x: start, y, size: 9.5, font: fonts.ui, color: MUTED, align: alignStart, rtl });

  // ── Parties
  y -= 34;
  const colW = (R - L - 20) / 2;
  const boxH = 74;
  const partyBox = (x: number, title: string, lines: string[]) => {
    page.drawRectangle({ x, y: y - boxH, width: colW, height: boxH, color: CHARCOAL, borderColor: rgb(0.2, 0.2, 0.2), borderWidth: 0.5 });
    const tx0 = rtl ? x + colW - 12 : x + 12;
    text(page, title, { x: tx0, y: y - 16, size: 7.5, font: fonts.mono, color: BRASS, align: alignStart, rtl: false });
    lines.forEach((ln, i) => text(page, ln, { x: tx0, y: y - 34 - i * 14, size: 10, font: i === 0 ? fonts.uiBold : fonts.ui, color: i === 0 ? PAPER : MUTED, align: alignStart, rtl, maxWidth: colW - 24 }));
  };
  const firstX = rtl ? R - colW : L;
  const secondX = rtl ? L : R - colW;
  partyBox(firstX, t({ he: "לכבוד", en: "TO" }), [studio.name && rtl ? studio.name : studio.nameEn, `${studio.contact.name} · ${studio.contact.phone}`, `${t({ he: "דרגת מועדון", en: "Club tier" })} ${studio.tier} · ${quote.discountPct}%`]);
  partyBox(secondX, t({ he: "פרויקט", en: "PROJECT" }), [rtl ? project.name : project.nameEn, project.client || "—", project.address || "—"]);
  y -= boxH + 28;

  // ── Table
  const cols = rtl
    ? [{ key: "n", w: 22 }, { key: "item", w: 190 }, { key: "room", w: 72 }, { key: "qty", w: 36 }, { key: "list", w: 62 }, { key: "disc", w: 40 }, { key: "net", w: 64 }, { key: "lead", w: 25 }]
    : [{ key: "n", w: 22 }, { key: "item", w: 190 }, { key: "room", w: 72 }, { key: "qty", w: 36 }, { key: "list", w: 62 }, { key: "disc", w: 40 }, { key: "net", w: 64 }, { key: "lead", w: 25 }];
  const total = cols.reduce((s, c) => s + c.w, 0);
  const scale = (R - L) / total;
  cols.forEach((c) => (c.w *= scale));
  const headers: Record<string, string> = {
    n: "#", item: t({ he: "גוף תאורה", en: "Fixture" }), room: t({ he: "חדר", en: "Room" }), qty: t({ he: "כמות", en: "Qty" }),
    list: t({ he: "מחירון", en: "List" }), disc: t({ he: "הנחה", en: "Disc." }), net: t({ he: "נטו", en: "Net" }), lead: "",
  };
  const colX = (i: number) => {
    // inline-start edge of column i
    let acc = 0;
    for (let k = 0; k < i; k++) acc += cols[k].w;
    return rtl ? R - acc : L + acc;
  };
  const cellStart = (i: number, pad = 6) => (rtl ? colX(i) - pad : colX(i) + pad);

  const drawTableHead = () => {
    page.drawRectangle({ x: L, y: y - 18, width: R - L, height: 22, color: CHARCOAL });
    cols.forEach((c, i) => text(page, headers[c.key], { x: cellStart(i), y: y - 11, size: 8, font: fonts.mono, color: BRASS, align: alignStart, rtl: false }));
    y -= 30;
  };
  drawTableHead();

  const rowH = 30;
  const leadShort = (lt: string) => ({ stock: "●", "weeks-2-4": "2–4", "weeks-6-8": "6–8", "weeks-10-12": "10–12" } as Record<string, string>)[lt] ?? "";

  quote.lines.forEach((ln, idx) => {
    if (y < 130) {
      page = doc.addPage([A4.w, A4.h]);
      paintBg(page);
      drawHeader(page);
      y = A4.h - 100;
      drawTableHead();
    }
    const f = getFixture(ln.fixtureId);
    const room = project.rooms.find((r) => r.id === ln.roomId);
    const net = Math.round(ln.listPrice * ln.qty * (1 - ln.discountPct / 100));
    if (idx % 2 === 1) page.drawRectangle({ x: L, y: y - 20, width: R - L, height: rowH - 2, color: rgb(0.05, 0.05, 0.05) });
    text(page, String(idx + 1), { x: cellStart(0), y: y - 8, size: 8.5, font: fonts.mono, color: MUTED, align: alignStart, rtl: false });
    text(page, f ? (rtl ? f.nameHe : f.name) : ln.fixtureId, { x: cellStart(1), y: y - 6, size: 10, font: fonts.uiBold, align: alignStart, rtl, maxWidth: cols[1].w - 12 });
    text(page, f ? `${f.brand.replace(/-/g, " ")} · ${f.name} · ${f.lumens} lm · ${f.kelvin.join("/")}K` : "", { x: cellStart(1), y: y - 17, size: 7.5, font: fonts.mono, color: MUTED, align: alignStart, rtl: false, maxWidth: cols[1].w - 12 });
    text(page, room ? (rtl ? room.name : room.nameEn) : "—", { x: cellStart(2), y: y - 10, size: 9, font: fonts.ui, color: MUTED, align: alignStart, rtl, maxWidth: cols[2].w - 10 });
    text(page, String(ln.qty), { x: cellStart(3), y: y - 10, size: 9.5, font: fonts.mono, align: alignStart, rtl: false });
    text(page, fmtIls(ln.listPrice, lang), { x: cellStart(4), y: y - 10, size: 9, font: fonts.mono, color: MUTED, align: alignStart, rtl: false });
    text(page, `${ln.discountPct}%`, { x: cellStart(5), y: y - 10, size: 9, font: fonts.mono, color: MUTED, align: alignStart, rtl: false });
    text(page, fmtIls(net, lang), { x: cellStart(6), y: y - 10, size: 9.5, font: fonts.mono, align: alignStart, rtl: false });
    text(page, leadShort(ln.leadTime), { x: cellStart(7, 4), y: y - 10, size: 8, font: fonts.mono, color: ln.leadTime === "stock" ? WARM : MUTED, align: alignStart, rtl: false });
    page.drawLine({ start: { x: L, y: y - 22 }, end: { x: R, y: y - 22 }, thickness: 0.3, color: rgb(0.18, 0.18, 0.18) });
    y -= rowH;
  });

  // ── Totals
  y -= 10;
  const totalsX = end;
  const label = (s: string, v: string, strong = false) => {
    text(page, s, { x: rtl ? L + 150 : R - 150, y, size: strong ? 11 : 9.5, font: strong ? fonts.uiBold : fonts.ui, color: strong ? PAPER : MUTED, align: alignEnd === "left" ? "right" : "left", rtl });
    text(page, v, { x: totalsX, y, size: strong ? 13 : 10, font: fonts.mono, color: strong ? WARM : PAPER, align: alignEnd, rtl: false });
    y -= strong ? 22 : 16;
  };
  const discountAmt = quote.subtotal - quote.total;
  label(t({ he: "סה״כ מחירון", en: "List subtotal" }), fmtIls(quote.subtotal, lang));
  label(t({ he: `הנחת מועדון (${quote.discountPct}%)`, en: `Club discount (${quote.discountPct}%)` }), `−${fmtIls(discountAmt, lang)}`);
  page.drawLine({ start: { x: rtl ? L : R - 220, y: y + 6 }, end: { x: rtl ? L + 220 : R, y: y + 6 }, thickness: 0.6, color: BRASS });
  y -= 8;
  label(t({ he: "לתשלום (כולל מע״מ)", en: "Total (incl. VAT)" }), fmtIls(quote.total, lang), true);

  // ── Lead-time legend + note
  y -= 6;
  text(page, `● ${t(LEAD_TIME_LABEL.stock)}   ·   ${t({ he: "מספרים = שבועות להזמנה מהיצרן", en: "numbers = weeks to order from the maker" })}`, { x: start, y, size: 8, font: fonts.ui, color: MUTED, align: alignStart, rtl });
  if (quote.note) {
    y -= 16;
    text(page, quote.note, { x: start, y, size: 9, font: fonts.ui, color: PAPER, align: alignStart, rtl, maxWidth: R - L });
  }

  // ── Footer on every page
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: L, y: 58 }, end: { x: R, y: 58 }, thickness: 0.5, color: rgb(0.2, 0.2, 0.2) });
    text(p, t(ADDRESS), { x: start, y: 44, size: 8, font: fonts.ui, color: MUTED, align: alignStart, rtl });
    text(p, t({ he: "קונספט של Kikkey — הדמיה. מחירי הדגמה בלבד, אינה הצעה מחייבת.", en: "Kikkey concept — demo. Demo prices only; not a binding offer." }), { x: start, y: 32, size: 7.5, font: fonts.ui, color: BRASS, align: alignStart, rtl });
    text(p, `${i + 1} / ${pages.length}`, { x: end, y: 44, size: 8, font: fonts.mono, color: MUTED, align: alignEnd, rtl: false });
  });

  return doc.save();
}

export function downloadBytes(bytes: Uint8Array, filename: string, type = "application/pdf") {
  const blob = new Blob([bytes as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function bytesToObjectUrl(bytes: Uint8Array, type = "application/pdf"): string {
  return URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
}
