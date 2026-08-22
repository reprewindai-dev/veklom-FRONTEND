# Truthful Governed Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove one real principal-to-measurement consequence through CapabilityLease, governed execution, resulting state, EEE, PGL, and VNP while displaying all failure states truthfully in the existing Capability OS shell.

**Architecture:** Keep the existing Capability OS shell and route browser traffic through same-origin authenticated boundaries. UACP/GPC resolves authority, cAPI/interlink describes governed connection, CAPPO admits execution, BYOS performs the consequence, Lockerphycer supplies scoped secrets, Gnomledger persists lineage, and VNP attaches measurement. The frontend renders only backend-returned evidence and never generates proof locally.

**Tech Stack:** Next.js 16/React, Jest, FastAPI/Pytest, Rust/Cargo, Vite/Vitest.

## Global Constraints

- Preserve the frozen day/night human workspace and M2M grayscale shell.
- Do not build or embed a new frontend shell.
- Do not use seeded, random, fallback-key, or locally generated proof as production evidence.
- Preserve `Degraded`, `Failed`, `Unknown`, revoked, stale, and missing-evidence states even in sandbox.
- Every production behavior change starts with a failing regression test.

---

### Task 1: Canonical authenticated frontend transport

**Files:**
- Create: `lib/cos/verticalSlice.ts`
- Create: `lib/__tests__/cos-vertical-slice-transport.test.ts`
- Modify: `components/cos/ExecuteHarness.tsx`
- Modify: `components/cos/EvidenceHarness.tsx`
- Modify: `components/cos/MeasureHarness.tsx`

**Interfaces:**
- Produces: `executeGovernedConsequence`, `fetchExecutionEvidence`, and `fetchExecutionMeasurement` using the shared `api` client.
- Consumes: canonical same-origin CAPPO routes `/api/cappo/v1/exec`, `/api/cappo/v1/audit/ledger`, and `/api/cappo/v1/vnp/metrics`.

- [ ] Add tests that import the three functions, mock `fetch`, set `veklom.access_token`, and assert same-origin canonical paths plus the real bearer token with no `byos_test_key` fallback.
- [ ] Run `node node_modules/jest/bin/jest.js lib/__tests__/cos-vertical-slice-transport.test.ts --runInBand` and verify RED because `lib/cos/verticalSlice.ts` does not exist.
- [ ] Implement the three minimal functions via `api` and return typed backend envelopes without manufacturing fields.
- [ ] Replace raw fetches in the three harnesses and store the execution/evidence identifiers returned by the backend.
- [ ] Run the focused test and existing API/transport/proof tests; verify GREEN.

### Task 2: Truthful EEE/PGL/VNP proof model

**Files:**
- Modify: `lib/cos/proof.ts`
- Modify: `lib/cos/capabilities.ts`
- Create: `lib/__tests__/cos-vertical-slice-proof.test.ts`
- Modify: `components/cos/EvidenceHarness.tsx`
- Modify: `components/cos/MeasureHarness.tsx`

**Interfaces:**
- Produces: proof observations that distinguish verified EEE signature, PGL lineage, VNP measurement, missing evidence, and backend-declared failure.

- [ ] Add failing tests for missing envelope, invalid signature, absent lineage, absent measurement, degraded sandbox response, and fully verified evidence.
- [ ] Implement minimal classification using explicit backend verification fields; never infer verification from a non-empty object.
- [ ] Render EEE, PGL, and VNP as separate proof objects inside the existing Evidence/Measure workspaces.
- [ ] Run focused proof tests and verify GREEN.

### Task 3: Backend consequence contract and evidence retrieval

**Files:**
- Modify after contract audit: `cappo_backend/api/routers/exec_router.py`
- Modify after contract audit: `cappo_backend/services/eee.py`
- Modify after contract audit: Gnomledger/PGL client service used by CAPPO
- Test: `tests/test_execution_evidence_lifecycle.py`
- Test: new `tests/test_truthful_vertical_slice.py`

**Interfaces:**
- Consumes: CapabilityLease/grant identity, operation, target, scope, expiry, nonce, and egress constraints.
- Produces: execution result with resulting-state observation, EEE identifier/verification status, PGL lineage reference, and retrieval URLs.

- [ ] Add one failing integration test for a valid governed consequence and retrieval of the exact linked EEE/PGL record.
- [ ] Trace the current CAPPO-to-BYOS and CAPPO-to-Gnomledger boundaries and implement only missing contract fields or calls.
- [ ] Verify the positive lifecycle test passes without mocks standing in for the consequence or evidence store.

### Task 4: Negative authority and evidence paths

**Files:**
- Test/modify the canonical owners in `cappo-backend`, `veklom-byos-backend`, `uacpv3`, `cAPI`, `interlink-cAPI`, `lockerphycer`, and `gnomledger` only where the contract audit shows a gap.

**Interfaces:**
- Produces deterministic rejection taxonomy for replay, revoked/expired lease, stale target, wrong scope, unauthorized egress, and missing evidence.

- [ ] Add one failing test per negative path at the boundary that owns it.
- [ ] Implement fail-closed behavior one path at a time and verify each focused test turns GREEN.
- [ ] Verify every rejection creates or returns denial evidence where required and is never presented as success/simulation.

### Task 5: Capability surfaces and cross-repository conformance

**Files:**
- Audit/modify as proven necessary: `uacpv3` (GPC), `cAPI`, `interlink-cAPI`, `abide2`, `Repository-Tracker`, `COMPUTLESS`, `real-repo-gate-for-veklom`, `Veklom-RealTerminal`, and `veklom-vnp`.
- Modify: Capability OS stage definitions and native views only when a canonical contract changes.

**Interfaces:**
- Produces: VCGB/conformance evidence and native OS views without embedding standalone products.

- [ ] Map each repository's authoritative contract and CI command; mark read-only participants when no vertical-slice change is required.
- [ ] Add contract tests only for demonstrated mismatches; do not synchronize duplicate legacy implementations by assumption.
- [ ] Use the UACP/PerplexTerminal references as a native terminal capability surface, not as a replacement shell.

### Task 6: Full verification and completion audit

**Files:**
- Modify: CI configuration only for reproducible failures proven in baseline, including the `uacpv3` React peer conflict.

- [ ] Run lint, typecheck, unit/integration tests, and production builds for every changed repository.
- [ ] Run the frontend runtime audit with an authenticated session when available; classify unavailable live dependencies honestly.
- [ ] Verify the positive consequence and all six negative paths requirement-by-requirement.
- [ ] Inspect git diffs and confirm no secrets, fake proof, new shell, or unrelated user changes were introduced.
