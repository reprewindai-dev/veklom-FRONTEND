# Capability OS API Path Truth Audit — 2026-08-23

Status: **source audit / remediation input, not deployed-runtime proof**

This document records the frontend API-path audit so future developers do not infer that a rendered panel has a working backend merely because the UI exists.

## Why this exists

The Capability OS frontend contains many historical and experimental surfaces. A request that resolves to no route must never render as a plausible empty-success state. **No endpoint is not the same thing as no data.**

Audit method: enumerate frontend requests made through `useApi(...)`, `api(...)`, `fetcher(...)`, and relative `fetch("/...")`, then resolve them against Next route handlers, the same-origin catchall, BYOS routers, and CAPPO routers.

Approximate source-audit totals at the time of review:

- served: 26
- phantom: ~110
- unresolved/unclear: ~40

These counts are a point-in-time source audit. They must not be presented as live runtime telemetry.

## Mandatory remediation taxonomy

Every frontend request must be classified as one of:

1. **REMAP** — the capability exists but the frontend path is wrong.
2. **RETAIN** — the path is canonical and resolves end to end.
3. **BUILD** — the capability belongs in the frozen Capability OS contract but no backend contract exists yet.
4. **RETIRE / QUARANTINE** — legacy, experimental, duplicate, or superseded UI that must not imply a live backend.
5. **UNKNOWN / UNAVAILABLE** — destination cannot currently be established; UI must say so explicitly.

Do **not** create ~110 endpoints merely because historical UI references them.

## Confirmed canonical surfaces from the audit

Examples confirmed end to end include:

- BYOS `/api/v1/pgl/*` canonical status/registry/certificate/onboarding paths
- BYOS `/api/v1/workspace`
- BYOS `/api/v1/auth/me`, logout and API-key paths
- BYOS cAPI quarantine routes
- BYOS security posture and x402 verification
- frontend-owned VNP/benchmark helper handlers already present in the Next app
- CAPPO governed execution through `/api/cappo/v1/exec`

The frozen governed vertical slice remains:

- `POST /api/cappo/v1/exec`
- `GET /api/cappo/v1/executions/{execution_id}/evidence`
- `GET /api/cappo/v1/executions/{execution_id}/measurements`

The evidence/measurement routes remain subject to exact active-backend verification before claiming live proof.

## Cheap path corrections that should be preferred over replacement backends

The audit found real features hidden by path-shape mistakes, including:

- `/api/v1/wallet/...` → canonical BYOS workspace wallet namespace `/api/v1/workspace/wallet/...`
- `/api/v1/autonomous/decisions` → `/api/v1/workspace/autonomous/decisions`
- `/v1/platform/pulse` → CAPPO `/api/v1/platform/pulse`
- `/v1/health` → CAPPO `/health`
- benchmark requests must dispatch to the actual benchmark owner rather than falling through to BYOS by accident

Fix the contract at the smallest truthful layer; do not build duplicate services to preserve a typo.

## Major phantom / legacy clusters

The following clusters were found referenced by frontend code without an established served contract in the audited stack. They are **not evidence that these capabilities should be built**:

- Federation Provider Interface (`/api/fpi/*`)
- Substrate (`/api/substrate/*`)
- scratch lifecycle routes such as `/api/compile-intent`, `/api/evaluate-policies`, `/api/mint-pgl`, `/api/mint-ei`, `/api/execute-tool`, `/api/verify-ledger`
- non-workspace wallet aliases
- non-workspace autonomous aliases
- legacy agent-control endpoints
- frontend `/api/mcp/*` aliases that do not match the canonical connection path
- Locks surfaces without a canonical locks service
- Quantum / legacy UACP dashboard endpoints
- alternate PGL spellings such as `/api/pgl/*` and `/api/ledger` when the canonical service contract differs
- `/api/local/*` experimental/shadow routes
- legacy auth aliases outside `/api/v1/auth/*`
- VNP route-shape mismatches
- miscellaneous demo/experimental plugin, Gemini, cognitive, quantum and alert routes
- `/nexus-protocol/state`, which had no established data source in the audited frontend/backend contract

Until deliberately mapped to a canonical responsibility, these surfaces must be retired, quarantined, or render explicit `UNKNOWN` / `UNAVAILABLE` rather than empty success.

## SEKED classification

SEKED is a real separate code/product lineage, including `reprewindai-dev/SekedControlPlaneMVP`. That does **not** make the frontend `lib/seked-api.ts` authority/evidence methods canonical Capability OS routes.

Frozen Capability OS responsibility remains:

- **SEKED:** policy evaluation / decision input / contextual policy logic where intentionally integrated
- **CAPPO:** sole consequence authority
- **EEE + PGL/Gnomledger:** canonical execution evidence/provenance

Therefore the historical `/api/v1/seked/authority-runs/*` and `/api/v1/seked/evidence-packs/*` client methods must not become a second Authority or Evidence implementation just to satisfy old UI. Classify them as legacy/quarantined unless a new documented contract intentionally maps them into CAPPO/EEE/PGL.

## Truth-state requirement for transport failures

The canonical vocabulary remains:

- `VERIFIED`
- `LIVE`
- `DEGRADED`
- `FAILED`
- `UNKNOWN`
- `SIMULATED`

Operational object states may additionally include:

- `BLOCKED`
- `EXPIRED`
- `REVOKED`

Evidence-specific presentation may say `NEEDS PROOF` when the required proof is absent. A numeric value or non-null payload does not itself make a claim `VERIFIED`.

A 404, unresolved destination, missing backend, failed proxy dispatch, or contract mismatch must never collapse into an empty-data success panel.

## P0 frontend acceptance rule

Before a Capability OS surface is called truthful:

1. its route owner is known;
2. the same-origin transport resolves to that owner;
3. authentication and consequence authority are not conflated;
4. a missing route produces an explicit failure/unknown/unavailable state;
5. no synthetic fallback converts missing live data into a healthy-looking result;
6. the page can distinguish `zero records` from `backend unavailable`;
7. consequential execution still enters through CAPPO, not a page-specific shortcut.

## Work order

1. Apply the global transport/UI truth fix so phantom requests cannot render as healthy empty states.
2. Fix the small path-prefix/dispatch mistakes for capabilities that already exist.
3. Remove or quarantine obsolete feature surfaces from the canonical navigation/runtime path.
4. Resolve each remaining unclear variable-base client against an explicit service contract.
5. Build only missing endpoints required by the frozen product contract.
6. Re-run the path audit and publish served/retired/unavailable counts from the new exact frontend commit.

## Handoff rule

Future frontend handoffs must include an API-path reconciliation report. A developer must not infer route validity from component names, old diagrams, environment variables, or the existence of a TypeScript client wrapper.
