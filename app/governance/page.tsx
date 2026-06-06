"use client";

import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import { useApi } from "@/hooks/useApi";
import { Button, Card, PageHeader, Skeleton, Table } from "@/components/ui";
import { unwrapList } from "@/types/api";
import Link from "next/link";
import { ChevronRight, EyeOff, FileSearch, Lock, PowerOff, Shield, ShieldAlert, ShieldCheck } from "lucide-react";

const GOVERN_SURFACES = [
  { href: "/audit", label: "Audit Log", icon: FileSearch, proof: "Tamper-evident events, verification, and compliance reports." },
  { href: "/compliance", label: "Compliance", icon: ShieldCheck, proof: "Framework coverage, evidence packages, and scheduled exports." },
  { href: "/privacy", label: "Privacy Controls", icon: EyeOff, proof: "Residency, redaction, retention, and data subject controls." },
  { href: "/content-safety", label: "Content Safety", icon: ShieldAlert, proof: "Scanning, safety enforcement, and age-verification controls." },
  { href: "/security", label: "Security Center", icon: Shield, proof: "Alerts, vault posture, and security frames." },
  { href: "/locker", label: "Locker Security", icon: Lock, proof: "Threat monitoring, controls, users, and enforcement." },
  { href: "/kill-switch", label: "Kill Switch", icon: PowerOff, proof: "Halt execution with audit proof and operator accountability." },
];

export default function GovernancePage() {
  const health = useApi<any>("/api/v1/governance/health");
  const benchmarks = useApi<any>("/api/v1/governance/gladiator/benchmarks");
  const routes = useApi<any>("/api/v1/governance/gladiator/routes");

  return (
    <Shell>
      <TierGate required="sovereign" feature="Governance">
        <PageHeader title="Governance" subtitle="Gladiator routes, Zeno coherence, and overall governance health." />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
          {GOVERN_SURFACES.map((surface) => {
            const Icon = surface.icon;
            return (
              <Card key={surface.href} className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg glass grid place-items-center text-brand-400 shrink-0">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink-50">{surface.label}</div>
                    <p className="text-[12px] text-ink-500 mt-1">{surface.proof}</p>
                  </div>
                </div>
                <Link href={surface.href} className="mt-auto">
                  <Button variant="ghost" className="w-full"><ChevronRight size={14} /> Open {surface.label}</Button>
                </Link>
              </Card>
            );
          })}
        </div>
        <Card className="mb-4">
          <div className="text-sm font-medium mb-2">Health</div>
          <pre className="text-xs bg-bg-900 p-3 rounded-md overflow-x-auto">{JSON.stringify(health.data, null, 2)}</pre>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-0">
            <div className="p-5 pb-3 text-sm font-medium">Benchmarks</div>
            {benchmarks.isLoading ? <div className="p-5"><Skeleton className="h-32 w-full" /></div> :
              <Table rows={unwrapList<any>(benchmarks.data)} rowKey={(r) => r.id || r.name} empty="No benchmarks" columns={[
                { key: "name", header: "Benchmark", render: (r) => r.name },
                { key: "score", header: "Score", render: (r) => r.score },
                { key: "ts", header: "When", render: (r) => <span className="text-ink-400 text-xs">{r.ts || r.created_at}</span> },
              ]} />
            }
          </Card>
          <Card className="p-0">
            <div className="p-5 pb-3 text-sm font-medium">Forged routes</div>
            {routes.isLoading ? <div className="p-5"><Skeleton className="h-32 w-full" /></div> :
              <Table rows={unwrapList<any>(routes.data)} rowKey={(r) => r.id || r.route_id} empty="No routes" columns={[
                { key: "name", header: "Route", render: (r) => r.name || r.id },
                { key: "status", header: "Status", render: (r) => r.status },
                { key: "load", header: "Load", render: (r) => r.load ?? "—" },
              ]} />
            }
          </Card>
        </div>
      </TierGate>
    </Shell>
  );
}
