# Deploying the Kamchi concept to Vercel

The repository is a standard Next.js 15 app. No database, no cron, no storage: the only server code is the three AI routes under `src/app/api/ai/*`.

## Steps

1. **Import** the GitHub repository in Vercel (framework preset: Next.js, build `next build`, install `pnpm install`). `vercel.json` sets the region to `fra1` (closest to Israel) and a 60 s max duration for the AI routes.
2. **Environment variables** (Project → Settings → Environment Variables):
   - `ANTHROPIC_API_KEY` — optional. With it, `/relight`, `/plan` and `/consultant` call the vision model (`claude-opus-5-5`); without it they run the labelled simulation.
   - `KAMCHI_AI_MODEL` — optional override of the model id.
3. **Keep it unlisted**: the app sends `X-Robots-Tag: noindex, nofollow, noarchive`, sets `robots: noindex` metadata and serves a disallow-all `robots.txt`. Use a non-guessable project name (e.g. `kamchi-concept-7f3a.vercel.app`) and enable Vercel Deployment Protection → Password if you want a gate; share the password in the email.
4. **Fonts** are fetched from Google Fonts at build time by `next/font` — the build machine needs outbound HTTPS (Vercel does).
5. **Video assets** in `public/hero/` (`room-loop.mp4`, `room-loop.webm`, `room-lit.jpg`) are committed; re-record with `pnpm assets:video` after changing the hero scene.

## Recording the email video

```bash
pnpm dev
# in another shell
pnpm tsx scripts/record-autopilot.ts   # writes public/hero/autopilot.webm
```

Or open `/live?autopilot=1&record=1` in Chrome at 1600×1000 and screen-record; the autopilot pauses with Space and restarts from its control bar.

## Checks before sending

- `pnpm build` is clean; `pnpm typecheck`, `pnpm lint`, `pnpm validate:data` pass.
- `/` lights up at 60 fps on a MacBook Air (Chrome, Safari); a mid-range Android gets the video loop.
- `/relight` returns a result in under 15 s with the designed skeleton.
- `/live?autopilot=1` runs three times in a row from the control bar.
