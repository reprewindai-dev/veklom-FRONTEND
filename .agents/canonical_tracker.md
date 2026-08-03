# Veklom Canonical Architecture Workspace Tracker

This document serves as the master checklist for implementing the entire canonical architecture exported from the `veklom-&-abide-sovereign-agentic-control-plane-workspace`.
Every item listed here corresponds directly to a cryptographic evidence file or definition within the canonical source of truth. Check these off as the systems are hardened and verified.

## Root Definitions
- [ ] `README.md`: Core invariant "ABIDE Proposes, CAPPO Disposes" implemented.
- [ ] `manifest.md`: Capability manifest integrated into the control-plane UI and registry.
- [ ] `registry.md`: Cryptographic registry keys and schema hashes validated against CAPPO.
- [ ] `work_orders.md`: Active packets integrated into execution flow.

## 00_workspace_manifest
- [ ] `canonical-blueprint.v1.json`: All high-level goals and domains modeled.
- [ ] `claim-classification.json`: Threat/claim classifications enforced in CAPPO.
- [ ] `constitution_manifest.json`: Root constitution loaded by ABIDE/CAPPO.
- [ ] `evidence-index.v1.json`: Evidence requirements enforced in PGL anchors.
- [ ] `governance_export_downstream_impact.json`: Graph mutation impacts checked.
- [ ] `governance_export_jurisdiction_overrides.json`: Multi-jurisdictional constraints supported.
- [ ] `governance_export_lineage.json`: Provenance lineage maintained in ABIDE.
- [ ] `governance_export_ownership_approval.json`: Approval routing implemented.
- [ ] `governance_export_promotion_rules.json`: Promotion Compiler implements strict deterministic maturity ladders.
- [ ] `plan-ir.v1.json`: ABIDE compiler targets this IR output.
- [ ] Cryptographic Signatures (`file-hashes.sha256`, `workspace-merkle-root.json`, `workspace-signature.sig`, `signer-certificate.json`): Execution blocked on invalid signatures.

## 09_agent_execution_pack
- [ ] `packet-001`: Einstein Prioritized Scheduler (`src/scheduler/einstein.rs` equivalent in backend).
- [ ] `packet-002`: X402Escrow.sol implementation or its backend counterpart logic.

## 12_checkpoint_pack
- [ ] `checkpoint-genesis.json`: State checkpoints persisted.
- [ ] `repository-authority.json`: Authority checks mapped.
- [ ] `unresolved-work.json`: Unresolved tasks block `PRODUCTION` state.
