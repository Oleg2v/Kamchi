"use client";
import { SwitchOn } from "@/components/light/SwitchOn";
import { useLang } from "@/lib/i18n";
import type { ReactNode } from "react";

/** Quiet page opener: eyebrow, large display title, optional lede and actions. Lights up on entry. */
export function PageHeader({ eyebrow, title, lede, actions, beta = false, betaLabel }: { eyebrow?: ReactNode; title: ReactNode; lede?: ReactNode; actions?: ReactNode; beta?: boolean; betaLabel?: ReactNode }) {
  const lang = useLang();
  // Glow is positioned physically; keep the wash at the inline-start of the title in both directions.
  const washX = lang === "he" ? "88%" : "12%";
  return (
    <header className="container-x pt-10 pb-8 md:pt-16 md:pb-12">
      <SwitchOn glow="wash" glowSize={420} glowOffset={{ x: washX, y: "20%" }} className="max-w-4xl">
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
