# Veklom Conformance Matrix

The Capability OS enforces strict zero-trust principles across all operating planes. This matrix demonstrates alignment with foundational regulatory and security frameworks.

## Regulatory Alignment

| Framework | Status | Notes |
| :--- | :--- | :--- |
| **Quebec Law 25 (PII)** | <span className="text-theme-verified font-bold">ALIGNED</span> | Automated PII tagging prevents cross-border data egress; forces 100% local baremetal inference. |
| **PIPEDA** | <span className="text-theme-verified font-bold">ALIGNED</span> | Tamper-evident execution ledgers and strict sovereign controls protect Canadian citizen data. |
| **NIST AI RMF 1.0** | <span className="text-theme-verified font-bold">ALIGNED</span> | Meets the Measure, Manage, and Govern functions via deterministic RepoGate AST interception. |
| **EU AI Act / GDPR** | <span className="text-theme-warn font-bold">PARTIAL (EVAL)</span> | Currently indexing AI Transparency outputs and Proof-of-Graph (PoG) lineage for certification. |

## Technical Security Controls

| Control | Status | Evidence Reference |
| :--- | :--- | :--- |
| **Dynamic Execution Block** | <span className="text-theme-verified font-bold">ENFORCED</span> | `SEC-AST-001`: Rejects `eval()` and unbounded execution. |
| **Path Traversal Protection** | <span className="text-theme-verified font-bold">ENFORCED</span> | `SEC-AST-003`: Blocks host filesystem egress. |
| **Data Residency** | <span className="text-theme-verified font-bold">ENFORCED</span> | Multi-region BYOS deployments guarantee sovereign execution domains. |
| **Cryptographic Provenance** | <span className="text-theme-verified font-bold">ENFORCED</span> | Ed25519 payload signatures via LockerPhycer hardware enclave bounding. |

## Continuous Assurance

Veklom operates a **Fail-Closed by Default** policy. The Semantic Kill Switch (SEKED) intercepts all execution requests before they reach the runtime sandbox, proving authorized intent prior to compute allocation.

*Last Audited: Q3 2026*
