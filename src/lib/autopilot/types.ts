import type { Bi } from "@/lib/i18n";
import type { useStore } from "@/lib/store";

export type Side = "designer" | "desk";
/** What the designer pane shows above the studio: the lit room, the relight card, or the board. */
export type Stage = "none" | "room" | "relight" | "board";

export interface MoveOptions {
  /** Travel time in ms (default: derived from distance). */
  duration?: number;
  /** Anchor inside the target, 0..1 (default centre). */
  ax?: number;
  ay?: number;
  /** How long to wait for the target to exist (ms). */
  timeout?: number;
}

export interface StepCtx {
  reduced: boolean;
  signal: AbortSignal;
  store: typeof useStore;
  /** Pause-aware, abortable wait. */
  sleep(ms: number): Promise<void>;
  /** Wait until an element with data-autopilot="target" exists. */
  waitFor(target: string, timeoutMs?: number): Promise<HTMLElement | null>;
  /** Scroll the target into its pane and travel the cursor to it. */
  moveTo(target: string, opts?: MoveOptions): Promise<HTMLElement | null>;
  /** moveTo + press + element.click() — the real handler runs. */
  click(target: string, opts?: MoveOptions): Promise<HTMLElement | null>;
  /** moveTo + set a <select>'s value and dispatch change. */
  select(target: string, value: string, opts?: MoveOptions): Promise<HTMLElement | null>;
  /** moveTo + type into an input/textarea, dispatching input events. */
  type(target: string, text: string, opts?: MoveOptions): Promise<HTMLElement | null>;
  setSide(side: Side): void;
  setStage(stage: Stage): void;
  setCaption(caption: Bi | null): void;
}

export interface AutopilotStep {
  id: string;
  caption: Bi;
  /** Nominal duration in ms, used for the progress bar. */
  duration: number;
  run(ctx: StepCtx): Promise<void>;
  /** Idempotent: guarantee the step's end state in the store (runs after `run`, and when skipped). */
  settle?(ctx: StepCtx): void;
}
