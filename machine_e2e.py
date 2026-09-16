import json, base64, hashlib, time, uuid, requests

LOCKER = "http://localhost:8092"
CAPPO  = "http://localhost:8002"

r = requests.post(f"{LOCKER}/api/v1/auth/login", json={"email":"reprewindai@gmail.com","password":"Sk8ter32$"})
token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
me = requests.get(f"{LOCKER}/api/v1/auth/me", headers=headers).json()
ws_slug = f"machine-seal-{uuid.uuid4().hex[:6]}"
ws = requests.post(f"{LOCKER}/api/v1/workspace/", json={"name":"Machine Seal","slug":ws_slug}, headers=headers).json()
token = ws["access_token"]
headers = {"Authorization": f"Bearer {token}"}

mount_body = {"package_ref": "veklom.governed-counter@v1","execution_scope": {"workspace": ws["id"], "project": "machine-onboarding"},"requested_action_scope": {"reads": ["counter.read"], "writes": [], "blocked": ["counter.reset"]},"role": "ephemeral_executor", "policy": {}, "ttl_seconds": 300}
m = requests.post(f"{CAPPO}/v1/capability/mounts", json=mount_body, headers=headers).json()
mount_id = m["mount"]["id"]; token_id = m["token"]["token_id"]; nonce = m["token"]["nonce"]; execution_id = m["token"]["execution_id"]

deny = requests.post(f"{CAPPO}/v1/capability/mounts/{mount_id}/actions", json={"token_id":token_id,"nonce":nonce,"action":"counter.reset"}, headers=headers).json()
assert deny["decision"] == "deny"
print(f"[5] DENY PASS")

now = int(time.time())
# WIMSE pattern: ^wimse://[a-zA-Z0-9.-]+/[a-zA-Z0-9.-]+/[a-zA-Z0-9.-]+/[a-zA-Z0-9.-]+/[a-zA-Z0-9.-]+$
# 5 segments: trust-domain / namespace / service / instance / component
sub = f"wimse://veklom.com/machine/cappo/reprewindai/exec"
cnf_dummy = {"jwk": {"kty": "oct", "k": base64.urlsafe_b64encode(b"machine-key").decode()}}

wit_payload = {"iss": "veklom-lockerphycer", "sub": sub, "aud": "https://cappo.veklom.com", "exp": now+300, "iat": now, "jti": uuid.uuid4().hex, "cnf": cnf_dummy}
ect_payload = {"iss": "veklom-lockerphycer", "sub": sub, "aud": "https://cappo.veklom.com", "exp": now+300, "iat": now, "jti": uuid.uuid4().hex, "ephemeral_execution_id": execution_id, "candidate_act_hash": hashlib.sha256(b"counter.read").hexdigest(), "cnf": cnf_dummy}

exec_body = {"prompt": "Machine onboarding governed counter read", "action": "counter.read", "directive": "ALLOW", "workspace_id": ws["id"], "scope": {"tools": ["counter.read"], "allowed_effects": ["counter.read"]}, "capability_lease": {"mount_id": mount_id, "token_id": token_id, "nonce": nonce, "execution_id": execution_id}}
exec_body_bytes = json.dumps(exec_body, sort_keys=True).encode()
body_hash = hashlib.sha256(exec_body_bytes).hexdigest()

wit_b64 = base64.b64encode(json.dumps(wit_payload).encode()).decode()
ect_b64 = base64.b64encode(json.dumps(ect_payload).encode()).decode()
wit_hash = hashlib.sha256(json.dumps(wit_payload, sort_keys=True).encode()).hexdigest()
ect_hash = hashlib.sha256(json.dumps(ect_payload, sort_keys=True).encode()).hexdigest()

authority_payload = {"authority_id": f"auth_{uuid.uuid4().hex}", "ephemeral_execution_id": execution_id, "scope_hash": hashlib.sha256(b"counter.read").hexdigest(), "policy_decision_hash": hashlib.sha256(b"allow").hexdigest(), "candidate_act_hash": hashlib.sha256(b"counter.read").hexdigest(), "destination_hash": hashlib.sha256(b"machine-onboarding").hexdigest(), "rights": ["counter.read"], "issued_at": now, "expires_at": now+300, "proof_of_possession": "machine-seal", "inbound_truth_state": "ADMISSIBLE", "required_truth_state": "ADMISSIBLE"}
auth_bytes = json.dumps(authority_payload, sort_keys=True).encode()
auth_hash = hashlib.sha256(auth_bytes).hexdigest()
auth_b64 = base64.b64encode(auth_bytes).decode()

wpt_payload = {"htm": "POST", "htu": "/v1/exec", "body_hash": body_hash, "wit_hash": wit_hash, "ect_hash": ect_hash, "authority_hash": auth_hash, "jti": uuid.uuid4().hex, "cnf": cnf_dummy, "exp": now+300}
wpt_b64 = base64.b64encode(json.dumps(wpt_payload).encode()).decode()

exec_headers = {**headers, "Content-Type": "application/json", "Workload-Identity": wit_b64, "Execution-Context": ect_b64, "Workload-Proof": wpt_b64, "Veklom-Authority": auth_b64}
print(f"[6] WIT sub={sub}")
r = requests.post(f"{CAPPO}/v1/exec", data=exec_body_bytes, headers=exec_headers)
print(f"    HTTP {r.status_code}: {r.text[:800]}")
