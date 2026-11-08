import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // The demo serves a handful of local images; no optimizer is needed on Workers or Vercel.
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Demo hygiene: unlisted concept, never indexed.
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
  transpilePackages: ["three"],
};

export default nextConfig;
