# Technical Survey: Baseline Repository State, Build Infrastructure, Test Suite, and Container Environment

**Date:** 2026-10-19  
**Repository:** `veklom-m1p2/veklom-FRONTEND`  
**Working Directory:** `C:\Users\antho\Documents\Codex\2026-09-16\w\work\veklom-m1p2\veklom-FRONTEND`  
**Investigator:** Baseline Infra Explorer (`explorer_survey_1`)  
**Parent Orchestrator:** `eca4aa8b-8168-4d21-abdb-e212722c7569`  

---

## Executive Summary

1. **Git State Confirmed:** Repository is on branch `claude/clever-mccarthy-10fy15`, tracking `origin/claude/clever-mccarthy-10fy15`, exactly pinned at SHA `ca9ad01dc4b014cc99edc18610fe421ec787ec6e` (`feat(cos): revamp shell navigation into 4 core product areas with progressive inspect drawer`). Tracked working tree is 100% clean.
2. **Live Production Container Confirmed:** Container `a0eec25b77cc` (`veklom-frontend`) is running healthy on `127.0.0.1:3002`, using image `veklom/frontend:prod-ca9ad01`. Pinging `http://127.0.0.1:3002/api/health` physically returns `HTTP 200 OK` (`{"ok":true,"service":"veklom-frontend","runtime":"nextjs",...}`).
3. **Test Suite Baseline (Jest):** Ran `jest lib components --runInBand` (`npm.cmd test`). Total: **61 test suites, 339 tests**. **58 suites passed, 333 tests passed, 1 skipped, 3 suites failed (5 tests failed)**. The 3 failures are pre-existing unaligned assertions from recent commits (`workspace` stage introduction, 2026-10-10 production maturity proof in consequence ring, and landing page CTA updates).
4. **Tooling & Platform Quirk:** PowerShell script execution policy on Windows restricts running `npm.ps1`. All node/npm commands must be invoked via `npm.cmd` or `npx.cmd`.
5. **Build Architecture:** Next.js 16.3.0 configured with `output: "standalone"`, `typescript: { ignoreBuildErrors: true }`, CPU concurrency throttled to 2 workers for container memory safety, and strict reverse proxy rewrites routing to LockerPhycer (identity), CAPPO (authority), PGL (ledger), CAPI (capability registry), and VNP (measurement).

---

## 1. Git Status & Repository Baseline

### 1.1 Physical Verification Evidence
- **Current HEAD SHA:** `ca9ad01dc4b014cc99edc18610fe421ec787ec6e`
- **Commit Subject:** `feat(cos): revamp shell navigation into 4 core product areas with progressive inspect drawer`
- **Current Branch:** `claude/clever-mccarthy-10fy15`
- **Upstream Tracking:** `origin/claude/clever-mccarthy-10fy15` (up to date)
- **Remote Origin:** `https://github.com/reprewindai-dev/veklom-FRONTEND.git`

### 1.2 Working Tree Status
- **Tracked Modifications:** Clean (`git diff --stat` and `git diff --staged --stat` returned empty).
- **Untracked Files:**
  - `.agents/teamwork/` (agent orchestrator and subagent survey metadata)
  - `pr148.json` (PR metadata payload)
  - `scripts/docker-public-watchdog.ps1.disabled-20261009`
  - `scripts/start-public-docker.ps1.disabled-20261009`

### 1.3 Available Branches
- Local branches include: `claude/clever-mccarthy-10fy15`, `antigravity/m1-p2-closure`, `codex/m1-p2-closure`, `feat/private-cloud`, `feat/base-wallet`, `release/20260930`, `main`.
- Remote branches include 70+ tracked branches on `origin`.
- **Target Branch Note:** `ORIGINAL_REQUEST.md` mandates creating branch `revamp/capability-os-task-workspace` directly off `ca9ad01`. As explorer, we preserve read-only investigation and do not mutate branches.

---

## 2. Package Dependencies & Scripts

### 2.1 Runtime Environment
- **Node.js:** `v24.20.0`
- **npm:** `11.19.0` (invoked via `npm.cmd` due to Windows PowerShell ExecutionPolicy blocking `npm.ps1`)

