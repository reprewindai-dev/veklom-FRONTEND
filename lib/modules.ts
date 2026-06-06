import type { Tier } from "./tiers";

export interface ModuleDef {
  slug: string;
  label: string;
  href: string;
  group: "ops" | "governance" | "vendor" | "admin" | "account";
  minTier: Tier;
  description: string;
  icon: string; // lucide name
}

// Aligned with the live VCB API surface and the documented tier ladder.
export const MODULES: ModuleDef[] = [
  // OPS
  { slug: "dashboard", label: "Overview", href: "/dashboard", group: "ops", minTier: "starter", description: "Live workspace overview, health, and recent activity.", icon: "LayoutDashboard" },
  { slug: "marketplace", label: "Marketplace", href: "/marketplace", group: "ops", minTier: "free", description: "Sovereign-ready assets, governed distribution — models, packs, connectors, managed services.", icon: "Store" },
  { slug: "playground", label: "Playground", href: "/playground", group: "ops", minTier: "free", description: "Governed inference console — pick a model, run prompts, see routing/policy/cost per call.", icon: "FlaskConical" },
  { slug: "status", label: "System Status", href: "/status", group: "ops", minTier: "free", description: "Live platform health, component status, uptime, and latency.", icon: "Activity" },
  { slug: "wallet", label: "Token Wallet", href: "/wallet", group: "ops", minTier: "starter", description: "Balance, top-ups, transactions.", icon: "Wallet" },
  { slug: "usage", label: "Usage Analytics", href: "/usage", group: "ops", minTier: "pro", description: "Per-endpoint usage, cost, throughput.", icon: "BarChart3" },
  { slug: "billing", label: "Billing", href: "/billing", group: "ops", minTier: "starter", description: "Invoices, breakdown, allocation.", icon: "Receipt" },
  { slug: "routing", label: "Smart Routing", href: "/routing", group: "ops", minTier: "pro", description: "Provider routing rules, policies, economics.", icon: "Network" },
  { slug: "pipelines", label: "Pipelines", href: "/pipelines", group: "ops", minTier: "pro", description: "Visual builder for governed inference — chain models, retrieval, tools, routing.", icon: "Workflow" },
  { slug: "deployments", label: "Deployments", href: "/deployments", group: "ops", minTier: "pro", description: "BYOS deployment tracking, endpoints, and integrations.", icon: "Server" },
  { slug: "autonomous", label: "Autonomous Jobs", href: "/autonomous", group: "ops", minTier: "pro", description: "Execute, monitor, override autonomous runs.", icon: "Bot" },
  { slug: "insights", label: "Insights", href: "/insights", group: "ops", minTier: "pro", description: "Savings, projections, summary.", icon: "Lightbulb" },

  // GOVERNANCE
  { slug: "audit", label: "Audit Log", href: "/audit", group: "governance", minTier: "pro", description: "Tamper-evident audit trail and compliance reports.", icon: "FileSearch" },
  { slug: "kill-switch", label: "Kill Switch", href: "/kill-switch", group: "governance", minTier: "sovereign", description: "Halt execution with audit proof.", icon: "PowerOff" },
  { slug: "budget", label: "Budget Caps", href: "/budget", group: "governance", minTier: "pro", description: "Caps, forecasts, hard limits.", icon: "Gauge" },
  { slug: "compliance", label: "Compliance", href: "/compliance", group: "governance", minTier: "sovereign", description: "Frameworks, evidence packages, scheduled exports.", icon: "ShieldCheck" },
  { slug: "locker", label: "Locker Security", href: "/locker", group: "governance", minTier: "sovereign", description: "Controls, monitoring, threats, users.", icon: "Lock" },
  { slug: "content-safety", label: "Content Safety", href: "/content-safety", group: "governance", minTier: "pro", description: "Scanning, age-verification.", icon: "ShieldAlert" },
  { slug: "privacy", label: "Privacy Controls", href: "/privacy", group: "governance", minTier: "sovereign", description: "Data residency, redaction, retention.", icon: "EyeOff" },
  { slug: "security", label: "Security Center", href: "/security", group: "governance", minTier: "sovereign", description: "Alerts, vault, governance frames.", icon: "Shield" },
  { slug: "governance", label: "Governance", href: "/governance", group: "governance", minTier: "sovereign", description: "Zeno + Gladiator governance frames.", icon: "Scale" },

  // ACCOUNT
  { slug: "team", label: "Team & RBAC", href: "/team", group: "account", minTier: "pro", description: "Members, roles, SSO, SCIM, MFA.", icon: "Users" },
  { slug: "api-keys", label: "API Keys", href: "/api-keys", group: "account", minTier: "starter", description: "Issue, rotate, revoke keys.", icon: "KeyRound" },
  { slug: "webhooks", label: "Webhooks", href: "/webhooks", group: "account", minTier: "pro", description: "Alert and event webhook endpoints.", icon: "Webhook" },
  { slug: "subscriptions", label: "Subscription", href: "/subscriptions", group: "account", minTier: "free", description: "Current plan, change tier, billing portal.", icon: "CreditCard" },
  { slug: "workspace", label: "Workspace Settings", href: "/workspace", group: "account", minTier: "starter", description: "Models, providers, observability, integrations.", icon: "Settings" },

  // VENDOR
  { slug: "vendor-onboarding", label: "Vendor Onboarding", href: "/vendor/onboarding", group: "vendor", minTier: "starter", description: "Become a marketplace vendor.", icon: "Rocket" },
  { slug: "vendor-listings", label: "My Listings", href: "/vendor/listings", group: "vendor", minTier: "starter", description: "Submit, review, manage your marketplace listings.", icon: "Store" },
  { slug: "vendor-payouts", label: "Payouts", href: "/vendor/payouts", group: "vendor", minTier: "starter", description: "Stripe Connect payouts and reconciliation.", icon: "Banknote" },
  { slug: "vendor-stripe", label: "Stripe Connect", href: "/vendor/stripe", group: "vendor", minTier: "starter", description: "Connect onboarding & status.", icon: "Link2" },

  // ADMIN (superuser only)
  { slug: "admin", label: "Admin", href: "/admin", group: "admin", minTier: "enterprise", description: "Workspaces, users, billing recon (superuser).", icon: "ShieldQuestion" },
];

export function modulesByGroup() {
  const groups: Record<string, ModuleDef[]> = {};
  for (const m of MODULES) (groups[m.group] ||= []).push(m);
  return groups;
}
