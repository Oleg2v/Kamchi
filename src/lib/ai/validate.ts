import { FIXTURES, getFixture } from "../data";
import { DIMMING_LABEL, FINISH_LABEL, FIXTURE_TYPE_LABEL, LEAD_TIME_LABEL, SPACE_LABEL } from "../i18n/common";
import type { Bi } from "../i18n";
import type { ConsultantAnswer, Fixture, FixtureType, Lang, Space } from "../types";

/* ─────────────────────────────────────────────────────────────
   Guard rails shared by the three AI routes and the simulations:
   every fixture id must exist in the catalogue, every quoted fact
   must equal the real field value. The model never invents specs.
   ───────────────────────────────────────────────────────────── */

export const isFixtureId = (id: string): boolean => !!getFixture(id);

const tokens = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

export interface NearestHint {
  types?: FixtureType[];
  space?: Space;
  minIp?: number;
}

/** Nearest real fixture for an id the model made up: id-token overlap, then type/space fit. */
export function nearestFixtureId(bad: string, hint: NearestHint = {}): string {
  const bt = new Set(tokens(bad));
  let best: Fixture | undefined;
  let bestScore = -Infinity;
  for (const f of FIXTURES) {
    if (hint.minIp && f.ip < hint.minIp) continue;
    let s = 0;
    for (const t of tokens(f.id)) if (bt.has(t)) s += t.length >= 4 ? 3 : 1;
    if (hint.types?.length) s += hint.types.includes(f.type) ? 4 : -6;
    if (hint.space) s += f.spaces.includes(hint.space) ? 2 : 0;
    s += f.featured * 0.1 - f.price / 1_000_000;
    if (s > bestScore) { bestScore = s; best = f; }
  }
  return best?.id ?? FIXTURES[0].id;
}

/* ───────────────────────── facts ───────────────────────── */

export type FactField =
  | "lumens" | "kelvin" | "cri" | "watts" | "ip" | "dimming" | "price" | "leadTime"
  | "size" | "finishes" | "beam" | "type" | "spaces" | "brand" | "designer" | "year" | "stock";

const FIELD_ALIASES: Record<string, FactField> = {
  lumens: "lumens", lumen: "lumens", lm: "lumens", flux: "lumens", output: "lumens", "luminous flux": "lumens", "light output": "lumens",
  kelvin: "kelvin", k: "kelvin", cct: "kelvin", "colour temperature": "kelvin", "color temperature": "kelvin", temperature: "kelvin",
  cri: "cri", "colour rendering": "cri", "color rendering": "cri", ra: "cri",
  watts: "watts", watt: "watts", w: "watts", power: "watts", wattage: "watts",
  ip: "ip", "ip rating": "ip", iprating: "ip", "ingress protection": "ip", protection: "ip",
  dimming: "dimming", dim: "dimming", dimmable: "dimming", "dimming protocol": "dimming", protocol: "dimming",
  price: "price", "price ils": "price", ils: "price", cost: "price", "demo price": "price",
  leadtime: "leadTime", "lead time": "leadTime", lead: "leadTime", delivery: "leadTime", availability: "leadTime",
  size: "size", dimensions: "size", dimension: "size", diameter: "size", width: "size", height: "size", length: "size",
  finishes: "finishes", finish: "finishes", colour: "finishes", color: "finishes", material: "finishes",
  beam: "beam", "beam angle": "beam", angle: "beam",
  type: "type", kind: "type", category: "type",
  spaces: "spaces", space: "spaces", rooms: "spaces", room: "spaces", use: "spaces",
  brand: "brand", manufacturer: "brand", maker: "brand",
  designer: "designer", year: "year", stock: "stock", inventory: "stock",
};

export const FACT_LABEL: Record<FactField, Bi> = {
  lumens: { he: "שטף אור", en: "Output" },
  kelvin: { he: "טמפרטורת צבע", en: "Colour temp." },
  cri: { he: "מסירת צבע", en: "CRI" },
  watts: { he: "הספק", en: "Power" },
  ip: { he: "דרגת אטימות", en: "IP rating" },
  dimming: { he: "עמעום", en: "Dimming" },
  price: { he: "מחיר הדגמה", en: "Demo price" },
  leadTime: { he: "זמן אספקה", en: "Lead time" },
  size: { he: "מידות", en: "Size" },
  finishes: { he: "גימורים", en: "Finishes" },
  beam: { he: "זווית אלומה", en: "Beam" },
  type: { he: "סוג", en: "Type" },
  spaces: { he: "חללים", en: "Spaces" },
  brand: { he: "מותג", en: "Brand" },
  designer: { he: "מעצב", en: "Designer" },
  year: { he: "שנה", en: "Year" },
  stock: { he: "מלאי בבני ברק", en: "Stock, Bnei Brak" },
};

