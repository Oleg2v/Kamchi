"use client";
import { TransitionLink } from "./TransitionLink";
import { Filament } from "./Logo";
import { useTx } from "@/lib/i18n";
import { ADDRESS, DEMO_BADGE, NAV, PORTAL_NAV } from "@/lib/i18n/common";
import { useStore } from "@/lib/store";

export function Footer() {
  const t = useTx();
  const reset = useStore((s) => s.resetDemo);
  return (
    <footer className="relative mt-24 border-t hairline bg-night">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <Filament size={30} />
            <span className="font-display text-2xl">{t({ he: "קמחי תאורה", en: "Kamchi Lighting" })}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            {t({
              he: "כשמונים שנה של אור. סדנה קטנה בדרום תל אביב שהפכה לבית היבוא המוביל בישראל לתאורה מעוצבת, ואולם תצוגה של 5,000 מ״ר בבני ברק.",
              en: "About eighty years of light. A small workshop in south Tel Aviv that became Israel's leading importer of designer lighting, with a 5,000 m² showroom in Bnei Brak.",
            })}
          </p>
          <p className="mt-4 text-sm text-paper">{t(ADDRESS)}</p>
          <p className="mt-1 font-mono text-xs text-muted">{t({ he: "א׳–ה׳ \u20669:00–19:00\u2069 · ו׳ \u20669:00–13:00\u2069 (הדגמה)", en: "Sun–Thu 9:00–19:00 · Fri 9:00–13:00 (demo)" })}</p>
        </div>
        <div>
          <h2 className="eyebrow mb-4">{t({ he: "האתר", en: "Site" })}</h2>
          <ul className="space-y-2 text-sm">
            {NAV.map((n) => (
              <li key={n.href}><TransitionLink href={n.href} className="text-muted hover:text-glow">{t(n.label)}</TransitionLink></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="eyebrow mb-4">{t({ he: "למעצבים", en: "For designers" })}</h2>
          <ul className="space-y-2 text-sm">
            <li><TransitionLink href={PORTAL_NAV.studio.href} className="text-muted hover:text-glow">{t(PORTAL_NAV.studio.label)}</TransitionLink></li>
            <li><TransitionLink href={PORTAL_NAV.desk.href} className="text-muted hover:text-glow">{t(PORTAL_NAV.desk.label)}</TransitionLink></li>
            <li><TransitionLink href={PORTAL_NAV.live.href} className="text-muted hover:text-glow">{t(PORTAL_NAV.live.label)}</TransitionLink></li>
            <li><TransitionLink href="/club" className="text-muted hover:text-glow">{t({ he: "מועדון האדריכלים והמעצבים", en: "Architects & designers club" })}</TransitionLink></li>
          </ul>
        </div>
        <div>
          <h2 className="eyebrow mb-4">{t({ he: "נגישות ודמו", en: "Accessibility & demo" })}</h2>
          <ul className="space-y-2 text-sm">
            <li><TransitionLink href="/accessibility" className="text-muted hover:text-glow">{t({ he: "הצהרת נגישות", en: "Accessibility statement" })}</TransitionLink></li>
            <li>
              <button type="button" onClick={() => { if (confirm(t({ he: "לאפס את כל נתוני הדמו?", en: "Reset all demo data?" }))) reset(); }} className="text-muted hover:text-glow">
                {t({ he: "איפוס דמו", en: "Reset demo" })}
              </button>
            </li>
          </ul>
          <p className="mt-6 font-mono text-[0.66rem] leading-relaxed text-brass-light">{t(DEMO_BADGE)}</p>
          <p className="mt-2 font-mono text-[0.66rem] text-muted">{t({ he: "כל המחירים הם מחירי הדגמה. שמות המותגים מופיעים כטקסט בלבד.", en: "All prices are demo prices. Brand names appear as text only." })}</p>
        </div>
      </div>
      <div className="brass-rule" />
      <div className="container-x flex flex-wrap items-center justify-between gap-2 py-4 font-mono text-[0.66rem] text-muted">
        <span>© {new Date().getFullYear()} {t({ he: "קונספט — Kikkey", en: "Concept — Kikkey" })}</span>
        <span>{t({ he: "האור נדלק", en: "The light comes on" })}</span>
      </div>
    </footer>
  );
}
