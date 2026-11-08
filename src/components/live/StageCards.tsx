"use client";
import { useEffect, useState, type CSSProperties } from "react";
import { RoomScene } from "@/components/hero/RoomScene";
import { FixtureArt } from "@/components/light/FixtureArt";
import { AUTOPILOT_FIXTURE_ID, AUTOPILOT_PROJECT_ID, AUTOPILOT_ROOM_ID } from "@/lib/autopilot";
import { getBrand, getFixture } from "@/lib/data";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { formatIls, useLang, useTx } from "@/lib/i18n";
import { BETA, SIMULATION } from "@/lib/i18n/common";
import { useStore } from "@/lib/store";

/** Step 1 — the room from the home page, lighting up by itself inside a card. */
export function RoomStage({ renderer }: { renderer?: "webgl" | "video" | "css" }) {
  const t = useTx();
  const [lit, setLit] = useState(false);
  return (
    <section className="panel overflow-hidden" aria-label={t({ he: "החדר נדלק", en: "The room lights up" })} data-autopilot="stage:room">
      <header className="flex items-center justify-between gap-3 border-b hairline px-4 py-2.5">
        <p className="eyebrow">{t({ he: "האור נדלק", en: "Lights on" })}</p>
        <span className={`num text-[0.68rem] ${lit ? "text-glow" : "text-muted"}`} dir="ltr">{lit ? "7 / 7" : "… / 7"}</span>
      </header>
      <RoomScene mode="auto" compact renderer={renderer} onFullyLit={() => setLit(true)} />
      <p className="px-4 py-2.5 text-[0.78rem] text-muted">{t({ he: "סלון בפרויקט של קמחי תאורה — שבעה גופים נדלקים בזה אחר זה.", en: "A living room from a Kamchi project — seven fixtures switching on one after another." })}</p>
    </section>
  );
}

/**
 * Step 2 — "light my living room" as a preview card: the room photograph, dark, with the chosen
 * pendant drawn over the dining table and a pool of light switching on under it. No AI call.
 */
export function RelightStage({ onAdd }: { onAdd?: () => void }) {
  const t = useTx();
  const lang = useLang();
  const reduced = useReducedMotion();
  const addItemToRoom = useStore((s) => s.addItemToRoom);
  const [lit, setLit] = useState(reduced);
  const fixture = getFixture(AUTOPILOT_FIXTURE_ID);

  useEffect(() => {
    if (reduced) { setLit(true); return; }
    const id = setTimeout(() => setLit(true), 900);
    return () => clearTimeout(id);
  }, [reduced]);

  if (!fixture) return null;
  const brand = getBrand(fixture.brand);
  const add = () => {
    addItemToRoom(AUTOPILOT_PROJECT_ID, AUTOPILOT_ROOM_ID, fixture.id, 1);
    onAdd?.();
  };

  return (
    <section className="panel overflow-hidden" aria-label={t({ he: "תאירו לי את הסלון — הדמיה", en: "Light my living room — simulation" })} data-autopilot="stage:relight">
      <header className="flex items-center justify-between gap-3 border-b hairline px-4 py-2.5">
        <p className="eyebrow">{t({ he: "תאירו לי את הסלון", en: "Light my living room" })}</p>
        <span className="flex gap-1.5">
          <span className="badge-beta">{t(BETA)}</span>
          <span className="badge-beta">{t(SIMULATION)}</span>
        </span>
      </header>
      <div className="relative aspect-[3/2] overflow-hidden bg-night @container" dir="ltr" data-lit={lit ? "1" : "0"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero/room.jpg" alt="" aria-hidden className="live-relight__photo absolute inset-0 h-full w-full object-cover" style={{ filter: lit ? "brightness(0.46) saturate(0.9)" : "brightness(0.12) saturate(0.6)" }} />
        {lit && (
          <span
            aria-hidden
            className={`glow glow--pool ${reduced ? "" : "switch-on is-on"}`}
            style={{ left: "27%", top: "75%", "--glow-size": "72cqw", "--glow-opacity": 0.95 } as CSSProperties}
          />
        )}
        <span aria-hidden className="absolute top-0 w-px bg-[#2a2a2a]" style={{ left: "27%", height: "11%" }} />
        <div className={`absolute ${lit && !reduced ? "animate-incandescent" : ""}`} style={{ left: "27%", top: "10%", width: "34%", translate: "-50% 0" }}>
          <FixtureArt fixture={fixture} lit={lit} cast suspension />
        </div>
        <span className="absolute bottom-3 left-3 border hairline bg-night/75 px-2 py-0.5 font-mono text-[0.62rem] tracking-widest text-muted backdrop-blur" dir="ltr">
          {brand?.name ?? fixture.brand} · {fixture.name} · {fixture.lumens} lm · {fixture.kelvin[0]}K
        </span>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="eyebrow">{brand?.name ?? fixture.brand}</p>
          <p className="truncate text-paper">
            <span lang="en">{fixture.name}</span>
            <span className="ms-2 text-sm text-muted">{fixture.nameHe}</span>
          </p>
          <p className="num text-xs text-muted" dir="ltr">{formatIls(fixture.price, lang)} · {fixture.lumens} lm · {fixture.kelvin.join("/")}K · CRI {fixture.cri}</p>
        </div>
        <button type="button" className="btn btn-sm btn-brass" onClick={add} data-autopilot="relight-add">
          {t({ he: "הוספה ללוח הפרויקט", en: "Add to the project board" })}
        </button>
      </footer>
    </section>
  );
}
