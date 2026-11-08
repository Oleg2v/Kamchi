/**
 * Shared domain types for the Kamchi "האור נדלק" demo.
 * Everything that crosses a module boundary is declared here.
 */

export type Kelvin = 2700 | 3000 | 4000;
export type Lang = "he" | "en";
export type Mode = "designer" | "kamchi";

export type BrandId =
  | "artemide"
  | "vibia"
  | "bomma"
  | "terzani"
  | "panzeri"
  | "fabbian"
  | "exenia"
  | "ole"
  | "neko"
  | "cangini-tucci"
  | "dechem"
  | "icone"
  | "avolux"
  | "vesoi"
  | "aldo-bernardi"
  | "swarovski";

export const BRAND_IDS: BrandId[] = [
  "artemide",
  "vibia",
  "bomma",
  "terzani",
  "panzeri",
  "fabbian",
  "exenia",
  "ole",
  "neko",
  "cangini-tucci",
  "dechem",
  "icone",
  "avolux",
  "vesoi",
  "aldo-bernardi",
  "swarovski",
];

export type Space =
  | "living"
  | "dining"
  | "kitchen"
  | "bedroom"
  | "bathroom"
  | "office"
  | "hallway"
  | "outdoor"
  | "commercial";

export const SPACES: Space[] = [
  "living",
  "dining",
  "kitchen",
  "bedroom",
  "bathroom",
  "office",
  "hallway",
  "outdoor",
  "commercial",
];

export type FixtureType =
  | "pendant"
  | "chandelier"
  | "wall"
  | "ceiling"
  | "recessed"
  | "track"
  | "floor"
  | "table"
  | "linear"
  | "outdoor";

export const FIXTURE_TYPES: FixtureType[] = [
  "pendant",
  "chandelier",
  "wall",
  "ceiling",
  "recessed",
  "track",
  "floor",
  "table",
  "linear",
  "outdoor",
];

export type Dimming = "none" | "phase" | "dali" | "1-10v" | "push" | "casambi";
export type IpRating = 20 | 44 | 54 | 65 | 67;
export type LeadTime = "stock" | "weeks-2-4" | "weeks-6-8" | "weeks-10-12";

/** Photometric footprint used by the glow renderers (CSS + WebGL). */
export type LightShape = "pool" | "cone" | "halo" | "wash" | "spot" | "diffuse";

export type FinishId =
  | "black"
  | "white"
  | "brass"
  | "bronze"
  | "chrome"
  | "nickel"
  | "copper"
  | "smoke-glass"
  | "clear-glass"
  | "opal-glass"
  | "amber-glass"
  | "terracotta"
  | "oak"
  | "walnut"
  | "concrete";

/**
 * Procedural artwork parameters. There are no brand press photos in the demo:
 * every fixture is drawn by <FixtureArt/> from these numbers, on black.
 */
export interface FixtureArt {
  /** Overall silhouette family — maps to a drawing routine. */
  kind:
    | "dome"       // pendant: shallow dome shade
    | "cone"       // pendant: cone shade
    | "globe"      // pendant/table: glass sphere (Bomma, Dechem)
    | "cylinder"   // pendant/wall: tube
    | "disc"       // ceiling/pendant: flat luminous disc
    | "ring"       // pendant: luminous ring
    | "cluster"    // chandelier: group of globes
    | "cascade"    // chandelier: strands (Terzani, Swarovski)
    | "bar"        // linear: luminous bar
    | "arc"        // floor: arc lamp
    | "stem"       // floor/table: thin stem + small head
    | "sconce"     // wall: half shade
    | "puck"       // recessed: small circle
    | "trackhead"  // track: cylinder heads on rail
    | "bollard"    // outdoor: post
    | "lantern";   // outdoor/table: lantern box
  /** Shade / body width relative to the art box (0.1–1). */
  width: number;
  /** Shade / body height relative to the art box (0.1–1). */
  height: number;
  /** Suspension cord/stem length (0–1), where applicable. */
  drop: number;
  /** Body colour as hex. */
  body: string;
  /** Emissive surface colour when lit (hex) — tinted again by Kelvin at render time. */
  emissive: string;
  /** Count of repeated elements (globes in a cluster, heads on a track, strands). */
  count: number;
  /** Photometric footprint. */
  shape: LightShape;
  /** Beam angle in degrees (for cones/spots). */
  beam: number;
}

export interface FixtureFiles {
  spec: string; // path under /public, e.g. /demo-files/spec-sheet.pdf
  ies: string;
  dwg: string;
}

export interface Fixture {
  id: string;            // e.g. "artemide-tolomeo-sospensione"
  slug: string;          // same as id unless a nicer URL is needed
  brand: BrandId;
  name: string;          // Latin product name (brand names only as text)
  nameHe: string;        // Hebrew transliteration / name
  type: FixtureType;
  spaces: Space[];
  lumens: number;
  kelvin: Kelvin[];      // available colour temperatures
  cri: number;           // 80–98
  watts: number;
  ip: IpRating;
  dimming: Dimming[];
  /** Centimetres. */
  size: { w: number; h: number; d?: number; diameter?: number };
  finishes: FinishId[];
  price: number;         // demo price in ILS, incl. VAT
  leadTime: LeadTime;
  stock: number;         // units in Bnei Brak (seed value)
  designer?: string;
  year?: number;
  description: { he: string; en: string };
  tags: string[];
  art: FixtureArt;
  files: FixtureFiles;
  /** 1–5 — used for sort by "recommended" and for the hero/brand wall. */
  featured: number;
}

