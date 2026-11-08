"use client";
import { useMemo, useState } from "react";
import { TransitionLink } from "@/components/brand/TransitionLink";
import { formatIls, useLang, useTx } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { DemoEvent, Project } from "@/lib/types";
import { NewRoomDialog } from "./NewRoomDialog";
import { NotificationsPanel } from "./NotificationsPanel";
import { PlanSummary } from "./PlanSummary";
import { QuoteCard } from "./QuoteCard";
import { QuoteRequestDialog } from "./QuoteRequestDialog";
import { RoomBoard } from "./RoomBoard";
import { StatusChip } from "./StatusChip";
import { countFixtures, countItems, listValue, relativeTime } from "./labels";

type Props = {
  project: Project;
  /** Inside the live pane: smaller headings, a button instead of a link to go back. */
  embedded?: boolean;
  onBack?: () => void;
  /** Events from the desk that arrived just now — the matching cards glow for 1.2 s. */
  fresh?: DemoEvent[];
  flashTick?: number;
};

/**
 * One project as a board of rooms. The quote request is the only thing that leaves the studio;
 * everything that comes back (quotes, order steps) lands on this page, lit.
 */
export function ProjectDetail({ project, embedded = false, onBack, fresh = [], flashTick = 0 }: Props) {
  const t = useTx();
  const lang = useLang();
  const quotes = useStore((s) => s.quotes);
  const requests = useStore((s) => s.quoteRequests);
  const plans = useStore((s) => s.plans);
  const [roomOpen, setRoomOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  const projectQuotes = useMemo(() => quotes.filter((q) => q.projectId === project.id).sort((a, b) => b.sentAt.localeCompare(a.sentAt)), [quotes, project.id]);
  const openRequest = useMemo(() => requests.find((r) => r.projectId === project.id && (r.status === "new" || r.status === "in_progress")), [requests, project.id]);
  const plan = project.aiPlanId ? plans.find((p) => p.id === project.aiPlanId) : undefined;

  const flashQuoteIds = useMemo(() => new Set(fresh.map((e) => (e.payload?.quoteId as string | undefined) ?? "")), [fresh]);
  const flashFixtureIds = useMemo(() => new Set(fresh.filter((e) => e.projectId === project.id && e.fixtureId).map((e) => e.fixtureId as string)), [fresh, project.id]);
  const flashEventIds = useMemo(() => new Set(fresh.map((e) => e.id)), [fresh]);
  const flashProject = fresh.some((e) => e.projectId === project.id);

  const items = countItems(project);
  const Title = embedded ? "h3" : "h1";
  const Sub = embedded ? "h4" : "h2";
  const name = lang === "he" ? project.name : project.nameEn;

  return (
    <article className={embedded ? "grid gap-5 px-4 py-4" : "container-x grid gap-8 pb-20 pt-8 md:pt-12"} aria-labelledby={`project-${project.id}`} data-autopilot={`project:${project.id}`}>
      <header className={`grid gap-4 ${flashProject ? "flash-warm" : ""}`} key={`h-${flashProject ? flashTick : 0}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {onBack ? (
            <button type="button" onClick={onBack} className="text-sm text-muted hover:text-glow" data-autopilot="project-back">
              <span aria-hidden>→ </span>
              {t({ he: "כל הפרויקטים", en: "All projects" })}
            </button>
          ) : (
            <TransitionLink href="/studio" className="text-sm text-muted hover:text-glow">
              <span aria-hidden>→ </span>
              {t({ he: "כל הפרויקטים", en: "All projects" })}
            </TransitionLink>
          )}
          <StatusChip status={project.status} />
        </div>
        <div>
          {!embedded && <p className="eyebrow mb-3">{t({ he: "לוח פרויקט", en: "Project board" })}</p>}
          <Title id={`project-${project.id}`} className={`font-display leading-[1.05] text-paper ${embedded ? "text-3xl" : "text-4xl md:text-6xl"}`}>
            {name}
          </Title>
          <p className={`mt-2 text-muted ${embedded ? "text-sm" : "text-base md:text-lg"}`}>
            {project.client || "—"}
            {project.address && <span> · {project.address}</span>}
          </p>
          <p className="num mt-3 text-xs text-muted">
            <span dir="ltr">{project.rooms.length}</span> {t({ he: "חדרים", en: "rooms" })} · <span dir="ltr">{countFixtures(project)}</span> {t({ he: "גופי תאורה", en: "fixtures" })} · <span dir="ltr">{formatIls(listValue(project), lang)}</span> {t({ he: "לפי מחירון", en: "at list" })} · {t({ he: "עודכן", en: "updated" })} {relativeTime(project.updatedAt, lang)}
          </p>
          {project.coverNote && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{project.coverNote}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-sm" onClick={() => setRoomOpen(true)} data-autopilot="new-room">
            {t({ he: "חדר חדש", en: "New room" })}
          </button>
          {openRequest ? (
            <p role="status" className="inline-flex min-h-9 items-center gap-2.5 border border-brass/60 px-3 text-[0.85rem] text-brass-light" data-autopilot="request-pending">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-glow shadow-glow animate-pulse-dot" />
              {t({ he: "נשלח · ממתין לשולחן הפרויקטים", en: "Sent · waiting on the project desk" })}
              <span className="num text-[0.7rem] text-muted">{relativeTime(openRequest.createdAt, lang)}</span>
            </p>
          ) : (
            <button
              type="button"
              className={`btn btn-sm ${items > 0 ? "btn-brass" : ""}`}
              onClick={() => setRequestOpen(true)}
              disabled={items === 0}
              title={items === 0 ? t({ he: "הוסיפו גוף תאורה אחד לפחות", en: "Add at least one fixture first" }) : undefined}
              data-autopilot="request-quote"
            >
              {t({ he: "בקשת הצעת מחיר לפרויקט", en: "Request a quote for this project" })}
            </button>
          )}
        </div>
      </header>

      {plan && <PlanSummary plan={plan} />}

      {projectQuotes.length > 0 && (
        <section className="grid gap-4" aria-labelledby={`quotes-${project.id}`}>
          <Sub id={`quotes-${project.id}`} className="eyebrow">{t({ he: "הצעות מחיר שהתקבלו", en: "Quotes received" })}</Sub>
          {projectQuotes.map((q) => (
            <QuoteCard key={`${q.id}-${flashQuoteIds.has(q.id) ? flashTick : 0}`} quote={q} project={project} flash={flashQuoteIds.has(q.id)} embedded={embedded} />
          ))}
        </section>
      )}

      <section className="grid gap-4" aria-labelledby={`rooms-${project.id}`}>
        <div className="flex items-baseline justify-between gap-3">
          <Sub id={`rooms-${project.id}`} className="eyebrow">{t({ he: "חדרים", en: "Rooms" })}</Sub>
          <span className="num text-xs text-muted" dir="ltr">{project.rooms.reduce((n, r) => n + r.areaM2, 0)} m²</span>
        </div>
        {project.rooms.length === 0 ? (
          <p className="border hairline px-4 py-8 text-center text-sm text-muted">{t({ he: "עדיין אין חדרים. פתחו חדר ראשון כדי להתחיל לוח.", en: "No rooms yet. Open a first room to start the board." })}</p>
        ) : (
          project.rooms.map((room) => <RoomBoard key={room.id} projectId={project.id} room={room} embedded={embedded} flashFixtureIds={flashFixtureIds} />)
        )}
      </section>

      <section className="grid gap-3" aria-labelledby={`updates-${project.id}`}>
        <Sub id={`updates-${project.id}`} className="eyebrow">{t({ he: "עדכונים משולחן הפרויקטים", en: "Updates from the project desk" })}</Sub>
        <div className={`border hairline ${fresh.length ? "flash-warm" : ""}`} key={`n-${fresh.length ? flashTick : 0}`}>
          <NotificationsPanel flashIds={flashEventIds} embedded limit={embedded ? 5 : 8} />
        </div>
      </section>

      <NewRoomDialog open={roomOpen} onClose={() => setRoomOpen(false)} projectId={project.id} />
      <QuoteRequestDialog open={requestOpen} onClose={() => setRequestOpen(false)} project={project} />
    </article>
  );
}
