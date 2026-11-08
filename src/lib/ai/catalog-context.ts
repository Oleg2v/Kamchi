import { FIXTURES } from "../data";
import type { Fixture } from "../types";

/** One compact line per fixture — the only facts the model may quote. */
export function fixtureLine(f: Fixture): string {
  const size = f.size.diameter ? `Ø${f.size.diameter}cm h${f.size.h}cm` : `${f.size.w}×${f.size.h}${f.size.d ? `×${f.size.d}` : ""}cm`;
  return `${f.id} | ${f.brand} ${f.name} (${f.nameHe}) | type=${f.type} | spaces=${f.spaces.join("/")} | ${f.lumens}lm | ${f.kelvin.join("/")}K | CRI${f.cri} | ${f.watts}W | IP${f.ip} | dim=${f.dimming.join("/")} | ${size} | finishes=${f.finishes.join("/")} | ₪${f.price} demo | lead=${f.leadTime} | stock=${f.stock}`;
}

/** Full catalogue grounding block (≈60 lines). Stable text → prompt-cacheable. */
export function catalogContext(): string {
  return FIXTURES.map(fixtureLine).join("\n");
}

export function catalogIds(): Set<string> {
  return new Set(FIXTURES.map((f) => f.id));
}
