"use client";
/**
 * HeroLightController — the switchboard of the hero room.
 *
 * Switch-ons are ramps, not scrubs: crossing a light's scrollStart starts a
 * 120 ms incandescent ramp (0 → 1.15 → 1.0, power4.out rise with a tiny
 * overshoot); crossing back drops it over 80 ms. The intensities live in one
 * Float32Array that the shader reads directly, so nothing re-renders per tick.
 * The same curve is evaluated analytically for deterministic frame capture.
 */
import scene from "@/lib/data/hero-scene.json";
import { getGsap } from "@/lib/motion/gsap";
import type { HeroLight, HeroScene } from "./scene-types";
import { MAX_LIGHTS } from "./relight-shader";

export const SCENE = scene as unknown as HeroScene;
export const LIGHTS: HeroLight[] = [...SCENE.lights].sort((a, b) => a.order - b.order || a.scrollStart - b.scrollStart);

export type LightId = HeroLight["id"];

/** Auto mode: when each light switches on, in seconds. Pendant → sconces → spots (60 ms stagger) → floor. */
export const AUTO_TIMES: Record<LightId, number> = {
  pendant: 0.8,
  "sconce-l": 2.2,
  "sconce-r": 2.26,
  "spot-1": 3.6,
  "spot-2": 3.8,
  "spot-3": 4.0,
  floor: 5.0,
};
export const AUTO_DURATION = 6;

export const RAMP_ON_MS = 120;
export const RAMP_OFF_MS = 80;
export const PEAK = 1.15;
/** H1 switches on here; the hint shows until the first light. */
export const TITLE_AT = 0.84;

/** Incandescent rise: power4.out to a 15% overshoot, then settle to 1 by 120 ms. */
export function rampOn(ms: number): number {
  if (ms <= 0) return 0;
  if (ms >= RAMP_ON_MS) return 1;
  const x = ms / RAMP_ON_MS;
  if (x < 0.7) {
    const u = x / 0.7;
    return PEAK * (1 - Math.pow(1 - u, 4));
  }
  const u = (x - 0.7) / 0.3;
  const s = u * u * (3 - 2 * u);
  return PEAK - (PEAK - 1) * s;
}
/** Filament cooling: power2.in to zero over 80 ms. */
export function rampOff(ms: number, from = 1): number {
  if (ms <= 0) return from;
  if (ms >= RAMP_OFF_MS) return 0;
  const x = ms / RAMP_OFF_MS;
  return from * (1 - x * x);
}

/** Order of the auto sequence as progress → time mapping (used by the video curve). */
export function autoTimeToProgress(t: number): number {
  // piecewise-linear through the switch points so the video's 6 s matches the scroll script
  const pts: [number, number][] = [
    [0, 0],
    [AUTO_TIMES.pendant, LIGHTS.find((l) => l.id === "pendant")!.scrollStart],
    [AUTO_TIMES["sconce-l"], LIGHTS.find((l) => l.id === "sconce-l")!.scrollStart],
    [AUTO_TIMES["spot-1"], LIGHTS.find((l) => l.id === "spot-1")!.scrollStart],
    [AUTO_TIMES["spot-3"], LIGHTS.find((l) => l.id === "spot-3")!.scrollStart],
    [AUTO_TIMES.floor, LIGHTS.find((l) => l.id === "floor")!.scrollStart],
    [AUTO_DURATION, 1],
  ];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const [t0, p0] = pts[i - 1];
      const [t1, p1] = pts[i];
      return p0 + ((t - t0) / (t1 - t0)) * (p1 - p0);
    }
  }
  return 1;
}

type SwitchListener = (id: LightId, on: boolean) => void;
type FlagListener = (flags: Flags) => void;
export interface Flags {
  /** Before the first light: "scroll to switch on". */
  hint: boolean;
  /** Progress ≥ TITLE_AT: the H1 switches on. */
  title: boolean;
  /** Every light is on. */
  fullyLit: boolean;
}

interface Tween { kill(): void }

export class HeroLightController {
  readonly intensities = new Float32Array(MAX_LIGHTS);
  readonly lights = LIGHTS;
  readonly lit: boolean[] = LIGHTS.map(() => false);
  progress = 0;
  flags: Flags = { hint: true, title: false, fullyLit: false };
  /** Set by the canvas: request a frame. */
  requestRender: () => void = () => {};

  private tweens: (Tween | null)[] = LIGHTS.map(() => null);
  private phases = LIGHTS.map(() => ({ v: 0 }));
  private switchListeners = new Set<SwitchListener>();
  private flagListeners = new Set<FlagListener>();
  private autoCalls: Tween[] = [];

  onSwitch(fn: SwitchListener): () => void {
    this.switchListeners.add(fn);
    return () => this.switchListeners.delete(fn);
  }
  onFlags(fn: FlagListener): () => void {
    this.flagListeners.add(fn);
    return () => this.flagListeners.delete(fn);
  }

  /* ───────── scroll mode ───────── */

