import { NextResponse } from "next/server";
import { z } from "zod";
import { envelope } from "@/lib/ai/envelope";
import { callModel } from "@/lib/ai/model";
import { buildLightingPlan, simulatedDetect } from "@/lib/ai/plan-rules";
import { planTask } from "@/lib/ai/prompts";
import { PlanRoomDetectSchema } from "@/lib/ai/schemas";
import type { AiEnvelope, LightingPlan } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  /** Either a raster image or a PDF document, base64 without the data: prefix. */
  image: z.string().min(64).max(8_000_000).optional(),
  document: z.string().min(64).max(12_000_000).optional(),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]),
  aspect: z.number().min(0.2).max(5).optional(),
}).refine((b) => (b.mediaType === "application/pdf" ? !!b.document : !!b.image), { message: "image or document required" });

/** POST { image | document, mediaType, aspect? } → AiEnvelope<LightingPlan>. */
export async function POST(req: Request): Promise<NextResponse<AiEnvelope<LightingPlan> | { error: string }>> {
  const t0 = Date.now();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const body = parsed.data;

  const media =
    body.mediaType === "application/pdf"
      ? ({ type: "document", source: { type: "base64", media_type: "application/pdf", data: body.document! } } as const)
      : ({ type: "image", source: { type: "base64", media_type: body.mediaType, data: body.image! } } as const);

  const hit = await callModel(
    PlanRoomDetectSchema,
    [{ role: "user", content: [media, { type: "text", text: planTask() }] }],
    { effort: "medium", maxTokens: 6000 },
  );

  if (hit) return NextResponse.json(envelope(buildLightingPlan(hit.data, true), "model", Date.now() - t0, hit.model));
  return NextResponse.json(envelope(buildLightingPlan(simulatedDetect(body.aspect ?? 1.414), false), "simulation", Date.now() - t0));
}
