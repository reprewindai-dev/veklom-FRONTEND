# API Contract Map (mechanical) — for correct route wiring

Source of truth:
1. `backend/apps/api/main.py` router registrations
2. OpenAPI (when present)
3. Verified integration tests
4. `USER_MANUAL.md` (reference only)

If documentation conflicts with router registrations, router registrations win.

**Scope rule:** BYOS, CAPPO, and Lockerphycer share this same contract convention (`/api/v1/...` prefix, `X-API-Key: byos_...` / Bearer JWT). PGL (gnomledger) is different — it is an evidence/ledger/lineage service.

---

## 1. Prefix rules

| Pattern | Meaning |
|---|---|
| `/api/v1/<router>` | Default for ~30+ routers |
| `/v1/exec` | LLM inference. Mounted at root (`prefix=""`) and `/api` and `/api/v1/v1` — canonical public form is `POST /v1/exec`. |
| `/status`, `/health`, `/` | Public, unauthenticated. |
| `/api/terminal/...` | Terminal router (note: `/api/terminal`, not `/api/v1`). |
| `/metrics` | Prometheus scrape endpoint (root). |

**Auth:** protected routes need `Authorization: Bearer <jwt>` OR `X-API-Key: byos_<key>`. OPTIONS preflight bypasses auth (do not break — frontend login depends on it).

---

## 2. Operator APIs

### Auth
`POST /api/v1/auth/register` · `POST /api/v1/auth/login` · `POST /api/v1/auth/refresh` · `GET /api/v1/auth/me` · `POST /api/v1/auth/mfa/enable` · `POST /api/v1/auth/mfa/verify` · `POST /api/v1/auth/api-keys` · `GET /api/v1/auth/api-keys` · `DELETE /api/v1/auth/api-keys/{key_id}`

### Workspace (Admin)
`GET /api/v1/admin/workspaces` · `GET /api/v1/admin/workspaces/{id}` · `POST /api/v1/admin/workspaces/{id}/suspend` · `DELETE /api/v1/admin/workspaces/{id}` · `GET /api/v1/admin/users` · `PUT /api/v1/admin/users/{id}/role` · `POST /api/v1/admin/users/{id}/deactivate`

### Plugins / Files / Jobs
`POST /api/v1/upload` · `POST /api/v1/transcribe` · `GET /api/v1/jobs/{job_id}` · `POST /api/v1/extract`

---

## 3. Capability Runtime APIs

### Governed Execution (CAPPO)
`POST /api/v1/execution/authorize`
`POST /v1/exec`
These two routes form the governed execution boundary.

### Governance / Privacy / Content Safety
`POST /api/v1/security/events` · `GET /api/v1/security/events` · `POST /api/v1/security/events/{id}/resolve`
`POST /api/v1/privacy/detect-pii` · `POST /api/v1/privacy/mask-pii`
`POST /api/v1/content-safety/scan` · `POST /api/v1/content-safety/age-verify`

### Routing / Capabilities
`POST /api/v1/routing/test` · `POST /api/v1/cost/predict` · `POST /api/v1/budget` · `POST /api/v1/cost/kill-switch`

### Evidence / Compliance (PGL / GnomLedger)
Evidence screen pulls from PGL ledger/lineage; do not assume BYOS shapes for it.
`GET /api/v1/capabilities` · `GET /.well-known/x402.json`
`POST /api/v1/ledger/events` · `GET /api/v1/ledger/agents/{id}` · `GET /api/v1/ledger/agents/{id}/verify`
`POST /api/v1/lineage/fork` · `GET /api/v1/lineage/tree/{id}`
`POST /api/v1/execution/validate`

### Measure (VNP)
Telemetry · Benchmarking · Topology · Trust Signals · Network Measurement
`GET /api/v1/monitoring/health` · `GET /api/v1/monitoring/metrics` · `GET /api/v1/monitoring/alerts` · `GET /api/v1/insights` · `GET /metrics`

### Settlement (x402)
`GET /api/v1/x402/payment-required` (returns 402 + `{x402Version, accepts[], error}`) · `POST /api/v1/x402/verify` · `GET /api/v1/x402/protected` · `GET /api/v1/pricing`
Headers: `X-Payment-Required`, `X-Payment-Amount`, `X-Payment-Network`, `X-Payment-Address`, `X-Payment-Token`; retry with `X-PAYMENT-Proof`.

---

## 4. lib/api.ts rules
Frontend MUST NOT use `fetch()` directly. All communication goes through `lib/api.ts`.
`lib/api.ts` is responsible for:
- Authorization
- Token refresh
- x402 interception
- Ambient interventions
- Same-origin routing
- Authentication redirects

---

## 5. Proof Guidance
- Route response ? proof
- Health endpoint ? proof
- Manifest ? proof
- Configured URL ? proof

Only runtime evidence may produce Verified.

---

## 6. Component Architecture Notes

### Tracker
Consumes: Blueprint, Repository, RepoGate, Deployment, Runtime, PGL.
Never infer Tracker state from any single service.

### Marketplace
Consumes registry APIs. Does not own capability execution, governance, or settlement.

### Internal Names
Internal names remain implementation details. User-facing labels use: Blueprint, Govern, Authority, Execute, Evidence, Measure, Settle, Tracker.

---

## 7. The Final Flow

`Capability ? Mount ? Blueprint ? Govern ? Authority ? Execute ? Evidence ? Measure ? Settle ? Tracker`

Every workspace ultimately consumes one or more routes defined in this contract.
