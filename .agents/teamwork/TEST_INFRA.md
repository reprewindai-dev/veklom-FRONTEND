# E2E Test Infra: Veklom Capability OS Concept 2 Revamp

## Test Philosophy
- **Requirement-Driven & Opaque-Box**: Tests are derived strictly from `ORIGINAL_REQUEST.md` and user-facing specifications, exercising the product as an end user would without reliance on internal component implementations.
- **Methodology**: Systematic 4-Tier test strategy combining Category-Partition, Boundary Value Analysis (BVA), Pairwise Combinatorial Testing, and Real-World Workload Scenarios, followed by Tier 5 white-box adversarial coverage hardening.
- **Physical Proof**: Every test physically executes through Jest and DOM/API harnesses, validating real state transitions, DOM elements, and network contracts.

---

## Feature Inventory
| # | Feature | Source | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|--------|:------:|:------:|:------:|:------:|
| F1 | Streamlined Left Navigation & Deep Links | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| F2 | Task Composer Box (Outcome Prompt & Attachments) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F3 | Active Task Card & Document Sub-Card Preview | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F4 | Horizontal 5-Node Execution DAG Progression | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F5 | Exact Action Approval Card & Parameter Binding | ORIGINAL_REQUEST §R1, Law 0 | 5 | 5 | ✓ | ✓ |
| F6 | Right Rail Inspector Telemetry & Accordions | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F7 | Autonomous Task Coordinator (`lib/cos/taskController.ts`) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| F8 | Fail-Closed Transport Drop & Replay Protection | ORIGINAL_REQUEST §R4, Law 0 | 5 | 5 | ✓ | ✓ |

---

## Test Architecture
- **Runner**: Jest `30.4.2` running under Node `v24.20.0` with `jest-environment-jsdom`.
- **Command**: `npm.cmd test -- --runInBand` (or `node node_modules/jest/bin/jest.js <test_path>`).
- **Pass/Fail Semantics**: 0 exit code indicates pass; any assertion failure, timeout, or uncaught exception fails the suite.
- **Directory Layout**:
  - `lib/cos/tasks/__tests__/` — Task coordinator and state machine unit tests
  - `components/cos/__tests__/` — Component DOM render and interaction tests
  - `__tests__/e2e/concept2/` — Concept 2 end-to-end integration test suites

---

## Coverage Thresholds
- **Tier 1 (Feature Coverage)**: ≥5 test cases per feature (40 tests across 8 features) covering happy paths in isolation.
- **Tier 2 (Boundary & Corner Cases)**: ≥5 test cases per feature (40 tests) covering empty inputs, max sizes, special characters, network timeouts, revoked leases.
- **Tier 3 (Cross-Feature Pairwise)**: ≥8 tests verifying interactions between Composer, DAG, Approval, Inspector, and Navigation.
- **Tier 4 (Real-World Application Scenarios)**: ≥5 full-lifecycle application workflow scenarios:
  1. *Monthly Sales Summary workflow*: Prompt input ➔ CSV attachment ➔ ABIDE compile ➔ 5-node DAG generation ➔ approval pause ➔ operator approval ➔ CAPPO execution ➔ PGL receipt in Inspector.
  2. *Operator Rejection / Cancel workflow*: Same flow, but operator clicks "Cancel" ➔ pipeline halts with $\Delta C = 0$, status shows cancelled, no lease minted.
  3. *Network Transport Drop & Uncertainty Recovery*: Approval granted ➔ execution POST drops ➔ pipeline transitions to `outcome_uncertain` ➔ background target readback initiated without re-executing.
  4. *Deep-link navigation & state isolation*: Navigate to `/os/govern` or `/os/evidence` and back to `/os` ➔ state preserved, no sandbox leak.
  5. *Replayed Operation ID Deduplication*: Replay execution with identical operation ID ➔ cached receipt returned, double execution prevented.
- **Tier 5 (Adversarial Coverage Hardening)**: White-box challenger tests probing Law 0 parameter tampering, lease hijacking, and concurrent state race conditions.
