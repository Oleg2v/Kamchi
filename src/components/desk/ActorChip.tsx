"use client";
import { useTx } from "@/lib/i18n";
import type { Actor } from "@/lib/types";

const LABEL: Record<Actor, { he: string; en: string }> = {
  designer: { he: "מעצב/ת", en: "Designer" },
  kamchi: { he: "צוות קמחי", en: "Kamchi team" },
  system: { he: "מערכת", en: "System" },
  autopilot: { he: "הדגמה", en: "Demo" },
};

/** Who did it — always in words; brass for the desk, paper for the studio. */
export function ActorChip({ actor, className = "" }: { actor: Actor; className?: string }) {
  const t = useTx();
  const tone = actor === "kamchi" ? "border-brass/70 text-brass-light" : actor === "designer" ? "text-paper" : "text-muted";
  return <span className={`chip px-2 py-0.5 text-[0.68rem] ${tone} ${className}`}>{t(LABEL[actor])}</span>;
}
