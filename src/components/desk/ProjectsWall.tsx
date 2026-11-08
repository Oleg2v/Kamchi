"use client";
import { useMemo } from "react";
import { StatusChip } from "@/components/studio/StatusChip";
import { countFixtures, listValue, relativeTime } from "@/components/studio/labels";
import { STUDIOS } from "@/lib/data";
import { formatIls, useLang, useTx } from "@/lib/i18n";
import { useStore } from "@/lib/store";

/** Every studio's boards on one wall: name, tier, open value, and compact cards with status chips. */
export function ProjectsWall({ embedded = false }: { embedded?: boolean }) {
  const t = useTx();
  const lang = useLang();
  const projects = useStore((s) => s.projects);
  const discounts = useStore((s) => s.studioDiscounts);
  const groups = useMemo(
    () =>
      STUDIOS.map((studio) => {
        const list = projects.filter((p) => p.studioId === studio.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        const openValue = list.filter((p) => p.status !== "delivered").reduce((n, p) => n + listValue(p), 0);
        return { studio, list, openValue };
      }).sort((a, b) => b.openValue - a.openValue),
    [projects],
  );
  const Heading = embedded ? "h4" : "h3";
  const totalOpen = groups.reduce((n, g) => n + g.openValue, 0);

  return (
    <div className="grid gap-8">
      <p className="num text-xs text-muted">
        <span dir="ltr">{projects.length}</span> {t({ he: "פרויקטים", en: "projects" })} · {t({ he: "ערך פתוח לפי מחירון", en: "open value at list" })} <span dir="ltr">{formatIls(totalOpen, lang)}</span>
      </p>
      {groups.map(({ studio, list, openValue }) => (
        <section key={studio.id} className="grid gap-3" aria-labelledby={`wall-${studio.id}`}>
          <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b hairline pb-2">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <Heading id={`wall-${studio.id}`} className="font-display text-xl text-paper md:text-2xl">{lang === "he" ? studio.name : studio.nameEn}</Heading>
              <span className="font-mono text-[0.7rem] tracking-wider text-brass-light" dir="ltr">
                {t({ he: "דרגה", en: "Tier" })} {studio.tier} · {discounts[studio.id] ?? studio.discountPct}%
              </span>
              <span className="text-xs text-muted">{lang === "he" ? studio.city : studio.cityEn}</span>
            </div>
            <span className="num text-xs text-muted" dir="ltr">{list.length} · {formatIls(openValue, lang)}</span>
          </header>
          {list.length === 0 ? (
            <p className="text-sm text-muted">{t({ he: "אין לוחות פתוחים.", en: "No open boards." })}</p>
          ) : (
            <ul className={`grid gap-3 ${embedded ? "@xl:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3"}`}>
              {list.map((p) => (
                <li key={p.id} className="border hairline bg-night p-4" data-autopilot={`wall-project:${p.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <StatusChip status={p.status} />
                    <span className="num text-[0.7rem] text-muted">{relativeTime(p.updatedAt, lang)}</span>
                  </div>
                  <p className="mt-3 font-display text-xl leading-tight text-paper">{lang === "he" ? p.name : p.nameEn}</p>
                  <p className="mt-1 truncate text-xs text-muted">{p.client || "—"}{p.address && <span> · {p.address}</span>}</p>
                  <p className="num mt-3 text-xs text-muted">
                    <span dir="ltr">{p.rooms.length}</span> {t({ he: "חדרים", en: "rooms" })} · <span dir="ltr">{countFixtures(p)}</span> {t({ he: "גופים", en: "fixtures" })} · <span dir="ltr">{formatIls(listValue(p), lang)}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
