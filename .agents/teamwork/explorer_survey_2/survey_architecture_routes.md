# Capability OS Architecture & Route Survey Report

**Checkout Baseline:** `C:\Users\antho\Documents\Codex\2026-09-16\w\work\veklom-m1p2\veklom-FRONTEND`  
**Git Baseline SHA:** `ca9ad01dc4b014cc99edc18610fe421ec787ec6e`  
**Target Milestone:** Concept 2 Task-Centric Workspace Revamp  
**Investigator:** Codebase Architecture Explorer (`explorer_survey_2`)  
**Date:** 2026-10-19T02:09:00Z  

---

## Executive Summary

This architectural survey provides a deep, evidence-grounded blueprint of the Veklom Capability OS implementation within `veklom-FRONTEND`. The current architecture features a modular 8-stage lifecycle model (`mount`, `blueprint`, `govern`, `authority`, `execute`, `evidence`, `measure`, `settle`) alongside cross-cutting product areas (`workspace`, `computeless`, `tracker`, `settings`, `terminal`). 

The Concept 2 workspace revamp aims to streamline user interaction into a unified, intent-driven cockpit matching `media_1792374164906_5e94f608.png`:
1. **Task Composer Box** for natural-language intent input.
2. **Active Task Card** showing status and generated assets.
3. **Horizontal Execution DAG** dynamically tracing node lifecycle states without manual tab-hopping.
4. **Exact Action Approval Card** enforcing the Law 0 consequence gate with exact recipient/parameter bindings.
5. **Inspector Panel (Right Rail)** displaying capability metadata, policy status, lease authority, execution receipts, and verifiable PGL audit proofs.

Crucially, the survey confirms that existing transport bridges, reverse-proxy routing tables (`app/api/[...proxy]/route.ts`), session lease stores (`lib/cos/lease-session.ts`), and stage reducers (`lib/cos/tasks/task-reducer.ts`) already contain all necessary primitives to drive an autonomous, headless task coordinator engine (`lib/cos/taskController.ts`) with zero broken wiring and strict Law 0 adherence ($\Delta C = 0$ on rejection/failure).

---

## 1. Navigation and Shell Architecture

### 1.1 `lib/cos/nav.ts`
- **Location:** `lib/cos/nav.ts` (Lines 1–61)
- **Role:** Declares the navigation hierarchy (`NavGroup[]`, `NavItem[]`) and active-route matching.
- **Current Structure:**
  - `Core Product` group:
    - `workspace`: `/os/workspace` (Hint: "Cockpit")
    - `evidence`: `/os/evidence` (Hint: "Ledger")
    - `computeless`: `/os/computeless` (Hint: "Substrate")
    - `settings`: `/os/settings`
  - `Advanced / Inspect` group (`collapsible: true`, `defaultCollapsed: true`):
    - `terminal`: Live Terminal action (`Ctrl+\`` overlay)
    - `inspectStages`: All stages from `spineStages` in `lib/cos/stages.ts` except `evidence` (`mount`, `blueprint`, `govern`, `authority`, `execute`, `measure`, `settle`, `tracker`).
- **Route Matching Logic:**
  - `isActiveRoute(pathname, route)` (Lines 57–60):
    - Matches exact `/os` or prefix `/route` / `/route/*`.
- **Concept 2 Revamp Alignment (R3):**
  - Requires updating `navGroups` to surface the streamlined menu:
    `Workspace` (`/os`), `Capabilities` (`/os`), `Governed` (`/os/govern`), `Evidence Vault` (`/os/evidence`), `Measure` (`/os/measure`), `Private Cloud` (`/os/computeless`), `Settings`.
  - Advanced/Inspect drawer retains developer deep-links to `/os/mount`, `/os/blueprint`, `/os/authority`, `/os/execute`, `/os/settle`, `/os/tracker`.

