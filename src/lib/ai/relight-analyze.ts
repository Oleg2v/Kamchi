import type { PhotoAnalysis } from "./relight-sim";
import { ceilingFromAspect } from "./relight-sim";

/* ─────────────────────────────────────────────────────────────
   Client-side photo analysis for the simulation path: a luminance grid,
   the largest bright + flat horizontal region in the lower 60 % becomes
   the surface; a flat, mid-lit patch in the upper half becomes the wall
   spot; ceiling height is estimated from the aspect ratio.
   ───────────────────────────────────────────────────────────── */

const COLS = 32;
const CELL = 6;

export function analyzePhoto(img: CanvasImageSource, width: number, height: number): PhotoAnalysis {
  const aspect = width / height;
  const rows = Math.max(12, Math.min(32, Math.round(COLS / aspect)));
  const c = document.createElement("canvas");
  c.width = COLS * CELL; c.height = rows * CELL;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const { data } = ctx.getImageData(0, 0, c.width, c.height);

  const lum = new Float32Array(COLS * rows);
  const vari = new Float32Array(COLS * rows);
  let total = 0;
  for (let r = 0; r < rows; r++) for (let col = 0; col < COLS; col++) {
    let s = 0, s2 = 0;
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
      const i = ((r * CELL + y) * c.width + col * CELL + x) * 4;
      const l = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
      s += l; s2 += l * l;
    }
    const n = CELL * CELL;
    const m = s / n;
    lum[r * COLS + col] = m;
    vari[r * COLS + col] = Math.max(0, s2 / n - m * m);
    total += m;
  }
  const ambient = total / (COLS * rows);

  // Candidate surface cells: lower 60 %, brighter than most of the lower half, flat.
  const minRow = Math.floor(rows * 0.4);
  const lowerLums: number[] = [];
  for (let r = Math.floor(rows * 0.5); r < rows; r++) for (let col = 0; col < COLS; col++) lowerLums.push(lum[r * COLS + col]);
  lowerLums.sort((a, b) => a - b);
  const p55 = lowerLums[Math.floor(lowerLums.length * 0.55)] ?? 0.45;
  const bright = Math.max(0.3, Math.min(p55, ambient * 0.98));
  const ok = new Uint8Array(COLS * rows);
  for (let r = minRow; r < rows; r++) for (let col = 0; col < COLS; col++) {
    const i = r * COLS + col;
    if (lum[i] >= bright && vari[i] <= 0.012) ok[i] = 1;
  }

  // Connected components (4-neighbour). A surface reaches the bottom quarter of the frame (a wall
  // alone does not); best = area × luminance × horizontal bias.
  const seen = new Uint8Array(COLS * rows);
  let best: { x0: number; y0: number; x1: number; y1: number; area: number; score: number } | null = null;
  const stack: number[] = [];
  for (let start = minRow * COLS; start < COLS * rows; start++) {
    if (!ok[start] || seen[start]) continue;
    seen[start] = 1; stack.push(start);
    let x0 = COLS, x1 = -1, y0 = rows, y1 = -1, area = 0, lsum = 0;
    while (stack.length) {
      const i = stack.pop()!;
      const r = Math.floor(i / COLS), col = i % COLS;
      area++; lsum += lum[i];
      if (col < x0) x0 = col; if (col > x1) x1 = col; if (r < y0) y0 = r; if (r > y1) y1 = r;
      const nb = [i - 1, i + 1, i - COLS, i + COLS];
      for (const j of nb) {
        if (j < minRow * COLS || j >= COLS * rows || seen[j] || !ok[j]) continue;
        if (Math.abs((j % COLS) - col) > 1) continue; // no wrap
        seen[j] = 1; stack.push(j);
      }
    }
    if (area < 4) continue;
    if (y1 < rows * 0.72 || y0 < rows * 0.3) continue;
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    const horizontal = Math.min(2.2, w / h);
    const score = area * (lsum / area) * (0.7 + 0.3 * horizontal);
    if (!best || score > best.score) best = { x0, y0, x1, y1, area, score };
  }

  let surfaceBox = { x: 0.24, y: 0.6, w: 0.52, h: 0.3 };
  let surface: PhotoAnalysis["surface"] = "unknown";
  if (best) {
    const pad = 0.5;
    surfaceBox = {
      x: Math.max(0, (best.x0 - pad) / COLS),
      y: Math.max(0, (best.y0 - pad) / rows),
      w: Math.min(1, (best.x1 - best.x0 + 1 + pad) / COLS),
      h: Math.min(1, (best.y1 - best.y0 + 1 + pad) / rows),
    };
    const touchesBottom = surfaceBox.y + surfaceBox.h > 0.96;
    surface = touchesBottom && surfaceBox.w > 0.55 ? "floor" : surfaceBox.h / Math.max(0.01, surfaceBox.w) < 0.85 ? "table" : "floor";
  }

  // Wall spot: flattest mid-lit cell in the upper half, biased to the horizontal centre.
  let wallSpot = { x: 0.5, y: 0.3 };
  let wbest = -Infinity;
  for (let r = Math.floor(rows * 0.12); r < Math.floor(rows * 0.55); r++) for (let col = 2; col < COLS - 2; col++) {
    const i = r * COLS + col;
    if (lum[i] < 0.25 || lum[i] > 0.92) continue;
    const flat = 1 - Math.min(1, vari[i] / 0.01);
    const centre = 1 - Math.abs(col / COLS - 0.5);
    const s = flat * 2 + centre;
    if (s > wbest) { wbest = s; wallSpot = { x: (col + 0.5) / COLS, y: (r + 0.5) / rows }; }
  }

  return { ambient, surface, surfaceBox, wallSpot, ceilingM: ceilingFromAspect(aspect), aspect };
}
