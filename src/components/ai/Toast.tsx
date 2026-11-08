"use client";
import { useCallback, useRef, useState } from "react";

export interface ToastItem { id: number; text: string }

/** A tiny local toast hook: push a line, it glows for 3.6 s and goes out. */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const n = useRef(0);
  const push = useCallback((text: string) => {
    const id = ++n.current;
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);
  return { toasts, push };
}

export function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed bottom-16 z-[85] flex w-[min(100vw-2rem,22rem)] flex-col gap-2" style={{ insetInlineEnd: "1rem" }}>
      {toasts.map((t) => (
        <div key={t.id} className="panel flash-warm border-glow/60 px-4 py-3 text-sm text-paper">
          {t.text}
        </div>
      ))}
    </div>
  );
}
