"use client";
/**
 * A drawn, plan-like diagram of the showroom floor: hairline walls on black,
 * and the fixtures as dots that switch on one after another. Not a map, not
 * a measured drawing — labelled הדגמה.
 */
import { useId } from "react";
import { useMedia } from "@/lib/hooks/useMedia";
import { useLang, useTx, type Bi } from "@/lib/i18n";

type Room = { id: string; x1: number; y1: number; x2: number; y2: number; label: Bi };

const ROOMS: Room[] = [
  { id: "living", x1: 20, y1: 20, x2: 260, y2: 170, label: { he: "סלון", en: "Living room" } },
  { id: "dining", x1: 260, y1: 20, x2: 430, y2: 170, label: { he: "פינת אוכל", en: "Dining" } },
  { id: "kitchen", x1: 430, y1: 20, x2: 620, y2: 170, label: { he: "מטבח", en: "Kitchen" } },
  { id: "bedroom", x1: 20, y1: 170, x2: 200, y2: 300, label: { he: "חדר שינה", en: "Bedroom" } },
  { id: "bath", x1: 200, y1: 170, x2: 300, y2: 300, label: { he: "חדר רחצה", en: "Bathroom" } },
  { id: "tech", x1: 300, y1: 170, x2: 470, y2: 300, label: { he: "תאורה אדריכלית", en: "Architectural" } },
  { id: "outdoor", x1: 470, y1: 170, x2: 620, y2: 380, label: { he: "חוץ ומרפסת", en: "Outdoor" } },
  { id: "desk", x1: 20, y1: 300, x2: 240, y2: 380, label: { he: "דלפק ייעוץ", en: "Consulting desk" } },
  { id: "entrance", x1: 240, y1: 300, x2: 400, y2: 380, label: { he: "כניסה", en: "Entrance" } },
  { id: "store", x1: 400, y1: 300, x2: 470, y2: 380, label: { he: "מחסן", en: "Store" } },
];

/** Fixture points: [x, y, radius]. Order = switch-on order. */
const DOTS: [number, number, number][] = [
  [320, 340, 3.2],                           // entrance
  [90, 322, 2.6], [170, 322, 2.6],           // desk
  [80, 62, 2.6], [200, 62, 2.6], [140, 100, 4], [80, 136, 2.6], [200, 136, 2.6], // living
  [310, 98, 3], [345, 98, 3], [380, 98, 3],  // dining
  [470, 138, 2.6], [580, 138, 2.6],          // kitchen downlights
  [60, 240, 3], [160, 240, 3],               // bedroom bedside
  [250, 236, 2.6],                           // bath
  [340, 272, 2.4], [385, 272, 2.4], [430, 272, 2.4], // tech recessed
];
const TRACK_HEADS = [345, 375, 405, 435];

