# Veklom Control Plane Doctrine

> **Read first:** [`docs/capability-os/DESIGN_MODEL.md`](./docs/capability-os/DESIGN_MODEL.md).
> - Veklom is one product.
> - Workspaces are places; capabilities are things paired to a workspace. Shared names are usually deliberate pairings: check identifiers, roles, destinations and carried context before calling anything a duplicate.
> - Every action answers five separate questions: Mode, Location, Containment, Authority, Evidence.
> - "Sandbox" means three different things: the customer playground, LockerPhycer execution containment, and the staging test copy. Never mix them.
> - The playground follows the same rules as live and must never change live state.
>
> The "Product Spine" section below predates the Capability OS lifecycle. Where they conflict, the design model and `docs/capability-os/navigation-map.md` win.

This repository is the private, tier-gated Next.js control plane for Veklom. Treat it as revenue-critical production software, not a demo.

## Product Spine

The primary operator journey is:

`Connected Source -> Repo Risk Gate -> Asset Wrapper -> Marketplace Asset -> Workspace Install -> Deployment -> Terminal Runtime -> Evidence Ledger`

The Asset Spine surface is the canonical operating surface for that journey. Preserve one primary action per stage, inline evidence/context, and honest proof states.

## Non-Negotiables

- No mocks, fake APIs, placeholder UI claims, or "future implementation" language.
- Preserve live API wiring through `lib/api.ts`; same-origin API behavior is intentional.
- Do not expose, edit, or commit secrets. Never modify `.env` or `.env.local` unless explicitly instructed.
- Protect auth, tier gates, billing, marketplace, deployment, and audit/evidence behavior as high-risk surfaces.
- Never claim the full repo-to-runtime chain is proven unless every stage has trace evidence.
- Use exact proof-state language: `Verified`, `Live`, `Needs proof`, `Degraded`, `Not started`, `Manual step`, or `Simulated` only when the data truly indicates simulation.
- Keep UI premium, dense but readable, and aligned to the proactive, self-healing sovereign control plane positioning.

## Critical Files

- `app/ship/page.tsx` and `app/spine/page.tsx`: governed asset spine and proof context.
- `lib/modules.ts`: navigation hierarchy and tiered module inventory.
- `components/Shell.tsx`: authenticated shell, sidebar, command search, tier state.
- `lib/api.ts`: API base, token handling, fetch behavior.
- `lib/auth-context.tsx`, `lib/tiers.ts`, `components/TierGate.tsx`: access control.
- Marketplace, billing, deployment, audit, and security routes are revenue/security critical.

## Required Verification

Before committing production changes, run:

```bash
npm run typecheck
npm run lint
npm run build
```

For visible UI changes, also run the app locally and inspect the affected route. The Asset Spine page must show a readable stage rail, one obvious primary action per stage, inline evidence/context, and no clipped or overlapping text.

## Architecture & Deployment

- **Decoupled Architecture**: This frontend runs entirely independently of the FastAPI backend. Do not attempt to merge it into the backend repo.
- **Deployment authority**: Docker on the user's Windows host with Cloudflare Tunnel/Pages only.

## Commit And Push

When implementation is requested and verification passes, commit the intended changes and push to `origin/main`.
