"use client";
import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useTx } from "@/lib/i18n";

/**
 * Before/after comparison. The slider is intentionally directional (left = after, right = before),
 * draggable with pointer, keyboard-operable (arrows, Home/End), with aria-valuenow.
 */
export function BeforeAfter({ before, after, aspect, alt }: { before: string; after: string; aspect: number; alt: { he: string; en: string } }) {
  const t = useTx();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(62);
  const dragging = useRef(false);

  const fromEvent = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos(Math.round(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100))));
  }, []);

  const onDown = (e: PointerEvent<HTMLDivElement>) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); fromEvent(e.clientX); };
  const onMove = (e: PointerEvent<HTMLDivElement>) => { if (dragging.current) fromEvent(e.clientX); };
  const onUp = () => { dragging.current = false; };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === "ArrowLeft") { setPos((p) => Math.max(0, p - step)); e.preventDefault(); }
    else if (e.key === "ArrowRight") { setPos((p) => Math.min(100, p + step)); e.preventDefault(); }
    else if (e.key === "Home") { setPos(0); e.preventDefault(); }
    else if (e.key === "End") { setPos(100); e.preventDefault(); }
  };

  return (
    <div ref={ref} dir="ltr" className="relative w-full select-none overflow-hidden border hairline bg-night touch-none" style={{ aspectRatio: aspect }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={before} alt={t({ he: `לפני: ${alt.he}`, en: `Before: ${alt.en}` })} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt={t({ he: `אחרי: ${alt.he}`, en: `After: ${alt.en}` })} className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} draggable={false} />
      <div
        role="slider"
        tabIndex={0}
        aria-label={t({ he: "השוואה לפני ואחרי", en: "Before / after comparison" })}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pos}
        aria-valuetext={`${pos}%`}
        onKeyDown={onKey}
        className="absolute inset-y-0 w-10 -translate-x-1/2 cursor-ew-resize outline-none"
        style={{ left: `${pos}%` }}
      >
        <span aria-hidden className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-glow shadow-glow" />
        <span aria-hidden className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-glow bg-night/80 font-mono text-[0.6rem] tracking-widest text-glow shadow-glow backdrop-blur">
          ‹ ›
        </span>
      </div>
      <span aria-hidden className="absolute left-3 top-3 border border-glow bg-night/70 px-2 py-0.5 font-mono text-[0.62rem] tracking-widest text-glow">{t({ he: "אחרי", en: "AFTER" })}</span>
      <span aria-hidden className="absolute right-3 top-3 border hairline bg-night/70 px-2 py-0.5 font-mono text-[0.62rem] tracking-widest text-muted">{t({ he: "לפני", en: "BEFORE" })}</span>
    </div>
  );
}
