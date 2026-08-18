# Execution Evidence Envelope (EEE)

**Status:** Frozen
**Version:** 0.1.0
**Date:** 2026-08-10
**Reference Implementation:** Veklom (CAPPO / Capability OS)
**Review lineage:** Frozen following hostile review `eee-v0.1.0-hostile-review`
(HR-001 through HR-014). Fixes applied per §12 Changelog.

---

## Abstract

The Execution Evidence Envelope (EEE) defines a portable, signed, independently
verifiable record of a single governed machine execution. An Envelope binds the
capability that was invoked, the authority under which it ran, the policy
decisions that governed it, its inputs, effects, outputs, and settlement into a
single tamper-evident artifact that any third party — an auditor, a trust-score
engine, a risk model, an identity provider, or a competing governance platform —
can verify without trusting the issuer.

Design principle: **Scores are opinions derived from evidence. This document
standardizes the evidence.**

EEE is issuer-neutral. Any enforcement boundary, agent runtime, orchestrator, or
policy engine MAY produce Envelopes. Any party MAY verify them.

---

## 1. Conformance

The key words "MUST", "MUST NOT", "SHOULD", and "MAY" are to be interpreted as
described in RFC 2119.

An implementation is **EEE-Core conformant** if it produces Envelopes satisfying
all MUST requirements in Sections 3–7 and passes the verification procedure in
§7. **EEE-Full conformant** implementations additionally satisfy Section 9
(chaining and transparency) and the `enforcer.build_hash` requirement in §3.1.

---

## 2. Design Goals

1. **Verify, don't trust.** An Envelope is verifiable from its own contents plus
   public key material. No call to the issuer's infrastructure is required for
   verification, though issuers MAY offer resolution endpoints.
2. **Capability-centric.** The subject of an Envelope is a *capability
   execution*, not an agent. Agents, workflows, models, cron jobs, and humans
   can all request executions; the Envelope is agnostic to what requested it.
3. **Deterministic.** Canonical serialization is fully specified; two
   verifiers computing the evidence root from the same Envelope MUST arrive at
   the same value.
4. **Composable.** Envelopes reference external authority artifacts (e.g., x401
   verification tokens, OAuth grants, SPIFFE SVIDs) by hash rather than
   redefining them.
5. **Records, not authority.** An Envelope is a record of a past decision. It
   is never an authorization artifact (§3.0).

---

## 3. Envelope Schema

### 3.0 Normative role of the Envelope

An Envelope is a **record of a past decision**, never an authorization
artifact. Relying systems MUST NOT accept an Envelope as authority for a new
execution. Authority flows only through `authority_chain`-type artifacts
(x401 tokens, capability grants, OAuth grants). Presenting a historical
Envelope as current authority is a known confusion attack and MUST be
rejected. *(HR-008)*

### 3.1 Identity of the Execution

| Field | Type | Description |
|---|---|---|
| `eee_version` | string | Spec version, e.g. `"0.1.0"`. Versioning rules in §11. |
| `execution_id` | string | Unique execution identifier. MUST be unique per issuer. RECOMMENDED: UUIDv7 or content-derived. |
| `idempotency_key` | string, optional | Deduplication key supplied at request time. See §3.1a. |
| `supersedes_execution_id` | string, optional | On a duplicate-suppression envelope, references the execution whose effects it suppressed. MUST NOT appear on an original execution's envelope. *(HR-011)* |
| `parent_execution_id` | string, optional | Set when this execution was spawned by another governed execution (delegation chains). |
| `issuer` | string | Identifier of the enforcing system (HTTPS identifier or DID). Key discovery per §6.2. |
| `enforcer` | object | **REQUIRED.** The enforcement software that produced this Envelope: `{ "name": string, "version": string, "build_hash": string }`. `build_hash` is a hash of the enforcer's canonical build artifact or source commit; REQUIRED for EEE-Full, RECOMMENDED for EEE-Core. *(HR-003)* |

### 3.1a Idempotency semantics

