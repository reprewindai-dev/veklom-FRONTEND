# Capability OS reconciliation — 2026-09-13

Status: source reconciliation for the real `veklom-FRONTEND` product surface.

## Canonical lifecycle restored

The primary Capability OS spine is now:

`Capabilities → Mount → Blueprint → Govern → Authority → Execute → Evidence → Measure → Settle → Tracker`

Runtime diagnostics remains cross-cutting. Terminal is an alternate shell control over the same governed routes and is not a second execution path.

The historical Command / Workflows / Executions / Governed Compute / Settings placeholder pages are redirects only and must not be repopulated as a second product model.

## BYOS retirement cleanup

BYOS is decommissioned. This reconciliation removes it from the canonical backend registry, proof/runtime ownership language and benchmark compiler fallback. No new Capability OS path may depend on `BACKEND_URL`, `VEKLOM_BACKEND_URL`, `api.veklom.com` as a BYOS fallback, or `byos_test_key`.

Canonical responsibility remains separated:

- LockerPhycer — authentication/session, key security and governed containment where configured.
- cAPI — governed connection/discovery and capability registry.
- CAPPO — consequence authority and governed execution boundary.
- GnomLedger/PGL — durable evidence/provenance.
- VNP — measurement/observation.

## Cold-client access

`/os` and `/proof` are public navigation surfaces. Private/admin/internal/MCP and consequence-bearing operations retain their own authentication/authority gates. Public navigation is not equivalent to execution authority.

## Deployment defaults

Local Windows-hosted Docker defaults use `127.0.0.1` service endpoints through the host-side deployment/tunnel arrangement. `VLINK_URL` owns the VLink rewrite. `host.docker.internal` is not the default application contract.

## Truth-state correction

The endpoint registry is source-backed and typed, but endpoint configuration alone is not proof that a route is currently live. UI proof state must be derived from observed responses/evidence. Compiler output may not synthesize benchmark/verification values when parsing or validation fails.

The public proof claim ledger distinguishes local adversarial harness evidence from deployed/production proof. CAPPO route-proof work that is still on an unmerged backend branch must remain labeled accordingly.

## Pass 1B source and glyph audit

- Audited lifecycle endpoint ownership and handler presence against pinned service source.
- Replaced inherited `live` registry classes with `present`, `needs_proof`, and `absent`, including qualifications for ambiguous or non-durable routes.
- Added the blueprint plan graph projection and lifecycle activity cues only where returned state supports them.

## Deferred product work

Still not complete in this reconciliation:

- one selected capability carried through every lifecycle page;
- real sandbox environment contract and isolation;
- publication of the three sealed mobility evidence bundles and M0–M13 rendering;
- host-side cloudflared ingress configuration;
- full cold-client consequence journey and product acceptance battery.

Branch: `devin/1789292427-cos-pass1b-final`

Evidence tier: source-only/local build, not deployed-verified.

## Governed Counter cold-user loop

The authenticated Mount → Execute → Evidence → Revoke → Retry surface now carries
one bounded CAPPO governed-counter lease across the OS pages, preserves the
returned consequence receipt and denial history in the tab session, and routes
VLink `/pair/*` links to the configured VLink service. This remains a source-only
and local-build change; deployed runtime behavior is not verified here.
