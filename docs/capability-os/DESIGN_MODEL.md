# Design model: workspaces and capabilities (read before changing the OS)

Written 2026-10-08 from the owner's walk-through and the design sources:
- `docs/design-brief/00_DESIGN_BRIEF.md`
- `runtime-architecture.md`
- `api-contract-map.md`
- `navigation-map.md`
- `docs/superpowers/plans/2026-08-14-capability-os-runtime-wiring.md`

**The repeated names below are deliberate pairings, not duplicates.** In general, check identifiers, roles, destinations and carried context before treating any entry as a duplicate.

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

## One product, five separate questions

Veklom is **one product**. Every governed action answers five independent questions. Keep them separate in code, UI and docs. Never let one stand in for another.

| Question | Answer | Owner |
|---|---|---|
| **Mode:** playground or live? | Playground (try realistic scenarios without affecting live resources) or Live | Capability OS toggle; CAPPO enforces via `execution_scope.project = "sandbox"` |
| **Location:** where does it run? | Your machine, another owned machine (Private Cloud), or a cloud provider | COMPUTLESS placement |
| **Containment:** what can the running agent reach? | Locked in a box: network, files, credentials limited | LockerPhycer (execution containment) |
| **Authority:** what exact action may happen? | One bounded, single-use grant for one operation | CAPPO |
| **Evidence:** what actually happened? | Signed receipt plus independent readback | CAPPO receipt, PGL/GnomLedger |

## The three meanings of "sandbox" (do not mix them)

| Meaning | Purpose | Who sees it |
|---|---|---|
| **Customer playground** ("Switch to sandbox") | Try capabilities and scenarios and learn to trust the controls, without changing live resources. A product feature, not a test environment. | Customers |
| **Execution containment** (LockerPhycer) | Restrict an agent or workload while it runs. Applies in **both** playground and live; going live never removes containment. | Customers (as a guarantee) |
| **Deployment test copy** (staging/local/canary) | Test new versions of Veklom itself before release. Never customer-facing. | The Veklom team |

Rules:
- **Playground and live follow the same rules and the same code paths.** The playground is separated by data and scope, not by weaker checks. A capability behaves identically in both, except that playground never reaches live resources.
- **Playground must never change live state.** A target that cannot keep a separate playground copy must refuse playground actions (fail closed). It must never execute them against live data.
  - Found 2026-10-08: the arena record store has one dataset, so CAPPO must refuse sandbox consequences there (`target_has_no_sandbox`, cappo-backend branch `fix/sandbox-isolation`).
- **Containment is not a mode.** Never implement "live" by turning containment off.
- **A staging pass is not a customer-playground feature, and vice versa.**

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

## The Governed Consequence Machine (architecture reference)

The owner's architecture page is kept at [`architecture/governed-consequence-machine.html`](./architecture/governed-consequence-machine.html), saved from a temporary file on 2026-10-08 (sha256 `a074a650…d9e1`). Its central invariant: **computational possession does not imply current consequence authority.** The flow runs: compute proposes, authority permits now, the broker performs the mutation, the reality sink proves the result, and PGL records the evidence.

Where each box stands (2026-10-08):

| Box | Role | Built today |
|---|---|---|
| CAPPO | Current consequence authority | Live: bounded single-use grants and signed receipts. Atomic start claim (`45c4d05`, `3889c40`); not deployed. |
| VLink | Machine pairing and authority handoff | Production runs an older build without the lease routes; main has the wiring. |
| cAPI | Ingress and capability transport | Live; bypass routes closed (410). |
| LockerPhycer | Identity/session security and the external execution-security boundary | Identity is live. The containment "cell host" exists on main, marked UNVERIFIED. |
| Disposable Manifestation | Untrusted compute, no ambient credentials | Private Cloud worker (own-your-cloud): the workload runs with no network, a read-only root and limits; the worker holds no Docker socket (runner gate). Local only. |
| Host Broker | Revalidate target, JIT credential, mutate, revoke | Partial. HTTP targets redeem CAPPO permits themselves (arena pattern). No JIT-credential broker for customer systems yet. |
| Reality Sink (C) | Independently observable consequence | Arena record store (staging-proven, Run 004); result sink for compute jobs. |
| VirtualDB | State materialization; working set ≠ historical state | Repo on Google Drive (`G:\My Drive\virtualdb`). Not integrated. |
| GnomLedger / PGL | Tamper-evident evidence continuity | Live (older build); hash-chain verified. Signature verification is not yet proven. |

The page's guardrails are binding:
- PGL is tamper-evident, which does not mean storage finality.
- Do not claim sealed eBPF LockerPhycer enforcement without direct proof.
- Threat-analysis hooks are not an autonomous IDS.
- An implemented mechanism is not a runtime-sealed host maturity claim.

## One shell, not two (2026-10-10)

On 2026-10-09 a "Capability tools" navigation group (Registry, Marketplace, Harnesses, Contracts, Verification) and a Terminal route page were added. That made the OS read as two products: a lifecycle, and a parallel set of tool pages that re-did Mount's job. It is removed. The rule, from `CANONICAL_HANDOFF.md` §3-4 and the owner's walk-through: one shell; the primary navigation is exactly the lifecycle; a workspace is a place and a capability comes into it; the home page is the catalog; Terminal is an overlay opened from the shell control.

Where each former tool lives:
- Marketplace = the home catalog at `/os` (search, recently used, mounted, full catalog, signed beacons).
- Registry and Harnesses = inside Mount (Discover, Bind, Harness).
- Contracts = inside Blueprint.
- Verification (ledger event lookup, hash-chain verify) = inside Evidence. RepoGate has no routed endpoint yet.
- Wallet = inside Settle (payment).

Settings stays, as a plain settings page (owner's definition): account, your own model key, an API key for your software, the MCP connection, a simple webhook, enterprise integrations (Slack, Linear). Each section states what is live today; only account and the MCP connection are.
