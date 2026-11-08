# קמחי תאורה — "האור נדלק" · concept site & designer portal

> **קונספט של Kikkey — לא האתר הרשמי של קמחי תאורה.** Unsolicited pitch demo. All prices are demo prices, brand names appear as text only, the site is `noindex`.

A Hebrew-first (RTL), English-second concept for Kamchi Lighting (קמחי תאורה), Israel's leading importer of designer lighting. Everything starts unlit; scrolling, hovering and tapping are the only switches; light is the only decoration.

## What is in the demo

| Area | Route | Notes |
| --- | --- | --- |
| The room that lights up as you scroll | `/` | WebGL relighting of a real-room photograph on a hand-authored depth map (R3F, one shader pass). Video loop on phones / low-power devices, lit static frame under reduced motion. Brand wall lit by each house's own fixture. |
| Catalogue & shop | `/catalog`, `/catalog/[slug]`, `/cart` | URL-synced filters (space, brand, type, size, CCT, dimming, IP, price), product page with a live switch-on, spec table, IES/DWG(DXF)/PDF demo downloads, showroom appointment, cart and project boards. |
| תאירו לי את הסלון (beta, simulation) | `/relight` | Upload a room photo, pick a fixture; a vision model places it and the client composites the cast light. Before/after slider, download, send to a designer. |
| תוכנית תאורה מתוכנית דירה (beta) | `/plan` | Floor plan image/PDF → rooms, lighting zones with target lux, fixtures from the catalogue, totals, annotated plan, shopping list. |
| היועץ (beta) | `/consultant` | Catalogue-grounded chat; every fact is checked against the data, every answer links the product. |
| הסטודיו (designer portal) | `/studio` | Project boards, rooms, fixtures, quote requests, order status, spec downloads. |
| שולחן הפרויקטים (Kamchi desk) | `/desk` | Live quote requests, tier discounts, lead times, quote PDF, order pipeline, open projects by studio, stock. |
| מצב חי + autopilot | `/live`, `/live?autopilot=1` | Split screen: designer at inline-start, desk at inline-end, brass divider with a live dot. A ~30 s scripted demo with a visible cursor on both panes. |
| About, projects, club, accessibility | `/about`, `/projects`, `/club`, `/accessibility` | Real facts only; accessibility statement (WCAG 2.0 AA / IS 5568). |

Two-sided mode has **no backend**: products, stock, lead times, projects, quotes and the event log live in one client store (Zustand + `localStorage`), synced across tabs with `BroadcastChannel`. "איפוס דמו" restores the seed data.

## Art direction

- Palette: Night `#050505`, Charcoal `#141414`, Ash `#3A3A3A`, Paper `#F2EEE6`, Warm White 2700K `#FFD9A8` (glow), Brass `#B8955B`. The 2700K / 3000K / 4000K header control re-tints every glow through `--glow-rgb`.
- Type: David Libre (Hebrew display), Heebo (UI), IBM Plex Mono (lumens, kelvin, prices), Cormorant Garamond (English display).
- Motion: 120 ms incandescent ramps (never fades), 240 ms blackouts between pages, Lenis + GSAP ScrollTrigger, a dimmer-knob cursor on desktop.
- Material: no stock photos, no illustrations, no icon packs. Fixtures are procedural portraits (`FixtureArt`) on black; glow is layered radial gradients or WebGL.

## Running

```bash
pnpm install
cp .env.example .env.local   # optional: ANTHROPIC_API_KEY enables the real vision model
pnpm dev                     # http://localhost:3000
pnpm build && pnpm start
pnpm typecheck && pnpm lint && pnpm validate:data
```

Without `ANTHROPIC_API_KEY` the three AI routes answer with a deterministic, clearly labelled **הדמיה** so the demo always works offline.

Asset scripts: `pnpm assets:depth` rebuilds the depth map; `pnpm assets:video` re-records the hero video loop and the lit frame; `scripts/record-autopilot.ts` records the autopilot as a WebM for the email video.

## Live demo

**https://kamchi.kikkey.com** — unlisted, `noindex`, deployed as a Cloudflare Worker (OpenNext) with a custom domain. Preview worker: https://kamchi-preview.velikotrav2307.workers.dev.

## Deploying

See [docs/DEPLOY.md](docs/DEPLOY.md) for both targets.

- **Cloudflare Workers (current):** `pnpm deploy` builds with OpenNext and runs `wrangler deploy` (config in `wrangler.jsonc`, custom domain `kamchi.kikkey.com`). `pnpm deploy:preview` publishes to the preview worker. Add the key with `npx wrangler secret put ANTHROPIC_API_KEY` to enable the real vision model.
- **Vercel:** import the repo, framework Next.js, add `ANTHROPIC_API_KEY` (optional); `vercel.json` and the app already send `X-Robots-Tag: noindex` and `robots.txt` disallows everything.

## Accessibility

WCAG 2.0 AA / Israeli Standard 5568: text contrast on black ≥ 7:1, a global "הכול דלוק" control that lights every element at once, keyboard-complete catalogue and portal, reduced-motion fallbacks, skip link, accessibility statement at `/accessibility`.

## Held for follow-up

AR "ראו אותו בחדר" on the phone via WebXR with true scale.
