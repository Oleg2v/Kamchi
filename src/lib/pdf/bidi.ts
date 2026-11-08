import bidiFactory from "bidi-js";

const bidi = bidiFactory();

/**
 * pdf-lib draws glyphs in logical order, left to right. Hebrew needs the Unicode
 * Bidirectional Algorithm applied so that visual order is correct (numbers and
 * Latin runs stay LTR inside RTL lines, brackets are mirrored).
 */
export function toVisual(text: string, direction: "rtl" | "ltr" = "rtl"): string {
  if (!text) return text;
  const levels = bidi.getEmbeddingLevels(text, direction);
  const chars = Array.from(text);
  const mirrored = bidi.getMirroredCharactersMap(text, levels.levels);
  for (const [idx, ch] of mirrored) chars[idx] = ch;
  const flips = bidi.getReorderSegments(text, levels);
  for (const [start, end] of flips) {
    let i = start, j = end;
    while (i < j) { const t = chars[i]; chars[i] = chars[j]; chars[j] = t; i++; j--; }
  }
  return chars.join("");
}

export function isRtlText(text: string): boolean {
  return /[֐-׿؀-ۿ]/.test(text);
}
