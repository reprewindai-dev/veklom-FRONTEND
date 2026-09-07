# Veklom Public Frontend Deployment

The canonical public frontend deployment is the local Docker stack defined in `docker-compose.public.yml`.

## Deployment Boundary

- `veklom-frontend` runs the production Next.js standalone build on container port `3002`.
- `veklom-cloudflared` runs the existing Cloudflare Tunnel as a Docker sidecar.
- Both containers use `restart: unless-stopped`.
- The frontend exposes `127.0.0.1:3002` for local verification only.
- Cloudflare is the public transport; the frontend is not opened directly to the LAN or WAN.
- Coolify, Hetzner, and Vercel are not deployment authorities for this repository.

## Bootstrap

The bootstrap script preserves the existing Cloudflare ingress map, copies the existing tunnel credential into a git-ignored runtime directory, translates host-local service addresses for Docker networking, validates the generated Cloudflare config, builds the frontend image, starts both containers, and installs current-user logon recovery tasks.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\bootstrap-public-docker.ps1
```

Generated Cloudflare runtime files live under `.veklom/runtime/` and are git-ignored. Tunnel credentials must never be committed.

## Normal Start

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-public-docker.ps1
```

Equivalent Docker command:

```powershell
docker compose -f docker-compose.public.yml up -d
```

## Health

Local:

```text
http://127.0.0.1:3002/api/health
```

Public:

```text
https://veklom.com/api/health
```

The Docker image and Compose service both health-check `/api/health`.

## Recovery

`scripts/docker-public-watchdog.ps1` checks the frontend container, the Cloudflare container, and the public health endpoint. It restarts only the failed Veklom component; it does not kill unrelated Node or Docker workloads.

Docker restart policy remains the first recovery layer. The watchdog covers the additional case where a process stays alive but becomes unhealthy.

## Backend Contract

Production frontend API configuration uses same-origin browser routing with direct local CAPPO and backend connections:

```env
# NEXT_PUBLIC_API_BASE_URL must be empty so the browser uses same-origin routes.
# Do NOT set this to https://api.veklom.com — that forces an unnecessary
# Cloudflare round trip and breaks same-origin cookie handling.
NEXT_PUBLIC_API_BASE_URL=

VBB_BACKEND_URL=https://api.veklom.com
BACKEND_URL=http://host.docker.internal:8088

# CAPPO_BACKEND_URL must point at the cappo-backend service directly (port 8002).
# Do NOT set this to https://capi.veklom.com — that points at cAPI, not cappo-backend.
CAPPO_BACKEND_URL=http://host.docker.internal:8002
```

Client-side code should continue to prefer same-origin API routes where available.

### Identity Seam

BYOS (`VBB_BACKEND_URL`) currently issues CAPPO audience assertions via
`POST /api/v1/auth/cappo-token`. This endpoint mints a short-lived (120-second)
EdDSA JWT that the frontend proxy attaches to workspace-bound CAPPO requests.

Since September 4, LockerPhycer is the browser identity authority. BYOS's
session middleware must correctly forward LockerPhycer-established sessions for
assertion minting to work. When LockerPhycer becomes the sole canonical identity
authority, the `/cappo-token` endpoint should move there.

