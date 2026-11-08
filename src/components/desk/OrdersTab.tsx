"use client";
import { useMemo, useState } from "react";
import { FixtureThumb } from "@/components/studio/FixtureThumb";
import { OrderPipeline, nextOrderStatus } from "@/components/studio/OrderPipeline";
import { StatusChip } from "@/components/studio/StatusChip";
import { brandLine, fixtureName } from "@/components/studio/labels";
import { getFixture, getStudio, STUDIOS } from "@/lib/data";
import { useLang, useTx } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { Project, Room, RoomItem } from "@/lib/types";

function OrderRow({ project, room, item }: { project: Project; room: Room; item: RoomItem }) {
  const t = useTx();
  const lang = useLang();
  const setOrderStatus = useStore((s) => s.setOrderStatus);
  const [lit, setLit] = useState(false);
  const f = getFixture(item.fixtureId);
  if (!f || !item.orderStatus) return null;
  const next = nextOrderStatus(item.orderStatus);
  return (
    <li
      className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2 py-3 md:grid-cols-[2.75rem_minmax(0,1fr)_auto] md:items-center"
      onPointerEnter={() => setLit(true)}
      onPointerLeave={() => setLit(false)}
      onFocusCapture={() => setLit(true)}
      onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setLit(false); }}
      data-autopilot={`order-item:${item.id}`}
    >
      <FixtureThumb fixture={f} lit={lit} className="w-[2.75rem]" />
      <div className="min-w-0">
        <p className="truncate text-sm text-paper">
          {fixtureName(f, lang)}
          <span className="num mx-2 text-xs text-muted"><span dir="ltr">× {item.qty}</span></span>
        </p>
        <p className="font-mono text-[0.66rem] uppercase tracking-wider text-muted"><span dir="ltr">{brandLine(f, lang)}</span></p>
        <p className="text-[0.72rem] text-muted">{lang === "he" ? room.name : room.nameEn}{item.note && <span> — {item.note}</span>}</p>
      </div>
      <div className="col-start-2 md:col-start-3">
        <OrderPipeline status={item.orderStatus} onAdvance={next ? () => setOrderStatus(project.id, item.id, next) : undefined} />
        <span className="sr-only">{t({ he: "מסלול ההזמנה של", en: "Order pipeline for" })} {f.name}</span>
      </div>
    </li>
  );
}

/** Every ordered item, grouped by project — a five-step pipeline per line and one button to move it. */
export function OrdersTab({ embedded = false }: { embedded?: boolean }) {
  const t = useTx();
  const lang = useLang();
  const projects = useStore((s) => s.projects);
  const [studioId, setStudioId] = useState<string>("");

  const groups = useMemo(
    () =>
      projects
        .filter((p) => !studioId || p.studioId === studioId)
        .map((p) => ({ project: p, rows: p.rooms.flatMap((room) => room.items.filter((it) => it.orderStatus).map((item) => ({ room, item }))) }))
        .filter((g) => g.rows.length > 0)
        .sort((a, b) => b.project.updatedAt.localeCompare(a.project.updatedAt)),
    [projects, studioId],
  );
  const openCount = groups.reduce((n, g) => n + g.rows.filter((r) => r.item.orderStatus !== "delivered").length, 0);
  const Heading = embedded ? "h4" : "h3";

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="num text-xs text-muted">
          <span dir="ltr">{openCount}</span> {t({ he: "שורות פתוחות", en: "open lines" })} · <span dir="ltr">{groups.length}</span> {t({ he: "פרויקטים", en: "projects" })}
        </p>
        <label className="flex items-center gap-2 text-sm text-muted">
          <span>{t({ he: "סטודיו", en: "Studio" })}</span>
          <select className="field min-h-8 w-auto py-1 text-sm" value={studioId} onChange={(e) => setStudioId(e.target.value)} aria-label={t({ he: "סינון לפי סטודיו", en: "Filter by studio" })}>
            <option value="">{t({ he: "כל הסטודיואים", en: "All studios" })}</option>
            {STUDIOS.map((s) => <option key={s.id} value={s.id}>{lang === "he" ? s.name : s.nameEn}</option>)}
          </select>
        </label>
      </div>
      {groups.length === 0 ? (
        <p className="border hairline px-4 py-10 text-center text-sm text-muted">{t({ he: "אין הזמנות פתוחות לסטודיו הזה.", en: "No open orders for this studio." })}</p>
      ) : (
        groups.map(({ project, rows }) => {
          const studio = getStudio(project.studioId);
          return (
            <section key={project.id} className="panel" aria-labelledby={`orders-${project.id}`} data-autopilot={`orders:${project.id}`}>
              <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b hairline px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <Heading id={`orders-${project.id}`} className="font-display text-xl text-paper md:text-2xl">{lang === "he" ? project.name : project.nameEn}</Heading>
                  <span className="text-xs text-muted">{studio ? (lang === "he" ? studio.name : studio.nameEn) : project.studioId}</span>
                </div>
                <StatusChip status={project.status} />
              </header>
              <ul className="divide-y hairline px-4">
                {rows.map(({ room, item }) => <OrderRow key={item.id} project={project} room={room} item={item} />)}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
