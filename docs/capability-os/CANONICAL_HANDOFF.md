# Veklom Capability OS — Canonical Handoff

Last reconciled: 2026-09-13

Frontend source of truth: `reprewindai-dev/veklom-FRONTEND` current `main` plus an explicitly identified reconciliation PR when work has not merged yet.

This document is the canonical target contract for Capability OS frontend implementation. It separates product/architecture truth from historical source residue and must move with architecture-visible code changes.

---

## 1. Product identity

Product: **Veklom Capability OS**

Category: **governed capability / consequence operating system**

Core principles:

- Execution infrastructure is disposable; governed capability continuity is not.
- Models and automation may propose work. Veklom decides whether the exact consequence may occur now.
- Identity, authority, state, runtime binding, consequence and evidence remain distinct contracts.
- Experiment with presentation. Never experiment with truth.

Hard invariant:

`AcceptedEffect => Identity ∧ Policy ∧ OperationSpecificAuthority ∧ CurrentTargetState ∧ ExecutionBoundary ∧ DurableEvidence`

These are gates, not a blended score.

---

## 2. Canonical backend responsibility map

| Component | Canonical responsibility | Must not be treated as |
|---|---|---|
| cAPI / Covenant | governed connection, discovery, negotiation and capability registry | final consequence authority |
| CAPPO | **sole consequence authority**, fail-closed authorization, CapabilityLease issuance/evaluation and governed consequence orchestration | generic provider executor only |
| Lockerphycer | authentication/session and workspace security boundary; secret/key security and governed execution containment where configured | consequence/policy decision-maker |
| Gnomledger / PGL | durable evidence, provenance, lineage, append-only/hash-linked evidence | runtime permission |
| VNP | measurement, route/API qualification, telemetry and observation | authority |
| GPC / ABIDE | capability composition, blueprint/contract compilation and plan mechanics | permission issuer |
| RepoGate | repo/capability intake, security and policy gating | runtime authority |
| Veklom ID | identity and trust evidence | capability permission |
| EEE | portable execution evidence envelope | permission |
| VCGB | adversarial conformance / benchmark validation | runtime authority |
| x402 | settlement/payment admission where independently verified | authentication or authority |
| VLink | public connection/pairing doorway into governed capability use | authority itself |

**BYOS is decommissioned.** It is not a canonical owner, fallback, identity source, settlement source, evidence source or product dependency. Historical BYOS references are cleanup debt unless a migration/historical document explicitly labels them as such.

Stale meanings that must not be reintroduced include cAPI as final authority, Lockerphycer as consequence authority, evidence as permission, measurement as permission, and any implicit BYOS fallback.

---

## 3. Canonical capability lifecycle

The Capability OS user-facing lifecycle is:

**Capabilities → Mount → Blueprint → Govern → Authority → Execute → Evidence → Measure → Settle → Tracker**

Meaning:

- **Capabilities** — discover what connected systems can do; discovery is not permission.
- **Mount** — bind a capability package to a scoped, expiring execution boundary.
- **Blueprint** — compose intent into a reviewable plan/contract.
- **Govern** — evaluate policy and approval conditions before consequence authority is issued.
- **Authority** — inspect the current CapabilityLease, scope, epoch, expiry, revocation and target-state bounds.
- **Execute** — run the exact authorized consequence through the canonical governed execution path.
- **Evidence** — inspect EEE/PGL proof of what happened.
- **Measure** — inspect VNP observation, performance, economics and reliability without turning measurement into authority.
- **Settle** — inspect or complete x402/payment obligations and settlement evidence where applicable.
- **Tracker** — compose the above truth into operational attention and continuity.

Cross-cutting surfaces:

- **Compute-less** — connected compute/runtime supply and bounded execution environments. It is not a second lifecycle.
- **Terminal** — expert button/overlay over the same governed paths. It is never an authority bypass.

`DISCOVERABLE != INVOCABLE`

`CONNECTED != AUTHORIZED`

`CAPABILITY PRESENT != EFFECT ALLOWED`

`EVIDENCE != PERMISSION`

---

## 4. Navigation and route compatibility

Use the existing Capability OS shell. Do **not** create another product shell.

Primary lifecycle navigation is exactly the lifecycle in section 3.

Historical shell routes are redirects only:

- `/os/command` → `/os/tracker`
- `/os/capabilities` → `/os`
- `/os/workflows` → `/os/blueprint`
- `/os/executions` → `/os/execute`
- `/os/governed-compute` → `/os/computeless`
- `/os/settings` → `/os`
- `/os/terminal` → `/os` (Terminal is opened from the shell control)

These routes must not be repopulated with placeholder pages or used to recreate a second workspace taxonomy.

---

## 5. Product interaction model

The product must behave as one capability flowing through one lifecycle, not as independent dashboards.

A selected capability should preserve its identity and relevant state across Mount → Blueprint → Govern → Authority → Execute → Evidence → Measure → Settle → Tracker.

A public/cold client may enter `/os` and `/proof` without an account, but consequence-bearing operations must still fail closed until the required identity, workspace, authority and environment contracts are satisfied.

Sandbox/demo behavior must be explicit. A sandbox flag, route or environment is not itself evidence that a consequence was simulated or verified.

---

## 6. Canonical truth states

- `VERIFIED` — evidence supports the claim.
- `LIVE` — fresh runtime state has been observed.
- `DEGRADED` — a required property/evidence is impaired, but some operation may continue.
- `FAILED` — a required operation/control failed.
- `UNKNOWN` — Veklom cannot reliably know.
- `SIMULATED` — explicit dry-run/demo only.

