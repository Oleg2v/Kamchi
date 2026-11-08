"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useTrapTab } from "./useTrapTab";
import { useLang, useTx } from "@/lib/i18n";
import { FIXTURE_TYPE_LABEL, SPACE_LABEL } from "@/lib/i18n/common";
import { useStore } from "@/lib/store";
import type { Fixture } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  fixture: Fixture;
  qty: number;
  onDone: (msg: { projectName: string; roomName: string; projectId: string }) => void;
};

const NEW = "__new__";

/**
 * "הוספה ללוח פרויקט": choose project → room → addItemToRoom. With no projects
 * in the store, the dialog offers to create one (createProject + addRoom) first.
 */
export function AddToBoardDialog({ open, onClose, fixture, qty, onDone }: Props) {
  const t = useTx();
  const lang = useLang();
  const pn = (p: { name: string; nameEn: string }) => (lang === "he" ? p.name : p.nameEn || p.name);
  const studioId = useStore((s) => s.currentStudioId);
  const allProjects = useStore((s) => s.projects);
  const createProject = useStore((s) => s.createProject);
  const addRoom = useStore((s) => s.addRoom);
  const addItemToRoom = useStore((s) => s.addItemToRoom);

  const projects = useMemo(() => {
    const mine = allProjects.filter((p) => p.studioId === studioId);
    return mine.length ? mine : allProjects;
  }, [allProjects, studioId]);

  const [projectId, setProjectId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [newProject, setNewProject] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useTrapTab(formRef, open);

  // Reset to a sensible first choice every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    const first = projects[0];
    setProjectId(first ? first.id : NEW);
    setRoomId(first?.rooms[0]?.id ?? NEW);
    setNewProject("");
    setNewRoom(t(SPACE_LABEL[fixture.spaces[0] ?? "living"]));
    setError(null);
  }, [open, projects, fixture.spaces, t]);

  const project = projects.find((p) => p.id === projectId);
  const isNewProject = projectId === NEW;
  const isNewRoom = isNewProject || roomId === NEW;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    let pid = projectId;
    let pname = project ? pn(project) : "";
    if (isNewProject) {
      const name = newProject.trim();
      if (!name) { setError(t({ he: "איך קוראים לפרויקט?", en: "Name the project." })); return; }
      const p = createProject({ name, studioId });
      pid = p.id; pname = pn(p);
    }
    let rid = roomId;
    const chosenRoom = project?.rooms.find((r) => r.id === roomId);
    let rname = chosenRoom ? pn(chosenRoom) : "";
    if (isNewRoom) {
      const name = newRoom.trim();
      if (!name) { setError(t({ he: "איך קוראים לחדר?", en: "Name the room." })); return; }
      const room = addRoom(pid, { name, nameEn: name, areaM2: 20, targetLux: 150 });
      if (!room) { setError(t({ he: "לא הצלחנו להוסיף חדר.", en: "Could not add a room." })); return; }
      rid = room.id; rname = pn(room);
    }
    addItemToRoom(pid, rid, fixture.id, qty);
    onDone({ projectName: pname, roomName: rname, projectId: pid });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={t({ he: "הוספה ללוח פרויקט", en: "Add to a project board" })}>
      <form ref={formRef} onSubmit={submit} className="flex flex-col gap-6" data-testid="board-form">
        <p className="text-sm text-muted">
          <span lang="en" className="text-paper">{fixture.name}</span> · {lang === "he" ? fixture.nameHe : t(FIXTURE_TYPE_LABEL[fixture.type])} · <span className="num">×{qty}</span>
        </p>

        <fieldset className="m-0 border-0 p-0">
          <legend className="eyebrow mb-3">{t({ he: "פרויקט", en: "Project" })}</legend>
          {projects.length === 0 && (
            <p className="mb-3 text-sm text-muted">{t({ he: "אין עדיין פרויקטים בסטודיו. נפתח אחד עכשיו.", en: "No projects in the studio yet. Let’s open one." })}</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {projects.map((p) => (
              <button key={p.id} type="button" className="chip" aria-pressed={projectId === p.id} onClick={() => { setProjectId(p.id); setRoomId(p.rooms[0]?.id ?? NEW); }}>
                {pn(p)}
              </button>
            ))}
            <button type="button" className="chip" aria-pressed={isNewProject} onClick={() => { setProjectId(NEW); setRoomId(NEW); }}>
              + {t({ he: "פרויקט חדש", en: "New project" })}
            </button>
          </div>
          {isNewProject && (
            <label className="mt-3 block text-sm">
              <span className="sr-only">{t({ he: "שם הפרויקט", en: "Project name" })}</span>
              <input className="field" value={newProject} onChange={(e) => setNewProject(e.target.value)} placeholder={t({ he: "למשל: דירה ברמת אביב", en: "e.g. Ramat Aviv apartment" })} autoFocus data-testid="new-project-name" />
            </label>
          )}
        </fieldset>

        <fieldset className="m-0 border-0 p-0">
          <legend className="eyebrow mb-3">{t({ he: "חדר", en: "Room" })}</legend>
          <div className="flex flex-wrap gap-1.5">
            {!isNewProject && project?.rooms.map((r) => (
              <button key={r.id} type="button" className="chip" aria-pressed={roomId === r.id} onClick={() => setRoomId(r.id)}>{pn(r)}</button>
            ))}
            <button type="button" className="chip" aria-pressed={isNewRoom} onClick={() => setRoomId(NEW)} disabled={isNewProject}>
              + {t({ he: "חדר חדש", en: "New room" })}
            </button>
          </div>
          {isNewRoom && (
            <label className="mt-3 block text-sm">
              <span className="sr-only">{t({ he: "שם החדר", en: "Room name" })}</span>
              <input className="field" value={newRoom} onChange={(e) => setNewRoom(e.target.value)} placeholder={t({ he: "למשל: סלון", en: "e.g. Living room" })} data-testid="new-room-name" />
            </label>
          )}
        </fieldset>

        {error && <p role="alert" className="text-sm text-brass-light">{error}</p>}

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn">{t({ he: "ביטול", en: "Cancel" })}</button>
          <button type="submit" className="btn btn-primary" data-testid="board-submit">{t({ he: "הוספה ללוח", en: "Add to board" })}</button>
        </div>
      </form>
    </Dialog>
  );
}
