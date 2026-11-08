"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { TransitionLink } from "@/components/brand/TransitionLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { getStudio } from "@/lib/data";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useLang, useTx } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { NewProjectDialog } from "./NewProjectDialog";
import { NotificationsPanel } from "./NotificationsPanel";
import { ProjectCard } from "./ProjectCard";
import { ProjectDetail } from "./ProjectDetail";
import { StudioSkeleton } from "./StudioSkeleton";
import { StudioSwitcher } from "./StudioSwitcher";
import { firstName, greeting } from "./labels";
import { isKamchiEvent, useNewEvents } from "./useNewEvents";

export interface StudioAppProps {
  /** Inside the live split screen: list ↔ detail is component state, headings start at h3. */
  embedded?: boolean;
  /** Standalone: the route's project. Embedded: the project the host wants open (the autopilot's board). */
  projectId?: string;
  /** Embedded only: rendered above the list (the autopilot's stage cards). */
  slot?: ReactNode;
}

/**
 * הסטודיו — the designer's side. A quiet greeting, the studio switcher, project boards,
 * and everything the desk sends back, lit the moment it arrives.
 */
export function StudioApp({ embedded = false, projectId, slot }: StudioAppProps) {
  const t = useTx();
  const lang = useLang();
  const hydrated = useHydrated();
  const studioId = useStore((s) => s.currentStudioId);
  const projects = useStore((s) => s.projects);
  const [sel, setSel] = useState<string | null>(projectId ?? null);
  const [newOpen, setNewOpen] = useState(false);
  const [hour, setHour] = useState<number | null>(null);
  const { fresh, tick } = useNewEvents(isKamchiEvent);

  useEffect(() => { setSel(projectId ?? null); }, [projectId]);
  useEffect(() => { setHour(new Date().getHours()); }, []);

  const studio = getStudio(studioId);
  const mine = useMemo(() => projects.filter((p) => p.studioId === studioId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [projects, studioId]);
  const selected = sel ? projects.find((p) => p.id === sel) : undefined;
  const flashProjectIds = useMemo(() => new Set(fresh.map((e) => e.projectId ?? "")), [fresh]);

  if (!hydrated) return <StudioSkeleton embedded={embedded} detail={!!projectId} />;

  /* ── standalone detail route with an unknown id ── */
  if (sel && !selected) {
    return (
      <div className={embedded ? "grid gap-4 px-4 py-8 text-center" : "container-x grid gap-4 py-24 text-center"}>
        <p className="font-display text-3xl text-paper">{t({ he: "הפרויקט לא נמצא", en: "Project not found" })}</p>
        <p className="text-sm text-muted">{t({ he: "ייתכן שהדמו אופס או שהפרויקט נמחק.", en: "The demo may have been reset, or the project removed." })}</p>
        <div>
          {embedded ? (
            <button type="button" className="btn btn-sm" onClick={() => setSel(null)}>{t({ he: "כל הפרויקטים", en: "All projects" })}</button>
          ) : (
            <TransitionLink href="/studio" className="btn btn-sm">{t({ he: "כל הפרויקטים", en: "All projects" })}</TransitionLink>
          )}
        </div>
      </div>
    );
  }

  if (selected) {
    return <ProjectDetail project={selected} embedded={embedded} onBack={embedded ? () => setSel(null) : undefined} fresh={fresh} flashTick={tick} />;
  }

  const contact = studio ? (lang === "he" ? studio.contact.name : studio.contact.nameEn) : "";
  const hello = hour === null ? t({ he: "שלום", en: "Hello" }) : greeting(lang, hour);

  const newButton = (
    <button type="button" className={`btn ${embedded ? "btn-sm" : "btn-brass"}`} onClick={() => setNewOpen(true)} data-autopilot="new-project">
      {t({ he: "פרויקט חדש", en: "New project" })}
    </button>
  );

  const list = (
    <>
      {mine.length === 0 ? (
        <div className="border hairline px-5 py-12 text-center">
          <p className="font-display text-2xl text-paper">{t({ he: "עדיין אין לוחות", en: "No boards yet" })}</p>
          <p className="mt-2 text-sm text-muted">{t({ he: "פתחו פרויקט ראשון, הוסיפו חדר וגופי תאורה, ובקשו הצעת מחיר.", en: "Open a first project, add a room and fixtures, then ask for a quote." })}</p>
          <div className="mt-5">{newButton}</div>
        </div>
      ) : (
        <ul className={`grid gap-4 ${embedded ? "@xl:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3"}`} aria-label={t({ he: "לוחות הפרויקטים", en: "Project boards" })}>
          {mine.map((p) => (
            <li key={`${p.id}-${flashProjectIds.has(p.id) ? tick : 0}`}>
              {embedded ? (
                <ProjectCard project={p} onOpen={() => setSel(p.id)} flash={flashProjectIds.has(p.id)} />
              ) : (
                <ProjectCard project={p} href={`/studio/${p.id}`} flash={flashProjectIds.has(p.id)} />
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );

  const updates = (
    <div className={`border hairline ${fresh.length ? "flash-warm" : ""}`} key={`n-${fresh.length ? tick : 0}`}>
      <NotificationsPanel flashIds={new Set(fresh.map((e) => e.id))} embedded limit={embedded ? 5 : 10} />
    </div>
  );

  if (embedded) {
    return (
      <div className="grid gap-5 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StudioSwitcher compact />
          {newButton}
        </div>
        {slot}
        <section className="grid gap-3" aria-labelledby="studio-boards">
          <div className="flex items-baseline justify-between gap-3">
            <h3 id="studio-boards" className="eyebrow">{t({ he: "לוחות הפרויקטים", en: "Project boards" })}</h3>
            <span className="num text-xs text-muted" dir="ltr">{mine.length}</span>
          </div>
          {list}
        </section>
        <section className="grid gap-3" aria-labelledby="studio-updates">
          <h3 id="studio-updates" className="eyebrow">{t({ he: "עדכונים משולחן הפרויקטים", en: "Updates from the project desk" })}</h3>
          {updates}
        </section>
        <NewProjectDialog open={newOpen} onClose={() => setNewOpen(false)} onCreated={(id) => setSel(id)} />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={t({ he: "הסטודיו · מועדון האדריכלים והמעצבים", en: "The studio · architects & designers club" })}
        title={
          <>
            {hello}
            {contact && <>, {firstName(contact)}</>}
          </>
        }
        lede={t({
          he: "הלוחות שלכם, זמני האספקה העדכניים והצעות המחיר — במקום אחד. כל מה שצוות קמחי עושה מופיע כאן ברגע שהוא קורה.",
          en: "Your boards, current lead times and quotes in one place. Whatever the Kamchi team does shows up here the moment it happens.",
        })}
        actions={
          <>
            <StudioSwitcher />
            {newButton}
          </>
        }
      />
      <div className="container-x grid gap-12 pb-20 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
        <section className="grid gap-5 content-start" aria-labelledby="studio-boards">
          <div className="flex items-baseline justify-between gap-3 border-b hairline pb-3">
            <h2 id="studio-boards" className="eyebrow">{t({ he: "לוחות הפרויקטים", en: "Project boards" })}</h2>
            <span className="num text-xs text-muted" dir="ltr">{mine.length}</span>
          </div>
          {list}
        </section>
        <aside className="grid gap-5 content-start" aria-labelledby="studio-updates">
          <div className="flex items-baseline justify-between gap-3 border-b hairline pb-3">
            <h2 id="studio-updates" className="eyebrow">{t({ he: "עדכונים משולחן הפרויקטים", en: "Updates from the project desk" })}</h2>
            <TransitionLink href="/live" className="text-xs text-muted hover:text-glow">{t({ he: "מצב חי", en: "Live" })}</TransitionLink>
          </div>
          {updates}
        </aside>
      </div>
      <NewProjectDialog open={newOpen} onClose={() => setNewOpen(false)} onCreated={() => undefined} />
    </>
  );
}
