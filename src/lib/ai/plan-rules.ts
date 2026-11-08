import { FIXTURES, getFixture } from "../data";
import type { Bi } from "../i18n";
import { SPACE_LABEL } from "../i18n/common";
import type { Fixture, FixtureType, LightingPlan, PlanRoom, Space, Zone } from "../types";
import type { PlanRoomDetectOut } from "./schemas";
import { isFixtureId, nearestFixtureId } from "./validate";

/* ─────────────────────────────────────────────────────────────
   Lighting-plan rules (isomorphic): target lux per room, the three
   layers per room kind, fixture choice from the catalogue, quantities
   from lumens, and point layout inside the room polygon.
   ───────────────────────────────────────────────────────────── */

export type Pt = { x: number; y: number };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const TARGET_LUX: Record<Space, number> = {
  living: 180, dining: 200, kitchen: 400, bedroom: 150, bathroom: 200, office: 500, hallway: 100, outdoor: 60, commercial: 500,
};
export const LUX_RANGE: Record<Space, [number, number]> = {
  living: [150, 200], dining: [150, 300], kitchen: [300, 500], bedroom: [100, 200], bathroom: [150, 300],
  office: [400, 600], hallway: [75, 150], outdoor: [30, 100], commercial: [300, 750],
};

export interface ZoneRule { zone: Zone; types: FixtureType[]; minIp?: number; note: Bi }

const AMBIENT_NOTE: Bi = { he: "תאורה כללית אחידה מהתקרה", en: "Even general light from the ceiling" };
export const ZONE_RULES: Record<Space, ZoneRule[]> = {
  living: [
    { zone: "ambient", types: ["recessed", "ceiling"], note: AMBIENT_NOTE },
    { zone: "task", types: ["floor"], note: { he: "אור קריאה ליד הישיבה", en: "Reading light by the seating" } },
    { zone: "accent", types: ["wall", "track"], note: { he: "הדגשת קיר ויצירת עומק", en: "Wall accent for depth" } },
  ],
  dining: [
    { zone: "task", types: ["pendant", "chandelier"], note: { he: "גוף תלוי מעל השולחן, 70–80 ס״מ מהמשטח", en: "Suspended over the table, 70–80 cm above it" } },
    { zone: "ambient", types: ["recessed", "ceiling"], note: AMBIENT_NOTE },
    { zone: "accent", types: ["wall"], note: { he: "אור קיר רך להשלמה", en: "Soft wall light to round it off" } },
  ],
  kitchen: [
    { zone: "ambient", types: ["recessed", "ceiling"], note: AMBIENT_NOTE },
    { zone: "task", types: ["linear", "pendant"], note: { he: "אור משימה מעל משטח העבודה והאי", en: "Task light over the worktop and island" } },
    { zone: "accent", types: ["track"], note: { he: "פס צבירה גמיש לכיוון הארונות", en: "A track to aim at the cabinetry" } },
  ],
  bedroom: [
    { zone: "ambient", types: ["ceiling", "recessed"], note: { he: "אור כללי רך, מעומעם", en: "Soft, dimmed general light" } },
    { zone: "task", types: ["table"], note: { he: "מנורות קריאה משני צידי המיטה", en: "Reading lamps on both sides of the bed" } },
    { zone: "accent", types: ["wall"], note: { he: "אור קיר מעל הראש־מיטה", en: "Wall light above the headboard" } },
  ],
  bathroom: [
    { zone: "ambient", types: ["recessed"], minIp: 44, note: { he: "שקועים IP44 ומעלה, מחוץ לאזור המקלחת", en: "IP44+ recessed, outside the shower zone" } },
    { zone: "accent", types: ["wall"], minIp: 44, note: { he: "אור קיר משני צידי המראה", en: "Wall lights either side of the mirror" } },
  ],
  office: [
    { zone: "ambient", types: ["linear", "recessed"], note: { he: "אור אחיד, 500 לוקס על משטח העבודה", en: "Even light, 500 lux on the desk" } },
    { zone: "task", types: ["table"], note: { he: "מנורת שולחן מתכווננת", en: "Adjustable desk lamp" } },
    { zone: "accent", types: ["track"], note: { he: "פס צבירה לקיר התצוגה", en: "Track for the display wall" } },
  ],
  hallway: [
    { zone: "ambient", types: ["recessed", "ceiling"], note: { he: "אור מעבר נמוך־עוצמה", en: "Low-level circulation light" } },
    { zone: "accent", types: ["wall"], note: { he: "אור קיר לקצב לאורך המסדרון", en: "Wall lights pacing the corridor" } },
  ],
  outdoor: [
    { zone: "ambient", types: ["outdoor"], minIp: 54, note: { he: "עמודונים IP54 ומעלה לאורך השביל", en: "IP54+ bollards along the path" } },
    { zone: "accent", types: ["wall"], minIp: 54, note: { he: "אור קיר ליד הכניסה", en: "Wall light by the entrance" } },
  ],
  commercial: [
    { zone: "ambient", types: ["linear", "recessed"], note: { he: "פרופילים ליניאריים לאור אחיד", en: "Linear profiles for even light" } },
    { zone: "accent", types: ["track"], note: { he: "פס צבירה להדגשת מוצרים", en: "Track to accent merchandise" } },
  ],
};

