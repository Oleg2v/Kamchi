/**
 * Catalogue filtering — pure functions, no React.
 * The URL is the state: ?space=&brand=&type=&size=&k=&dim=&ip=&min=&max=&q=&sort=
 * Multi-value facets are comma-separated (`?brand=artemide,vibia`).
 */
import type { BrandId, Dimming, Fixture, FixtureType, IpRating, Kelvin, Space } from "../types";
import { BRAND_IDS, FIXTURE_TYPES, SPACES } from "../types";
import { BRANDS, FIXTURES } from "../data";

export type SizeBucket = "small" | "medium" | "large";
export const SIZE_BUCKETS: readonly SizeBucket[] = ["small", "medium", "large"];

export type SortKey = "featured" | "price-asc" | "price-desc" | "lumens-desc" | "new";
export const SORT_KEYS: readonly SortKey[] = ["featured", "price-asc", "price-desc", "lumens-desc", "new"];

export const KELVIN_VALUES: readonly Kelvin[] = [2700, 3000, 4000];
export const IP_VALUES: readonly IpRating[] = [20, 44, 54, 65, 67];
export const DIMMING_VALUES: readonly Dimming[] = ["none", "phase", "dali", "1-10v", "push", "casambi"];

export type FacetKey = "space" | "brand" | "type" | "size" | "k" | "dim" | "ip";
export const FACET_KEYS: readonly FacetKey[] = ["space", "brand", "type", "size", "k", "dim", "ip"];

export interface CatalogParams {
  space: Space[];
  brand: BrandId[];
  type: FixtureType[];
  size: SizeBucket[];
  k: Kelvin[];
  dim: Dimming[];
  ip: IpRating[];
  /** Demo ILS, inclusive. */
  min?: number;
  max?: number;
  q: string;
  sort: SortKey;
}

export const EMPTY_PARAMS: CatalogParams = Object.freeze({
  space: [], brand: [], type: [], size: [], k: [], dim: [], ip: [], q: "", sort: "featured",
}) as CatalogParams;

/** Price bounds of the whole catalogue (demo ILS). */
export const PRICE_BOUNDS = FIXTURES.reduce(
  (acc, f) => ({ min: Math.min(acc.min, f.price), max: Math.max(acc.max, f.price) }),
  { min: Number.POSITIVE_INFINITY, max: 0 },
);

/** Facet values that actually occur in the catalogue, in canonical order. */
export const FACET_VALUES: { [K in FacetKey]: readonly CatalogParams[K][number][] } = {
  space: SPACES.filter((s) => FIXTURES.some((f) => f.spaces.includes(s))),
  brand: BRAND_IDS.filter((b) => FIXTURES.some((f) => f.brand === b)),
  type: FIXTURE_TYPES.filter((t) => FIXTURES.some((f) => f.type === t)),
  size: SIZE_BUCKETS,
  k: KELVIN_VALUES.filter((k) => FIXTURES.some((f) => f.kelvin.includes(k))),
  dim: DIMMING_VALUES.filter((d) => FIXTURES.some((f) => f.dimming.includes(d))),
  ip: IP_VALUES.filter((ip) => FIXTURES.some((f) => f.ip === ip)),
};

const brandNameById = new Map(BRANDS.map((b) => [b.id, b.name.toLowerCase()]));

/* ───────────────────────── sizes ───────────────────────── */

/** Largest dimension in cm (diameter counts). */
export function maxDimension(f: Pick<Fixture, "size">): number {
  const { w, h, d, diameter } = f.size;
  return Math.max(w, h, d ?? 0, diameter ?? 0);
}

/** small ≤ 30 cm · medium ≤ 80 cm · large above, by max dimension or diameter. */
export function sizeBucket(f: Pick<Fixture, "size">): SizeBucket {
  const m = maxDimension(f);
  if (m <= 30) return "small";
  if (m <= 80) return "medium";
  return "large";
}

/* ───────────────────────── parsing ───────────────────────── */

type ParamGetter = { get(name: string): string | null };
type ParamRecord = Record<string, string | string[] | undefined>;
export type ParamSource = ParamGetter | ParamRecord;

