import type { Kelvin } from "../types";

/** Warm-white tints used by every glow on the site. 2700K is the brand's "Warm White". */
export const KELVIN_RGB: Record<Kelvin, [number, number, number]> = {
  2700: [255, 217, 168],
  3000: [255, 229, 196],
  4000: [243, 242, 236],
};

export const KELVIN_HEX: Record<Kelvin, string> = {
  2700: "#ffd9a8",
  3000: "#ffe5c4",
  4000: "#f3f2ec",
};

export const KELVINS: Kelvin[] = [2700, 3000, 4000];

export function kelvinRgbString(k: Kelvin): string {
  return KELVIN_RGB[k].join(" ");
}

/** Normalised 0..1 colour for shaders. */
export function kelvinVec3(k: Kelvin): [number, number, number] {
  const [r, g, b] = KELVIN_RGB[k];
  return [r / 255, g / 255, b / 255];
}

/** Approximate blackbody tint for arbitrary kelvin (Tanner Helland), normalised to our 2700K anchor. */
export function blackbodyRgb(kelvin: number): [number, number, number] {
  const t = Math.min(40000, Math.max(1000, kelvin)) / 100;
  let r: number, g: number, b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  const clamp = (v: number) => Math.round(Math.min(255, Math.max(0, v)));
  return [clamp(r), clamp(g), clamp(b)];
}

export function formatKelvin(k: number, lang: "he" | "en" = "he"): string {
  return lang === "he" ? `${k}K` : `${k} K`;
}

/** Warm label for a kelvin value. */
export function kelvinLabel(k: Kelvin, lang: "he" | "en"): string {
  const he: Record<Kelvin, string> = { 2700: "חם מאוד", 3000: "חם", 4000: "ניטרלי" };
  const en: Record<Kelvin, string> = { 2700: "Very warm", 3000: "Warm", 4000: "Neutral" };
  return (lang === "he" ? he : en)[k];
}
