"use client";
import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useTx } from "@/lib/i18n";
import { useStore } from "@/lib/store";

/** Name, client, address → createProject + a default living room, so the board is usable at once. */
export function NewProjectDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (projectId: string) => void }) {
  const t = useTx();
  const createProject = useStore((s) => s.createProject);
  const addRoom = useStore((s) => s.addRoom);
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [address, setAddress] = useState("");
  const [withRoom, setWithRoom] = useState(true);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const p = createProject({ name: name.trim(), client: client.trim(), address: address.trim() });
    if (withRoom) addRoom(p.id, { name: "סלון", nameEn: "Living room", areaM2: 30, targetLux: 150 });
    setName("");
    setClient("");
    setAddress("");
    onClose();
    onCreated(p.id);
  };

  return (
    <Dialog open={open} onClose={onClose} title={t({ he: "פרויקט חדש", en: "New project" })}>
      <form onSubmit={submit} className="grid gap-4">
        <label className="grid gap-1.5 text-sm">
          <span className="text-muted">{t({ he: "שם הפרויקט", en: "Project name" })}</span>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder={t({ he: "למשל: דירת גן ברמת אביב", en: "e.g. Garden apartment, Ramat Aviv" })} data-autopilot="new-project-name" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted">{t({ he: "לקוח", en: "Client" })}</span>
            <input className="field" value={client} onChange={(e) => setClient(e.target.value)} placeholder={t({ he: "משפחת …", en: "The … family" })} />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted">{t({ he: "כתובת", en: "Address" })}</span>
            <input className="field" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t({ he: "רחוב, עיר", en: "Street, city" })} />
          </label>
        </div>
        <label className="flex items-center gap-2.5 text-sm text-muted">
          <input type="checkbox" checked={withRoom} onChange={(e) => setWithRoom(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--glow-rgb))]" />
          {t({ he: "לפתוח עם חדר ראשון — סלון, 30 מ״ר, 150 לוקס", en: "Start with a first room — living room, 30 m², 150 lx" })}
        </label>
        <div className="mt-2 flex flex-wrap justify-end gap-3">
          <button type="button" className="btn" onClick={onClose}>{t({ he: "ביטול", en: "Cancel" })}</button>
          <button type="submit" className="btn btn-primary" data-autopilot="new-project-confirm">{t({ he: "יצירת הפרויקט", en: "Create project" })}</button>
        </div>
      </form>
    </Dialog>
  );
}
