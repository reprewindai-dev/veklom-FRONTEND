# Handoff Report: Capability OS Architecture & Route Survey

**Agent Directory:** `C:\Users\antho\Documents\Codex\2026-09-16\w\work\veklom-m1p2\veklom-FRONTEND\.agents\teamwork\explorer_survey_2`  
**Deliverable File:** `survey_architecture_routes.md`  
**Git Baseline SHA:** `ca9ad01dc4b014cc99edc18610fe421ec787ec6e`  
**Status:** COMPLETE (Terminal State: FIXED / SURVEY_COMPLETE)  
**Date:** 2026-10-19T02:11:00Z  

---

## 1. Observation

1. **Navigation and Shell:**
   - `lib/cos/nav.ts` (lines 32–55) organizes navigation into two groups: `product` (`workspace`, `evidence`, `computeless`, `settings`) and `inspect` (`terminal` action + `inspectStages` mapped from `spineStages` excluding `evidence`).
   - `components/cos/LeftNav.tsx` (lines 232–290) renders desktop rail (`w-60`) and mobile drawer (`MobileNav`). It uses Framer Motion `layoutId="cos-nav-active-${layoutKey}"` for spring animations, handles the terminal modal trigger (`onTerminal`), and displays sandbox warning banners when active.
   - `components/cos/AppShell.tsx` (lines 54–134) controls environment state (`readEnvironmentIsSandbox()`, listening for `ENVIRONMENT_CHANGED_EVENT`), synchronizes session lease (`readSessionCapabilityLease()`, listening for `veklom.capability_lease.changed`), and mounts global shortcuts (`Cmd+K` command palette, `Ctrl+\`` terminal overlay).
   - `app/os/layout.tsx` (lines 19–31) wraps all `/os/*` child pages within `<AppShell>{children}</AppShell>` and injects SEO breadcrumbs.
   - `app/os/page.tsx` (lines 16–122) currently renders the Capability catalog, recent capabilities, mounted capabilities, `ConsequenceRing`, and `BeaconDiscovery`, rather than the Concept 2 task cockpit.

2. **Existing Lifecycle Pages and Routes:**
   - `/os/mount` (`app/os/mount/page.tsx`, lines 26–140): Fetches catalog via `GET /v1/capability/packages`, binds scope/intent (`storeMountBinding()`), and navigates to `/os/authority`.
   - `/os/blueprint` (`app/os/blueprint/page.tsx`, lines 39–89): Invokes compiler at `/api/v1/gpc/compile` or `/api/abide/v1/blueprint/compile`, rendering `PlanGraphCanvas` and storing result in `sessionStorage.getItem("veklom.blueprint.plan.v1")`.
   - `/os/govern` (`app/os/govern/page.tsx`, lines 40–100): Evaluates pre-execution governance policy via `/api/v1/execution/authorize` and `/v1/governance/v2/assess`, displaying `GovernCanvas` and `PipelinePropertyPanel`.
   - `/os/authority` (`app/os/authority/page.tsx`, lines 68–140): Mints single-use grant via `POST /v1/capability/mounts` to cAPI runtime, extracts `mount_id`, `token_id`, `nonce`, and stores in `storeSessionCapabilityLease()`.
   - `/os/execute` (`app/os/execute/page.tsx`, lines 200–350): Submits consequence request to CAPPO via `POST /v1/capability/mounts/${mountId}/execute`, marks lease consumed (`terminated: true`), and queries target readback via `GET /v1/capability/targets/${targetRef}/state`.
   - `/os/settle` (`app/os/settle/page.tsx`): Surfaces payment discovery (`/.well-known/x402`), pricing (`/api/v1/pricing`), and wallet top-ups.
   - `/os/tracker` (`app/os/tracker/page.tsx`): Evaluates continuous drift checks (`driftChecks`) across contract, grant, execution, evidence, and readback.
   - `/os/evidence` (`app/os/evidence/page.tsx`, lines 30–140): Surfaces execution receipts, queries PGL ledger event hashes (`/api/pgl/ledger/proof/{hash}`), and verifies agent hash chains (`/api/pgl/ledger/agents/{id}/verify`).
   - `/os/measure` (`app/os/measure/page.tsx`): Queries VNP metrics (`/v1/vnp/metrics`) and protocol incidents.
   - `/os/computeless` (`app/os/computeless/page.tsx`): Manages private cloud hardware placement, policies, and workloads.

