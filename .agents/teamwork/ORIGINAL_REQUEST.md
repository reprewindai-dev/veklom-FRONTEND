# Original User Request

## 2026-10-19T02:00:29Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Execute Concept 2 Revamp across 10-Agent Empirical Proof Team
> Requested team: 10-Agent Empirical Proof Team (1 Experiment Director, 6 Specialists, 2 Adversarial Falsifiers, 1 Isolated Victory Auditor)

**Project Description:**  
Revamp the existing Veklom Capability OS into the approved Concept 2 task-centric workspace (matching `media_1792374164906_5e94f608.png`) within the live connected checkout `veklom-m1p2/veklom-FRONTEND`. The operator describes an outcome in natural language; the system automatically coordinates capability preparation, DAG planning, policy evaluation, authority minting, execution, and evidence retrieval without manual navigation through 8 lifecycle tabs, while preserving existing backend integrations, contracts, and LAW 0 governance boundaries.

Working directory: `C:\Users\antho\Documents\Codex\2026-09-16\w\work\veklom-m1p2\veklom-FRONTEND`  
Integrity mode: development

---

## 1. Preservation & Baseline Guardrails

1. **Physical Baseline Lock:**
   - Active Connected Checkout: `C:\Users\antho\Documents\Codex\2026-09-16\w\work\veklom-m1p2\veklom-FRONTEND`
   - Remote: `https://github.com/reprewindai-dev/veklom-FRONTEND.git`
   - Baseline SHA: `ca9ad01dc4b014cc99edc18610fe421ec787ec6e` (`feat(cos): revamp shell navigation into 4 core product areas with progressive inspect drawer`)
   - Live Deployed Container: `veklom/frontend:prod-ca9ad01` running on `127.0.0.1:3002`.
   - Branch: Create and switch to `revamp/capability-os-task-workspace` directly from `ca9ad01`.
   - Never switch to `main`, pull unverified commits, reset, or upgrade dependencies.

2. **File Mapping Truth (Source Discipline):**
   - Navigation is configured in `lib/cos/nav.ts` and rendered in `components/cos/LeftNav.tsx`.
   - Shell wrapper is `components/cos/AppShell.tsx` and `app/os/layout.tsx`.
   - Primary task workspace is rendered at `/os` (`app/os/page.tsx` or `/os/workspace`), keeping existing lifecycle pages under `app/os/*` reachable.
   - Transport and API routing flow through `lib/api.ts` and `lib/cos/verticalSlice.ts`.

3. **Causal Authority Invariant (Law 0):**
   - $$\mathbf{\text{COMPUTATIONAL POSSESSION}} \neq \mathbf{\text{CURRENT CONSEQUENCE AUTHORITY}}$$
   - CAPPO remains the sole consequence authority (`POST /api/v1/execution/authorize` ➔ `POST /v1/exec`).
   - GPC / ABIDE compiles intent into plan graphs; it does NOT grant execution authority.
   - Approval is cryptographically bound to the exact proposed operation (capability, target, parameters, cost). Modifying any field invalidates approval.
   - If a network response drops mid-execution, flag `OUTCOME_UNCERTAIN` and reconcile; do not assume $\Delta C = 0$ or trigger duplicate executions.

---

## Requirements

### R1. Simplified Concept 2 Task Workspace (`app/os/page.tsx` / `/os/workspace`)
- Implement the Concept 2 interface matching `media_1792374164906_5e94f608.png`:
  - **Task Composer Box:** "What do you need to do? Describe the outcome. Veklom handles the steps." with natural-language prompt input, attachment pills, and submit button.
  - **Active Task Card:** Task title (e.g. `Monthly sales summary`), status pill (`Waiting for your approval`), and generated document card (`sales-summary.pdf`).
  - **Horizontal Execution DAG:** Visual pipeline transitioning through nodes (`Sales CSV` [Prepared] ➔ `Summarize` [Prepared] ➔ `Report draft` [Prepared] ➔ `Send email` [Approval required] ➔ `Evidence` [Pending]).
  - **Exact Action Approval Card:** Dedicated confirmation surface detailing scope, recipients, subject, and attachments with `Preview email`, `Approve & send`, and `Cancel` buttons, explicitly stating "Approval applies only to this email and these recipients."
  - **Inspector Panel (Right Rail):** Displays Capability (`email.send`), Policy (`Approval required`), Authority (`Not issued`), Outcome (`Not executed`), Evidence (`Pending`), and expandable sections (`Scope and recipients`, `Activity`, `Receipt and readback`, `View task evidence`).

### R2. Autonomous Task Coordination Engine (`lib/cos/taskController.ts`)
- Extract existing lifecycle calls into a unified, headless task coordinator:
  - Formulates intent into a plan/DAG via existing GPC/ABIDE endpoints.
  - Prepares and checks required capabilities via cAPI without manual mounting clicks.
  - Queries backend policy; if a consequential action is identified, halts at `Approval required`.
  - On operator approval, mints `CapabilityLease` from CAPPO and calls the canonical execution route (`/api/cappo/v1/exec` / `/v1/exec`).
  - Polls and binds resulting state, EEE envelope, and PGL evidence receipt to the task Inspector.

### R3. Streamlined Navigation with Preserved Lifecycle Deep-Links
- Update `components/cos/LeftNav.tsx` and `lib/cos/nav.ts` to surface the streamlined menu:
  - `Workspace` (`/os`), `Capabilities` (`/os`), `Governed` (`/os/govern`), `Evidence Vault` (`/os/evidence`), `Measure` (`/os/measure`), `Private Cloud` (`/os/computeless`), `Settings`.
  - Footer items: `Advanced` and `Inspect and Terminal` (`Ctrl+`` overlay).
  - Retain existing lifecycle routes (`/os/mount`, `/os/blueprint`, `/os/authority`, `/os/execute`, `/os/settle`, `/os/tracker`) as functional deep-links and developer inspection tools.

### R4. Fail-Closed Consequence & Recovery Protection
- Enforce the Transport-Safety Invariant: lost network responses do not trigger blind re-execution.
- Replayed operation IDs must return cached receipts without double-execution.
- Policy denials, revoked leases, and token mismatches must halt the pipeline with $\Delta C = 0$ and render explicit failure state.

---

## Acceptance Criteria

### Build & Integrity
- [ ] Build standalone bundle cleanly using containerized cgroup limits.
- [ ] Existing Jest test suite (`npm test`) passes with 0 regressions.

### Visual & Functional DOM Verification (Concept 2 Layout)
- [ ] `/os` renders the Task Composer, active Task Card, Horizontal DAG trace, and Right Inspector panel matching `media_1792374164906_5e94f608.png`.
- [ ] Submitting intent generates the DAG nodes dynamically without requiring manual navigation to `/os/blueprint`.
- [ ] Consequential actions pause and render the Action Approval card with exact recipient/parameter binding.
- [ ] Clicking "Approve & send" executes through CAPPO and transitions the DAG node from `Approval required` to `Verified`.

### Governance & Law 0 Invariants
- [ ] No consequential execution executes without an explicit, valid `CapabilityLease`.
- [ ] Rejection or cancellation leaves physical destination state untouched ($\Delta C = 0$).
- [ ] PGL execution receipt ID and verification hash appear in the Inspector panel upon completion.
- [ ] Existing deep-links (`/os/govern`, `/os/evidence`, `/os/measure`) remain reachable and functional.
