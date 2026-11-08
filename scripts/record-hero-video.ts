/**
 * record-hero-video.ts — renders the hero's fallback assets from /hero-capture.
 *
 *   pnpm assets:video            (dev server on http://localhost:3000, or HERO_BASE_URL)
 *
 * Output (public/hero):
 *   room-loop.mp4   1280×852, libx264 yuv420p crf 23, 6 s @ 25 fps (150 frames of the auto sequence)
 *   room-loop.webm  1280×852, vp9 crf 34
 *   room-lit.jpg    1920×1280, quality 82, everything lit (mode=static)
 *
 * Headless Chromium renders WebGL through SwiftShader — slow, but exact, which is
 * all a frame capture needs. Each frame is a deterministic state of the light
 * controller (window.__heroSetTime), not a real-time recording.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium } = require("playwright") as typeof import("playwright");

const BASE = process.env.HERO_BASE_URL ?? "http://localhost:3000";
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "public", "hero");
const FPS = 25;
const SECONDS = 6;
const FRAMES = FPS * SECONDS;
const W = 1920, H = 1280;

const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + " MB";

function run(cmd: string, args: string[]) {
  const r = spawnSync(cmd, args, { stdio: ["ignore", "inherit", "inherit"] });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed (${r.status})`);
}

async function main() {
  const frames = fs.mkdtempSync(path.join(os.tmpdir(), "kamchi-hero-frames-"));
  console.log(`frames → ${frames}`);

  const browser = await chromium.launch({
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.error("page error:", e.message));

  await page.goto(`${BASE}/hero-capture?t=0`, { waitUntil: "networkidle", timeout: 180_000 });
  await page.waitForFunction(() => document.documentElement.dataset.heroReady === "1", null, { timeout: 180_000 });
  await page.waitForTimeout(500);

  const t0 = Date.now();
  for (let i = 0; i < FRAMES; i++) {
    const t = i / FPS;
    await page.evaluate((tt) => window.__heroSetTime!(tt), t);
    await page.waitForTimeout(40);
    await page.screenshot({ path: path.join(frames, `f${String(i).padStart(4, "0")}.png`), type: "png" });
    if (i % 25 === 0) console.log(`frame ${i}/${FRAMES} (t=${t.toFixed(2)}s) ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }

  // Lit still (poster + reduced-motion frame).
  await page.evaluate(() => window.__heroSetStatic!());
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, "room-lit.jpg"), type: "jpeg", quality: 82 });
  await browser.close();

  const input = path.join(frames, "f%04d.png");
  console.log("encoding mp4 …");
  run("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", input, "-vf", "scale=1280:-2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "23", "-preset", "slow", "-movflags", "+faststart", "-an", path.join(OUT, "room-loop.mp4")]);
  console.log("encoding webm …");
  run("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", input, "-vf", "scale=1280:-2", "-c:v", "libvpx-vp9", "-crf", "34", "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", "-an", path.join(OUT, "room-loop.webm")]);

  for (const f of ["room-loop.mp4", "room-loop.webm", "room-lit.jpg"]) {
    const size = fs.statSync(path.join(OUT, f)).size;
    console.log(`${f}: ${mb(size)}${f.endsWith(".mp4") && size > 3 * 1024 * 1024 ? "  ← over 3 MB" : ""}`);
  }
  // keep a few frames for inspection
  const keep = path.join(OUT, "..", "..", "node_modules", ".cache", "hero-frames");
  fs.mkdirSync(keep, { recursive: true });
  for (const i of [0, 24, 60, 95, 125, 149]) fs.copyFileSync(path.join(frames, `f${String(i).padStart(4, "0")}.png`), path.join(keep, `f${i}.png`));
  console.log(`sample frames kept in ${keep}`);
  fs.rmSync(frames, { recursive: true, force: true });
}

main().catch((e) => { console.error(e); process.exit(1); });
