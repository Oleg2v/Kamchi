"use client";
import { TransitionLink } from "@/components/brand/TransitionLink";
import { SwitchOn } from "@/components/light/SwitchOn";
import { useTx } from "@/lib/i18n";

export default function NotFound() {
  const t = useTx();
  return (
    <section className="container-x grid min-h-[60dvh] place-items-center py-24 text-center">
      <SwitchOn glow="halo" glowSize={360} className="flex flex-col items-center gap-6">
        <p className="eyebrow">404</p>
        <h1 className="font-display text-5xl md:text-7xl">{t({ he: "כאן עדיין חשוך", en: "Still dark in here" })}</h1>
        <p className="max-w-md text-muted">{t({ he: "העמוד שחיפשתם לא קיים בדמו. נחזור לאולם התצוגה.", en: "That page is not part of the demo. Back to the showroom." })}</p>
        <TransitionLink href="/" className="btn btn-primary">{t({ he: "לדף הבית", en: "Home" })}</TransitionLink>
      </SwitchOn>
    </section>
  );
}