  setProgress(p: number) {
    this.progress = p;
    // group lights that cross on the same tick so spots still stagger by 60 ms
    const crossing: number[] = [];
    this.lights.forEach((l, i) => {
      const shouldBeOn = p >= l.scrollStart - (this.lit[i] ? 0.012 : 0);
      if (shouldBeOn && !this.lit[i]) crossing.push(i);
      else if (!shouldBeOn && this.lit[i]) this.switchOff(i);
    });
    const byOrder = new Map<number, number>();
    for (const i of crossing) {
      const order = this.lights[i].order;
      const k = byOrder.get(order) ?? 0;
      byOrder.set(order, k + 1);
      this.switchOn(i, k * 0.06);
    }
    this.setFlags({ hint: p < this.lights[0].scrollStart, title: p >= TITLE_AT });
  }

  /* ───────── auto mode (~6 s, then hold) ───────── */

  startAuto() {
    this.stopAuto();
    const { gsap } = getGsap();
    this.lights.forEach((l, i) => {
      const call = gsap.delayedCall(AUTO_TIMES[l.id], () => this.switchOn(i, 0));
      this.autoCalls.push(call);
    });
    this.autoCalls.push(gsap.delayedCall(AUTO_TIMES.floor + 0.2, () => this.setFlags({ title: true })));
    this.setFlags({ hint: false, title: false });
  }
  stopAuto() {
    this.autoCalls.forEach((c) => c.kill());
    this.autoCalls = [];
  }

  /* ───────── static: everything on at once ───────── */

  setStatic() {
    this.stopAuto();
    this.lights.forEach((_, i) => {
      this.killTween(i);
      this.intensities[i] = 1;
      this.phases[i].v = 1;
      if (!this.lit[i]) {
        this.lit[i] = true;
        this.emitSwitch(i, true);
      }
    });
    this.progress = 1;
    this.setFlags({ hint: false, title: true, fullyLit: true });
    this.requestRender();
  }

  /* ───────── deterministic (frame capture) ───────── */

  /** Scroll progress with every ramp settled. */
  setProgressSettled(p: number) {
    this.stopAuto();
    this.progress = p;
    this.lights.forEach((l, i) => {
      this.killTween(i);
      const on = p >= l.scrollStart;
      this.intensities[i] = on ? 1 : 0;
      if (on !== this.lit[i]) { this.lit[i] = on; this.emitSwitch(i, on); }
    });
    this.setFlags({ hint: p < this.lights[0].scrollStart, title: p >= TITLE_AT, fullyLit: this.lit.every(Boolean) });
    this.requestRender();
  }
  /** Exact intensities at time t of the auto sequence (mid-ramp frames included). */
  setTime(t: number) {
    this.stopAuto();
    this.lights.forEach((l, i) => {
      this.killTween(i);
      const since = (t - AUTO_TIMES[l.id]) * 1000;
      const on = since >= 0;
      this.intensities[i] = on ? rampOn(since) : 0;
      if (on !== this.lit[i]) { this.lit[i] = on; this.emitSwitch(i, on); }
    });
    this.setFlags({ hint: false, title: t >= AUTO_TIMES.floor + 0.2, fullyLit: this.lit.every(Boolean) });
    this.requestRender();
  }

  /** Stop every tween and timer (React strict mode may call this and then reuse the instance). */
  reset() {
    this.stopAuto();
    this.lights.forEach((_, i) => this.killTween(i));
  }

  /* ───────── internals ───────── */

  private switchOn(i: number, delay: number) {
    if (this.lit[i]) return;
    this.lit[i] = true;
    this.killTween(i);
    const { gsap } = getGsap();
    const ph = this.phases[i];
    ph.v = 0;
    this.tweens[i] = gsap.to(ph, {
      v: 1,
      duration: RAMP_ON_MS / 1000,
      delay,
      ease: "none",
      onStart: () => this.emitSwitch(i, true),
      onUpdate: () => {
        this.intensities[i] = rampOn(ph.v * RAMP_ON_MS);
        this.requestRender();
      },
      onComplete: () => {
        this.intensities[i] = 1;
        this.requestRender();
        if (this.lit.every(Boolean)) this.setFlags({ fullyLit: true });
      },
    });
  }

  private switchOff(i: number) {
    if (!this.lit[i]) return;
    this.lit[i] = false;
    this.killTween(i);
    const { gsap } = getGsap();
    const ph = this.phases[i];
    const from = this.intensities[i];
    ph.v = 0;
    this.emitSwitch(i, false);
    this.tweens[i] = gsap.to(ph, {
      v: 1,
      duration: RAMP_OFF_MS / 1000,
      ease: "none",
      onUpdate: () => {
        this.intensities[i] = rampOff(ph.v * RAMP_OFF_MS, from);
        this.requestRender();
      },
      onComplete: () => { this.intensities[i] = 0; this.requestRender(); },
    });
    this.setFlags({ fullyLit: false });
  }

  private killTween(i: number) {
    this.tweens[i]?.kill();
    this.tweens[i] = null;
  }
  private emitSwitch(i: number, on: boolean) {
    const id = this.lights[i].id;
    this.switchListeners.forEach((fn) => fn(id, on));
  }
  private setFlags(partial: Partial<Flags>) {
    const next = { ...this.flags, ...partial };
    if (next.hint === this.flags.hint && next.title === this.flags.title && next.fullyLit === this.flags.fullyLit) return;
    this.flags = next;
    this.flagListeners.forEach((fn) => fn(next));
  }
}
