import { z } from "zod";
import { BRAND_IDS, FIXTURE_TYPES, SPACES } from "../types";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const FixtureArtSchema = z.object({
  kind: z.enum([
    "dome", "cone", "globe", "cylinder", "disc", "ring", "cluster", "cascade",
    "bar", "arc", "stem", "sconce", "puck", "trackhead", "bollard", "lantern",
  ]),
  width: z.number().min(0.1).max(1),
  height: z.number().min(0.1).max(1),
  drop: z.number().min(0).max(1),
  body: hex,
  emissive: hex,
  count: z.number().int().min(1).max(24),
  shape: z.enum(["pool", "cone", "halo", "wash", "spot", "diffuse"]),
  beam: z.number().min(10).max(360),
});

export const FixtureSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  brand: z.enum(BRAND_IDS as [string, ...string[]]),
  name: z.string().min(2),
  nameHe: z.string().min(2),
  type: z.enum(FIXTURE_TYPES as [string, ...string[]]),
  spaces: z.array(z.enum(SPACES as [string, ...string[]])).min(1),
  lumens: z.number().int().min(50).max(30000),
  kelvin: z.array(z.union([z.literal(2700), z.literal(3000), z.literal(4000)])).min(1),
  cri: z.number().int().min(80).max(98),
  watts: z.number().min(1).max(400),
  ip: z.union([z.literal(20), z.literal(44), z.literal(54), z.literal(65), z.literal(67)]),
  dimming: z.array(z.enum(["none", "phase", "dali", "1-10v", "push", "casambi"])).min(1),
  size: z.object({
    w: z.number().positive(),
    h: z.number().positive(),
    d: z.number().positive().optional(),
    diameter: z.number().positive().optional(),
  }),
  finishes: z.array(z.enum([
    "black", "white", "brass", "bronze", "chrome", "nickel", "copper", "smoke-glass",
    "clear-glass", "opal-glass", "amber-glass", "terracotta", "oak", "walnut", "concrete",
  ])).min(1),
  price: z.number().int().min(300).max(120000),
  leadTime: z.enum(["stock", "weeks-2-4", "weeks-6-8", "weeks-10-12"]),
  stock: z.number().int().min(0).max(200),
  designer: z.string().optional(),
  year: z.number().int().min(1950).max(2026).optional(),
  description: z.object({ he: z.string().min(20), en: z.string().min(20) }),
  tags: z.array(z.string()),
  art: FixtureArtSchema,
  files: z.object({ spec: z.string(), ies: z.string(), dwg: z.string() }),
  featured: z.number().int().min(1).max(5),
});

export const BrandSchema = z.object({
  id: z.enum(BRAND_IDS as [string, ...string[]]),
  name: z.string(),
  country: z.string(),
  founded: z.number().int(),
  tagline: z.object({ he: z.string(), en: z.string() }),
  heroFixtureId: z.string(),
});

export const StudioSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  nameEn: z.string(),
  city: z.string(),
  cityEn: z.string(),
  tier: z.enum(["A", "B", "C"]),
  discountPct: z.number().min(0).max(60),
  contact: z.object({ name: z.string(), nameEn: z.string(), email: z.string().email(), phone: z.string() }),
  specialties: z.array(z.string()),
  memberSince: z.number().int(),
});

export const RoomItemSchema = z.object({
  id: z.string(),
  fixtureId: z.string(),
  qty: z.number().int().min(1),
  note: z.string().optional(),
  orderStatus: z.enum(["quoted", "ordered_italy", "in_transit", "in_warehouse", "delivered"]).optional(),
});

export const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameEn: z.string(),
  areaM2: z.number().positive(),
  targetLux: z.number().int().min(50).max(1500),
  items: z.array(RoomItemSchema),
});

export const ProjectSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  studioId: z.string(),
  name: z.string(),
  nameEn: z.string(),
  client: z.string(),
  address: z.string(),
  status: z.enum(["planning", "quote_requested", "quoted", "ordered", "delivered"]),
  rooms: z.array(RoomSchema).min(1),
  aiPlanId: z.string().optional(),
  coverNote: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const FixturesFile = z.array(FixtureSchema).min(60).max(60);
export const BrandsFile = z.array(BrandSchema).length(16);
export const StudiosFile = z.array(StudioSchema).length(6);
export const ProjectsFile = z.array(ProjectSchema).length(4);
