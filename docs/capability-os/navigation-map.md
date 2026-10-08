# Navigation Map — Veklom Capability OS

## One shell

**Name:** Veklom Sovereign Control Plane
**Frame:** persistent left navigation (from Interlink) + enterprise top bar (from cAPI) + capability-centric work surface + a full-screen Terminal overlay (`Ctrl+``, like VS Code).

### Top bar (from cAPI enterprise dashboard)
- Veklom logo (left).
- **PROD MODE / DEMO (SANDBOX)** toggle — with honest state, not a fake "VERIFIED".
- Requester identity + Role.
- Runtime/model status (e.g. Ollama Local: honest state).
- Quick Action / command palette (`?K`).
- Live clock + zero-trust/proof indicator.

### Left navigation (from Interlink)
Grouped, with live status pills and red/yellow/green severity where relevant.

## Primary navigation

The canonical lifecycle spine is:

`CAPABILITIES → MOUNT → BLUEPRINT → GOVERN → AUTHORITY → EXECUTE → EVIDENCE → MEASURE → SETTLE → TRACKER`

Cross-cutting surfaces: Terminal overlay and Runtime diagnostics.

The former Command / Capabilities-stub / Workflows / Executions / Governed Compute / Settings / Terminal-route shell model is SUPERSEDED (removed in devin/1789290468-cos-reconciliation; legacy URLs 301 to lifecycle routes). Do not reintroduce it.

Lifecycle routes:

| Stage | Route |
|---|---|
| Capabilities | `/os` |
| Mount | `/os/mount` |
| Blueprint | `/os/blueprint` |
| Govern | `/os/govern` |
| Authority | `/os/authority` |
| Execute | `/os/execute` |
| Evidence | `/os/evidence` |
| Measure | `/os/measure` |
| Settle | `/os/settle` |
| Tracker | `/os/tracker` |

Redirects:

| Legacy route | Canonical route |
|---|---|
| `/os/command` | `/os/tracker` |
| `/os/capabilities` | `/os` |
| `/os/workflows` | `/os/blueprint` |
| `/os/executions` | `/os/execute` |
| `/os/governed-compute` | `/os/computeless` |
| `/os/settings` | `/os` |
| `/os/terminal` | `/os` |

## Capability Tools

- **Marketplace**: Discover, Install, Publish, Update, Version, and Share capabilities.
- **Harnesses**: Runtime bindings, Adapters, Provider compatibility.
- **Verification**: Verifies repositories, artifacts, dependencies, images, provenance, and evidence.

## Tracker — first-class (continuous truth)

Compares the chain and flags drift:

`CAPABILITIES → MOUNT → BLUEPRINT → GOVERN → AUTHORITY → EXECUTE → EVIDENCE → MEASURE → SETTLE → TRACKER`

**States:** `Aligned` · `Unreviewed change` · `Deployment drift` · `Policy drift` · `Capability drift` · `Evidence stale` · `Unknown/unmeasured`.

## Evidence (PGL) — first-class

```
Evidence search + execution ID
        ?
Execution decision graph
        ?
Identity ? Policy ? Authority ? Runtime ? Settlement
        ?
Hashes · signatures · repository commit · artifacts
        ?
Verify • Replay • Export
```
Answers per execution: who acted · what capability · which policy version · which repo commit · what authority was released · where it ran · what it consumed · what outcome · which signatures prove it · how to replay.

## Naming rule

Internal implementation names (ABIDE, CAPPO, cAPI, LockerPhycer, GnomLedger, Interlink) remain implementation details. The primary navigation always exposes functional concepts (Blueprint, Govern, Authority, Execute, Evidence, Measure, Settle, Tracker). Internal service names appear only in advanced diagnostics, evidence, or developer views.