Exactly one envelope per `idempotency_key` may carry `status: "completed"`.
Envelopes for suppressed duplicate submissions MUST set
`supersedes_execution_id`, MUST include a `policy_decisions[]` entry with
reason_code `IDEMPOTENT_SUPPRESSION`, and MUST NOT repeat the suppressed
effects in `actual_effects`. *(HR-011)*

### 3.2 Participants

| Field | Type | Description |
|---|---|---|
| `participant_identity` | object | The machine identity that requested execution: `scheme` (e.g. `"entra-agent-id"`, `"spiffe"`, `"did"`, `"x509"`) and `identifier`, plus scheme-specific claims. |
| `principal` | object | The accountable human or organization on whose behalf the participant acted. The issuer MUST keep `principal` consistent with any delegation proof in `authority_chain`. Verifier obligations in §7 step 5a. *(HR-014)* |
| `operator` | object, optional | The operating organization if distinct from `principal`. |

### 3.3 Capability

| Field | Type | Description |
|---|---|---|
| `capability_id` | string | Stable identifier of the invoked capability, e.g. `"commerce.purchase"`. |
| `capability_hash` | string | Hash of the canonical capability contract in effect (§5). Binds the Envelope to the *exact* capability definition, including argument constraints. |
| `capability_attenuation` | object | The attenuated grant applied: `resource_allowlist`, `argument_constraints`, `spend_ceiling`, `rate_limits`, `delegation_depth`, `delegation_depth_max`. |
| `runtime_lineage` | object | `model`, `model_version`, `framework`, `framework_version`, `config_hash`. Mid-run changes MUST close this Envelope and open a new one (§9.3). |

### 3.4 Authority

| Field | Type | Description |
|---|---|---|
| `authority_chain` | array | Ordered delegation artifacts, each: `{ "type": "x401-token" \| "oauth-grant" \| "capability-grant" \| "internal-mandate", "artifact_hash": string, "issuer": string, "granted_at": timestamp, "expires_at": timestamp }`. The chain MUST be complete from principal to participant. |
| `authority_window` | object | `not_before`, `not_after`. Execution outside this window MUST have been denied. |
| `revocation_check` | object | `method`, `checked_at`, `result`. `method: "none"` is permitted ONLY when every `authority_chain` artifact is non-revocable by construction (e.g., expired single-use mandates). Verifiers MUST report `method: "none"` as the distinct downgrade signal `REVOCATION_NOT_CHECKED` — never silently as VALID. *(HR-006)* |

### 3.5 Policy

| Field | Type | Description |
|---|---|---|
| `policy_bundle_id` | string | Identifier of the policy bundle evaluated. |
| `policy_hash` | string | Hash of the canonical policy bundle. Binds the Envelope to the *exact* policy version. |
| `policy_decisions` | array | Each: `{ "gate": string, "rule_id": string, "decision": "allow" \| "deny", "evaluated_at": timestamp, "latency_ms": integer, "reason_code": string }`. Every gate evaluated MUST appear, in evaluation order. |
| `enforcement_mode` | string | `"fail-closed"` or `"fail-open"`. `"fail-open"` Envelopes MUST set `violations[].code = "DEGRADED_ENFORCEMENT"`. System-level conformance claims MUST be computed exclusively over `fail-closed` Envelopes; `fail-open` Envelopes are evidence *of degradation*, not of governance (§7 step 10). *(HR-007)* |

### 3.6 Execution

| Field | Type | Description |
|---|---|---|
| `input_commitment` | string | Hash of canonical inputs. Raw inputs MAY be omitted for confidentiality; the commitment is REQUIRED. |
| `effect_grammar` | string, optional | Identifier of the effect declaration grammar used in `allowed_effects` / `actual_effects` (e.g., `"EEE-EFFECTS-1"`, `"veklom-effects-2026-08"`). Absent = implementation-private grammar. *(HR-004)* |
| `allowed_effects` | array of strings | Effect declarations granted by the capability. |
| `actual_effects` | array of strings | Effects observed during execution. Subset-checking rules in §7 step 6. |
| `tool_actions` | array | Each: `{ "tool": string, "action_hash": string, "decision": string, "evidence_ref": string, optional }`. |
| `budget` | object | `granted` and `consumed`, each with `tokens`, `cost`, `wall_clock_ms`, `tool_calls`, as applicable. Monetary/fractional values MUST be decimal strings (§5.1a). |
| `started_at` / `ended_at` | timestamp | Execution bounds. |
| `output_commitment` | string | Hash of canonical outputs. |
| `status` | string | `"completed"`, `"denied"`, `"violated"`, `"expired"`, `"revoked"`, `"error"`. |

