import type { Brand, Fixture, Project, Studio } from "../types";
import fixturesJson from "./fixtures.json";
import brandsJson from "./brands.json";
import studiosJson from "./studios.json";
import projectsJson from "./projects.json";

/** Static catalogue — never persisted, always the source of truth for specs. */
export const FIXTURES = fixturesJson as unknown as Fixture[];
export const BRANDS = brandsJson as unknown as Brand[];
export const STUDIOS = studiosJson as unknown as Studio[];
export const SEED_PROJECTS = projectsJson as unknown as Project[];

const byId = new Map(FIXTURES.map((f) => [f.id, f]));
const bySlug = new Map(FIXTURES.map((f) => [f.slug, f]));
const brandById = new Map(BRANDS.map((b) => [b.id, b]));
const studioById = new Map(STUDIOS.map((s) => [s.id, s]));

export function getFixture(id: string): Fixture | undefined {
  return byId.get(id);
}
export function getFixtureBySlug(slug: string): Fixture | undefined {
  return bySlug.get(slug);
}
export function getBrand(id: string): Brand | undefined {
  return brandById.get(id as Brand["id"]);
}
export function getStudio(id: string): Studio | undefined {
  return studioById.get(id);
}
export function fixturesByBrand(brandId: string): Fixture[] {
  return FIXTURES.filter((f) => f.brand === brandId);
}
export function featuredFixtures(n = 8): Fixture[] {
  return [...FIXTURES].sort((a, b) => b.featured - a.featured || a.price - b.price).slice(0, n);
}