3. **Transport and Reverse Proxy Routing:**
   - `lib/api.ts` (lines 9–10, 222–257): `API_BASE` is empty by default, routing all `/api/*` requests same-origin to prevent CORS preflight.
   - `app/api/[...proxy]/route.ts`:
     - Lines 191–223: `/api/cappo/*` strips prefix and proxies to `CAPPO_BACKEND_URL`, validating against `isCappoProxyPath()`.
     - Lines 227–237: `/api/abide/*` strips prefix and proxies to `ABIDE_URL`.
     - Lines 224–226: `/api/capi/*` forwards to `CAPI_RUNTIME_URL`.
     - Lines 238–242: `/api/pgl/*` and `/api/ledger/*` forward to `PGL_URL` with injected server secret `x-api-key: PGL_LEDGER_API_KEY`.
     - Lines 270–289: `/api/v1/execution/*`, `/api/v1/gpc/*` forward to `VBB_BACKEND_URL` (`CAPPO_BACKEND_URL`).
   - `lib/cos/verticalSlice.ts` (lines 44–72): `executeGovernedConsequence` calls `POST /api/cappo/v1/exec` with prompt, operation action, scope, capability lease token, and target precondition.
   - `lib/cos/sandbox.tsx` (lines 8–21, 78–116): Sandbox mode sets `execution_scope.project = "sandbox"`. All client storage keys append `.sandbox`.

4. **Task Lifecycle Coordination:**
   - `components/cos/workspace/ConversationWorkspace.tsx` (lines 51–250): Implements a single-conversation lifecycle runner using `useReducer(taskReducer, initialTaskState)` and `useStageData("workspace")`.
   - `lib/cos/tasks/task-reducer.ts` (lines 21–190): State machine transitioning from `idle` ➔ `compiling` ➔ `needs_review` ➔ `requesting_authority` ➔ `executing` ➔ `reading_back` ➔ `done`. Enforces `outcome_unknown` when execution times out or drops without re-executing.
   - `lib/cos/tasks/compile-shape.ts` (lines 32–109): Normalizes Blueprint contract shape (`parseContract`) and Govern plan shape (`parsePlan`) into unified `WorkspacePlan`.
   - `lib/cos/tasks/pipeline-nodes.ts` (lines 18–63): Maps task state to 5 pipeline positions (Prepared, Permission, Executing, Result check, Evidence).

---

## 2. Logic Chain

1. **Premise:** The user requested the Concept 2 task-centric workspace revamp (matching `media_1792374164906_5e94f608.png`) in `veklom-FRONTEND`, coordinating capability preparation, DAG planning, policy evaluation, authority minting, execution, and evidence retrieval without manual navigation across 8 lifecycle tabs.
2. **Observation Alignment:**
   - The shell (`AppShell.tsx`, `LeftNav.tsx`, `nav.ts`) already handles lease synchronization, environment toggling, and collapsible drawer navigation.
   - The transport layer (`app/api/[...proxy]/route.ts`) already proxies ABIDE (`/api/abide/*`), CAPPO (`/api/cappo/*`, `/api/v1/execution/*`), cAPI (`/api/capi/*`), and PGL (`/api/pgl/*`).
   - The task reducer (`task-reducer.ts`) and parser (`compile-shape.ts`) already model contract parsing, action binding, approval pinning, single-use grant minting, execution with nonce consumption, and target readback verification.
