# Handoff Report — Concept 2 Specification Mining

**Date:** 2026-10-19T02:13:30Z  
**Agent:** Concept 2 Spec Miner (`spec_miner_survey_1`)  
**Target Root:** `C:\Users\antho\Documents\Codex\2026-09-16\w\work\veklom-m1p2\veklom-FRONTEND`  
**Deliverable File:** `C:\Users\antho\Documents\Codex\2026-09-16\w\work\veklom-m1p2\veklom-FRONTEND\.agents\teamwork\spec_miner_survey_1\spec_concept2_requirements.md`  
**Handoff Type:** Hard (Task complete)

---

## 1. Observation

1. **Authoritative Original Request:**
   - Read from `C:\Users\antho\Documents\Codex\2026-09-16\w\work\veklom-m1p2\veklom-FRONTEND\.agents\teamwork\ORIGINAL_REQUEST.md`.
   - Verified Baseline Lock: SHA `ca9ad01dc4b014cc99edc18610fe421ec787ec6e` (`git log -1` matches verbatim).
   - Core Mandate: Revamp Capability OS into approved Concept 2 task-centric workspace matching `media_1792374164906_5e94f608.png`.

2. **Visual Mockup Discovery & Inspection:**
   - Discovered exact mockup image at:
     `C:\Users\antho\.gemini\antigravity\brain\235d432e-5dee-4797-a2af-5cc90a3f421d\.user_uploaded\media_1792374164906_5e94f608.png`.
   - Observed visual components and text hierarchy verbatim:
     - Top Navigation Header: Logo `VEKLOM CAPABILITY OS`, Breadcrumb `› Proof ↗`, Workspace selector `Sales Operations ⌵`, `▷ Playground` button, `DESIGN PREVIEW · NOT LIVE` pill, Sun/Moon theme toggle, avatar `JD`.
     - Left Navigation: `Workspace` (active cyan pill), `Capabilities`, `Governed`, `Evidence Vault`, `Measure`, `Private Cloud`, `Settings`, footer items `Advanced ⌵` and `›_ Inspect and Terminal`.
     - Task Composer Box: Headline `What do you need to do?`, Subtitle `Describe the outcome. Veklom handles the steps.`, Prompt textarea containing `Prepare the monthly sales summary and email it to the sales team.`, attachment pill `sales-october.csv ✕`, paperclip button, cyan submit send button `➤`.
     - Active Task Card: Document icon + `Monthly sales summary`, status pill `⏱ Waiting for your approval` (amber text and outline).
     - Generated Document Sub-card: Red PDF icon, `sales-summary.pdf`, `Preview report ↗`, subtitle `Draft available · Email not sent`.
     - Horizontal Execution DAG: 5 discrete nodes connected by chevrons:
       `[✓ Sales CSV / Prepared]` ➔ `[✓ Summarize / Prepared]` ➔ `[✓ Report draft / Prepared]` ➔ `[✉ Send email / Approval required (amber border)]` ➔ `[📄 Evidence / Pending]`.
     - Action Approval Card: Nested card with cyan border, title `Send this report to the sales team?`, `6 recipients · View recipients ↗`, Subject `Monthly sales summary`, Attachment `📎 sales-summary.pdf`, Buttons `👁 Preview email`, `✓ Approve & send` (cyan filled), `Cancel`, Disclaimer `Approval applies only to this email and these recipients.`.
     - Task Footer Status Bar: `Plan prepared → Awaiting approval → No email sent`.
     - Inspector Panel (Right Rail): Envelope icon + `Send email`, Status pill `Approval required` (amber), 5 key-value pairs (`Capability: email.send`, `Policy: Approval required`, `Authority: Not issued`, `Outcome: Not executed`, `Evidence: Pending`), Accordions (`Scope and recipients: 6 recipients · Sales team`, `Activity: Draft ready · Waiting for approval`, `Receipt and readback: No readback yet`), Footer link `View task evidence: No execution receipt yet`.

3. **Existing Codebase State & Architecture:**
   - `lib/cos/nav.ts` (lines 32-55): Configures `navGroups` for Core Product and Advanced/Inspect drawer.
   - `components/cos/LeftNav.tsx` (lines 1-290): Renders left navigation rail and mobile drawer with icon mapping and active route animation.
   - `app/os/page.tsx` (lines 1-123): Currently renders `CapabilityHome` (catalog search and recent items).
   - `app/os/workspace/page.tsx` (lines 1-26): Currently renders `ConversationWorkspace` using 4 pillars (`Work`, `Authority`, `Telemetry`, `Evidence`).
   - `lib/cos/tasks/task-reducer.ts` (lines 1-191): Implements state machine handling `submit`, `compiled`, `bind`, `approve`, `authority`, `executed`, `readback`, and `outcome_unknown`.
   - `lib/cos/verticalSlice.ts` (lines 44-72): Invokes canonical execution route `POST /api/cappo/v1/exec`.