export const ZONE_LABEL: Record<Zone, Bi> = {
  ambient: { he: "כללי", en: "Ambient" },
  task: { he: "משימה", en: "Task" },
  accent: { he: "הדגשה", en: "Accent" },
};

/** Deterministic pick from the catalogue by type list, space fit, IP floor. */
export function pickFixture(types: FixtureType[], space: Space, minIp = 0, exclude: string[] = []): Fixture | undefined {
  const pool = FIXTURES.filter((f) => types.includes(f.type) && f.ip >= minIp && !exclude.includes(f.id));
  const score = (f: Fixture) => (f.spaces.includes(space) ? 10 : 0) + (f.type === types[0] ? 2 : 0) + f.featured;
  return [...pool].sort((a, b) => score(b) - score(a) || a.price - b.price || a.id.localeCompare(b.id))[0];
}

/** qty ≈ lux × m² / (lumens × 0.5 utilisation), min 1 — per layer share. */
export function zoneQty(zone: Zone, f: Fixture, space: Space, lux: number, areaM2: number): number {
  const util = 0.5;
  if (zone === "ambient") return clamp(Math.ceil((0.65 * lux * areaM2) / (f.lumens * util)), 1, 40);
  if (zone === "task") {
    if (f.type === "chandelier") return 1;
    if (f.type === "pendant") return areaM2 < 10 ? 1 : areaM2 < 18 ? 2 : 3;
    if (f.type === "linear") return clamp(Math.round(areaM2 / 9), 1, 4);
    if (f.type === "table") return space === "bedroom" ? 2 : 1;
    if (f.type === "floor") return 1;
    return clamp(Math.ceil((0.35 * lux * areaM2 * 0.4) / (f.lumens * util)), 1, 8);
  }
  if (f.type === "track") return 1;
  const perimeter = 4 * Math.sqrt(Math.max(1, areaM2));
  return clamp(Math.round(perimeter / 5), 1, 4);
}

