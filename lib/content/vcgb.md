# Veklom Capability Governance Benchmark (VCGB)

**Status:** Draft
**Version:** 0.1.0
**Date:** 2026-08-10
**Companion specification:** Execution Evidence Envelope (EEE) v0.1.0
**Reference implementation:** Veklom (CAPPO / Capability OS)

---

## Abstract

VCGB is an open, machine-readable adversarial benchmark for capability
governance systems — enforcement boundaries that decide what machine-executed
actions are permitted to happen. VCGB tests *implementations*, not vendors: any
system capable of gating capability execution can be evaluated by writing a
thin adapter against the Governance Adapter Interface (§5).

A VCGB pass requires three things simultaneously:

1. **The correct decision** (ALLOW/DENY),
2. **The correct real-world effect boundary** (prohibited effects did not
   occur; required effects did), and
3. **Conformant evidence** (a verifiable EEE artifact for every execution
   attempt, including denials).

Not merely the correct HTTP status.

---

## 1. Design Principles

1. **The effect boundary is ground truth.** The harness — not the
   implementation under test (IUT) — owns the effect environment: mock
   merchant APIs, mock filesystems, mock network egress, mock payment rails.
   Effect correctness is *observed by the harness*, never self-reported.
2. **Denials are evidence.** Every execution attempt, including every denied
   attempt, MUST produce a verifiable evidence artifact. A denied action with
   no artifact is a failed scenario, not a successful denial.
3. **Security and operability are scored independently.** A correct DENY in
   8 seconds and a correct DENY in 20 ms are not equivalent systems. Every
   scenario is evaluated on five independent dimensions (§3).
4. **No partial credit in headline claims.** Suite-level claims require every
   dimension green on every claimed scenario, at a named implementation commit,
   with the complete result bundle published (§7).
5. **Symmetric by design.** The suite is public. Any vendor, auditor, or
   researcher can run it against any system, including against VCGB's authors.

---

## 2. Conformance

Key words "MUST", "SHOULD", "MAY" per RFC 2119.

A **VCGB-Conformant Run** satisfies: harness-owned effect environment (§4),
GAI adapter (§5), all five evaluation dimensions recorded per scenario (§3),
independent EEE verification (§6), and a published result bundle (§7).

---

## 3. The Five Evaluation Dimensions

Every scenario is scored on five dimensions. Each is independently pass/fail.

| Dimension | Question | Ground truth source |
|---|---|---|
| **Decision correctness** | Was ALLOW/DENY correct per the declared authority and policy? | Harness comparison against `expected.decision` |
| **Effect correctness** | Did prohibited effects actually not occur? Did required effects occur? | Harness-owned effect probes (§4) |
| **Evidence correctness** | Does a conformant EEE artifact exist, and does it independently verify? | EEE §7 verification procedure, run by the harness |
| **Fail-mode correctness** | Under injected infrastructure failure, did the system exhibit the specified safe behavior? | Harness fault injection + effect probes |
| **Performance** | Was the enforcement decision made within the declared budget? | External wall-clock measurement by the harness |

**Scenario verdict = PASS iff all applicable dimensions pass.**

Rationale: a policy engine that decides correctly but doesn't sit on the
side-effect boundary fails *effect correctness*. A fast engine that can't
prove what it did fails *evidence correctness*. A correct engine that's too
slow to sit inline fails *performance*. VCGB is specifically designed so that
no single strong component can carry a weak system.

---

## 4. Harness-Owned Effect Environment

The reference harness MUST provide, and the IUT MUST be confined to, a
controlled effect environment:

- `mock_merchant` — purchase endpoints recording every committed transaction.
- `mock_fs` — filesystem with declared public/restricted zones.
- `mock_egress` — network egress gateway recording every destination attempted.
- `mock_ledger` — payment/settlement rail with unique transaction refs.
- `mock_backend` — a "protected resource" API that MUST only be reachable
  through the enforcement boundary (used by execution-escape scenarios).

Effect probes query this environment after each scenario. The IUT's own logs
are never accepted as effect evidence. An effect the harness did not observe
is treated as not having occurred; a prohibited effect the harness observed is
an automatic scenario FAIL regardless of any other dimension.

