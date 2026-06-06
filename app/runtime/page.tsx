"use client";

import Link from "next/link";
import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui";
import { ModuleHeader, Pill, SectionCard, KV } from "@/components/telemetry";
import { BarChart3, Bot, ChevronRight, FlaskConical, Network, Server, Terminal } from "lucide-react";

const SURFACES = [
  {
    title: "Deployments",
    href: "/deployments",
    icon: Server,
    action: "Open deployments",
    copy: "Running instances, endpoints, webhooks, deploy code, pause, resume, and teardown controls.",
    proof: "Deployment state, endpoint health, webhooks, and recent incidents.",
  },
  {
    title: "Playground",
    href: "/playground",
    icon: FlaskConical,
    action: "Open runtime console",
    copy: "Governed inference console for exercising models and seeing policy, route, and cost per call.",
    proof: "Execution request, policy decision, route, latency, cost, and audit write.",
  },
  {
    title: "Smart Routing",
    href: "/routing",
    icon: Network,
    action: "Tune routing",
    copy: "Provider routing rules, economics, fallback behavior, and policy-bound optimization.",
    proof: "Provider split, savings, latency, and routing decisions.",
  },
  {
    title: "Usage",
    href: "/usage",
    icon: BarChart3,
    action: "Inspect usage",
    copy: "Spend, throughput, endpoint activity, and budget pressure in the same runtime context.",
    proof: "Cost by endpoint, provider, time window, and budget cap.",
  },
  {
    title: "Autonomous Jobs",
    href: "/autonomous",
    icon: Bot,
    action: "Review jobs",
    copy: "Automated runs, retraining controls, overrides, and governed remediation behavior.",
    proof: "Job state, model retraining result, and operator overrides.",
  },
];

export default function RuntimePage() {
  const deployments = useApi<any>("/api/v1/deployments");
  const activity = useApi<any>("/api/v1/command-center/activity-feed");
  const usage = useApi<any>("/api/v1/billing/usage");

  return (
    <Shell>
      <TierGate required="free" feature="Runtime">
        <ModuleHeader
          breadcrumb="Run / Runtime"
          title="Runtime"
          subtitle="Deploy, exercise, route, measure, and govern running assets from one operating surface."
          pills={
            <>
              <Pill tone={deployments.error ? "amber" : "green"}>Deployments</Pill>
              <Pill tone={activity.error ? "amber" : "cyan"}>Activity</Pill>
              <Pill tone={usage.error ? "amber" : "neutral"}>Usage</Pill>
            </>
          }
        />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {SURFACES.map((surface) => {
              const Icon = surface.icon;
              return (
                <SectionCard
                  key={surface.href}
                  label="Runtime surface"
                  title={
                    <span className="flex items-center gap-2">
                      <Icon size={16} className="text-brand-400" />
                      {surface.title}
                    </span>
                  }
                  actions={
                    <Link href={surface.href}>
                      <Button variant="ghost"><ChevronRight size={14} /> {surface.action}</Button>
                    </Link>
                  }
                >
                  <p className="text-[13px] text-ink-400 leading-relaxed">{surface.copy}</p>
                  <div className="mt-4 rounded-lg border border-border bg-white/[0.02] p-3">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-ink-600 mb-1.5">Inline proof</div>
                    <div className="text-[12px] text-ink-300">{surface.proof}</div>
                  </div>
                </SectionCard>
              );
            })}
          </div>

          <div className="space-y-4">
            <SectionCard label="Current state" title="Runtime proof summary">
              <div className="space-y-1">
                <KV k="Deployments route" v="/api/v1/deployments" />
                <KV k="Activity route" v="/api/v1/command-center/activity-feed" />
                <KV k="Usage route" v="/api/v1/billing/usage" />
                <KV k="Execution route" v="/api/v1/exec" />
              </div>
              <p className="mt-4 text-[12px] text-ink-500">
                This page is a control hub. It does not claim the runtime chain is fully proven unless the underlying route returns evidence.
              </p>
            </SectionCard>

            <SectionCard label="Primary action" title="Open runtime console">
              <p className="text-[12px] text-ink-400 mb-3">
                Use the console to exercise a deployed asset and generate audit evidence for the run.
              </p>
              <Link href="/playground">
                <Button className="w-full"><Terminal size={14} /> Open runtime</Button>
              </Link>
            </SectionCard>

            <SectionCard label="Telemetry" title="Recent activity">
              {activity.isLoading ? (
                <div className="text-[12px] text-ink-500">Checking runtime activity...</div>
              ) : activity.error ? (
                <div className="text-[12px] text-brand-400">Activity route needs proof.</div>
              ) : (
                <pre className="text-[11px] text-ink-400 bg-bg-900 border border-border rounded-lg p-3 overflow-auto max-h-56 whitespace-pre-wrap break-all">
                  {JSON.stringify(activity.data || { status: "No activity returned" }, null, 2).slice(0, 1400)}
                </pre>
              )}
            </SectionCard>
          </div>
        </div>
      </TierGate>
    </Shell>
  );
}
