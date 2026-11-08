"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLang, useTx } from "@/lib/i18n";
import type { Bi } from "@/lib/i18n";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/**
 * The waiting state is designed, not spun: the uploaded photo sits at 8 % brightness under a slow
 * warm sweep, three mono captions advance on a timer, and a thin brass rule measures progress.
 */
export function AiSkeleton({ image, aspect = 3 / 2, captions, stageMs = 800, label }: { image?: string | null; aspect?: number; captions: Bi[]; stageMs?: number; label?: Bi }) {
  const t = useTx();
  const lang = useLang();
  const reduced = useReducedMotion();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (reduced) { setStage(captions.length - 1); return; }
    setStage(0);
    const id = setInterval(() => setStage((s) => Math.min(captions.length - 1, s + 1)), stageMs);
    return () => clearInterval(id);
  }, [captions.length, stageMs, reduced]);

  return (
    <div className="relative w-full overflow-hidden border hairline bg-night" style={{ aspectRatio: aspect }} role="status" aria-busy="true" aria-label={label ? t(label) : undefined}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ filter: "brightness(0.08) saturate(0.7)" }} />
      ) : (
        <div className="absolute inset-0 bg-charcoal" />
      )}
      {!reduced && (
        <motion.div
          aria-hidden
          className="absolute inset-y-0 w-1/2"
          style={{ left: 0, background: "linear-gradient(90deg, transparent, rgb(var(--glow-rgb) / 0.14), transparent)", mixBlendMode: "screen" }}
          initial={{ x: lang === "he" ? "320%" : "-120%" }}
          animate={{ x: lang === "he" ? "-120%" : "320%" }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/90 to-transparent p-4 md:p-6">
        <ol className="space-y-1.5 font-mono text-[0.72rem] tracking-wider" aria-live="polite">
          {captions.map((c, i) => (
            <li key={i} className={i < stage ? "text-paper" : i === stage ? "text-glow" : "text-muted"} aria-hidden={i > stage}>
              <span className="me-2 text-brass-light">{String(i + 1).padStart(2, "0")}</span>
              {t(c)}
            </li>
          ))}
        </ol>
        <div className="mt-4 h-px w-full bg-ash/50">
          <motion.div className="h-px bg-brass" style={{ transformOrigin: lang === "he" ? "100% 50%" : "0 50%" }} initial={{ scaleX: 0 }} animate={{ scaleX: (stage + 1) / captions.length }} transition={{ duration: reduced ? 0 : 0.8, ease: "easeOut" }} />
        </div>
      </div>
    </div>
  );
}
