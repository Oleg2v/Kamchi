"use client";
import type { Bi } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { resetAutopilotData } from "./cleanup";
import type { AutopilotStep, MoveOptions, Side, Stage, StepCtx } from "./types";

export type AutopilotStatus = "idle" | "running" | "paused" | "done";

export interface AutopilotState {
  status: AutopilotStatus;
  /** -1 while idle. */
  stepIndex: number;
  caption: Bi | null;
  side: Side;
  stage: Stage;
  cursorVisible: boolean;
  pressing: boolean;
  /** Increments on every press — the cursor renders a pulse ring per increment. */
  pulse: number;
  runId: number;
}

export const INITIAL_STATE: AutopilotState = {
  status: "idle",
  stepIndex: -1,
  caption: null,
  side: "designer",
  stage: "none",
  cursorVisible: false,
  pressing: false,
  pulse: 0,
  runId: 0,
};

export interface EngineHost {
  /** The host resets its UI (remounts panes, clears selections). */
  onRunStart?: () => void;
  onRunEnd?: () => void;
  /** Viewport point where the cursor rests before its first journey. */
  homePoint?: () => { x: number; y: number } | null;
}

class AbortError extends Error {
  constructor() {
    super("autopilot: aborted");
    this.name = "AbortError";
  }
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/**
 * The autopilot: a deterministic script that drives the real UI. The cursor travels to
 * elements marked `data-autopilot="…"`, presses, and calls their real handlers, so the
 * store changes exactly as it would under a human hand. Pause freezes every clock;
 * skip aborts the current step and settles its end state; restart wipes and replays.
 */
export class AutopilotEngine {
  private st: AutopilotState = INITIAL_STATE;
  private progress = 0;
  private listeners = new Set<() => void>();
  private progressListeners = new Set<() => void>();
  private cursorListeners = new Set<(x: number, y: number) => void>();
  private steps: AutopilotStep[];
  private runCtl: AbortController | null = null;
  private stepCtl: AbortController | null = null;
  private cursorEl: HTMLElement | null = null;
  private pos = { x: 0, y: 0 };
  private stepStart = 0;
  private stepPaused = 0;
  private pauseBegan = 0;
  private raf = 0;
  /** Set by the host every render: under reduced motion the cursor does not travel. */
  reduced = false;
  host: EngineHost = {};

  constructor(steps: AutopilotStep[]) {
    this.steps = steps;
  }

  get stepList() {
    return this.steps;
  }

  /* ── external store API ── */
  getState = () => this.st;
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  getProgress = () => this.progress;
  subscribeProgress = (fn: () => void) => {
    this.progressListeners.add(fn);
    return () => {
      this.progressListeners.delete(fn);
    };
  };
  onCursor = (fn: (x: number, y: number) => void) => {
    this.cursorListeners.add(fn);
    fn(this.pos.x, this.pos.y);
    return () => {
      this.cursorListeners.delete(fn);
    };
  };
  getCursor = () => ({ ...this.pos });
  attachCursor(el: HTMLElement | null) {
    this.cursorEl = el;
  }

  private set(patch: Partial<AutopilotState>) {
    this.st = { ...this.st, ...patch };
    this.listeners.forEach((l) => l());
  }

  /* ── controls ── */
  play() {
    if (this.st.status === "paused") return this.resume();
    if (this.st.status === "running") return;
    void this.start();
  }
  pause() {
    if (this.st.status !== "running") return;
    this.pauseBegan = performance.now();
    this.set({ status: "paused" });
  }
  resume() {
    if (this.st.status !== "paused") return;
    this.stepPaused += performance.now() - this.pauseBegan;
    this.set({ status: "running" });
  }
  toggle() {
    if (this.st.status === "running") this.pause();
    else this.play();
  }
  skip() {
    if (this.st.status !== "running" && this.st.status !== "paused") return;
    if (this.st.status === "paused") this.resume();
    this.stepCtl?.abort();
  }
  restart() {
    this.stop();
    void this.start();
  }
  stop() {
    this.stepCtl?.abort();
    this.runCtl?.abort();
    this.stepCtl = null;
    this.runCtl = null;
    cancelAnimationFrame(this.raf);
    this.progress = 0;
    this.progressListeners.forEach((l) => l());
    this.set({ ...INITIAL_STATE, runId: this.st.runId, pulse: this.st.pulse });
  }

