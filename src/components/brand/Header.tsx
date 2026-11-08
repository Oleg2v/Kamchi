"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { TransitionLink } from "./TransitionLink";
import { KelvinToggle } from "@/components/light/KelvinToggle";
import { useStore, useModeStore, selectCartCount, selectUnseenForDesk, selectUnseenForDesigner } from "@/lib/store";
import { useTx } from "@/lib/i18n";
import { NAV, PORTAL_NAV } from "@/lib/i18n/common";
import { useHydrated } from "@/lib/hooks/useHydrated";

function ModeSwitch() {
  const t = useTx();
  const mode = useModeStore((s) => s.mode);
  const setMode = useModeStore((s) => s.setMode);
  return (
    <div role="radiogroup" aria-label={t({ he: "מצב תצוגה", en: "View mode" })} className="inline-flex border hairline text-[0.78rem]">
      {(["designer", "kamchi"] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          onClick={() => setMode(m)}
          className={`px-2.5 py-1.5 transition-colors ${mode === m ? "bg-paper text-night" : "text-muted hover:text-paper"}`}
        >
          {m === "designer" ? t({ he: "מעצב", en: "Designer" }) : t({ he: "צוות קמחי", en: "Kamchi team" })}
        </button>
      ))}
    </div>
  );
}

function LangToggle() {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "he" ? "en" : "he")}
      className="font-mono text-[0.72rem] tracking-wider text-muted hover:text-paper border hairline px-2.5 py-1.5"
      aria-label={lang === "he" ? "Switch to English" : "עברית"}
      lang={lang === "he" ? "en" : "he"}
    >
      {lang === "he" ? "EN" : "עב"}
    </button>
  );
}

function AllLitToggle({ compact = false }: { compact?: boolean }) {
  const t = useTx();
  const allLit = useStore((s) => s.allLit);
  const setAllLit = useStore((s) => s.setAllLit);
  return (
    <button
      type="button"
      aria-pressed={allLit}
      onClick={() => setAllLit(!allLit)}
      className={`inline-flex items-center gap-2 border px-2.5 py-1.5 text-[0.78rem] transition-colors ${allLit ? "border-glow text-glow shadow-glow" : "hairline text-muted hover:text-paper"}`}
      aria-label={t({ he: "הכול דלוק", en: "All lit" })}
      title={t({ he: "להדליק את כל האלמנטים בבת אחת, בלי לחכות לאנימציות", en: "Light every element at once, without waiting for animations" })}
      data-autopilot="all-lit"
    >
      <span aria-hidden className={`h-2 w-2 rounded-full ${allLit ? "bg-glow" : "bg-ash"}`} />
      <span className={compact ? "hidden xl:inline" : ""}>{t({ he: "הכול דלוק", en: "All lit" })}</span>
    </button>
  );
}

export function Header() {
  const t = useTx();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const mode = useModeStore((s) => s.mode);
  const cartCount = useStore(selectCartCount);
  const unseenDesk = useStore(selectUnseenForDesk);
  const unseenDesigner = useStore(selectUnseenForDesigner);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);

  const portal = mode === "kamchi" ? PORTAL_NAV.desk : PORTAL_NAV.studio;
  const unseen = mode === "kamchi" ? unseenDesk : unseenDesigner;
  const isLive = pathname === "/live";

  return (
    <header
      className={`sticky top-0 z-[60] transition-colors duration-300 ${scrolled || open ? "bg-night/85 backdrop-blur border-b hairline" : "bg-transparent"}`}
      style={{ minHeight: "var(--header-h)" }}
    >
      <div className="container-x flex items-center justify-between gap-4" style={{ height: "var(--header-h)" }}>
        <Logo />

        <nav aria-label={t({ he: "ניווט ראשי", en: "Main navigation" })} className="hidden lg:flex items-center gap-5 text-[0.9rem] whitespace-nowrap">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <TransitionLink key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={`relative py-2 transition-colors ${active ? "text-glow" : "text-muted hover:text-paper"}`}>
                {t(n.label)}
                {active && <span aria-hidden className="absolute inset-x-0 -bottom-0.5 h-px bg-glow shadow-glow" />}
              </TransitionLink>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-2.5 whitespace-nowrap">
          <KelvinToggle compact />
          <AllLitToggle compact />
          <LangToggle />
          <ModeSwitch />
          <TransitionLink href={portal.href} className={`relative border px-2.5 py-1.5 text-[0.78rem] ${pathname.startsWith(portal.href) ? "border-glow text-glow" : "hairline text-paper hover:border-glow"}`}>
            {t(portal.label)}
            {hydrated && unseen > 0 && (
              <span className="absolute -top-1.5 -inset-inline-end-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-glow px-1 font-mono text-[0.6rem] text-night">{unseen}</span>
            )}
          </TransitionLink>
          <TransitionLink href="/live" className={`inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[0.78rem] ${isLive ? "border-brass text-brass-light" : "hairline text-muted hover:text-paper"}`}>
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brass animate-pulse-dot" />
            {t(PORTAL_NAV.live.label)}
          </TransitionLink>
          <TransitionLink href="/cart" aria-label={t({ he: "סל", en: "Cart" })} className="relative border hairline px-2.5 py-1.5 text-[0.78rem] text-muted hover:text-paper">
            {t({ he: "סל", en: "Cart" })}
            {hydrated && cartCount > 0 && <span className="ms-1.5 font-mono text-glow">{cartCount}</span>}
          </TransitionLink>
        </div>

        <div className="flex lg:hidden items-center gap-2">
          <AllLitToggle compact />
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="border hairline px-3 py-1.5 text-[0.8rem]"
          >
            {open ? t({ he: "סגירה", en: "Close" }) : t({ he: "תפריט", en: "Menu" })}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="lg:hidden fixed inset-x-0 bottom-0 top-[var(--header-h)] z-[60] overflow-y-auto bg-night/95 backdrop-blur">
          <div className="container-x py-6 flex flex-col gap-6">
            <nav aria-label={t({ he: "ניווט", en: "Navigation" })} className="flex flex-col divide-y hairline border-y hairline">
              {NAV.map((n) => (
                <TransitionLink key={n.href} href={n.href} className="py-4 font-display text-2xl text-paper">{t(n.label)}</TransitionLink>
              ))}
              <TransitionLink href={portal.href} className="py-4 font-display text-2xl text-glow">{t(portal.label)}</TransitionLink>
              <TransitionLink href="/live" className="py-4 font-display text-2xl text-brass-light">{t(PORTAL_NAV.live.label)}</TransitionLink>
              <TransitionLink href="/cart" className="py-4 font-display text-2xl text-paper">{t({ he: "סל", en: "Cart" })} {hydrated && cartCount > 0 && <span className="font-mono text-base text-glow">{cartCount}</span>}</TransitionLink>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <KelvinToggle />
              <LangToggle />
              <ModeSwitch />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
