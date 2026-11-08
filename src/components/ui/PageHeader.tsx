"use client";
import { SwitchOn } from "@/components/light/SwitchOn";
import type { ReactNode } from "react";

/** Quiet page opener: eyebrow, large display title, optional lede and actions. Lights up on entry. */
export function PageHeader({ eyebrow, title, lede, actions, beta = false, betaLabel }: { eyebrow?: ReactNode; title: ReactNode; lede?: ReactNode; actions?: ReactNode; beta?: boolean; betaLabel?: ReactNode }) {
  return (
    <header className="container-x pt-10 pb-8 md:pt-16 md:pb-12">
      <SwitchOn glow="wash" glowSize={420} glowOffset={{ x: "12%", y: "20%" }} className="max-w-4xl">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="font-display text-4xl leading-[1.05] md:text-6xl lg:text-7xl">
          {title}
          {beta && <span className="badge-beta ms-3 align-middle">{betaLabel ?? "בטא"}</span>}
        </h1>
        {lede && <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">{lede}</p>}
        {actions && <div className="mt-7 flex flex-wrap gap-3">{actions}</div>}
      </SwitchOn>
    </header>
  );
}