  /* ── the run ── */
  private async start() {
    const run = new AbortController();
    this.runCtl = run;
    const runId = this.st.runId + 1;
    this.host.onRunStart?.();
    this.set({ ...INITIAL_STATE, runId, status: "running", stepIndex: 0, pulse: this.st.pulse });
    resetAutopilotData(useStore.getState().currentStudioId);
    await nextFrame();
    await nextFrame();
    if (run.signal.aborted) return;

    const home = this.host.homePoint?.() ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.place(home.x, home.y);
    this.progressLoop();

    for (let i = 0; i < this.steps.length; i++) {
      if (run.signal.aborted) return;
      const step = this.steps[i];
      const ctl = new AbortController();
      this.stepCtl = ctl;
      this.stepStart = performance.now();
      this.stepPaused = 0;
      this.set({ stepIndex: i, caption: step.caption });
      const ctx = this.makeCtx(ctl.signal);
      try {
        await step.run(ctx);
      } catch (e) {
        if (!(e instanceof AbortError) && (e as Error)?.name !== "AbortError") console.error("[autopilot]", step.id, e);
      }
      if (run.signal.aborted) return;
      try {
        step.settle?.(ctx);
      } catch (e) {
        console.error("[autopilot] settle", step.id, e);
      }
    }
    cancelAnimationFrame(this.raf);
    this.progress = 1;
    this.progressListeners.forEach((l) => l());
    this.set({ status: "done", pressing: false });
    this.host.onRunEnd?.();
  }

  private progressLoop() {
    cancelAnimationFrame(this.raf);
    const total = this.steps.reduce((s, x) => s + x.duration, 0) || 1;
    const tick = () => {
      if (this.st.status !== "running" && this.st.status !== "paused") return;
      const idx = Math.max(0, this.st.stepIndex);
      const before = this.steps.slice(0, idx).reduce((s, x) => s + x.duration, 0);
      const cur = this.steps[idx];
      const now = performance.now();
      const paused = this.stepPaused + (this.st.status === "paused" ? now - this.pauseBegan : 0);
      const elapsed = Math.max(0, Math.min(cur?.duration ?? 0, now - this.stepStart - paused));
      const p = Math.min(1, (before + elapsed) / total);
      if (Math.abs(p - this.progress) > 0.0015) {
        this.progress = p;
        this.progressListeners.forEach((l) => l());
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  /* ── cursor ── */
  private place(x: number, y: number) {
    this.pos = { x, y };
    this.cursorListeners.forEach((l) => l(x, y));
    // Let the site's own dimmer cursor (and any hover logic) follow the demo cursor.
    const under = document.elementFromPoint(x, y);
    if (under && under !== this.cursorEl && !this.cursorEl?.contains(under)) {
      try {
        under.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: x, clientY: y, pointerType: "mouse" }));
      } catch {
        /* older engines */
      }
    }
  }

  /** Native <dialog> lives in the top layer; re-showing the cursor popover keeps it above. */
  private retop() {
    const el = this.cursorEl as (HTMLElement & { showPopover?: () => void; hidePopover?: () => void }) | null;
    if (!el || typeof el.showPopover !== "function") return;
    try {
      if (el.matches(":popover-open")) el.hidePopover?.();
      el.showPopover();
    } catch {
      /* not connected yet */
    }
  }