function readParam(src: ParamSource, key: string): string | null {
  if (typeof (src as ParamGetter).get === "function") return (src as ParamGetter).get(key);
  const v = (src as ParamRecord)[key];
  if (Array.isArray(v)) return v.join(",");
  return v ?? null;
}

function parseList<T extends string | number>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw) return [];
  const out: T[] = [];
  for (const part of raw.split(",")) {
    const p = part.trim();
    if (!p) continue;
    const hit = allowed.find((a) => String(a) === p);
    if (hit !== undefined && !out.includes(hit)) out.push(hit);
  }
  return out;
}

function parsePrice(raw: string | null): number | undefined {
  if (raw == null || raw.trim() === "") return undefined;
  const n = Number(raw.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n);
}

/** Parse URL search params (or a plain record) into typed, validated params. Unknown values are dropped. */
export function parseParams(src: ParamSource): CatalogParams {
  const sortRaw = readParam(src, "sort");
  const sort = (SORT_KEYS as readonly string[]).includes(sortRaw ?? "") ? (sortRaw as SortKey) : "featured";
  return {
    space: parseList(readParam(src, "space"), SPACES),
    brand: parseList(readParam(src, "brand"), BRAND_IDS),
    type: parseList(readParam(src, "type"), FIXTURE_TYPES),
    size: parseList(readParam(src, "size"), SIZE_BUCKETS),
    k: parseList(readParam(src, "k"), KELVIN_VALUES),
    dim: parseList(readParam(src, "dim"), DIMMING_VALUES),
    ip: parseList(readParam(src, "ip"), IP_VALUES),
    min: parsePrice(readParam(src, "min")),
    max: parsePrice(readParam(src, "max")),
    q: readParam(src, "q") ?? "",
    sort,
  };
}

