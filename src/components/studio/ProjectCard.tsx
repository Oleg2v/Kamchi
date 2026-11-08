"use client";
import type { ReactNode } from "react";
import { TransitionLink } from "@/components/brand/TransitionLink";
import { useLang, useTx } from "@/lib/i18n";
import type { Project } from "@/lib/types";
import { StatusChip } from "./StatusChip";
import { countFixtures, relativeTime } from "./labels";

/** A project board at a glance. A link in the standalone studio, a button when embedded. */
export function ProjectCard({ project, href, onOpen, flash = false }: { project: Project; href?: string; onOpen?: () => void; flash?: boolean }) {
  const t = useTx();
  const lang = useLang();
  const body: ReactNode = (
    <>
      <div className="flex items-start justify-between gap-3">
        <StatusChip status={project.status} />
        <span className="num text-[0.7rem] text-muted">{relativeTime(project.updatedAt, lang)}</span>
      </div>
      <h3 className="lit-card__title mt-4 font-display text-2xl leading-tight text-paper md:text-3xl">{lang === "he" ? project.name : project.nameEn}</h3>
      <p className="mt-1.5 truncate text-sm text-muted">
        {project.client || "—"}
        {project.address && <span> · {project.address}</span>}
      </p>
      <p className="num mt-5 text-xs text-muted" dir={lang === "he" ? "rtl" : "ltr"}>
        <span dir="ltr">{project.rooms.length}</span> {t({ he: "חדרים", en: "rooms" })} · <span dir="ltr">{countFixtures(project)}</span> {t({ he: "גופי תאורה", en: "fixtures" })}
      </p>
    </>
  );
  const cls = `lit-card block w-full border hairline bg-night p-5 text-start ${flash ? "flash-warm" : ""}`;
  return href ? (
    <TransitionLink href={href} className={cls} data-autopilot={`project-card:${project.id}`}>{body}</TransitionLink>
  ) : (
    <button type="button" onClick={onOpen} className={cls} data-autopilot={`project-card:${project.id}`}>{body}</button>
  );
}