4. **Physical Test Suite Execution:**
   - Ran `node node_modules/jest/bin/jest.js lib/cos/tasks/__tests__/task-reducer.test.ts`.
   - Result: 1 suite passed, 9 tests passed, 0 failures in 3.88s.

---

## 2. Logic Chain

1. **Baseline Validation:**
   The workspace is cleanly locked at SHA `ca9ad01dc4b014cc99edc18610fe421ec787ec6e`. Existing tests in `lib/cos/tasks/__tests__/task-reducer.test.ts` pass cleanly (9/9), proving that the core task state model is functionally verified and ready for extension.

2. **UI Gap Identification:**
   The existing workspace (`app/os/workspace/page.tsx` and `ConversationWorkspace.tsx`) uses a generic 4-pillar layout (`Work`, `Authority`, `Telemetry`, `Evidence`) with a React Flow canvas and unstructured review card. To satisfy Concept 2 and match `media_1792374164906_5e94f608.png`, the UI must be transformed into:
   - Primary landing at `/os` (`app/os/page.tsx` & `/os/workspace`).
   - Task Composer Box with attachment pills and direct prompt execution.
   - Active Task Card featuring generated document preview sub-card, horizontal 5-node visual DAG, and exact Action Approval Card.
   - Persistent Right Rail Inspector surfacing the 5-parameter property matrix, 3 expandable accordions, and PGL evidence link.

3. **Coordination Engine Architecture (R2):**
   Currently, lifecycle requests are driven via component callbacks in `ConversationWorkspace.tsx`. Extracting these calls into a headless coordinator (`lib/cos/taskController.ts`) allows headless compilation via ABIDE, automatic mount preparation via cAPI, policy evaluation, and single-use authority minting and execution via CAPPO without manual navigation between tabs.

4. **Preservation of Invariant Law 0:**
   $$\text{ComputationalPossession} \neq \text{CurrentConsequenceAuthority}$$
   - Approvals are cryptographically pinned to `canonical_hash`. Any modification to bindings voids the approval.
   - Transport drop flags `OUTCOME_UNCERTAIN` / `outcome_unknown` and triggers independent target readback without blind re-execution.
   - Policy denials or replayed operation IDs guarantee $\Delta C = 0$.

5. **Navigation Streamlining (R3):**
   `lib/cos/nav.ts` and `components/cos/LeftNav.tsx` must be updated to surface the streamlined product menu (`Workspace`, `Capabilities`, `Governed`, `Evidence Vault`, `Measure`, `Private Cloud`, `Settings`) while retaining all 8 lifecycle routes (`/os/mount`, `/os/blueprint`, etc.) inside the collapsible `Advanced` drawer.

---

## 3. Caveats

- **Mockup Scope:** The mockup `media_1792374164906_5e94f608.png` depicts an active email-sending scenario (`Monthly sales summary`). The component architecture must support generic task DAGs while maintaining this specific high-fidelity layout.
- **Node Execution Policy:** On Windows PowerShell, executing `npm.ps1` directly is blocked by execution policy. Jest commands must be executed via `node node_modules/jest/bin/jest.js` or `cmd.exe /c npm test`.

---

## 4. Conclusion

All requirements, DOM hierarchies, component specifications, state transitions, Law 0 invariants, and acceptance criteria for Concept 2 Revamp have been comprehensively extracted, synthesized, and documented in:
`C:\Users\antho\Documents\Codex\2026-09-16\w\work\veklom-m1p2\veklom-FRONTEND\.agents\teamwork\spec_miner_survey_1\spec_concept2_requirements.md`.

The implementation team has a complete blueprint specifying:
- Exact visual DOM hierarchy and Tailwind styling matching `media_1792374164906_5e94f608.png`.
- Headless architecture for `lib/cos/taskController.ts`.
- Navigation updates for `lib/cos/nav.ts` and `components/cos/LeftNav.tsx`.
- Transport safety, fail-closed handling, and Law 0 invariants.
- 8-point acceptance criteria matrix and verifiable test scenarios.

---

## 5. Verification Method

To independently verify this specification report:
1. Inspect the generated specification:
   `view_file AbsolutePath="C:\Users\antho\Documents\Codex\2026-09-16\w\work\veklom-m1p2\veklom-FRONTEND\.agents\teamwork\spec_miner_survey_1\spec_concept2_requirements.md"`
2. Verify visual mockup parity:
   `view_file AbsolutePath="C:\Users\antho\.gemini\antigravity\brain\235d432e-5dee-4797-a2af-5cc90a3f421d\.user_uploaded\media_1792374164906_5e94f608.png"`
3. Verify test runner baseline:
   `node node_modules/jest/bin/jest.js lib/cos/tasks/__tests__/task-reducer.test.ts` (expect 9 passed).
