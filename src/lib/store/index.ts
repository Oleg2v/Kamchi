"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  CartItem,
  DemoEvent,
  FinishId,
  Kelvin,
  Lang,
  LeadTime,
  LightingPlan,
  OrderStatus,
  Project,
  Quote,
  QuoteLine,
  QuoteRequest,
  Room,
  RoomItem,
} from "../types";
import { buildSeed, type SeedState } from "./seed";
import { getChannel, post, TAB_ID, type SyncMessage } from "./sync";
import { FIXTURES, getFixture, getStudio } from "../data";

/* ───────────────────────── helpers ───────────────────────── */

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const nowIso = () => new Date().toISOString();

export interface AppointmentRequest {
  id: string;
  fixtureId?: string;
  name: string;
  phone: string;
  when: string;
  createdAt: string;
}

export interface RelightRecord {
  id: string;
  createdAt: string;
  fixtureId: string;
  source: "model" | "simulation";
  sentToDesigner?: boolean;
}

type EventInput = Omit<DemoEvent, "id" | "ts" | "seenByDesigner" | "seenByDesk"> & {
  seenByDesigner?: boolean;
  seenByDesk?: boolean;
};

/* ───────────────────────── state ───────────────────────── */

export interface AppState extends SeedState {
  _hydrated: boolean;
  _lastRemoteAt: number;

  // UI preferences (shared across tabs on purpose — the whole demo is one "house")
  kelvin: Kelvin;
  lang: Lang;
  allLit: boolean;
  dimmerCursor: boolean;

  cart: CartItem[];
  plans: LightingPlan[];
  relights: RelightRecord[];
  appointments: AppointmentRequest[];

  // ── UI actions
  setKelvin: (k: Kelvin) => void;
  setLang: (l: Lang) => void;
  setAllLit: (v: boolean) => void;
  setDimmerCursor: (v: boolean) => void;
  setCurrentStudio: (id: string) => void;

  // ── cart
  addToCart: (fixtureId: string, qty?: number, finish?: FinishId) => void;
  setCartQty: (fixtureId: string, qty: number) => void;
  removeFromCart: (fixtureId: string) => void;
  clearCart: () => void;

  // ── projects (designer side)
  createProject: (input: { name: string; nameEn?: string; client?: string; address?: string; studioId?: string }) => Project;
  addRoom: (projectId: string, room: Omit<Room, "id" | "items"> & { items?: RoomItem[] }) => Room | undefined;
  addItemToRoom: (projectId: string, roomId: string, fixtureId: string, qty?: number, note?: string, actor?: DemoEvent["actor"]) => void;
  setItemQty: (projectId: string, roomId: string, itemId: string, qty: number) => void;
  removeItem: (projectId: string, roomId: string, itemId: string) => void;
  attachPlan: (projectId: string, plan: LightingPlan) => void;
  savePlan: (plan: LightingPlan) => void;
  saveRelight: (r: Omit<RelightRecord, "id" | "createdAt">) => RelightRecord;
  requestAppointment: (a: Omit<AppointmentRequest, "id" | "createdAt">) => void;

  // ── quotes (both sides)
  requestQuote: (projectId: string, message?: string, actor?: DemoEvent["actor"]) => QuoteRequest | undefined;
  startQuote: (requestId: string) => void;
  sendQuote: (input: { requestId: string; lines: QuoteLine[]; discountPct: number; note?: string; actor?: DemoEvent["actor"] }) => Quote | undefined;
  acceptQuote: (quoteId: string, actor?: DemoEvent["actor"]) => void;

  // ── desk operations
  setOrderStatus: (projectId: string, itemId: string, status: OrderStatus, actor?: DemoEvent["actor"]) => void;
  setLeadTime: (fixtureId: string, leadTime: LeadTime, actor?: DemoEvent["actor"]) => void;
  setStock: (fixtureId: string, qty: number) => void;
  setStudioDiscount: (studioId: string, pct: number, actor?: DemoEvent["actor"]) => void;

