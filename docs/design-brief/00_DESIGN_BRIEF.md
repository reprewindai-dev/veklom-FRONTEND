# Veklom — Capability Operating System — Design Brief
 
## The one-sentence brief
 
> Build a completely new Veklom interface. Do **not** recreate any existing UI. Use the existing prototypes only as design references. The new product is a **Capability Operating System** where **capabilities are the primary user experience**, and governance, execution, evidence, settlement, telemetry, and security are **workspaces around** those capabilities — not separate products.
 
## What this package is
 
Reference material and rules for building the new interface — **not screens to copy**. It contains:
 
- `00_DESIGN_BRIEF.md` — this file (vision, mental model, home screen).
- `00_brand/veklom-logo.jpeg` — the official logo, required everywhere.
- `01_design_references/` — the 8 prototype screenshots, renamed by what to harvest from each.
- `02_NAVIGATION_MAP.md` — the unified shell + nav (capability-lifecycle spine).
- `03_COLOR_TYPE_COMPONENTS.md` — design-system rules (tokens, type, components, honesty chips).
- `04_DO_NOT_BUILD.md` — what NOT to recreate from the old prototypes.
- `05_API_CONTRACT_MAP.md` — mechanical `/api/v1` API contract (BYOS/CAPPO/Lockerphycer shared; PGL separate).
- `06_RUNTIME_ARCHITECTURE.md` — the runtime flow behind the workspaces (Intent → ABIDE → cAPI → Harness → GPC → CAPPO → Execution Identity → PGL → VNP → x402 → Tracker).
- `07_DOMAIN_RUNTIME_MAP.md` — where each service physically lives.
 
## Capability Identity
Every workspace operates on an explicit capability identity. Navigation between workspaces must preserve the selected capability context unless the operator intentionally changes it.
 
## Mental model
 
Not 8 products — **8 viewpoints of one runtime**. The whole interface is one machine action moving naturally through:
 
`Command → Plan → Capability → Governance → Authority → Execution → Settlement → Evidence → Tracking`
 
### The architecture shifted
 
- **Old:** Blueprint → Pipeline → Execution
- **New:** **Capability → Mount → Harness → Govern → Execute → Evidence → Settle**
 
Capabilities are the noun the user manipulates. Everything else is infrastructure that surrounds a capability.

### Workspace Responsibilities
- **Mount:** discovery, install, contracts, harness
- **Blueprint:** intent, planning, work graph
- **Govern:** policies, approvals, trust
- **Execute:** runtime, orchestration
- **Evidence:** signatures, hashes, replay
- **Measure:** observations only
- **Tracker:** drift
- **Authority:** identities, grants, revocation
- **Settle:** payment, x402, receipts

### Marketplace
Marketplace exists to discover, install, version, license, and mount governed capabilities into a workspace. It is not an app store for dashboards.

### Runtime Authority
The Capability Operating System is the user experience of the Veklom Runtime Authority. The Runtime Authority governs every capability from discovery through settlement and evidence.
 
## The home screen (capability-centric — not a dashboard)
 
```
──────────────────────────────
Search Capabilities
──────────────────────────────
Recently Used
⭐ RepoGate Scan ⭐ Build Blueprint ⭐ Security Audit
⭐ API Discovery ⭐ MCP Publish ⭐ Capability Mount
──────────────────────────────
Mounted Capabilities
Blueprint · Harness · Evidence · Settlement · Tracker
──────────────────────────────
```
 
Opening Veklom = searching, launching, and managing capabilities. It should feel like an operating system for capabilities, not a documentation site and not a metrics dashboard.
 
## How each reference maps into the new product
 
| Reference (do not copy) | Harvest | Becomes in the new shell |
|---|---|---|
| `ref-1-abide-blueprint-hero` | Giant hero typography ("Compile Messy Intent…"), clean minimal workspace, blueprint-compiler flow, structured planning | **Blueprint Studio** (under Capabilities) |
| `ref-2-repogate-verification` | Split screen, evidence panel, file matrix, terminal trace, dark industrial look, execution logs | **Capability Verification** |
| `ref-3-capi-enterprise-dashboard` | Top nav, architecture cards, clean spacing, prod/sandbox switch, requester identity, quick actions — **drop the "reading documentation" feel** | **Capability Registry / Harness / Discovery / Marketplace / Contracts** |
| `ref-4-uacp-quantum-launcher` | The 6-tile launcher (Intent/Skills/Sync/Probability/Ledger/x402) | **Expanded capability launcher**: Blueprint · Capabilities · Harnesses · Marketplace · Evidence · Settlement · Tracker · Terminal |
| `ref-5-pipeline-orchestration` | Actor → capability → intent → 9-phase trace → schema/blueprint JSON → evidence | **Execution** (the governed run surface) |
| `ref-6/7-interlink-governance` | Persistent left nav, compliance, quarantine, trust, policy, capability mesh, red/yellow/green | **Governance** |
| `ref-8-uacp-terminal` | The operator shell (NL directives, raw MCP/SYS_CALL traces, JSON, telemetry) — keep, just modernize | **Terminal** (always available, `Ctrl+``) |
 
## Honesty mandate (learned directly from the references)
 
The prototypes repeatedly present simulation/aspiration as verified fact. The new build must **not**:
 
- Show QPU / Quantum Zeno / fidelity ("99.91%"), uptime, or uplink telemetry as real. Every such signal carries a permanent chip: `SIMULATED` · `EMULATED` · `PHYSICAL HARDWARE VERIFIED`.
- Claim "100% TAMPER-PROOF-VERIFIED", "100% SHIELD-ENGAGED", "0.02MS latency", "GnomLedger Active / 100% First-Class" without live evidence. Use honest proof states: `Verified` / `Live` / `Needs proof` / `Degraded` / `Not started` / `Manual step` / `Simulated`.
- **Ever render a raw private key** (the Quantum wallet card does — never repeat this). Show key identifiers, permissions, caps, and leases only.
- Present a configured URL, a manifest, or a `/health` ping as operational proof. Only a real source-of-truth response or a passing contract handshake is `operationally_verified`.
