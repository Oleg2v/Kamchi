"use client";
/**
 * Captions pinned near each fixture with a thin brass leader line, like tags
 * in a lighting drawing. Identical fixtures share one caption (×2, ×3).
 * On narrow widths <CaptionList/> stacks them under the image instead.
 */
import { formatIls, tx, useLang } from "@/lib/i18n";
import { DEMO_PRICE, SHOWROOM } from "@/lib/i18n/common";
import type { LightId } from "./light-controller";
import { LIGHTS } from "./light-controller";
import type { HeroLight } from "./scene-types";
import type { CoverBox } from "./use-cover-box";

export interface CaptionGroup {
  id: string;
  members: LightId[];
  /** Where the box's top-start corner sits, as image fractions. */
  at: { x: number; y: number };
  /** Which corner of the box the leader leaves from. */
  corner: "tl" | "tr" | "bl" | "br";
  caption: HeroLight["caption"];
}

const CAPTION_W = 212;
const CAPTION_H = 128;

const groupOf = (ids: LightId[]) => LIGHTS.filter((l) => ids.includes(l.id));

export const CAPTION_GROUPS: CaptionGroup[] = [
  { id: "pendant", members: ["pendant"], at: { x: 0.155, y: 0.47 }, corner: "tl", caption: groupOf(["pendant"])[0].caption },
  { id: "sconces", members: ["sconce-l", "sconce-r"], at: { x: 0.336, y: 0.405 }, corner: "tl", caption: groupOf(["sconce-l"])[0].caption },
  { id: "spots", members: ["spot-1", "spot-2", "spot-3"], at: { x: 0.525, y: 0.185 }, corner: "tr", caption: groupOf(["spot-1"])[0].caption },
  { id: "floor", members: ["floor"], at: { x: 0.71, y: 0.3 }, corner: "bl", caption: groupOf(["floor"])[0].caption },
];

function CaptionBody({ g, lang }: { g: CaptionGroup; lang: "he" | "en" }) {
  const c = g.caption;
  // One alignment for every line (inline-start); Latin and numbers are isolated runs, never re-aligned blocks.
  return (
    <>
      <p className="eyebrow leading-none">
        <bdi>{c.brand}</bdi>
        {g.members.length > 1 && <span className="text-muted"> <bdi dir="ltr">×{g.members.length}</bdi></span>}
      </p>
      <p className="mt-1.5 text-[1.2rem] leading-tight text-paper" style={{ fontFamily: "var(--font-display-en)" }}>
        <bdi lang="en">{c.model}</bdi>
      </p>
      <p className="mt-1 text-[0.76rem] leading-snug text-muted">{tx(lang, SHOWROOM)}</p>
      <p className="mt-1.5 font-mono text-[0.74rem] leading-snug">
        <bdi className="num text-paper">{formatIls(c.price, lang)}</bdi>
        <span className="text-muted"> · {tx(lang, DEMO_PRICE)}</span>
      </p>
      <p className="font-mono text-[0.7rem] leading-snug text-muted">
        <bdi dir="ltr">{c.lumens} lm · {c.kelvin}K</bdi>
      </p>
    </>
  );
}

type Props = { box: CoverBox; lit: ReadonlySet<LightId>; instant?: boolean };

