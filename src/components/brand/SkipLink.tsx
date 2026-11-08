"use client";
import { useTx } from "@/lib/i18n";
export function SkipLink() {
  const t = useTx();
  return (
    <a href="#main" className="skip-link">
      {t({ he: "דלגו לתוכן הראשי", en: "Skip to main content" })}
    </a>
  );
}
