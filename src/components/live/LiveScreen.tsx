"use client";
import "./live.css";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DeskApp } from "@/components/desk/DeskApp";
import { StudioApp } from "@/components/studio/StudioApp";
import { isDesignerEvent, isKamchiEvent, useNewEvents } from "@/components/studio/useNewEvents";
import { AUTOPILOT_PROJECT_ID, useAutopilot, useAutopilotProgress, type EngineHost, type Side } from "@/lib/autopilot";
import { getStudio } from "@/lib/data";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useLang, useTx } from "@/lib/i18n";
import { PORTAL_NAV } from "@/lib/i18n/common";
import { useStore } from "@/lib/store";
import { ControlBar } from "./ControlBar";
import { DemoCursor } from "./DemoCursor";
import { FlyingDots, type Flight } from "./FlyingDots";
import { RelightStage, RoomStage } from "./StageCards";

const SIDES: Side[] = ["designer", "desk"];

function centerOf(el: Element | null, fx = 0.5, fy = 0.5) {
  const r = el?.getBoundingClientRect();
  if (!r || r.width === 0) return null;
  return { x: r.left + r.width * fx, y: r.top + r.height * fy };
}

function PaneTitle({ children, meta }: { children: React.ReactNode; meta?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 flex h-9 items-center justify-between gap-3 border-b hairline bg-night/90 px-4 backdrop-blur">
      <h2 className="eyebrow truncate !text-[0.68rem]">{children}</h2>
      {meta && <span className="num shrink-0 text-[0.66rem] text-muted">{meta}</span>}
    </div>
  );
}

/**
 * מצב חי — the studio and the desk side by side, divided by one brass line. Every designer action
 * flies across it as a warm dot; every desk action flashes the designer's pane. The autopilot drives
 * both with a visible cursor; ?autopilot=1 starts it after hydration, ?record=1 strips the chrome.
 */
