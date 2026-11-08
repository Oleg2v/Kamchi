import { getFixture } from "../data";
import type { Lang, LightingPlan } from "../types";
import { ZONE_LABEL } from "./plan-rules";
import { brandName } from "./validate";

const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

/** UTF-8 CSV with BOM so Excel opens the Hebrew correctly. */
export function planCsv(plan: LightingPlan, lang: Lang): string {
  const head = lang === "he"
    ? ["חדר", "שטח (מ״ר)", "יעד לוקס", "שכבה", "מותג", "גוף תאורה", "מק״ט", "כמות", "מחיר יחידה (₪, הדגמה)", "סה״כ שורה (₪)"]
    : ["Room", "Area (m²)", "Target lux", "Layer", "Brand", "Fixture", "SKU", "Qty", "Unit price (₪, demo)", "Line total (₪)"];
  const rows: string[] = [head.map(cell).join(",")];
  for (const r of plan.rooms) for (const z of r.zones) {
    const f = getFixture(z.fixtureId);
    if (!f) continue;
    rows.push([
      lang === "he" ? r.label.he : r.label.en, r.areaM2, r.targetLux, ZONE_LABEL[z.zone][lang], brandName(f.brand),
      lang === "he" ? f.nameHe : f.name, f.id, z.qty, f.price, z.qty * f.price,
    ].map(cell).join(","));
  }
  rows.push(["", "", "", "", "", "", "", "", lang === "he" ? "סה״כ" : "Total", plan.totalsIls].map(cell).join(","));
  return `﻿${rows.join("\r\n")}`;
}
