# PUBLIC-SITE-AVAILABILITY-1

**Status:** PROPOSED IMPLEMENTATION PLAN  
**Priority:** P0 / before substrate expansion  
**Scope:** veklom.com public availability, safe development coexistence, Cloudflare edge, Docker origin, health/recovery, deployment isolation  
**Operational objective:** 100% user-visible public landing availability as the goal; engineer and measure explicit SLOs rather than claim mathematically guaranteed 100% uptime.

## 1. Problem statement

The current production frontend is a single local Docker application (`veklom-frontend`) plus one `cloudflared` sidecar. Docker restart and a watchdog can recover process failures, but they do not remove the single-host failure domain. A healthy Cloudflare Tunnel also does not prove the origin service is healthy.

The public site must remain available while CAPPO, VRE, Linux, Kubernetes, PostgreSQL, Cloud/S5 and other substrate work proceeds independently.

## 2. Architecture decision

Separate the **public truth surface** from the **mutable product/runtime surface**.

```text
Internet
  -> Cloudflare edge
      -> veklom.com                PUBLIC TRUTH SURFACE
         static/edge-rendered, independent of local origin
         landing, architecture, security, proof/conformance, docs, contact/VLink entry

      -> app.veklom.com            PRODUCT SURFACE
         Cloudflare Tunnel -> local Docker origin(s)

      -> api.veklom.com / service hostnames
         Cloudflare Tunnel -> local service mesh
```

### Public truth surface

Preferred deployment target:

1. Cloudflare Workers for the existing Next.js application if full-stack Next.js behavior is required and compatibility passes.
2. Cloudflare Pages only if the public surface is intentionally converted to a static export.

The public root must not depend on CAPPO, cAPI, LockerPhycer, PGL, BYOS, local Docker health, or a local Cloudflare Tunnel to return HTTP 200 and render the canonical Veklom landing/documentation shell.

Dynamic data on the public site must degrade gracefully to explicit `UNAVAILABLE` / last-known-safe metadata rather than making the page itself fail.

## 3. No-downtime development rule

Production is immutable during experimentation.

```text
feature branch
  -> preview deployment / staging hostname
  -> smoke test
  -> route/API contract tests
  -> production build
  -> health verification
  -> promote
  -> immediate rollback target retained
```

Never develop directly against the live production container. Never restart the production stack to test unrelated substrate work.

Recommended hostnames:

```text
veklom.com              production public truth surface
www.veklom.com          redirect/canonical alias
preview.veklom.com      protected preview branch alias where useful
app.veklom.com          production product UI
staging-app.veklom.com  product staging
api.veklom.com          API/public product ingress as currently defined
```

## 4. Current local Docker hardening

The existing `docker-compose.public.yml` already has:

- frontend health check on `/api/health`;
- `restart: unless-stopped`;
- `cloudflared` dependency on frontend health;
- loopback-only host port for the frontend;
- a watchdog that can recover a failed container or tunnel.

Keep those as recovery layers, but do not mistake them for high availability.

Required hardening:

1. Pin `cloudflare/cloudflared` to an explicit tested version rather than `latest`.
2. Pin the frontend image to immutable build/commit tags in production.
3. Add a startup/readiness contract that distinguishes process-up from dependency-ready.
4. Keep `/api/health` shallow enough to verify frontend liveness; add a separate `/api/ready` for dependency readiness so a backend outage cannot make the public landing unhealthy.
5. Make watchdog recovery bounded and observable; repeated restart loops must raise an alert rather than churn indefinitely.
6. Record container restart count, last healthy timestamp, tunnel status, public HTTP status, and recovery action.
7. Ensure Docker/WSL/host reboot automatically restores the production stack without an interactive login dependency where the host permits it.
8. Do not combine overlapping process supervisors that fight Docker restart behavior.

## 5. Tunnel availability

A single `cloudflared` process has multiple outbound Cloudflare connections, but the local host remains a failure domain.

### Minimum

- one production tunnel dedicated to product/API traffic;
- version-pinned `cloudflared`;
- health monitoring of the actual published origin route, not only tunnel connectivity;
- preserve validated ingress configuration as code / sanitized configuration manifest;
- no production route edits during unrelated development.

### Higher availability when a second local host exists

Run another `cloudflared` replica for the same tunnel from the second host and run the corresponding healthy application origin there. This protects against one machine, Docker daemon, or local `cloudflared` process failing.

For health-based intelligent steering across separate origins/tunnels, evaluate Cloudflare Load Balancing only if cost and plan constraints are acceptable.

## 6. Blue/green product deployment

Do not replace a running product container in place.

Use two local production slots:

