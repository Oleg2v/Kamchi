"use client";
import { useTx } from "@/lib/i18n";
import { PROJECT_STATUS_LABEL } from "@/lib/i18n/common";
import type { ProjectStatus } from "@/lib/types";

/** Project status as a chip. Warm only while something is waiting on the other side. */
export function StatusChip({ status, className = "" }: { status: ProjectStatus; className?: string }) {
  const t = useTx();
  const live = status === "quote_requested" || status === "quoted";
  return <span className={`chip ${live ? "is-on" : ""} ${className}`}>{t(PROJECT_STATUS_LABEL[status])}</span>;
}
