"use client";
import { useCallback } from "react";
import { useStore } from "../store";
import type { Lang } from "../types";

export type Bi = { he: string; en: string };

/** Pick the string for a language. Server-safe (no hooks). */
export function tx(lang: Lang, s: Bi | string): string {
  if (typeof s === "string") return s;
  return lang === "he" ? s.he : s.en;
}

export function dirOf(lang: Lang): "rtl" | "ltr" {
  return lang === "he" ? "rtl" : "ltr";
}

/** Current language from the shared store. */
export function useLang(): Lang {
  return useStore((s) => s.lang);
}

/** `t({he, en})` bound to the current language. */
export function useTx(): (s: Bi | string) => string {
  const lang = useLang();
  return useCallback((s: Bi | string) => tx(lang, s), [lang]);
}

/** Hebrew-first number formatting: ₪ with thousands separators, no decimals. */
export function formatIls(n: number, lang: Lang = "he"): string {
  const s = new Intl.NumberFormat(lang === "he" ? "he-IL" : "en-IL", {
    maximumFractionDigits: 0,
  }).format(n);
  return lang === "he" ? `₪${s}` : `₪${s}`;
}

export function formatNumber(n: number, lang: Lang = "he"): string {
  return new Intl.NumberFormat(lang === "he" ? "he-IL" : "en-IL", { maximumFractionDigits: 0 }).format(n);
}

export function formatDate(iso: string, lang: Lang = "he"): string {
  return new Intl.DateTimeFormat(lang === "he" ? "he-IL" : "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export function formatTime(iso: string, lang: Lang = "he"): string {
  return new Intl.DateTimeFormat(lang === "he" ? "he-IL" : "en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
