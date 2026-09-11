# Project: veklom-FRONTEND Cloudflare Workers Edge Migration

## Architecture
- **Runtime Environment**: Cloudflare Workers Edge (workerd) with `nodejs_compat` (`compatibility_date = "2024-09-23"`).
- **Framework**: Next.js 16.3.0 App Router + React 18.3.1.
- **Edge Adapter**: `@opennextjs/cloudflare` converting `.next` output into Cloudflare Workers bundle (`.open-next/worker.js`) and static assets (`.open-next/assets`).
- **Decoupled Truth Surface**: All 76 public page components are synchronous with zero blocking SSR data fetches. Served from global Cloudflare Edge isolates guaranteeing HTTP 200 independently of local backend infrastructure.
- **Private Ingress Routing**:
  - Primary: Cloudflare Workers VPC binding routing to private Cloudflare Tunnel subnet (`10.0.1.0/24`).
  - Fallback: Dedicated Cloudflare Tunnel hostname (`origin-tunnel.veklom.com` / `api.veklom.com`) protected by Cloudflare Access Service Token headers (`CF-Access-Client-Id` / `CF-Access-Client-Secret`).
- **Zero-Trust Network Isolation**: Local backend ports (8002 CAPPO, 8092 LockerPhycer, 3003 cAPI, 8001 PGL, 3000 VLink) strictly forbidden from public WAN exposure.
- **Resilience & Degraded UX**: Unhandled route fetches wrapped with try/catch; severed connections return 502/503 JSON with `outcome: "OUTCOME_UNKNOWN"`, `status: "degraded"`, and `retryable: false`. `lib/api.ts` dispatches `VeklomDegradedState` on 502/network drops to activate `DegradedBanner` and `StatusPill`.

