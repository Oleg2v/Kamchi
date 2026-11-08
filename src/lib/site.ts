/**
 * Demo scope. The pitch shows the home page only; every other route stays in
 * the codebase and comes back with NEXT_PUBLIC_FULL_SITE=1 (inlined at build).
 */
export const FULL_SITE = process.env.NEXT_PUBLIC_FULL_SITE === "1";

/** Whether an in-app href leads to a page that is public in this build. */
export function pageEnabled(href: string): boolean {
  if (FULL_SITE) return true;
  if (href.startsWith("#") || /^https?:/.test(href)) return true;
  const path = href.split(/[?#]/)[0];
  return path === "" || path === "/";
}
