"use client";
import { useStore, selectHydrated } from "../store";
export function useHydrated(): boolean {
  return useStore(selectHydrated);
}
