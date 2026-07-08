# Veklom Control Plane

Production frontend for the Veklom sovereign AI control plane and Veklom Nexus Protocol surfaces.

## Live Domains

- Public application: `https://veklom.com`
- VNP standard and docs entry: `https://veklom.com/vnp`
- Developer surface: `https://veklom.dev`
- Backend API: `https://api.veklom.com`

The app is deployed through Coolify, not Vercel. The frontend is a standalone Next.js service that talks to the live FastAPI backend through same-origin API rewrites and the canonical backend URL.

## What This Repo Owns

- Main Veklom landing page and monetization flow.
- `/vnp` standalone Veklom Nexus Protocol surface.
- Local VNP docs hub under `/vnp/docs` and the `(docs)` pages.
- UACP control-plane routes, including Nexus Protocol, runtime, governance, staking, incidents, and workspace surfaces.
- Tier-gated SaaS control-plane modules for billing, usage, routing, audit, governance, security, team, subscriptions, deployments, and admin.
- Frontend API proxy routes that connect the app to the production backend without exposing secrets.

## VNP Positioning

VNP is the API benchmark and routing standard for machine-consumable trust. It is not an LLM benchmark card clone.

The VNP card surface must stay true to:

- The selected API being scored.
- The live VNP methodology and scoring engine.
- Signed probe data and regional evidence.
- x402 settlement and performance-bond logic.
- Veklom's deployed Coolify and backend topology.

Reference material such as BenchmarkCards or the prototype repo can guide documentation structure and visual seriousness, but the source of truth is this codebase, the VNP scoring implementation, and the live backend contracts.

## Stack

- Next.js App Router
- React 18
- TypeScript
- Tailwind CSS
- SWR and React Query for frontend data flows
- JWT auth against the live backend
- Coolify deployment with Docker/Nixpacks-compatible output

## Backend Contract

Primary backend:

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.veklom.com
```

Production client code should call same-origin routes where possible, for example:

```ts
fetch("/api/v1/auth/me")
```

The frontend proxy and rewrite layer route those calls to the canonical backend. Do not add mock production endpoints or fake API fallbacks.

## Local Development

```bash
npm install
npm run dev
```

Default local dev port:

```bash
http://localhost:3002
```

Useful routes:

- `http://localhost:3002`
- `http://localhost:3002/vnp`
- `http://localhost:3002/vnp/docs`
- `http://localhost:3002/nexus`

## Production Build

Required checks before pushing:

```bash
npm run typecheck
npm run lint
npm run build
```

The build emits standalone output for Coolify. Use the included `Dockerfile` or Coolify's build flow, with environment variables configured in Coolify secrets.

## Coolify Deployment Notes

Coolify should provide:

- `NEXT_PUBLIC_API_BASE_URL=https://api.veklom.com`
- Any wallet, Reown, or marketplace public IDs required by the frontend.
- Server-side secrets only through Coolify environment management.

The app should be routed by Coolify/Traefik to:

- `veklom.com`
- `www.veklom.com`
- `veklom.dev` when attached as the developer surface

Do not document Vercel as the deployment target for this repo.

## Security Rules

- No secrets in source.
- No fake production APIs.
- No unsafe token logging.
- No untrusted HTML injection.
- Auth and tier gates must remain tied to backend state.
- Admin surfaces must remain hidden unless backend user state grants superuser access.

## Notes

- PGL Genome DNA is a separate identity/lineage concept and should not be removed just because the VNP API scoring visual moved away from DNA/helix imagery.
- The VNP API benchmark card should remain methodology-backed and API-specific.
- Public docs belong inside the app under `/vnp/docs`, not an external docs domain.
