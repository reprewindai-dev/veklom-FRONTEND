# Concept 2 Revamp — Authoritative Specification & Requirements Document

**Version:** 1.0.0-PROD  
**Author:** Concept 2 Spec Miner (`spec_miner_survey_1`)  
**Target Root:** `C:\Users\antho\Documents\Codex\2026-09-16\w\work\veklom-m1p2\veklom-FRONTEND`  
**Baseline Git Commit:** `ca9ad01dc4b014cc99edc18610fe421ec787ec6e`  
**Authoritative Sources:**
- User Request: `ORIGINAL_REQUEST.md` (2026-10-19T02:00:29Z)
- Visual Mockup Reference: `media_1792374164906_5e94f608.png` (Antigravity Artifact `235d432e-5dee-4797-a2af-5cc90a3f421d`)
- Existing Core Architecture: `lib/cos/tasks/task-reducer.ts`, `lib/cos/tasks/task-types.ts`, `lib/cos/nav.ts`, `components/cos/LeftNav.tsx`, `lib/cos/verticalSlice.ts`, `lib/cos/useStageData.ts`, `lib/cos/stages.ts`
- Doctrine: Veklom Continuity Framework (Skill 2.0) & Codex Verifier Protocol

---

## 1. Executive Summary & Specification Sources

The Veklom Capability OS is transitioning from an 8-stage manual lifecycle navigation paradigm (`/os/mount`, `/os/blueprint`, `/os/authority`, `/os/execute`, `/os/settle`, `/os/tracker`, `/os/govern`, `/os/evidence`) into an autonomous, task-centric workspace.

Under Concept 2, the human operator simply describes an outcome in natural language (e.g. *"Prepare the monthly sales summary and email it to the sales team"*). An autonomous coordinator headlessly compiles intent into an execution DAG, prepares required capability mounts, evaluates governance policies, and pauses when consequential external mutations require cryptographic approval. The operator reviews a high-fidelity confirmation card, approves the scoped action, and observes the execution DAG and Right Rail Inspector light up with verifiable physical telemetry and PGL evidence receipts.

