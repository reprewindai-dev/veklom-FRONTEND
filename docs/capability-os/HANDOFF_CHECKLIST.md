# Capability OS Developer Handoff Checklist

Complete this before materially changing Capability OS frontend behavior.

## 1. Baseline

- Frontend repository:
- Frontend base SHA:
- Branch being used:
- Is the branch based on current `main`? YES / NO
- If harvesting from an older Devin/automation branch, which files are being cherry-picked or ported and why?

## 2. Backend reconciliation

Record the actual selected source/runtime contract for each active service:

- cAPI repo / SHA / runtime URL:
- CAPPO repo / SHA / runtime URL:
- Gnomledger/PGL repo / SHA / runtime URL:
- Lockerphycer repo / SHA / runtime URL:
- VNP source/runtime used by the frontend:
- GPC/ABIDE source/runtime used by the frontend:
- VLink source/runtime used by the frontend:

BYOS is decommissioned and must not be reintroduced as a canonical frontend owner, fallback, identity source, settlement surface, or evidence source. If a legacy file still references BYOS, record it explicitly as debt to remove rather than treating it as an active contract.

Open PRs intentionally being targeted instead of `main`:

- CAPPO:
- Gnomledger/PGL:
- Lockerphycer:
- cAPI:
- Other:

For every open PR listed above, state whether the frontend depends on source-only behavior or deployed/live behavior.

## 3. Route ownership

- Browser governed execution path:
- Server proxy path:
- Final CAPPO destination:
- Identity/session path (Lockerphycer):
- Evidence retrieval path:
- Measurement retrieval path:
- cAPI discovery/connection paths used:
- PGL direct paths used:
- Lockerphycer direct paths used:

Confirm:

- [ ] cAPI is not used as final consequence authority.
- [ ] Lockerphycer is not used as consequence/policy decision-maker.
- [ ] VNP measurement does not grant authority.
- [ ] Evidence does not grant authority.
- [ ] Browser code is not given server/service credentials.
- [ ] React components use same-origin/shared transport unless an explicitly documented exception exists.
- [ ] No BYOS fallback is used for a canonical Capability OS path.

## 4. Environment aliases

Record the values/names expected by this branch:

- `NEXT_PUBLIC_API_BASE_URL`:
- `CAPI_BACKEND_URL` / alias:
- `CAPPO_BACKEND_URL` / `CAPPO_URL` alias:
- `PGL_URL`:
- `VNP_URL`:
- `LOCKERPHYCER_URL`:
- `VLINK_URL`:
- other service URLs:

List any alias conflict or stale env name found. `BACKEND_URL` / `VEKLOM_BACKEND_URL` must not be introduced as a new BYOS dependency.

## 5. Product model

Confirm the change fits the canonical Capability OS lifecycle spine:

CAPABILITIES → MOUNT → BLUEPRINT → GOVERN → AUTHORITY → EXECUTE → EVIDENCE → MEASURE → SETTLE → TRACKER

Cross-cutting surfaces:

- COMPUTE-LESS — connected compute/runtime supply and bounded environments; not a replacement for the lifecycle spine.
- TERMINAL — button/overlay alternate interface over the same governed routes; never an authority bypass.

Historical shell routes are redirects only and must not become a second product model:

- `/os/command` → `/os/tracker`
- `/os/capabilities` → `/os`
- `/os/workflows` → `/os/blueprint`
- `/os/executions` → `/os/execute`
- `/os/governed-compute` → `/os/computeless`
- `/os/settings` → `/os`
- `/os/terminal` → `/os` (Terminal is opened from the shell control)

The former Command / Capabilities-stub / Workflows / Executions / Governed Compute / Settings / Terminal-route shell model is SUPERSEDED (removed in devin/1789290468-cos-reconciliation; legacy URLs 301 to lifecycle routes). Do not reintroduce it.

## 6. Truth-state behavior

Static registry classes are present / needs_proof / absent only; never encode live/verified statically.

For the object/page being changed, describe rendering for:

- VERIFIED:
- LIVE:
- DEGRADED:
- FAILED:
- UNKNOWN:
- SIMULATED:
- BLOCKED / EXPIRED / REVOKED / CONSUMED where applicable:

Confirm:

- [ ] missing evidence is not displayed as verified.
- [ ] missing measurement is not converted into a score.
- [ ] failed/degraded/unknown is not converted into simulated success.
- [ ] sandbox/demo mode is explicit.
- [ ] a configured endpoint is not described as live proof until an observation is returned.

## 7. Authority semantics

If the feature can cause or approve a consequence, record:

- requester:
- capability:
- exact operation:
- target:
- scope:
- CapabilityLease source:
- TTL:
- resource/budget constraints:
- target-state precondition:
- replay behavior:
- revoke behavior:
- resulting-state verification:
- evidence contract:

## 8. Failure / negative paths

State how the UI behaves for every relevant case:

- wrong identity/workspace
- missing authority
- wrong scope/audience
- stale target
- expired lease
- revoked lease
- consumed/replayed lease
- unauthorized egress
- execution failure
- outcome uncertain
- missing evidence
- failed teardown
- missing measurement

## 9. Verification

Source gates:

- [ ] tests
- [ ] typecheck
- [ ] lint
- [ ] build

Runtime/E2E gates when applicable:

- [ ] authenticated principal established where required
- [ ] cold unauthenticated `/os` and `/proof` access behaves as intended
- [ ] capability discovery is real
- [ ] authority comes from CAPPO
- [ ] consequence is real or explicitly simulated
- [ ] resulting state independently read back
- [ ] EEE retrieved
- [ ] PGL evidence retrieved
- [ ] measurement retrieved
- [ ] replay/revoke/expiry/stale-target negative path checked

## 10. Documentation update

Before merge, answer:

- What changed?
- Why did it change?
- Which prior behavior/assumption is now stale?
- Which repo/PR/SHA implements it?
- Is it source-only, deployed, or independently verified live?
- Does `CANONICAL_HANDOFF.md` need updating?
- Does the dated changelog need a new entry?

If architecture-visible behavior changed and this section is blank, the handoff is incomplete.
