# Capability OS Architecture

Veklom operates on a strict multi-plane isolation architecture, ensuring execution is bound by verifiable, cryptographic authority.

## Planes of Operation

- **Public Plane:** Static marketing, documentation, and the Machine WebMCP surface. Edge-cached, zero-trust.
- **Application Plane (Capability OS):** Authenticated workspace for Operators to discover tools and construct governance blueprints.
- **Execution Plane (BYOS):** Sovereign baremetal enclaves executing bounded machine actions.
- **Ledger Plane (GnomLedger):** Append-only cryptographic Proof-of-Graph (PoG) lineage store.

## The Semantic Kill Switch (SEKED)

All inbound execution requests pass through a deterministic AST evaluator (RepoGate). If the semantic deviation index exceeds the threshold, execution is denied before a sandbox is ever allocated.

*Architecture diagrams and infrastructure graphs are currently sealed pending P5 full validation.*
