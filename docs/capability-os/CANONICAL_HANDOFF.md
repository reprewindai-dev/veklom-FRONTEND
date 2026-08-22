# Veklom Capability OS — Canonical Handoff

Date frozen: 2026-08-22

Frontend baseline: `reprewindai-dev/veklom-FRONTEND@d3807f391904a35eb45e8f77b0d8c448aaa14cb8`

This document is the canonical target contract for Capability OS frontend implementation. It intentionally separates **product/architecture truth** from historical source residue.

---

## 1. Product identity

Product: **Veklom Capability OS**

Category: **Consequence Authority Infrastructure (CAI)**

Core principles:

- Agents are ephemeral. Consequences persist.
- Models propose. Veklom decides whether reality may change.
- Cloud runs the work. Governed Compute decides whether the work may change reality.
- Experiment with presentation. Never experiment with truth.

Hard invariant:

`AcceptedEffect => Identity ∧ Policy ∧ OperationSpecificAuthority ∧ CurrentTargetState ∧ ExecutionBoundary ∧ DurableEvidence`

These are gates, not a blended score.

---

## 2. Canonical backend responsibility map

| Component | Canonical responsibility | Must not be treated as |
|---|---|---|
| BYOS | main backend, authenticated workspace/account/application services | consequence authority |
| cAPI / Covenant | governed API/MCP connection, discovery, negotiation, integration | consequence authority |
| CAPPO | **sole consequence authority**, fail-closed authorization, CapabilityLease issuance, governed consequence orchestration | generic provider executor only |
| Lockerphycer | secret/key security plus enforced execution containment / governed execution-cell boundary | policy or authority decision-maker |
| Gnomledger / PGL | durable evidence, provenance, lineage, append-only/hash-linked evidence | runtime permission |
| VNP — Veklom Nexus Protocol | measurement, route/API qualification, telemetry, route-selection evidence | authority |
| GPC | intent/import to capability composition / governed workflow blueprint | permission issuer |
| ABIDE | blueprint and bounded execution-contract compilation mechanics | authority |
| RepoGate | repo/capability intake, security and policy gating | runtime authority |
| Veklom ID | identity and trust evidence | capability permission |
| EEE | portable execution evidence envelope | permission |
| VCGB | adversarial conformance / benchmark validation | runtime authority |
| x402 | settlement/payment admission where independently verified | authentication or authority |

Stale names/meanings that must not be reintroduced:

- `VNP = Value Network Protocol`
- `PGL = Genome Ledger`
- `PGL = Policy Governance Ledger`
- `GPC = policy oracle`
- `cAPI = final consequence authority`
- `Lockerphycer = authority`

---

## 3. Canonical operating spine

Human or machine intent
→ Identity
→ Connections
→ Capabilities
→ Workflows / GPC
→ Authority
→ Governed Compute
→ Execution
→ Evidence
→ Measurement
→ Optimization / settlement

Discovery is not permission. Connection is not permission. Evidence is not permission.

`DISCOVERABLE != INVOCABLE`

`CONNECTED != AUTHORIZED`

`CAPABILITY PRESENT != EFFECT ALLOWED`

`EVIDENCE != PERMISSION`

---

## 4. Canonical workspace navigation

Use the existing Capability OS shell. Do **not** create another product shell.

Primary workspace navigation:

- COMMAND
- CAPABILITIES
- WORKFLOWS
- EXECUTIONS
- AUTHORITY
- EVIDENCE
- MEASURE
- INFRASTRUCTURE
- SETTINGS
- TERMINAL

Internal module/repository names generally stay behind the product surface.

Legacy route concepts are compatibility/mechanics, not a second navigation model:

- `/os/mount` → capability/authority mechanics
- `/os/blueprint` → Workflows
- `/os/govern` → Authority
- `/os/execute` → Executions
- `/os/evidence` → Evidence
- `/os/measure` → Measure
- `/os/computeless` → Infrastructure / Governed Compute
- `/os/settle` → settlement detail inside governed objects
- `/os/tracker` → Command/Evidence/Measure drill-down

---

## 5. Page contracts

### COMMAND
Operational attention and truth, not a vanity dashboard. Show consequential requests, failures, blocked work, expiring authority, missing evidence, abnormal measurement, and the next safe action.

### CAPABILITIES
Default/heart of the OS. Show what connected systems can actually do through Veklom. Capability is the smallest reusable governed action. Capability present does not mean authority exists.

### WORKFLOWS
Compose capabilities. GPC turns intent or an imported workflow into a reviewable governed blueprint. GPC proposes what happens; it does not grant permission.

### EXECUTIONS
Show actual work, resulting state, authority used, compute boundary, evidence and measurement.

### AUTHORITY
Canonical object: **CapabilityLease**. Show requester, capability, exact operation, scope, target, TTL, resource/budget limits, locality, delegation, issuer, expiry, consumed/revoked/replay state.

### EVIDENCE
EEE + PGL. Show what happened and what can be proved. Historical evidence is never current authority.

### MEASURE
VNP measurements, compute economics, reliability, performance, route/provider comparison and next-run optimization. Measurement can inform decisions but never grants authority.

### INFRASTRUCTURE
Connections and compute supply. Veklom governs compute; it is not claiming to replace all cloud/VM/Kubernetes infrastructure.

### SETTINGS
Workspace, team, RBAC, authentication, APIs/webhooks, billing and admin.

### TERMINAL
Expert alternate interface using the same governed path. Never a bypass.

---

## 6. Interaction model

The previous A/B/C presentations are not three products or themes.

Frozen behavior:

- **C / proof-first semantics** are the default backbone.
- **A / guided presentation** appears at onboarding, setup and consequential commitment boundaries.
- **B / dense operational presentation** appears when risk, uncertainty, failure, responsibility, audit or forensics demand more detail.

