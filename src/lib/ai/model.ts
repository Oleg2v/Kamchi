import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { AI_MODEL, KAMCHI_SYSTEM, getAnthropic } from "./client";
import { catalogContext } from "./catalog-context";

/**
 * One call shape for the three features. The system block is built once per process and is
 * byte-identical on every request, so the catalogue prefix is prompt-cacheable.
 */
const SYSTEM: Anthropic.TextBlockParam[] = [
  { type: "text", text: `${KAMCHI_SYSTEM}\n\nCATALOGUE:\n${catalogContext()}`, cache_control: { type: "ephemeral" } },
];

export interface ModelHit<T> { data: T; model: string }

export async function callModel<S extends z.ZodType>(
  schema: S,
  messages: Anthropic.MessageParam[],
  opts: { effort?: "low" | "medium" | "high"; maxTokens?: number } = {},
): Promise<ModelHit<z.infer<S>> | null> {
  const client = getAnthropic();
  if (!client) return null;
  try {
    const res = await client.messages.parse({
      model: AI_MODEL,
      max_tokens: opts.maxTokens ?? 4000,
      system: SYSTEM,
      messages,
      output_config: { format: zodOutputFormat(schema), effort: opts.effort ?? "low" },
    });
    if (res.stop_reason === "refusal" || !res.parsed_output) return null;
    return { data: res.parsed_output as z.infer<S>, model: res.model };
  } catch (err) {
    if (err instanceof Anthropic.APIError) console.error(`[kamchi-ai] ${err.status ?? "network"} ${err.name}: ${err.message}`);
    else console.error("[kamchi-ai] model call failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
