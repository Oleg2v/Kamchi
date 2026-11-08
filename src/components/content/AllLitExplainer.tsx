"use client";
import { useEffect, useRef } from "react";
import { tx, useTx } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { Lang } from "@/lib/types";

/**
 * Toggling allLit remounts the app subtree under <body> (shell behaviour, see the module report),
 * which drops keyboard focus. The flag lives at module scope so the re-created button can take focus back.
 */
let refocusAfterToggle: string | null = null;

/** A small explainer for "הכול דלוק" with a button that toggles it (store.setAllLit). */
export function AllLitExplainer({ lang }: { lang?: Lang }) {
  const t0 = useTx();
  const allLit = useStore((s) => s.allLit);
  const setAllLit = useStore((s) => s.setAllLit);
  const t = lang ? (s: { he: string; en: string }) => tx(lang, s) : t0;
  const btn = useRef<HTMLButtonElement>(null);
  const id = `all-lit-toggle-${lang ?? "ui"}`;
  useEffect(() => {
    if (refocusAfterToggle === id && btn.current) {
      refocusAfterToggle = null;
      btn.current.focus({ preventScroll: true });
    }
  }, [allLit, id]);
  return (
    <div className="panel mt-6 grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-6">
      <div>
        <p className="font-display text-2xl leading-tight">{t({ he: "\"הכול דלוק\"", en: "“All lit”" })}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {t({
            he: "באתר הזה כל אלמנט מתחיל כבוי ונדלק בגלילה, במעבר עכבר או בפוקוס. מי שמעדיף לראות הכול מיד — בלי לחכות לאנימציות ובלי לרחף מעל אלמנטים — מדליק את הכול בלחיצה אחת. המצב נשמר בדפדפן ומסנכרן בין הכרטיסיות.",
            en: "On this site every element starts off and switches on by scrolling, hovering or focusing. If you prefer to see everything at once, without waiting for animations or hovering over elements, light it all with one press. The setting is kept in this browser and synced across tabs.",
          })}
        </p>
      </div>
      <button
        ref={btn}
        type="button"
        aria-pressed={allLit}
        onClick={() => { refocusAfterToggle = id; setAllLit(!allLit); }}
        className={`btn ${allLit ? "border-glow text-glow shadow-glow" : ""}`}
        data-testid="all-lit-toggle"
      >
        <span aria-hidden className={`h-2 w-2 rounded-full ${allLit ? "bg-glow" : "bg-ash"}`} />
        {allLit ? t({ he: "הכול דלוק — לכבות", en: "All lit — switch off" }) : t({ he: "להדליק הכול", en: "Light everything" })}
      </button>
    </div>
  );
}