Rule:

> Show the smallest truthful surface that lets the current user understand the consequence and take the correct next action.

Veklom does not change personality when conditions change. It changes depth.

Escalate detail for `DEGRADED`, `FAILED`, `UNKNOWN`, `BLOCKED`, `EXPIRED`, `REVOKED`, missing/conflicting evidence, authority review, audit and incidents.

---

## 7. Canonical truth states

- `VERIFIED` — evidence supports the claim.
- `LIVE` — fresh runtime state.
- `DEGRADED` — a required property/evidence is impaired, but some operation may continue.
- `FAILED` — a required operation/control failed.
- `UNKNOWN` — Veklom cannot reliably know.
- `SIMULATED` — explicit dry-run/demo only.

Authority/lifecycle states may also include `BLOCKED`, `EXPIRED`, `REVOKED`, `CONSUMED`.

Never silently turn failed/degraded/unknown state into simulated success.

---

## 8. Authentication and authority

BYOS authentication establishes requester/workspace identity.

CAPPO decides whether that requester may cause the exact consequence now.

The frontend must preserve that separation.

Browser identity tokens must not be confused with CAPPO internal credentials. Server-side proxy boundaries may validate canonical BYOS identity and then use server-held service credentials where the route contract requires it.

---

## 9. Frontend transport and route ownership

Client-side React components should use same-origin frontend transport. Do not scatter public Veklom service URLs through components.

The current truthful vertical slice uses:

- `POST /api/cappo/v1/exec`
- `GET /api/cappo/v1/executions/{execution_id}/evidence`
- `GET /api/cappo/v1/executions/{execution_id}/measurements`

The execution request carries the CapabilityLease plus target-state precondition when required.

Do not move consequence execution back into cAPI and do not create a fake local execution authority.

---

## 10. Governed Compute

Governed Compute is a core product substrate, not a sidebar.

Principle:

**Minimum sufficient compute + minimum sufficient trust + minimum sufficient cost.**

Assurance ladder:

- GC-0 External/provider execution
- GC-1 Bounded disposable process, no ambient credentials
- GC-2 OS-enforced namespaces/cgroups/seccomp/kernel controls
- GC-3 Hard-isolated Firecracker/KVM, measured artifacts, no guest NIC where possible, jailer and teardown proof
- GC-3C Confidential compute (SNP/TDX) when required
- GC-4 Verified consequence: before/after proof, EEE/PGL, independent effect verification, VCGB
- GC-5 Selective provable computation / zkVM

A computation proof does not substitute for proof that an external effect occurred.

---

## 11. P0 consequence path

The first deal-sealer is one real GitHub consequence:

pinned target state
→ proposed patch/effect
→ repo/branch/operation-scoped CapabilityLease
→ bounded credentialless workload
→ trusted broker
→ immediate target SHA recheck
→ JIT repository-scoped credential
→ exact mutation
→ credential revoke
→ resulting-state read-back
→ EEE
→ PGL retrieval
→ measurement

Negative paths must be first-class:

- wrong identity / workspace
- missing authority
- wrong audience / repo / branch / operation
- stale target
- expired / revoked / consumed / replayed lease
- unauthorized egress
- missing evidence
- failed teardown
- missing measurement

A failed state proves honesty.

---

## 12. Evidence objects and visual grammar

Rule:

**Shape carries object meaning. Color carries state. Density carries circumstance.**

- VNP/MEASURE: stable hexagonal multidimensional comparison object after qualification.
- EEE: sealed execution evidence envelope, not a radar chart.
- PGL: lineage chain/spine.
- VCGB: shield/conformance seal.

EEE fields:

WHO / WHAT / WHY / AUTHORITY / WITH WHAT / WHERE / WHEN / STATE BEFORE / STATE AFTER / HOW MUCH / OUTCOME / PROOF

`WHY` means declared purpose, approval and policy reason codes — never private model chain-of-thought.

---

## 13. Theme contract

Human workspace default: sovereign navy/night. Optional human light/day.

Public surface default: light/day, optional navy/night.

M2M: black/true grayscale only. Machine grayscale is architectural meaning, not a third human theme.

State semantics remain identical across appearances.

---

## 14. Known source drift that must be reconciled

Current/historical source has contained stale or conflicting architecture residue, including:

- multiple `canonical-backends.ts` variants across Devin branches
- `VNP = Value Network Protocol`
- `PGL = Genome Ledger` or other stale expansions
- cAPI and CAPPO role overlap
- legacy stage ownership strings
- multiple service URL/env aliases (`CAPPO_URL`, `CAPPO_BACKEND_URL`, etc.)
- silent frontend fallback to `veklom.environment = sandbox`

Do not copy a historical branch wholesale. Diff and harvest useful implementation only.

---

## 15. Completion gate

A truthful external-testable vertical slice is:

real authenticated principal
→ real connection
→ capability discovery
→ workflow/request
→ exact CapabilityLease
→ Governed Compute
→ real consequence
→ independently read resulting state
→ EEE
→ PGL evidence retrieval
→ VNP/measurement

Then prove replay/revoke/expiry/stale-target/wrong-scope/egress/missing-evidence failure paths.

Do not call the board set from a mock, a 200 response, a health endpoint, a configured URL or source-only implementation.

---

## 16. Documentation requirement going forward

Any PR that changes one of these must update this directory in the same change or link an explicit documentation follow-up:

- backend responsibility/ownership
- authority semantics
- consequence path
- public proxy/route ownership
- environment variable naming
- product navigation/page role
- canonical truth state
- CapabilityLease schema/semantics
- EEE/PGL/measurement retrieval contract
- Governed Compute assurance semantics
- handoff baseline

Nobody should have to be a mind reader to understand why the frontend changed.
