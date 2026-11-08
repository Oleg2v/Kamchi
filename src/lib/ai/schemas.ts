import { z } from "zod";

/** Model output for "תאירו לי את הסלון": where the fixture goes and what light it casts. */
export const RelightPlacementSchema = z.object({
  anchor: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }),
  scale: z.number().min(0.03).max(0.6),
  surface: z.enum(["table", "sofa", "bed", "desk", "floor", "counter", "wall", "unknown"]),
  surfaceBox: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1), w: z.number().min(0).max(1), h: z.number().min(0).max(1) }),
  ceilingM: z.number().min(2).max(6),
  pool: z.object({ cx: z.number().min(0).max(1), cy: z.number().min(0).max(1), rx: z.number().min(0.02).max(0.8), ry: z.number().min(0.01).max(0.6) }),
  ambient: z.number().min(0).max(1),
  rationale: z.object({ he: z.string(), en: z.string() }),
});

/** Model output for "תוכנית תאורה מתוכנית דירה": detected rooms and proposed zones. */
export const PlanRoomDetectSchema = z.object({
  rooms: z.array(
    z.object({
      id: z.string(),
      label: z.object({ he: z.string(), en: z.string() }),
      kind: z.enum(["living", "dining", "kitchen", "bedroom", "bathroom", "office", "hallway", "outdoor", "commercial"]),
      polygon: z.array(z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) })).min(3).max(12),
      areaM2: z.number().min(1).max(400),
      targetLux: z.number().int().min(50).max(1500),
      zones: z.array(
        z.object({
          zone: z.enum(["ambient", "task", "accent"]),
          fixtureId: z.string(),
          qty: z.number().int().min(1).max(40),
          points: z.array(z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) })).min(1).max(40),
          note: z.object({ he: z.string(), en: z.string() }),
        }),
      ).min(1).max(4),
    }),
  ).min(1).max(14),
  summary: z.object({ he: z.string(), en: z.string() }),
});

/** Model output for "היועץ": grounded answer with product ids and quoted facts. */
export const ConsultantAnswerSchema = z.object({
  text: z.object({ he: z.string(), en: z.string() }),
  fixtureIds: z.array(z.string()).max(6),
  facts: z.array(z.object({ fixtureId: z.string(), field: z.string(), value: z.string() })).max(24),
});

export type RelightPlacementOut = z.infer<typeof RelightPlacementSchema>;
export type PlanRoomDetectOut = z.infer<typeof PlanRoomDetectSchema>;
export type ConsultantAnswerOut = z.infer<typeof ConsultantAnswerSchema>;