### 2.2 Framework & Core Dependencies
| Dependency | Version in `package.json` | Category / Usage |
|---|---|---|
| `next` | `16.3.0` | React Framework (App Router, Standalone) |
| `react` / `react-dom` | `18.3.1` | Core UI Library |
| `tailwindcss` | `3.4.6` | Utility-first styling with custom theme tokens |
| `typescript` | `5.5.3` | Static typing (`tsconfig.json`) |
| `jest` | `^30.4.2` | Test runner |
| `ts-jest` | `^29.4.11` | TypeScript preprocessor for Jest |
| `jest-environment-jsdom`| `^30.4.1` | DOM environment simulation |
| `eslint` | `^9.39.5` | Code quality linter |
| `eslint-config-next` | `^16.3.1` | Next.js ESLint ruleset |
| `zustand` | `^5.0.14` | Client-side state management |
| `swr` | `2.2.5` | Client-side remote data fetching |
| `lucide-react` | `^0.408.0` | Icon system |
| `reactflow` | `^11.11.4` | Node/DAG visual flow engine |
| `framer-motion` / `motion`| `^12.41.0` / `^12.40.0`| Animation & transitions |
| `@coinbase/cdp-sdk` | `^1.57.1` | Base / CDP Embedded Wallet SDK |
| `@coinbase/cdp-react` | `^0.0.126` | CDP React components |
| `@noble/ciphers` | `1.3.0` | Cryptographic ciphers (ChaCha20Poly1305) |
| `@noble/curves` | `1.2.0` | Ed25519 / X25519 curves |
| `@noble/hashes` | `1.3.2` | HKDF / SHA-256 |
| `viem` / `wagmi` | `^2.53.1` / `^3.6.18`| Ethereum / Base client integration |

### 2.3 Scripts & Workflows in `package.json`
- `npm run dev`: `next dev -p 3002` (local dev server on port 3002)
- `npm run build`: `next build` (standalone production build)
- `npm run start`: `next start -H 0.0.0.0 -p ${PORT:-3002}`
- `npm test`: `jest lib components --runInBand` (runs unit & component test suites)
- `npm run lint`: `eslint .` (passes with 0 errors, 6 warnings)
- `npm run typecheck`: `tsc --noEmit`
- `npm run ci:gate`: `bash scripts/ci-gate.sh` (runs lint, typecheck, test, build)
- `npm run ci:docker`: `docker compose -f docker-compose.ci.yml run --rm --build gate`
- `npm run test:runtime-port`: `node scripts/check-runtime-port.mjs` (PASSED)
- `npm run test:vnp-copy`: `node scripts/check-vnp-public-copy.mjs` (PASSED)
- `npm run audit:cos-runtime`: `node scripts/audit-cos-runtime.mjs`

### 2.4 Host Node_Modules Dependency Gotcha
On the local Windows host checkout, `node_modules` was instantiated before `@noble/*` and `@coinbase/cdp-*` were added to `package.json`. Consequently, running `tsc --noEmit` or `npm run build` directly on the host OS triggers `Cannot find module '@noble/ciphers/chacha'` and `@coinbase/cdp-react`.
Inside Docker (`Dockerfile` and `Dockerfile.ci`), `npm ci --legacy-peer-deps` installs all dependencies cleanly, and `next.config.mjs` sets `typescript: { ignoreBuildErrors: true }`.

---

## 3. Live Container & Docker Environment

### 3.1 Target Container Physical Status
- **Container Name:** `veklom-frontend`
- **Container ID:** `a0eec25b77cc`
- **Docker Image:** `veklom/frontend:prod-ca9ad01` (ID `0ae431bbfdac`, 336 MB)
- **Status:** `Up 2+ hours (healthy)`
- **Port Mapping:** `127.0.0.1:3002 -> 3002/tcp` (and `127.0.0.1:3037 -> 3002/tcp` via compose)
- **Healthcheck Command:** `wget -qO- http://127.0.0.1:3002/api/health >/dev/null || exit 1`

### 3.2 Live Network Telemetry
Physical HTTP readback from `http://127.0.0.1:3002`:
- `GET /api/health` -> `HTTP/1.1 200 OK`
  ```json
  {"ok":true,"service":"veklom-frontend","runtime":"nextjs","timestamp":"2026-10-19T02:06:09.904Z","commit":null,"environment":"production"}
  ```