export function ShowroomPlan({ lit }: { lit: boolean }) {
  const t = useTx();
  const lang = useLang();
  const uid = useId().replace(/:/g, "");
  // The SVG scales with its viewBox, so type and dots grow on narrow screens to stay legible.
  const small = useMedia("(max-width: 767px)");
  const fs = small ? 17 : 12;
  const sc = small ? 1.45 : 1;
  const glow = "rgb(var(--glow-rgb))";
  const ash = "var(--color-ash)";
  const wall = "color-mix(in oklab, var(--color-ash) 85%, transparent)";
  const dot = lit ? glow : ash;
  const delay = (i: number) => ({ animationDelay: `${120 + i * 70}ms` });
  const labelStyle = { fontFamily: "var(--font-ui)", fontSize: fs, fill: "var(--color-muted)" } as const;
  let k = 0;

  return (
    <svg
      viewBox="0 0 640 400"
      className="block h-auto w-full"
      role="img"
      aria-label={t({ he: "תוכנית קומה סכמטית של אולם התצוגה — הדגמה, לא תוכנית מדידה", en: "Schematic floor plan of the showroom — a demo, not a measured drawing" })}
      data-lit={lit ? "1" : "0"}
    >
      <defs>
        <radialGradient id={`${uid}-halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.55" />
          <stop offset="55%" stopColor={glow} stopOpacity="0.1" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}-bloom`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      {/* Outer shell */}
      <rect x={20} y={20} width={600} height={360} fill="none" stroke="color-mix(in oklab, var(--color-paper) 35%, transparent)" strokeWidth={1.5} />
      {/* Partitions */}
      {ROOMS.map((r) => (
        <rect key={r.id} x={r.x1} y={r.y1} width={r.x2 - r.x1} height={r.y2 - r.y1} fill="none" stroke={wall} strokeWidth={1} />
      ))}
      {/* Entrance: a door swing in the bottom wall */}
      <line x1={300} y1={380} x2={340} y2={380} stroke="var(--color-night)" strokeWidth={3} />
      <path d="M 300 380 A 40 40 0 0 1 340 340" fill="none" stroke="var(--color-brass)" strokeWidth={1} />
      <line x1={340} y1={340} x2={340} y2={380} stroke="var(--color-brass)" strokeWidth={1} />

      {/* Furniture hairlines: dining table, bed, desk */}
      <rect x={292} y={84} width={106} height={28} fill="none" stroke={wall} strokeDasharray="2 3" />
      <rect x={72} y={200} width={76} height={82} fill="none" stroke={wall} strokeDasharray="2 3" />
      <rect x={60} y={338} width={140} height={22} fill="none" stroke={wall} strokeDasharray="2 3" />

      {/* Room labels */}
      {ROOMS.map((r) => (
        <text key={`${r.id}-l`} x={(r.x1 + r.x2) / 2} y={r.y1 + 6 + fs} textAnchor="middle" style={labelStyle}>
          {t(r.label)}
        </text>
      ))}

      {/* Kitchen linear bar */}
      <g className="c-plan-dot" data-lit={lit ? "1" : "0"} style={delay(k++)}>
        <line x1={462} y1={70} x2={588} y2={70} stroke={dot} strokeWidth={6} opacity={0.35} filter={lit ? `url(#${uid}-bloom)` : undefined} />
        <line x1={462} y1={70} x2={588} y2={70} stroke={dot} strokeWidth={2} />
      </g>
      {/* Architectural track with four heads */}
      <g className="c-plan-dot" data-lit={lit ? "1" : "0"} style={delay(k++)}>
        <line x1={330} y1={204} x2={450} y2={204} stroke={lit ? "color-mix(in oklab, var(--color-paper) 60%, transparent)" : ash} strokeWidth={1.5} />
        {TRACK_HEADS.map((x) => (
          <g key={x}>
            <circle cx={x} cy={210} r={9} fill={`url(#${uid}-halo)`} opacity={lit ? 1 : 0} />
            <rect x={x - 2 * sc} y={205} width={4 * sc} height={7 * sc} fill={dot} />
          </g>
        ))}
      </g>
      {/* Outdoor bollards */}
      {[[500, 222], [562, 262], [500, 334], [580, 352]].map(([x, y], i) => (
        <g key={`b-${i}`} className="c-plan-dot" data-lit={lit ? "1" : "0"} style={delay(k++)}>
          <circle cx={x} cy={y} r={14} fill={`url(#${uid}-halo)`} opacity={lit ? 1 : 0} />
          <rect x={x - 3 * sc} y={y - 3 * sc} width={6 * sc} height={6 * sc} fill={dot} />
        </g>
      ))}
      {/* Point fixtures */}
      {DOTS.map(([x, y, r], i) => (
        <g key={`d-${i}`} className="c-plan-dot" data-lit={lit ? "1" : "0"} style={delay(k++)}>
          <circle cx={x} cy={y} r={r * sc * 5.5} fill={`url(#${uid}-halo)`} opacity={lit ? 1 : 0} />
          <circle cx={x} cy={y} r={r * sc} fill={dot} filter={lit ? `url(#${uid}-bloom)` : undefined} />
          <circle cx={x} cy={y} r={r * sc * 0.6} fill={lit ? "var(--color-paper)" : ash} />
        </g>
      ))}

      {/* Caption */}
      <text x={lang === "he" ? 612 : 28} y={394} textAnchor={lang === "he" ? "end" : "start"} style={{ fontFamily: "var(--font-mono)", fontSize: small ? 12 : 8.5, letterSpacing: 1.2, fill: "var(--color-brass-light)" }}>
        {t({ he: "תוכנית קומה סכמטית · הדגמה", en: "SCHEMATIC FLOOR PLAN · DEMO" })}
      </text>
    </svg>
  );
}
