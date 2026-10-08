# Navigation Map — Veklom Capability OS

## One shell

**Name:** Veklom Sovereign Control Plane
**Frame:** persistent left navigation (from Interlink) + enterprise top bar (from cAPI) + capability-centric work surface + a full-screen Terminal overlay (`Ctrl+``, like VS Code).

### Top bar (from cAPI enterprise dashboard)
- Veklom logo (left).
- **PROD MODE / DEMO (SANDBOX)** toggle — with honest state, not a fake "VERIFIED".
- Requester identity + Role.
- Runtime/model status (e.g. Ollama Local: honest state).
- Quick Action / command palette (`⌘K`).
- Live clock + zero-trust/proof indicator.

### Left navigation (from Interlink)
Grouped, with live status pills and red/yellow/green severity where relevant.

## Primary navigation

Capabilities are primary. The left nav is organized so the **capability lifecycle** reads top-to-bottom.
**Everything revolves around capabilities.** A capability is the object; each stage is something you *do to* a capability.

```
HOME
  └ Capabilities (search / recently used / mounted)        ← default landing

------------------------
LIFECYCLE
(every item below is entered in the context of a selected capability)

  Mount
  Blueprint
  Govern
  Authority
  Execute
  Evidence
  Measure
  Settle
  Tracker

------------------------
CAPABILITY TOOLS

  Registry
  Marketplace
  Harnesses
  Contracts
  Verification

------------------------
OPERATOR

  Terminal
  Settings
```

**Reading order of the spine:** `Capabilities → Mount → Blueprint → Govern → Authority → Execute → Evidence → Measure → Settle → Tracker`. 
Every workspace exists to move, observe, or prove a capability as it progresses through its governed lifecycle.

## Capability Tools

- **Marketplace**: Discover, Install, Publish, Update, Version, and Share capabilities.
- **Harnesses**: Runtime bindings, Adapters, Provider compatibility.
- **Verification**: Verifies repositories, artifacts, dependencies, images, provenance, and evidence.

## Tracker — first-class (continuous truth)

Compares the chain and flags drift:

`Capability → Mount → Blueprint → Govern → Authority → Execute → Evidence → Measure → Settle → Tracker`

**States:** `Aligned` · `Unreviewed change` · `Deployment drift` · `Policy drift` · `Capability drift` · `Evidence stale` · `Unknown/unmeasured`.

## Evidence (PGL) — first-class

```
Evidence search + execution ID
        ↓
Execution decision graph
        ↓
Identity → Policy → Authority → Runtime → Settlement
        ↓
Hashes · signatures · repository commit · artifacts
        ↓
Verify • Replay • Export
```
Answers per execution: who acted · what capability · which policy version · which repo commit · what authority was released · where it ran · what it consumed · what outcome · which signatures prove it · how to replay.

## Naming rule

Internal implementation names (ABIDE, CAPPO, cAPI, LockerPhycer, GnomLedger, Interlink) remain implementation details. The primary navigation always exposes functional concepts (Blueprint, Govern, Authority, Execute, Evidence, Measure, Settle, Tracker). Internal service names appear only in advanced diagnostics, evidence, or developer views.