```text
veklom-app-blue   :3101
veklom-app-green  :3102
```

Only one slot is active in tunnel ingress at a time.

Deployment sequence:

1. Build new commit into inactive slot.
2. Start inactive slot.
3. Wait for liveness + readiness.
4. Run smoke tests directly against loopback/inactive port.
5. Run protected staging hostname against inactive slot if needed.
6. Switch ingress to healthy inactive slot atomically.
7. Verify public/app health.
8. Keep old slot alive for rollback window.
9. If verification fails, switch route back immediately.
10. Retire old slot only after the rollback window expires.

Substrate proof work must target separate Docker networks/ports/namespaces and must never reuse production container names, volumes, tunnel routes, or credentials.

## 7. Public-site failure containment

The production public landing must remain useful during product/backend failure.

Required behavior:

```text
CAPPO down       -> veklom.com still HTTP 200
cAPI down        -> veklom.com still HTTP 200
PGL down         -> veklom.com still HTTP 200
Docker down      -> veklom.com still HTTP 200
local host down  -> veklom.com still HTTP 200
app unavailable  -> public site shows controlled product-status message/link state
```

This is the principal availability boundary.

## 8. Release gate

No production promotion unless all are true:

- build succeeds from exact commit;
- preview/staging renders canonical Capability OS landing;
- `GET /` returns 200;
- critical public routes return expected 2xx/3xx;
- no secret/internal endpoint is rendered client-side;
- canonical metadata/robots/sitemap behavior is verified;
- app/API links point to intended production hostnames;
- health endpoints pass;
- rollback target exists;
- production change contains no unrelated substrate experiment.

Any failure means **DO NOT PROMOTE**.

## 9. Availability measurement

Track separately:

```text
Public edge availability       veklom.com /
Public critical-route success  docs/security/proof/contact/VLink
Product UI availability        app.veklom.com
API availability               selected canonical APIs
Origin availability            local Docker readiness
Tunnel availability            cloudflared connectivity
```

Do not collapse these into one number.

Target operational progression:

```text
Phase A: eliminate multi-hour outages
Phase B: >= 99.9% measured public availability
Phase C: >= 99.99% measured public availability
Operational objective: no user-visible public outage caused by development/substrate work
```

A literal 100% guarantee is not asserted; 100% is the engineering objective and every observed outage becomes a defect with root-cause and prevention action.

## 10. AI / search readiness after stability

Once public availability and canonical routing are stable:

1. verify canonical URLs and redirects;
2. verify `robots.txt` policy;
3. add/verify sitemap;
4. add structured metadata for Capability OS, architecture, security and docs;
5. expose only current proof/conformance claims;
6. inspect Cloudflare AI Crawl Control / Agent Readiness results;
7. investigate AI retrieval paths that are invalid or scanner noise;
8. ensure preview/staging deployments are `noindex`;
9. add machine-readable documentation surfaces only after source-of-truth content is current.

AI retrieval volume is a discovery signal, not a human-user count.

## 11. x402 boundary

x402 is an application/settlement protocol, not the availability substrate.

- Public landing must not require x402.
- Protected paid/capability routes must deterministically return the expected x402/HTTP 402 contract rather than 404/5xx when the service is healthy.
- x402 validation belongs to product/API release tests and must not be allowed to take the public truth surface offline.

## 12. Implementation order for Antigravity

```text
P0. Restore and freeze current canonical landing
P1. Establish edge-hosted public truth surface
P2. Add preview/staging production separation
P3. Add blue/green local product deployment
P4. Harden Docker health/readiness/recovery + version pinning
P5. Validate tunnel configuration + route health
P6. Add external availability checks and outage evidence
P7. Verify x402 protected-route contract
P8. Verify AI/search readiness and canonical content
P9. Freeze availability baseline
P10. Resume Windows repository canonicalization and later substrate work
```

The website and product-runtime work must thereafter coexist by design: public content lives at the edge; product releases use staged blue/green promotion; substrate experiments run in isolated development networks and cannot modify production ingress.

## 13. Exit criteria

`PUBLIC-SITE-AVAILABILITY-1` may be called operationally complete when:

- public landing remains available through intentional local frontend/container shutdown;
- public landing remains available through intentional `cloudflared` shutdown;
- product deployment can be upgraded and rolled back without public-root downtime;
- substrate test stack can be started/stopped without modifying production routes;
- health checks distinguish public edge, product origin, API and tunnel failures;
- an induced bad release is rejected or rolled back without prolonged outage;
- a reboot/recovery drill restores the product origin without manual reconstruction;
- exact configuration/commit and test evidence are retained.

Only after this gate is closed should substrate expansion become the dominant engineering priority.
