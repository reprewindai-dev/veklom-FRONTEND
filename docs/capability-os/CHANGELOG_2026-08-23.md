# Capability OS Architecture / Handoff Changelog — 2026-08-23

This records material contract/security changes discovered after the 2026-08-22 freeze. It separates source remediation from deployed-runtime proof.

## cAPI MCP / direct-proxy security boundary

A source audit of `reprewindai-dev/cAPI` found two routes that violated the frozen responsibility and execution-boundary model:

- the MCP server registry accepted local-process descriptors without an effective route-level auth gate, and the stdio child process inherited the cAPI service environment;
- the direct dynamic proxy declared an internal API key but did not enforce it before forwarding.

Source remediation was merged to cAPI `main` as:

`eb38524268cc3b4bcc767b4c8ce7794c91c777c9` — `fix(security): harden MCP registry and direct proxy`

The new source contract is:

- hosted production cAPI does **not** permit `local-process` MCP;
- non-production local-process MCP requires explicit `CAPI_ALLOW_LOCAL_PROCESS_MCP=true`;
- spawned development MCP children do not inherit the complete cAPI process environment;
- MCP registry inventory/registration requires the Covenant admin token;
- direct `/api/proxy/{serverId}/...` access requires `BYOS_INTERNAL_API_KEY` and fails closed if it is absent;
- the cAPI internal key is stripped before requests are forwarded upstream.

**Deployment truth boundary:** this commit does not prove that `capi.veklom.com` is already running the fix. Until deployed behavior is independently verified, public ingress to cAPI should be removed or protected at the reverse proxy / Coolify boundary.

Required negative verification after deployment:

1. unauthenticated MCP registry GET is rejected;
2. unauthenticated MCP registry POST is rejected without spawning anything;
3. production local-process registration is rejected even with registry auth;
4. direct proxy without valid internal authentication is rejected;
5. valid internal proxying does not leak its internal credential upstream.

## Frontend API-path audit

A point-in-time source audit found roughly 26 served, ~110 phantom and ~40 unresolved frontend-requested paths. See [`API_PATH_AUDIT_2026-08-23.md`](./API_PATH_AUDIT_2026-08-23.md).

This does **not** create a backlog to implement every historical endpoint. The remediation rule is RETAIN / REMAP / BUILD / RETIRE-QUARANTINE / UNKNOWN-UNAVAILABLE.

The highest-priority frontend truth change is structural: an absent route, failed dispatch or unresolved destination must not render as an innocent empty-data state.

## SEKED responsibility clarification

SEKED exists as a separate product/code lineage and may provide policy evaluation / decision input where intentionally integrated. It is not a second Capability OS consequence-authority or evidence system.

- CAPPO remains sole consequence authority.
- EEE + PGL/Gnomledger remain canonical execution evidence/provenance.
- historical frontend SEKED `authority-runs` and `evidence-packs` clients are legacy/quarantined until deliberately remapped through the canonical architecture.

## Truth vocabulary reaffirmed

Canonical truth states remain:

`VERIFIED`, `LIVE`, `DEGRADED`, `FAILED`, `UNKNOWN`, `SIMULATED`

Operational object states may include:

`BLOCKED`, `EXPIRED`, `REVOKED`

`NEEDS PROOF` is acceptable evidence-specific presentation when proof is absent. Presence of a number or response object never upgrades a claim to `VERIFIED` by itself.

## CAPPO VNP production DDL remains unapproved

The VNP migration on `reprewindai-dev/cappo-backend` branch `devin/1787396502-leaderboard-500-fixes` remains **not approved for production DDL** until:

- existing legacy tables are schema-validated, not merely detected by name;
- downgrade cannot destroy tables/data that predated Alembic adoption;
- adoption is tested against a production-shaped database snapshot, including idempotent upgrade and row survival;
- exact table-count/schema differences are reconciled;
- Alembic and application tests complete successfully.

## Handoff impact

Developers continuing Capability OS work must now reconcile against both the frozen handoff and the API-path audit. Do not preserve a phantom endpoint merely because an old component expects it, and do not introduce direct execution paths that bypass CAPPO or the governed execution boundary.
