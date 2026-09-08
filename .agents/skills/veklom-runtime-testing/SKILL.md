---
name: veklom-runtime-testing
description: How to run and browser-test the veklom-FRONTEND Next.js app locally (production build, theme/branding/proof surfaces) when backends are unavailable.
---

# Runtime testing veklom-FRONTEND

## Serve the app (do NOT use `next dev`)
In this VM the HMR websocket is blocked, so `next dev` pages never hydrate — client-only behaviour
(theme toggle, `data-theme`, live probes) will look broken. Always test a production build:

```bash
cd <repo>
BACKEND_URL=http://127.0.0.1:8088 CAPPO_BACKEND_URL=http://127.0.0.1:8002 PGL_URL=http://127.0.0.1:8001 npm run build
BACKEND_URL=http://127.0.0.1:8088 CAPPO_BACKEND_URL=http://127.0.0.1:8002 PGL_URL=http://127.0.0.1:8001 npx next start -p 3034
```
Pick a free port per run (3032/3033/3034…) instead of killing existing servers; other agents may be
serving older builds on the standard ports. Verify with
`curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:<port>/`.

## Backends are normally not running here
Expected honest behaviour, not bugs: `/api/v1/auth/me` 502, live-fabric panel `UNAVAILABLE`/`DEGRADED`
with real probe latencies, and `/os` returning `401 {"error":"authentication_required"}` to curl
while the browser is redirected to `/login?returnTo=%2Fos`. Because `/os` never renders HTML
unauthenticated, its `metadata` (og:image etc.) is NOT verifiable at runtime — verify only that the
asset (e.g. `/og-capability-os.jpg`) serves 200 and report the metadata itself as untested.

## Useful runtime assertions (run in the browser console)
- Theme: `document.documentElement.getAttribute('data-theme')` and `localStorage.getItem('veklom-theme')`.
  Human surfaces are `light`/`dark`; `/machine` must be `machine` after hydration, and navigating back
  to `/` must restore the saved human theme.
- Grayscale check for `/machine`: iterate `document.querySelectorAll('*')`, read `color`,
  `backgroundColor`, `borderTopColor`, and flag any rgb whose max-min channel spread > 8 (cyan is
  `rgb(0, 229, 255)`). Wrap console snippets in an IIFE `(()=>{ ... return JSON.stringify(x)})()` —
  bare `const` blocks return `undefined` in this console tool.
- Logo/branding: check the `<img>` in header/footer has `src` `/brand/veklom-shield-512.png` and
  `naturalWidth > 0` (proves the raster actually loaded, not just the tag being present); the machine
  header logo should compute `filter: grayscale(1)`.
- Head metadata: query `meta[property^="og:"]` and `link[rel*="icon"]` rather than reading raw HTML.

## Authenticated `/os` without real backends
`next.config.mjs` rewrites `/api/v1/auth/*` to `LOCKERPHYCER_URL` (prod default `host.docker.internal:8092`).
Build AND start with `LOCKERPHYCER_URL=http://127.0.0.1:8092` and run a throwaway HTTP stub on 8092 that
answers `GET /api/v1/auth/me` 200 `{id,email,name}` and `POST /api/v1/auth/login` 200 `{"access_token":"x"}`.
Then log in through `/login` normally — `lib/api.ts` stores the token in localStorage
`veklom.access_token` + a `veklom.session=present` cookie, which `middleware.ts` uses to let navigation
to `/os` through. Never commit the stub. The `/os` header system cue / identity pill is `hidden xl:flex`,
so use a >=1280px CSS viewport (zoom the browser out) to assert on it.

## Tailwind color alias pitfall (check when "palette restored" is claimed)
Tailwind colors defined as `rgb(var(--theme-x) / <alpha-value>)` only work if the CSS var is a
space-separated tuple (`--theme-accent: 0 229 255`). Comma-separated tuples compile to
`rgb(0, 229, 255 / 1)` (invalid, silently dropped → element inherits body text color). Opacity modifiers
on plain hex vars (`bg-cos-surface2/60`) need a matching `--theme-*-rgb` tuple var or they are never
generated. Verify at runtime: `getComputedStyle(document.documentElement).getPropertyValue('--theme-accent')`
should be space-separated, `.text-cos-accent` should compute `rgb(0, 229, 255)`, and
`[class*="bg-cos-surface2/"]` should have an `rgba(..., 0.6)` background, not `rgba(0,0,0,0)`.
Don't trust build success — assert computed colors. When matching badge text (e.g. "Needs proof"),
filter to elements whose className contains `text-cos-`, otherwise wrapper `div.mt-2` false-positives appear.

## Corrupted `.next` from overlapping builds
If a page renders as raw unstyled HTML, check `document.styleSheets` — a referenced
`/_next/static/chunks/*.css` returning 500 means `.next` was written by two concurrent/killed `next build`
processes. Never start a build from a shell that may be killed on timeout (use `tty: true` and wait with
`get_output`); recover with `rm -rf .next` + one clean build, then `next start` on a fresh port.

## Devin Secrets Needed
None — everything above runs against local ports with backends down.