### 1.2 `components/cos/LeftNav.tsx`
- **Location:** `components/cos/LeftNav.tsx` (Lines 1–290)
- **Role:** Renders the desktop left rail (`w-60 shrink-0 border-r border-cos-border`) and the mobile drawer (`MobileNav`).
- **Key Mechanics:**
  - Icons map (`icons`: Record<string, LucideIcon>) maps IDs to icons (Lines 35–55).
  - `NavGroupSection` handles group rendering, collapse toggles, and item links.
  - Active indicator uses Framer Motion spring: `layoutId={"cos-nav-active-" + layoutKey}`.
  - Terminal trigger: invokes `props.onTerminal()` on click.
  - Sandbox indicator: renders `<div data-testid="sandbox-rail-footer">` with `SANDBOX_COPY.railFooter` if `props.sandbox` is active.

### 1.3 `components/cos/AppShell.tsx`
- **Location:** `components/cos/AppShell.tsx` (Lines 1–135)
- **Role:** Master wrapper providing theme, environment context, session lease synchronization, command palettes, and global overlays.
- **Key Mechanics:**
  - **Environment Gating:** Listens to `ENVIRONMENT_CHANGED_EVENT` (`lib/cos/sandbox.tsx`), updating `sandbox` boolean. Keying `<main key={environmentKey}>` forces full remount on sandbox/live toggles to prevent state crossover.
  - **Lease Synchronization:** Listens to `veklom.capability_lease.changed`, reading `readSessionCapabilityLease()`. Displays active lease badge in header: `<Cpu /> Held mount <ProofBadge status="Present" />`.
  - **Header Surfaces:**
    - Logo (`<VeklomLogo />`)
    - Shortcut link to `/os/workspace` (`<MessageSquareText size={13} /> Workspace`)
    - Shortcut link to `/proof` (`<FileCheck2 size={13} /> Proof`)
    - `<RuntimePill sandbox={sandbox} />`
    - `<ProdSandboxToggle sandbox={sandbox} onChange={setSandbox} />`
    - `<AccountMenu />`, `<ThemeToggle />`, Command Palette trigger (`Ctrl+K`), live UTC clock.
  - **Under-Header Rails:**
    - `<EnvironmentFrame />`: Visual environment boundary banner.
    - `<CapabilityContextBar />`: Displays currently selected capability context.
    - `<WorkspaceNotice />`: Warnings when session lacks a bound workspace ID.
  - **Overlays:**
    - `<CommandPalette open={paletteOpen} ... />`
    - `<TerminalConsole open={terminalOpen} ... />` (toggled by `Ctrl+\`` or LeftNav action).

### 1.4 `app/os/layout.tsx`
- **Location:** `app/os/layout.tsx` (Lines 1–32)
- **Role:** Root layout for all `/os/*` routes.
- **Structure:**
  - Injects `BreadcrumbJsonLd` schema.
  - Generates SEO metadata via `brandShareMetadata("capability-os", ...)`.
  - Wraps all children directly within `<AppShell>{children}</AppShell>`.

### 1.5 `app/os/page.tsx`
- **Location:** `app/os/page.tsx` (Lines 1–123)
- **Current Role:** Capability Catalog & Beacon Discovery home page.
- **Rendered Components:**
  - `GettingStarted`
  - `ConsequenceRing` (subject: "What this workspace can currently prove")
  - `CapabilitySearch` (query filter)
  - `SandboxScenarios` (rehearsal runner)
  - `BeaconDiscovery`
  - Recently used capability cards (backed by `localStorage` key `veklom.cos.recent-capabilities`)
  - Mounted capabilities grid
  - Full capability catalog grid (from `lib/cos/capabilities.ts`)
- **Concept 2 Transition Note:**
  - R1 specifies implementing the Concept 2 Task Workspace at `/os` (`app/os/page.tsx` or `/os/workspace`). Transforming `/os` to render the Concept 2 workspace will allow the primary entry point to serve the task composer and execution pipeline while keeping `/os` catalog cards accessible via tabs or secondary views.

