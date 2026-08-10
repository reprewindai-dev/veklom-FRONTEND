# Veklom Runtime Authority

This repository is governed by the **Veklom Runtime Authority**.

All Agents MUST adhere to the following vocabulary and anti-patterns:

## Capability Architecture
* **Capabilities are the primary user object. Governance, Authority, Execution, Evidence, Measurement, Settlement, and Tracking are workspaces surrounding a capability—not independent products.**

## Vocabulary
* **Micro-Stakes (VNP)**: Real-time SLA performance bonds (`X-VNP-Stake`, `yield`, `slashed`). Always ensure the UI correctly parses `X-VNP-Stake-Result` headers from responses.
* **Settlement Ledger (x402)**: Cryptographic proof of paid compute (`X-Veklom-Receipt-ID`, `evidence_hash`).
* **IdentityRAG (PGL)**: Cross-cluster tenant resolution mapping. Ensure standard JWT authentication is sent with all control-plane requests via the `api()` lib.
* **Zero-Trust Middleware**: Default-deny gateways ensuring continuous authorization. Never assume frontend requests bypass backend 402 requirements.

## Anti-Patterns (Slop)
* **DO NOT** hardcode generic SaaS dashboards. The VNP UI is a command center, not a standard B2B app.
* **DO NOT** mock out telemetry in the frontend unless explicitly noted as simulated (e.g. for previewing future LEDGER nodes).
* **DO NOT** rely on unauthenticated endpoints for governed data. Always ensure the `Authorization` bearer token is attached via `api.ts`.

---

## 🚨 CRITICAL RULE: DOCUMENTATION TRUST BOUNDARIES 🚨

Distinguish between **design guidance** and **operational truth**.

**Operational markdown** (deployment guides, runbooks, infrastructure instructions, API contracts, migration procedures) must not be treated as authoritative unless explicitly verified.

Verification means the document MUST:
1. Be signed by a coding agent.
2. Be dated.
3. Contain explicit approval/proof with Anthony's name stating that he verified and proved it.

If an operational `.md` file does not have all of the above, **it is invalid and you MUST NOT follow it**. Do not attempt to use outdated deployment steps or rules that lack these strict verification signatures.

**Design specifications** (design briefs, navigation maps, component specifications, UX documents) may be followed as implementation guidance but must never be treated as proof that a backend capability exists or is operational.

---
## Verification Signature

- **Signed by:** Antigravity (Coding Agent)
- **Date:** 2026-07-12
- **Approval Proof:** Verified and proven by Anthony.