export function pointInPolygon(p: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function polygonBox(poly: Pt[]) {
  const xs = poly.map((p) => p.x), ys = poly.map((p) => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

export function polygonCentroid(poly: Pt[]): Pt {
  // Inner-most grid point (works for L-shapes, unlike the vertex mean).
  const b = polygonBox(poly);
  let best: Pt = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  if (pointInPolygon(best, poly)) return best;
  let bestD = -1;
  for (let i = 1; i < 8; i++) for (let j = 1; j < 8; j++) {
    const p = { x: b.x + (b.w * i) / 8, y: b.y + (b.h * j) / 8 };
    if (!pointInPolygon(p, poly)) continue;
    const d = Math.min(i, 8 - i) * Math.min(j, 8 - j);
    if (d > bestD) { bestD = d; best = p; }
  }
  return best;
}

/** Lay qty points inside the polygon: grid (ambient), centre line (task), along the top wall (accent). */
export function zonePoints(poly: Pt[], qty: number, zone: Zone): Pt[] {
  const b = polygonBox(poly);
  const inset = 0.14;
  const x0 = b.x + b.w * inset, y0 = b.y + b.h * inset, w = b.w * (1 - 2 * inset), h = b.h * (1 - 2 * inset);
  const out: Pt[] = [];
  const c = polygonCentroid(poly);
  if (zone === "ambient") {
    // Try increasingly dense grids until qty points fall inside the polygon.
    for (let n = qty; n <= qty * 4 && out.length < qty; n++) {
      out.length = 0;
      const cols = Math.max(1, Math.round(Math.sqrt((n * w) / Math.max(h, 1e-3))));
      const rows = Math.max(1, Math.ceil(n / cols));
      for (let r = 0; r < rows && out.length < qty; r++) for (let col = 0; col < cols && out.length < qty; col++) {
        const p = { x: x0 + (w * (col + 0.5)) / cols, y: y0 + (h * (r + 0.5)) / rows };
        if (pointInPolygon(p, poly)) out.push(p);
      }
    }
  } else if (zone === "task") {
    const horizontal = w >= h;
    for (let i = 0; i < qty; i++) {
      const t = qty === 1 ? 0.5 : 0.25 + (0.5 * i) / (qty - 1);
      const p = horizontal ? { x: x0 + w * t, y: c.y } : { x: c.x, y: y0 + h * t };
      out.push(pointInPolygon(p, poly) ? p : c);
    }
  } else {
    for (let i = 0; i < qty; i++) {
      const t = qty === 1 ? 0.5 : 0.18 + (0.64 * i) / (qty - 1);
      const p = { x: x0 + w * t, y: b.y + b.h * 0.07 };
      out.push(pointInPolygon(p, poly) ? p : { x: c.x, y: b.y + b.h * 0.07 });
    }
  }
  while (out.length < qty) out.push(c);
  return out;
}

const roundArea = (a: number) => Math.round(a * 10) / 10;

/** Detection (model or simulation) → a priced LightingPlan with validated catalogue fixtures. */
export function buildLightingPlan(detect: PlanRoomDetectOut, keepModelZones: boolean): LightingPlan {
  const rooms: PlanRoom[] = detect.rooms.map((r, i) => {
    const kind = r.kind as Space;
    const [lo, hi] = LUX_RANGE[kind];
    const targetLux = keepModelZones ? clamp(Math.round(r.targetLux), lo, hi) : TARGET_LUX[kind];
    const areaM2 = roundArea(clamp(r.areaM2, 1, 400));
    const polygon = r.polygon.map((p) => ({ x: clamp(p.x, 0, 1), y: clamp(p.y, 0, 1) }));
    const rules = ZONE_RULES[kind];
    let zones: PlanRoom["zones"] = [];
    if (keepModelZones && r.zones.length) {
      zones = r.zones.map((z) => {
        const rule = rules.find((x) => x.zone === z.zone) ?? rules[0];
        let fid = isFixtureId(z.fixtureId) ? z.fixtureId : nearestFixtureId(z.fixtureId, { types: rule.types, space: kind, minIp: rule.minIp });
        let f = getFixture(fid)!;
        if (rule.minIp && f.ip < rule.minIp) { fid = nearestFixtureId(fid, { types: rule.types, space: kind, minIp: rule.minIp }); f = getFixture(fid)!; }
        const qty = clamp(Math.round(z.qty), 1, 40);
        const inside = z.points.filter((p) => pointInPolygon(p, polygon));
        const points = inside.length >= qty ? inside.slice(0, qty) : zonePoints(polygon, qty, z.zone);
        return { zone: z.zone, fixtureId: fid, qty, points, note: z.note };
      });
    } else {
      const used: string[] = [];
      for (const rule of rules) {
        const f = pickFixture(rule.types, kind, rule.minIp, used);
        if (!f) continue;
        used.push(f.id);
        const qty = zoneQty(rule.zone, f, kind, targetLux, areaM2);
        zones.push({ zone: rule.zone, fixtureId: f.id, qty, points: zonePoints(polygon, qty, rule.zone), note: rule.note });
      }
    }
    const label = r.label?.he && r.label?.en ? r.label : SPACE_LABEL[kind];
    return { id: r.id || `room-${i + 1}`, label, polygon, areaM2, targetLux, zones };
  });

  const totalsIls = rooms.reduce((s, r) => s + r.zones.reduce((z, zn) => z + zn.qty * (getFixture(zn.fixtureId)?.price ?? 0), 0), 0);
  const units = rooms.reduce((s, r) => s + r.zones.reduce((z, zn) => z + zn.qty, 0), 0);
  const area = roundArea(rooms.reduce((s, r) => s + r.areaM2, 0));
  const he = `${rooms.length} חדרים · ${area} מ״ר · ${units} גופי תאורה בשלוש שכבות. ${detect.summary?.he ?? ""}`.trim();
  const en = `${rooms.length} rooms · ${area} m² · ${units} fixtures in three layers. ${detect.summary?.en ?? ""}`.trim();
  return { id: `plan-${Date.now().toString(36)}`, createdAt: new Date().toISOString(), rooms, totalsIls, summary: { he, en } };
}

const R = (x: number, y: number, w: number, h: number): Pt[] => [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];

/** Deterministic 4-room template, laid out for the sheet's aspect ratio. Also drives the demo floor plan drawing. */
export function simulatedDetect(aspect = 1.414): PlanRoomDetectOut {
  const landscape = aspect >= 1.05;
  const rooms: PlanRoomDetectOut["rooms"] = landscape
    ? [
        { id: "living", label: { he: "סלון ופינת אוכל", en: "Living & dining" }, kind: "living", areaM2: 34, targetLux: 180, zones: [],
          polygon: [{ x: 0.06, y: 0.08 }, { x: 0.56, y: 0.08 }, { x: 0.56, y: 0.62 }, { x: 0.34, y: 0.62 }, { x: 0.34, y: 0.92 }, { x: 0.06, y: 0.92 }] },
        { id: "kitchen", label: SPACE_LABEL.kitchen, kind: "kitchen", areaM2: 14, targetLux: 400, zones: [], polygon: R(0.58, 0.08, 0.36, 0.34) },
        { id: "bedroom", label: { he: "חדר שינה הורים", en: "Master bedroom" }, kind: "bedroom", areaM2: 17, targetLux: 150, zones: [], polygon: R(0.58, 0.44, 0.36, 0.48) },
        { id: "bathroom", label: SPACE_LABEL.bathroom, kind: "bathroom", areaM2: 6, targetLux: 200, zones: [], polygon: R(0.36, 0.64, 0.2, 0.28) },
      ]
    : [
        { id: "living", label: { he: "סלון ופינת אוכל", en: "Living & dining" }, kind: "living", areaM2: 34, targetLux: 180, zones: [],
          polygon: [{ x: 0.08, y: 0.06 }, { x: 0.92, y: 0.06 }, { x: 0.92, y: 0.46 }, { x: 0.5, y: 0.46 }, { x: 0.5, y: 0.56 }, { x: 0.08, y: 0.56 }] },
        { id: "kitchen", label: SPACE_LABEL.kitchen, kind: "kitchen", areaM2: 14, targetLux: 400, zones: [], polygon: R(0.52, 0.48, 0.4, 0.2) },
        { id: "bedroom", label: { he: "חדר שינה הורים", en: "Master bedroom" }, kind: "bedroom", areaM2: 17, targetLux: 150, zones: [], polygon: R(0.08, 0.58, 0.42, 0.36) },
        { id: "bathroom", label: SPACE_LABEL.bathroom, kind: "bathroom", areaM2: 6, targetLux: 200, zones: [], polygon: R(0.52, 0.7, 0.4, 0.24) },
      ];
  return {
    rooms,
    summary: {
      he: "תבנית הדגמה: ארבעה חדרים שסודרו לפי יחס הגיליון; הגופים נבחרו מהקטלוג לפי סוג וחלל.",
      en: "Demo template: four rooms laid out from the sheet's aspect ratio; fixtures chosen from the catalogue by type and space.",
    },
  };
}