## Code Layout
- `wrangler.jsonc`: Cloudflare Workers edge configuration, bindings, compatibility flags.
- `open-next.config.ts`: OpenNext Cloudflare adapter build configuration.
- `next.config.mjs`: Rewrites, Webpack externals, edge-compatible routing (stripped of `host.docker.internal`).
- `app/`: Next.js App Router public pages, layouts, and API routes (`app/api/`).
- `components/`: React UI components (`DegradedBanner.tsx`, `LiveProofFabric.tsx`, `NexusProtocol.tsx`, `Sidebar.tsx`).
- `lib/`: Utilities, API client (`lib/api.ts`), interlink-capi edge helpers (`lib/interlink-capi/edge.ts`).
- `scripts/`: Kill test and verification scripts (`scripts/kill-test.ps1`, `scripts/kill-test.sh`).
- `tests/e2e/`: Comprehensive opaque-box E2E test suite.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---|---|---|---|
| 1 | OpenNext Edge Adapter Integration | Configure `@opennextjs/cloudflare` and `wrangler.jsonc` with `nodejs_compat` | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Worker Build Pipeline | Implement `build:worker` and `preview:worker` scripts outputting valid Cloudflare Workers artifact | M1 | ORIGINAL_REQUEST §R1 |
| 3 | TypeScript & Dependency Hygiene | Move `puppeteer` to devDeps, fix syntax errors in `NexusProtocol.tsx` and `Sidebar.tsx` | M1 | Survey 1 & 2 |
| 4 | Strip Docker Bridge Rewrites | Remove `host.docker.internal` and `rewriteLocalhost` from `next.config.mjs` | M2 | ORIGINAL_REQUEST §R2 |
| 5 | Edge Health & Status Decoupling | Route `/health/` and `/status/` to internal edge handler (`app/api/health/route.ts`) rather than LockerPhycer | M2 | ORIGINAL_REQUEST §R2, Survey 1 |
| 6 | Public Route 200 Guarantee | Ensure all 76 public routes render HTTP 200 without blocking on backend availability | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Tunnel & VPC Ingress Configuration | Configure private routing via Workers VPC binding or authenticated Cloudflare Access headers | M3 | ORIGINAL_REQUEST §R3 |
| 8 | Zero-Trust Backend Isolation | Enforce WAN isolation for ports 8002, 8092, 3003, 8001, 3000 per veklom-doctrine | M3 | ORIGINAL_REQUEST §R3, Survey 3 |
| 9 | API Route Resilience & Error Catching | Wrap unhandled API fetch promises (`vnp/methodology`, `n8n-executions`) with structured 502/OUTCOME_UNKNOWN | M3 | ORIGINAL_REQUEST §R3, Survey 1 |
| 10 | Client Degraded State Propagation | Expand `lib/api.ts` to dispatch `VeklomDegradedState` on 502 and network failures to trigger `DegradedBanner` | M3 | ORIGINAL_REQUEST §R3, Survey 1 & 3 |
| 11 | Non-Retryable Consequence Defense | Enforce `retryable: false` on `OUTCOME_UNKNOWN` to prevent duplicate mutation side-effects | M3 | Survey 3 (Doctrine) |
| 12 | Comprehensive E2E Test Suite | Design 4-tier opaque-box test suite (Feature, Boundary, Combinatorial, Real-World) | M4 | Dual Track Methodology |
| 13 | Local Simulation with Wrangler | Run edge worker locally via `wrangler dev` | M4 | ORIGINAL_REQUEST §Verification |
| 14 | Automated Adversarial Kill Test | Execute automated kill test simulating total backend shutdown and asserting HTTP 200 survival and bounded degradation | M4 | ORIGINAL_REQUEST §Verification |
| 15 | Forensic Integrity & Victory Audit | Independent verification of zero hardcoding, genuine edge execution, and acceptance criteria | M5 | ORIGINAL_REQUEST §Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1 | Adapter & Build Configuration | OpenNext integration, `wrangler.jsonc`, `open-next.config.ts`, build scripts, TS fixes, devDeps hygiene | none | DONE |
| M2 | Decouple Public Surface from Local Origin | Eliminate `host.docker.internal`, decouple `/health/` and `/status/`, verify HTTP 200 public surface | M1 | IN_PROGRESS |
| M3 | Resilient API Routing & Degraded State | Workers VPC / Access routing, API fetch try/catch, OUTCOME_UNKNOWN, `lib/api.ts` 502 dispatch, DegradedBanner | M2 | PLANNED |
| M4 | Comprehensive E2E Testing & Kill Test Verification | 4-tier E2E test suite, `TEST_READY.md`, wrangler local simulation, automated kill test script execution | M3 | PLANNED |
| M5 | Final Victory Audit & Acceptance Verification | Forensic integrity audit, acceptance verification, final report to Sentinel | M4 | PLANNED |

## Interface Contracts

### Edge Worker ↔ Cloudflare Tunnel / Backend Ingress
- **Primary Transport**: Workers VPC Binding / WARP private network route `10.0.1.0/24`.
- **Fallback Transport**: HTTPS to dedicated Tunnel hostname (`origin-tunnel.veklom.com`).
- **Authentication Headers**:
  - `CF-Access-Client-Id: <service-token-id>`
  - `CF-Access-Client-Secret: <service-token-secret>`
- **HTTP Semantics**:
  - Upstream 200-299: Passed through to client.
  - Upstream 502/504 / Connection Refused: Caught and transformed to:
    ```json
    {
      "status": "degraded",
      "outcome": "OUTCOME_UNKNOWN",
      "retryable": false,
      "error": "Upstream backend unreachable. Operating in read-only degraded mode."
    }
    ```
    HTTP Status: 502 Bad Gateway.

### Client API (`lib/api.ts`) ↔ UI State (`DegradedBanner.tsx`)
- **Event**: `window.dispatchEvent(new CustomEvent("VeklomDegradedState", { detail: { isDegraded: boolean, message: string } }))`
- **Triggers**:
  - `res.status === 503`
  - `res.status === 502`
  - Network disconnection / fetch throws TypeError
  - `json.status === "degraded"` or `json._stale === true` or `json.outcome === "OUTCOME_UNKNOWN"`
