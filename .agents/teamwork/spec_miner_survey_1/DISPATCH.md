## 2026-10-19T02:03:46Z
You are Concept 2 Spec Miner. Your working directory is:
C:\Users\antho\Documents\Codex\2026-09-16\w\work\veklom-m1p2\veklom-FRONTEND\.agents\teamwork\spec_miner_survey_1
You MUST read the authoritative user request at:
C:\Users\antho\Documents\Codex\2026-09-16\w\work\veklom-m1p2\veklom-FRONTEND\.agents\teamwork\ORIGINAL_REQUEST.md before starting work.

Task:
Extract and synthesize all precise requirements, UI specs, invariants, and acceptance criteria for Concept 2 Revamp.
Specifically investigate:
1. Search for and inspect media_1792374164906_5e94f608.png and any related mockups/specs in the repo or working directory. Document the exact visual DOM hierarchy and component layout from the Concept 2 design:
   - Task Composer Box (exact placeholder, prompt input, attachment pills, action button)
   - Active Task Card (title "Monthly sales summary", status pill "Waiting for your approval", generated document card "sales-summary.pdf")
   - Horizontal Execution DAG (nodes: Sales CSV [Prepared] -> Summarize [Prepared] -> Report draft [Prepared] -> Send email [Approval required] -> Evidence [Pending])
   - Exact Action Approval Card (scope, recipients, subject, attachments, buttons: "Preview email", "Approve & send", "Cancel", disclaimer text)
   - Inspector Panel (Right Rail: Capability, Policy, Authority, Outcome, Evidence, expandable sections)
2. Requirements R1, R2, R3, R4 detailed breakdown:
   - R1: Simplified Concept 2 Task Workspace (app/os/page.tsx / /os/workspace)
   - R2: Autonomous Task Coordination Engine (lib/cos/taskController.ts)
   - R3: Streamlined Navigation with Preserved Lifecycle Deep-Links (components/cos/LeftNav.tsx, lib/cos/nav.ts)
   - R4: Fail-Closed Consequence & Recovery Protection (Transport safety, cached receipts, delta C = 0)
3. Causal Authority Invariant (Law 0) constraints:
   - COMPUTATIONAL POSSESSION != CURRENT CONSEQUENCE AUTHORITY
   - CAPPO sole consequence authority
   - Cryptographic binding of approvals
   - OUTCOME_UNCERTAIN handling on network drops
4. Acceptance criteria matrix and verifiable test scenarios.

Write your detailed report to:
C:\Users\antho\Documents\Codex\2026-09-16\w\work\veklom-m1p2\veklom-FRONTEND\.agents\teamwork\spec_miner_survey_1\spec_concept2_requirements.md
and write a standard handoff.md in your working directory.
When finished, send a message to the orchestrator with a summary of your findings.
