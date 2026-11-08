"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearParams,
  parseParams,
  removeChip,
  serializeParams,
  toggleValue,
  type ActiveChip,
  type CatalogParams,
  type FacetKey,
  type SortKey,
} from "@/lib/catalog/filter";

/**
 * Catalogue state lives in the URL, so /catalog?brand=artemide works from anywhere.
 * Writes go through the native history API (Next syncs useSearchParams with
 * pushState/replaceState), so a chip never waits for a server round-trip; a thin
 * optimistic layer keeps the grid instant while the router state catches up.
 */
export function useCatalogParams() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const fromUrl = useMemo(() => parseParams(sp), [sp]);
  const [params, setParams] = useState<CatalogParams>(fromUrl);
  const pending = useRef<string | null>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Follow the URL (back/forward, external links) unless we are mid-flight on our own change.
  useEffect(() => {
    const ser = serializeParams(fromUrl);
    if (pending.current === null || pending.current === ser) {
      pending.current = null;
      if (pendingTimer.current) { clearTimeout(pendingTimer.current); pendingTimer.current = null; }
      setParams(fromUrl);
    }
  }, [fromUrl]);

  const commit = useCallback(
    (next: CatalogParams) => {
      setParams(next);
      const ser = serializeParams(next);
      pending.current = ser;
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
      pendingTimer.current = setTimeout(() => { pending.current = null; }, 2500);
      if (typeof window !== "undefined") window.history.replaceState(null, "", `${pathname}${ser}`);
    },
    [pathname],
  );

  const ref = useRef(params);
  ref.current = params;

  const toggle = useCallback(<K extends FacetKey>(key: K, value: CatalogParams[K][number]) => commit(toggleValue(ref.current, key, value)), [commit]);
  const setPrice = useCallback((min: number | undefined, max: number | undefined) => commit({ ...ref.current, min, max }), [commit]);
  const setQuery = useCallback((q: string) => commit({ ...ref.current, q }), [commit]);
  const setSort = useCallback((sort: SortKey) => commit({ ...ref.current, sort }), [commit]);
  const remove = useCallback((chip: ActiveChip) => commit(removeChip(ref.current, chip)), [commit]);
  const clear = useCallback(() => commit(clearParams(ref.current)), [commit]);

  return { params, toggle, setPrice, setQuery, setSort, remove, clear };
}
