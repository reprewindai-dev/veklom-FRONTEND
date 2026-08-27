import os
import json
import hashlib
try:
    import cbor2
    from cryptography.hazmat.primitives.asymmetric import ed25519
    from cryptography.hazmat.primitives import serialization
except ImportError:
    print("Please install required dependencies: pip install cbor2 cryptography")
    exit(1)

def verify():
    print("Veklom P0 Evidence Verifier")
    print("---------------------------")
    
    # Load Public Key
    with open("public-key.pem", "rb") as f:
        pub_key = serialization.load_pem_public_key(f.read())
        
    # Load COSE Receipt
    with open("receipt.cose", "rb") as f:
        cose_bytes = f.read()
        
    parsed = cbor2.loads(cose_bytes)
    protected_header, unprotected_header, payload_cbor, signature = parsed
    
    # Verify Signature
    sig_structure = [
        "Signature1",
        protected_header,
        b"",
        payload_cbor
    ]
    to_sign = cbor2.dumps(sig_structure)
    
    try:
        pub_key.verify(signature, to_sign)
        print("[V] SIGNATURE_VALID=true")
    except Exception as e:
        print("[X] SIGNATURE_VALID=false")
        return
        
    payload = cbor2.loads(payload_cbor)
    print(f"    EXECUTION_ID={payload['execution_id']}")
    print(f"    ACTION={payload['action']}")
    print(f"    RESOURCE={payload['resource']}")
    
    # Verify Merkle Inclusion
    with open("proof.json", "r") as f:
        proof = json.load(f)
        
    with open("checkpoint.json", "r") as f:
        checkpoint = json.load(f)
        
    leaf_hash = hashlib.sha256(cose_bytes).hexdigest()
    if leaf_hash != proof["leaf_hash"]:
        print("[X] MERKLE_INCLUSION_VALID=false (Leaf hash mismatch)")
        return
        
    current_hash = leaf_hash
    for sibling in proof["siblings"]:
        current_hash = hashlib.sha256((current_hash + sibling).encode('utf-8')).hexdigest()
        
    if current_hash == checkpoint["root_hash"]:
        print("[V] MERKLE_INCLUSION_VALID=true")
    else:
        print("[X] MERKLE_INCLUSION_VALID=false (Root mismatch)")
        return
        
    print(f"[i] RECONCILIATION_STATUS={checkpoint['reconciliation_status']}")

if __name__ == "__main__":
    verify()
