"use client";
import type { AutopilotEngine, AutopilotState } from "@/lib/autopilot";
import { useTx } from "@/lib/i18n";

type Props = {
  engine: AutopilotEngine;
  state: AutopilotState;
  progress: number;
  /** ?record=1 — only play and restart, for a clean recording. */
  record?: boolean;
  onReset: () => void;
};

/** A thin instrument strip: play / pause / skip / restart, the caption, a hairline of progress with step ticks. */
export function ControlBar({ engine, state, progress, record = false, onReset }: Props) {
  const t = useTx();
  const steps = engine.stepList;
  const total = steps.reduce((s, x) => s + x.duration, 0);
  const { status } = state;
  const idle = status === "idle";
  const done = status === "done";
  const idx = Math.max(0, state.stepIndex);
  const caption = state.caption
    ? t(state.caption)
    : t({ he: "הפעילו הדגמה — 30 שניות של עבודה משותפת, מהחדר שנדלק ועד ה־PDF.", en: "Play the demo — 30 seconds of working together, from the room lighting up to the PDF." });
  const playLabel = status === "running" ? t({ he: "השהיה", en: "Pause" }) : status === "paused" ? t({ he: "המשך", en: "Resume" }) : done ? t({ he: "עוד פעם", en: "Play again" }) : t({ he: "הפעילו הדגמה", en: "Play the demo" });
  const secondsLeft = Math.max(0, Math.round((total * (1 - progress)) / 1000));

  let acc = 0;
  const ticks = steps.slice(0, -1).map((s) => { acc += s.duration; return acc / total; });

  return (
    <div role="group" aria-label={t({ he: "בקרת ההדגמה", en: "Demo controls" })} className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b hairline bg-night/85 px-3 py-2 backdrop-blur lg:px-4" data-autopilot-status={status}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={`btn btn-sm ${idle || done ? "btn-primary" : ""}`}
          onClick={() => (done ? engine.restart() : engine.toggle())}
          data-autopilot-control="play"
        >
          {playLabel}
        </button>
        {!record && (
          <button type="button" className="btn btn-sm" disabled={idle || done} onClick={() => engine.skip()} data-autopilot-control="skip">
            {t({ he: "דילוג", en: "Skip" })}
          </button>
        )}
        <button type="button" className="btn btn-sm" disabled={idle} onClick={() => engine.restart()} data-autopilot-control="restart">
          {t({ he: "מהתחלה", en: "Restart" })}
        </button>
      </div>

      <div className="order-last min-w-0 basis-full lg:order-none lg:flex-1 lg:basis-auto">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate font-display text-[1.05rem] leading-tight text-paper" data-autopilot-caption aria-live="polite">{caption}</p>
          {!idle && (
            <span className="num shrink-0 text-[0.68rem] text-muted" dir="ltr">
              {String(Math.min(idx + 1, steps.length)).padStart(2, "0")}/{String(steps.length).padStart(2, "0")} · {secondsLeft}s
            </span>
          )}
        </div>
        <div
          className="relative mt-1.5 h-px bg-ash"
          role="progressbar"
          aria-label={t({ he: "התקדמות ההדגמה", en: "Demo progress" })}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <span className="absolute inset-y-0 start-0 bg-glow shadow-glow" style={{ width: `${progress * 100}%` }} />
          {ticks.map((p, i) => (
            <span key={i} aria-hidden className="absolute top-1/2 h-1.5 w-px -translate-y-1/2 bg-muted/50" style={{ insetInlineStart: `${p * 100}%` }} />
          ))}
        </div>
      </div>

      {!record && (
        <div className="hidden items-center gap-4 text-[0.78rem] lg:flex">
          <a href="/studio" target="_blank" rel="noopener" className="text-muted hover:text-glow">{t({ he: "הסטודיו בכרטיסייה נפרדת", en: "Studio in its own tab" })}</a>
          <a href="/desk" target="_blank" rel="noopener" className="text-muted hover:text-glow">{t({ he: "השולחן בכרטיסייה נפרדת", en: "Desk in its own tab" })}</a>
          <button type="button" onClick={onReset} className="text-muted hover:text-brass-light" data-autopilot-control="reset">{t({ he: "איפוס דמו", en: "Reset demo" })}</button>
        </div>
      )}
    </div>
  );
}
