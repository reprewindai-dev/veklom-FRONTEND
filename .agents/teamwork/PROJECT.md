# Project: Veklom Capability OS Concept 2 Revamp

## Architecture
- **Framework & Runtime**: Next.js 16.3.0 (standalone output), React 18.3.1, Tailwind CSS 3.4.6, TypeScript 5.5.3.
- **Physical Baseline**: Git SHA `ca9ad01dc4b014cc99edc18610fe421ec787ec6e`.
- **Target Branch**: `revamp/capability-os-task-workspace` branched directly from `ca9ad01`.
- **Live Baseline Container**: `veklom/frontend:prod-ca9ad01` running on `127.0.0.1:3002`.
- **Core Product Areas**:
  1. `Workspace` (`/os` and `/os/workspace`): Task Composer, Active Task Card, Horizontal 5-node Execution DAG, Action Approval Card, and Inspector Panel.
  2. `Capabilities` (`/os`): Capability Discovery catalog & beacon integration.
  3. `Governed` (`/os/govern`): Pre-execution governance policy inspection.
  4. `Evidence Vault` (`/os/evidence`): PGL execution receipt verification & cryptographic audit logs.
  5. `Measure` (`/os/measure`): VNP latency & SLA verification.
  6. `Private Cloud` (`/os/computeless`): Hardware placement & isolated execution.
  7. `Settings` (`/os/settings`): Workspace preferences & session configuration.
- **Advanced / Inspect Drawer**: Retains functional deep-links to diagnostic routes:
  - `/os/mount` (Capability package mounting)
  - `/os/blueprint` (GPC / ABIDE plan graph canvas)
  - `/os/authority` (cAPI mount minting & session leases)
  - `/os/execute` (CAPPO execution & readback)
  - `/os/settle` (x402 protocol settlement)
  - `/os/tracker` (Continuous drift detection)
- **Transport & Reverse Proxy (`app/api/[...proxy]/route.ts`)**:
  - `/api/cappo/*` ➔ `CAPPO_BACKEND_URL` (`/api/cappo/v1/exec` ➔ `/v1/exec`)
  - `/api/abide/*` ➔ `ABIDE_URL` (`/api/abide/v1/blueprint/compile`)
  - `/api/capi/*` ➔ `CAPI_RUNTIME_URL` (`/api/v1/capi/...`)
  - `/api/pgl/*` ➔ `PGL_URL` with injected server secret `PGL_LEDGER_API_KEY`
  - `/api/v1/execution/*` ➔ `VBB_BACKEND_URL` (CAPPO)
- **Law 0 Governance Invariant**:
  $$\text{COMPUTATIONAL POSSESSION} \neq \text{CURRENT CONSEQUENCE AUTHORITY}$$
  - Approval is cryptographically bound to exact parameters (`canonical_hash`).
  - Network loss triggers `OUTCOME_UNCERTAIN` / `outcome_unknown`; never blind re-execution ($\Delta C = 0$).

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Baseline Git Branch | Create and switch to `revamp/capability-os-task-workspace` from `ca9ad01` | M1 | Survey |
| 2 | Streamlined Navigation Rail | Update `lib/cos/nav.ts` and `components/cos/LeftNav.tsx` with 7 primary product items | M1 | Survey / R3 |
| 3 | Collapsible Advanced Drawer | Preserve functional deep-links to `/os/mount`, `/os/blueprint`, `/os/authority`, `/os/execute`, `/os/settle`, `/os/tracker` | M1 | Survey / R3 |
| 4 | Terminal & Keyboard Shortcuts | Wire `Ctrl+\`` terminal overlay and `Cmd+K` command palette in `AppShell.tsx` | M1 | Survey / R3 |
| 5 | Headless Task Coordinator Engine | Implement `lib/cos/taskController.ts` coordinating ABIDE compile, cAPI mount check, policy check, CAPPO lease minting, and execution | M2 | Survey / R2 |
| 6 | Cryptographic Action Approval Binding | Enforce `canonical_hash` parameter locking before minting execution authority | M2 | Survey / R2, Law 0 |
| 7 | Fail-Closed Consequence Protection | Implement `outcome_unknown` / `OUTCOME_UNCERTAIN` handling on network drop; cache replayed operation IDs ($\Delta C = 0$) | M2 | Survey / R4, Law 0 |
| 8 | Concept 2 Task Composer Box | Natural language outcome prompt input, attachment pills (`sales-october.csv`), and submit button | M3 | Survey / R1, Mockup |
| 9 | Active Task Card & Document Sub-Card | Task title (`Monthly sales summary`), status pill (`Waiting for your approval`), and PDF card (`sales-summary.pdf`) | M3 | Survey / R1, Mockup |
| 10 | Horizontal 5-Node Execution DAG | Render `Sales CSV [Prepared]` ➔ `Summarize [Prepared]` ➔ `Report draft [Prepared]` ➔ `Send email [Approval required]` ➔ `Evidence [Pending]` | M3 | Survey / R1, Mockup |
| 11 | Exact Action Approval Card | Detailed confirmation card showing 6 recipients, subject, attachment, `Preview email`, `Approve & send`, `Cancel`, and binding disclaimer | M3 | Survey / R1, Mockup |
| 12 | Inspector Panel (Right Rail) | Capability, Policy, Authority, Outcome, Evidence telemetry + Scope, Activity, Receipt accordions + PGL evidence link | M3 | Survey / R1, Mockup |
| 13 | Primary Task Landing Page | Render Concept 2 workspace at `/os` (`app/os/page.tsx`) and `/os/workspace` | M3 | Survey / R1 |
| 14 | E2E Test Suite (Tiers 1-4) | Comprehensive test suite verifying feature coverage, boundaries, pairwise combinations, and real-world workflows | M4 | Survey / Acceptance |
| 15 | Adversarial Coverage Hardening (Tier 5) | White-box stress testing of Law 0 invariants, tamper detection, and error boundaries | M4 | Survey / Acceptance |
| 16 | Standalone Container Build Verification | Clean build of standalone bundle within containerized limits | M4 | Survey / Acceptance |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Baseline Branch & Streamlined Navigation Shell | Git branch creation, `lib/cos/nav.ts`, `components/cos/LeftNav.tsx`, `components/cos/AppShell.tsx` | none | PLANNED |
| M2 | Autonomous Task Coordination Engine | `lib/cos/taskController.ts`, action binding, policy evaluation, fail-closed handling, unit tests | M1 | PLANNED |
| M3 | Concept 2 Task Workspace UI | `app/os/page.tsx`, `components/cos/task/*` (Composer, Active Task Card, Horizontal DAG, Approval Card, Inspector) | M2 | PLANNED |
| M4 | Final Milestone: E2E Acceptance & Adversarial Hardening | Pass 100% E2E tests (Tiers 1-4), adversarial stress testing (Tier 5), Docker standalone build | M3 | PLANNED |