export function Captions({ box, lit, instant = false }: Props) {
  const lang = useLang();
  if (box.w <= 0) return null;
  const W = 1920, H = 1280;
  const scale = box.w / W; // px per image px

  return (
    <div className="pointer-events-none absolute" style={{ left: box.x, top: box.y, width: box.w, height: box.h }}>
      <svg aria-hidden viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full">
        {CAPTION_GROUPS.map((g) => {
          const on = g.members.some((m) => lit.has(m));
          const bx = g.at.x * W;
          const by = g.at.y * H;
          const bw = CAPTION_W / scale;
          const bh = CAPTION_H / scale;
          const cx = g.corner.endsWith("l") ? bx : bx + bw;
          const cy = g.corner.startsWith("t") ? by : by + bh;
          return (
            <g key={g.id} style={{ opacity: on ? 1 : 0, transition: `opacity ${on ? 120 : 80}ms linear` }}>
              {g.members.map((m) => {
                const l = LIGHTS.find((x) => x.id === m)!;
                const ax = l.fixtureAnchor.x * W;
                const ay = l.fixtureAnchor.y * H + (l.kind === "pendant" ? 6 : l.kind === "recessed" ? 10 : l.kind === "floor" ? 2 : 28);
                return (
                  <g key={m}>
                    <line x1={ax} y1={ay} x2={cx} y2={cy} stroke="var(--color-brass)" strokeWidth={1 / scale} strokeOpacity={0.85} vectorEffect="non-scaling-stroke" />
                    <circle cx={ax} cy={ay} r={2.4 / scale} fill="var(--color-brass)" />
                  </g>
                );
              })}
              <circle cx={cx} cy={cy} r={2.4 / scale} fill="var(--color-brass)" />
            </g>
          );
        })}
      </svg>

      {CAPTION_GROUPS.map((g) => {
        const on = g.members.some((m) => lit.has(m));
        return (
          <div
            key={g.id}
            data-caption={g.id}
            data-on={on ? "1" : "0"}
            className="absolute overflow-hidden border-s-2 border-brass py-2.5 ps-3 pe-3"
            style={{
              left: g.at.x * box.w,
              top: g.at.y * box.h,
              width: CAPTION_W,
              height: CAPTION_H,
              opacity: on ? 1 : 0,
              animation: on && !instant ? "incandescent 120ms var(--ease-incandescent) forwards" : "none",
              transition: on ? "none" : "opacity 80ms linear",
              // A small dark plate, like a tag on a lighting drawing: legible over the brightest wall.
              background: "rgb(5 5 5 / 0.72)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
            aria-hidden={!on}
          >
            <CaptionBody g={g} lang={lang} />
          </div>
        );
      })}
    </div>
  );
}

/** Narrow widths: captions as a list under the image, each switching on in turn. */
export function CaptionList({ lit, instant = false }: { lit: ReadonlySet<LightId>; instant?: boolean }) {
  const lang = useLang();
  return (
    <ol className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4" aria-label={lang === "he" ? "גופי התאורה בחדר" : "Fixtures in the room"}>
      {CAPTION_GROUPS.map((g) => {
        const on = g.members.some((m) => lit.has(m));
        return (
          <li
            key={g.id}
            data-caption={g.id}
            data-on={on ? "1" : "0"}
            className={`switch-on border-s ps-3 ${on ? "is-on border-brass/70" : "border-ash"}`}
            style={{ "--off-opacity": 0.22, animation: on && instant ? "none" : undefined } as React.CSSProperties}
          >
            <CaptionBody g={g} lang={lang} />
          </li>
        );
      })}
    </ol>
  );
}

/** One quiet mono line naming every fixture in the room — shown with the title when the tags step back. */
export function CaptionLegend({ className = "" }: { className?: string }) {
  const lang = useLang();
  return (
    <p className={`font-mono text-[0.72rem] leading-relaxed tracking-[0.04em] text-muted ${className}`}>
      <span className="text-brass-light">{lang === "he" ? "בחדר:" : "In the room:"}</span>{" "}
      {CAPTION_GROUPS.map((g, i) => (
        <span key={g.id} className="whitespace-nowrap">
          <bdi lang="en" dir="ltr">{g.caption.brand} {g.caption.model}{g.members.length > 1 ? ` ×${g.members.length}` : ""}</bdi>
          {i < CAPTION_GROUPS.length - 1 && <span aria-hidden> · </span>}
        </span>
      ))}
    </p>
  );
}

/** Phones: one line under the photograph naming the fixture that just switched on. */
export function NowLit({ lit }: { lit: ReadonlySet<LightId> }) {
  const lang = useLang();
  const order = ["floor", "spots", "sconces", "pendant"];
  const g = order.map((id) => CAPTION_GROUPS.find((x) => x.id === id)!).find((x) => x.members.some((m) => lit.has(m)));
  if (!g) return null;
  const c = g.caption;
  return (
    <p key={g.id} className="font-mono text-[0.72rem] leading-snug" style={{ animation: "incandescent 120ms var(--ease-incandescent) forwards" }} aria-live="off">
      <span className="text-brass-light"><bdi dir="ltr">{c.brand.toUpperCase()}{g.members.length > 1 ? ` ×${g.members.length}` : ""}</bdi></span>
      <span className="text-paper"> · <bdi lang="en" dir="ltr">{c.model}</bdi></span>
      <span className="text-muted"> · <bdi className="num">{formatIls(c.price, lang)}</bdi></span>
    </p>
  );
}
