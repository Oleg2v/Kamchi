"use client";
import Link from "next/link";
import { useTx } from "@/lib/i18n";
import { BRAND_NAME } from "@/lib/i18n/common";

/** Wordmark with a filament glyph. Lit by hover/focus like everything else. */
export function Logo({ lit = false, size = "md" }: { lit?: boolean; size?: "sm" | "md" | "lg" }) {
  const t = useTx();
  const px = size === "lg" ? 34 : size === "sm" ? 20 : 26;
  return (
    <Link href="/" aria-label={t(BRAND_NAME)} className={`group inline-flex items-center gap-3 ${lit ? "is-on" : ""}`}>
      <Filament size={px + 6} className="shrink-0 opacity-70 transition-opacity group-hover:opacity-100" />
      <span className="font-display leading-none" style={{ fontSize: px }}>
        <span className="text-paper group-hover:lit-text transition-[text-shadow] duration-200">{t({ he: "קמחי", en: "Kamchi" })}</span>
        <span className="text-muted mx-2 text-[0.6em] align-middle font-ui tracking-[0.18em] uppercase">{t({ he: "תאורה", en: "Lighting" })}</span>
      </span>
    </Link>
  );
}

/** A single filament. Used by the preloader, the favicon and the logo. */
export function Filament({ size = 28, className = "", animate = false }: { size?: number; className?: string; animate?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className}>
      <path
        d="M6 22 C 9 10, 12 10, 14 18 S 19 26, 21 14 S 25 8, 27 18"
        fill="none"
        stroke="rgb(var(--glow-rgb))"
        strokeWidth="1.6"
        strokeLinecap="round"
        pathLength={1}
        style={animate ? { strokeDasharray: 1, strokeDashoffset: 1, animation: "filament 700ms var(--ease-incandescent) forwards" } : { filter: "drop-shadow(0 0 6px rgb(var(--glow-rgb) / 0.8))" }}
      />
      <circle cx="6" cy="22" r="1.2" fill="#8a8178" />
      <circle cx="27" cy="18" r="1.2" fill="#8a8178" />
    </svg>
  );
}