  // ── events
  logEvent: (e: EventInput) => DemoEvent;
  markSeen: (side: "designer" | "kamchi") => void;

  // ── demo
  resetDemo: () => void;
  _applyRemote: (partial: Partial<AppState>) => void;
}

/** Keys that persist and sync. Everything else is derived or local. */
const PERSIST_KEYS: (keyof AppState)[] = [
  "kelvin", "lang", "allLit", "dimmerCursor",
  "stock", "leadTimes", "studioDiscounts", "projects", "quoteRequests", "quotes", "events",
  "currentStudioId", "cart", "plans", "relights", "appointments",
];

const STORAGE_KEY = "kamchi-demo-v1";
const VERSION = 3;

function pickPersisted(s: AppState) {
  const out: Record<string, unknown> = {};
  for (const k of PERSIST_KEYS) out[k] = s[k];
  return out as Partial<AppState>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      const touch = (p: Project): Project => ({ ...p, updatedAt: nowIso() });
      const updateProject = (projectId: string, fn: (p: Project) => Project) =>
        set((s) => ({ projects: s.projects.map((p) => (p.id === projectId ? touch(fn(p)) : p)) }));

      const logEvent = (e: EventInput): DemoEvent => {
        const ev: DemoEvent = {
          id: uid("ev"),
          ts: nowIso(),
          seenByDesigner: e.actor === "designer",
          seenByDesk: e.actor === "kamchi",
          ...e,
        };
        set((s) => ({ events: [ev, ...s.events].slice(0, 400) }));
        return ev;
      };

      return {
        ...buildSeed(),
        _hydrated: false,
        _lastRemoteAt: 0,
        kelvin: 2700,
        lang: "he",
        allLit: false,
        dimmerCursor: true,
        cart: [],
        plans: [],
        relights: [],
        appointments: [],

        setKelvin: (kelvin) => set({ kelvin }),
        setLang: (lang) => set({ lang }),
        setAllLit: (allLit) => set({ allLit }),
        setDimmerCursor: (dimmerCursor) => set({ dimmerCursor }),
        setCurrentStudio: (currentStudioId) => set({ currentStudioId }),

        addToCart: (fixtureId, qty = 1, finish) => {
          set((s) => {
            const existing = s.cart.find((c) => c.fixtureId === fixtureId);
            const cart = existing
              ? s.cart.map((c) => (c.fixtureId === fixtureId ? { ...c, qty: c.qty + qty, finish: finish ?? c.finish } : c))
              : [...s.cart, { fixtureId, qty, finish }];
            return { cart };
          });
          const f = getFixture(fixtureId);
          logEvent({ actor: "designer", type: "cart.added", fixtureId, title: { he: `נוסף לסל: ${f?.nameHe ?? fixtureId}`, en: `Added to cart: ${f?.name ?? fixtureId}` } });
        },
        setCartQty: (fixtureId, qty) =>
          set((s) => ({ cart: qty <= 0 ? s.cart.filter((c) => c.fixtureId !== fixtureId) : s.cart.map((c) => (c.fixtureId === fixtureId ? { ...c, qty } : c)) })),
        removeFromCart: (fixtureId) => set((s) => ({ cart: s.cart.filter((c) => c.fixtureId !== fixtureId) })),
        clearCart: () => set({ cart: [] }),

        createProject: (input) => {
          const studioId = input.studioId ?? get().currentStudioId;
          const p: Project = {
            id: uid("prj"),
            studioId,
            name: input.name,
            nameEn: input.nameEn ?? input.name,
            client: input.client ?? "",
            address: input.address ?? "",
            status: "planning",
            rooms: [],
            createdAt: nowIso(),
            updatedAt: nowIso(),
          };
          set((s) => ({ projects: [p, ...s.projects] }));
          logEvent({ actor: "designer", type: "project.created", projectId: p.id, studioId, title: { he: `פרויקט חדש: ${p.name}`, en: `New project: ${p.nameEn}` } });
          return p;
        },
        addRoom: (projectId, room) => {
          const r: Room = { id: uid("room"), items: room.items ?? [], name: room.name, nameEn: room.nameEn, areaM2: room.areaM2, targetLux: room.targetLux };
          let added: Room | undefined;
          updateProject(projectId, (p) => { added = r; return { ...p, rooms: [...p.rooms, r] }; });
          if (added) {
            const p = get().projects.find((x) => x.id === projectId);
            logEvent({ actor: "designer", type: "project.room_added", projectId, studioId: p?.studioId, title: { he: `חדר נוסף: ${r.name}`, en: `Room added: ${r.nameEn}` } });
          }
          return added;
        },
        addItemToRoom: (projectId, roomId, fixtureId, qty = 1, note, actor = "designer") => {
          const item: RoomItem = { id: uid("it"), fixtureId, qty, note };
          updateProject(projectId, (p) => ({
            ...p,
            rooms: p.rooms.map((r) => {
              if (r.id !== roomId) return r;
              const ex = r.items.find((i) => i.fixtureId === fixtureId);
              return ex
                ? { ...r, items: r.items.map((i) => (i.fixtureId === fixtureId ? { ...i, qty: i.qty + qty } : i)) }
                : { ...r, items: [...r.items, item] };
            }),
          }));
          const f = getFixture(fixtureId);
          const p = get().projects.find((x) => x.id === projectId);
          const room = p?.rooms.find((r) => r.id === roomId);
          logEvent({
            actor,
            type: "project.item_added",
            projectId,
            studioId: p?.studioId,
            fixtureId,
            payload: { roomId, qty },
            title: {
              he: `${f?.nameHe ?? fixtureId} ×${qty} נוסף ל${room?.name ?? "חדר"} — ${p?.name ?? ""}`,
              en: `${f?.name ?? fixtureId} ×${qty} added to ${room?.nameEn ?? "room"} — ${p?.nameEn ?? ""}`,
            },
          });
        },
        setItemQty: (projectId, roomId, itemId, qty) =>
          updateProject(projectId, (p) => ({
            ...p,
            rooms: p.rooms.map((r) => (r.id !== roomId ? r : { ...r, items: qty <= 0 ? r.items.filter((i) => i.id !== itemId) : r.items.map((i) => (i.id === itemId ? { ...i, qty } : i)) })),
          })),
        removeItem: (projectId, roomId, itemId) => {
          const p0 = get().projects.find((x) => x.id === projectId);
          const it = p0?.rooms.find((r) => r.id === roomId)?.items.find((i) => i.id === itemId);
          updateProject(projectId, (p) => ({ ...p, rooms: p.rooms.map((r) => (r.id !== roomId ? r : { ...r, items: r.items.filter((i) => i.id !== itemId) })) }));
          if (it) {
            const f = getFixture(it.fixtureId);
            logEvent({ actor: "designer", type: "project.item_removed", projectId, studioId: p0?.studioId, fixtureId: it.fixtureId, title: { he: `הוסר: ${f?.nameHe ?? it.fixtureId}`, en: `Removed: ${f?.name ?? it.fixtureId}` } });
          }
        },
        attachPlan: (projectId, plan) => {
          set((s) => ({ plans: s.plans.some((p) => p.id === plan.id) ? s.plans : [plan, ...s.plans] }));
          updateProject(projectId, (p) => ({ ...p, aiPlanId: plan.id }));
          const p = get().projects.find((x) => x.id === projectId);
          logEvent({ actor: "designer", type: "ai.plan", projectId, studioId: p?.studioId, title: { he: `תוכנית תאורה צורפה — ${p?.name ?? ""}`, en: `Lighting plan attached — ${p?.nameEn ?? ""}` } });
        },
        savePlan: (plan) => set((s) => ({ plans: [plan, ...s.plans.filter((p) => p.id !== plan.id)].slice(0, 20) })),
        saveRelight: (r) => {
          const rec: RelightRecord = { id: uid("rl"), createdAt: nowIso(), ...r };
          set((s) => ({ relights: [rec, ...s.relights].slice(0, 30) }));
          const f = getFixture(r.fixtureId);
          logEvent({ actor: "designer", type: "ai.relight", fixtureId: r.fixtureId, title: { he: `הדמיית תאורה: ${f?.nameHe ?? r.fixtureId}`, en: `Relight: ${f?.name ?? r.fixtureId}` } });
          return rec;
        },
        requestAppointment: (a) => {
          const rec: AppointmentRequest = { id: uid("ap"), createdAt: nowIso(), ...a };
          set((s) => ({ appointments: [rec, ...s.appointments] }));
          const f = a.fixtureId ? getFixture(a.fixtureId) : undefined;
          logEvent({ actor: "designer", type: "appointment.requested", fixtureId: a.fixtureId, title: { he: `בקשה לביקור באולם${f ? ` — ${f.nameHe}` : ""}`, en: `Showroom visit requested${f ? ` — ${f.name}` : ""}` } });
        },

        requestQuote: (projectId, message, actor = "designer") => {
          const p = get().projects.find((x) => x.id === projectId);
          if (!p) return undefined;
          const qr: QuoteRequest = { id: uid("qr"), projectId, studioId: p.studioId, createdAt: nowIso(), status: "new", message };
          set((s) => ({ quoteRequests: [qr, ...s.quoteRequests] }));
          updateProject(projectId, (x) => ({ ...x, status: "quote_requested" }));
          const studio = getStudio(p.studioId);
          logEvent({ actor, type: "quote.requested", projectId, studioId: p.studioId, payload: { requestId: qr.id }, title: { he: `בקשת הצעת מחיר — ${p.name} (${studio?.name ?? ""})`, en: `Quote request — ${p.nameEn} (${studio?.nameEn ?? ""})` } });
          return qr;
        },
        startQuote: (requestId) => set((s) => ({ quoteRequests: s.quoteRequests.map((q) => (q.id === requestId ? { ...q, status: "in_progress" } : q)) })),
        sendQuote: ({ requestId, lines, discountPct, note, actor = "kamchi" }) => {
          const qr = get().quoteRequests.find((q) => q.id === requestId);
          if (!qr) return undefined;
          const subtotal = lines.reduce((s, l) => s + l.listPrice * l.qty, 0);
          const total = Math.round(lines.reduce((s, l) => s + l.listPrice * l.qty * (1 - l.discountPct / 100), 0));
          const q: Quote = {
            id: uid("q"), requestId, projectId: qr.projectId, studioId: qr.studioId, lines, discountPct, subtotal, total, note,
            sentAt: nowIso(), validUntil: new Date(Date.now() + 30 * 86_400_000).toISOString(),
          };
          set((s) => ({
            quotes: [q, ...s.quotes.filter((x) => x.requestId !== requestId)],
            quoteRequests: s.quoteRequests.map((r) => (r.id === requestId ? { ...r, status: "sent" } : r)),
          }));
          updateProject(qr.projectId, (p) => ({
            ...p,
            status: "quoted",
            rooms: p.rooms.map((r) => ({ ...r, items: r.items.map((i) => ({ ...i, orderStatus: i.orderStatus ?? "quoted" })) })),
          }));
          const p = get().projects.find((x) => x.id === qr.projectId);
          logEvent({ actor, type: "quote.sent", projectId: qr.projectId, studioId: qr.studioId, payload: { quoteId: q.id, total }, title: { he: `הצעת מחיר נשלחה — ${p?.name ?? ""} · ₪${total.toLocaleString("he-IL")}`, en: `Quote sent — ${p?.nameEn ?? ""} · ₪${total.toLocaleString("en-IL")}` } });
          return q;
        },
        acceptQuote: (quoteId, actor = "designer") => {
          const q = get().quotes.find((x) => x.id === quoteId);
          if (!q) return;
          set((s) => ({
            quotes: s.quotes.map((x) => (x.id === quoteId ? { ...x, acceptedAt: nowIso() } : x)),
            quoteRequests: s.quoteRequests.map((r) => (r.id === q.requestId ? { ...r, status: "accepted" } : r)),
          }));
          updateProject(q.projectId, (p) => ({
            ...p,
            status: "ordered",
            rooms: p.rooms.map((r) => ({ ...r, items: r.items.map((i) => ({ ...i, orderStatus: "ordered_italy" })) })),
          }));
          const p = get().projects.find((x) => x.id === q.projectId);
          logEvent({ actor, type: "quote.accepted", projectId: q.projectId, studioId: q.studioId, payload: { quoteId }, title: { he: `ההצעה אושרה — ${p?.name ?? ""}`, en: `Quote accepted — ${p?.nameEn ?? ""}` } });
        },

        setOrderStatus: (projectId, itemId, status, actor = "kamchi") => {
          let fixtureId: string | undefined;
          updateProject(projectId, (p) => ({
            ...p,
            status: status === "delivered" && p.rooms.every((r) => r.items.every((i) => i.id === itemId || i.orderStatus === "delivered")) ? "delivered" : p.status,
            rooms: p.rooms.map((r) => ({ ...r, items: r.items.map((i) => { if (i.id === itemId) { fixtureId = i.fixtureId; return { ...i, orderStatus: status }; } return i; }) })),
          }));
          const p = get().projects.find((x) => x.id === projectId);
          const f = fixtureId ? getFixture(fixtureId) : undefined;
          const label = { quoted: { he: "הוצעה הצעה", en: "Quoted" }, ordered_italy: { he: "הוזמן באיטליה", en: "Ordered in Italy" }, in_transit: { he: "בדרך", en: "In transit" }, in_warehouse: { he: "במחסן", en: "In warehouse" }, delivered: { he: "סופק", en: "Delivered" } }[status];
          logEvent({ actor, type: "order.status", projectId, studioId: p?.studioId, fixtureId, payload: { itemId, status }, title: { he: `${f?.nameHe ?? ""}: ${label.he}`, en: `${f?.name ?? ""}: ${label.en}` } });
        },
        setLeadTime: (fixtureId, leadTime, actor = "kamchi") => {
          set((s) => ({ leadTimes: { ...s.leadTimes, [fixtureId]: leadTime } }));
          const f = getFixture(fixtureId);
          const lt = { stock: { he: "במלאי בבני ברק", en: "In stock in Bnei Brak" }, "weeks-2-4": { he: "2–4 שבועות", en: "2–4 weeks" }, "weeks-6-8": { he: "6–8 שבועות", en: "6–8 weeks" }, "weeks-10-12": { he: "10–12 שבועות", en: "10–12 weeks" } }[leadTime];
          logEvent({ actor, type: "lead_time.updated", fixtureId, payload: { leadTime }, title: { he: `זמן אספקה עודכן — ${f?.nameHe ?? fixtureId}: ${lt.he}`, en: `Lead time updated — ${f?.name ?? fixtureId}: ${lt.en}` } });
        },
        setStock: (fixtureId, qty) => set((s) => ({ stock: { ...s.stock, [fixtureId]: Math.max(0, qty) } })),
        setStudioDiscount: (studioId, pct, actor = "kamchi") => {
          set((s) => ({ studioDiscounts: { ...s.studioDiscounts, [studioId]: pct } }));
          const st = getStudio(studioId);
          logEvent({ actor, type: "discount.updated", studioId, payload: { pct }, title: { he: `הנחת סטודיו עודכנה — ${st?.name ?? studioId}: ${pct}%`, en: `Studio discount updated — ${st?.nameEn ?? studioId}: ${pct}%` } });
        },

        logEvent,
        markSeen: (side) =>
          set((s) => ({ events: s.events.map((e) => (side === "designer" ? { ...e, seenByDesigner: true } : { ...e, seenByDesk: true })) })),

        resetDemo: () => {
          const seed = buildSeed();
          set({ ...seed, cart: [], plans: [], relights: [], appointments: [] });
          logEvent({ actor: "system", type: "demo.reset", title: { he: "הדמו אופס לנתוני ההתחלה", en: "Demo reset to seed data" }, seenByDesigner: true, seenByDesk: true });
        },
        _applyRemote: (partial) => set({ ...partial, _lastRemoteAt: Date.now() }),
      };
    },
    {
      name: STORAGE_KEY,
      version: VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => pickPersisted(s) as AppState,
      skipHydration: true,
      migrate: (persisted, version) => {
        // Any schema change resets to seed — it is a demo.
        if (version !== VERSION) return { ...buildSeed() } as unknown as AppState;
        return persisted as AppState;
      },
      onRehydrateStorage: () => (state) => {
        state?._applyRemote({ _hydrated: true } as Partial<AppState>);
      },
    },
  ),
);

