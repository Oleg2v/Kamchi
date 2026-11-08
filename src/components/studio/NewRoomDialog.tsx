"use client";
import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useTx } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export function NewRoomDialog({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId: string }) {
  const t = useTx();
  const addRoom = useStore((s) => s.addRoom);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [area, setArea] = useState("20");
  const [lux, setLux] = useState("150");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addRoom(projectId, { name: name.trim(), nameEn: nameEn.trim() || name.trim(), areaM2: Math.max(1, Number(area) || 0), targetLux: Math.max(10, Number(lux) || 0) });
    setName("");
    setNameEn("");
    setArea("20");
    setLux("150");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={t({ he: "חדר חדש", en: "New room" })}>
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted">{t({ he: "שם החדר", en: "Room name (Hebrew)" })}</span>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder={t({ he: "חדר רחצה הורים", en: "Master bathroom" })} />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted">{t({ he: "שם באנגלית", en: "Name in English" })}</span>
            <input className="field" dir="ltr" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Master bathroom" />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted">{t({ he: "שטח (מ״ר)", en: "Area (m²)" })}</span>
            <input className="field font-mono" dir="ltr" type="number" min={1} inputMode="numeric" value={area} onChange={(e) => setArea(e.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted">{t({ he: "יעד תאורה (לוקס)", en: "Target illuminance (lx)" })}</span>
            <input className="field font-mono" dir="ltr" type="number" min={10} step={10} inputMode="numeric" value={lux} onChange={(e) => setLux(e.target.value)} />
          </label>
        </div>
        <p className="text-xs text-muted">{t({ he: "לפי ת״י 8995: סלון 150, מטבח 400, משרד 500, מסדרון 100 לוקס.", en: "Per the standard: living 150, kitchen 400, office 500, hallway 100 lx." })}</p>
        <div className="mt-1 flex flex-wrap justify-end gap-3">
          <button type="button" className="btn" onClick={onClose}>{t({ he: "ביטול", en: "Cancel" })}</button>
          <button type="submit" className="btn btn-primary">{t({ he: "הוספת החדר", en: "Add room" })}</button>
        </div>
      </form>
    </Dialog>
  );
}
