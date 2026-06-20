# Veklom Control Plane

The **private, tier-gated control plane** for the Veklom BYOS Backend (the sovereign side of the marketplace). Wired directly to the live FastAPI API at `https://api.veklom.com` — no mocks.

The public marketplace demo is a separate app and is **not touched** by this project.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** for styling, dark sovereign theme
- **SWR** for data fetching with auto-revalidation
- **lucide-react** for icons
- Auth: JWT (Bearer) against `POST /api/v1/auth/login`
- Tier model: Free / Starter / Pro / Sovereign / Enterprise — resolved from `/api/v1/subscriptions/current` + `/api/v1/auth/me`

## Modules (and tier gates)

| Group | Module | Min tier | Backend routes used |
|---|---|---|---|
| Ops | Overview | Starter | `/wallet/balance`, `/workspace/overview`, `/command-center/activity-feed`, `/audit` |
| Ops | Token Wallet | Starter | `/wallet/*` |
| Ops | Usage Analytics | Pro | `/billing/usage`, `/billing/breakdown`, `/insights/summary` |
| Ops | Billing | Starter | `/billing/invoices`, `/subscriptions/portal` |
| Ops | Smart Routing | Pro | `/routing/*`, `/ai/routing/tier` |
| Ops | Autonomous Jobs | Pro | `/autonomous/*` |
| Ops | Insights | Pro | `/insights/*` |
| Governance | Audit Log | Pro | `/audit`, `/audit/compliance-report` |
| Governance | Budget Caps | Pro | `/budget`, `/budget/forecast` |
| Governance | Kill Switch | Sovereign | `/cost/kill-switch`, `/cost/kill-switch/status` |
| Governance | Compliance | Sovereign | `/compliance/*` |
| Governance | Locker Security | Sovereign | `/locker/security/*`, `/locker/monitoring/*` |
| Governance | Content Safety | Pro | `/content-safety/*` |
| Governance | Privacy Controls | Sovereign | `/config` |
| Governance | Security Center | Sovereign | `/security/*` |
| Governance | Governance | Sovereign | `/governance/*` |
| Account | Team & RBAC | Pro | `/team/*` |
| Account | API Keys | Starter | `/auth/api-keys` |
| Account | Webhooks | Pro | `/webhooks/*` |
| Account | Subscription | Free | `/subscriptions/*` |
| Account | Workspace | Starter | `/workspace/*` |
| Vendor | Onboarding | Starter | `/vendors/onboard`, `/vendors/me/listings` |
| Vendor | My Listings | Starter | `/listings/*`, `/vendors/me/listings` |
| Vendor | Payouts | Starter | `/payouts/*` |
| Vendor | Stripe Connect | Starter | `/stripe/connect/*` |
| Admin | Admin (superuser) | n/a (superuser flag) | `/admin/*` |

Locked modules render an upsell card linking to `/subscriptions`. Admin is hidden entirely unless `me.is_superuser`.

## Local dev

```bash
cp .env.example .env.local
# Optional: point at staging
# NEXT_PUBLIC_API_BASE_URL=https://api.veklom.com

npm install
npm run dev
# open http://localhost:3000
```

## Publish and Deploy

The user-owned target repo is `reprewindai-dev/veklom-control-plane`.

### Deployment Architecture
This application is designed to be deployed as a standalone service (via Coolify or Vercel). It does NOT run inside the FastAPI backend.

1. Deploy the `veklom-control-plane` repository to Coolify (using the included `Dockerfile` or Nixpacks).
2. Set the environment variable `NEXT_PUBLIC_API_BASE_URL=https://api.veklom.com` in your Coolify/Vercel settings.
3. Configure the backend's CORS (`_CORS_ORIGIN_REGEX`) to allow your frontend domain (e.g. `https://control.veklom.com`).

## Notes

- The control plane is API-only and stateless — all state lives in the BYOS Backend.
- Tokens are kept in `localStorage` under `veklom.access_token` / `veklom.refresh_token`.
- If the backend returns a 401, the auth context clears tokens and the user is bounced to `/login`.
- Sovereign/Enterprise modules can be revealed without payment when `me.is_superuser` is true (the admin clause). The tier badge still reflects the real tier.
