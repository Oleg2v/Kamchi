import { getBrand, getFixture } from "@/lib/data";
import { formatDate, tx } from "@/lib/i18n";
import { LEAD_TIME_LABEL } from "@/lib/i18n/common";
import type { Lang, LeadTime, Project } from "@/lib/types";

/** "במלאי בבני ברק" for stock, otherwise "Artemide: 6–8 שבועות". */
export function leadTimeText(lt: LeadTime, brandId: string | undefined, lang: Lang): string {
  if (lt === "stock") return tx(lang, LEAD_TIME_LABEL.stock);
  const brand = brandId ? getBrand(brandId)?.name : undefined;
  return brand ? `${brand}: ${tx(lang, LEAD_TIME_LABEL[lt])}` : tx(lang, LEAD_TIME_LABEL[lt]);
}

export const countFixtures = (p: Project) => p.rooms.reduce((n, r) => n + r.items.reduce((m, i) => m + i.qty, 0), 0);
export const countItems = (p: Project) => p.rooms.reduce((n, r) => n + r.items.length, 0);
export const listValue = (p: Project) => p.rooms.reduce((n, r) => n + r.items.reduce((m, i) => m + (getFixture(i.fixtureId)?.price ?? 0) * i.qty, 0), 0);

/** "לפני 5 דקות" / "לפני שעתיים" / a short date for anything older than a week. */
export function relativeTime(iso: string, lang: Lang, now = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  const rtf = new Intl.RelativeTimeFormat(lang === "he" ? "he-IL" : "en-GB", { numeric: "auto" });
  if (min < 1) return lang === "he" ? "ממש עכשיו" : "just now";
  if (min < 60) return rtf.format(-min, "minute");
  const hrs = Math.round(min / 60);
  if (hrs < 24) return rtf.format(-hrs, "hour");
  const days = Math.round(hrs / 24);
  if (days < 7) return rtf.format(-days, "day");
  return formatDate(iso, lang);
}

export const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? full;

export function greeting(lang: Lang, hour: number): string {
  if (lang === "he") return hour < 5 ? "לילה טוב" : hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : hour < 21 ? "ערב טוב" : "לילה טוב";
  return hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Good night";
}