Authority/lifecycle states may additionally include `BLOCKED`, `EXPIRED`, `REVOKED`, `CONSUMED`, `DISSOLVED` and `OUTCOME_UNCERTAIN` where the backend contract defines them.

Never silently turn failed/degraded/unknown state into simulated success. A configured endpoint or manifest is not operational proof. Missing required evidence remains unverified.

---

## 7. Authority semantics

Canonical authority object: **CapabilityLease**.

The UI should preserve, when returned, requester/principal, capability, exact operation, scope, target, TTL, resource/budget bounds, runtime/execution binding, authority/revocation epoch, target-state precondition, replay state, revoke/terminate state and resulting evidence references.

Current authority must remain distinct from historical evidence. A receipt proves what its contract proves; it does not recreate current permission.

Identity establishes who/what is acting. CAPPO decides whether that identity may cause the exact consequence now.

---

## 8. Frontend transport and route ownership

Client-side React components should prefer same-origin frontend transport. Do not scatter private/internal service addresses or service credentials through browser code.

Canonical consequence execution terminates at CAPPO. cAPI may discover/connect, but must not become the final consequence authority. Lockerphycer may authenticate/issue sessions and protect secrets, but must not become CAPPO's policy decision-maker. VNP and PGL must never grant authority.

`/v1/exec` is the canonical governed execution route. Execution proof/evidence/measurement projection routes may be exposed through the frontend proxy when the corresponding backend implementation exists.

No browser path may fall back to BYOS.

---

## 9. Capability OS proof discipline

Source-backed route metadata describes an intended/implemented contract; it does not earn a green runtime state.

For every stage endpoint:

1. identify the canonical owner;
2. verify the route exists in the selected source/runtime contract;
3. call it through the intended transport;
4. classify the actual response;
5. display missing/failed/degraded state honestly;
6. keep source-only, local-harness, deployed and independently verified evidence distinct.

The public `/proof` surface must keep claim scope visible. Local adversarial harness evidence must not be relabeled as production or multi-provider proof.

---

## 10. Governed Compute

Governed Compute is a substrate under the capability lifecycle, not a second product shell.

Principle:

**Minimum sufficient compute + minimum sufficient trust + minimum sufficient cost.**

A computation result does not substitute for proof that an external consequence occurred.

Do not claim Wasmtime, Firecracker, Kubernetes, Hyper-V, containers or other substrates are interchangeable under one contract until the corresponding proof has actually run and passed.

---

## 11. Consequence path

The canonical consequence sequence is:

request/intent
→ identity/workspace binding
→ selected capability
→ policy/target-state evaluation
→ scoped CapabilityLease / current authority
→ bounded runtime binding
→ consequence execution
→ resulting-state observation where applicable
→ execution evidence
→ durable PGL provenance
→ VNP/independent measurement where applicable
→ settlement where applicable
→ revoke/terminate/destroy

Negative paths are first-class product behavior: wrong identity/workspace, missing authority, wrong audience/scope, stale target, expired/revoked/consumed authority, replay, unauthorized egress, execution failure, outcome uncertainty, missing evidence, failed teardown and missing measurement.

A failed state can be valid evidence of fail-closed behavior.

---

## 12. Evidence and visual grammar

Rule:

**Shape carries object meaning. Color carries state. Density carries circumstance.**

- VNP/MEASURE: multidimensional observation/qualification object.
- EEE: sealed execution evidence envelope.
- PGL: lineage/provenance chain.
- VCGB: conformance result.

EEE-style fields should preserve WHO / WHAT / WHY / AUTHORITY / WITH WHAT / WHERE / WHEN / STATE BEFORE / STATE AFTER / HOW MUCH / OUTCOME / PROOF when the underlying evidence supports them.

`WHY` means declared purpose, approval and policy reason codes — never private model chain-of-thought.

---

## 13. Theme contract

Human workspace default: sovereign navy/night. Optional human light/day.

Public surface default: light/day, optional navy/night.

M2M: black/true grayscale only. State semantics remain identical across appearances.

---

## 14. Known drift to prevent

Do not reintroduce:

- the old COMMAND / WORKFLOWS / EXECUTIONS / INFRASTRUCTURE placeholder shell as the primary product model;
- BYOS as canonical backend or fallback;
- `byos_test_key` or browser-supplied service credentials;
- synthetic success/verified badges;
- cAPI/CAPPO role overlap;
- Lockerphycer as consequence authority;
- VNP or PGL as permission issuers;
- stale service URL aliases when a canonical owner/env exists;
- `host.docker.internal` as the default local Docker contract for the Windows-hosted product;
- claims that local harness evidence is production proof.

Do not copy historical branches wholesale. Diff and harvest only the implementation that still matches the current contract.

---

## 15. Completion gate

A truthful externally testable product journey is:

cold client
→ `/os`
→ discover capability
→ select one capability
→ establish the required identity/workspace when consequence-bearing work begins
→ mount/bind
→ blueprint/govern
→ exact current authority
→ real safe consequence
→ independently read resulting state where applicable
→ execution evidence
→ PGL retrieval
→ measurement
→ settlement where applicable
→ revoke/terminate
→ replay/stale authority denied

Then repeat from a clean environment and preserve the evidence bundle.

Do not call the product complete from a mock, a 200 response, a health endpoint, a configured URL, a source-only implementation or a local-only test that does not match the claim being made.

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

Nobody should have to reconstruct the current architecture from old branches, screenshots or memory.