- `GET /` -> `HTTP/1.1 200 OK` (`X-Powered-By: Next.js`, HTML response)

### 3.3 Supporting Local Mesh Containers
Physical inspection of active Docker containers shows the following companion services running locally:
- `veklom-cappo`: `veklom/cappo:prod-21e1002` on `127.0.0.1:8002` (Up, healthy)
- `veklom-capi`: `veklom/capi:prod-6984f56` on `127.0.0.1:3003` (Up, healthy)
- `veklom-vlink`: `veklom/vlink:rc1-candidate` on `127.0.0.1:3000` (Up, healthy)
- `veklom-gnomledger`: `veklom/gnomledger:rc1-candidate` on `127.0.0.1:8001` (Up, healthy)
- `veklom-mcp`: `node:22-alpine` on `127.0.0.1:8811` (Up, healthy)
- `veklom-document-vault`: `veklom/document-vault:prod-119a9b0` on `8791/tcp` (Up)
- `veklom-arena-target`: `veklom-arena/target:prod-d1ba580` on `8790/tcp` (Up)

### 3.4 Dockerfile & Compose Configuration
- `Dockerfile`:
  - Stage 1 (`deps`): `FROM node:20-alpine`, runs `npm ci --legacy-peer-deps --no-audit --no-fund --fetch-retries 5 --maxsockets 5`.
  - Stage 2 (`builder`): Compiles standalone Next.js build with ARG inputs for `BACKEND_URL`, `LOCKERPHYCER_URL`, `CAPI_URL`, `CAPPO_URL`, `PGL_URL`, `VLINK_URL`.
  - Stage 3 (`runner`): Copies `.next/standalone`, `.next/static`, and `public` to lightweight production image run as non-root `nextjs:nodejs`.
- `docker-compose.public.yml`:
  - Sets `mem_limit: 2g`, `mem_reservation: 512m`.
  - Binds ports `127.0.0.1:3002:3002` and `127.0.0.1:3037:3002`.
  - Runs companion `cloudflared` tunnel linked to the frontend healthcheck.

---

## 4. Current Test Suite State

### 4.1 Test Execution Metrics (`npm.cmd test`)
- **Total Test Suites:** 61
  - **Passing Suites:** 58
  - **Failing Suites:** 3
- **Total Tests:** 339
  - **Passing Tests:** 333
  - **Skipped Tests:** 1
  - **Failing Tests:** 5
- **Execution Time:** ~20.6 seconds (run with `--runInBand`)

### 4.2 Exact Anatomy of Failing Tests

#### Suite 1: `lib/__tests__/cos-mount-transport.test.ts` (1 failed test)
- **Failing Test:** `Capability OS stage transport › uses canonical lifecycle labels and omits decommissioned endpoint ownership` (line 11)
- **Error:**
  ```
  expect(received).toEqual(expected)
  - Expected: ["computeless", "capabilities", "mount", "blueprint", "govern", "authority", ...]
  + Received: ["computeless", "workspace", "capabilities", "mount", "blueprint", "govern", "authority", ...]
  ```
- **Root Cause:** Commit `ca9ad01` (or `184e2bf`) added `"workspace"` as a first-class stage in `lib/cos/stages.ts`, but this test was not updated to include `"workspace"` in its expected stage ID array.

#### Suite 2: `lib/__tests__/consequence-ring.test.ts` (2 failed tests)
- **Failing Test 1:** `recorded proof is separate from session state › reports authority from recorded runs, not from whether this session holds a lease` (line 23)
  - Expected: `"Proven on staging"`
  - Received: `"Proven in production"`
- **Failing Test 2:** `recorded proof is separate from session state › claims nothing in production until a production run is recorded` (line 28)
  - Expected: `proof.status` not `"Proven in production"` for all positions.
  - Received: `"Proven in production"` for `identity`, `connection`, and `authority`.
- **Root Cause:** `lib/cos/consequence-ring.ts` (lines 173-187) was updated after recorded runs on `veklom.com` on 2026-10-10 to mark `identity`, `connection`, and `authority` as `"Proven in production"`. The test in `consequence-ring.test.ts` still asserts obsolete staging-only assumptions.

