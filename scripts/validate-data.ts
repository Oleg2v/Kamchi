/* Validates the demo data against the shared zod schemas. Run: pnpm validate:data */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { FixturesFile, BrandsFile, StudiosFile, ProjectsFile } from "../src/lib/data/schema";

const root = resolve(__dirname, "../src/lib/data");
const read = (f: string) => JSON.parse(readFileSync(resolve(root, f), "utf8"));

let ok = true;
function check(name: string, schema: { safeParse: (v: unknown) => { success: boolean; error?: unknown } }, value: unknown) {
  const r = schema.safeParse(value);
  if (!r.success) {
    ok = false;
    console.error(`✗ ${name}`);
    console.error(JSON.stringify(r.error, null, 2).slice(0, 4000));
  } else {
    console.log(`✓ ${name}`);
  }
}

const fixtures = read("fixtures.json") as { id: string; brand: string; type: string; spaces: string[]; slug: string }[];
const brands = read("brands.json") as { id: string; heroFixtureId: string }[];
const studios = read("studios.json") as { id: string }[];
const projects = read("projects.json") as { studioId: string; rooms: { items: { fixtureId: string }[] }[] }[];

check("fixtures.json", FixturesFile, fixtures);
check("brands.json", BrandsFile, brands);
check("studios.json", StudiosFile, studios);
check("projects.json", ProjectsFile, projects);

// Referential integrity
const ids = new Set(fixtures.map((f) => f.id));
const slugs = new Set(fixtures.map((f) => f.slug));
if (ids.size !== fixtures.length) { ok = false; console.error("✗ duplicate fixture ids"); }
if (slugs.size !== fixtures.length) { ok = false; console.error("✗ duplicate fixture slugs"); }
for (const b of brands) if (!ids.has(b.heroFixtureId)) { ok = false; console.error(`✗ brand ${b.id} heroFixtureId missing: ${b.heroFixtureId}`); }
const studioIds = new Set(studios.map((s) => s.id));
for (const p of projects) {
  if (!studioIds.has(p.studioId)) { ok = false; console.error(`✗ project studio missing: ${p.studioId}`); }
  for (const r of p.rooms) for (const it of r.items) if (!ids.has(it.fixtureId)) { ok = false; console.error(`✗ project item fixture missing: ${it.fixtureId}`); }
}
// Coverage: every brand has ≥2 fixtures, every type and space is represented
const perBrand = new Map<string, number>();
for (const f of fixtures) perBrand.set(f.brand, (perBrand.get(f.brand) ?? 0) + 1);
for (const [b, n] of perBrand) if (n < 2) { ok = false; console.error(`✗ brand ${b} has only ${n} fixture(s)`); }
const types = new Set(fixtures.map((f) => f.type));
const spaces = new Set(fixtures.flatMap((f) => f.spaces));
console.log(`brands: ${perBrand.size}, types: ${[...types].join(",")}, spaces: ${[...spaces].join(",")}`);
if (types.size < 10) { ok = false; console.error("✗ not all fixture types represented"); }
if (spaces.size < 9) { ok = false; console.error("✗ not all spaces represented"); }

if (!ok) process.exit(1);
console.log("All demo data valid.");
