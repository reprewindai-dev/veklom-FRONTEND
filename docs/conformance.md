# Veklom Conformance

Veklom conformance is evidence-scoped. A source file, configured integration, passing unit test, reachable health route, and verified real-world consequence are different proof levels and must not be collapsed into one claim.

## Constitutional invariants

- **Authority:** no consequence beyond granted authority.
- **Evidence:** no truth claim beyond observable evidence.
- **Agency:** no residual execution authority after termination.
- **Monotonicity:** delegated or derived authority may preserve or narrow scope, never silently widen it.
- **Explicit uncertainty:** unknown outcomes remain unknown until reconciliation.
- **Fail-closed execution:** missing or invalid authority must deny before consequence.

## Proof classes

| Class | Meaning |
| --- | --- |
| `SOURCE_OBSERVED` | The behavior exists in canonical source. Deployment is not implied. |
| `TEST_VERIFIED` | An executable test/falsifier passed in the stated environment. |
| `RUNTIME_OBSERVED` | The declared service responded in the tested runtime profile. |
| `CONSEQUENCE_VERIFIED` | A real consequence plus authoritative post-state/evidence was observed. |
| `UNVERIFIED` | Required evidence has not been produced. |

## Runtime planes

BYOS Runtime, LockerPhycer, CAPPO, cAPI, Gnomledger/PGL, VLink, and Guardian have distinct responsibilities. Health of one plane does not establish conformance of another.

## Regulatory frameworks

Veklom may be evaluated against frameworks such as Canadian privacy law, NIST AI RMF, and applicable enterprise governance requirements. This page does **not** claim legal compliance, certification, regulatory approval, or universal alignment. Those claims require a scoped legal/compliance assessment and deployment-specific evidence.

## Deployment truth

The public proof surface reports live reachability/readiness observations where endpoints are available. Consequence-level proof remains bound to actual governed execution and its evidence.
