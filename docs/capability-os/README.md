# Veklom Capability OS — Canonical Handoff Documentation

Status: **Architecture/product handoff source for frontend work**

Current reconciliation baseline: **2026-09-13 Capability OS reconciliation**. Historical August handoff documents remain useful for provenance, but any navigation, ownership or BYOS statement that conflicts with the 2026-09-13 canonical handoff is superseded.

This directory exists so nobody has to reconstruct Capability OS architecture from branch names, old design briefs, README claims, or memory.

## Read these in order

1. [`CANONICAL_HANDOFF.md`](./CANONICAL_HANDOFF.md) — current product, ownership, routing, truth-state, UX and backend responsibility contract.
2. [`CHANGELOG_2026-09-13.md`](./CHANGELOG_2026-09-13.md) — lifecycle-registry reconciliation, BYOS retirement cleanup and cold-client access changes.
3. [`CHANGELOG_2026-08-22.md`](./CHANGELOG_2026-08-22.md) — historical convergence and responsibility corrections.
4. [`CHANGELOG_2026-08-23.md`](./CHANGELOG_2026-08-23.md) — historical cAPI security-boundary remediation and route audit.
5. [`API_PATH_AUDIT_2026-08-23.md`](./API_PATH_AUDIT_2026-08-23.md) — point-in-time route audit; retain its rule that missing endpoints must never look like empty success.
6. [`HANDOFF_CHECKLIST.md`](./HANDOFF_CHECKLIST.md) — required reconciliation report before a developer continues Capability OS work.

## Documentation rule

When architecture, route ownership, environment naming, authority semantics, product navigation, truth-state behavior, or a material API-path contract changes, the implementation change is not complete until this documentation is updated in the same PR or an explicitly linked follow-up PR.

Do not assume another developer knows which of several historical Veklom branches or backend contracts was intended.

## Truth hierarchy

For runtime claims:

1. observed live behavior
2. deployed runtime evidence
3. current repository default branch
4. independently retrievable evidence/provenance
5. documentation

For the **target Capability OS responsibility model**, `CANONICAL_HANDOFF.md` is the current implementation contract until intentionally superseded by a documented architecture decision.

## Core principle

> Experiment with presentation. Never experiment with truth.
