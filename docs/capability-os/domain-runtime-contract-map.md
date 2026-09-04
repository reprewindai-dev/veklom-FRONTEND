# Domain ? Runtime Contract Map

This document records the **reported runtime contract** for Veklom foundation services. It is not proof of a live deployment.

**Verification rule:** a runtime becomes `VERIFIED` only when deployed SHA, HTTP/protocol identity, container listener, and Traefik routing all agree. Until then, reported ports remain `NOT_VERIFIED`.

## reported_runtime_state

| Service | Public surface | Reported internal port | State |
|---|---|---:|---|
| BYOS | `api.veklom.com` | 8088 | `NOT_VERIFIED` |
| Control Plane | `governance.veklom.com`, `control.veklom.com` | 3002 | `NOT_VERIFIED` |
| cAPI / Interlink | `capi.veklom.com`, `interlink.veklom.com` | 3003 | `NOT_VERIFIED` |
| GPC / UACP V3 | `gpc.veklom.com`, `veklom.com/gpc` | 3010 | `NOT_VERIFIED` |
| Gnomledger | `pgl.veklom.com` | 8001 | `NOT_VERIFIED` |
| CAPPO | `cappo.veklom.com` | 8002 | `NOT_VERIFIED` |
| Lockerphycer | `lockerphycer.veklom.com` | 8092 | `NOT_VERIFIED` |
| Terminal | canonical Terminal public domain not established in this document | 80 | `NOT_VERIFIED` |

## verified_runtime_state

None established by this document.

Do not promote HTTP reachability, a successful probe, repository source, a commit message, or a configured port to `VERIFIED` by itself.

## unverified_claims and legacy surfaces

Legacy or out-of-contract surfaces such as `bingo.veklom.com`, `duel.veklom.com`, and `vnp.veklom.com` must not be assigned a canonical internal port here unless the foundation runtime contract is explicitly updated and independently verified. Their prior mappings are treated as `UNVERIFIED` rather than current source of truth.

Ports `3000` and `8000` are forbidden as canonical application/runtime defaults in the foundation contract.

Expected public exposure is 80/443 and restricted SSH only.

## UI implications

The operator UI (Capability OS) must never expose or hardcode internal ports. It must use standard HTTPS public surfaces and present runtime verification separately from reachability or health observations.
