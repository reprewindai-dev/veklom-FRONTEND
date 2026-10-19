import type { TaskState } from "./task-types";

/**
 * Generates clean, executable Python SDK code corresponding to the task DAG.
 * Enforces the Veklom Continuity Doctrine:
 * Compilation produces Delta C = 0.
 * Consequence execution requires an explicit, single-use CAPPO lease.
 */
export function generateTaskPython(state: TaskState, workspace: string | null): string {
  const intent = state.intent || "Execute governed task";
  const ws = workspace || "workspace-default";
  const plan = state.plan;
  const contractId = plan?.planId || "contract-auto-generated";
  const canonicalHash = plan?.canonicalHash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  
  const step = plan?.steps[0];
  const action = step?.action || "task.execute";
  const targetRef = step?.operation?.target_ref || "target-system";
  const resource = step?.operation?.resource || "system-resource";
  const args = step?.operation?.arguments ? JSON.stringify(step.operation.arguments, null, 4) : "{}";

  return `"""
VEKLOM CAPABILITY OS — GENERATED PYTHON SCRIPT
Task: ${intent}
Contract: ${contractId}
Canonical Hash: ${canonicalHash}

LAW 0 GOVERNANCE NOTICE:
This script separates compilation from consequence authority.
Possession of this code does not grant consequence authority (Delta C = 0).
Execution consumes a single-use monotonic CAPPO capability lease.
"""

import sys
import veklom
from veklom.governance import (
    CapabilityLease,
    ConsequenceReceipt,
    VerificationProof,
)

def run():
    # 1. Initialize authenticated Veklom Client
    client = veklom.Client(
        workspace_id="${ws}",
        environment="playground",
    )

    # 2. Reference the compiled ABIDE contract
    contract = client.get_contract(
        contract_id="${contractId}",
        expected_hash="${canonicalHash}",
    )
    print(f"[+] Loaded verified contract: {contract.id}")

    # 3. Request Consequence Authority (Single-use CAPPO lease)
    # The authority engine evaluates workspace policy before minting
    lease = client.request_authority(
        contract=contract,
        action="${action}",
        target_ref="${targetRef}",
        resource="${resource}",
        ttl_seconds=300,
    )
    print(f"[+] Minted single-use lease: {lease.mount_id} (nonce={lease.nonce})")

    # 4. Governed Execution at the Physical Sink
    # Replay protection: Delta C occurs exactly once
    receipt = client.execute(
        lease=lease,
        arguments=${args},
    )

    # 5. Dual-State Cryptographic Receipt Verification
    print(f"[+] Execution completed: {receipt.decision}")
    print(f"[+] Receipt ID: {receipt.receipt_id}")
    print(f"[+] PGL Verification: {receipt.proof_hash}")
    return receipt

if __name__ == "__main__":
    run()
`;
}