Crucially, **Law 0 (The Causal Authority Invariant)** is strictly enforced:
$$\mathbf{\text{COMPUTATIONAL POSSESSION}} \neq \mathbf{\text{CURRENT CONSEQUENCE AUTHORITY}}$$
The browser never generates authority, never skips CAPPO, never triggers blind retries upon transport timeouts, and guarantees $\Delta C = 0$ on all denials and cancellations.

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | UI / Workspace | Task Composer Box | Natural language intent input with multiline support, attachment pill rendering, attachment trigger, and submit button | `intent: string`, `attachments: Attachment[]` | Form submission event triggering task compilation | Trims input; no-op on whitespace; disabled when coordinator is busy | `media_1792374164906_5e94f608.png`, `TaskComposer.tsx` |
| 2 | UI / Workspace | Attachment Management | Surface attached files (e.g., `sales-october.csv`) as removable pills with icons and dismiss controls | CSV, PDF, or text file uploads / references | Serialized file reference bound to task context | Rejects unsupported file types; warns on unbound context | `media_1792374164906_5e94f608.png`, `ORIGINAL_REQUEST.md` |
| 3 | UI / Task Card | Active Task Card Header | High-level card displaying current task title (`Monthly sales summary`) and status badge | `taskTitle`, `taskPhase`, `statusPill` | Visual status pill (`Waiting for your approval` in amber) | Falls back to generic title if intent unnamed; adapts pill color per phase | `media_1792374164906_5e94f608.png`, `ORIGINAL_REQUEST.md` §R1 |
| 4 | UI / Task Card | Generated Document Preview Card | Inset sub-card showing intermediate generated artifacts (`sales-summary.pdf`) with format icon, preview link, and status metadata | Document name, format, status string (`Draft available · Email not sent`) | Interactive preview modal or deep-link trigger | Disables preview if document generation failed; renders error text | `media_1792374164906_5e94f608.png` |
| 5 | UI / Pipeline | Horizontal Execution DAG | 5-node visual pipeline displaying step transitions (`Sales CSV` ➔ `Summarize` ➔ `Report draft` ➔ `Send email` ➔ `Evidence`) | Current step statuses: `Prepared`, `Approval required`, `Pending`, `Verified`, `Failed` | Reactive visual graph with highlighted active node (amber glow) and icons | Shows failed red node on error; never lights up nodes prematurely | `media_1792374164906_5e94f608.png`, `PipelineCanvas.tsx` |
| 6 | UI / Approval | Exact Action Approval Card | Dedicated confirmation card displaying exact action scope, 6 recipients, subject line, attachment pill, and action buttons | Action name (`email.send`), recipients list, subject, attachment, `canonicalHash` | Approval confirmation event or cancellation event | Modifying parameters re-runs policy; voids previous approvals | `media_1792374164906_5e94f608.png`, `ActionReviewCard.tsx` |
| 7 | UI / Approval | Scope & Recipient Drilldown | Modal or drawer trigger allowing operator to inspect individual recipient emails and policy boundaries | `recipients: string[]`, `scope: string[]` | Detailed recipient modal/popover (`View recipients ↗`) | Fails closed if recipient data is corrupt or missing | `media_1792374164906_5e94f608.png` |
| 8 | UI / Approval | Email Preview Action | Secondary action button (`Preview email`) to inspect rendered HTML/text draft before issuing approval | Draft email body, subject, attachments | Rendered modal or drawer showing draft email content | Shows warning if draft cannot be rendered | `media_1792374164906_5e94f608.png` |
| 9 | UI / Approval | Consequence Approval & Disclaimer | Primary action button (`Approve & send`) accompanied by binding disclaimer: *"Approval applies only to this email and these recipients"* | User click with valid session and bound workspace | Initiates authority minting and canonical execution via CAPPO | Button disabled when busy or workspace unbound; fails closed | `media_1792374164906_5e94f608.png`, `ORIGINAL_REQUEST.md` |
| 10 | UI / Task Card | Task Card Footer Status Bar | Linear text status breadcrumb showing execution milestone progression | `phase`, `breadcrumbs: string[]` | Text status: `Plan prepared → Awaiting approval → No email sent` | Amber highlight on pending approval; green on completion; red on failure | `media_1792374164906_5e94f608.png` |
| 11 | UI / Right Rail | Inspector Property Matrix | Dedicated right rail showing key-value metadata: Capability, Policy, Authority, Outcome, Evidence | Live telemetry from coordinator state | Clean key-value grid (`email.send`, `Approval required`, `Not issued`, etc.) | Displays `Degraded` or `Failed` on mismatch; never hides missing telemetry | `media_1792374164906_5e94f608.png`, `ORIGINAL_REQUEST.md` |
| 12 | UI / Right Rail | Inspector Scope & Recipients Accordion | Collapsible accordion section showing recipient summary (`6 recipients · Sales team`) and full list | Recipient list, group affiliation | Expandable accordion with detailed breakdown | Collapses smoothly; accessible via keyboard ARIA | `media_1792374164906_5e94f608.png` |
| 13 | UI / Right Rail | Inspector Activity Stream | Collapsible accordion section detailing chronological task events (`Draft ready · Waiting for approval`) | Event log entries with timestamps and roles | Chronological audit trail of coordinator actions | Formats errors in danger tone; escapes arbitrary output | `media_1792374164906_5e94f608.png` |
| 14 | UI / Right Rail | Inspector Receipt & Readback Accordion | Collapsible accordion section displaying execution receipt and independent target readback | Monotonic epoch, operation ID, receipt ID, proof hash | Expandable technical details of dual-state verification | Displays `No readback yet` before execution; highlights discrepancies | `media_1792374164906_5e94f608.png` |
| 15 | UI / Right Rail | Inspector Evidence Vault Link | Direct footer link (`View task evidence`) targeting PGL ledger verification | `receiptId`, `pglEventHash` | Deep-link to `/os/evidence` or modal showing PGL ledger entry | Displays `No execution receipt yet` until execution completes | `media_1792374164906_5e94f608.png` |
| 16 | Navigation | Streamlined Primary LeftNav | 7 top-level navigation items: `Workspace`, `Capabilities`, `Governed`, `Evidence Vault`, `Measure`, `Private Cloud`, `Settings` | `pathname`, active route matching | Clean sidebar navigation with active indicator dot and highlight | Retains active state highlighting and keyboard accessibility | `lib/cos/nav.ts`, `components/cos/LeftNav.tsx` |
| 17 | Navigation | Advanced Lifecycle Drawer | Collapsible sidebar section tucking developer lifecycle routes (`/os/mount`, `/os/blueprint`, `/os/authority`, `/os/execute`, `/os/settle`, `/os/tracker`) | Operator expansion toggle | Collapsible sub-navigation preserving 100% route wiring | Automatically expands if user navigates to an advanced route directly | `lib/cos/nav.ts`, `ORIGINAL_REQUEST.md` §R3 |
| 18 | Navigation | Live Terminal Overlay | Shell control & shortcut (`Ctrl+``) opening interactive terminal console | Key event or sidebar click | Overlay terminal communicating with MCP backend (`POST /api/mcp`) | Fails gracefully if MCP backend is unreachable | `components/cos/TerminalConsole.tsx`, `nav.ts` |
| 19 | Engine | Autonomous Task Coordination | Headless coordinator (`lib/cos/taskController.ts`) driving lifecycle without manual clicks | `intent`, `attachments`, `bindings`, `approval` | Emits state updates through compilation, preparation, policy, execution | Implements strict causal state machine; stops at approval | `ORIGINAL_REQUEST.md` §R2 |
| 20 | Engine | Intent Compilation & DAG Formulation | Automatic formulation of intent into 5-node pipeline via ABIDE compile endpoint | `intent`, `catalogDigest`, `claims` | `WorkspacePlan` with steps, canonical hash, and pipeline graph | Emits `compile_failed` or `refused` if intent cannot be mapped | `compile-shape.ts`, `stages.ts` |
| 21 | Engine | Automated Capability Mount Check | Headless inspection of capability catalog and preparation of mount bindings | Package ref, target ref, resource, action | Valid `MountBinding` object ready for authority minting | Refuses with plain language if required capability is missing | `mount-binding.ts`, `useStageData.ts` |
| 22 | Engine | Consequential Action Policy Gate | Policy engine checking if planned operation causes external mutation | Operation risk level, action name, target type | Pauses coordinator at `Approval required` state | Prevents any execution request without explicit operator consent | `ORIGINAL_REQUEST.md` §R2, `task-reducer.ts` |
| 23 | Engine | Cryptographic Lease Minting | Calls CAPPO authority endpoint to mint single-use `CapabilityLease` upon approval | Bound operation, canonical hash, workspace ID | `SessionCapabilityLease` (mount_id, token_id, nonce, epoch) | Returns `authority_unreachable` or `denied`; leaves $\Delta C = 0$ | `stages.ts`, `lease-session.ts` |
| 24 | Engine | Canonical Execution Route | Submits minted lease to canonical execution endpoint (`POST /api/cappo/v1/exec`) | `token_id`, `nonce`, `mount_id`, `action`, `operation_id` | Execution response with receipt ID and resulting state | Returns `execute_unreachable` or `denied`; consumes lease | `verticalSlice.ts`, `cappo-proxy.ts` |
| 25 | Engine | Independent Target State Readback | Queries destination target directly after execution to verify actual physical mutation | `target_ref`, `resource`, `mountId` | `TaskReadback` (`Verified`, `Degraded`, or `Needs proof`) | Flags `Degraded` if target state mismatches receipt | `readback.ts`, `task-reducer.ts` |
| 26 | Transport | Transport Safety & Outcome Reconciliation | Detects dropped connections / timeouts during execution and transitions to `outcome_unknown` | Network drop, HTTP timeout, 502/504 | Triggers independent readback; mandates reconciliation | Never assumes success or failure; prohibits blind duplicate execution | `ORIGINAL_REQUEST.md` §R4, `task-reducer.ts` |
| 27 | Transport | Operation Idempotency Caching | Replaying an already-submitted `operation_id` returns cached receipt immediately | Repeated `operation_id` | Cached execution receipt | Prohibits duplicate execution; ensures $\Delta C = 0$ on replay | Invariant 4, `ORIGINAL_REQUEST.md` §R4 |
| 28 | Governance | Dynamic Approval Invalidation | Recompilation or change in parameters voids held approval automatically | New contract hash $\neq$ approved hash | Sets `approval = undefined`; transitions to `needs_review` | Prevents executing modified operations under old approval | Invariant Law 0, `task-reducer.ts` |

---

## 3. Edge Cases & Concurrency / Failure Crucible

| # | Feature | Input / Trigger | Observed & Specified Behavior |
|---|---------|-----------------|-------------------------------|
| 1 | Task Composer | Empty or pure whitespace submission (`"   \n\t"`) | Submission rejected at client boundary. Coordinator state remains `idle`. No network calls dispatched to ABIDE. |
| 2 | Intent Compilation | Intent requesting unsupported capability (e.g. *"order a pizza to 123 Main St"*) | ABIDE returns `uncovered` step. Coordinator transitions to `refused` phase. Node 1 shows `failure`. Action approval card is NEVER rendered. Plain-language error explains catalog limitation. |
| 3 | Intent Compilation | Intent requesting blocked capability (e.g. *"delete all database records"*) | ABIDE returns `blocked` step. Coordinator transitions to `refused`. Displays warning that catalog policy explicitly forbids this action. |
| 4 | Step Binding | Operation requires specific target resource but none provided in prompt | Coordinator transitions to `needs_input`. Prompts operator for exact resource name. Does not permit approval until binding is complete. |
| 5 | Approval Binding | Operator changes prompt or binding parameters after clicking "Approve" | Contract re-compiles with new `canonical_hash`. Coordinator detects hash mismatch ($\text{approval.canonicalHash} \neq \text{newHash}$), voids approval (`approval = undefined`), returns to `needs_review`, and renders a warning banner. |
| 6 | Authority Minting | CAPPO denies grant request (e.g., `scope_exceeds_package`, expired token) | Authority response returns `decision: "deny"`. Coordinator transitions to `denied`. DAG node 4 shows `failure`. Consequence execution is never dispatched. $\Delta C = 0$. |
| 7 | Consequence Execution | Network drops mid-flight during `POST /api/cappo/v1/exec` (HTTP timeout / socket reset) | Coordinator catches transport failure, flags `outcome_unknown` / `OUTCOME_UNCERTAIN`. Node 4 shows amber warning. Does NOT trigger automatic retry. Dispatches independent target readback to probe physical state. Requires operator reconciliation. |
| 8 | Readback Verification | Target readback returns state that does NOT match receipt's `resulting_state` | Coordinator flags `readback.proof = "Degraded"`. Node 5 shows degraded status. Inspector surfaces explicit discrepancy between receipt and physical reality. |
| 9 | Replay Attack / Retry | Operator or network retries identical `operation_id` after successful execution | CAPPO and coordinator detect existing `operation_id`. Return cached receipt immediately without executing secondary side-effects. $\Delta C = 0$. |
| 10 | Session Storage | Session capability lease expires before execution is triggered | Lease validation fails TTL check. Execution call rejected with `StalePermitError`. State transitions to `denied`. $\Delta C = 0$. |
| 11 | Concurrent Execution | Two browser tabs attempt to approve and execute simultaneously on the same single-use mount | First execution succeeds and marks grant `terminated: true`. Second execution receives `mount_already_consumed` / `StalePermitError` from CAPPO. Second tab transitions to `denied`. $\Delta C = 0$. |
| 12 | Navigation Integrity | Operator enters `/os/mount` or `/os/blueprint` directly into browser URL | Route resolves smoothly to existing lifecycle page. Shell navigation automatically expands the `Advanced` drawer and highlights the active route. No 404s. |

---

## 4. Comprehensive Visual DOM Hierarchy & Layout Specification

The visual interface is authoritatively defined by `media_1792374164906_5e94f608.png`. The component tree must be implemented with exact pixel-level discipline, matching typography, colors, padding, borders, and state representations.

### 4.1 Global Shell & Layout Structure
- **Root Container:**
  - `div.cos-shell` (`relative flex min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200`)
  - Background radial gradients & subtle grid texture (`bg-cos-grid opacity-25`)
- **Top Header Bar:**
  - Height: `h-16` (`min-h-[64px] border-b border-slate-800/80 bg-[#080d1a]/80 backdrop-blur-md px-6 flex items-center justify-between`)
  - Left group:
    - Veklom Logo (Cyan hexagonal circuit icon + `VEKLOM` bold white + `CAPABILITY OS` mono tracking uppercase)
    - Breadcrumb: `› Proof ↗` (muted slate text with external link icon)
  - Center group:
    - Workspace selector: `Workspace: Sales Operations ⌵` (rounded dark pill, subtle border)
    - Playground button: `▷ Playground` (outlined pill with amber border and play icon)
  - Right group:
    - Design preview badge: `DESIGN PREVIEW · NOT LIVE` (rounded dark pill, border border-slate-700/60 text-slate-400 font-mono text-[10px])
    - Theme toggle: Sun/Moon pill toggle
    - User avatar: Circular pill with `JD` initials
- **Body Layout (Three-Column Split):**
  - Left: Persistent LeftNav Sidebar (`w-60 shrink-0 border-r border-slate-800/80 bg-[#080d18]`)
  - Center: Main Task Workspace (`flex-1 min-w-0 overflow-y-auto px-8 py-8 max-w-5xl mx-auto space-y-8`)
  - Right: Persistent Right Rail Inspector (`w-88 shrink-0 border-l border-slate-800/80 bg-[#080d1a] overflow-y-auto p-6 space-y-6`)

---

### 4.2 Task Composer Box (`components/cos/workspace/TaskComposer.tsx`)

```html
<section class="task-composer-box rounded-2xl border border-slate-800/80 bg-[#091122]/90 backdrop-blur-md p-6 space-y-4 shadow-xl">
  <!-- Heading & Subtitle -->
  <div class="space-y-1">
    <h1 class="text-3xl font-semibold tracking-tight text-white">What do you need to do?</h1>
    <p class="text-sm text-slate-400">Describe the outcome. Veklom handles the steps.</p>
  </div>

  <!-- Text Input / Prompt Area -->
  <div class="relative rounded-xl border border-slate-800 bg-[#0d1627] p-4 focus-within:border-cyan-500/50 transition">
    <textarea
      rows="2"
      class="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm md:text-base outline-none resize-none"
      placeholder="What do you need to do? Describe the outcome. Veklom handles the steps."
    >Prepare the monthly sales summary and email it to the sales team.</textarea>

    <!-- Attachments & Controls Row -->
    <div class="mt-4 flex items-center justify-between gap-3">
      <!-- Attachment Pills -->
      <div class="flex flex-wrap items-center gap-2">
        <div class="attachment-pill inline-flex items-center gap-2 rounded-md border border-slate-700/70 bg-slate-800/80 px-2.5 py-1 text-xs font-mono text-slate-200">
          <FileText size="13" class="text-slate-400" />
          <span>sales-october.csv</span>
          <button type="button" class="text-slate-400 hover:text-white" aria-label="Remove attachment">✕</button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        <button type="button" class="attachment-btn rounded-lg border border-slate-700/80 bg-slate-800/60 p-2 text-slate-400 hover:text-slate-200" title="Attach file">
          <Paperclip size="16" />
        </button>
        <button type="submit" class="submit-btn rounded-lg bg-cyan-500 hover:bg-cyan-400 p-2 text-slate-950 font-semibold flex items-center justify-center transition shadow-[0_0_12px_rgba(6,182,212,0.3)]">
          <Send size="16" />
        </button>
      </div>
    </div>
  </div>
</section>
```

---

### 4.3 Active Task Card (`components/cos/workspace/ActiveTaskCard.tsx`)

```html
<div class="active-task-card rounded-2xl border border-slate-800/80 bg-[#091122]/90 backdrop-blur-md p-6 space-y-6 shadow-xl relative overflow-hidden">
  <!-- Subtle Background Grid -->
  <div class="pointer-events-none absolute inset-0 bg-cos-grid bg-[size:32px_32px] opacity-20" />

  <!-- 1. Header Row -->
  <div class="relative z-10 flex items-center justify-between">
    <div class="flex items-center gap-2.5">
      <FileText size="18" class="text-slate-300" />
      <h2 class="text-base font-semibold text-white tracking-tight">Monthly sales summary</h2>
    </div>
    <div class="status-pill inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
      <Clock3 size="13" />
      <span>Waiting for your approval</span>
    </div>
  </div>

  <!-- 2. Generated Document Preview Sub-Card -->
  <div class="relative z-10 rounded-xl border border-slate-800/80 bg-[#0d1627]/70 p-3.5 flex items-center justify-between max-w-sm">
    <div class="flex items-center gap-3">
      <!-- PDF Icon Badge -->
      <div class="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-rose-400">
        <FileText size="18" />
      </div>
      <div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-white font-mono">sales-summary.pdf</span>
          <button type="button" class="text-[11px] text-cyan-400 hover:underline flex items-center gap-0.5">
            Preview report <ArrowUpRight size="11" />
          </button>
        </div>
        <p class="text-[11px] text-slate-400 mt-0.5">Draft available · Email not sent</p>
      </div>
    </div>
  </div>

  <!-- 3. Horizontal Execution DAG -->
  <div class="relative z-10">
    <HorizontalExecutionDAG steps={steps} currentStep="Send email" />
  </div>

  <!-- 4. Exact Action Approval Card -->
  <div class="relative z-10">
    <ActionApprovalCard />
  </div>

  <!-- 5. Task Card Footer Status Bar -->
  <div class="relative z-10 pt-2 border-t border-slate-800/60 flex items-center gap-2 font-mono text-xs text-slate-400">
    <Clock3 size="13" class="text-slate-400" />
    <span>Plan prepared</span>
    <span class="text-slate-600">→</span>
    <span class="text-amber-400 font-medium">Awaiting approval</span>
    <span class="text-slate-600">→</span>
    <span class="text-slate-500">No email sent</span>
  </div>
</div>
```

---

### 4.4 Horizontal Execution DAG (`components/cos/workspace/HorizontalExecutionDAG.tsx`)

The visual DAG renders 5 discrete pipeline stages linearly connected by horizontal arrows `→`:

```html
<div class="horizontal-dag flex items-center gap-2 overflow-x-auto py-2">
  <!-- Node 1: Sales CSV -->
  <div class="dag-node flex-1 min-w-[120px] rounded-lg border border-cyan-500/30 bg-[#0d1627]/80 p-3 text-center space-y-1">
    <div class="flex justify-center text-cyan-400"><CheckCircle2 size="16" /></div>
    <div class="text-xs font-medium text-white">Sales CSV</div>
    <div class="text-[10px] font-mono text-cyan-400/80">Prepared</div>
  </div>

  <span class="text-slate-600 font-mono">→</span>

  <!-- Node 2: Summarize -->
  <div class="dag-node flex-1 min-w-[120px] rounded-lg border border-cyan-500/30 bg-[#0d1627]/80 p-3 text-center space-y-1">
    <div class="flex justify-center text-cyan-400"><CheckCircle2 size="16" /></div>
    <div class="text-xs font-medium text-white">Summarize</div>
    <div class="text-[10px] font-mono text-cyan-400/80">Prepared</div>
  </div>

  <span class="text-slate-600 font-mono">→</span>

  <!-- Node 3: Report draft -->
  <div class="dag-node flex-1 min-w-[120px] rounded-lg border border-cyan-500/30 bg-[#0d1627]/80 p-3 text-center space-y-1">
    <div class="flex justify-center text-cyan-400"><CheckCircle2 size="16" /></div>
    <div class="text-xs font-medium text-white">Report draft</div>
    <div class="text-[10px] font-mono text-cyan-400/80">Prepared</div>
  </div>

  <span class="text-slate-600 font-mono">→</span>

  <!-- Node 4: Send email (Approval Required - Highlighted) -->
  <div class="dag-node flex-1 min-w-[130px] rounded-lg border-2 border-amber-500 bg-amber-500/[0.08] p-3 text-center space-y-1 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
    <div class="flex justify-center text-amber-400"><Mail size="16" /></div>
    <div class="text-xs font-semibold text-white">Send email</div>
    <div class="text-[10px] font-medium text-amber-400">Approval required</div>
  </div>

  <span class="text-slate-600 font-mono">→</span>

  <!-- Node 5: Evidence (Pending) -->
  <div class="dag-node flex-1 min-w-[120px] rounded-lg border border-slate-800 bg-[#0d1627]/40 p-3 text-center space-y-1 opacity-70">
    <div class="flex justify-center text-slate-500"><FileCheck2 size="16" /></div>
    <div class="text-xs font-medium text-slate-400">Evidence</div>
    <div class="text-[10px] font-mono text-slate-500">Pending</div>
  </div>
</div>
```

---

### 4.5 Exact Action Approval Card (`components/cos/workspace/ActionApprovalCard.tsx`)

```html
<div class="action-approval-card rounded-xl border-2 border-cyan-500/60 bg-[#0a1628]/90 p-5 space-y-4 shadow-xl">
  <!-- Title & Icon -->
  <div class="flex items-start gap-3.5">
    <div class="mt-0.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 p-2 text-cyan-400">
      <Mail size="20" />
    </div>
    <div class="space-y-1">
      <h3 class="text-base font-semibold text-white tracking-tight">Send this report to the sales team?</h3>
      <div class="flex items-center gap-2 text-xs text-slate-300">
        <span>6 recipients</span>
        <span class="text-slate-600">·</span>
        <button type="button" class="text-cyan-400 hover:underline flex items-center gap-0.5 font-medium">
          View recipients <ArrowUpRight size="11" />
        </button>
      </div>
    </div>
  </div>

  <!-- Parameter Details -->
  <div class="space-y-2 text-xs">
    <!-- Subject -->
    <div>
      <span class="font-mono text-[10px] uppercase tracking-wider text-slate-400">Subject</span>
      <div class="text-slate-100 font-medium mt-0.5">Monthly sales summary</div>
    </div>

    <!-- Attachment -->
    <div>
      <span class="font-mono text-[10px] uppercase tracking-wider text-slate-400">Attachment</span>
      <div class="mt-0.5">
        <span class="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 font-mono text-xs text-slate-200">
          <Paperclip size="12" class="text-slate-400" />
          sales-summary.pdf
        </span>
      </div>
    </div>
  </div>

  <!-- Action Buttons -->
  <div class="flex flex-wrap items-center gap-3 pt-2">
    <button type="button" class="rounded-lg border border-slate-700 bg-slate-800/70 hover:bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition">
      <Eye size="14" />
      <span>Preview email</span>
    </button>

    <button type="button" class="rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 py-2 text-xs font-semibold flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(6,182,212,0.3)]">
      <Check size="14" strokeWidth="2.5" />
      <span>Approve & send</span>
    </button>

    <button type="button" class="rounded-lg border border-slate-800 bg-transparent hover:bg-slate-800/40 px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition">
      <span>Cancel</span>
    </button>
  </div>

  <!-- Disclaimer Footer -->
  <p class="text-[11px] text-slate-400 leading-relaxed pt-1">
    Approval applies only to this email and these recipients.
  </p>
</div>
```

---

### 4.6 Inspector Panel (Right Rail) (`components/cos/workspace/InspectorPanel.tsx`)

```html
<aside class="inspector-panel w-88 border-l border-slate-800/80 bg-[#080d1a] p-6 space-y-6 flex flex-col justify-between">
  <div class="space-y-6">
    <!-- Header Row -->
    <div class="flex items-center justify-between pb-4 border-b border-slate-800/80">
      <div class="flex items-center gap-2.5">
        <Mail size="18" class="text-cyan-400" />
        <h3 class="text-base font-semibold text-white">Send email</h3>
      </div>
      <span class="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-medium text-amber-400">
        Approval required
      </span>
    </div>

    <!-- Key-Value Metadata Properties Table -->
    <div class="space-y-2.5 font-mono text-xs">
      <div class="flex items-center justify-between">
        <span class="text-slate-400 font-sans">Capability</span>
        <span class="text-slate-200">email.send</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-slate-400 font-sans">Policy</span>
        <span class="text-amber-400">Approval required</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-slate-400 font-sans">Authority</span>
        <span class="text-slate-400">Not issued</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-slate-400 font-sans">Outcome</span>
        <span class="text-slate-400">Not executed</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-slate-400 font-sans">Evidence</span>
        <span class="text-slate-500">Pending</span>
      </div>
    </div>

    <div class="border-t border-slate-800/80" />

    <!-- Expandable Accordion Sections -->
    <div class="space-y-3">
      <!-- Section 1: Scope and recipients -->
      <details class="group rounded-lg border border-slate-800/60 bg-[#0c1424]/50 p-3" open>
        <summary class="flex cursor-pointer items-center justify-between text-xs font-medium text-slate-200 list-none">
          <span class="flex items-center gap-2">
            <ChevronDown size="14" class="text-slate-400 transition-transform group-open:rotate-180" />
            Scope and recipients
          </span>
          <span class="text-[10px] font-mono text-slate-400">6 recipients · Sales team</span>
        </summary>
        <div class="mt-2.5 pt-2.5 border-t border-slate-800/60 text-xs text-slate-400 space-y-1">
          <div>Scope: <code class="text-cyan-400">email.send</code></div>
          <div>Target: <code class="text-slate-300">sales-team@company.internal</code></div>
        </div>
      </details>

      <!-- Section 2: Activity -->
      <details class="group rounded-lg border border-slate-800/60 bg-[#0c1424]/50 p-3">
        <summary class="flex cursor-pointer items-center justify-between text-xs font-medium text-slate-200 list-none">
          <span class="flex items-center gap-2">
            <ChevronDown size="14" class="text-slate-400 transition-transform group-open:rotate-180" />
            Activity
          </span>
          <span class="text-[10px] font-mono text-slate-400">Draft ready · Waiting for approval</span>
        </summary>
        <div class="mt-2.5 pt-2.5 border-t border-slate-800/60 text-xs text-slate-400 space-y-1">
          <div>22:04:01 — Intent compiled into 5-node pipeline</div>
          <div>22:04:02 — Document draft generated: sales-summary.pdf</div>
          <div>22:04:03 — Governance policy evaluated: requires approval</div>
        </div>
      </details>

      <!-- Section 3: Receipt and readback -->
      <details class="group rounded-lg border border-slate-800/60 bg-[#0c1424]/50 p-3">
        <summary class="flex cursor-pointer items-center justify-between text-xs font-medium text-slate-200 list-none">
          <span class="flex items-center gap-2">
            <ChevronDown size="14" class="text-slate-400 transition-transform group-open:rotate-180" />
            Receipt and readback
          </span>
          <span class="text-[10px] font-mono text-slate-400">No readback yet</span>
        </summary>
        <div class="mt-2.5 pt-2.5 border-t border-slate-800/60 text-xs text-slate-400">
          Independent target verification pending consequence execution.
        </div>
      </details>
    </div>
  </div>

  <!-- Bottom Evidence Link -->
  <div class="pt-4 border-t border-slate-800/80">
    <div class="flex items-start gap-2.5">
      <FileCheck2 size="16" class="text-cyan-400 mt-0.5" />
      <div>
        <a href="/os/evidence" class="text-xs font-semibold text-cyan-400 hover:underline">
          View task evidence
        </a>
        <p class="text-[11px] text-slate-500 mt-0.5">No execution receipt yet</p>
      </div>
    </div>
  </div>
</aside>
```

---

## 5. Requirements R1, R2, R3, R4 Detailed Breakdown

### R1. Simplified Concept 2 Task Workspace (`app/os/page.tsx` / `/os/workspace`)
- **Route Consolidation:**
  - Route `/os` (`app/os/page.tsx`) and `/os/workspace` (`app/os/workspace/page.tsx`) must render the new Concept 2 Task Workspace.
  - Replaces the catalog search grid on `/os` with the unified, executive task experience.
- **Components Rendered:**
  - `TaskComposer`: Input prompt, file attachments pill (`sales-october.csv`), submit button.
  - `ActiveTaskCard`: Title (`Monthly sales summary`), status pill (`Waiting for your approval`), PDF preview (`sales-summary.pdf`).
  - `HorizontalExecutionDAG`: 5-node pipeline with dynamic status changes.
  - `ActionApprovalCard`: Bounded confirmation surface with preview, approve, and cancel.
  - `InspectorPanel`: Right rail displaying 5 key-value telemetry pairs and 3 expandable sections.

---

### R2. Autonomous Task Coordination Engine (`lib/cos/taskController.ts`)
The coordinator is a headless controller that encapsulates lifecycle transitions:

```typescript
export interface TaskCoordinatorState {
  taskId: string;
  phase: TaskPhase;
  intent: string;
  attachments: { name: string; size?: number; type?: string }[];
  plan?: WorkspacePlan;
  activeStep?: WorkspaceStep;
  approval?: TaskApproval;
  lease?: SessionCapabilityLease;
  authority?: TaskAuthority;
  execution?: TaskExecution;
  readback?: TaskReadback;
  error?: string;
  messages: TaskMessage[];
}
```

#### Lifecycle State Transitions:
1. `idle ➔ compiling`: Operator submits intent. Coordinator calls `POST /api/abide/v1/blueprint/compile` with intent and claims.
2. `compiling ➔ needs_review` (or `needs_input` / `refused`):
   - If ABIDE returns a valid contract where a step requires human authorization (e.g. `email.send`), coordinator pauses and emits `needs_review`.
   - The DAG transitions: nodes 1-3 to `Prepared`, node 4 to `Approval required`, node 5 to `Pending`.
3. `needs_review ➔ requesting_authority`:
   - Operator clicks `Approve & send`.
   - Coordinator captures `approval = { canonicalHash, stepId, operation }`.
   - Coordinator calls cAPI / CAPPO (`POST /v1/capability/mounts` or `/api/v1/execution/authorize`) to mint a single-use `CapabilityLease`.
4. `requesting_authority ➔ executing`:
   - CAPPO returns `decision: "allow"` with `mount_id`, `token_id`, `nonce`, `authority_epoch`.
   - Coordinator immediately invokes canonical execution route:
     `POST /api/cappo/v1/exec` with lease and operation details.
5. `executing ➔ reading_back`:
   - CAPPO returns execution receipt with `receipt_id`, `pgl_event_hash`, `resulting_state`.
   - Coordinator calls independent target readback route (`GET /v1/capability/targets/{target_ref}/state` or PGL proof route).
6. `reading_back ➔ done`:
   - Target confirms physical mutation matches receipt $\implies$ `readback.proof = "Verified"`.
   - Node 4 transitions to `Verified`, Node 5 transitions to `Verified`.
   - Inspector displays full dual-state verification receipt.

---

### R3. Streamlined Navigation with Preserved Lifecycle Deep-Links
- **`lib/cos/nav.ts` Definition:**
  ```typescript
  export const navGroups: NavGroup[] = [
    {
      id: "product",
      label: "Workspace",
      items: [
        { id: "workspace", label: "Workspace", route: "/os" },
        { id: "capabilities", label: "Capabilities", route: "/os/capabilities" },
        { id: "govern", label: "Governed", route: "/os/govern" },
        { id: "evidence", label: "Evidence Vault", route: "/os/evidence" },
        { id: "measure", label: "Measure", route: "/os/measure" },
        { id: "computeless", label: "Private Cloud", route: "/os/computeless" },
        { id: "settings", label: "Settings", route: "/os/settings" },
      ],
    },
    {
      id: "inspect",
      label: "Advanced",
      collapsible: true,
      defaultCollapsed: true,
      items: [
        { id: "mount", label: "Mount", route: "/os/mount" },
        { id: "blueprint", label: "Blueprint", route: "/os/blueprint" },
        { id: "authority", label: "Authority", route: "/os/authority" },
        { id: "execute", label: "Execute", route: "/os/execute" },
        { id: "settle", label: "Settle", route: "/os/settle" },
        { id: "tracker", label: "Tracker", route: "/os/tracker" },
        { id: "terminal", label: "Inspect and Terminal", action: "terminal", hint: "Ctrl+`" },
      ],
    },
  ];
  ```
- **Preservation Invariant:**
  Every existing lifecycle page remains completely functional and reachable. No backend proxy or mock route is severed.

---

### R4. Fail-Closed Consequence & Recovery Protection
1. **Transport Safety & Network Drops:**
   $$\text{TransportFailure} \not\implies \text{AuthorityExpansion}$$
   - When a network timeout occurs during execution, the coordinator enters `outcome_unknown` / `OUTCOME_UNCERTAIN`.
   - It records the `operation_id` and dispatches independent readback.
   - It refuses to emit a secondary execution request until an explicit reconciliation receipt proves previous outcome.
2. **Idempotency & Operation ID Caching:**
   - CAPPO and the client cache receipts by `operation_id`. Retrying an operation returns the original receipt without triggering duplicate mutations ($\Delta C = 0$).
3. **Policy Denials & Revocations:**
   - Any denial halts pipeline with `phase = "denied"`.
   - The destination target state remains unmodified ($\Delta C = 0$).

---

## 6. Causal Authority Invariant (Law 0) Constraints

1. **Law of Non-Implication:**
   $$\mathbf{\text{ComputationalPossession} \not\implies \text{CurrentConsequenceAuthority}}$$
   $$\mathbf{\text{ExecutionContinuity} \not\implies \text{ConsequenceAuthority}}$$
2. **CAPPO as Sole Authority Gatekeeper:**
   All mutations pass through `POST /api/v1/execution/authorize` ➔ `POST /api/cappo/v1/exec`. No frontend component, compiler, or proxy may bypass CAPPO.
3. **Cryptographic Binding of Approvals:**
   Approval binds the exact 6-tuple:
   $$(\text{Capability}, \text{Target}, \text{Resource}, \text{Action}, \text{Arguments}, \text{CanonicalHash})$$
   Any modification voids the approval:
   $$\text{approval.canonicalHash} \neq \text{currentPlan.canonicalHash} \implies \text{approval} \leftarrow \text{undefined}$$
4. **Sink-Level Defense-in-Depth & Dual-State Receipts:**
   Mutations are physically committed only when accompanied by dual-state receipts:
   - `state_before`
   - `state_after`
   - monotonic `epoch`
   - `proof_hash`
   On rejection, $\Delta C = 0$.

---

## 7. Acceptance Criteria Matrix & Verifiable Test Scenarios

### 7.1 Acceptance Criteria Matrix

| ID | Category | Requirement | Verifiable Criterion | Test Method |
|----|----------|-------------|----------------------|-------------|
| AC-1 | Build | Zero Regressions | Standalone build succeeds cleanly; `node node_modules/jest/bin/jest.js` passes with 0 failures | CI / `jest` execution |
| AC-2 | UI / DOM | Exact Concept 2 Layout | `/os` renders Task Composer, Active Task Card, Horizontal DAG, Approval Card, and Right Inspector matching `media_1792374164906_5e94f608.png` | DOM snapshot & React Testing Library |
| AC-3 | UI / DAG | Dynamic Status Transitions | DAG nodes correctly reflect transition states (`Prepared` ➔ `Approval required` ➔ `Verified`) | React state assertion tests |
| AC-4 | Engine | Autonomous Lifecycle | Coordinator headlessly compiles, mounts, assesses policy, and mints lease upon approval | `taskController.test.ts` |
| AC-5 | Governance | Law 0 Approval Binding | Recompilation or parameter edits void held approval immediately | Unit tests on reducer / controller |
| AC-6 | Governance | Transport Safety | Mid-flight network drop sets `outcome_unknown` and prevents duplicate execution | Network simulation test |
| AC-7 | Governance | Zero Mutation on Denial | Denied policy or lease returns `phase = "denied"` and asserts $\Delta C = 0$ | Dual-state test harness |
| AC-8 | Navigation | Deep-Link Preservation | All 8 lifecycle routes (`/os/mount`, `/os/blueprint`, etc.) remain fully functional | Route navigation test suite |

### 7.2 Verifiable Test Scenarios (Jest Suite)

1. **Scenario 1: Happy Path Lifecycle**
   - Submit intent: *"Prepare the monthly sales summary and email it to the sales team"* with `sales-october.csv`.
   - Assert DAG nodes 1-3 transition to `Prepared`.
   - Assert DAG node 4 transitions to `Approval required`.
   - Assert Action Approval Card renders with 6 recipients and `sales-summary.pdf`.
   - Click "Approve & send".
   - Assert `CapabilityLease` minted and submitted to `/api/cappo/v1/exec`.
   - Assert DAG node 4 transitions to `Verified`.
   - Assert Right Rail Inspector displays receipt ID and `Verified` proof badge.

2. **Scenario 2: Dynamic Approval Invalidation (Law 0)**
   - Formulate plan and approve action.
   - Inject binding modification (e.g. change resource or recipients).
   - Assert approval is voided (`approval == undefined`).
   - Assert Action Approval Card returns to `needs_review`.
   - Assert execution cannot be dispatched until re-approved.

3. **Scenario 3: Transport Safety & Drop Handling**
   - Approve action.
   - Mock fetch rejection / network drop on `POST /api/cappo/v1/exec`.
   - Assert coordinator enters `outcome_unknown`.
   - Assert DAG node 4 renders warning.
   - Assert automatic duplicate execution is NOT dispatched.
   - Assert target readback is triggered and proof marked `Needs proof`.

4. **Scenario 4: Replay Idempotency**
   - Replay completed `operation_id`.
   - Assert response returns cached receipt.
   - Assert no additional mutation occurs ($\Delta C = 0$).

5. **Scenario 5: Navigation Deep-Link Conformance**
   - Mount shell on `/os/mount`.
   - Assert `Advanced` drawer is expanded.
   - Assert Mount page renders with fully wired endpoints and no 404s.

---
*Report certified by Concept 2 Spec Miner under the Codex Verifier Protocol.*
