import type { Fixture, RelightPlacement } from "../types";

/* ─────────────────────────────────────────────────────────────
   Relight geometry (isomorphic). The client feeds it a real photo
   analysis; the server feeds it a neutral template when it cannot
   see pixels. Either way the fixture lands where its type belongs.
   ───────────────────────────────────────────────────────────── */

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export interface PhotoAnalysis {
  /** Mean luminance 0..1 of the whole photo. */
  ambient: number;
  surface: RelightPlacement["surface"];
  surfaceBox: { x: number; y: number; w: number; h: number };
  /** A flat, moderately lit patch of wall in the upper half (for sconces / washes). */
  wallSpot: { x: number; y: number };
  ceilingM: number;
  aspect: number;
}

export function ceilingFromAspect(aspect: number): number {
  if (aspect >= 1.45) return 2.6;
  if (aspect >= 1.25) return 2.7;
  if (aspect >= 1) return 2.8;
  return 3.0;
}

/** What the server assumes when it cannot see the photo: a table-height surface, centre-low. */
export function defaultAnalysis(aspect = 1.5): PhotoAnalysis {
  return {
    ambient: 0.55,
    surface: "table",
    surfaceBox: { x: 0.24, y: 0.6, w: 0.52, h: 0.3 },
    wallSpot: { x: 0.5, y: 0.3 },
    ceilingM: ceilingFromAspect(aspect),
    aspect,
  };
}

/** Where, inside the 200×260 art box, the base of a standing fixture sits (fraction of box height). */
export function baseFrac(f: Fixture): number {
  const a = f.art;
  switch (a.kind) {
    case "stem": case "arc": case "bollard": return 230 / 260;
    case "lantern": return 220 / 260;
    case "globe": { const w = clamp(a.width, 0.1, 1) * 150, h = clamp(a.height, 0.1, 1) * 120; const r = Math.min(w, h) / 2 + 8; return (24 + 2 * r) / 260; }
    default: return 0.9;
  }
}

/** Where, inside the art box, the optical centre sits (fractions of box width/height). */
export function opticalFrac(f: Fixture, suspension: boolean): { x: number; y: number } {
  const a = f.art;
  const w = clamp(a.width, 0.1, 1) * 150;
  const h = clamp(a.height, 0.1, 1) * 120;
  const headY = suspension ? 10 + clamp(a.drop, 0, 1) * 90 : 24;
  switch (a.kind) {
    case "dome": case "cone": case "cylinder": return { x: 0.5, y: (headY + h) / 260 };
    case "disc": return { x: 0.5, y: (headY + Math.max(5, h * 0.12)) / 260 };
    case "ring": return { x: 0.5, y: (headY + (w / 2) * 0.28 + 4) / 260 };
    case "globe": { const r = Math.min(w, h) / 2 + 8; return { x: 0.5, y: (headY + r) / 260 }; }
    case "cluster": return { x: 0.5, y: (headY + 18 + (h + 20) / 2) / 260 };
    case "cascade": return { x: 0.5, y: (10 + h * 0.55) / 260 };
    case "bar": return { x: 0.5, y: (headY + Math.max(6, h * 0.12)) / 260 };
    case "arc": return { x: (100 + w * 0.4) / 200, y: (60 + (1 - a.height) * 40) / 260 };
    case "stem": return { x: 0.5, y: (230 - (60 + a.height * 120)) / 260 };
    case "sconce": return { x: 0.5, y: (40 + Math.max(16, h * 0.4) * 0.5) / 260 };
    case "puck": return { x: 0.5, y: 30 / 260 };
    case "trackhead": return { x: 0.5, y: 64 / 260 };
    case "bollard": { const bh = 80 + a.height * 100; return { x: 0.5, y: (230 - bh + bh * 0.25) / 260 }; }
    case "lantern": { const lh = Math.max(40, h * 0.7); return { x: 0.5, y: suspension ? (headY + lh / 2) / 260 : (220 - lh / 2) / 260 }; }
  }
}

export const isHanging = (f: Fixture) => f.type === "pendant" || f.type === "chandelier" || (f.type === "linear" && f.art.kind === "bar");

const SURFACE_HE: Record<RelightPlacement["surface"], string> = {
  table: "השולחן", sofa: "הספה", bed: "המיטה", desk: "שולחן העבודה", floor: "הרצפה", counter: "משטח העבודה", wall: "הקיר", unknown: "המשטח",
};
const SURFACE_EN: Record<RelightPlacement["surface"], string> = {
  table: "the table", sofa: "the sofa", bed: "the bed", desk: "the desk", floor: "the floor", counter: "the counter", wall: "the wall", unknown: "the surface",
};

