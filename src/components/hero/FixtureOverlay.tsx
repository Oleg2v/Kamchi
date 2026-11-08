"use client";
/**
 * SVG silhouettes over the relit photograph: a pendant hanging from the top
 * edge, two sconce bodies and three recessed rings. The floor lamp exists in
 * the photo and only glows. Emissive parts run the 120 ms incandescent ramp.
 * ViewBox is the photograph (1920×1280); the layer is sized to the cover box.
 */
import { useId } from "react";
import type { LightId } from "./light-controller";
import { LIGHTS } from "./light-controller";
import type { CoverBox } from "./use-cover-box";

const W = 1920, H = 1280;
const px = (x: number) => x * W;
const py = (y: number) => y * H;

type Props = { box: CoverBox; lit: ReadonlySet<LightId>; instant?: boolean };

export function FixtureOverlay({ box, lit, instant = false }: Props) {
  const uid = useId().replace(/:/g, "");
  if (box.w <= 0) return null;
  const glow = "rgb(var(--glow-rgb))";
  const emissiveStyle = (on: boolean) =>
    on
      ? { opacity: 1, animation: instant ? "none" : "incandescent 120ms var(--ease-incandescent) forwards" }
      : { opacity: 0 };

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${W} ${H}`}
      className="pointer-events-none absolute"
      style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
    >
      <defs>
        <filter id={`${uid}-bloom`} x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="4" result="b1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="b2" />
          <feMerge>
            <feMergeNode in="b2" />
            <feMergeNode in="b1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`${uid}-dome`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#101010" />
          <stop offset="100%" stopColor="#060606" />
        </linearGradient>
      </defs>

      {LIGHTS.map((l) => {
        const on = lit.has(l.id);
        const ax = px(l.fixtureAnchor.x);
        const ay = py(l.fixtureAnchor.y);
        switch (l.kind) {
          case "pendant": {
            const rx = 58, ry = 30; // shallow 42 cm dome at this depth
            return (
              <g key={l.id}>
                <line x1={ax} y1={0} x2={ax} y2={ay - ry - 4} stroke={on ? "#4a443c" : "#1c1c1c"} strokeWidth={2} />
                <rect x={ax - 9} y={ay - ry - 10} width={18} height={7} fill="#0c0c0c" stroke="#232323" strokeWidth={1} />
                <path d={`M ${ax - rx} ${ay} A ${rx} ${ry} 0 0 1 ${ax + rx} ${ay} Z`} fill={`url(#${uid}-dome)`} stroke={on ? "rgb(var(--glow-rgb) / 0.35)" : "#242424"} strokeWidth={1.5} />
                <ellipse cx={ax} cy={ay} rx={rx - 2} ry={9} fill={glow} filter={`url(#${uid}-bloom)`} style={emissiveStyle(on)} />
                <ellipse cx={ax} cy={ay + 1} rx={rx - 6} ry={5} fill="#fff6e8" style={{ ...emissiveStyle(on), mixBlendMode: "screen" }} />
              </g>
            );
          }
          case "wall": {
            const w = 22, h = 48;
            return (
              <g key={l.id}>
                <rect x={ax - w / 2} y={ay - h / 2} width={w} height={h} rx={3} fill="#141414" stroke={on ? "rgb(var(--glow-rgb) / 0.3)" : "#262626"} strokeWidth={1.5} />
                <rect x={ax - w / 2 + 3} y={ay - h / 2 - 2} width={w - 6} height={4} fill={glow} filter={`url(#${uid}-bloom)`} style={emissiveStyle(on)} />
                <rect x={ax - w / 2 + 3} y={ay + h / 2 - 2} width={w - 6} height={4} fill={glow} filter={`url(#${uid}-bloom)`} style={emissiveStyle(on)} />
              </g>
            );
          }
          case "recessed": {
            return (
              <g key={l.id}>
                <ellipse cx={ax} cy={ay} rx={22} ry={8} fill="#0a0a0a" stroke={on ? "rgb(var(--glow-rgb) / 0.4)" : "#2a2a2a"} strokeWidth={1.5} />
                <ellipse cx={ax} cy={ay} rx={13} ry={4.5} fill={glow} filter={`url(#${uid}-bloom)`} style={emissiveStyle(on)} />
              </g>
            );
          }
          default:
            return null;
        }
      })}
    </svg>
  );
}
