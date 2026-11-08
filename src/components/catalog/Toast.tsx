"use client";
import { useCallback, useRef, useState } from "react";
import { TransitionLink } from "@/components/brand/TransitionLink";

export interface ToastItem {
  id: number;
  text: string;
  href?: string;
  linkLabel?: string;
}

/** Module-local toasts: short confirmations that arrive lit and fade out of the DOM. */
export function useToasts(ttl = 3800) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (t: Omit<ToastItem, "id">) => {
      const id = ++seq.current;
      setToasts((list) => [...list.slice(-2), { id, ...t }]);
      setTimeout(() => dismiss(id), ttl);
    },
    [dismiss, ttl],
  );
  return { toasts, push, dismiss };
}

export function Toasts({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed bottom-14 end-3 z-[85] flex w-[min(100vw-1.5rem,22rem)] flex-col gap-2 md:bottom-6 md:end-6">
      {toasts.map((t) => (
        <div key={t.id} className="toast pointer-events-auto flex items-center justify-between gap-3 border border-glow/50 bg-night/95 px-4 py-3 text-sm shadow-glow backdrop-blur">
          <span>{t.text}</span>
          <span className="flex shrink-0 items-center gap-3">
            {t.href && t.linkLabel && (
              <TransitionLink href={t.href} className="text-glow underline-offset-4 hover:underline">{t.linkLabel}</TransitionLink>
            )}
            <button type="button" onClick={() => onDismiss(t.id)} className="text-muted hover:text-paper" aria-label="סגירה">✕</button>
          </span>
        </div>
      ))}
    </div>
  );
}
