"use client";
/* Placeholder — replaced by the hero/home module. */
import { SwitchOn } from "@/components/light/SwitchOn";
import { useTx } from "@/lib/i18n";
import { TAGLINE } from "@/lib/i18n/common";

export function HomePage() {
  const t = useTx();
  return (
    <section className="container-x py-32">
      <SwitchOn glow="pool" glowSize={520} glowOffset={{ y: "80%" }}>
        <h1 className="font-display text-6xl md:text-8xl">{t(TAGLINE)}</h1>
      </SwitchOn>
    </section>
  );
}