---

## Interface Contracts

### 1. `lib/cos/nav.ts` ↔ `components/cos/LeftNav.tsx`
- `primaryNavItems`:
  - `workspace`: `{ href: "/os", label: "Workspace", icon: LayoutDashboard }`
  - `capabilities`: `{ href: "/os", label: "Capabilities", icon: Sparkles }`
  - `govern`: `{ href: "/os/govern", label: "Governed", icon: ShieldCheck }`
  - `evidence`: `{ href: "/os/evidence", label: "Evidence Vault", icon: Lock }`
  - `measure`: `{ href: "/os/measure", label: "Measure", icon: Gauge }`
  - `computeless`: `{ href: "/os/computeless", label: "Private Cloud", icon: Cloud }`
  - `settings`: `{ href: "/os/settings", label: "Settings", icon: Settings }`
- `inspectNavItems` (inside `Advanced` drawer):
  - `mount`: `/os/mount`
  - `blueprint`: `/os/blueprint`
  - `authority`: `/os/authority`
  - `execute`: `/os/execute`
  - `settle`: `/os/settle`
  - `tracker`: `/os/tracker`

### 2. `lib/cos/taskController.ts` ↔ Workspace UI Components
- Hook: `useTaskController(initialIntent?: string)`
- State:
  ```typescript
  export interface TaskControllerState {
    stage: 'idle' | 'compiling' | 'needs_approval' | 'minting_authority' | 'executing' | 'reading_back' | 'completed' | 'failed' | 'outcome_uncertain';
    taskTitle: string;
    statusText: string;
    documentPreview?: {
      title: string;
      fileType: 'pdf' | 'csv' | 'json';
      status: string;
      previewUrl?: string;
    };
    dagNodes: Array<{
      id: string;
      label: string;
      status: 'prepared' | 'approval_required' | 'executing' | 'verified' | 'pending' | 'failed';
      capability?: string;
      policy?: string;
      authority?: string;
      outcome?: string;
      evidence?: string;
    }>;
    approvalContext?: {
      scope: string;
      recipients: string[];
      subject: string;
      attachment: string;
      canonicalHash: string;
      disclaimer: string;
    };
    inspectorData: {
      selectedNodeId?: string;
      capability: string;
      policy: string;
      authority: string;
      outcome: string;
      evidence: string;
      scopeDetails: string;
      activityLog: string[];
      readbackStatus: string;
      evidenceReceiptId?: string;
      evidenceVerificationHash?: string;
    };
    submitIntent: (prompt: string, attachments?: string[]) => Promise<void>;
    approveAction: () => Promise<void>;
    cancelAction: () => void;
    selectDagNode: (nodeId: string) => void;
    resetTask: () => void;
  }
  ```

---

## Code Layout
- `lib/cos/nav.ts` — Navigation data structure definitions
- `components/cos/LeftNav.tsx` — Left navigation rail component
- `components/cos/AppShell.tsx` — Application shell with environment and lease gates
- `lib/cos/taskController.ts` — Headless autonomous task coordinator engine
- `lib/cos/tasks/*` — Task state machines, shape compilers, and node mappers
- `components/cos/task/TaskComposer.tsx` — Concept 2 Task Composer Box
- `components/cos/task/ActiveTaskCard.tsx` — Active Task Card with Document preview sub-card
- `components/cos/task/HorizontalDAG.tsx` — 5-node visual execution pipeline
- `components/cos/task/ActionApprovalCard.tsx` — Exact Action Approval Card
- `components/cos/task/InspectorPanel.tsx` — Right rail Inspector panel
- `app/os/page.tsx` — Primary Concept 2 task cockpit landing page
- `app/os/workspace/page.tsx` — Deep-link task workspace mirroring Concept 2
- `__tests__/e2e/*` — Opaque-box E2E test suites (Tiers 1-4)
