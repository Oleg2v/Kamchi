"use client";
import { useTx } from "@/lib/i18n";
import { BETA, SIMULATION } from "@/lib/i18n/common";
import type { AiEnvelope } from "@/lib/types";

/** Honest labelling under every AI result: beta badge, source, model name, notice text, timing. */
export function AiNotice<T>({ envelope, ms, className = "" }: { envelope: AiEnvelope<T>; ms?: number; className?: string }) {
  const t = useTx();
  const total = ms ?? envelope.ms;
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 border-t hairline pt-3 text-[0.78rem] leading-relaxed text-muted ${className}`}>
      <span className="badge-beta">{t(BETA)} · {envelope.source === "model" ? t({ he: "מודל", en: "Model" }) : t(SIMULATION)}</span>
      <span className="flex-1 basis-56">{t(envelope.notice)}</span>
      <span className="font-mono text-[0.7rem] tracking-wider text-brass-light" dir="ltr">
        {envelope.source === "model" && envelope.model ? `${envelope.model} · ` : ""}
        {Math.round(total)} ms
      </span>
    </div>
  );
}