/** Fixture type + photo analysis → placement. Deterministic. */
export function placementFromAnalysis(a: PhotoAnalysis, f: Fixture): RelightPlacement {
  const box = a.surfaceBox;
  const cx = box.x + box.w / 2;
  const m = a.ceilingM.toFixed(1);
  const sHe = SURFACE_HE[a.surface], sEn = SURFACE_EN[a.surface];
  const base = { surface: a.surface, surfaceBox: box, ceilingM: a.ceilingM, ambient: a.ambient };

  switch (f.type) {
    case "pendant":
    case "chandelier": {
      const ch = f.type === "chandelier";
      const scale = ch ? clamp(0.2 + f.art.width * 0.14, 0.22, 0.36) : clamp(0.1 + f.art.width * 0.1, 0.1, 0.22);
      return {
        ...base,
        anchor: { x: cx, y: clamp(box.y - (ch ? 0.26 : 0.17), 0.08, 0.6) },
        scale,
        pool: { cx, cy: box.y + box.h * 0.42, rx: clamp(box.w * (ch ? 0.6 : 0.5), 0.08, 0.45), ry: clamp(box.h * 0.36, 0.03, 0.22) },
        rationale: {
          he: `${f.nameHe} תלוי מעל ${sHe}, כ־75 ס״מ מהמשטח: האור נופל על ${sHe} ולא מסנוור את היושבים. תקרה מוערכת ${m} מ׳.`,
          en: `${f.name} hangs about 75 cm above ${sEn}: light lands on ${sEn} without glare for the people around it. Estimated ceiling ${m} m.`,
        },
      };
    }
    case "linear":
      return {
        ...base,
        anchor: { x: cx, y: clamp(box.y - 0.15, 0.08, 0.6) },
        scale: clamp(0.3 + f.art.width * 0.1, 0.3, 0.45),
        pool: { cx, cy: box.y + box.h * 0.4, rx: clamp(box.w * 0.58, 0.1, 0.5), ry: clamp(box.h * 0.3, 0.03, 0.2) },
        rationale: {
          he: `פרופיל ליניארי לאורך ${sHe}, בגובה כ־80 ס״מ מהמשטח: אור אחיד לכל האורך בלי נקודות מסנוורות. תקרה מוערכת ${m} מ׳.`,
          en: `A linear profile along ${sEn}, about 80 cm above it: even light along the whole length with no hot spots. Estimated ceiling ${m} m.`,
        },
      };
    case "ceiling":
      return {
        ...base,
        anchor: { x: cx, y: 0.07 },
        scale: clamp(0.12 + f.art.width * 0.08, 0.12, 0.2),
        pool: { cx, cy: box.y + box.h * 0.45, rx: clamp(box.w * 0.65, 0.12, 0.5), ry: clamp(box.h * 0.5, 0.05, 0.25) },
        rationale: {
          he: `${f.nameHe} צמוד לתקרה מעל מרכז החלל: אור כללי רחב ורך, מתאים לתקרה של ${m} מ׳ שבה גוף תלוי היה נמוך מדי.`,
          en: `${f.name} flush to the ceiling over the centre of the room: broad, soft general light — right for a ${m} m ceiling where a pendant would hang too low.`,
        },
      };
    case "recessed":
      return {
        ...base,
        anchor: { x: cx, y: 0.04 },
        scale: 0.06,
        pool: { cx, cy: box.y + box.h * 0.4, rx: clamp(box.w * 0.3, 0.06, 0.3), ry: clamp(box.h * 0.26, 0.03, 0.15) },
        rationale: {
          he: `שקוע תקרה בזווית ${f.art.beam}° מעל ${sHe}: אלומה ממוקדת, תקרה נקייה. בתקרה של ${m} מ׳ נמליץ על מרחק של כ־1.2 מ׳ בין היחידות.`,
          en: `A ${f.art.beam}° recessed downlight over ${sEn}: a focused beam and a clean ceiling. At ${m} m, space the units about 1.2 m apart.`,
        },
      };
    case "track":
      return {
        ...base,
        anchor: { x: 0.5, y: 0.05 },
        scale: 0.44,
        pool: { cx, cy: box.y + box.h * 0.4, rx: clamp(box.w * 0.55, 0.1, 0.45), ry: clamp(box.h * 0.3, 0.03, 0.2) },
        rationale: {
          he: `פס צבירה לאורך התקרה עם ראשים מכוונים אל ${sHe} ואל הקיר: גמישות מלאה כשמזיזים רהיטים. תקרה מוערכת ${m} מ׳.`,
          en: `A ceiling track with heads aimed at ${sEn} and the wall: full flexibility when the furniture moves. Estimated ceiling ${m} m.`,
        },
      };
    case "floor":
    case "outdoor": {
      const right = cx < 0.5;
      const ax = clamp(right ? box.x + box.w + 0.08 : box.x - 0.08, 0.08, 0.92);
      const wash = f.art.shape === "wash" || f.art.shape === "halo" || f.art.shape === "diffuse";
      return {
        ...base,
        surface: "floor",
        anchor: { x: ax, y: f.type === "outdoor" ? 0.62 : 0.4 },
        scale: f.type === "outdoor" ? 0.2 : clamp(0.42 + f.art.width * 0.1, 0.42, 0.56),
        pool: wash ? { cx: ax, cy: 0.3, rx: 0.16, ry: 0.24 } : { cx: ax + (right ? -0.06 : 0.06), cy: 0.9, rx: 0.16, ry: 0.06 },
        rationale: {
          he: wash
            ? `${f.nameHe} עומד ליד ${sHe} ושוטף את הקיר והתקרה באור עקיף: החלל נראה גבוה יותר והאור רך. תקרה מוערכת ${m} מ׳.`
            : `${f.nameHe} עומד ליד ${sHe}, הראש נוטה פנימה: בריכת אור קריאה על הישיבה בלי להאיר את כל החדר.`,
          en: wash
            ? `${f.name} stands next to ${sEn} and washes the wall and ceiling with indirect light: the room reads taller, the light stays soft. Estimated ceiling ${m} m.`
            : `${f.name} stands by ${sEn} with its head turned in: a reading pool on the seating without lighting the whole room.`,
        },
      };
    }
    case "table": {
      const ax = clamp(box.x + box.w * 0.72, 0.1, 0.9);
      const ay = box.y + box.h * 0.12;
      return {
        ...base,
        anchor: { x: ax, y: ay },
        scale: clamp(0.08 + f.art.width * 0.06, 0.08, 0.14),
        pool: { cx: ax, cy: ay + 0.02, rx: 0.09, ry: 0.035 },
        rationale: {
          he: `${f.nameHe} על ${sHe}: אור נמוך ואישי בגובה העיניים, נקודת אור חמה שמחזיקה את הפינה גם כשהשאר כבוי.`,
          en: `${f.name} on ${sEn}: low, personal light at eye level — a warm point that holds the corner when everything else is off.`,
        },
      };
    }
    case "wall":
    default: {
      const ws = a.wallSpot;
      return {
        ...base,
        surface: "wall",
        anchor: ws,
        scale: clamp(0.06 + f.art.width * 0.04, 0.06, 0.11),
        pool: { cx: ws.x, cy: ws.y + 0.12, rx: 0.08, ry: 0.18 },
        rationale: {
          he: `${f.nameHe} על הקיר בגובה כ־1.7 מ׳: שטיפת אור מעלה ומטה שמוסיפה עומק לקיר במקום להאיר את החדר. תקרה מוערכת ${m} מ׳.`,
          en: `${f.name} on the wall at about 1.7 m: an up-and-down wash that gives the wall depth instead of lighting the room. Estimated ceiling ${m} m.`,
        },
      };
    }
  }
}

/** Server-side template when no pixels can be seen. */
export function simulatedPlacement(f: Fixture, aspect?: number): RelightPlacement {
  return placementFromAnalysis(defaultAnalysis(aspect ?? 1.5), f);
}

/** Clamp a model placement into sane bounds so the compositor never draws off-canvas. */
export function clampPlacement(p: RelightPlacement): RelightPlacement {
  const u = (v: number) => clamp(Number.isFinite(v) ? v : 0.5, 0, 1);
  return {
    ...p,
    anchor: { x: u(p.anchor.x), y: u(p.anchor.y) },
    scale: clamp(p.scale, 0.03, 0.6),
    surfaceBox: { x: u(p.surfaceBox.x), y: u(p.surfaceBox.y), w: clamp(p.surfaceBox.w, 0.02, 1), h: clamp(p.surfaceBox.h, 0.02, 1) },
    ceilingM: clamp(p.ceilingM, 2, 6),
    pool: { cx: u(p.pool.cx), cy: u(p.pool.cy), rx: clamp(p.pool.rx, 0.02, 0.8), ry: clamp(p.pool.ry, 0.01, 0.6) },
    ambient: clamp(p.ambient, 0, 1),
  };
}
