"use client";
import { useEffect, useRef, type ReactNode } from "react";

/** Native <dialog>, dark, with a warm hairline. Esc closes; focus is trapped by the browser. */
export function Dialog({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className={`m-auto w-[min(100%-1.5rem,${wide ? "64rem" : "36rem"})] max-h-[90dvh] overflow-auto border hairline bg-charcoal p-0 text-paper backdrop:bg-night/80 backdrop:backdrop-blur-sm`}
      style={{ width: `min(100% - 1.5rem, ${wide ? "64rem" : "36rem"})` }}
    >
      <div className="flex items-center justify-between gap-4 border-b hairline px-5 py-4">
        <h2 className="font-display text-2xl">{title}</h2>
        <button type="button" onClick={onClose} className="btn btn-sm" aria-label="close">✕</button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
