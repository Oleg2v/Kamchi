/**
 * record-autopilot.ts — records the ~30 s autopilot on /live into public/hero/autopilot.webm.
 *
 *   pnpm tsx scripts/record-autopilot.ts        (dev server on http://localhost:3000, or AUTOPILOT_BASE_URL)
 *
 * 1600×1000, Playwright's built-in recorder (VP8 webm). /live?autopilot=1&record=1 starts the run after
 * hydration and hides the control bar's secondary buttons. The recording ends a few seconds after the final
 * caption. With ffmpeg on the machine the clip is then trimmed to start 0.8 s before the run and re-encoded as
 * VP9 (smaller); without ffmpeg the raw VP8 file is kept. The result must stay under 8 MB.
 *
 * In record mode the room card plays the pre-rendered loop (no software WebGL), so headless Chromium keeps up
 * with the ~30 s script; the recorder is given a few seconds after the final caption to flush its last frames.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/* Playwright is installed on the machine, not declared in package.json: the slice of its API used here is typed locally. */
interface PwVideo { path(): Promise<string> }
interface PwPage {
  on(event: "pageerror", fn: (e: Error) => void): void;
  goto(url: string, opts?: { waitUntil?: "networkidle" | "load"; timeout?: number }): Promise<unknown>;
  addStyleTag(opts: { content: string }): Promise<unknown>;
  waitForFunction(fn: (arg: string) => boolean, arg: string, opts?: { timeout?: number }): Promise<unknown>;
  waitForTimeout(ms: number): Promise<void>;
  video(): PwVideo | null;
}
interface PwContext { newPage(): Promise<PwPage>; close(): Promise<void> }
interface PwBrowser { newContext(opts: Record<string, unknown>): Promise<PwContext>; close(): Promise<void> }
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium } = require("playwright") as { chromium: { launch(opts?: { args?: string[] }): Promise<PwBrowser> } };

const BASE = process.env.AUTOPILOT_BASE_URL ?? "http://localhost:3000";
const OUT = path.resolve(__dirname, "..", "public", "hero", "autopilot.webm");
const W = 1600;
const H = 1000;
const LIMIT = 8 * 1024 * 1024;
const FINAL_CAPTION = "כך נראית עבודה משותפת. 30 שניות.";

const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + " MB";

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kamchi-autopilot-"));
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
    locale: "he-IL",
    recordVideo: { dir, size: { width: W, height: H } },
  });
  const page = await context.newPage();
  page.on("pageerror", (e: Error) => console.error("page error:", e.message));

  const t0 = Date.now(); // the recording starts with the context
  await page.goto(`${BASE}/live?autopilot=1&record=1`, { waitUntil: "networkidle", timeout: 180_000 });
  // The Next.js dev indicator is not part of the demo.
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" }).catch(() => undefined);
  await page.waitForFunction(() => document.querySelector("[data-autopilot-live]")?.getAttribute("data-autopilot-status") === "running", "", { timeout: 120_000 });
  const lead = Math.max(0, (Date.now() - t0) / 1000 - 0.8);
  console.log(`run started ${lead.toFixed(1)} s into the recording`);
  await page.waitForFunction(
    (caption: string) =>
      document.querySelector("[data-autopilot-live]")?.getAttribute("data-autopilot-status") === "done" &&
      document.querySelector("[data-autopilot-caption]")?.textContent?.trim() === caption,
    FINAL_CAPTION,
    { timeout: 240_000 },
  );
  console.log(`run finished after ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  // The screencast can trail the page by a few seconds on a loaded machine: let it catch up on the final frame.
  await page.waitForTimeout(7_000);

  const video = page.video();
  await context.close(); // flushes the recording
  await browser.close();
  if (!video) throw new Error("no video was recorded");
  const src = await video.path();

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  console.log(`raw recording: ${mb(fs.statSync(src).size)} (vp8)`);

  const hasFfmpeg = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0;
  if (hasFfmpeg) {
    console.log(`trimming ${lead.toFixed(1)} s of lead-in and encoding vp9 …`);
    const tmp = OUT + ".tmp.webm";
    const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", lead.toFixed(2), "-i", src, "-c:v", "libvpx-vp9", "-crf", "34", "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", "-an", tmp], { stdio: "inherit" });
    if (r.status !== 0) throw new Error(`ffmpeg failed (${r.status})`);
    fs.renameSync(tmp, OUT);
  } else {
    console.warn("ffmpeg not found — keeping the untrimmed vp8 recording");
    fs.copyFileSync(src, OUT);
  }
  const size = fs.statSync(OUT).size;
  console.log(`autopilot.webm: ${mb(size)}${size > LIMIT ? "  ← over 8 MB: raise the crf or shorten the run" : ""}`);
  fs.rmSync(dir, { recursive: true, force: true });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
