"use client";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks/useHydrated";
import type { DemoEvent } from "@/lib/types";

/**
 * Diffs event ids as they arrive (from this tab or another) and reports the ones that match,
 * for `ttl` ms — the hook behind every warm flash. The first hydrated pass only takes a
 * baseline, so persisted history never flashes.
 */
export function useNewEvents(filter: (e: DemoEvent) => boolean, opts: { ttl?: number; delay?: number } = {}) {
  const { ttl = 1200, delay = 0 } = opts;
  const events = useStore((s) => s.events);
  const hydrated = useHydrated();
  const known = useRef<Set<string> | null>(null);
  const filterRef = useRef(filter);
  filterRef.current = filter;
  const seq = useRef(0);
  const [fresh, setFresh] = useState<DemoEvent[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!hydrated) return;
    if (!known.current) {
      known.current = new Set(events.map((e) => e.id));
      return;
    }
    const added: DemoEvent[] = [];
    for (const e of events) {
      if (!known.current.has(e.id)) {
        known.current.add(e.id);
        added.push(e);
      }
    }
    const relevant = added.filter((e) => filterRef.current(e));
    if (!relevant.length) return;
    const id = ++seq.current;
    const show = () => {
      setFresh(relevant);
      setTick(id);
      setTimeout(() => {
        if (seq.current === id) setFresh([]);
      }, ttl);
    };
    if (delay > 0) setTimeout(show, delay);
    else show();
  }, [events, hydrated, ttl, delay]);

  return { fresh, tick };
}

export const isKamchiEvent = (e: DemoEvent) => e.actor === "kamchi";
export const isDesignerEvent = (e: DemoEvent) => e.actor === "designer" || e.actor === "autopilot";
