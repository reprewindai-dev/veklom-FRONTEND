import type { Tier } from "./tiers";

export interface ModuleDef {
  slug: string;
  label: string;
  href: string;
  group: "overview" | "build" | "marketplace" | "run" | "insights" | "govern" | "workspace" | "admin";
  minTier: Tier;
  description: string;
  icon: string;
  sidebar?: boolean;
}

// All pages remain indexed here for command search and deep links.
// Only sidebar=true modules appear in the primary rail.
export const MODULES: ModuleDef[] = [
  { slug: "dashboard", label: "Overview", href: "/dashboard", group: "overview", minTier: "starter", description: "Workspace health, activity, spend, routing, policy, and audit summary.", icon: "LayoutDashboard", sidebar: true },
  { slug: "spine", label: "Asset Spine", href: "/spine", group: "overview", minTier: "starter", description: "The governed control-plane spine: source, risk gate, wrapper, marketplace, deployment, runtime, evidence.", icon: "GitBranch", sidebar: true },

  { slug: "gpc", label: "Plan Compiler (GPC)", href: "/gpc", group: "build", minTier: "pro", description: "Compile intent into deterministic, policy-checked execution plans.", icon: "GitBranch" },
  { slug: "pipelines", label: "Pipelines", href: "/pipelines", group: "build", minTier: "pro", description: "Visual builder for governed inference chains, tools, routing, and evidence.", icon: "Workflow", sidebar: true },

  { slug: "marketplace", label: "Marketplace", href: "/marketplace", group: "marketplace", minTier: "free", description: "Sovereign-ready assets, distribution, vendor listings, payouts, and installs.", icon: "Store", sidebar: true },
  { slug: "vendor-listings", label: "My Listings", href: "/vendor/listings", group: "marketplace", minTier: "starter", description: "Submit, review, and manage marketplace listings.", icon: "Tags" },
  { slug: "vendor-onboarding", label: "Vendor Onboarding", href: "/vendor/onboarding", group: "marketplace", minTier: "starter", description: "Become a marketplace vendor.", icon: "Rocket" },
  { slug: "vendor-payouts", label: "Payouts", href: "/vendor/payouts", group: "marketplace", minTier: "starter", description: "Stripe Connect payouts and reconciliation.", icon: "Banknote" },
  { slug: "vendor-stripe", label: "Stripe Connect", href: "/vendor/stripe", group: "marketplace", minTier: "starter", description: "Connect onboarding and vendor status.", icon: "Link2" },

  { slug: "runtime", label: "Runtime", href: "/runtime", group: "run", minTier: "free", description: "Deployments, terminal, routing, usage, and autonomous runtime controls.", icon: "Terminal", sidebar: true },
  { slug: "deployments", label: "Deployments", href: "/deployments", group: "run", minTier: "pro", description: "BYOS deployment tracking, endpoints, code, and webhooks.", icon: "Server" },
  { slug: "playground", label: "Playground", href: "/playground", group: "run", minTier: "free", description: "Governed inference console with routing, policy, and cost per call.", icon: "FlaskConical", sidebar: true },
  { slug: "routing", label: "Smart Routing", href: "/routing", group: "run", minTier: "pro", description: "Provider routing rules, policies, and economics.", icon: "Network" },
  { slug: "autonomous", label: "Autonomous Jobs", href: "/autonomous", group: "run", minTier: "pro", description: "Execute, monitor, and override autonomous runs.", icon: "Bot" },

  { slug: "insights", label: "Insights", href: "/insights", group: "insights", minTier: "pro", description: "Proactive pulse, signals, forecasts, and recommended actions.", icon: "Activity" },
  { slug: "usage", label: "Usage Analytics", href: "/usage", group: "insights", minTier: "pro", description: "Per-endpoint usage, cost, and throughput.", icon: "BarChart3" },
  { slug: "status", label: "System Status", href: "/status", group: "insights", minTier: "free", description: "Platform health, uptime, components, and latency.", icon: "HeartPulse" },

  { slug: "governance", label: "Governance", href: "/governance", group: "govern", minTier: "sovereign", description: "Audit, compliance, privacy, safety, security, and kill-switch controls.", icon: "Scale", sidebar: true },
  { slug: "audit", label: "Audit Log", href: "/audit", group: "govern", minTier: "pro", description: "Tamper-evident audit trail and compliance reports.", icon: "FileSearch" },
  { slug: "compliance", label: "Compliance", href: "/compliance", group: "govern", minTier: "sovereign", description: "Frameworks, evidence packages, and scheduled exports.", icon: "ShieldCheck" },
  { slug: "security", label: "Security Center", href: "/security", group: "govern", minTier: "sovereign", description: "Alerts, vault, and governance frames.", icon: "Shield" },
  { slug: "locker", label: "Locker Security", href: "/locker", group: "govern", minTier: "sovereign", description: "Controls, monitoring, threats, and users.", icon: "Lock" },
  { slug: "content-safety", label: "Content Safety", href: "/content-safety", group: "govern", minTier: "pro", description: "Scanning and age-verification.", icon: "ShieldAlert" },
  { slug: "privacy", label: "Privacy Controls", href: "/privacy", group: "govern", minTier: "sovereign", description: "Data residency, redaction, and retention.", icon: "EyeOff" },
  { slug: "kill-switch", label: "Kill Switch", href: "/kill-switch", group: "govern", minTier: "sovereign", description: "Halt execution with audit proof.", icon: "PowerOff" },

  { slug: "workspace", label: "Workspace", href: "/workspace", group: "workspace", minTier: "starter", description: "Team, access, keys, providers, models, billing, and budget controls.", icon: "Settings", sidebar: true },
  { slug: "team", label: "Team & RBAC", href: "/team", group: "workspace", minTier: "pro", description: "Members, roles, SSO, SCIM, and MFA.", icon: "Users" },
  { slug: "api-keys", label: "API Keys", href: "/api-keys", group: "workspace", minTier: "starter", description: "Issue, rotate, and revoke keys.", icon: "KeyRound" },
  { slug: "webhooks", label: "Webhooks", href: "/webhooks", group: "workspace", minTier: "pro", description: "Alert and event webhook endpoints.", icon: "Webhook" },
  { slug: "wallet", label: "Token Wallet", href: "/wallet", group: "workspace", minTier: "starter", description: "Balance, top-ups, and transactions.", icon: "Wallet" },
  { slug: "billing", label: "Billing", href: "/billing", group: "workspace", minTier: "starter", description: "Invoices, breakdown, and allocation.", icon: "Receipt" },
  { slug: "budget", label: "Budget Caps", href: "/budget", group: "workspace", minTier: "pro", description: "Caps, forecasts, and hard limits.", icon: "Gauge" },
  { slug: "subscriptions", label: "Subscription", href: "/subscriptions", group: "workspace", minTier: "free", description: "Current plan, tier changes, and billing portal.", icon: "CreditCard" },

  { slug: "admin", label: "Admin", href: "/admin", group: "admin", minTier: "enterprise", description: "Workspaces, users, and billing reconciliation for superusers.", icon: "ShieldQuestion", sidebar: true },
];

export function modulesByGroup() {
  const groups: Record<string, ModuleDef[]> = {};
  for (const m of MODULES.filter((mod) => mod.sidebar)) (groups[m.group] ||= []).push(m);
  return groups;
}