### 3.7 Settlement (OPTIONAL)

| Field | Type | Description |
|---|---|---|
| `settlement` | object | `scheme` (e.g. `"x402"`, `"stripe"`, `"base:onchain"`), `amount` (**decimal string**, §5.1a), `currency`, `counterparty`, `transaction_ref`, `settled_at`. Payment replays MUST be detectable via `transaction_ref` uniqueness per issuer. |

### 3.8 Integrity

| Field | Type | Description |
|---|---|---|
| `violations` | array | Each: `{ "code": string, "detail": string, "detected_at": timestamp }`. Empty for clean executions. |
| `validators` | array of strings | Hashes of detached validator attestations known **at issuance time** (typically empty). Attestations are detached documents and MUST NOT be embedded (§8). *(HR-001)* |
| `envelope_hash` | string | Evidence root over all preceding members (§5). |
| `previous_envelope_hash` | string, optional | Links to the prior Envelope from this issuer (§9). |
| `signatures` | array | Each: `{ "signer": string, "kid": string, "scheme": string, "value": string, "signed_at": timestamp }`. At least one issuer signature is REQUIRED. |
| `timestamps` | object | `issued_at`. RFC 3161 attestations MAY be included. |

---

## 4. Timestamps

All timestamps MUST be RFC 3339 / ISO 8601 UTC with millisecond precision.
Issuer clocks SHOULD be synchronized (NTP/PTP). Verifiers MUST reject
Envelopes where `ended_at < started_at`. Verifiers MUST apply a tolerance
(RECOMMENDED 250 ms) to boundary comparisons between `evaluated_at` and
[`started_at`, `ended_at`], and MUST report tolerance use in verification
output. *(HR-013)*

---

## 5. Canonicalization, Hashing, Evidence Root

### 5.1 Canonicalization

The Envelope MUST be serialized using JSON Canonicalization Scheme (JCS,
RFC 8785) before hashing.

### 5.1a Deterministic numbers

Monetary amounts, budgets, and any quantity with fractional semantics MUST be
encoded as **decimal strings** (e.g., `"250.00"`), never JSON numbers. JSON
numbers are permitted only for integers (counts, `latency_ms`,
`delegation_depth`). This guarantees byte-identical canonicalization across
producer languages. *(HR-009)*

### 5.2 Hash algorithm policy

Verifier hash-algorithm support is a **local allowlist**, never negotiated
with the Envelope. For EEE 0.1.x the allowlist is exactly {`SHA-256`,
`SHA-384`}. An Envelope with no `hash_alg` member defaults to SHA-256. An
Envelope declaring any other algorithm is INVALID. Future spec versions extend
the verifier allowlist; Envelopes never negotiate. *(HR-002)*

### 5.3 Evidence root

`envelope_hash` = hash over the JCS serialization of the Envelope with
`envelope_hash` and `signatures` members removed. (`previous_envelope_hash`
and `validators` are stable issuance-time values and remain inside the hash;
post-issuance attestations are detached per §8 and never alter the Envelope.)
*(HR-001)*

`capability_hash` and `policy_hash` MUST be computed over the JCS
canonicalization of the referenced contract/bundle documents.

### 5.4 Signatures

Signatures are computed over `envelope_hash`. RECOMMENDED schemes: Ed25519,
ES256. JWS compact serialization is permitted as the `value` encoding. Each
signature MUST carry a `kid` resolving via §6.2.

---

## 6. Issuer Requirements

An EEE issuer (enforcement boundary) MUST:

1. Produce exactly one terminal Envelope per execution attempt, including
   attempts that are denied. **A denial without an Envelope is a spec
   violation** — denials are first-class evidence.