export function LiveScreen() {
  const t = useTx();
  const lang = useLang();
  const sp = useSearchParams();
  const auto = sp.get("autopilot") === "1";
  const record = sp.get("record") === "1";
  const hydrated = useHydrated();
  const reduced = useReducedMotion();
  const studioId = useStore((s) => s.currentStudioId);
  const resetDemo = useStore((s) => s.resetDemo);
  const unseenDesigner = useStore((s) => s.events.filter((e) => !e.seenByDesigner && e.actor === "kamchi").length);
  const unseenDesk = useStore((s) => s.events.filter((e) => !e.seenByDesk && e.actor !== "kamchi").length);
  const studio = getStudio(studioId);

  const designerPane = useRef<HTMLDivElement>(null);
  const deskPane = useRef<HTMLDivElement>(null);
  const [mobileSide, setMobileSide] = useState<Side>("designer");

  const host = useMemo<EngineHost>(
    () => ({
      onRunStart: () => setMobileSide("designer"),
      homePoint: () => centerOf(designerPane.current, 0.5, 0.42),
    }),
    [],
  );
  const { engine, state } = useAutopilot(host);
  const progress = useAutopilotProgress(engine);
  engine.reduced = reduced;

  // The mobile switch follows the autopilot's side.
  useEffect(() => {
    if (state.status === "running" || state.status === "paused") setMobileSide(state.side);
  }, [state.side, state.status]);

  // ?autopilot=1 — start once the persisted store is in.
  useEffect(() => {
    if (!auto || !hydrated) return;
    if (engine.getState().status === "idle") engine.play();
  }, [auto, hydrated, engine]);

  /* ── designer → desk: a dot flies into the inbox ── */
  const [flights, setFlights] = useState<Flight[]>([]);
  const seq = useRef(0);
  const { fresh: designerFresh, tick: designerTick } = useNewEvents(isDesignerEvent);
  useEffect(() => {
    if (!designerFresh.length || reduced) return;
    const cur = engine.getState();
    const from = (cur.cursorVisible && cur.side === "designer" ? engine.getCursor() : null) ?? centerOf(designerPane.current, 0.5, 0.4);
    const to = centerOf(document.querySelector('[data-autopilot="desk-tab:inbox"]')) ?? centerOf(document.querySelector('[data-live-segment="desk"]')) ?? centerOf(deskPane.current, 0.5, 0.1);
    if (!from || !to) return;
    const id = ++seq.current;
    setFlights((f) => [...f.slice(-3), { id, from, to }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designerTick]);
  const removeFlight = useCallback((id: number) => setFlights((f) => f.filter((x) => x.id !== id)), []);

  /* ── desk → designer: the pane flashes warm white ── */
  const { fresh: kamchiFresh } = useNewEvents(isKamchiEvent);

  const stage = state.stage;
  const studioProjectId = stage === "board" ? AUTOPILOT_PROJECT_ID : undefined;
  const slot = stage === "room" ? <RoomStage /> : stage === "relight" ? <RelightStage /> : null;

  const onReset = () => {
    if (!window.confirm(t({ he: "לאפס את הדמו לנתוני ההתחלה? כל הפרויקטים, הבקשות וההצעות שנוספו יימחקו.", en: "Reset the demo to its seed data? Every project, request and quote added so far will be removed." }))) return;
    engine.stop();
    resetDemo();
  };

  const sideLabel = (s: Side) => (s === "designer" ? `${t(PORTAL_NAV.studio.label)}${studio ? ` · ${lang === "he" ? studio.name : studio.nameEn}` : ""}` : t(PORTAL_NAV.desk.label));

  return (
    <section className="live-root flex flex-col" aria-label={t(PORTAL_NAV.live.label)} data-autopilot-live data-autopilot-step={state.stepIndex} data-autopilot-status={state.status} data-autopilot-run={state.runId}>
      <h1 className="sr-only">{t({ he: "מצב חי — הסטודיו ושולחן הפרויקטים זה לצד זה", en: "Live mode — the studio and the project desk side by side" })}</h1>
      <ControlBar engine={engine} state={state} progress={progress} record={record} onReset={onReset} />

      <div role="tablist" aria-label={t({ he: "צד", en: "Side" })} className="flex shrink-0 border-b hairline lg:hidden">
        {SIDES.map((s) => {
          const on = mobileSide === s;
          const n = s === "designer" ? unseenDesigner : unseenDesk;
          return (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`live-pane-${s}`}
              onClick={() => setMobileSide(s)}
              className={`relative flex-1 truncate px-3 py-2.5 text-[0.82rem] transition-colors ${on ? "text-paper" : "text-muted"}`}
              data-live-segment={s}
            >
              {sideLabel(s)}
              {hydrated && n > 0 && <span className="num ms-1.5 text-[0.68rem] text-glow" dir="ltr">{n}</span>}
              {on && <span aria-hidden className="absolute inset-x-0 -bottom-px h-px bg-glow shadow-glow" />}
            </button>
          );
        })}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]">
        <div
          ref={designerPane}
          id="live-pane-designer"
          className={`live-pane @container ${mobileSide !== "designer" ? "hidden lg:block" : ""} ${kamchiFresh.length ? "flash-warm" : ""}`}
          data-autopilot-scroll
          data-lenis-prevent
          data-live-pane="designer"
        >
          <PaneTitle meta={hydrated && unseenDesigner > 0 ? <span dir="ltr">{unseenDesigner} {t({ he: "חדשים", en: "new" })}</span> : undefined}>{sideLabel("designer")}</PaneTitle>
          <StudioApp key={state.runId} embedded projectId={studioProjectId} slot={slot} />
        </div>

        <div aria-hidden className="brass-line relative hidden lg:block">
          <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-glow shadow-glow animate-pulse-dot" />
        </div>

        <div
          ref={deskPane}
          id="live-pane-desk"
          className={`live-pane @container ${mobileSide !== "desk" ? "hidden lg:block" : ""}`}
          data-autopilot-scroll
          data-lenis-prevent
          data-live-pane="desk"
        >
          <PaneTitle meta={<span>{t({ he: "צוות קמחי", en: "Kamchi team" })}</span>}>{sideLabel("desk")}</PaneTitle>
          <DeskApp key={state.runId} embedded flashDelay={reduced ? 0 : 850} inboxFlash={designerFresh.length > 0} />
        </div>
      </div>

      <FlyingDots flights={flights} onDone={removeFlight} />
      <DemoCursor engine={engine} state={state} />
    </section>
  );
}
