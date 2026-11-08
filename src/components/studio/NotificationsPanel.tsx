"use client";
import { useEffect, useMemo } from "react";
import { formatTime, useLang, useTx } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { DemoEvent } from "@/lib/types";
import { relativeTime } from "./labels";

/**
 * What the desk did: kamchi events, unseen first. Marks them seen while in view.
 * `flashIds` are events that arrived just now — they glow for 1.2 s.
 */
export function NotificationsPanel({ flashIds, visible = true, limit = 12, embedded = false }: { flashIds?: Set<string>; visible?: boolean; limit?: number; embedded?: boolean }) {
  const t = useTx();
  const lang = useLang();
  const events = useStore((s) => s.events);
  const projects = useStore((s) => s.projects);
  const markSeen = useStore((s) => s.markSeen);
  const list = useMemo(() => {
    const k = events.filter((e) => e.actor === "kamchi");
    return [...k.filter((e) => !e.seenByDesigner), ...k.filter((e) => e.seenByDesigner)].slice(0, limit);
  }, [events, limit]);
  const unseen = list.filter((e) => !e.seenByDesigner).length;

  useEffect(() => {
    if (!visible || unseen === 0) return;
    const id = setTimeout(() => markSeen("designer"), 2600);
    return () => clearTimeout(id);
  }, [visible, unseen, markSeen]);

  const projectName = (e: DemoEvent) => {
    const p = e.projectId ? projects.find((x) => x.id === e.projectId) : undefined;
    return p ? (lang === "he" ? p.name : p.nameEn) : undefined;
  };

  if (list.length === 0) {
    return <p className={`text-sm text-muted ${embedded ? "px-4 py-4" : ""}`}>{t({ he: "אין עדכונים חדשים. כשצוות קמחי יפעל — תראו את זה כאן.", en: "Nothing new. When the Kamchi team acts, it shows up here." })}</p>;
  }
  return (
    <ol className="divide-y hairline" aria-live="polite" aria-label={t({ he: "עדכונים משולחן הפרויקטים", en: "Updates from the project desk" })}>
      {list.map((e) => {
        const fresh = flashIds?.has(e.id);
        return (
          <li key={e.id} className={`flex gap-3 py-3 ${embedded ? "px-4" : ""} ${fresh ? "flash-warm" : ""}`}>
            <span aria-hidden className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${e.seenByDesigner ? "bg-ash" : "bg-glow shadow-[0_0_10px_rgb(var(--glow-rgb)/0.9)]"}`} />
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${e.seenByDesigner ? "text-muted" : "text-paper"}`}>{t(e.title)}</p>
              <p className="num mt-0.5 text-[0.7rem] text-muted">
                <span dir="ltr">{formatTime(e.ts, lang)}</span> · {relativeTime(e.ts, lang)}
                {projectName(e) && <span> · {projectName(e)}</span>}
              </p>
            </div>
            {!e.seenByDesigner && <span className="sr-only">{t({ he: "חדש", en: "new" })}</span>}
          </li>
        );
      })}
    </ol>
  );
}
