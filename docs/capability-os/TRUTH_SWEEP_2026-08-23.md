# Capability OS Truth Sweep — 2026-08-23

Status: source-backed remediation record; not deployed-runtime proof.

This sweep continued the frontend API-path investigation after the legacy `/nexus` page was established as a regression fixture rather than the product direction.

## Changes on this branch

- Replaced the non-canonical `Present` proof label with `Live` across the canonical COS proof model.
- Changed reachability-only proof derivation from `Present` to `Live`; reachability still does not become `Verified`.
- Corrected the Capability home pulse request from `/v1/platform/pulse` to `/api/v1/platform/pulse` and made failure visible instead of collapsing to a missing panel.
- Updated the Capability home spine copy to the frozen responsibility model: Identity → cAPI connection/discovery → CAPPO consequence authority → Governed Compute → EEE/PGL evidence → VNP Measure.
- Removed silent sandbox-by-default behavior from the COS AppShell.
- Corrected AppShell health to the same-origin `/health/` rewrite and wallet balance to `/api/v1/wallet/balance`; failures now remain visible.
- Retired `/api/v1/capi/execute` fail-closed. The old handler injected server-side operator, credits and confidence headers before forwarding to cAPI, which created a shadow consequence-authority path outside CAPPO.
- WebMCP no longer coerces unknown receipt states into `executed`; the retired compatibility path now stays rejected until a canonical CAPPO CapabilityLease contract is wired.
- GPC compile/generate/component discovery now uses the shared API transport. GPC consequence execution is fail-closed until it is bound to CAPPO rather than the retired cAPI execution path.

## Corrections to the earlier path audit

The earlier audit contained several route-owner assumptions that do not match the current BYOS source inventory and should not be applied mechanically.

Current BYOS `API_SURFACE.md` and `docs/BACKEND_ROUTE_INVENTORY.txt` show:

- `/api/v1/platform/pulse` is a BYOS API route. The frontend catch-all also dispatches `/api/v1/platform*` to BYOS. It should not be described as CAPPO-owned without newer runtime evidence.
- `/api/v1/wallet/balance` exists in the current BYOS route inventory. Do not rewrite it to `/api/v1/workspace/wallet/balance` merely from the prior audit claim.
- `/api/v1/autonomous/decisions` exists in the current BYOS route inventory. Do not rewrite it to a workspace-prefixed route without stronger current evidence.

Rule: current route source + actual proxy dispatch outrank an earlier audit note.

## Direct `fetch()` classification

Direct `fetch()` is not automatically a defect. The important distinction is execution context and truth behavior.

### Must be remediated / quarantined

- Browser-side GPC calls that manually read a different localStorage token and converted component-load failure into `[]`.
- Browser-side WebMCP execution that bypassed shared truth handling and could coerce unexpected statuses to `executed`.
- Any browser call where a failed/non-JSON endpoint is rendered as a believable empty state.

### May remain direct after review

- Next route handlers proxying upstream services server-side.
- Server-only clients using server-held credentials and explicit timeout/error handling.
- SSE/streaming transports that cannot use the JSON helper, provided they share canonical auth and validate content type/status without inventing success.

## x402 status

`cAPI/src/app/api/x402/route.ts` publishes x402 configuration and a price table. That handler itself does not verify payment or prove that the listed operations are payment-gated.

There is separate x402 machinery in CAPPO and BYOS, but a published price is not proof of enforcement. Each priced operation must be traced to an actual 402 challenge/payment verification/replay-protection path before it is described as paid or protected.

## Remaining work

1. Add the systemic JSON-response guard to the shared `lib/api.ts` once reconciled with Devin's local unpushed transport work, so HTML redirects/non-JSON 200 responses fail explicitly rather than being returned as typed data.
2. Continue the browser-direct-fetch sweep outside the canonical COS shell and classify each call as shared JSON transport, legitimate streaming transport, server-only, or retire/quarantine.
3. Bind Workflows/GPC execution to the real CAPPO CapabilityLease contract instead of merely leaving it fail-closed.
4. Reconcile this branch with the pushed workspace-assertion branch and Devin's local-only merge when his credential environment is available again.
5. Run exact-head test/typecheck/lint/build and browser checks before merge.

## Truth rule

No endpoint is not the same thing as no data. A route, status code, numeric payload, configured URL, or health response does not by itself prove authority, external consequence, evidence, or measurement.