#### Suite 3: `lib/__tests__/vlink-funnel.test.ts` (2 failed tests)
- **Failing Test 1:** `VLink front-door funnel › wires the primary CTAs, nav and /get to the signup URL` (line 30)
  - Expected `app/page.tsx` to contain `"Start free with VLink"` and `"href={SIGNUP_URL}"`.
- **Failing Test 2:** `VLink front-door funnel › shows the Product Hunt launch badge on the home page` (line 40)
  - Expected `app/page.tsx` to contain `data-testid="product-hunt-badge"`.
- **Root Cause:** In commit `1f9b5c0` (`feat(cos): combine clever-mccarthy one-conversation workspace with live govern and blueprint canvas`), `app/page.tsx` was modified to update the landing page hero and grid, dropping the Product Hunt badge element and changing the CTA strings.

### 4.3 Static Lint Verification (`npm.cmd run lint`)
- **Status:** **PASSED** (exit code 0).
- **Problems:** 0 errors, 6 warnings (unused eslint-disable directives and client component location assignments).

---

## 5. Build Setup & Next.js Architecture

### 5.1 Next.js Configuration (`next.config.mjs`)
1. **Standalone Deployment:** `output: "standalone"` compiles all dependencies and node server code into `.next/standalone`, allowing production execution with minimal image footprint via `node server.js`.
2. **Container Memory Protection:** `experimental: { proxyTimeout: 60_000, cpus: 2 }` restricts parallel workers during static generation to 2 CPUs, avoiding out-of-memory errors observed when default worker count ran on host CPU count.
3. **TypeScript Tolerant Compilation:** `typescript: { ignoreBuildErrors: true }` ensures Next.js build is not halted by missing external package types during build.
4. **Server-Side Web3 Externalization:** `wagmi`, `viem`, `@wagmi/core`, `@wagmi/connectors`, `mppx`, `ox`, `accounts` are externalized on the server bundle to reduce chunk size and eliminate node-incompatible modules from SSR.
5. **Reverse Proxy & Upstream Routing:**
   - Strict upstream segmentation:
     - Identity: `LOCKERPHYCER_URL` (default `http://127.0.0.1:8092`)
     - Authority / Execution: `CAPPO_URL` (default `http://127.0.0.1:8002` / `https://cappo.veklom.com`)
     - Evidence Ledger: `PGL_URL` (default `http://127.0.0.1:8001` / `https://pgl.veklom.com`)
     - Capability Registry: `CAPI_URL` (default `http://127.0.0.1:3003` / `https://capi.veklom.com`)
     - Measurement: `VNP_URL` (default `https://vnp.veklom.com`)
     - VLink: `VLINK_URL` (default `http://127.0.0.1:3000`)
   - **Fail-Closed Governance Invariant:** Unmatched `/api/*` routes are deliberately NOT routed to any legacy backend fallback; they return `HTTP 404` directly from Next.js to prevent silent authority leaks.

### 5.2 TypeScript Configuration (`tsconfig.json`)
- Strict mode enabled (`strict: true`).
- Path mapping configured: `@/*` -> `./*`.
- Excludes test files (`**/*.test.ts`, `**/*.test.tsx`) and legacy drafts (`tests/e2e.spec.ts`) from production compilation.

---

## 6. Recommendations for Downstream Implementation Specialists

1. **Test Suite Baseline Awareness:**
   - The test baseline is 333 passing / 5 failing out of 339 tests.
   - When verifying acceptance criteria ("Existing Jest test suite passes with 0 regressions"), the 5 failing tests in `vlink-funnel.test.ts`, `cos-mount-transport.test.ts`, and `consequence-ring.test.ts` should either be reconciled as pre-existing drift or fixed as part of baseline hygiene.
2. **Execution Environment Command Format:**
   - In PowerShell terminal commands, always use `npm.cmd` and `npx.cmd` rather than `npm` or `npx` to avoid the PowerShell `ExecutionPolicy` security block.
3. **Build Target Validation:**
   - Because the host's `node_modules` lacks `@noble/*` and `@coinbase/*` packages, full build verification should leverage containerized cgroup builds (`npm run ci:docker` or building the Docker container directly) as defined in the Acceptance Criteria: *"Build standalone bundle cleanly using containerized cgroup limits."*
