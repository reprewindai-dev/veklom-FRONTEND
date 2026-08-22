# Frontend Backend-Path Audit — 2026-08-22

Scope: string-literal backend calls in `app/`, `components/`, and `lib/`, checked against workspace Next handlers and the mounted routers in BYOS, CAPPO, cAPI, PGL/Gnomledger, and VNP. Template placeholders and paths used only as documentation examples are not runtime calls.

Classification:

- `CURRENT`: caller and owner agree on a mounted route.
- `MOVED`: an old caller path has a canonical replacement.
- `LEGACY`: retained compatibility or an isolated legacy/demo surface; it must not be used as current proof.
- `PHANTOM`: no mounted handler was found in the checked repositories.

## CURRENT

| Frontend path family | Explicit owner | Evidence |
|---|---|---|
| `/api/v1/auth/*`, `/api/v1/workspace*`, `/api/v1/pgl/*`, `/api/v1/x402/*` | BYOS via the workspace catch-all | Mounted under BYOS `app.include_router(..., prefix="/api/v1")`. |
| `/api/v1/vnp/methodology`, `/metrics`, `/beacon`, `/directory/realtime` | BYOS | Mounted BYOS VNP router. |
| `/api/v1/x402/staking/state` | BYOS | Mounted BYOS x402 router. |
| `/api/cappo/v1/exec`, `/api/cappo/v1/executions/*`, `/api/cappo/v1/capability/*`, `/api/cappo/api/v1/agents*`, `/api/cappo/api/v1/benchmarks/*` | CAPPO via explicit workspace allowlist | CAPPO routers mount these routes; workspace exchanges the BYOS session for a scoped CAPPO assertion. |
| `/api/lockerphycer/*` | Lockerphycer via explicit workspace proxy | Workspace proxy owns the mapping; no browser-to-standalone origin call. |
| `/api/vnp/*`, `/api/vnp.json`, `/api/v1/beacon/topology` | Workspace handlers with explicit BYOS/VNP ownership | Concrete Next handlers exist. |
| `/api/nexus/state` | Workspace aggregator → canonical BYOS VNP/x402 routes | Added in this change; it replaces the phantom Nexus endpoint and separates route availability from evidence presence. |
| `/api/interlink/state` | Workspace aggregator → cAPI `/health`, `/protocol.json`, `/api/mcp/servers` | Added in this change; it powers the native Interlink workspace surface. |
| `/api/protocol/introspect` | Workspace → cAPI `/protocol/introspect` | Live server-side proxy; static workspace capability invention removed. |

## MOVED

| Old path | Canonical path | Action |
|---|---|---|
| `/nexus-protocol/state` | `/api/nexus/state` | Rewired; old path had no Next or BYOS handler. |
| Embedded `https://capi.veklom.com/console` | `/interlink` reading `/api/interlink/state` | Replaced iframe with a native Capability OS surface. |
| Browser calls to standalone origins | Same-origin `/api/*` workspace handlers | Domain ownership remains explicit server-side. |
| `/api/capi/*` compatibility namespace | `/api/v1/capi/*` or cAPI-owned server routes | Workspace catch-all still maps the compatibility prefix, but new callers should use explicit same-origin ownership. |

## LEGACY

| Path/surface | Status |
|---|---|
| `/api/v1/locker*` | Compatibility mapping only; canonical workspace prefix is `/api/lockerphycer/*`. |
| `app/(uacp)/runtime/components/App.tsx` calls to `/api/wallet-info`, `/api/routes`, `/api/wallet-fund`, `/api/reset-state`, `/api/compile-intent`, `/api/evaluate-policies`, `/api/mint-pgl`, `/api/mint-ei`, `/api/execute-tool`, `/api/verify-ledger` | Legacy embedded runtime shell. No current workspace handlers exist; it must not be represented as live. |
| `/api/local/*` | Explicit local compatibility surface; not production authority or evidence. |
| Route strings containing `{id}`, `:key_id`, `exec_123`, or `mnt_123` | Documentation/test templates, not literal runtime calls. |

## PHANTOM

| Runtime caller | Missing path | Finding / required disposition |
|---|---|---|
| `app/(uacp)/discovery/state/route.ts` | `/api/v1/capi/discover`, `/api/v1/capi/state` | BYOS cAPI router mounts `execute`, `stream`, `quarantine`, and `resolve`, not these GET routes. Replace with cAPI `/health`, `/protocol.json`, and registry state before treating discovery as verified. |
| `components/fault-matrix/LedgerViewer.tsx` | `/api/analyze-ledger` | No Next handler or checked backend owner. Keep the control unavailable or rewire to a real PGL verification contract. |
| `components/terminal/components/QuantumTerminal.tsx` | `/api/agents/task-force` | No Next handler or checked backend owner. Do not synthesize task-force state. |
| Legacy runtime shell listed above | Ten `/api/*` paths | No mounted workspace handlers. Treat the shell as legacy until each action is assigned to BYOS, CAPPO, PGL, or removed. |

## Ownership conclusions

- `app.veklom.com` owns human workspace pages and same-origin BFF handlers.
- `api.veklom.com` owns the main BYOS API.
- `capi.veklom.com` owns connection/discovery/harness state, not consequence authority.
- CAPPO is the sole consequence admission boundary. cAPI direct native MCP execution is disabled; the transparent provider proxy now requires a CAPPO-only credential plus an admitted execution identifier.
- PGL/Gnomledger owns evidence/provenance; VNP owns measurement. A successful HTTP response or a present metric object is not itself proof.

## Remaining blockers

The PHANTOM rows are intentionally not assigned invented replacement contracts in this pass. They require product-owner confirmation or a canonical backend contract before their legacy UI controls can become live.