export interface Brand {
  id: BrandId;
  name: string;
  country: string;
  founded: number;
  tagline: { he: string; en: string };
  /** The fixture (by id) that lights this brand's mark on the brand wall. */
  heroFixtureId: string;
}

export interface Studio {
  id: string;
  name: string;      // Hebrew
  nameEn: string;
  city: string;
  cityEn: string;
  tier: "A" | "B" | "C";
  discountPct: number; // default tier discount
  contact: { name: string; nameEn: string; email: string; phone: string };
  specialties: string[];
  memberSince: number;
}

export type OrderStatus =
  | "quoted"
  | "ordered_italy"
  | "in_transit"
  | "in_warehouse"
  | "delivered";

export const ORDER_STATUSES: OrderStatus[] = [
  "quoted",
  "ordered_italy",
  "in_transit",
  "in_warehouse",
  "delivered",
];

export interface RoomItem {
  id: string;
  fixtureId: string;
  qty: number;
  note?: string;
  orderStatus?: OrderStatus;
}

export interface Room {
  id: string;
  name: string;   // Hebrew
  nameEn: string;
  areaM2: number;
  targetLux: number;
  items: RoomItem[];
}

export type ProjectStatus = "planning" | "quote_requested" | "quoted" | "ordered" | "delivered";

export interface Project {
  id: string;
  studioId: string;
  name: string;     // Hebrew
  nameEn: string;
  client: string;
  address: string;
  status: ProjectStatus;
  rooms: Room[];
  aiPlanId?: string;
  coverNote?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface QuoteRequest {
  id: string;
  projectId: string;
  studioId: string;
  createdAt: string;
  message?: string;
  status: "new" | "in_progress" | "sent" | "accepted";
}

export interface QuoteLine {
  fixtureId: string;
  roomId: string;
  qty: number;
  listPrice: number;
  discountPct: number;
  leadTime: LeadTime;
}

export interface Quote {
  id: string;
  requestId: string;
  projectId: string;
  studioId: string;
  lines: QuoteLine[];
  discountPct: number;
  subtotal: number;
  total: number;
  note?: string;
  sentAt: string;
  validUntil: string;
  acceptedAt?: string;
}

export type Actor = "designer" | "kamchi" | "system" | "autopilot";

export interface DemoEvent {
  id: string;
  ts: string;
  actor: Actor;
  type:
    | "project.created"
    | "project.item_added"
    | "project.item_removed"
    | "project.room_added"
    | "quote.requested"
    | "quote.sent"
    | "quote.accepted"
    | "order.status"
    | "lead_time.updated"
    | "discount.updated"
    | "ai.relight"
    | "ai.plan"
    | "ai.consult"
    | "cart.added"
    | "demo.reset"
    | "appointment.requested";
  title: { he: string; en: string };
  projectId?: string;
  studioId?: string;
  fixtureId?: string;
  payload?: Record<string, unknown>;
  seenByDesigner: boolean;
  seenByDesk: boolean;
}

export interface CartItem {
  fixtureId: string;
  qty: number;
  finish?: FinishId;
}

/* ---------- AI feature contracts (server routes + UI share these) ---------- */

export interface RelightPlacement {
  /** Where the fixture's optical centre goes, normalised 0..1 in image space. */
  anchor: { x: number; y: number };
  /** Fixture width as a fraction of image width. */
  scale: number;
  /** What the fixture sits over / on. */
  surface: "table" | "sofa" | "bed" | "desk" | "floor" | "counter" | "wall" | "unknown";
  /** Normalised bounding box of that surface. */
  surfaceBox: { x: number; y: number; w: number; h: number };
  /** Estimated ceiling height in metres. */
  ceilingM: number;
  /** Where the cast light pool lands (ellipse, normalised). */
  pool: { cx: number; cy: number; rx: number; ry: number };
  /** 0..1 how dark the source photo is. */
  ambient: number;
  /** Short Hebrew + English rationale, shown under the result. */
  rationale: { he: string; en: string };
}

export type Zone = "ambient" | "task" | "accent";

export interface PlanRoom {
  id: string;
  label: { he: string; en: string };
  /** Polygon in normalised plan coordinates. */
  polygon: { x: number; y: number }[];
  areaM2: number;
  targetLux: number;
  zones: {
    zone: Zone;
    fixtureId: string;
    qty: number;
    /** Normalised positions on the plan. */
    points: { x: number; y: number }[];
    note: { he: string; en: string };
  }[];
}

export interface LightingPlan {
  id: string;
  createdAt: string;
  rooms: PlanRoom[];
  totalsIls: number;
  summary: { he: string; en: string };
}

export interface ConsultantAnswer {
  text: { he: string; en: string };
  fixtureIds: string[];
  /** Spec facts quoted from the catalogue, never invented. */
  facts: { fixtureId: string; field: string; value: string }[];
}

export type AiSource = "model" | "simulation";

export interface AiEnvelope<T> {
  source: AiSource;
  model?: string;
  ms: number;
  data: T;
  notice: { he: string; en: string };
}