---

## 2. Existing Lifecycle Pages and Routes (`app/os/*`)

Each lifecycle stage currently exists as a standalone diagnostic route with its own state and actions:

| Route | Stage ID | Primary Component | State Held & Storage Keys | Actions Invoked / Endpoints |
|---|---|---|---|---|
| `/os/mount` | `mount` | `MountPage` | `packageRef`, `workspace`, `project`, `reads`, `writes`, `blocked`, `resource`, `ttl`, `pendingIntent` (`veklom.execution_intent`), `prepared` (`veklom.mount_binding`) | `GET /v1/capability/packages`<br>`storeMountBinding()` ➔ navigates to `/os/authority` |
| `/os/blueprint` | `blueprint` | `BlueprintPage` | `intent`, `provider`, `model`, `complianceInput`, `plan` (`sessionStorage: veklom.blueprint.plan.v1`) | `POST /api/v1/gpc/compile`<br>`POST /api/abide/v1/blueprint/compile`<br>`GET /api/v1/gpc/stats` |
| `/os/govern` | `govern` | `GovernPage` | `agentId`, `capabilityId`, `directive`, `trustScore`, `selectedNode`, `graph` (nodes & edges) | `POST /api/v1/execution/authorize`<br>`POST /v1/governance/v2/assess`<br>`GET /v1/governance/v2/quarantine` |
| `/os/authority` | `authority` | `AuthorityPage` | `binding` (`readMountBinding`), `mountResponse`, `actionResponse`, `heldLease` (`veklom.capability_lease`) | `POST /v1/capability/mounts` (mints lease)<br>`POST /v1/capability/mounts/{id}/actions`<br>`POST /v1/capability/mounts/{id}/terminate`<br>`GET /api/v1/agents` |
| `/os/execute` | `execute` | `ExecutePage` | `lease`, `consequence` (`veklom.capability_consequence`), `lastResponse`, `operationId`, `blockedAction`, `replayInvariantViolation` | `POST /v1/capability/mounts/{id}/execute`<br>`GET /v1/capability/targets/{ref}/state` (readback)<br>`POST /v1/capability/mounts/{id}/terminate` |
| `/os/settle` | `settle` | `SettlePage` | `discovery`, `pricing`, `wallet` (balance, transactions, top-up options via `useApi`) | `GET /.well-known/x402`<br>`GET /api/v1/pricing`<br>`POST /api/v1/wallet/topup/checkout` |
| `/os/tracker` | `tracker` | `TrackerPage` | `lease`, `consequence`, `checks` (`driftChecks`), `runs`, `ledgerRows` | `GET /v1/capability/packages`<br>`GET /v1/runs`<br>`GET /v1/audit/ledger` |
| `/os/evidence` | `evidence` | `EvidencePage` | `lease`, `consequence`, `eventHash`, `agentId`, `lookup`, `chain` | `GET /v1/audit/verify`<br>`GET /api/pgl/ledger/proof/{hash}`<br>`GET /api/pgl/ledger/agents/{id}/verify`<br>`GET /v1/audit/ledger` |
| `/os/measure` | `measure` | `MeasurePage` | `latency`, `throughput`, `incidents` | `GET /v1/vnp/metrics`<br>`GET /v1/vnp/incidents`<br>`GET /v1/vnp/leaderboard` |
| `/os/computeless` | `computeless` | `PrivateCloudPage`| `FabricState` (workers, jobs, capacity, policy, summary), `enrollment`, `mismatch`, `needsWorkspace` | `GET /api/fabric/state`<br>`PUT /api/fabric/policy`<br>`POST /api/fabric/enrollment-keys`<br>`GET /api/fabric/enrollment`<br>`GET /api/fabric/jobs/{id}` |

### Detailed Route Mechanics

