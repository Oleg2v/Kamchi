import { getBrand, getFixture } from "@/lib/data";
import { formatDate, tx } from "@/lib/i18n";
import { LEAD_TIME_LABEL } from "@/lib/i18n/common";
import type { Fixture, Lang, LeadTime, Project } from "@/lib/types";

/** "במלאי בבני ברק" for stock, otherwise "Artemide: 6–8 שבועות". */
export function leadTimeText(lt: LeadTime, brandId: string | undefined, lang: Lang): string {
  if (lt === "stock") return tx(lang, LEAD_TIME_LABEL.stock);
  const brand = brandId ? getBrand(brandId)?.name : undefined;
  return brand ? `${brand}: ${tx(lang, LEAD_TIME_LABEL[lt])}` : tx(lang, LEAD_TIME_LABEL[lt]);
}

/** The fixture's display name: the Hebrew name in Hebrew, the Latin product name in English. */
export const fixtureName = (f: Pick<Fixture, "name" | "nameHe">, lang: Lang) => (lang === "he" ? f.nameHe : f.name);

/** The small mono identity line under a name: "Artemide · Luce Sospesa" in Hebrew (the Latin name is the spec), the brand alone in English. */
export function brandLine(f: Pick<Fixture, "name" | "brand">, lang: Lang): string {
  const brand = getBrand(f.brand)?.name ?? f.brand;
  return lang === "he" ? `${brand} · ${f.name}` : brand;
}

/** A "back" arrow that points to the inline start: → in Hebrew, ← in English. */
export const backArrow = (lang: Lang) => (lang === "he" ? "→" : "←");

/** A quoted message: plain quotes in Hebrew (the modern Israeli convention), curly in English. */
export const quoted = (s: string, lang: Lang) => (lang === "he" ? `"${s}"` : `“${s}”`);

export const countFixtures = (p: Project) => p.rooms.reduce((n, r) => n + r.items.reduce((m, i) => m + i.qty, 0), 0);
export const countItems = (p: Project) => p.rooms.reduce((n, r) => n + r.items.length, 0);
export const listValue = (p: Project) => p.rooms.reduce((n, r) => n + r.items.reduce((m, i) => m + (getFixture(i.fixtureId)?.price ?? 0) * i.qty, 0), 0);

/**
 * "לפני 5 דקות" / "לפני שעתיים" / "אתמול" / a short date for anything older than a week.
 * Hebrew is written by hand: ICU's Hebrew dual forms come out as "לפני שעתיים (2)".
 */
export function relativeTime(iso: string, lang: Lang, now = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  const hrs = Math.round(min / 60);
  const days = Math.round(hrs / 24);
  if (lang === "he") {
    if (min < 1) return "ממש עכשיו";
    if (min === 1) return "לפני דקה";
    if (min < 60) return `לפני ${min} דקות`;
    if (hrs === 1) return "לפני שעה";
    if (hrs === 2) return "לפני שעתיים";
    if (hrs < 24) return `לפני ${hrs} שעות`;
    if (days === 1) return "אתמול";
    if (days === 2) return "שלשום";
    if (days < 7) return `לפני ${days} ימים`;
    return formatDate(iso, lang);
  }
  const rtf = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });
  if (min < 1) return "just now";
  if (min < 60) return rtf.format(-min, "minute");
  if (hrs < 24) return rtf.format(-hrs, "hour");
  if (days < 7) return rtf.format(-days, "day");
  return formatDate(iso, lang);
}

export const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? full;

export function greeting(lang: Lang, hour: number): string {
  if (lang === "he") return hour < 5 ? "לילה טוב" : hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : hour < 21 ? "ערב טוב" : "לילה טוב";
  return hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Good night";
}
