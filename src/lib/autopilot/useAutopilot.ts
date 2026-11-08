"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { AutopilotEngine, INITIAL_STATE, type EngineHost } from "./engine";
import { buildSteps } from "./script";

const serverState = () => INITIAL_STATE;
const zero = () => 0;

/** One engine per host component; state via useSyncExternalStore, progress on its own channel. */
export function useAutopilot(host: EngineHost) {
  const ref = useRef<AutopilotEngine | null>(null);
  if (!ref.current) ref.current = new AutopilotEngine(buildSteps());
  const engine = ref.current;
  engine.host = host;
  const state = useSyncExternalStore(engine.subscribe, engine.getState, serverState);
  // Stop on a real unmount only: React's strict-mode remount (and a Fast Refresh) re-runs this
  // effect synchronously, so a stop deferred by a tick sees the host mounted again and skips.
  const mounted = useRef(false);
  useEffect(() => {
    const e = engine;
    mounted.current = true;
    return () => {
      mounted.current = false;
      setTimeout(() => { if (!mounted.current) e.stop(); }, 0);
    };
  }, [engine]);
  return { engine, state };
}

export function useAutopilotProgress(engine: AutopilotEngine): number {
  return useSyncExternalStore(engine.subscribeProgress, engine.getProgress, zero);
}
