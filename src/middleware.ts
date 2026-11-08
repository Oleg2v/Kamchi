import { NextResponse, type NextRequest } from "next/server";

/**
 * Demo scope: only "/" is public. Every other page redirects home and the API
 * answers 404, unless the build sets NEXT_PUBLIC_FULL_SITE=1.
 */
export function middleware(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_FULL_SITE === "1") return NextResponse.next();
  const { pathname } = req.nextUrl;
  if (pathname === "/") return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const url = req.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url, 307);
}

export const config = {
  // Pages only: skip Next internals and any file with an extension (images, fonts, video, robots.txt…).
  matcher: ["/((?!_next/|.*\\.[a-zA-Z0-9]+$).*)"],
};