#### 1. `/os/mount` (`app/os/mount/page.tsx`)
- Reads package catalog from cAPI via `data.payloads["GET /v1/capability/packages"]`.
- Prefills `workspace` from query string, auth session profile, or `readBoundWorkspaceId()`.
- Reads `pendingIntent` from `readPendingExecutionIntent()`. If a contract-bound operation is present, it locks requested writes and target resource to that exact intent.
- On form submit: constructs `MountBinding` object and stores it in `sessionStorage` via `storeMountBinding(binding)`, then pushes router to `/os/authority`.

#### 2. `/os/blueprint` (`app/os/blueprint/page.tsx`)
- Invokes GPC / ABIDE compilation (`data.call(compileEndpoint, { intent, provider, model, compliance, capability_id })`).
- Parses result using `isGpcCompileResponse(data)`.
- Renders `PlanGraphCanvas` with nodes and edges.
- Saves plan to `sessionStorage.getItem("veklom.blueprint.plan.v1")`.

#### 3. `/os/govern` (`app/os/govern/page.tsx`)
- Executes pre-execution governance policy evaluation (`/api/v1/execution/authorize`) and risk assessment (`/v1/governance/v2/assess`).
- Renders interactive canvas (`GovernCanvas`) and node properties panel (`PipelinePropertyPanel`).
- Queries quarantine queue for pending high-risk directives.

#### 4. `/os/authority` (`app/os/authority/page.tsx`)
- Reads prepared `MountBinding` from `readMountBinding()`.
- Dispatches `POST /v1/capability/mounts` with `mountRequestBody(binding)` to cAPI runtime.
- If allowed, extracts `mount.id`, `token.token_id`, `token.nonce`, `token.authority_epoch`, `token.expires_at`, and constructs `SessionCapabilityLease`.
- Stores lease via `storeSessionCapabilityLease(lease)`, clearing pending intents and bindings.
- Surfaces revocation (`POST /v1/capability/mounts/{mount_id}/terminate`) and action probes.

#### 5. `/os/execute` (`app/os/execute/page.tsx`)
- Reads `SessionCapabilityLease` from `readSessionCapabilityLease()`.
- Submits execution request to CAPPO consequence authority:
  `POST /v1/capability/mounts/{lease.mountId}/execute` with body:
  `{ token_id, nonce, action, target_ref, resource, arguments, operation_id }`.
- Persists consequence receipt via `storeSessionConsequence()`.
- Marks lease as consumed (`terminated: true`) upon successful completion.
- Performs independent state readback via `targetStateReadbackPath(target_ref, resource, mountId)`.
- Compares resulting state vs readback state using `compareReadback()`.

#### 6. `/os/evidence` (`app/os/evidence/page.tsx`)
- Provides lookup tools for execution receipts, PGL event hashes, and agent hash chains.
- Calls `/api/pgl/ledger/proof/{eventHash}` and `/api/pgl/ledger/agents/{agentId}/verify`.
- Renders full 5-stage `DecisionGraph` (Identity ➔ Grant ➔ Execution ➔ Evidence ➔ Readback).

---

## 3. Transport and API Routing Architecture

### 3.1 Reverse Proxy Gateway (`app/api/[...proxy]/route.ts`)
All API traffic from the browser is routed to same-origin `/api/*` and dispatched by `app/api/[...proxy]/route.ts`. This eliminates CORS preflights, protects service tokens, and enforces the authentication boundary.

Routing targets:
1. **`/api/cappo/*` ➔ CAPPO Execution Backend (`CAPPO_BACKEND_URL`):**
   - Strips `/api/cappo` prefix (`forwardPath = path.replace(/^\/api\/cappo/, "")`).
   - Validates path against `isCappoProxyPath(forwardPath)` (`lib/cappo-proxy-paths.ts`).
   - For `/api/cappo/v1/exec`, path becomes `/v1/exec`, matching `isCappoExecPath("/v1/exec")`.
   - Attaches `Authorization: Bearer <token>` from headers or `access_token` cookie for execution/identity routes.
