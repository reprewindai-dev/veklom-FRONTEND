# Runtime HTTP, EEE, and VNP Conformance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the existing Veklom governed-runtime HTTP profile and produce independently verifiable execution evidence without adding an execution path or weakening CAPPO authority.

**Architecture:** Keep `POST /v1/exec` as CAPPO's sole public consequence boundary. cAPI remains MCP discovery only; its existing registration and heartbeat endpoints expose the live federation state. CAPPO verifies the HTTP profile before authorization, BYOS performs only authorized execution, PGL persists evidence, and VNP consumes attributable evidence rather than generating synthetic measurements.

**Tech Stack:** FastAPI/Python, Next.js/TypeScript cAPI, httpx, RFC 9421-compatible HTTP message signatures, JCS/RFC 8785, SHA-256, Ed25519, Coolify/Docker, PGL/Gnomledger.

## Global Constraints

- Do not introduce a second public consequence-bearing route.
- cAPI registration **and heartbeat** require the same registry bearer authentication in production; unauthenticated liveness extension is forbidden.
- Authentication, MCP discovery, valid message signatures, and x402 admission are never semantic authority.
- A CAPPO `403` is terminal: no provider discovery, route, or retry follows it.
- Failover changes attempts and provider binding only; it never widens the original authority envelope.
- Production evidence is attributable and durable; synthetic provider success or synthetic VNP telemetry is forbidden.
- Coolify owns deployment configuration and secrets; Git never carries secrets.

---

### Task 1: Keep live cAPI registration truthful

**Files:**
- Modify: `C:\Users\antho\.windsurf\cappo-backend\cappo_backend\services\capi_registration.py`
- Modify: `C:\Users\antho\.windsurf\gnomledger\backend\app\services\capi_registration.py`
- Modify: `C:\Users\antho\.windsurf\veklom-byos-backend-2\backend\core\services\capi_registration.py`
- Modify: `C:\Users\antho\.windsurf\lockerphycer\core\utils\capi_registration.py`
- Test: each repository's existing registration test module, or a new focused `test_capi_registration.py` beside the module.

**Interfaces:**
- Consumes: `POST /api/v1/registry/register` and `POST /api/v1/registry/heartbeat` on cAPI.
- Produces: a running task that re-registers after a missing record and refreshes each accepted registration before `CAPI_REGISTRY_TTL_MS` expires.

- [ ] **Step 1: Write failing tests**

```python
async def test_heartbeat_refreshes_an_existing_registration() -> None:
    transport = RecordingTransport(statuses=[201, 200])
    stop = asyncio.Event()
    task = asyncio.create_task(maintain_capi_registration(settings, stop, transport))
    await transport.wait_for_calls(2)
    stop.set()
    await task
    assert transport.paths == ["/api/v1/registry/register", "/api/v1/registry/heartbeat"]
```

- [ ] **Step 2: Run each focused test and verify it fails because the maintainer does not exist.**

- [ ] **Step 3: Implement the minimal maintainer**

```python
async def maintain_capi_registration(settings: Settings, stop: asyncio.Event) -> None:
    while not stop.is_set():
        registered = await register_with_capi(settings)
        if registered:
            await heartbeat_until_missing(settings, stop)
        else:
            await asyncio.sleep(RETRY_SECONDS)
```

The heartbeat must re-register only on `404`, must never log the bearer value, and must be cancelled in each FastAPI lifespan shutdown.

- [ ] **Step 3a: Close heartbeat authentication.**

Write a failing cAPI route test proving that a missing or wrong bearer token receives `401` and cannot extend `last_seen`; reuse the registration endpoint's production fail-closed environment semantics for heartbeat; then prove a valid bearer succeeds.

- [ ] **Step 4: Run the focused tests and each repository's relevant suite.**

- [ ] **Step 5: Commit each repository independently and deploy only through Coolify.**

### Task 2: Complete CAPPO HTTP message integrity before authority evaluation

**Files:**
- Modify: `C:\Users\antho\.windsurf\cappo-backend\cappo_backend\security\http_signatures.py`
- Modify: `C:\Users\antho\.windsurf\cappo-backend\cappo_backend\api\routers\exec_router.py`
- Test: `C:\Users\antho\.windsurf\cappo-backend\tests\test_http_signatures.py`
- Test: `C:\Users\antho\.windsurf\cappo-backend\tests\test_exec_protection.py`

**Interfaces:**
- Consumes: RFC 9421 `Signature-Input`/`Signature`, `Content-Digest`, request id, nonce, and issued-at data.
- Produces: a verified request context or a terminal pre-authority rejection.

