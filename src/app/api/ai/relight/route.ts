import { NextResponse } from "next/server";
import { z } from "zod";
import { getFixture } from "@/lib/data";
import { envelope } from "@/lib/ai/envelope";
import { callModel } from "@/lib/ai/model";
import { relightTask } from "@/lib/ai/prompts";
import { clampPlacement, simulatedPlacement } from "@/lib/ai/relight-sim";
import { RelightPlacementSchema } from "@/lib/ai/schemas";
import { isFixtureId, nearestFixtureId } from "@/lib/ai/validate";
import type { AiEnvelope, RelightPlacement } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  /** Base64 without the data: prefix. ≤ ~6 MB. */
  image: z.string().min(64).max(8_000_000),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  fixtureId: z.string().min(1).max(80),
  aspect: z.number().min(0.2).max(5).optional(),
});

/** POST { image, mediaType, fixtureId, aspect? } → AiEnvelope<RelightPlacement>. */
export async function POST(req: Request): Promise<NextResponse<AiEnvelope<RelightPlacement> | { error: string }>> {
  const t0 = Date.now();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const body = parsed.data;

  const fixtureId = isFixtureId(body.fixtureId) ? body.fixtureId : nearestFixtureId(body.fixtureId);
  const fixture = getFixture(fixtureId)!;

  const hit = await callModel(
    RelightPlacementSchema,
    [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: body.mediaType, data: body.image } },
        { type: "text", text: relightTask(fixture) },
      ],
    }],
    { effort: "low", maxTokens: 1500 },
  );

  if (hit) return NextResponse.json(envelope(clampPlacement(hit.data), "model", Date.now() - t0, hit.model));
  return NextResponse.json(envelope(simulatedPlacement(fixture, body.aspect), "simulation", Date.now() - t0));
}