2. **`/api/abide/*` ➔ ABIDE Blueprint Compiler (`ABIDE_URL`):**
   - Strips `/api/abide` prefix (e.g. `/api/abide/v1/blueprint/compile` ➔ `${ABIDE_URL}/v1/blueprint/compile`).
   - Requires live principal session (`requirePrincipal`), but strips authorization header forward so compiler never possesses authority credentials.
3. **`/api/capi/*` ➔ cAPI Interlink Runtime (`CAPI_RUNTIME_URL`):**
   - Rewrites `/api/capi/*` to `/api/v1/capi/*`.
   - Interlink capability routes (`/api/capi/interlink/capability/*`) attach `CAPI_ADMIN_KEY` (`x-api-key`) if no bearer is present.
4. **`/api/pgl/*` & `/api/ledger/*` ➔ Project Genome Ledger (`PGL_URL`):**
   - Strips prefix to `/api/v1/*` or `/api/v1/ledger/*`.
   - Injects server-side secret `x-api-key: PGL_LEDGER_API_KEY`.
5. **`/api/computless/*` ➔ COMPUTLESS Fabric (`COMPUTLESS_URL` / `COMPUTLESS_SANDBOX_URL`):**
   - Dispatches based on `x-veklom-data-mode: sandbox`.
   - Injects `FABRIC_OWNER_TOKEN` or `FABRIC_SERVICE_TOKEN` with workspace header.
6. **`/api/v1/execution/*`, `/api/v1/gpc/*`, `/api/v1/benchmarks/*` ➔ `VBB_BACKEND_URL`:**
   - Fallback target mapped to `CAPPO_BACKEND_URL` for legacy compatibility.

### 3.2 Canonical Backends & URLs (`lib/canonical-backends.ts` & `lib/capi-runtime.ts`)
- `CAPI_RUNTIME_URL`: Defaults to `https://capi.veklom.com` (env `CAPI_BACKEND_URL` or `CAPI_URL`).
- `CAPPO_BACKEND_URL`: Defaults to `https://cappo.veklom.com` (env `CAPPO_BACKEND_URL` or `CAPPO_URL`).
- `PGL_URL`: Defaults to `https://pgl.veklom.com`.
- `ABIDE_URL`: Internal service URL (env `ABIDE_URL`).
- `LOCKERPHYCER_URL`: Identity service (env `LOCKERPHYCER_URL`).

### 3.3 Vertical Slice Transport (`lib/cos/verticalSlice.ts`)
- Exports `executeGovernedConsequence(request: GovernedConsequenceRequest)`:
  - Dispatches `POST /api/cappo/v1/exec` with body:
    ```json
    {
      "prompt": request.prompt,
      "action": request.operation,
      "directive": "ALLOW",
      "workspace_id": request.workspaceId,
      "scope": { "tools": [request.operation], "allowed_effects": [request.operation] },
      "capability_lease": {
        "mount_id": request.capabilityLease.mountId,
        "token_id": request.capabilityLease.tokenId,
        "nonce": request.capabilityLease.nonce
      },
      "target_precondition": request.targetPrecondition
    }
    ```
  - Returns `GovernedConsequenceResponse` containing `run_id`, `execution_id`, `capability_lease`, and `pgl` proof hashes.
- Exports `fetchPglLedgerEvent(eventId)`:
  - Fetches canonical ledger event via `GET /api/pgl/ledger/events/{eventId}`.

### 3.4 Live vs. Sandbox Separation (`lib/cos/sandbox.tsx` & `lib/cos/sandbox-scenarios.ts`)
- **Physical Reality:** Sandbox is NOT a mock or dummy simulation. In Capability OS, Sandbox mode sets `execution_scope.project = "sandbox"`.
- **Server Enforcement:** CAPPO persists `project = "sandbox"` on the mount and keys effects by `(workspace, project, resource)`. Thus, sandbox runs execute real code against isolated counter/resource scopes.
- **Client Cache Isolation:** All storage keys append `.sandbox` in sandbox mode (`environmentStorageSuffix()`). A sandbox lease or receipt can never appear in live mode.

