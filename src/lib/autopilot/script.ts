"use client";
import { getFixture } from "@/lib/data";
import type { Bi } from "@/lib/i18n";
import { tx } from "@/lib/i18n";
import type { useStore } from "@/lib/store";
import type { QuoteLine } from "@/lib/types";
import { AUTOPILOT_FIXTURE_ID, AUTOPILOT_PROJECT_ID, AUTOPILOT_REQUEST_MESSAGE, AUTOPILOT_ROOM_ID } from "./constants";
import type { AutopilotStep } from "./types";

export const DEFAULT_QUOTE_NOTE: Bi = { he: "המחירים כוללים מע״מ. הובלה והתקנה בנפרד.", en: "Prices include VAT. Delivery and installation are quoted separately." };

type Store = typeof useStore;

/* ── idempotent end states (used when a step is skipped or a target was missing) ── */
const findProject = (store: Store) => store.getState().projects.find((p) => p.id === AUTOPILOT_PROJECT_ID);
const findRequest = (store: Store) => store.getState().quoteRequests.find((q) => q.projectId === AUTOPILOT_PROJECT_ID);
const findQuote = (store: Store) => store.getState().quotes.find((q) => q.projectId === AUTOPILOT_PROJECT_ID);

function ensureItem(store: Store) {
  const p = findProject(store);
  const room = p?.rooms.find((r) => r.id === AUTOPILOT_ROOM_ID);
  if (!p || !room) return;
  if (!room.items.some((i) => i.fixtureId === AUTOPILOT_FIXTURE_ID)) store.getState().addItemToRoom(p.id, room.id, AUTOPILOT_FIXTURE_ID, 1);
}
function ensureRequest(store: Store) {
  ensureItem(store);
  if (!findRequest(store)) store.getState().requestQuote(AUTOPILOT_PROJECT_ID, AUTOPILOT_REQUEST_MESSAGE.he);
}
function ensureQuote(store: Store) {
  ensureRequest(store);
  if (findQuote(store)) return;
  const s = store.getState();
  const p = findProject(store);
  const req = findRequest(store);
  if (!p || !req) return;
  const disc = s.studioDiscounts[p.studioId] ?? 20;
  const lines: QuoteLine[] = p.rooms.flatMap((r) =>
    r.items.map((it) => ({
      fixtureId: it.fixtureId,
      roomId: r.id,
      qty: it.qty,
      listPrice: getFixture(it.fixtureId)?.price ?? 0,
      discountPct: disc,
      leadTime: it.fixtureId === AUTOPILOT_FIXTURE_ID ? "stock" : (s.leadTimes[it.fixtureId] ?? getFixture(it.fixtureId)?.leadTime ?? "weeks-6-8"),
    })),
  );
  s.sendQuote({ requestId: req.id, lines, discountPct: disc, note: tx(s.lang, DEFAULT_QUOTE_NOTE) });
}

export const FINAL_CAPTION = { he: "כך נראית עבודה משותפת. 30 שניות.", en: "This is what working together looks like. 30 seconds." };

/**
 * The ~30 s script. Timings are nominal (progress bar); the run itself waits for the real UI.
 *   1  0.0–6.5   the room lights up (RoomScene auto)
 *   2  6.5–10.5  "light my living room" — relight preview card switches on
 *   3 10.5–14.0  cursor adds the pendant to the board room
 *   4 14.0–19.5  cursor requests a quote (dialog, typed note, send) — the dot flies to the desk
 *   5 19.5–28.0  desk cursor opens the request, marks the pendant in stock, sends the quote (PDF)
 *   6 28.0–32.5  the designer sees the quote and the PDF button; final caption
 */
export function buildSteps(): AutopilotStep[] {
  return [
    {
      id: "room",
      caption: { he: "החדר נדלק", en: "The room lights up" },
      duration: 6500,
      async run(ctx) {
        ctx.setSide("designer");
        ctx.setStage("room");
        await ctx.sleep(6500);
      },
    },
    {
      id: "relight",
      caption: { he: "תאירו לי את הסלון", en: "Light my living room" },
      duration: 4000,
      async run(ctx) {
        ctx.setSide("designer");
        ctx.setStage("relight");
        await ctx.sleep(4000);
      },
      settle(ctx) {
        if (ctx.store.getState().projects.some((p) => p.id === AUTOPILOT_PROJECT_ID)) ctx.setStage("relight");
      },
    },
    {
      id: "add",
      caption: { he: "הגוף נוסף ללוח הפרויקט", en: "Added to the project board" },
      duration: 3500,
      async run(ctx) {
        ctx.setSide("designer");
        await ctx.click("relight-add");
        await ctx.sleep(700);
        ctx.setStage("board");
        await ctx.moveTo(`board-item:${AUTOPILOT_FIXTURE_ID}`, { ax: 0.3, ay: 0.5 });
        await ctx.sleep(1400);
      },
      settle(ctx) {
        ensureItem(ctx.store);
        ctx.setStage("board");
      },
    },
    {
      id: "request",
      caption: { he: "בקשת הצעת מחיר יצאה לשולחן הפרויקטים", en: "Quote request sent to the project desk" },
      duration: 5500,
      async run(ctx) {
        ctx.setSide("designer");
        ctx.setStage("board");
        await ctx.click("request-quote");
        if (await ctx.waitFor("request-quote-confirm", 2000)) {
          await ctx.type("request-quote-message", AUTOPILOT_REQUEST_MESSAGE.he);
          await ctx.sleep(250);
          await ctx.click("request-quote-confirm");
        }
        await ctx.sleep(1800);
      },
      settle(ctx) {
        ensureRequest(ctx.store);
      },
    },
    {
      id: "desk",
      caption: { he: "צוות קמחי קובע זמני אספקה ושולח הצעה", en: "The Kamchi team sets lead times and sends a quote" },
      duration: 8500,
      async run(ctx) {
        ctx.setSide("desk");
        await ctx.sleep(300);
        await ctx.click("desk-tab:inbox", { duration: 650 });
        const req = findRequest(ctx.store);
        if (!req) return;
        await ctx.click(`inbox-item:${req.id}`);
        if (await ctx.waitFor("lead-time:0", 2500)) {
          await ctx.sleep(400);
          await ctx.select("lead-time:0", "stock");
          await ctx.sleep(700);
          await ctx.click("send-quote");
          await ctx.waitFor("quote-sent", 6000);
        }
        await ctx.sleep(1300);
      },
      settle(ctx) {
        ensureQuote(ctx.store);
      },
    },
    {
      id: "quote",
      caption: { he: "ההצעה אצל המעצב, כולל PDF", en: "The quote is with the designer, PDF included" },
      duration: 4500,
      async run(ctx) {
        ctx.setSide("designer");
        ctx.setStage("board");
        await ctx.sleep(400);
        await ctx.moveTo("quote-pdf", { timeout: 4000 });
        await ctx.sleep(1900);
        ctx.setCaption(FINAL_CAPTION);
        await ctx.sleep(2200);
      },
      settle(ctx) {
        ctx.setCaption(FINAL_CAPTION);
      },
    },
  ];
}
