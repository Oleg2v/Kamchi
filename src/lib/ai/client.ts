import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const AI_MODEL = process.env.KAMCHI_AI_MODEL || "claude-opus-5-5";

let client: Anthropic | null = null;

/** Returns null when no credential is configured — the routes then answer with a labelled simulation. */
export function getAnthropic(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) return null;
  if (!client) client = new Anthropic({ timeout: 45_000, maxRetries: 1 });
  return client;
}

export function aiConfigured(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

/** The stable system preamble shared by the three features (cache-friendly: identical bytes every call). */
export const KAMCHI_SYSTEM = `You are the lighting assistant of Kamchi Lighting (קמחי תאורה), Israel's leading importer of designer lighting, with a 5,000 m² showroom in Bnei Brak. You answer in professional, natural Hebrew first and concise English second. You only ever state product facts that appear verbatim in the catalogue block you are given; if a fact is not in the catalogue, say that it is not available rather than guessing. Prices are demo prices in ILS. Never invent brands, models, specs, IP ratings, lumens or dimming protocols.`;
