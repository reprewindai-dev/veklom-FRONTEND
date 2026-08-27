# Veklom Public Proof Bundle v0.1-proof

This bundle contains cryptographic evidence of a single governed execution consequence, demonstrating the Independent Authority Boundary invariant.

## Files
- `receipt.cose`: The signed execution consequence (RFC 8152 COSE Sign1 format).
- `public-key.pem`: The Ed25519 public key of the consequence kernel (CAPPO).
- `proof.json`: The Merkle inclusion proof tying this receipt to the local tree.
- `checkpoint.json`: The local tree state (unanchored).
- `veklom-verify.py`: A tiny standalone Python script to verify the evidence.

## Verification
Run `python veklom-verify.py` to cryptographically verify:
1. The COSE signature against the public key.
2. The Merkle inclusion of the exact signed bytes into the local tree root.

Reconciliation state is explicitly 'pending' as external global anchoring is not yet claimed in this slice.