/* ───────────────────────── cross-tab sync ───────────────────────── */

let wired = false;
let applyingRemote = false;

export function wireSync() {
  if (wired || typeof window === "undefined") return;
  wired = true;
  const ch = getChannel();
  if (!ch) return;

  ch.onmessage = (ev: MessageEvent<SyncMessage>) => {
    const msg = ev.data;
    if (!msg || msg.from === TAB_ID) return;
    if (msg.kind === "state") {
      applyingRemote = true;
      try {
        useStore.getState()._applyRemote(msg.state as Partial<AppState>);
      } finally {
        applyingRemote = false;
      }
    } else if (msg.kind === "hello") {
      post({ kind: "state", from: TAB_ID, state: pickPersisted(useStore.getState()) });
    }
  };

  let last = JSON.stringify(pickPersisted(useStore.getState()));
  useStore.subscribe((s) => {
    if (applyingRemote) { last = JSON.stringify(pickPersisted(s)); return; }
    const next = JSON.stringify(pickPersisted(s));
    if (next !== last) {
      last = next;
      post({ kind: "state", from: TAB_ID, state: pickPersisted(s) });
    }
  });
  post({ kind: "hello", from: TAB_ID });
}

/* ───────────────────────── selectors ───────────────────────── */

export const selectHydrated = (s: AppState) => s._hydrated;
export const selectCartCount = (s: AppState) => s.cart.reduce((n, c) => n + c.qty, 0);
export const selectUnseenForDesk = (s: AppState) => s.events.filter((e) => !e.seenByDesk && e.actor !== "kamchi").length;
export const selectUnseenForDesigner = (s: AppState) => s.events.filter((e) => !e.seenByDesigner && e.actor === "kamchi").length;
export const selectStudioProjects = (studioId: string) => (s: AppState) => s.projects.filter((p) => p.studioId === studioId);
export const selectOpenRequests = (s: AppState) => s.quoteRequests.filter((q) => q.status === "new" || q.status === "in_progress");

/** Per-tab mode (designer / kamchi) — intentionally NOT synced across tabs. */
export type Mode = "designer" | "kamchi";
interface ModeState { mode: Mode; setMode: (m: Mode) => void; }
export const useModeStore = create<ModeState>()(
  persist((set) => ({ mode: "designer", setMode: (mode) => set({ mode }) }), {
    name: "kamchi-mode",
    storage: createJSONStorage(() => sessionStorage),
    skipHydration: true,
  }),
);

/** Fixture list with live stock/lead-time overlays from the store. */
export function useLiveFixture(fixtureId: string) {
  const stock = useStore((s) => s.stock[fixtureId]);
  const leadTime = useStore((s) => s.leadTimes[fixtureId]);
  const f = getFixture(fixtureId);
  return f ? { ...f, stock: stock ?? f.stock, leadTime: leadTime ?? f.leadTime } : undefined;
}

export { FIXTURES };