---

## 4. Lifecycle Execution & Headless Coordination Analysis

### 4.1 Current Execution Path in `ConversationWorkspace.tsx`
`components/cos/workspace/ConversationWorkspace.tsx` and `lib/cos/tasks/task-reducer.ts` currently execute a single governed step through five operational phases:

```
[1. Intent Input] 
       │
       ▼
[2. ABIDE Compile] ─── POST /api/abide/v1/blueprint/compile
       │               (parses contract_id, canonical_hash, steps)
       ▼
[3. Needs Review]  ─── Halts with ActionReviewCard
       │               (verifies exact action, resource, target, arguments)
       ▼ [Operator clicks "Approve"]
[4. Request Grant] ─── POST /v1/capability/mounts
       │               (obtains mount_id, token_id, nonce, authority_epoch)
       ▼
[5. Execute]       ─── POST /v1/capability/mounts/{mount_id}/execute
       │               (consumes lease, obtains receipt_id, resulting_state)
       ▼
[6. Readback & PGL] ── GET /v1/capability/targets/{ref}/state
                       GET /api/pgl/ledger/proof/{hash}
```

### 4.2 State Machine Transitions (`task-reducer.ts`)
The existing reducer supports 12 formal phases:
1. `idle`: initial state.
2. `compiling`: network call to ABIDE in progress.
3. `needs_input`: step is covered by catalog but target resource is unbound.
4. `needs_review`: step is fully bound; awaiting operator approval.
5. `refused`: intent uncompilable, uncovered, or blocked by catalog.
6. `requesting_authority`: operator approved; minting `CapabilityLease`.
7. `executing`: lease issued; executing consequence via CAPPO.
8. `reading_back`: execution succeeded; querying independent target readback.
9. `done`: readback completed and verified against receipt.
10. `denied`: grant or consequence denied by policy/authority layer.
11. `outcome_unknown`: network failure mid-execution; flagged for reconciliation without retry.
12. `failed`: unrecoverable transport or configuration error.

### 4.3 Proposed Architecture for Headless Coordinator (`lib/cos/taskController.ts`)
To power the Concept 2 workspace (`app/os/page.tsx`), the coordination logic from `ConversationWorkspace.tsx` can be abstracted into a headless engine `taskController.ts`:

```typescript
export interface TaskControllerState extends TaskState {
  // Extended for Concept 2 DAG & Inspector
  pipelineNodes: PipelineNodeState[];
  activeApprovalCard: ActionApprovalDetails | null;
  inspectorData: InspectorPanelData | null;
  generatedArtifacts: ArtifactCardData[];
}

export interface TaskControllerActions {
  submitIntent: (prompt: string, attachments?: string[]) => Promise<void>;
  bindStepResource: (sequence: number, binding: StepBinding) => Promise<void>;
  approveAction: () => Promise<void>;
  cancelAction: () => void;
  resetTask: () => void;
}

export function useTaskController(workspaceId: string | null): [TaskControllerState, TaskControllerActions];
```

#### Headless Coordination Flow:
1. **`submitIntent(prompt)`**:
   - Calls `POST /api/abide/v1/blueprint/compile` (or `POST /api/v1/gpc/compile`).
   - Passes intent and current bindings.
   - Parses plan via `parseCompileResponse`.
   - Generates the Concept 2 DAG nodes (e.g. `Sales CSV [Prepared]` ➔ `Summarize [Prepared]` ➔ `Report draft [Prepared]` ➔ `Send email [Approval required]` ➔ `Evidence [Pending]`).
2. **Autonomous Capability Check & Pre-Execution Policy**:
   - Matches required packages against `GET /v1/capability/packages`.
   - Evaluates policy via `POST /api/v1/execution/authorize`.
   - If consequential action is identified, halts at `phase = "needs_review"`.
   - Binds action details to `activeApprovalCard` (recipient, scope, subject, attachments, exact binding).
