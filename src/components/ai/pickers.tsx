"use client";
import { useMemo, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { STUDIOS } from "@/lib/data";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useLang, useTx } from "@/lib/i18n";
import { useStore } from "@/lib/store";

/** Choose a studio of the designers' club (demo list). */
export function StudioDialog({ open, onClose, title, cta, onPick }: { open: boolean; onClose: () => void; title: string; cta: string; onPick: (studioId: string) => void }) {
  const t = useTx();
  const lang = useLang();
  const current = useStore((s) => s.currentStudioId);
  const [studio, setStudio] = useState(current);
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <p className="mb-4 text-sm text-muted">{t({ he: "בחרו סטודיו מהמועדון. בדמו, השליחה נרשמת ביומן האירועים ומופיעה אצל צוות קמחי.", en: "Choose a studio from the club. In the demo the hand-off is logged and shows up on the Kamchi desk." })}</p>
      <ul className="grid gap-px border hairline bg-ash/40 sm:grid-cols-2">
        {STUDIOS.map((s) => (
          <li key={s.id} className="bg-charcoal">
            <button type="button" aria-pressed={studio === s.id} onClick={() => setStudio(s.id)} className={`flex w-full flex-col items-start gap-0.5 px-4 py-3 text-start transition-colors ${studio === s.id ? "text-glow" : "hover:bg-night/40"}`}>
              <span className="text-sm">{lang === "he" ? s.name : s.nameEn}</span>
              <span className="font-mono text-[0.66rem] tracking-wider text-muted">{lang === "he" ? s.city : s.cityEn} · {s.tier}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button type="button" className="btn btn-sm" onClick={onClose}>{t({ he: "ביטול", en: "Cancel" })}</button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => { onPick(studio); onClose(); }}>{cta}</button>
      </div>
    </Dialog>
  );
}

/** Choose a project (and optionally a room) from the current studio. */
export function ProjectRoomDialog({ open, onClose, title, cta, needRoom = true, onPick }: { open: boolean; onClose: () => void; title: string; cta: string; needRoom?: boolean; onPick: (projectId: string, roomId?: string) => void }) {
  const t = useTx();
  const lang = useLang();
  const hydrated = useHydrated();
  const projects = useStore((s) => s.projects);
  const current = useStore((s) => s.currentStudioId);
  const mine = useMemo(() => {
    const own = projects.filter((p) => p.studioId === current);
    return own.length ? own : projects;
  }, [projects, current]);
  const [projectId, setProjectId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const project = mine.find((p) => p.id === projectId) ?? mine[0];
  const room = project?.rooms.find((r) => r.id === roomId) ?? project?.rooms[0];
  const ok = !!project && (!needRoom || !!room);

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      {!hydrated ? (
        <div className="space-y-2"><div className="skeleton h-10" /><div className="skeleton h-10" /><div className="skeleton h-10" /></div>
      ) : (
        <div className="space-y-5">
          <div>
            <p className="eyebrow mb-2">{t({ he: "פרויקט", en: "Project" })}</p>
            <ul className="grid gap-px border hairline bg-ash/40">
              {mine.map((p) => (
                <li key={p.id} className="bg-charcoal">
                  <button type="button" aria-pressed={project?.id === p.id} onClick={() => { setProjectId(p.id); setRoomId(""); }} className={`flex w-full items-baseline justify-between gap-3 px-4 py-2.5 text-start ${project?.id === p.id ? "text-glow" : "hover:bg-night/40"}`}>
                    <span className="text-sm">{lang === "he" ? p.name : p.nameEn}</span>
                    <span className="font-mono text-[0.66rem] tracking-wider text-muted">{p.rooms.length} {t({ he: "חדרים", en: "rooms" })}</span>
                  </button>
                </li>
              ))}
              {!mine.length && <li className="bg-charcoal p-4 text-sm text-muted">{t({ he: "אין פרויקטים בסטודיו הזה עדיין.", en: "No projects in this studio yet." })}</li>}
            </ul>
          </div>
          {needRoom && project && (
            <div>
              <p className="eyebrow mb-2">{t({ he: "חדר", en: "Room" })}</p>
              <div className="flex flex-wrap gap-1.5" role="group">
                {project.rooms.map((r) => (
                  <button key={r.id} type="button" className="chip" aria-pressed={room?.id === r.id} onClick={() => setRoomId(r.id)}>
                    {lang === "he" ? r.name : r.nameEn} <span className="font-mono" dir="ltr">{r.areaM2} m²</span>
                  </button>
                ))}
                {!project.rooms.length && <span className="text-sm text-muted">{t({ he: "לפרויקט אין חדרים.", en: "This project has no rooms." })}</span>}
              </div>
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="btn btn-sm" onClick={onClose}>{t({ he: "ביטול", en: "Cancel" })}</button>
            <button type="button" className="btn btn-primary btn-sm" disabled={!ok} onClick={() => { if (project) onPick(project.id, room?.id); onClose(); }}>{cta}</button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
