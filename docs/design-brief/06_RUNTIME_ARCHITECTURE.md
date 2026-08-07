# Runtime Architecture — why the workspaces exist

The UI workspaces are not arbitrary screens; each one is a stage in the governed runtime a capability moves through. This is the mental model the designer should hold behind every screen.

**Every screen should make its place in this flow obvious — where the capability came from, what stage it's in, and what proves it.**

## The runtime flow (one machine action)

```
Capability
      │
      ▼
    Mount
      ▼
  Blueprint
      ▼
   Govern
      ▼
  Authority
      ▼
   Execute
      ▼
  Evidence
      ▼
   Measure
      ▼
 Settlement

   Tracker
──────────────────────────────
observes every stage
──────────────────────────────
```

## Detailed Flow

*   **INTENT** (messy, natural-language ask)
    *   ↓
*   **ABIDE** ────────────── **Blueprint**
    *   intent → gold-standard blueprint / plan
    *   ↓
*   **CAPABILITY REGISTRY (cAPI / MCP)** ────────── **Capabilities · Mount**
    *   resolve the blueprint to real capabilities (skills, contracts, providers, adapters, pricing, routing)
    *   ↓
*   **MARKETPLACE**
    *   discovers governed capabilities → Mount installs them → Harness binds them → Govern authorizes them
    *   ↓
*   **CAPABILITY HARNESS** ────────────── **Mount**
    *   bind capability → model/provider + adapter; RepoGate verification
    *   ↓
*   **GPC DECISION** ────────────── **Govern**
    *   governed plan compiler: policy-check the plan (trust thresholds, SEKED/SAFR, quorum, delegation)
    *   ↓
*   **CAPPO** ────────────── **Govern → Execute**
    *   LAW 0 fail-closed authorization (POST `/api/v1/execution/authorize`) + governed execution (POST `/v1/exec`, 9-phase)
    *   ↓
*   **EXECUTION IDENTITY (LockerPhycer)** ────────── **Authority**
    *   signed EI / scoped authority, caps, leases (never raw keys). Authority does not create permissions; it materializes permissions already approved by governance.
    *   ↓
*   **PGL (gnomledger)** ────────── **Evidence**
    *   cryptographically replayable evidence, lineage, signatures (identity→policy→authority→runtime→settlement)
    *   ↓
*   **VNP** ────────────── **Measure**
    *   measurement / benchmark / topology / trust telemetry
    *   ↓
*   **x402 SETTLEMENT** ────────── **Settle**
    *   challenge → auth → verify → execute → measure → settle → split → refund
    *   ↓
*   **TRACKER** ────────────── **Tracker**
    *   continuous truth: blueprint ↔ commit ↔ RepoGate ↔ image ↔ runtime ↔ PGL
    *   (Aligned / Unreviewed change / Deployment drift / Policy drift / Capability drift / Evidence stale / Unknown)
    *   *Tracker is not another execution stage. It continuously observes every previous stage and reports drift between approved intent and operational reality.*

## How stages map to services and screens

| Runtime stage | Service / repo | UI workspace |
|---|---|---|
| Intent → Blueprint | ABIDE (`abide`) | Blueprint |
| Capability resolution | cAPI / Covenant (`cAPI`) | Capabilities · Mount |
| Harness / verification | cAPI harness + RepoGate | Mount (Govern for verify) |
| Plan governance | GPC (`uacpv3`) | Govern |
| Authorization + execution | CAPPO (`cappo-backend`) + BYOS (`veklom-byos-backend`) | Govern → Execute |
| Execution identity / authority | LockerPhycer (`lockerphycer`) | Authority |
| Evidence / lineage | PGL / gnomledger (`gnomledger`) | Evidence |
| Measurement / telemetry | VNP (`veklom-vnp`) | Measure |
| Settlement | x402 | Settle |
| Continuous truth | cross-cutting | Tracker |

## Design implication

Every screen should make its place in this flow obvious — where the capability came from, what stage it's in, and what proves it. The design reflects the system underneath, not just attractive panels. Proof states and sim/hardware labels are how each stage tells the truth about itself.

Ports/hosts for these services are pinned to the routing Bible once confirmed — see `05_API_CONTRACT_MAP.md` for the mechanical `/api/v1` contract. Port authority is still being reconciled (ops matrices conflict with the canonical ports); do not hardcode ports until resolved.