  /* ── step context ── */
  private makeCtx(signal: AbortSignal): StepCtx {
    const check = () => {
      if (signal.aborted || this.runCtl?.signal.aborted) throw new AbortError();
    };
    const frame = async () => {
      check();
      await nextFrame();
      check();
    };
    const sleep = async (ms: number) => {
      check();
      if (ms <= 0) return;
      let acc = 0;
      let last = performance.now();
      while (acc < ms) {
        await frame();
        const now = performance.now();
        if (this.st.status !== "paused") acc += now - last;
        last = now;
      }
    };
    const find = (target: string) => document.querySelector<HTMLElement>(`[data-autopilot="${CSS.escape(target)}"]`);
    const waitFor = async (target: string, timeout = 3000) => {
      let waited = 0;
      let last = performance.now();
      for (;;) {
        const el = find(target);
        if (el) return el;
        if (waited > timeout) return null;
        await frame();
        const now = performance.now();
        if (this.st.status !== "paused") waited += now - last;
        last = now;
      }
    };
    const scrollIntoPane = async (el: HTMLElement) => {
      const pane = el.closest<HTMLElement>("[data-autopilot-scroll]");
      if (!pane) return;
      const pr = pane.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const delta = r.top + r.height / 2 - (pr.top + pr.height / 2);
      if (Math.abs(delta) < 28) return;
      pane.scrollTo({ top: pane.scrollTop + delta, behavior: this.reduced ? "auto" : "smooth" });
      await sleep(this.reduced ? 40 : 480);
    };
    const moveTo = async (target: string, opts: MoveOptions = {}) => {
      const el = await waitFor(target, opts.timeout ?? 3000);
      if (!el) return null;
      // Give the host a frame to reveal the pane (mobile) before measuring.
      await frame();
      await scrollIntoPane(el);
      const r = el.getBoundingClientRect();
      const tx = r.left + r.width * (opts.ax ?? 0.5);
      const ty = r.top + r.height * (opts.ay ?? 0.5);
      if (!this.st.cursorVisible) this.set({ cursorVisible: true });
      if (this.reduced) {
        this.place(tx, ty);
        this.retop();
        return el;
      }
      const sx = this.pos.x;
      const sy = this.pos.y;
      const dist = Math.hypot(tx - sx, ty - sy);
      const dur = opts.duration ?? Math.min(1100, Math.max(420, dist * 1.15));
      let t = 0;
      let last = performance.now();
      while (t < 1) {
        await frame();
        const now = performance.now();
        if (this.st.status !== "paused") t = Math.min(1, t + (now - last) / dur);
        last = now;
        const k = easeInOutCubic(t);
        this.place(sx + (tx - sx) * k, sy + (ty - sy) * k);
      }
      this.retop();
      return el;
    };
    const press = async () => {
      this.set({ pressing: true, pulse: this.st.pulse + 1 });
      await sleep(this.reduced ? 0 : 150);
      this.set({ pressing: false });
    };
    const click = async (target: string, opts?: MoveOptions) => {
      const el = await moveTo(target, opts);
      if (!el) return null;
      await press();
      el.click();
      await frame();
      this.retop();
      return el;
    };
    const select = async (target: string, value: string, opts?: MoveOptions) => {
      const el = await moveTo(target, opts);
      if (!el) return null;
      await press();
      if (el instanceof HTMLSelectElement) {
        el.value = value;
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
      await frame();
      return el;
    };
    const type = async (target: string, text: string, opts?: MoveOptions) => {
      const el = await moveTo(target, opts);
      if (!el) return null;
      await press();
      el.focus?.();
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (!setter) return el;
      let cur = "";
      let i = 0;
      for (const ch of text) {
        cur += ch;
        setter.call(el, cur);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        if (!this.reduced) await sleep(30 + (i++ % 3) * 9);
      }
      return el;
    };
    return {
      reduced: this.reduced,
      signal,
      store: useStore,
      sleep,
      waitFor,
      moveTo,
      click,
      select,
      type,
      setSide: (side: Side) => this.set({ side }),
      setStage: (stage: Stage) => this.set({ stage }),
      setCaption: (caption: Bi | null) => this.set({ caption }),
    };
  }
}