- [ ] **Step 1: Write failing tests** for altered body/digest, invalid covered-component signature, expired message, and repeated nonce/idempotency key.
- [ ] **Step 2: Verify each test fails against the current implementation.**
- [ ] **Step 3: Implement canonical component verification and bounded replay storage.**
- [ ] **Step 4: Verify tests pass and prove the verifier runs before CAPPO/provider routing.**
- [ ] **Step 5: Commit and deploy through Coolify.**

### Task 3: Freeze the EEE-Core profile before emitting records

**Files:**
- Modify: `C:\Users\antho\Downloads\execution-evidence-envelope-v0.1.0 (1).md` only after the corrected text has passed an implementation-oriented review.
- Test: a schema and verifier fixture suite in the CAPPO/PGL implementation repository, added before the emitter.

**Interfaces:**
- Consumes: the current EEE draft and the hostile review `HR-001` through `HR-010`.
- Produces: an implementation freeze profile for `eee_version: "0.1.0"` with deterministic verification rules.

- [ ] **Step 1: Incorporate the eight mandatory hostile-review corrections.**

The frozen profile MUST: keep post-issuance validator and transparency attestations detached; use a verifier-local `{SHA-256, SHA-384}` allowlist; require `{name, version, build_hash}` enforcer provenance; treat unknown effect grammars as `VALID_WITH_UNRESOLVED_REFS`; resolve HTTPS issuer keys through `/.well-known/eee-keys` JWKS; state that envelopes are records and never authority grants; require decimal strings for fractional/monetary values; and reject unsupported versions with `UNSUPPORTED_VERSION`.

- [ ] **Step 2: Write failing fixtures** for each freeze-blocker and high-severity rule above.
- [ ] **Step 3: Verify the fixtures fail against the existing draft/implementation.**
- [ ] **Step 4: Implement the verifier behavior before the producer.**
- [ ] **Step 5: Commit the profile and verifier fixtures.**

### Task 4: Emit and verify EEE-Core records from actual terminal outcomes

**Files:**
- Modify: CAPPO execution/evidence service modules already writing PGL records.
- Modify: Gnomledger verification service only where an existing ledger verifier can expose a complete envelope record.
- Test: CAPPO and Gnomledger focused EEE schema, JCS hash, Ed25519 verification, and denied-outcome tests.

**Interfaces:**
- Consumes: an actual CAPPO decision, immutable request/input commitments, policy state, attempt records, and PGL event ids.
- Produces: one signed `eee_version: "0.1.0"` terminal envelope per actual semantic execution, including denial.

- [ ] **Step 1: Write failing tests** for denied envelope completeness, deterministic root reproduction, signature verification, and `actual_effects` subset enforcement.
- [ ] **Step 2: Verify failures.**
- [ ] **Step 3: Emit an EEE through the existing PGL evidence path; never create evidence for an ungated event.**
- [ ] **Step 4: Verify independent local and live PGL verification.**
- [ ] **Step 5: Commit, deploy, and record a production DENY envelope id and verifier result.**

### Task 5: Connect VNP as an evidence consumer

**Files:**
- Inspect and modify only existing Interlink/VNP services and routes that accept attributable external probe telemetry.
- Test: the existing VNP ingestion and evidence-binding tests.

**Interfaces:**
- Consumes: real external probe observations and completed PGL/EEE identifiers.
- Produces: observation records linked to evidence, explicitly marked unavailable when no attributable probe exists.

- [ ] **Step 1: Write a failing test** that rejects generated/synthetic local VNP telemetry and accepts an attributable probe record linked to a real evidence id.
- [ ] **Step 2: Verify failure.**
- [ ] **Step 3: Implement only the existing ingestion/binding contract.**
- [ ] **Step 4: Verify the test and live non-synthetic status behavior.**
- [ ] **Step 5: Commit and deploy through Coolify.**

### Task 6: Run the conformance proof matrix

**Files:**
- Modify: existing runtime integration test suite only; no fixture may simulate a production provider success.

- [ ] **Step 1: DENY** — submit an unauthorized signed request; assert `403`, zero provider attempts, and verified PGL/EEE evidence.
- [ ] **Step 2: FAILOVER** — use an authorized provider set where a genuine, signed Provider A `503` is observable; assert B is already authorized and all envelope fields except attempt/provider binding remain constant.
- [ ] **Step 3: PARTITION/FENCING** — use the existing fencing/partition runtime; prove a stale writer cannot mutate newer state and permitted offline-safe work remains bounded.
- [ ] **Step 4: REPLAY/AUDIENCE/INTEGRITY** — prove replay, cross-audience credentials, and altered signed/digested components are rejected before consequence.
- [ ] **Step 5: Verify live runtime outputs, PGL chain, EEE verifier results, cAPI registry freshness, and VNP attribution.**

## Self-review

- The plan preserves the sole public execution route and CAPPO final authority.
- It separates discovery freshness, message integrity, evidence, VNP, and conformance proof work into independently reviewable changes.
- It does not introduce a new protocol or synthetic proof path.