3. **`approveAction()`**:
   - Enforces approval pinning: pins `canonicalHash` of approved contract.
   - Calls `POST /v1/capability/mounts` at cAPI with `mountRequestBody`.
   - Mints `SessionCapabilityLease` with single-use nonce and `authority_epoch`.
   - Stores lease via `storeSessionCapabilityLease()`.
   - Dispatches consequence call to CAPPO (`POST /v1/capability/mounts/{mount_id}/execute` or `/api/cappo/v1/exec`).
   - If response times out or drops: flags `phase = "outcome_unknown"` (`OUTCOME_UNCERTAIN`), triggering reconciliation re-read without re-issuing execute.
4. **Readback & PGL Anchoring**:
   - Performs target state readback (`targetStateReadbackPath`).
   - Verifies resulting state via `compareReadback`.
   - Polls/fetches PGL ledger receipt via `pglProofPath` / `fetchPglLedgerEvent`.
   - Populates right rail Inspector data with receipt ID, transaction hashes, and proof badges.

---

## 5. Architectural Invariants & Verification Guardrails

1. **Law 0 — Causal Authority Invariant:**
   $$\mathbf{\text{COMPUTATIONAL POSSESSION}} \neq \mathbf{\text{CURRENT CONSEQUENCE AUTHORITY}}$$
   - GPC and ABIDE compile plans; they grant zero authority.
   - CAPPO remains the sole consequence authority.
   - Approval is cryptographically bound to `canonicalHash`. Any recompile or modified field invalidates approval.
2. **Fail-Closed Transport Safety:**
   - If network connection drops mid-execution, state becomes `outcome_unknown`. The system never re-executes automatically ($\Delta C = 0$ guaranteed).
3. **Single-Use Nonce & Ephemeral Leases:**
   - CAPPO marks `terminated = true` upon consequence execution. Replay attempts with the same token/nonce are deterministically rejected with `already_terminated` / `stale_authority_epoch`.
4. **Environment Isolation:**
   - Sandbox requests must strictly carry `project = "sandbox"`.
   - Live requests must never inherit or use `sandbox` project tags.
5. **Zero Broken Wiring:**
   - All existing lifecycle routes (`/os/mount`, `/os/blueprint`, `/os/authority`, `/os/execute`, `/os/govern`, `/os/evidence`, `/os/measure`, `/os/tracker`, `/os/settle`, `/os/computeless`) must remain functional deep-links.

---

## 6. Recommendations for Downstream Implementation Agents

1. **Phase 1: Headless Task Coordinator Engine (`lib/cos/taskController.ts`):**
   - Extract the reducer and network coordinator out of `ConversationWorkspace.tsx` into a reusable, headless React hook (`useTaskController`) and functional controller module.
   - Implement DAG step mapping to convert `WorkspaceStep[]` into horizontal DAG pipeline nodes.
2. **Phase 2: Navigation Hierarchy Update (`lib/cos/nav.ts` & `LeftNav.tsx`):**
   - Update `navGroups` to surface the streamlined 6 core links (`Workspace`, `Capabilities`, `Governed`, `Evidence Vault`, `Measure`, `Private Cloud`, `Settings`).
   - Retain existing lifecycle routes inside the collapsible `Advanced / Inspect` drawer.
3. **Phase 3: Concept 2 UI Components (`components/cos/workspace/`):**
   - Implement `Concept2Workspace.tsx` with Composer, Active Task Card, Horizontal DAG trace, Action Approval Card, and Inspector panel.
   - Wire `/os` (`app/os/page.tsx`) to host this interface seamlessly.
4. **Phase 4: Verification Suite:**
   - Run existing Jest test suite (`npm test`) to guarantee zero regressions.
   - Add targeted unit tests for `taskController` testing DAG progression, approval pinning, single-use consumption, and network timeout fail-closed handling.
