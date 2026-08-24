# Capability OS Developer Handoff Checklist

Complete this before materially changing Capability OS frontend behavior.

## 1. Baseline

- Frontend repository:
- Frontend base SHA:
- Branch being used:
- Is the branch based on current `main`? YES / NO
- If harvesting from an older Devin/agent branch, which files are being cherry-picked or ported and why?

## 2. Backend reconciliation

Record the actual selected source/runtime contract for each service:

- BYOS repo / SHA / runtime URL:
- cAPI repo / SHA / runtime URL:
- CAPPO repo / SHA / runtime URL:
- Gnomledger/PGL repo / SHA / runtime URL:
- Lockerphycer repo / SHA / runtime URL:
- VNP source/runtime used by the frontend:
- GPC/ABIDE source/runtime used by the frontend:

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
- BYOS identity verification path:
- Evidence retrieval path:
- Measurement retrieval path:
- cAPI discovery/connection paths used:
- PGL direct paths used:
- Lockerphycer direct paths used:

Confirm:

- [ ] cAPI is not used as final consequence authority.
- [ ] Lockerphycer is not used as authority/policy decision-maker.
- [ ] VNP measurement does not grant authority.
- [ ] Evidence does not grant authority.
- [ ] Browser code is not given server/service credentials.
- [ ] React components use same-origin/shared transport unless an explicitly documented exception exists.

## 4. Environment aliases

Record the values/names expected by this branch:

- `BACKEND_URL`:
- `NEXT_PUBLIC_API_BASE_URL`:
- `CAPI_BACKEND_URL` / alias:
- `CAPPO_BACKEND_URL` / `CAPPO_URL` alias:
- `PGL_URL`:
- `VNP_URL`:
- `LOCKERPHYCER_URL`:
- other service URLs:

List any alias conflict or stale env name found:

## 5. Product model

Confirm the change fits the canonical workspace spine:

COMMAND / CAPABILITIES / WORKFLOWS / EXECUTIONS / AUTHORITY / EVIDENCE / MEASURE / INFRASTRUCTURE / SETTINGS / TERMINAL

If touching a legacy route (`mount`, `blueprint`, `govern`, `settle`, `tracker`, `computeless`), record which canonical page owns the user-facing concept.

## 6. Truth-state behavior

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

- [ ] authenticated principal established
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
