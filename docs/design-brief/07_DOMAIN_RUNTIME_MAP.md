# Domain → Container → Port Map

This document defines the current deployment target infrastructure. 

**CRITICAL: If runtime verification disagrees with this map, runtime verification wins. Update this document rather than hardcoding exceptions in the code.**

| Domain | Known runtime mapping | Internal port | Public app port allowed? |
|---|---|---:|---|
| `api.veklom.com` | `n13gp1nhrcdp0hvazvbnlxru-213557155694` (BYOS/API container) | 8088 | no |
| `bingo.veklom.com` | `bingo-backend` | 3000 | no |
| `duel.veklom.com` | `agent-duel-backend` | 3000 | no |
| `governance.veklom.com` | `tvxcsezs2ypd8tjuj6ic9gih-230135676493` (Control Plane) | 3002 | no |
| `control.veklom.com` | `tvxcsezs2ypd8tjuj6ic9gih-230135676493` (Control Plane) | 3002 | no |
| `interlink.veklom.com` | `ox6sadqw5cqrkz7tbhwb12qx-142016658979` | 3000 | no |
| `pgl.veklom.com` | `xlkby54o7jdlib3rz2p510cs-180811986986` (GnomLedger/PGL) | 8095 | no |
| `capi.veklom.com` | `cappo-backend-node` (CAPPO backend node) | 8093 | no |
| `cappo.veklom.com` | `cappo-backend-node` (CAPPO backend node) | 8093 | no |
| `lockerphycer.veklom.com` | `lockerphycer-node` (LockerPhycer) | 8092 | no |
| `vnp.veklom.com` | `veklom-vnp-standalone-node` (VNP) | 8089 | no |

Expected public exposure: 80/443 and restricted SSH only.

## UI Implications
The operator UI (Capability OS) must never expose or hardcode internal ports. The UI must always use standard HTTPS domains (e.g., `api.veklom.com`, `control.veklom.com`, `vnp.veklom.com`). The port mapping stays exclusively within infrastructure documentation and deployment tooling.