2. Sign every Envelope with a key whose public counterpart is discoverable per
   §6.2.
3. Set `enforcement_mode` honestly. A boundary that failed open MUST say so.
4. Never mint an Envelope for an execution it did not actually gate.

### 6.2 Key discovery *(HR-005)*

- **HTTPS issuers:** the key set MUST be published as a JWKS at
  `<issuer>/.well-known/eee-keys`.
- **DID issuers:** keys MUST appear in the DID document's
  `verificationMethod`.
- Verifiers MUST implement both methods.
- Keys are identified by `kid`. Retired keys MUST remain published for the
  issuer's stated retention window (RECOMMENDED ≥ 400 days) so historical
  Envelopes remain verifiable.

---

## 7. Verification Procedure

A verifier MUST:

1. Parse the Envelope and check required members (§3), including `enforcer`.
2. Check `eee_version` against implemented versions (§11). Unimplemented
   version → report `UNSUPPORTED_VERSION` (distinct from INVALID). *(HR-010)*
3. Check `hash_alg` against the local allowlist (§5.2). *(HR-002)*
4. Recompute `envelope_hash` per §5.3 and compare.
5. Resolve the issuer's public key via §6.2 using `kid` and validate at least
   one signature in `signatures`.
6. Check `authority_window` containment and every `authority_chain[]`
   `expires_at` against `started_at` (tolerance per §4).
   - **5a.** Where `authority_chain` references external artifacts: verify
     `artifact_hash` against the artifact if available. If the verifier
     implements the artifact's format, it SHOULD verify principal consistency
     (§3.2); if not, it MUST report the link UNRESOLVED rather than skipping
     silently. *(HR-014)*
7. **Effects:** if `effect_grammar` is present and implemented by the
   verifier, check `actual_effects ⊆ allowed_effects`. If absent or
   unimplemented, report `VALID_WITH_UNRESOLVED_REFS` with reason
   `EFFECT_GRAMMAR_UNKNOWN`. *(HR-004)*
8. Check `budget.consumed ≤ budget.granted` per dimension.
9. Check gate coverage: every decision in `policy_decisions` references rules
   present in the bundle identified by `policy_hash`, if the bundle is
   available.
10. Report `enforcement_mode` for every envelope. Verifiers aggregating
    across envelopes MUST report the mode distribution; conformance claims
    MUST be computed exclusively over `fail-closed` envelopes. *(HR-007)*
11. Report `revocation_check.method: "none"` as `REVOCATION_NOT_CHECKED`.
    *(HR-006)*
12. Report a verdict: `VALID`, `VALID_WITH_UNRESOLVED_REFS`, or `INVALID`,
    with machine-readable reasons, plus the `enforcer` identity. *(HR-003)*

Verification MUST NOT require network calls to the issuer beyond one-time key
discovery (§6.2). Reference artifacts MAY be fetched from any mirror;
integrity is guaranteed by their hashes.

---

## 8. Validator Attestations (Detached) *(HR-001)*

1. A validator attestation is a **separate signed document**:
   `{ "attests": "<envelope_hash>", "validator": string, "attestation":
   object, "signature": object, "attested_at": timestamp }`.
2. Attestations reference the Envelope by `envelope_hash` and MUST NOT modify
   the Envelope. The Envelope's `validators` member lists only attestation
   hashes known at issuance time (typically empty).
3. Post-issuance attestations therefore never invalidate §5.3 recomputation.
4. Transparency-log anchors (§9.2) follow the same detached pattern.

---

## 9. Chaining and Transparency (EEE-Full)

1. Issuers SHOULD chain Envelopes via `previous_envelope_hash`, producing an
   append-only, tamper-evident per-issuer log.
2. Issuers MAY anchor `envelope_hash` values into an external transparency
   log; anchors are detached attestations per §8.
3. Mid-run changes (model swap, config change, re-delegation) MUST close the
   current Envelope with `status` reflecting the change and open a new
   Envelope whose `parent_execution_id` references it.

---

## 10. Interoperability

EEE is designed to sit *below* scoring, identity, and payment systems:

- **x401.** An x401 verification token referenced in `authority_chain` proves
  who authorized the execution; the Envelope proves what the enforcement
  boundary did with that mandate. x401 answers "who stands behind the agent";
  EEE answers "what actually happened."
- **x402 / payment schemes.** Settlement records attach in §3.7 with replay
  detection via `transaction_ref`.
- **Microsoft Entra Agent ID.** An Entra agent identity is one
  `participant_identity.scheme`. Entra governs identity inside its
  authorization plane; EEE records execution evidence across heterogeneous
  runtimes and credentials, including those outside any directory boundary.
- **Trust scores.** A score engine (e.g., Prove7's six-dimension Agent Trust
  Score, a customer's proprietary risk model, or an arena ranking) is an
  Envelope *consumer*. EEE takes no position on scoring methodology; it
  standardizes the evidence from which any score can be computed and audited.
- **ERC-8004 / on-chain registries.** Envelope roots MAY be anchored
  on-chain; EEE itself is chain-agnostic.

---

## 11. Versioning *(HR-010)*

1. **Pre-1.0:** minor versions MAY break compatibility. Verifiers MUST reject
   Envelopes with unimplemented `eee_version` values and report
   `UNSUPPORTED_VERSION` — never silently misinterpret them.
2. **Post-1.0:** minor versions are additive; major versions may break.
   Envelopes remain verifiable under the rules of their own version forever.
3. Verifiers SHOULD retain support for all prior minor versions within a
   major line.

---

## 12. Changelog

**0.1.0 Frozen (2026-08-10)** — respun from same-day draft following hostile
review (`eee-v0.1.0-hostile-review.md`):

| Fix | Change |
|---|---|
| HR-001 | Validator attestations made detached (§3.8, §5.3, new §8); post-issuance attestation can no longer invalidate `envelope_hash`. |
| HR-002 | Hash algorithm agility replaced with verifier-local allowlist (§5.2); downgrade channel closed. |
| HR-003 | `enforcer` provenance member added (§3.1); REQUIRED for EEE-Full via `build_hash`. |
| HR-004 | `effect_grammar` member added; subset check made conditional (§3.6, §7 step 7). Mandatory grammar deferred to 0.2.0 pending VCGB usage data. |
| HR-005 | Key discovery pinned: JWKS at `/.well-known/eee-keys` or DID `verificationMethod`; `kid` rollover + retention (§6.2). |
| HR-006 | `revocation_check.method: "none"` restricted; `REVOCATION_NOT_CHECKED` downgrade signal (§3.4, §7 step 11). |
| HR-007 | Fail-open envelopes excluded from system-level conformance claims; mode distribution reporting (§3.5, §7 step 10). |
| HR-008 | Envelopes normatively declared records, never authorization (§3.0). |
| HR-009 | Decimal-string requirement for money/budgets (§5.1a). |
| HR-010 | Versioning policy added (§11). |
| HR-011 | `supersedes_execution_id` + idempotency semantics (§3.1, §3.1a). |
| HR-013 | Clock-skew tolerance with reporting (§4). |
| HR-014 | Principal-consistency verifier obligation clarified (§3.2, §7 step 5a). |
| HR-012 | **Deferred to 0.2.0** — content-addressed archival of referenced artifacts. |

---

## 13. Security Considerations

1. **Confidentiality.** Raw inputs/outputs are excluded by default; only
   commitments are REQUIRED. Deployments needing full disclosure MAY include
   encrypted payloads referenced by hash.
2. **Forgery.** Without a valid issuer signature over a recomputed
   `envelope_hash`, an Envelope is inert.
3. **Downgrade.** Envelope-declared algorithms are never honored outside the
   verifier's local allowlist (§5.2).
4. **Confusion.** Envelopes are records, never authority (§3.0).
5. **Omission attacks.** An issuer that selectively omits Envelopes can be
   detected by gap analysis over `previous_envelope_hash` chains and by
   comparing Envelope sequences against settlement records.
6. **Replay.** `execution_id` uniqueness per issuer plus `transaction_ref`
   uniqueness for settlement provide replay detection. Verifiers SHOULD track
   seen `envelope_hash` values.
7. **Honesty of self-report.** EEE cannot force an issuer to record its own
   violations. It makes omission *detectable* (via chains, budgets, and
   effect-set cross-checks) and forgery *impossible*. Detached validator
   attestations (§8) and transparency anchoring (§9) raise the cost of
   dishonesty.
8. **Degradation laundering.** Fail-open operation is detectable per
   envelope and excluded from conformance claims (§3.5, §7 step 10).
   Unchecked revocation is surfaced as a distinct downgrade signal (§3.4).

---

## Appendix A. Minimal Example (abridged)

The canonical "agent tries $251 against a $250 x401 mandate" case:
**DENY, with the denial itself as signed, verifiable evidence.**

```json
{
  "eee_version": "0.1.0",
  "execution_id": "018f3c2a-7b1e-7c4d-9e2f-1a2b3c4d5e6f",
  "issuer": "https://enforcer.veklom.example",
  "enforcer": { "name": "cappo", "version": "0.9.2", "build_hash": "sha256:31f7..." },
  "participant_identity": { "scheme": "entra-agent-id", "identifier": "purchasing-agent-17" },
  "principal": { "scheme": "x401-credential", "identifier": "did:example:acme-procurement" },
  "capability_id": "commerce.purchase",
  "capability_hash": "sha256:9f2c...",
  "capability_attenuation": {
    "resource_allowlist": ["example.com"],
    "spend_ceiling": "250.00",
    "delegation_depth": 0,
    "delegation_depth_max": 0
  },
  "authority_chain": [
    {
      "type": "x401-token",
      "artifact_hash": "sha256:41ab...",
      "issuer": "https://proof.example",
      "granted_at": "2026-08-10T16:12:00.000Z",
      "expires_at": "2026-08-10T17:00:00.000Z"
    }
  ],
  "authority_window": {
    "not_before": "2026-08-10T16:12:00.000Z",
    "not_after": "2026-08-10T17:00:00.000Z"
  },
  "revocation_check": { "method": "x401-revalidation", "checked_at": "2026-08-10T16:31:04.105Z", "result": "not_revoked" },
  "policy_bundle_id": "veklom-base-policies",
  "policy_hash": "sha256:77de...",
  "policy_decisions": [
    { "gate": "authority", "rule_id": "auth.window", "decision": "allow", "evaluated_at": "2026-08-10T16:31:04.112Z", "latency_ms": 3, "reason_code": "WITHIN_WINDOW" },
    { "gate": "capability", "rule_id": "cap.attenuation.spend", "decision": "deny", "evaluated_at": "2026-08-10T16:31:04.118Z", "latency_ms": 4, "reason_code": "AUTHORITY_CONSTRAINT_EXCEEDED" }
  ],
  "enforcement_mode": "fail-closed",
  "input_commitment": "sha256:bc91...",
  "effect_grammar": "EEE-EFFECTS-1",
  "allowed_effects": ["payment:max:250.00:USD", "network:example.com:443"],
  "actual_effects": [],
  "budget": { "granted": { "cost": "250.00" }, "consumed": { "cost": "0.00" } },
  "started_at": "2026-08-10T16:31:04.100Z",
  "ended_at": "2026-08-10T16:31:04.125Z",
  "output_commitment": "sha256:0000...",
  "status": "denied",
  "violations": [],
  "validators": [],
  "envelope_hash": "sha256:5e88...",
  "previous_envelope_hash": "sha256:12cd...",
  "signatures": [
    { "signer": "https://enforcer.veklom.example", "kid": "key-2026-08", "scheme": "Ed25519", "value": "4uQw...", "signed_at": "2026-08-10T16:31:04.130Z" }
  ],
  "timestamps": { "issued_at": "2026-08-10T16:31:04.130Z" }
}
```

---

*EEE v0.1.0 — Frozen. Adversarial review produced 14 issues; 13 fixes are
visible in §12 with their HR-IDs. The specification is issuer-neutral; any
enforcement boundary may produce Envelopes, and any party may verify them.*
