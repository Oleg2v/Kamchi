"use client";
import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { BLACKOUT_MS } from "@/lib/motion/gsap";
import { pageEnabled } from "@/lib/site";

type Props = LinkProps & AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode };

/** Navigation as a blackout: 240 ms to black, then the next page switches on. */
export function TransitionLink({ href, onClick, children, ...rest }: Props) {
  const router = useRouter();
  const handle = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      const url = typeof href === "string" ? href : String((href as { pathname?: string }).pathname ?? "");
      if (url.startsWith("#") || url.startsWith("http")) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
      e.preventDefault();
      const veil = document.createElement("div");
      veil.className = "blackout is-clear";
      document.body.appendChild(veil);
      requestAnimationFrame(() => veil.classList.remove("is-clear"));
      setTimeout(() => {
        router.push(url);
        setTimeout(() => veil.remove(), BLACKOUT_MS + 80);
      }, BLACKOUT_MS);
    },
    [href, onClick, router],
  );
  const target = typeof href === "string" ? href : String((href as { pathname?: string }).pathname ?? "");
  if (!pageEnabled(target)) {
    // Hidden in the demo build: keep the look, drop the navigation.
    return <span className={rest.className} style={rest.style}>{children}</span>;
  }
  return (
    <Link href={href} onClick={handle} {...rest}>
      {children}
    </Link>
  );
}
