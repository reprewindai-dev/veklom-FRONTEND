"use client";

import Shell from "@/components/Shell";
import { useApi } from "@/hooks/useApi";
import { Card, Skeleton, Table, Button } from "@/components/ui";
import { unwrapList } from "@/types/api";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { ModuleHeader, SectionCard, StatTile, Pill, fmtNum } from "@/components/telemetry";
import { Building2, Users, AlertTriangle, FileSearch, ShieldQuestion } from "lucide-react";

export default function AdminPage() {
  const { me } = useAuth();
  const isAdmin = !!(me?.is_superuser);
  const workspaces = useApi<any>(isAdmin ? "/api/v1/admin/workspaces" : null);
  const users = useApi<any>(isAdmin ? "/api/v1/admin/users" : null);
  const audit = useApi<any>(isAdmin ? "/api/v1/admin/audit" : null);
  const recon = useApi<any>(isAdmin ? "/api/v1/admin/recon_findings" : null);

  if (!isAdmin) {
    return (
      <Shell>
        <Card className="max-w-md mx-auto text-center py-10">
          <ShieldQuestion size={28} className="mx-auto text-ink-500 mb-3" />
          <div className="text-lg font-semibold">Admin restricted</div>
          <div className="text-ink-400 text-sm mt-1">Only superusers can access this area.</div>
          <Link href="/dashboard" className="text-brand-400 hover:underline text-sm mt-3 inline-block">Back to dashboard</Link>
        </Card>
      </Shell>
    );
  }

  const wsRows = unwrapList<any>(workspaces.data);
  const userRows = unwrapList<any>(users.data);
  const reconRows = unwrapList<any>(recon.data);

  async function suspend(id: string) { await api(`/api/v1/admin/workspaces/${id}/suspend`, { method: "POST" }).catch(() => {}); workspaces.mutate(); }
  async function deactivate(id: string) { await api(`/api/v1/admin/users/${id}/deactivate`, { method: "POST" }).catch(() => {}); users.mutate(); }

  return (
    <Shell>
      <ModuleHeader
        breadcrumb="Admin · Superuser"
        title="Platform administration"
        subtitle="Workspaces, users, billing reconciliation, and the global audit trail. Superuser-only."
        pills={<Pill tone="red" dot>Superuser</Pill>}
      />

      <div className="mb-4 bg-accent-amber/10 border border-accent-amber/30 rounded-xl p-4 text-xs text-brand-400">
        <strong>Demo Tenant Notice:</strong> The workspaces and users listed below (e.g. Acme Corp / Globex / ws-demo) represent demo/sample tenant data seeded for testing and evaluation purposes. They do not represent production customers or live client traffic.
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatTile label="Workspaces" icon={<Building2 size={14} />} value={fmtNum(wsRows.length)} />
        <StatTile label="Users" icon={<Users size={14} />} value={fmtNum(userRows.length)} />
        <StatTile label="Recon findings" icon={<AlertTriangle size={14} />} value={fmtNum(reconRows.length)} />
        <StatTile label="Audit (recent)" icon={<FileSearch size={14} />} value={fmtNum(unwrapList(audit.data).length)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <SectionCard label="Tenants (Sample data)" title="Workspaces" bodyClassName="p-0">
          {workspaces.isLoading ? <div className="p-5"><Skeleton className="h-32 w-full" /></div> :
            <Table rows={wsRows} rowKey={(r) => r.id} empty="No workspaces" columns={[
              { key: "name", header: "Workspace", render: (r) => <div><div className="text-ink-100">{r.name} <span className="text-[10px] text-brand-400 font-mono">[DEMO]</span></div><code className="text-[10px] text-ink-600">{r.id}</code></div> },
              { key: "plan", header: "Plan", render: (r) => <Pill tone="amber">{r.plan || r.tier}</Pill> },
              { key: "status", header: "Status", render: (r) => <Pill tone={r.is_active === false ? "red" : "green"}>{r.is_active === false ? "suspended" : "active"}</Pill> },
              { key: "act", header: "", width: "100px", render: (r) => <Button variant="danger" onClick={() => suspend(r.id)}>Suspend</Button> },
            ]} />
          }
        </SectionCard>
        <SectionCard label="People" title="Users" bodyClassName="p-0">
          {users.isLoading ? <div className="p-5"><Skeleton className="h-32 w-full" /></div> :
            <Table rows={userRows} rowKey={(r) => r.id} empty="No users" columns={[
              { key: "email", header: "Email", render: (r) => <span className="text-ink-100">{r.email}</span> },
              { key: "role", header: "Role", render: (r) => <Pill tone="neutral">{r.role}</Pill> },
              { key: "status", header: "Status", render: (r) => <Pill tone={r.status === "active" ? "green" : "neutral"}>{r.status || "—"}</Pill> },
              { key: "act", header: "", width: "110px", render: (r) => <Button variant="ghost" onClick={() => deactivate(r.id)}>Deactivate</Button> },
            ]} />
          }
        </SectionCard>
      </div>

      <SectionCard label="Billing integrity" title="Reconciliation findings" bodyClassName="p-0">
        {recon.isLoading ? <div className="p-5"><Skeleton className="h-24 w-full" /></div> :
          <Table rows={reconRows} rowKey={(r) => r.tx_hash || JSON.stringify(r).slice(0, 24)} empty="No reconciliation discrepancies — ledger matches chain." columns={[
            { key: "tx", header: "Tx hash", render: (r) => <code className="text-[11px] text-ink-400">{(r.tx_hash || "").slice(0, 24)}…</code> },
            { key: "ledger", header: "Ledger sum", render: (r) => r.ledger_sum },
            { key: "chain", header: "Chain sum", render: (r) => r.chain_sum },
            { key: "at", header: "Detected", render: (r) => <span className="text-ink-500 text-xs">{(r.detected_at || "").slice(0, 19).replace("T", " ")}</span> },
          ]} />
        }
      </SectionCard>
    </Shell>
  );
}
