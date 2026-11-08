import type { QuotePdfInput } from "./quote-pdf";

/** Loads pdf-lib + fontkit only when a quote is actually generated. */
export async function generateQuotePdfLazy(input: QuotePdfInput): Promise<Uint8Array> {
  const mod = await import("./quote-pdf");
  return mod.generateQuotePdf(input);
}