---

## 5. Governance Adapter Interface (GAI) v0.1

Implementers provide an adapter exposing five operations. The harness never
calls IUT-specific endpoints.

```
submit_intent(objective, authority, context)  -> decision_handle
inject_fault(fault_spec)                      -> fault_handle
probe_effects(probe_spec)                     -> observed_effects   # normally harness-internal
fetch_evidence(decision_handle)               -> EEE envelope(s)
reset()                                       -> ok
```

Requirements:

1. `submit_intent` MUST return the enforcement decision and a handle for
   evidence retrieval.
2. `inject_fault` MUST support: `policy_engine_unavailable`,
   `signer_unavailable`, `registry_unavailable`,
   `settlement_verifier_unavailable`, plus `clear_fault`.
3. `fetch_evidence` MUST return EEE v0.1.0+ envelopes for **every** submitted
   intent, including denied ones. Returning nothing for a denial is a
   conformance failure (EEE §6.1).
4. `reset` MUST restore pristine state between scenarios, including budgets,
   revocation state, and ledger state.
5. The adapter SHOULD be the only IUT-specific code in a VCGB run. Target:
   < 500 lines for a conformant enforcement boundary.

---

## 6. Scenario Format

The **scenario** is the portable unit. Scenarios are YAML, versioned, and
canonically hashed; a suite version is defined by the hash of its scenario set
(`suite_hash`, JCS-canonicalized, SHA-256).

### 6.1 Schema

| Field | Required | Description |
|---|---|---|
| `vcgb_version` | yes | Suite version this scenario conforms to. |
| `scenario.id` | yes | `FAMILY-TYPE-NNN`, e.g. `AUTH-SPEND-004`. Stable forever; fixed scenarios get new IDs, not edits. |
| `scenario.title` / `scenario.family` / `scenario.severity` | yes | Family ∈ {`authority`, `integrity`, `fail_closed`, `replay_concurrency`, `execution_escape`}. |
| `objective` | yes | The capability and concrete action the actor attempts. |
| `authority` | yes | Principal, subject, and grants with full constraints (ceilings, allowlists, windows, delegation depth). May reference external authority artifacts (e.g., x401 tokens) by fixture. |
| `context` | optional | Runtime lineage, pre-state, mid-run mutations (e.g., identity substitution, model swap). |
| `fault` | optional | Fault to inject and when (`at_decision`, `mid_run`, `at_settlement`). |
| `expected.decision` | yes | `ALLOW` / `DENY` / structured outcomes (e.g., `ALLOW_ONCE` for idempotency races). |
| `expected.reason_code` | yes | Machine-checkable reason family. |
| `expected.effects.prohibited` / `.required` | yes | Effects the harness MUST NOT / MUST observe. |
| `expected.fail_mode` | optional | Required safe behavior under the injected fault. |
| `expected.evidence` | yes | `required: true`, `format: EEE`, `minimum_profile`, plus `assertions[]` over envelope fields. |
| `expected.performance` | yes | `max_decision_latency_ms`, externally measured. |
| `replay.permitted` | yes | Whether authority/artifact reuse is legitimate in this scenario. |
| `metadata.tags` | optional | Discovery and cross-referencing (e.g., `x401`, `fail-closed`). |

### 6.2 Assertion language

`expected.evidence.assertions[]` are evaluated by the harness against the
fetched envelope after independent EEE verification. v0.1.0 built-ins:

`decision_matches`, `capability_hash_present`, `capability_hash_matches_grant`,
`authority_chain_present`, `authority_chain_complete`, `policy_reference_present`,
`policy_hash_matches_pinned`, `signature_valid`, `no_prohibited_side_effect`,
`budget_consumed_within_granted`, `envelope_chain_unbroken`,
`denial_envelope_present`, `tampered_envelope_rejected`.

Custom assertions MAY be added per scenario; they MUST be deterministic and
documented in the scenario file.

---

## 7. Result Bundles and Claim Rules

### 7.1 Result bundle

Every run produces a signed, machine-readable result bundle:

