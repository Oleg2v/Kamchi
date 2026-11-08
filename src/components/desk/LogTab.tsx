"use client";
import { useMemo, useState } from "react";
import { relativeTime } from "@/components/studio/labels";
import { formatDate, formatTime, useLang, useTx } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { Actor } from "@/lib/types";
import { ActorChip } from "./ActorChip";

const ACTORS: Actor[] = ["designer", "kamchi", "system", "autopilot"];

/** Everything that happened, newest first, with the actor in words. */
export function LogTab({ limit = 120 }: { limit?: number }) {
  const t = useTx();
  const lang = useLang();
  const events = useStore((s) => s.events);
  const projects = useStore((s) => s.projects);
  const [actor, setActor] = useState<Actor | null>(null);
  const list = useMemo(() => events.filter((e) => !actor || e.actor === actor).slice(0, limit), [events, actor, limit]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label={t({ he: "סינון לפי גורם", en: "Filter by actor" })}>
          <button type="button" className="chip shrink-0" aria-pressed={actor === null} onClick={() => setActor(null)}>{t({ he: "הכול", en: "All" })}</button>
          {ACTORS.map((a) => (
            <button key={a} type="button" className="chip shrink-0" aria-pressed={actor === a} onClick={() => setActor(actor === a ? null : a)}>
              <ActorChip actor={a} className="border-0 p-0" />
            </button>
          ))}
        </div>
        <p className="num text-xs text-muted" dir="ltr">{list.length} / {events.length}</p>
      </div>
      <ol className="divide-y hairline border-y hairline" aria-label={t({ he: "יומן האירועים", en: "Event log" })}>
        {list.map((e) => {
          const p = e.projectId ? projects.find((x) => x.id === e.projectId) : undefined;
          const pname = p ? (lang === "he" ? p.name : p.nameEn) : undefined;
          const showProject = pname && !t(e.title).includes(pname);
          return (
            <li key={e.id} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-1 py-2.5 md:grid-cols-[7.5rem_7rem_minmax(0,1fr)]">
              <p className="num text-[0.7rem] leading-snug text-muted" dir="ltr" title={relativeTime(e.ts, lang)}>
                {formatDate(e.ts, lang)}
                <br />
                {formatTime(e.ts, lang)}
              </p>
              <p className="col-start-2 md:col-start-auto"><ActorChip actor={e.actor} /></p>
              <p className="col-start-2 text-sm text-paper md:col-start-auto">
                {t(e.title)}
                {showProject && <span className="ms-2 text-xs text-muted">{pname}</span>}
              </p>
            </li>
          );
        })}
        {list.length === 0 && <li className="py-8 text-center text-sm text-muted">{t({ he: "היומן ריק.", en: "The log is empty." })}</li>}
      </ol>
    </div>
  );
}