/** Serialise params to a search string ("" when nothing is set, otherwise "?…"). Round-trips through parseParams. */
export function serializeParams(p: CatalogParams): string {
  const parts: string[] = [];
  for (const key of FACET_KEYS) {
    const list = p[key] as readonly (string | number)[];
    if (list.length) parts.push(`${key}=${list.map(String).join(",")}`);
  }
  if (p.min !== undefined) parts.push(`min=${p.min}`);
  if (p.max !== undefined) parts.push(`max=${p.max}`);
  if (p.q) parts.push(`q=${encodeURIComponent(p.q)}`);
  if (p.sort !== "featured") parts.push(`sort=${p.sort}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

/* ───────────────────────── matching ───────────────────────── */

/** Free text over name / nameHe / brand / tags. Case-insensitive, every word must match somewhere. */
export function matchesQuery(f: Fixture, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [f.name, f.nameHe, f.brand, brandNameById.get(f.brand) ?? "", f.id, ...f.tags].join(" ").toLowerCase();
  return needle.split(/\s+/).every((word) => hay.includes(word));
}

/** Facets combine with AND; values inside a facet with OR. */
export function matches(f: Fixture, p: CatalogParams): boolean {
  if (p.space.length && !p.space.some((s) => f.spaces.includes(s))) return false;
  if (p.brand.length && !p.brand.includes(f.brand)) return false;
  if (p.type.length && !p.type.includes(f.type)) return false;
  if (p.size.length && !p.size.includes(sizeBucket(f))) return false;
  if (p.k.length && !p.k.some((k) => f.kelvin.includes(k))) return false;
  if (p.dim.length && !p.dim.some((d) => f.dimming.includes(d))) return false;
  if (p.ip.length && !p.ip.includes(f.ip)) return false;
  if (p.min !== undefined && f.price < p.min) return false;
  if (p.max !== undefined && f.price > p.max) return false;
  if (p.q && !matchesQuery(f, p.q)) return false;
  return true;
}

const byFeatured = (a: Fixture, b: Fixture) => b.featured - a.featured || a.price - b.price || a.name.localeCompare(b.name);

export function sortFixtures(list: readonly Fixture[], sort: SortKey): Fixture[] {
  const out = [...list];
  switch (sort) {
    case "price-asc":
      return out.sort((a, b) => a.price - b.price || byFeatured(a, b));
    case "price-desc":
      return out.sort((a, b) => b.price - a.price || byFeatured(a, b));
    case "lumens-desc":
      return out.sort((a, b) => b.lumens - a.lumens || byFeatured(a, b));
    case "new":
      return out.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || byFeatured(a, b));
    case "featured":
    default:
      return out.sort(byFeatured);
  }
}

/** Filter + sort. */
export function filterFixtures(fixtures: readonly Fixture[], p: CatalogParams): Fixture[] {
  return sortFixtures(fixtures.filter((f) => matches(f, p)), p.sort);
}

/* ───────────────────────── facets & chips ───────────────────────── */

function facetValuesOf(f: Fixture, key: FacetKey): readonly (string | number)[] {
  switch (key) {
    case "space": return f.spaces;
    case "brand": return [f.brand];
    case "type": return [f.type];
    case "size": return [sizeBucket(f)];
    case "k": return f.kelvin;
    case "dim": return f.dimming;
    case "ip": return [f.ip];
  }
}

/**
 * Result counts per value of one facet, given every *other* active filter
 * (standard faceted search: "what would I get if I also picked this?").
 */
export function facetCounts(fixtures: readonly Fixture[], p: CatalogParams, key: FacetKey): Record<string, number> {
  const rest: CatalogParams = { ...p, [key]: [] };
  const counts: Record<string, number> = {};
  for (const f of fixtures) {
    if (!matches(f, rest)) continue;
    for (const v of facetValuesOf(f, key)) counts[String(v)] = (counts[String(v)] ?? 0) + 1;
  }
  return counts;
}

export function allFacetCounts(fixtures: readonly Fixture[], p: CatalogParams): Record<FacetKey, Record<string, number>> {
  return Object.fromEntries(FACET_KEYS.map((k) => [k, facetCounts(fixtures, p, k)])) as Record<FacetKey, Record<string, number>>;
}

/** Number of active filters (each facet value, each price bound and the query count one). */
export function countActive(p: CatalogParams): number {
  let n = 0;
  for (const key of FACET_KEYS) n += p[key].length;
  if (p.min !== undefined) n += 1;
  if (p.max !== undefined) n += 1;
  if (p.q.trim()) n += 1;
  return n;
}

export type ActiveChip =
  | { kind: "facet"; key: FacetKey; value: string }
  | { kind: "min"; value: number }
  | { kind: "max"; value: number }
  | { kind: "q"; value: string };

export function activeChips(p: CatalogParams): ActiveChip[] {
  const chips: ActiveChip[] = [];
  for (const key of FACET_KEYS) for (const v of p[key] as readonly (string | number)[]) chips.push({ kind: "facet", key, value: String(v) });
  if (p.min !== undefined) chips.push({ kind: "min", value: p.min });
  if (p.max !== undefined) chips.push({ kind: "max", value: p.max });
  if (p.q.trim()) chips.push({ kind: "q", value: p.q.trim() });
  return chips;
}

export function removeChip(p: CatalogParams, chip: ActiveChip): CatalogParams {
  switch (chip.kind) {
    case "facet":
      return { ...p, [chip.key]: (p[chip.key] as readonly (string | number)[]).filter((v) => String(v) !== chip.value) };
    case "min":
      return { ...p, min: undefined };
    case "max":
      return { ...p, max: undefined };
    case "q":
      return { ...p, q: "" };
  }
}

export function toggleValue<K extends FacetKey>(p: CatalogParams, key: K, value: CatalogParams[K][number]): CatalogParams {
  const list = p[key] as readonly (string | number)[];
  const has = list.some((v) => String(v) === String(value));
  const next = has ? list.filter((v) => String(v) !== String(value)) : [...list, value];
  return { ...p, [key]: next };
}

/** Everything off, sort kept. */
export function clearParams(p: CatalogParams): CatalogParams {
  return { ...EMPTY_PARAMS, sort: p.sort };
}

/** Lumens per watt, rounded. */
export function efficacy(f: Pick<Fixture, "lumens" | "watts">): number {
  return f.watts > 0 ? Math.round(f.lumens / f.watts) : 0;
}

/** "2600 lm · 2700/3000K · IP20" — always LTR. */
export function specLine(f: Pick<Fixture, "lumens" | "kelvin" | "ip">): string {
  return `${f.lumens} lm · ${f.kelvin.join("/")}K · IP${f.ip}`;
}