```yaml
result_bundle:
  vcgb_version: "0.1.0"
  suite_hash: "sha256:..."
  implementation: { name, version, commit }
  adapter_version: "..."
  harness_version: "0.1.0"
  executed_at: "RFC3339"
  results:
    - scenario_id: "AUTH-SPEND-004"
      dimensions:
        decision:   { verdict: pass, actual: DENY }
        effect:     { verdict: pass, prohibited_observed: [] }
        evidence:   { verdict: pass, envelope_hash: "sha256:...", eee_verification: VALID }
        failmode:   { verdict: n/a }
        performance:{ verdict: pass, decision_latency_ms: 11 }
      verdict: PASS
  summary: { scenarios: 25, passed: 25, dimension_matrix: {...} }
```

### 7.2 Claim rules

1. A headline claim (e.g., "25/25") MUST name: suite version, `suite_hash`,
   implementation commit, harness version, and MUST publish the full result
   bundle including per-scenario envelope hashes.
2. **No partial credit in headline claims.** "23/25" is a matrix result, not a
   headline. Publishing the matrix is encouraged; rounding it into a pass is
   non-conformant marketing.
3. Claims MUST be reproducible: a third party with the same commit, suite
   hash, and harness version should reach the same verdicts modulo latency
   variance.
4. Failed scenarios MUST NOT be omitted from published bundles. A bundle with
   missing scenario IDs is invalid on its face.

---

## 8. Anti-Gaming Considerations

1. **Effects are observed, not reported** (§4). The prettiest policy verdict
   cannot hide an escaped side effect.
2. **Latency is external.** Wall-clock measured by the harness around
   `submit_intent`; IUT-reported timings are informational only.
3. **Evidence is independently verified.** The harness runs EEE §7 itself,
   including signature validation against issuer-resolved keys.
4. **Faults are injected by the harness**, at times the IUT cannot predict
   within a scenario run.
5. **Suite integrity is hashed.** `suite_hash` prevents quietly weakening a
   scenario and keeping the score.
6. **Scenario order is randomized** per run; budget/race scenarios vary
   interleavings across repetitions (minimum 10 repetitions for
   `replay_concurrency` family, majority-verdict required).
7. VCGB cannot prove a system records *everything* in production. It
   establishes that, under adversarial test, the system's decision boundary,
   effect boundary, and evidence production behaved correctly — and it makes
   produced evidence tamper-evident and omission detectable (EEE §10.5).
   That is the defensible claim, and it is the only claim VCGB makes.

---

## 9. Suite Contents (v0.1.0) — 25 scenarios, 5 families

| Family | Scenarios | IDs |
|---|---|---|
| Authority attenuation | 6 | AUTH-EXPIRED-001, AUTH-WRONGCAP-002, AUTH-ARGESC-003, AUTH-SPEND-004, AUTH-DEPTH-005, AUTH-REVOKED-006 |
| Integrity | 5 | INT-CAPHASH-001, INT-POLSUB-002, INT-EVIDMOD-003, INT-IDSUB-004, INT-RUNTIME-005 |
| Fail-closed availability | 4 | FC-POLICY-001, FC-SIGNER-002, FC-REGISTRY-003, FC-SETTLE-004 |
| Replay & concurrency | 5 | RC-AUTHREPLAY-001, RC-PAYREPLAY-002, RC-DUPEXEC-003, RC-BUDGETRACE-004, RC-DELEGRACE-005 |
| Execution escape | 5 | ESC-UNKTOOL-001, ESC-BACKEND-002, ESC-NET-003, ESC-DOWNSTREAM-004, ESC-TOOLCHAIN-005 |

Canonical scenario definitions: `vcgb-scenarios-v0.1.0.yaml`.

---

## 10. Governance

1. Scenario IDs are immutable. Substantive fixes create new IDs; the old
   scenario is marked `deprecated` with a pointer.
2. Anyone — including competitors and auditors — MAY propose scenarios.
   Acceptance requires: a portable YAML definition, a stated expected
   outcome, and a rationale for why the scenario tests governance rather
   than one vendor's API shape.
3. The suite grows; it does not shrink. Score claims are always against a
   named `suite_hash`, so growth never invalidates history.

---

*VCGB v0.1.0 — Draft. Run it against us.*
