# PUBLIC-SITE-EDGE-ADR-001

**Status:** ACCEPTED FOR IMPLEMENTATION  
**Program:** PUBLIC-SITE-AVAILABILITY-1  
**Date:** 2026-09-10

## Decision

Use **Cloudflare edge hosting as the production frontend availability boundary**. Do not keep `veklom.com` dependent on the BigCappo Windows host, Docker Desktop, WSL, or a single `cloudflared` process.

The current repository is Next.js 16.3.0 and uses full-stack Next.js behavior, including rewrites to runtime services. Therefore the preferred production target for the existing application is **Cloudflare Workers**, using the current Cloudflare-recommended Next.js path, subject to compatibility testing.

Use **Cloudflare Pages only for a deliberately static public truth surface** if we decide to split the marketing/docs shell from the full-stack product application. Do not automatically fall back to Pages if `vinext` finds a compatibility blocker; first return the compatibility report because splitting the application is an architectural change.

Vercel is not required for this availability program.

## Target topology

```text
Internet
  -> Cloudflare edge
      -> veklom.com
         Cloudflare Worker / edge-rendered Next.js frontend
         landing + docs + security + proof/conformance + product shell
         MUST render independently of local Docker/backend health

      -> public API hostnames (only where intentionally public)
         Cloudflare Tunnel / protected service ingress
         -> local Docker services

      -> private Worker-to-origin service calls
         Workers VPC binding
         -> Cloudflare Tunnel
         -> local Docker/private services

      -> optional app.veklom.com
         product-specific alias/surface if separation improves operations
```

If the public truth surface is split into a separate static application:

```text
veklom.com        -> Cloudflare Pages (static public truth surface)
app.veklom.com    -> Cloudflare Workers (full-stack product frontend)
api.veklom.com    -> published API routes only
private services  -> Workers VPC -> Tunnel -> local services
```

Both topologies satisfy the core requirement only if `veklom.com` remains HTTP 200 when the local host, Docker, or `cloudflared` is intentionally stopped.

## Why

Current production coupling creates a single-host availability dependency. A tunnel has redundant outbound Cloudflare connections, but if the only host/origin disappears, the application still disappears. Edge-hosting the frontend removes the local workstation from the public rendering path.

The current `next.config.mjs` contains local-production rewrites such as `host.docker.internal` for LockerPhycer and VLink. Those routes MUST be refactored before edge deployment. Edge runtime code cannot rely on BigCappo-specific loopback or Docker-host addressing.

## Backend rule

Public rendering MUST NOT synchronously require CAPPO, LockerPhycer, cAPI, PGL, VNP, VLink, BYOS, or any local runtime service.

For public pages:

```text
backend healthy   -> show live data where explicitly supported
backend degraded  -> show bounded degraded/unavailable state
backend offline   -> public page still renders successfully
```

Do not convert an API outage into a public-site 5xx.

## Service connectivity migration

Before production edge cutover:

1. Inventory every Next.js rewrite/route handler/server action that reaches local services.
2. Classify each as PUBLIC, AUTHENTICATED PRODUCT, SERVER-TO-SERVER PRIVATE, or LEGACY.
3. For SERVER-TO-SERVER PRIVATE services, **prefer a Cloudflare Workers VPC Service or VPC Network binding over publishing a public hostname**. The Worker should fetch the private service through the bound Cloudflare Tunnel.
4. For APIs that are intentionally public, use explicit published hostnames such as `api.veklom.com`, protected by the appropriate WAF/authentication/policy. Do not expose internal-only CAPPO/cAPI/PGL/LockerPhycer service surfaces merely to make Worker rewrites convenient.
5. Workers VPC is currently beta. If it is unavailable on the account or fails the production compatibility gate, the fallback is a dedicated Tunnel hostname protected by Cloudflare Access/service-to-service credentials, not an unprotected generic public origin.
6. Replace `host.docker.internal` / `127.0.0.1` production dependencies with the selected Worker-accessible service binding/hostname.
7. Preserve CAPPO/cAPI/PGL/LockerPhycer ownership boundaries; no generic fallback route.
8. Require timeouts and bounded degraded handling so a service failure cannot stall page rendering indefinitely.

## vinext compatibility decision

Run `npx vinext check` against the current Next.js 16 application.

If the compatibility check finds Node-native or unsupported behavior that blocks the Worker runtime:

```text
DO NOT automatically rewrite/split the application.
STOP the migration step.
Return the compatibility report with:
- blocked files/features
- whether each blocker affects public static pages, authenticated product pages, or both
- whether OpenNext or a targeted refactor is viable
- whether a deliberate Pages/static split would remove the blocker
```

The existing Next.js deployment remains untouched while this report is reviewed. Cloudflare documents OpenNext as another Workers deployment path for applications that cannot yet migrate to vinext because of a compatibility gap.

## Local product/runtime availability

Cloudflare edge hosting protects the frontend, but local APIs still require their own recovery and failover plan.

Minimum local controls:

- immutable production image tags;
- version-pinned `cloudflared`;
- liveness separate from readiness;
- blue/green application slots;
- rollback without rebuilding;
- watchdog/recovery evidence;
- production Docker network isolated from substrate-lab networks;
- no development process may mutate production tunnel routes.

When a second physical local host becomes available, run a second healthy service origin and an additional `cloudflared` replica. Use separate tunnels plus Cloudflare Load Balancing if health-based origin steering is required and the plan/cost is acceptable.

## Mandatory failure drills

The availability milestone does not close until these are executed against production-equivalent routing:

```text
stop local frontend container -> veklom.com stays 200
stop cloudflared              -> veklom.com stays 200
stop Docker                   -> veklom.com stays 200
reboot BigCappo               -> veklom.com stays 200
CAPPO unavailable             -> public landing stays 200
LockerPhycer unavailable      -> public landing stays 200
bad frontend release          -> production remains on previous healthy deployment
bad API release               -> public landing stays 200; affected product action fails bounded
substrate proof workload      -> production routing unaffected
```

## SLO and goal

`100% user-visible public availability` is the engineering objective. Do not advertise or internally certify a mathematical 100% guarantee.

Track at least:

- public root availability;
- critical public-route availability;
- product UI availability;
- API availability by canonical endpoint;
- tunnel availability;
- local origin readiness.

Any development-caused public outage is a release defect and must receive a root-cause/prevention action.

## Implementation order

```text
1. Snapshot current DNS/tunnel/origin routing.
2. Restore correct Capability OS landing on current production.
3. Run `npx vinext check` and retain the compatibility report.
4. If compatible, initialize a non-destructive Workers/vinext path; if blocked, STOP and report rather than auto-splitting.
5. Inventory and classify backend calls as public vs private.
6. Create Workers VPC bindings through the existing Tunnel for private server-to-server calls where available.
7. Refactor machine-local production rewrites.
8. Deploy protected preview Worker.
9. Verify public pages without local services.
10. Run public-route smoke/crawler checks.
11. Cut veklom.com to edge frontend.
12. Kill local frontend + cloudflared and verify public root remains available.
13. Harden local API/product ingress, blue/green, readiness and rollback.
14. Add second-host tunnel/origin redundancy when hardware is available.
15. Freeze evidence packet and availability baseline.
```

## Stop rule

Do not resume Linux/Kubernetes/Cloud/S5 substrate expansion until the public-site availability gate is closed. After the gate, category-launch work may proceed without making experimental substrate work part of the public availability dependency.
