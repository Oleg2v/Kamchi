"use client";
import { useId, type CSSProperties } from "react";
import type { Fixture } from "@/lib/types";

type Props = {
  fixture: Pick<Fixture, "art" | "type" | "name">;
  /** Switched on? */
  lit?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Render size hint (px); the SVG is responsive regardless. */
  size?: number;
  /** Draw the cast light (pool/cone) below the fixture as part of the art. */
  cast?: boolean;
  /** Show the suspension/cord above pendants. */
  suspension?: boolean;
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/**
 * Procedural fixture portraits on black. There are no brand press photos in the demo:
 * every piece is drawn from its FixtureArt parameters, and lights up with the site.
 * ViewBox is 200×260: fixtures hang from the top, cast light to the bottom.
 */
export function FixtureArt({ fixture, lit = false, className = "", style, cast = true, suspension = true }: Props) {
  const uid = useId().replace(/:/g, "");
  const { art } = fixture;
  const W = 200, H = 260;
  const cx = W / 2;
  const w = clamp(art.width, 0.1, 1) * 150;
  const h = clamp(art.height, 0.1, 1) * 120;
  const drop = clamp(art.drop, 0, 1) * 90;
  const body = art.body;
  const glow = "rgb(var(--glow-rgb))";
  const emissive = lit ? glow : "#1b1b1b";
  const emissiveFaint = lit ? `rgb(var(--glow-rgb) / 0.35)` : "#161616";
  const castOpacity = lit ? 1 : 0;
  const bodyStroke = lit ? "rgb(var(--glow-rgb) / 0.35)" : "#2a2a2a";
  const filterGlow = lit ? `url(#${uid}-bloom)` : undefined;

  const top = 10; // suspension start
  const headY = suspension ? top + drop : 24; // where the shade begins

  // Cast light geometry (below the fixture)
  const castTop = headY + h;
  const poolY = H - 22;

  let bodyEl: React.ReactNode = null;
  let castEl: React.ReactNode = null;

  const pool = (cxp: number, cyp: number, rx: number, ry: number, o = 1) => (
    <ellipse cx={cxp} cy={cyp} rx={rx} ry={ry} fill={`url(#${uid}-pool)`} opacity={castOpacity * o} />
  );
  const cone = (x0: number, y0: number, halfTop: number, halfBottom: number, y1: number, o = 1) => (
    <polygon points={`${x0 - halfTop},${y0} ${x0 + halfTop},${y0} ${x0 + halfBottom},${y1} ${x0 - halfBottom},${y1}`} fill={`url(#${uid}-cone)`} opacity={castOpacity * o} />
  );
  const cord = (x: number, y0: number, y1: number) => <line x1={x} y1={y0} x2={x} y2={y1} stroke={lit ? "#5a5248" : "#2a2a2a"} strokeWidth={1.2} />;

  switch (art.kind) {
    case "dome": {
      bodyEl = (
        <g>
          {suspension && cord(cx, top, headY)}
          <path d={`M ${cx - w / 2} ${headY + h} A ${w / 2} ${h} 0 0 1 ${cx + w / 2} ${headY + h} Z`} fill={body} stroke={bodyStroke} />
          <ellipse cx={cx} cy={headY + h} rx={w / 2} ry={Math.max(4, w * 0.09)} fill={emissive} filter={filterGlow} />
        </g>
      );
      castEl = (
        <g>
          {cone(cx, castTop, w / 2, Math.min(95, w * 0.95), poolY, 0.9)}
          {pool(cx, poolY, Math.min(95, w * 0.95), 10)}
        </g>
      );
      break;
    }
    case "cone": {
      bodyEl = (
        <g>
          {suspension && cord(cx, top, headY)}
          <polygon points={`${cx - w * 0.12},${headY} ${cx + w * 0.12},${headY} ${cx + w / 2},${headY + h} ${cx - w / 2},${headY + h}`} fill={body} stroke={bodyStroke} />
          <ellipse cx={cx} cy={headY + h} rx={w / 2} ry={Math.max(4, w * 0.08)} fill={emissive} filter={filterGlow} />
        </g>
      );
      castEl = (
        <g>
          {cone(cx, castTop, w / 2, Math.min(90, w * 0.8 + 20), poolY, 0.9)}
          {pool(cx, poolY, Math.min(90, w * 0.8 + 20), 9)}
        </g>
      );
      break;
    }
    case "globe": {
      const r = Math.min(w, h) / 2 + 8;
      const cy = headY + r;
      bodyEl = (
        <g>
          {suspension && cord(cx, top, headY)}
          <circle cx={cx} cy={cy} r={r} fill={lit ? `url(#${uid}-globe)` : "#121212"} stroke={bodyStroke} filter={filterGlow} />
          <circle cx={cx - r * 0.35} cy={cy - r * 0.35} r={r * 0.18} fill={lit ? "rgb(255 255 255 / 0.35)" : "rgb(255 255 255 / 0.04)"} />
          <circle cx={cx} cy={headY + 2} r={3} fill={body} />
        </g>
      );
      castEl = <g>{pool(cx, cy + r + 8, r * 1.1, 6, 0.5)}<circle cx={cx} cy={cy} r={r * 1.7} fill={`url(#${uid}-halo)`} opacity={castOpacity * 0.9} /></g>;
      break;
    }
    case "cylinder": {
      const cw = Math.max(14, w * 0.45);
      bodyEl = (
        <g>
          {suspension && cord(cx, top, headY)}
          <rect x={cx - cw / 2} y={headY} width={cw} height={h} fill={body} stroke={bodyStroke} />
          <ellipse cx={cx} cy={headY + h} rx={cw / 2} ry={Math.max(3, cw * 0.14)} fill={emissive} filter={filterGlow} />
          <ellipse cx={cx} cy={headY} rx={cw / 2} ry={Math.max(3, cw * 0.14)} fill={emissiveFaint} />
        </g>
      );
      castEl = (
        <g>
          {cone(cx, castTop, cw / 2, Math.min(80, cw + 40), poolY, 0.85)}
          {pool(cx, poolY, Math.min(80, cw + 40), 8)}
        </g>
      );
      break;
    }
    case "disc": {
      const ry = Math.max(5, h * 0.12);
      bodyEl = (
        <g>
          {suspension && cord(cx, top, headY)}
          <ellipse cx={cx} cy={headY + ry} rx={w / 2} ry={ry} fill={body} stroke={bodyStroke} />
          <ellipse cx={cx} cy={headY + ry + 3} rx={w / 2 - 3} ry={ry * 0.8} fill={emissive} filter={filterGlow} />
        </g>
      );
      castEl = <g>{cone(cx, headY + ry * 2, w / 2, w / 2 + 25, poolY, 0.5)}{pool(cx, poolY, w / 2 + 25, 10, 0.8)}</g>;
      break;
    }
    case "ring": {
      const r = w / 2;
      const ry = r * 0.28;
      const cy = headY + ry + 4;
      bodyEl = (
        <g>
          {suspension && (<>{cord(cx - r * 0.7, top, cy - ry * 0.7)}{cord(cx + r * 0.7, top, cy - ry * 0.7)}</>)}
          <ellipse cx={cx} cy={cy} rx={r} ry={ry} fill="none" stroke={body} strokeWidth={Math.max(5, r * 0.12)} />
          <ellipse cx={cx} cy={cy} rx={r} ry={ry} fill="none" stroke={emissive} strokeWidth={Math.max(2, r * 0.05)} filter={filterGlow} />
        </g>
      );
      castEl = <g>{cone(cx, cy + ry, r, r + 18, poolY, 0.45)}{pool(cx, poolY, r + 18, 10, 0.8)}</g>;
      break;
    }
    case "cluster": {
      const n = clamp(art.count, 3, 12);
      const items = Array.from({ length: n }, (_, i) => {
        const t = i / n;
        const ang = t * Math.PI * 2 + 0.6;
        const rad = (w / 2) * (0.35 + 0.65 * ((i * 7) % n) / n);
        const x = cx + Math.cos(ang) * rad;
        const dy = ((i * 13) % 5) / 5;
        const y = headY + 18 + dy * (h + 20);
        const r = 7 + ((i * 5) % 4) * 2.5;
        return { x, y, r };
      });
      bodyEl = (
        <g>
          {items.map((it, i) => (<g key={`c${i}`}>{cord(it.x, top, it.y - it.r)}</g>))}
          <rect x={cx - w * 0.4} y={top - 4} width={w * 0.8} height={4} fill={body} />
          {items.map((it, i) => (
            <circle key={i} cx={it.x} cy={it.y} r={it.r} fill={lit ? `url(#${uid}-globe)` : "#121212"} stroke={bodyStroke} filter={filterGlow} />
          ))}
        </g>
      );
      castEl = <g><ellipse cx={cx} cy={headY + h / 2 + 20} rx={w * 0.7} ry={h * 0.6 + 20} fill={`url(#${uid}-halo)`} opacity={castOpacity * 0.8} />{pool(cx, poolY, w * 0.65, 9, 0.6)}</g>;
      break;
    }
    case "cascade": {
      const n = clamp(art.count, 3, 24);
      const strands = Array.from({ length: n }, (_, i) => {
        const x = cx - w / 2 + (w * (i + 0.5)) / n;
        const len = h * (0.5 + 0.5 * Math.abs(Math.sin(i * 1.7)));
        return { x, len };
      });
      bodyEl = (
        <g>
          <ellipse cx={cx} cy={top + 2} rx={w / 2 + 4} ry={4} fill={body} />
          {strands.map((s, i) => (
            <g key={i}>
              <line x1={s.x} y1={top + 4} x2={s.x} y2={top + 4 + s.len} stroke={lit ? "rgb(var(--glow-rgb) / 0.75)" : "#2c2c2c"} strokeWidth={1.4} filter={filterGlow} />
              {Array.from({ length: 4 }, (_, k) => (
                <circle key={k} cx={s.x} cy={top + 10 + (s.len * (k + 1)) / 5} r={2.2} fill={lit ? glow : "#333"} />
              ))}
            </g>
          ))}
        </g>
      );
      castEl = <g><ellipse cx={cx} cy={top + h * 0.55} rx={w * 0.7} ry={h * 0.7} fill={`url(#${uid}-halo)`} opacity={castOpacity * 0.7} />{pool(cx, poolY, w * 0.7, 10, 0.6)}</g>;
      break;
    }
    case "bar": {
      const bw = Math.max(80, w * 1.2);
      const bh = Math.max(6, h * 0.12);
      bodyEl = (
        <g>
          {suspension && (<>{cord(cx - bw * 0.4, top, headY)}{cord(cx + bw * 0.4, top, headY)}</>)}
          <rect x={cx - bw / 2} y={headY} width={bw} height={bh} fill={body} stroke={bodyStroke} />
          <rect x={cx - bw / 2 + 2} y={headY + bh - 2} width={bw - 4} height={3} fill={emissive} filter={filterGlow} />
        </g>
      );
      castEl = <g><polygon points={`${cx - bw / 2},${headY + bh} ${cx + bw / 2},${headY + bh} ${cx + bw / 2 + 14},${poolY} ${cx - bw / 2 - 14},${poolY}`} fill={`url(#${uid}-cone)`} opacity={castOpacity * 0.8} />{pool(cx, poolY, bw / 2 + 14, 8)}</g>;
      break;
    }
    case "arc": {
      const baseY = H - 30;
      const baseX = cx - w * 0.45;
      const headX = cx + w * 0.4;
      const headYy = 60 + (1 - art.height) * 40;
      bodyEl = (
        <g>
          <ellipse cx={baseX} cy={baseY} rx={22} ry={5} fill={body} stroke={bodyStroke} />
          <path d={`M ${baseX} ${baseY} C ${baseX} ${headYy - 40}, ${headX} ${headYy - 50}, ${headX} ${headYy}`} fill="none" stroke={body} strokeWidth={3} />
          <path d={`M ${headX - 20} ${headYy} A 20 18 0 0 0 ${headX + 20} ${headYy} Z`} fill={body} stroke={bodyStroke} />
          <ellipse cx={headX} cy={headYy} rx={19} ry={4} fill={emissive} filter={filterGlow} />
        </g>
      );
      castEl = <g>{cone(headX, headYy + 2, 19, 60, baseY + 6, 0.85)}{pool(headX, baseY + 6, 60, 8)}</g>;
      break;
    }
    case "stem": {
      const baseY = H - 30;
      const stemH = 60 + art.height * 120;
      const headYy = baseY - stemH;
      const hw = Math.max(16, w * 0.4);
      bodyEl = (
        <g>
          <ellipse cx={cx} cy={baseY} rx={18} ry={4} fill={body} stroke={bodyStroke} />
          <line x1={cx} y1={baseY} x2={cx} y2={headYy} stroke={body} strokeWidth={2.4} />
          <path d={`M ${cx - hw} ${headYy + 10} L ${cx + hw} ${headYy + 10} L ${cx + hw * 0.6} ${headYy - 16} L ${cx - hw * 0.6} ${headYy - 16} Z`} fill={body} stroke={bodyStroke} />
          <ellipse cx={cx} cy={headYy + 10} rx={hw - 1} ry={4} fill={emissive} filter={filterGlow} />
          <ellipse cx={cx} cy={headYy - 16} rx={hw * 0.6} ry={3} fill={emissiveFaint} />
        </g>
      );
      castEl = <g>{cone(cx, headYy + 12, hw, hw + 40, baseY + 6, 0.7)}{pool(cx, baseY + 6, hw + 40, 8)}<ellipse cx={cx} cy={headYy - 30} rx={hw + 10} ry={26} fill={`url(#${uid}-halo)`} opacity={castOpacity * 0.5} /></g>;
      break;
    }
    case "sconce": {
      const wallY = 40;
      const sw = Math.max(26, w * 0.5);
      const sh = Math.max(16, h * 0.4);
      bodyEl = (
        <g>
          <rect x={cx - 1} y={wallY - 20} width={2} height={sh + 40} fill="#1a1a1a" />
          <path d={`M ${cx - sw / 2} ${wallY} L ${cx + sw / 2} ${wallY} L ${cx + sw / 2} ${wallY + sh} A ${sw / 2} ${sh * 0.5} 0 0 1 ${cx - sw / 2} ${wallY + sh} Z`} fill={body} stroke={bodyStroke} />
          <rect x={cx - sw / 2 + 2} y={wallY} width={sw - 4} height={2.5} fill={emissive} filter={filterGlow} />
          <ellipse cx={cx} cy={wallY + sh} rx={sw / 2 - 2} ry={3} fill={emissive} filter={filterGlow} />
        </g>
      );
      castEl = (
        <g>
          <polygon points={`${cx - sw / 2},${wallY} ${cx + sw / 2},${wallY} ${cx + sw},${0} ${cx - sw},${0}`} fill={`url(#${uid}-wash-up)`} opacity={castOpacity * 0.8} />
          <polygon points={`${cx - sw / 2},${wallY + sh} ${cx + sw / 2},${wallY + sh} ${cx + sw * 1.3},${H} ${cx - sw * 1.3},${H}`} fill={`url(#${uid}-cone)`} opacity={castOpacity * 0.8} />
        </g>
      );
      break;
    }
    case "puck": {
      const r = Math.max(10, w * 0.14);
      const cy = 30;
      bodyEl = (
        <g>
          <rect x={0} y={0} width={W} height={cy - 2} fill="#0b0b0b" />
          <circle cx={cx} cy={cy} r={r} fill={body} stroke={bodyStroke} />
          <circle cx={cx} cy={cy} r={r * 0.6} fill={emissive} filter={filterGlow} />
        </g>
      );
      const half = Math.tan(((art.beam || 36) * Math.PI) / 360) * (poolY - cy) * 0.5;
      castEl = <g>{cone(cx, cy + r * 0.6, r * 0.6, clamp(half, 20, 85), poolY, 0.95)}{pool(cx, poolY, clamp(half, 20, 85), 8)}</g>;
      break;
    }
    case "trackhead": {
      const n = clamp(art.count, 2, 6);
      const railY = 22;
      const railW = 170;
      const heads = Array.from({ length: n }, (_, i) => cx - railW / 2 + (railW * (i + 0.5)) / n);
      bodyEl = (
        <g>
          <rect x={cx - railW / 2} y={railY - 3} width={railW} height={6} fill={body} />
          {heads.map((x, i) => (
            <g key={i} transform={`rotate(${(i - (n - 1) / 2) * 10} ${x} ${railY + 6})`}>
              <line x1={x} y1={railY + 3} x2={x} y2={railY + 14} stroke={body} strokeWidth={2} />
              <rect x={x - 7} y={railY + 14} width={14} height={28} rx={2} fill={body} stroke={bodyStroke} />
              <ellipse cx={x} cy={railY + 42} rx={6.5} ry={2.5} fill={emissive} filter={filterGlow} />
            </g>
          ))}
        </g>
      );
      castEl = (
        <g>
          {heads.map((x, i) => {
            const a = (i - (n - 1) / 2) * 10;
            const dx = Math.tan((a * Math.PI) / 180) * (poolY - railY - 44);
            return <g key={i}>{cone(x, railY + 44, 6, 30, poolY, 0.7)}{pool(x + dx, poolY, 32, 7, 0.9)}</g>;
          })}
        </g>
      );
      break;
    }
    case "bollard": {
      const bw = Math.max(14, w * 0.25);
      const bh = 80 + art.height * 100;
      const baseY = H - 30;
      bodyEl = (
        <g>
          <rect x={cx - bw / 2} y={baseY - bh} width={bw} height={bh} fill={body} stroke={bodyStroke} />
          <rect x={cx - bw / 2 + 2} y={baseY - bh + 10} width={bw - 4} height={bh * 0.3} fill={emissive} filter={filterGlow} opacity={0.95} />
          <ellipse cx={cx} cy={baseY} rx={bw} ry={4} fill="#0f0f0f" />
        </g>
      );
      castEl = <g>{pool(cx, baseY + 2, 70, 12, 0.9)}<ellipse cx={cx} cy={baseY - bh + 20} rx={46} ry={40} fill={`url(#${uid}-halo)`} opacity={castOpacity * 0.6} /></g>;
      break;
    }
    case "lantern": {
      const lw = Math.max(30, w * 0.5);
      const lh = Math.max(40, h * 0.7);
      const y0 = suspension ? headY : H - 40 - lh;
      bodyEl = (
        <g>
          {suspension && cord(cx, top, y0)}
          <rect x={cx - lw / 2} y={y0} width={lw} height={lh} fill={lit ? `url(#${uid}-globe)` : "#121212"} stroke={body} strokeWidth={2} filter={filterGlow} />
          <line x1={cx} y1={y0} x2={cx} y2={y0 + lh} stroke={body} strokeWidth={1.5} />
          <line x1={cx - lw / 2} y1={y0 + lh / 2} x2={cx + lw / 2} y2={y0 + lh / 2} stroke={body} strokeWidth={1.5} />
          <rect x={cx - lw / 2 - 3} y={y0 - 5} width={lw + 6} height={5} fill={body} />
        </g>
      );
      castEl = <g><rect x={cx - lw} y={y0 - 20} width={lw * 2} height={lh + 40} fill={`url(#${uid}-halo)`} opacity={castOpacity * 0.6} />{pool(cx, y0 + lh + 24, lw * 0.9, 7, 0.7)}</g>;
      break;
    }
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`block h-auto w-full ${className}`}
      style={style}
      role="img"
      aria-label={fixture.name}
      data-lit={lit ? "1" : "0"}
    >
      <defs>
        <radialGradient id={`${uid}-pool`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.85" />
          <stop offset="45%" stopColor={glow} stopOpacity="0.3" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-cone`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={glow} stopOpacity="0.55" />
          <stop offset="55%" stopColor={glow} stopOpacity="0.12" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}-wash-up`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={glow} stopOpacity="0.5" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${uid}-halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.45" />
          <stop offset="60%" stopColor={glow} stopOpacity="0.08" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-globe`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff6e8" stopOpacity="1" />
          <stop offset="45%" stopColor={glow} stopOpacity="0.95" />
          <stop offset="100%" stopColor={glow} stopOpacity="0.55" />
        </radialGradient>
        <filter id={`${uid}-bloom`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="b1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b2" />
          <feMerge>
            <feMergeNode in="b2" />
            <feMergeNode in="b1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g className={lit ? "fixture-art-lit" : "fixture-art-unlit"} style={{ transition: "none" }}>
        {cast && castEl}
        {bodyEl}
      </g>
    </svg>
  );
}