export function normalizeField(field: string): FactField | null {
  const k = field.trim().toLowerCase().replace(/[_\s-]+/g, " ");
  return FIELD_ALIASES[k] ?? FIELD_ALIASES[k.replace(/\s+/g, "")] ?? null;
}

const BRAND_NAME: Record<string, string> = {
  artemide: "Artemide", vibia: "Vibia", bomma: "Bomma", terzani: "Terzani", panzeri: "Panzeri", fabbian: "Fabbian",
  exenia: "Exenia", ole: "Ole", neko: "Neko", "cangini-tucci": "Cangini & Tucci", dechem: "Dechem", icone: "Icone",
  avolux: "Avolux", vesoi: "Vesoi", "aldo-bernardi": "Aldo Bernardi", swarovski: "Swarovski",
};
export const brandName = (id: string) => BRAND_NAME[id] ?? id;

/** The one true value of a field, formatted for a mono chip (LTR). */
export function canonicalFact(f: Fixture, field: FactField, lang: Lang = "he"): string {
  switch (field) {
    case "lumens": return `${f.lumens} lm`;
    case "kelvin": return f.kelvin.map((k) => `${k}K`).join(" / ");
    case "cri": return `CRI ${f.cri}`;
    case "watts": return `${f.watts} W`;
    case "ip": return `IP${f.ip}`;
    case "dimming": return f.dimming.map((d) => DIMMING_LABEL[d][lang]).join(" · ");
    case "price": return `₪${f.price.toLocaleString("en-US")}`;
    case "leadTime": return LEAD_TIME_LABEL[f.leadTime][lang];
    case "size": return f.size.diameter ? `Ø${f.size.diameter} · h ${f.size.h} cm` : `${f.size.w} × ${f.size.h}${f.size.d ? ` × ${f.size.d}` : ""} cm`;
    case "finishes": return f.finishes.map((x) => FINISH_LABEL[x][lang]).join(" · ");
    case "beam": return `${f.art.beam}°`;
    case "type": return FIXTURE_TYPE_LABEL[f.type][lang];
    case "spaces": return f.spaces.map((s) => SPACE_LABEL[s][lang]).join(" · ");
    case "brand": return brandName(f.brand);
    case "designer": return f.designer ?? "—";
    case "year": return f.year ? String(f.year) : "—";
    case "stock": return `${f.stock}`;
  }
}

export type Fact = ConsultantAnswer["facts"][number];

export function fact(f: Fixture, field: FactField, lang: Lang = "he"): Fact {
  return { fixtureId: f.id, field, value: canonicalFact(f, field, lang) };
}

const digits = (s: string) => s.replace(/[^0-9]/g, "");

/**
 * Keep a model fact only when it matches the real value: unknown field → drop, unknown fixture → drop,
 * numbers that are not in the real value → drop. Kept facts are rewritten to the canonical string.
 */
export function validateFacts(facts: Fact[], lang: Lang = "he"): Fact[] {
  const out: Fact[] = [];
  const seen = new Set<string>();
  for (const raw of facts) {
    const f = getFixture(raw.fixtureId);
    const field = normalizeField(raw.field);
    if (!f || !field) continue;
    const real = canonicalFact(f, field, "en");
    const rd = digits(real);
    const md = digits(raw.value ?? "");
    if (md && rd && !rd.includes(md) && !md.includes(rd)) continue;
    if (!md && rd && field !== "dimming" && field !== "finishes" && field !== "leadTime") continue;
    const key = `${f.id}:${field}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(fact(f, field, lang));
  }
  return out.slice(0, 24);
}

/** Model → contract: real ids only (nearest replacement), true facts only. */
export function sanitizeConsultant(raw: ConsultantAnswer, hint: NearestHint = {}, lang: Lang = "he"): ConsultantAnswer {
  const ids: string[] = [];
  for (const id of raw.fixtureIds ?? []) {
    const real = isFixtureId(id) ? id : nearestFixtureId(id, hint);
    if (!ids.includes(real)) ids.push(real);
  }
  const facts = validateFacts((raw.facts ?? []).map((x) => ({ ...x, fixtureId: isFixtureId(x.fixtureId) ? x.fixtureId : nearestFixtureId(x.fixtureId, hint) })), lang)
    .filter((x) => ids.includes(x.fixtureId));
  return { text: raw.text, fixtureIds: ids.slice(0, 6), facts };
}
