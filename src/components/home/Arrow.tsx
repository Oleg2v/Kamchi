"use client";
import { useLang } from "@/lib/i18n";

/** A "forward" arrow that follows the reading direction: ← in Hebrew, → in English. */
export function Arrow({ className = "" }: { className?: string }) {
  const lang = useLang();
  return (
    <span aria-hidden className={className}>
      {lang === "he" ? "←" : "→"}
    </span>
  );
}
