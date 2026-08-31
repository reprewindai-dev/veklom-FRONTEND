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

Production frontend API configuration remains:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.veklom.com
VBB_BACKEND_URL=https://api.veklom.com
CAPPO_BACKEND_URL=https://capi.veklom.com
```

Client-side code should continue to prefer same-origin API routes where available.
