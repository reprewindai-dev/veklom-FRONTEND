# Veklom AI - Control Plane

Veklom AI is a private governed AI backend that allows secure, compliant, and customizable AI workload management on your own infrastructure, offering policy control, cost management, auditing, and tenant isolation.

## Core Capabilities
- **Private AI Backend**: Veklom BYOS (Bring Your Own Server) allows organizations to run AI workloads on their own servers or cloud infrastructure, ensuring full control over data and deployment environments.
- **Governance and Policy Control**: The platform provides detailed policy management capabilities to enforce organizational standards and compliance requirements. Teams can define rules on how AI models are used, which workloads are permitted, and what access controls are applied.
- **Routing and Multi-Tenant Support**: Veklom supports workload routing and tenant isolation, enabling multiple teams or clients to operate securely on the same infrastructure without risk of data crossover.
- **Cost Controls**: The platform includes cost management features that allow monitoring and controlling compute expenditure for AI workloads across tenants, helping organizations optimize resource usage and reduce unnecessary spend.
- **Audit and Evidence Tracking**: Every AI operation can be logged for audit purposes. This ensures accountability, traceability, and evidence collection for regulatory compliance or internal reviews.
- **API Key Management**: Veklom provides flexible API key management, making it straightforward to integrate with existing applications and control access to AI models and services.
- **Compliance and Security**: The platform emphasizes regulatory compliance, supporting industry-standard security practices and allowing organizations to maintain audits, access controls, and secure operations on their own infrastructure.

## Deployment Flexibility
Veklom can be deployed on local servers or in private clouds, providing enterprises with maximum control over data location, security, and network configuration. This flexibility is especially valuable for organizations dealing with sensitive data or operating in highly regulated industries such as healthcare and finance.

## Summary
Veklom is designed for organizations that need a secure, multitenant, and policy-driven AI platform while maintaining full control over their infrastructure. Its key features—policy management, tenant isolation, cost controls, audit logging, and API integration—make it suitable for enterprise-grade AI operations where governance, compliance, and operational transparency are critical.

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
