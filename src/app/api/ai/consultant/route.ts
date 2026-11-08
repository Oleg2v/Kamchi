import { NextResponse } from "next/server";
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { simulateConsultant } from "@/lib/ai/consultant-sim";
import { envelope } from "@/lib/ai/envelope";
import { callModel } from "@/lib/ai/model";
import { consultantTask } from "@/lib/ai/prompts";
import { ConsultantAnswerSchema } from "@/lib/ai/schemas";
import { sanitizeConsultant } from "@/lib/ai/validate";
import type { AiEnvelope, ConsultantAnswer } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) })).min(1).max(24),
});

/** Alternating user/assistant turns that start and end with the user; merges runs of the same role. */
function toModelTurns(ms: { role: "user" | "assistant"; content: string }[]): Anthropic.MessageParam[] {
  const out: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of ms) {
    if (!out.length && m.role === "assistant") continue;
    const last = out[out.length - 1];
    if (last && last.role === m.role) last.content += `\n\n${m.content}`;
    else out.push({ ...m });
  }
  if (out.length && out[out.length - 1].role === "assistant") out.pop();
  const turns: Anthropic.MessageParam[] = out.slice(-12).map((m) => ({ role: m.role, content: m.content }));
  const last = turns[turns.length - 1];
  if (last) last.content = [{ type: "text", text: String(last.content) }, { type: "text", text: consultantTask() }];
  return turns;
}

/** POST { messages: [{ role, content }] } → AiEnvelope<ConsultantAnswer>. */
export async function POST(req: Request): Promise<NextResponse<AiEnvelope<ConsultantAnswer> | { error: string }>> {
  const t0 = Date.now();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const { messages } = parsed.data;
  if (!messages.some((m) => m.role === "user")) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const turns = toModelTurns(messages);
  const hit = turns.length ? await callModel(ConsultantAnswerSchema, turns, { effort: "low", maxTokens: 2500 }) : null;

  if (hit) return NextResponse.json(envelope(sanitizeConsultant(hit.data), "model", Date.now() - t0, hit.model));
  return NextResponse.json(envelope(simulateConsultant(messages), "simulation", Date.now() - t0));
}
