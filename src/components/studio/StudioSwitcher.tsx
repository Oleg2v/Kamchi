"use client";
import { STUDIOS, getStudio } from "@/lib/data";
import { useLang, useTx } from "@/lib/i18n";
import { useStore } from "@/lib/store";

/** Who am I: one of the six club studios. Tier and discount in mono, next to the name. */
export function StudioSwitcher({ compact = false }: { compact?: boolean }) {
  const t = useTx();
  const lang = useLang();
  const studioId = useStore((s) => s.currentStudioId);
  const setCurrentStudio = useStore((s) => s.setCurrentStudio);
  const discount = useStore((s) => s.studioDiscounts[studioId]);
  const studio = getStudio(studioId);
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 ${compact ? "text-xs" : "text-sm"}`}>
      <label className="flex items-center gap-2">
        <span className="text-muted">{t({ he: "מחובר/ת כ־", en: "Signed in as" })}</span>
        <select
          className={`field w-auto ${compact ? "min-h-8 py-1 text-xs" : ""}`}
          value={studioId}
          onChange={(e) => setCurrentStudio(e.target.value)}
          aria-label={t({ he: "בחירת סטודיו", en: "Choose studio" })}
          data-autopilot="studio-switcher"
        >
          {STUDIOS.map((s) => (
            <option key={s.id} value={s.id}>{lang === "he" ? s.name : s.nameEn}</option>
          ))}
        </select>
      </label>
      {studio && (
        <span className="font-mono text-[0.7rem] tracking-wider text-brass-light" dir="ltr" title={t({ he: "דרגת מועדון והנחה", en: "Club tier and discount" })}>
          {t({ he: "דרגה", en: "Tier" })} {studio.tier} · {discount ?? studio.discountPct}% · {lang === "he" ? studio.city : studio.cityEn}
        </span>
      )}
    </div>
  );
}
