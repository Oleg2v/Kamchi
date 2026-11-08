"use client";
import { useEffect, useMemo, useState } from "react";
import { RoomBoard } from "@/components/studio/RoomBoard";
import { backArrow, quoted, relativeTime } from "@/components/studio/labels";
import { isDesignerEvent, useNewEvents } from "@/components/studio/useNewEvents";
import { getStudio } from "@/lib/data";
import { useIsDesktop } from "@/lib/hooks/useMedia";
import { formatIls, useLang, useTx } from "@/lib/i18n";
import { selectOpenRequests, useStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import type { Quote, QuoteRequest } from "@/lib/types";
import { QuoteEditor, SentQuotePanel } from "./QuoteEditor";

function RequestRow({ req, active, fresh, onOpen, unseen }: { req: QuoteRequest; active: boolean; fresh: boolean; unseen: boolean; onOpen: () => void }) {
  const t = useTx();
  const lang = useLang();
  const project = useStore((s) => s.projects.find((p) => p.id === req.projectId));
  const studio = getStudio(req.studioId);
  return (
    <li className={fresh ? "flash-warm" : ""}>
      <button
        type="button"
        onClick={onOpen}
        aria-current={active ? "true" : undefined}
        className={`grid w-full gap-1 px-4 py-3 text-start transition-colors ${active ? "bg-charcoal" : "hover:bg-charcoal/60"}`}
        data-autopilot={`inbox-item:${req.id}`}
      >
        <span className="flex items-center justify-between gap-3">
          <span className="truncate text-sm text-paper">{project ? (lang === "he" ? project.name : project.nameEn) : req.projectId}</span>
          <span className="flex shrink-0 items-center gap-2">
            {req.status === "new" ? (
              <span className={`chip px-1.5 py-0 text-[0.64rem] ${unseen ? "is-on" : ""}`}>{t({ he: "חדש", en: "New" })}</span>
            ) : (
              <span className="chip px-1.5 py-0 text-[0.64rem]">{t({ he: "בטיפול", en: "In progress" })}</span>
            )}
          </span>
        </span>
        <span className="flex items-baseline justify-between gap-3 text-[0.72rem] text-muted">
          <span className="truncate">{studio ? (lang === "he" ? studio.name : studio.nameEn) : req.studioId}{studio && <> · {t({ he: "דרגה", en: "Tier" })} <span className="num" dir="ltr">{studio.tier}</span></>}</span>
          <span className="num shrink-0">{relativeTime(req.createdAt, lang)}</span>
        </span>
        {req.message && <span className="line-clamp-2 text-[0.78rem] leading-snug text-muted">{quoted(req.message, lang)}</span>}
      </button>
    </li>
  );
}

function RequestDetail({ req, embedded, onBack }: { req: QuoteRequest; embedded: boolean; onBack?: () => void }) {
  const t = useTx();
  const lang = useLang();
  const project = useStore((s) => s.projects.find((p) => p.id === req.projectId));
  const quote = useStore((s) => s.quotes.find((q) => q.requestId === req.id));
  const startQuote = useStore((s) => s.startQuote);
  const [sent, setSent] = useState<{ quote: Quote; pdf: Uint8Array } | null>(null);
  const studio = getStudio(req.studioId);
  const Heading = embedded ? "h4" : "h3";

  useEffect(() => {
    if (req.status === "new") startQuote(req.id);
  }, [req.id, req.status, startQuote]);

  if (!project) return <p className="px-4 py-6 text-sm text-muted">{t({ he: "הפרויקט של הבקשה כבר לא קיים.", en: "The project behind this request no longer exists." })}</p>;
  const name = lang === "he" ? project.name : project.nameEn;

  return (
    <div className="grid min-w-0 gap-5 [&>*]:min-w-0" data-autopilot={`request:${req.id}`}>
      <header className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow">{t({ he: "בקשה", en: "Request" })} · <span className="normal-case tracking-normal" dir="ltr">{req.id}</span> · {relativeTime(req.createdAt, lang)}</p>
          {onBack && <button type="button" onClick={onBack} className="lit-link text-sm text-muted"><span aria-hidden>{backArrow(lang)} </span>{t({ he: "כל הבקשות", en: "All requests" })}</button>}
        </div>
        <Heading className="font-display text-2xl leading-tight text-paper md:text-3xl">{name}</Heading>
        {studio && (
          <p className="text-sm text-muted">
            {lang === "he" ? studio.name : studio.nameEn} · {t({ he: "דרגה", en: "Tier" })} <span className="num" dir="ltr">{studio.tier}</span> · {lang === "he" ? studio.contact.name : studio.contact.nameEn} · <span className="num" dir="ltr">{studio.contact.phone}</span>
          </p>
        )}
        <p className="text-sm text-muted">{project.client || "—"}{project.address && <span> · {project.address}</span>}</p>
        {req.message && <blockquote className="border-s-2 border-brass/60 ps-3 text-[0.9rem] leading-relaxed text-paper">{quoted(req.message, lang)}</blockquote>}
      </header>

      <section className="grid gap-3" aria-label={t({ he: "הלוח של המעצב", en: "The designer's board" })}>
        <div className="flex items-baseline justify-between gap-3">
          <p className="eyebrow">{t({ he: "הלוח של המעצב", en: "The designer's board" })}</p>
          <span className="num text-xs text-muted" dir="ltr">{project.rooms.length} {lang === "he" ? "חדרים" : "rooms"}</span>
        </div>
        {project.rooms.map((room) => <RoomBoard key={room.id} projectId={project.id} room={room} readOnly embedded />)}
      </section>

      {quote ? (
        <SentQuotePanel quote={quote} project={project} pdf={sent?.quote.id === quote.id ? sent.pdf : null} justSent={sent?.quote.id === quote.id} onBack={onBack} embedded={embedded} />
      ) : (
        <QuoteEditor request={req} project={project} embedded={embedded} onSent={(q, pdf) => setSent({ quote: q, pdf })} />
      )}
    </div>
  );
}

/**
 * Requests from the studios — newest first, the unseen ones lit. Opening one shows the
 * designer's board and the quote editor. The list is a live region: new requests are announced.
 */
export function InboxTab({ embedded = false, flashDelay = 0 }: { embedded?: boolean; flashDelay?: number }) {
  const t = useTx();
  const lang = useLang();
  const desktop = useIsDesktop();
  const open = useStore(useShallow(selectOpenRequests));
  const requests = useStore((s) => s.quoteRequests);
  const quotes = useStore((s) => s.quotes);
  const events = useStore((s) => s.events);
  const projects = useStore((s) => s.projects);
  const markSeen = useStore((s) => s.markSeen);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { fresh } = useNewEvents(isDesignerEvent, { delay: flashDelay });

  const list = useMemo(() => [...open].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [open]);
  const selected = selectedId ? requests.find((r) => r.id === selectedId) : undefined;
  const unseenRequestIds = useMemo(() => new Set(events.filter((e) => e.type === "quote.requested" && !e.seenByDesk).map((e) => (e.payload?.requestId as string | undefined) ?? `qr-${e.projectId}`)), [events]);
  const freshRequestIds = useMemo(() => new Set(fresh.map((e) => (e.payload?.requestId as string | undefined) ?? "")), [fresh]);
  const freshProjectIds = useMemo(() => new Set(fresh.map((e) => e.projectId ?? "")), [fresh]);
  const recentSent = useMemo(() => quotes.filter((q) => !q.acceptedAt).sort((a, b) => b.sentAt.localeCompare(a.sentAt)).slice(0, 4), [quotes]);

  // Viewing the inbox marks the designers' activity as seen — after a beat, so the glow is noticed first.
  const unseen = events.some((e) => !e.seenByDesk && e.actor !== "kamchi");
  useEffect(() => {
    if (!unseen) return;
    const id = setTimeout(() => markSeen("kamchi"), 2600);
    return () => clearTimeout(id);
  }, [unseen, markSeen]);

  const twoColumn = !embedded && desktop;
  // Standalone desktop: the newest open request is open by default, so the desk never shows an empty detail.
  useEffect(() => {
    if (twoColumn && !selectedId && list[0]) setSelectedId(list[0].id);
  }, [twoColumn, selectedId, list]);
  const showList = twoColumn || !selected;
  const showDetail = twoColumn || !!selected;

  const listEl = (
    <section className="grid content-start gap-4" aria-labelledby="inbox-open">
      <div className="flex items-baseline justify-between gap-3">
        <p id="inbox-open" className="eyebrow">{t({ he: "בקשות פתוחות", en: "Open requests" })}</p>
        <span className="num text-xs text-muted" dir="ltr">{list.length}</span>
      </div>
      <ol className="divide-y hairline border hairline" aria-live="polite" aria-relevant="additions" aria-label={t({ he: "בקשות להצעת מחיר", en: "Quote requests" })}>
        {list.map((r) => (
          <RequestRow key={r.id} req={r} active={r.id === selectedId} unseen={unseenRequestIds.has(r.id)} fresh={freshRequestIds.has(r.id) || freshProjectIds.has(r.projectId)} onOpen={() => setSelectedId(r.id)} />
        ))}
        {list.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-muted">{t({ he: "אין בקשות פתוחות. כשמעצב יבקש הצעת מחיר — היא תופיע כאן, דולקת.", en: "No open requests. When a designer asks for a quote it lands here, lit." })}</li>
        )}
      </ol>
      {recentSent.length > 0 && (
        <div className="grid gap-2">
          <p className="eyebrow">{t({ he: "נשלחו לאחרונה", en: "Recently sent" })}</p>
          <ul className="divide-y hairline border hairline">
            {recentSent.map((q) => {
              const p = projects.find((x) => x.id === q.projectId);
              const r = requests.find((x) => x.id === q.requestId);
              return (
                <li key={q.id}>
                  <button type="button" onClick={() => r && setSelectedId(r.id)} className={`flex w-full items-baseline justify-between gap-3 px-4 py-2.5 text-start text-sm transition-colors hover:bg-charcoal/60 ${selectedId === r?.id ? "bg-charcoal" : ""}`}>
                    <span className="truncate text-muted">{p ? (lang === "he" ? p.name : p.nameEn) : q.projectId}</span>
                    <span className="num shrink-0 text-paper" dir="ltr">{formatIls(q.total, lang)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );

  const detailEl = selected ? (
    <RequestDetail key={selected.id} req={selected} embedded={embedded} onBack={twoColumn ? undefined : () => setSelectedId(null)} />
  ) : (
    <div className="grid min-h-48 place-items-center border hairline px-6 text-center text-sm text-muted">
      {list.length ? t({ he: "בחרו בקשה כדי לראות את הלוח ולהכין הצעה.", en: "Pick a request to see the board and prepare a quote." }) : t({ he: "השולחן נקי.", en: "The desk is clear." })}
    </div>
  );

  return (
    <div className={`[&>*]:min-w-0 ${twoColumn ? "grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)]" : "grid gap-6"}`}>
      {showList && listEl}
      {showDetail && detailEl}
    </div>
  );
}
