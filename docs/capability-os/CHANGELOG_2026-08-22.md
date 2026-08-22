# Capability OS Architecture / Handoff Changelog — 2026-08-22

This is not a marketing changelog. It records architecture changes, responsibility corrections, implementation baselines and unresolved drift so the next developer can understand **what changed and why**.

## Frontend baseline now in `main`

`reprewindai-dev/veklom-FRONTEND@d3807f391904a35eb45e8f77b0d8c448aaa14cb8`

Merged commit: `feat: wire truthful governed execution proof (#73)`

Important consequences of that merge:

- Capability OS execution transport was moved onto the governed CAPPO path.
- CapabilityLease data is carried into governed execution.
- target-state preconditions are represented in the frontend transport.
- evidence and measurement retrieval are explicit post-execution paths.
- rendering distinguishes missing/unknown/degraded/failed proof instead of pretending absence is success.
- consumed-lease and missing-measurement states were preserved in follow-up commits before merge.

This merge is a source-level frontend milestone, not proof of a fully deployed live consequence.

## Backend state used for the handoff

### CAPPO

Repository: `reprewindai-dev/cappo-backend`

Observed main baseline: `01f8dce9a09e1646ee323e7c1f3ed8f862767934`

Open PR #82, `codex/truthful-vertical-slice`, head `50e05a569d1a37a830fdee9e7eefd606c2ce6fd7`:

- scoped single-use CapabilityLease consumption
- signed target-state preconditions
- replay / revoked / expired / wrong-scope / stale-target / unauthorized-egress rejection
- exact execution evidence and measurement routes
- EEE verification and result-state checking
- exact remote Gnomledger evidence retrieval

Truth boundary: source/local contract proof; no deployed consequence claim.

### BYOS

Repository: `reprewindai-dev/veklom-byos-backend`

Observed main baseline: `85969ea55a442cdfc411e477398b9c79ad76e560`

Relevant role: canonical authenticated workspace/main backend. A recent main commit restored frontend PGL onboarding.

### cAPI

Repository: `reprewindai-dev/cAPI`

Observed main baseline: `7d5c5469ae7131a32aec4a5c7d517cfebe664dc0`

Important responsibility corrections already present on main:

- public execution proxy retired
- cAPI capabilities routed through CAPPO
- registry heartbeats protected

Open PR #44 still tightens fail-closed authority integration behavior so a prior approval cannot be replayed when the authority service is unavailable.

### Gnomledger / PGL

Repository: `reprewindai-dev/gnomledger`

Observed main baseline: `7873f4f2fe95606a1634083481926a1a59cebb07`

Open PR #17 adds authenticated account-scoped exact event retrieval required for canonical persisted evidence lookup.

Truth boundary: persisted/hash-chained/tamper-evident evidence; do not upgrade that wording to absolute immutability.

### Lockerphycer

Repository: `reprewindai-dev/lockerphycer`

Observed main baseline: `aeb7465c351f0b6682d1dc0c88d486441c1152b5`

Open PR #30, head `dcc04cd080b61c4abe5c94cefeac1b78dcd2493d`, implements the first repo-real governed execution cell and brokered GitHub effect path.

Responsibility correction: CAPPO decides whether a consequence may occur; Lockerphycer enforces the physical execution boundary.

## Drift discovered during handoff review

Multiple frontend branches encode different backend maps and environment assumptions.

Examples observed:

- `devin/canonical-backends-full-set`
- `devin/capability-os`
- current `main`

These branches have disagreed on:

- which services are canonical
- whether CAPPO or cAPI owns execution
- PGL naming/meaning
- VNP naming/meaning
- Lockerphycer role
- direct service URLs vs same-origin proxying
- environment variable names

Therefore no historical Devin branch should be merged wholesale as the architecture source of truth.

## Product decisions frozen during convergence

The product was converged from three presentation experiments into one Capability OS:

- proof-first semantics are the permanent backbone
- guided presentation appears at onboarding and consequential boundaries
- dense operator presentation appears only when risk/failure/responsibility demands it

The product navigation was converged to:

COMMAND / CAPABILITIES / WORKFLOWS / EXECUTIONS / AUTHORITY / EVIDENCE / MEASURE / INFRASTRUCTURE / SETTINGS / TERMINAL

Legacy pages such as Mount, Govern, Blueprint, Settle and Tracker are implementation/compatibility concepts that map into this product spine; they are not a second product navigation.

## Canonical responsibility corrections

The following are now explicit and should be treated as architecture corrections rather than cosmetic copy changes:

- CAPPO is sole consequence authority.
- cAPI is connection/discovery/negotiation and is not consequence authority.
- Lockerphycer enforces execution security/containment and is not authority.
- Gnomledger/PGL is evidence/provenance/lineage and is never permission.
- VNP means **Veklom Nexus Protocol** and measures/qualifies; it never authorizes.
- GPC compiles/understands workflows and does not authorize consequences.
- CapabilityLease is the canonical authority object exposed to users.

## Known unresolved work

The frontend still needs a deliberate reconciliation pass for:

1. stale labels and roles in `lib/canonical-backends.ts`
2. legacy stage ownership/naming in `lib/cos/stages.ts`
3. service environment alias normalization (`CAPPO_URL` vs `CAPPO_BACKEND_URL`, etc.)
4. silent `sandbox` fallback in `lib/api.ts`
5. legacy route aliases that can obscure the canonical CAPPO consequence path
6. exact backend PR/deployed-runtime selection once PR #82 / Gnomledger #17 / Lockerphycer #30 move state

These are documented as unresolved on purpose. Do not infer that the handoff document means the code already matches every frozen contract.

## Required future changelog behavior

When an implementation changes architecture-visible behavior, document:

- previous behavior
- new behavior
- why it changed
- repository and commit/PR
- source-only vs deployed/live verification state
- compatibility impact
- owner/service responsibility impact
- what the next developer must do differently

A handoff should not require reading commit history plus five branches plus chat history to reconstruct the current model.