3. **Synthesis:**
   - Headless task coordination does NOT require inventing new network protocols or mock layers.
   - `lib/cos/taskController.ts` can extract and unify the coordination routines currently embedded in `ConversationWorkspace.tsx`, providing a headless hook (`useTaskController`) that:
     1. Dispatches intent compilation to `/api/abide/v1/blueprint/compile`.
     2. Generates horizontal DAG steps dynamically.
     3. Prepares capability binding and evaluates pre-execution policy (`/api/v1/execution/authorize`).
     4. Halts and yields control to the Action Approval Card with exact recipient and scope parameters.
     5. On operator approval, mints `SessionCapabilityLease` from cAPI (`POST /v1/capability/mounts`).
     6. Invokes execution on CAPPO consequence authority (`POST /v1/capability/mounts/{mount_id}/execute` or `/api/cappo/v1/exec`).
     7. Handles connection loss fail-closed via `outcome_unknown` ($\Delta C = 0$).
     8. Conducts target readback and PGL receipt retrieval, updating the Inspector panel.
   - Navigation can be streamlined in `lib/cos/nav.ts` to surface the 6 primary product areas while retaining all lifecycle routes in the Inspect drawer.

---

## 3. Caveats

- **Quarantine Queue Proxying:** As documented in `lib/cappo-proxy-paths.ts` (lines 62–66), the quarantine queue (`/v1/governance/v2/quarantine`) is intentionally gated and not forwarded from untrusted browser sessions because CAPPO does not yet scope the queue per-tenant. This does not block Concept 2 task coordination since tasks operate on explicit pre-execution authorizations.
- **ABIDE Compiler Fallback:** In development/staging environments without a live ABIDE microservice (`ABIDE_URL`), the system falls back to GPC (`/api/v1/gpc/compile`) or seeded deterministic contracts as defined in `lib/canonical-backends.ts` and `compile-shape.ts`.

---

## 4. Conclusion

The architecture of `veklom-FRONTEND` is fully prepared for the Concept 2 task-centric revamp. All 8 lifecycle stages are wired to real canonical routes through `app/api/[...proxy]/route.ts`. The state and transition logic in `lib/cos/tasks/` provides an exact blueprint for the headless task coordinator (`lib/cos/taskController.ts`). 

Downstream implementers can safely construct:
1. `lib/cos/taskController.ts` (Headless Coordination Engine)
2. Streamlined `lib/cos/nav.ts` and `components/cos/LeftNav.tsx`
3. Concept 2 UI workspace components (`TaskComposer`, `ActiveTaskCard`, `HorizontalDAG`, `ActionApprovalCard`, `InspectorPanel`) at `app/os/page.tsx`
with zero broken backend wiring and complete preservation of Law 0 invariants.

---

## 5. Verification Method

To verify the findings of this survey independently:

1. **Inspect Route Proxy Wiring:**
   Verify `app/api/[...proxy]/route.ts` line 191 (`/api/cappo/`), line 227 (`/api/abide/`), and line 224 (`/api/capi/`).
2. **Inspect Existing Task Reducer & Parser:**
   Run Jest test suite for task coordination logic:
   ```powershell
   npm test -- lib/cos/tasks/__tests__/task-reducer.test.ts
   ```
   Assert that all 7 test suites pass, demonstrating contract parsing, refusal, approval voiding on contract hash change, and fail-closed handling on lost execute responses.
3. **Inspect Navigation & Shell Hierarchy:**
   Inspect `lib/cos/nav.ts` lines 32–55 and `components/cos/LeftNav.tsx` lines 232–290.
4. **Inspect Survey Report:**
   Read full report at:
   `C:\Users\antho\Documents\Codex\2026-09-16\w\work\veklom-m1p2\veklom-FRONTEND\.agents\teamwork\explorer_survey_2\survey_architecture_routes.md`
