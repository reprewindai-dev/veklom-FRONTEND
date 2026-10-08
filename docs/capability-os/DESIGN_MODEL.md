# Design model: workspaces and capabilities (read before changing the OS)

Written 2026-10-08 from the owner's walk-through and the design sources:
- `docs/design-brief/00_DESIGN_BRIEF.md`
- `runtime-architecture.md`
- `api-contract-map.md`
- `navigation-map.md`
- `docs/superpowers/plans/2026-08-14-capability-os-runtime-wiring.md`

**Nothing below is a duplicate.**

## Two kinds of thing

1. **Workspaces are places.** Each workspace is one stage of the governed runtime that a machine action moves through (the "8 viewpoints of one runtime"). They are the left rail and the "Workspaces" group in the search palette (⌘K, "Jump to a capability or workspace").
   - Lifecycle: Capabilities → Mount → Blueprint → Govern → Authority → Execute → Evidence → Measure → Settle → Tracker.
   - Cross-cutting: Private Cloud and Terminal.
2. **Capabilities are things.** "Capabilities are the noun the user manipulates." Each capability belongs to one workspace, its `lifecycleStage`, and opens there. The palette shows each capability with its workspace on the right.

So "Blueprint" the capability lives in "Blueprint" the workspace, the way a document lives in a folder. The baseline set (`lib/cos/capabilities.ts`) is:

| Capability | Workspace it belongs to | Default state |
|---|---|---|
| RepoGate Scan | Mount | Available |
| Build Blueprint | Blueprint | Available |
| Security Audit | Govern | Available |
| API Discovery | Mount | Available |
| MCP Publish | Mount | Available |
| Capability Mount | Mount | Available |
| Blueprint | Blueprint | Mounted |
| Harness | Mount | Mounted |
| Evidence | Evidence | Mounted |
| Settlement | Settle | Mounted |
| Tracker | Tracker | Mounted |
| Private Cloud | Private Cloud | Mounted (added 2026-10-08) |

This is the starting set. Use cases add more capabilities, each paired to a workspace.

## What the words mean

- **Mounted** means installed into this workspace (Marketplace discovers → Mount installs → Harness binds → Govern authorizes). It is **not** authority. The home screen's "Mounted Capabilities" section and the full catalog both list these on purpose.
- **Mount (workspace)** covers discovery, install, contracts and harness: binding a capability to a provider or adapter, with RepoGate verification.
- **Govern** is the plan policy check (GPC) plus CAPPO's fail-closed authorization decision.
- **Authority** covers identities, grants and revocation. Execution Identity (LockerPhycer) materializes scoped authority, caps and leases. "Authority does not create permissions; it materializes permissions already approved by governance."
- **Execute** is the governed, consequence-bearing run (CAPPO).
- **Evidence** is PGL/GnomLedger. **Measure** is VNP. **Settle** is x402. **Tracker** observes every stage for drift and is not an execution stage.
- **Private Cloud** is where governed workloads physically run: the COMPUTLESS owned-compute fabric. It is cross-cutting, next to Execute. The legacy `/os/governed-compute` redirects here.

## Honesty rules (binding)

- Never create health, trust, usage, evidence, settlement, provider or metric values in the frontend.
- A route response, health ping, manifest or configured URL is not proof. Only runtime evidence may show as Verified.
- Proof states: Verified / Live / Needs proof / Degraded / Not started / Manual step / Simulated.

## Known gaps between this design and the build (2026-10-08)

- **The built Mount page performs the CAPPO authority request.** By design, Mount installs and binds, and the bounded grant is Govern's decision, materialized in Authority. Fix this in the pages; do not reorder the spine.
- **The wiring plan predates the removal of BYOS.**
  - "/v1/exec is the only consequence-bearing route" and "BYOS executes" are out of date.
  - The proven consequence route is CAPPO's `/v1/capability/mounts/{id}/execute`, and LockerPhycer holds what BYOS did.
  - CAPPO remains the sole authority.
- See `veklom-m1p2/evidence/m1-p2/plan-vs-reality-2026-10-08.md` for the item-by-item audit.
