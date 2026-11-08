"use client";
import { useState } from "react";
import { useLang, useTx } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { Room } from "@/lib/types";
import { FixturePicker } from "./FixturePicker";
import { RoomItemRow } from "./RoomItemRow";

/** A room as a board: name, area, target lux, and its fixtures. */
export function RoomBoard({ projectId, room, flashFixtureIds, readOnly = false, embedded = false }: { projectId: string; room: Room; flashFixtureIds?: Set<string>; readOnly?: boolean; embedded?: boolean }) {
  const t = useTx();
  const lang = useLang();
  const addItemToRoom = useStore((s) => s.addItemToRoom);
  const [pickerOpen, setPickerOpen] = useState(false);
  const Heading = embedded ? "h4" : "h3";
  const qty = room.items.reduce((n, i) => n + i.qty, 0);

  return (
    <section className="panel" aria-labelledby={`room-${room.id}`} data-autopilot={`room:${room.id}`}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b hairline px-4 py-3">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <Heading id={`room-${room.id}`} className="font-display text-xl text-paper md:text-2xl">{lang === "he" ? room.name : room.nameEn}</Heading>
          <span className="num text-xs text-muted" dir="ltr">{room.areaM2} m² · {room.targetLux} lx</span>
          <span className="num text-xs text-muted" dir="ltr">{qty} {t({ he: "יח׳", en: "pcs" })}</span>
        </div>
        {!readOnly && (
          <button type="button" className="btn btn-sm" onClick={() => setPickerOpen(true)} data-autopilot={`room-add:${room.id}`}>
            {t({ he: "הוספת גוף תאורה", en: "Add fixture" })}
          </button>
        )}
      </header>
      {room.items.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted">{t({ he: "עדיין אין גופי תאורה בחדר הזה.", en: "No fixtures in this room yet." })}</p>
      ) : (
        <ul className="divide-y hairline px-4">
          {room.items.map((it) => (
            <RoomItemRow key={it.id} projectId={projectId} roomId={room.id} item={it} readOnly={readOnly} flash={flashFixtureIds?.has(it.fixtureId)} />
          ))}
        </ul>
      )}
      {!readOnly && (
        <FixturePicker open={pickerOpen} onClose={() => setPickerOpen(false)} roomName={lang === "he" ? room.name : room.nameEn} onPick={(fixtureId) => addItemToRoom(projectId, room.id, fixtureId, 1)} />
      )}
    </section>
  );
}
