# Veklom Capability OS — Canonical Handoff Documentation

Status: **Architecture/product handoff source for frontend work**

Baseline frontend commit: `d3807f391904a35eb45e8f77b0d8c448aaa14cb8` (`feat: wire truthful governed execution proof (#73)`).

This directory exists so nobody has to reconstruct Capability OS architecture from branch names, old design briefs, README claims, or memory.

## Read these in order

1. [`CANONICAL_HANDOFF.md`](./CANONICAL_HANDOFF.md) — frozen product, ownership, routing, truth-state, UX and backend responsibility contract.
2. [`CHANGELOG_2026-08-22.md`](./CHANGELOG_2026-08-22.md) — original convergence, responsibility corrections and known drift.
3. [`CHANGELOG_2026-08-23.md`](./CHANGELOG_2026-08-23.md) — cAPI security-boundary remediation, frontend route-audit decisions, SEKED clarification and current production-DDL status.
4. [`API_PATH_AUDIT_2026-08-23.md`](./API_PATH_AUDIT_2026-08-23.md) — point-in-time frontend route audit, phantom-route remediation taxonomy, SEKED classification and the rule that missing endpoints must never look like empty success.
5. [`HANDOFF_CHECKLIST.md`](./HANDOFF_CHECKLIST.md) — required reconciliation report before a developer continues Capability OS work.

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

For the **target Capability OS responsibility model**, `CANONICAL_HANDOFF.md` is the frozen implementation contract until intentionally superseded by a documented architecture decision.

## Core principle

> Experiment with presentation. Never experiment with truth.
