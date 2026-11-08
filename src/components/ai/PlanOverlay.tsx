"use client";
import { useId } from "react";
import { useLang, useTx } from "@/lib/i18n";
import type { LightingPlan, Zone } from "@/lib/types";
import { polygonCentroid, ZONE_LABEL } from "@/lib/ai/plan-rules";

/**
 * The annotated plan: the uploaded sheet (inverted to night) or a dark placeholder sheet for PDFs,
 * with an SVG overlay — room polygons as hairlines, labels in display type, zone points as warm marks
 * (ambient = ring, task = filled, accent = diamond) and a legend.
 */
export function PlanOverlay({ plan, image, aspect, night = true, title }: { plan: LightingPlan; image: string | null; aspect: number; night?: boolean; title: { he: string; en: string } }) {
  const t = useTx();
  const lang = useLang();
  const uid = useId().replace(/:/g, "");
  const VW = 1000, VH = Math.round(1000 / aspect);
  const X = (x: number) => x * VW, Y = (y: number) => y * VH;
  const r = Math.max(5, VW * 0.0075);

  const mark = (zone: Zone, x: number, y: number, key: string) => {
    const cx = X(x), cy = Y(y);
    if (zone === "ambient") return <circle key={key} cx={cx} cy={cy} r={r} fill="none" stroke="rgb(var(--glow-rgb))" strokeWidth={1.6} filter={`url(#${uid}-g)`} />;
    if (zone === "task") return <circle key={key} cx={cx} cy={cy} r={r * 0.95} fill="rgb(var(--glow-rgb))" filter={`url(#${uid}-g)`} />;
    return <path key={key} d={`M ${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${cx - r} ${cy} Z`} fill="none" stroke="rgb(var(--glow-rgb))" strokeWidth={1.6} filter={`url(#${uid}-g)`} />;
  };

  return (
    <figure className="m-0">
      <div className="relative w-full overflow-hidden border hairline bg-night" style={{ aspectRatio: aspect }}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={t(title)} className="absolute inset-0 h-full w-full object-contain" style={night ? { filter: "invert(1) hue-rotate(180deg) brightness(0.62) contrast(1.05) sepia(0.25)", opacity: 0.8 } : undefined} />
        ) : (
          <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none">
            <rect width={VW} height={VH} fill="#0c0c0c" />
            {Array.from({ length: 19 }, (_, i) => <line key={`v${i}`} x1={(VW * (i + 1)) / 20} y1={0} x2={(VW * (i + 1)) / 20} y2={VH} stroke="#1c1c1c" strokeWidth={1} />)}
            {Array.from({ length: 19 }, (_, i) => <line key={`h${i}`} x1={0} y1={(VH * (i + 1)) / 20} x2={VW} y2={(VH * (i + 1)) / 20} stroke="#1c1c1c" strokeWidth={1} />)}
          </svg>
        )}
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label={t({ he: `תוכנית תאורה מסומנת: ${plan.rooms.length} חדרים`, en: `Annotated lighting plan: ${plan.rooms.length} rooms` })}>
          <defs>
            <filter id={`${uid}-g`} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {plan.rooms.map((room) => {
            const c = polygonCentroid(room.polygon);
            const pts = room.polygon.map((p) => `${X(p.x)},${Y(p.y)}`).join(" ");
            return (
              <g key={room.id}>
                <polygon points={pts} fill="rgb(var(--glow-rgb) / 0.035)" stroke="rgba(242,238,230,0.45)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                <text x={X(c.x)} y={Y(c.y) - r * 1.6} textAnchor="middle" fill="#f2eee6" fontFamily="var(--font-display)" fontSize={Math.max(18, VW * 0.028)} direction={lang === "he" ? "rtl" : "ltr"}>
                  {lang === "he" ? room.label.he : room.label.en}
                </text>
                <text x={X(c.x)} y={Y(c.y) + r * 2.4} textAnchor="middle" fill="#c9a86b" fontFamily="var(--font-mono)" fontSize={Math.max(11, VW * 0.013)} letterSpacing={1}>
                  {room.areaM2} m² · {room.targetLux} lx
                </text>
                {room.zones.map((z, zi) => z.points.map((p, pi) => mark(z.zone, p.x, p.y, `${room.id}-${zi}-${pi}`)))}
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[0.68rem] tracking-wider text-muted">
        <span className="inline-flex items-center gap-2"><span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full border border-glow" />{t(ZONE_LABEL.ambient)}</span>
        <span className="inline-flex items-center gap-2"><span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-glow" />{t(ZONE_LABEL.task)}</span>
        <span className="inline-flex items-center gap-2"><span aria-hidden className="inline-block h-2.5 w-2.5 rotate-45 border border-glow" />{t(ZONE_LABEL.accent)}</span>
        <span className="ms-auto">{t({ he: "מידות וקנ״מ משוערים", en: "Dimensions and scale are estimates" })}</span>
      </figcaption>
    </figure>
  );
}
