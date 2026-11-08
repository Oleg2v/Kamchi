import { FIXTURES, SEED_PROJECTS, STUDIOS } from "../data";
import type { DemoEvent, LeadTime, Project, Quote, QuoteRequest } from "../types";

export interface SeedState {
  stock: Record<string, number>;
  leadTimes: Record<string, LeadTime>;
  studioDiscounts: Record<string, number>;
  projects: Project[];
  quoteRequests: QuoteRequest[];
  quotes: Quote[];
  events: DemoEvent[];
  currentStudioId: string;
}

/** Deterministic seed built from the JSON data. Called on first load and on "איפוס דמו". */
export function buildSeed(): SeedState {
  const stock: Record<string, number> = {};
  const leadTimes: Record<string, LeadTime> = {};
  for (const f of FIXTURES) {
    stock[f.id] = f.stock;
    leadTimes[f.id] = f.leadTime;
  }
  const studioDiscounts: Record<string, number> = {};
  for (const s of STUDIOS) studioDiscounts[s.id] = s.discountPct;

  const projects: Project[] = JSON.parse(JSON.stringify(SEED_PROJECTS));

  // Seed the request/quote pipeline so the desk is never empty.
  const quoteRequests: QuoteRequest[] = [];
  const quotes: Quote[] = [];
  const events: DemoEvent[] = [];
  const now = Date.now();
  const iso = (minsAgo: number) => new Date(now - minsAgo * 60_000).toISOString();

  for (const p of projects) {
    if (p.status === "quote_requested") {
      quoteRequests.push({
        id: `qr-${p.id}`,
        projectId: p.id,
        studioId: p.studioId,
        createdAt: iso(95),
        status: "new",
        message: "נשמח להצעה לכל הפרויקט, כולל זמני אספקה לנברשת.",
      });
      events.push({
        id: `ev-seed-${p.id}-qr`,
        ts: iso(95),
        actor: "designer",
        type: "quote.requested",
        title: { he: `בקשת הצעת מחיר — ${p.name}`, en: `Quote request — ${p.nameEn}` },
        projectId: p.id,
        studioId: p.studioId,
        seenByDesigner: true,
        seenByDesk: false,
      });
    }
    if (p.status === "quoted" || p.status === "ordered") {
      const reqId = `qr-${p.id}`;
      const disc = studioDiscounts[p.studioId] ?? 20;
      const lines = p.rooms.flatMap((r) =>
        r.items.map((it) => {
          const f = FIXTURES.find((x) => x.id === it.fixtureId);
          return {
            fixtureId: it.fixtureId,
            roomId: r.id,
            qty: it.qty,
            listPrice: f?.price ?? 0,
            discountPct: disc,
            leadTime: (f?.leadTime ?? "weeks-6-8") as LeadTime,
          };
        }),
      );
      const subtotal = lines.reduce((s, l) => s + l.listPrice * l.qty, 0);
      const total = Math.round(subtotal * (1 - disc / 100));
      quoteRequests.push({ id: reqId, projectId: p.id, studioId: p.studioId, createdAt: iso(60 * 24 * 6), status: p.status === "ordered" ? "accepted" : "sent" });
      quotes.push({
        id: `q-${p.id}`,
        requestId: reqId,
        projectId: p.id,
        studioId: p.studioId,
        lines,
        discountPct: disc,
        subtotal,
        total,
        sentAt: iso(60 * 24 * 5),
        validUntil: new Date(now + 30 * 86_400_000).toISOString(),
        acceptedAt: p.status === "ordered" ? iso(60 * 24 * 3) : undefined,
        note: "המחירים כוללים מע״מ. הובלה והתקנה בנפרד.",
      });
      events.push({
        id: `ev-seed-${p.id}-sent`,
        ts: iso(60 * 24 * 5),
        actor: "kamchi",
        type: "quote.sent",
        title: { he: `הצעת מחיר נשלחה — ${p.name}`, en: `Quote sent — ${p.nameEn}` },
        projectId: p.id,
        studioId: p.studioId,
        seenByDesigner: true,
        seenByDesk: true,
      });
    }
  }

  return {
    stock,
    leadTimes,
    studioDiscounts,
    projects,
    quoteRequests,
    quotes,
    events,
    currentStudioId: STUDIOS[0]?.id ?? "",
  };
}
