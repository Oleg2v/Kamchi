"use client";
import type { ReactNode } from "react";
import { SwitchOn } from "@/components/light/SwitchOn";

/** Quiet section opener: mono eyebrow, display title, optional lede and an end-aligned action. */
export function SectionHeading({ id, eyebrow, title, lede, action }: { id: string; eyebrow?: ReactNode; title: ReactNode; lede?: ReactNode; action?: ReactNode }) {
  return (
    <SwitchOn className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between" offOpacity={0.12}>
      <div className="max-w-3xl">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 id={id} className="text-4xl leading-[1.05] md:text-5xl lg:text-6xl">{title}</h2>
        {lede && <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted md:text-lg">{lede}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </SwitchOn>
  );
}
