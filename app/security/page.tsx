"use client";

import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import { useApi } from "@/hooks/useApi";
import { Skeleton, Table, Button } from "@/components/ui";
import { api } from "@/lib/api";
import { useState } from "react";
import { ModuleHeader, SectionCard, StatTile, Pill, ProgressBar, fmtNum, ACCENT } from "@/components/telemetry";
import { ShieldCheck, ShieldAlert, AlertTriangle, CircleCheck, Activity } from "lucide-react";

function sevTone(s?: string) {
  const v = (s || "").toLowerCase();
  if (v === "critical" || v === "high") return "red";
  if (v === "medium") return "amber";
  if (v === "low") return "cyan";
  return "neutral";
}

export default function SecurityPage() {
  const dash = useApi<any>("/api/v1/security/dashboard");
  const stats = useApi<any>("/api/v1/security/stats");
  const events = useApi<any>("/api/v1/security/events?status=open");
  const [busyId, setBusyId] = useState<string>();

  const st = stats.data || {};
  const d = dash.data || {};
  const evs: any[] = Array.isArray(events.data) ? events.data : [];
  const controls: any[] = d.controls || [];
  const byType: Record<string, number> = st.by_type || {};
  const score = st.security_score ?? d.security_score ?? 0;

  async function resolve(id: string) {
    setBusyId(id);
    try {
      await api(`/api/v1/security/events/${id}/resolve`, { method: "POST", body: { resolution_notes: "Resolved from Security Center" } });
      events.mutate(); stats.mutate();
    } catch { /* surfaced via row */ } finally { setBusyId(undefined); }
  }

  return (
    <Shell>
      <TierGate required="sovereign" feature="Security Center">
        <ModuleHeader
          breadcrumb="Governance · Security Center"
          title="Threat detection & posture"
          subtitle="Live security events, posture controls, and incident triage across the workspace."
          pills={
            <>
              <Pill tone={score >= 90 ? "green" : score >= 70 ? "amber" : "red"} dot>Posture {score}</Pill>
              <Pill tone="neutral">{st.open ?? evs.length} open</Pill>
              <Pill tone={st.critical ? "red" : "green"}>{st.critical ?? 0} critical</Pill>
            </>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatTile label="Posture score" icon={<ShieldCheck size={14} />} value={score} />
          <StatTile label="Events (total)" icon={<Activity size={14} />} value={fmtNum(st.total ?? 0)} />
          <StatTile label="Open" icon={<ShieldAlert size={14} />} value={fmtNum(st.open ?? 0)} />
          <StatTile label="Last 24h" icon={<AlertTriangle size={14} />} value={fmtNum(st.last_24h ?? d.total_events_24h ?? 0)} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mb-4">
          <SectionCard label="Posture" title="Controls" className="lg:col-span-2" bodyClassName="grid sm:grid-cols-2 gap-2">
            {dash.isLoading ? <Skeleton className="h-24" /> : controls.map((c) => (
              <div key={c.name} className="flex items-center gap-2.5 card p-3">
                {c.enabled ? <CircleCheck size={15} className="text-accent-green" /> : <AlertTriangle size={15} className="text-brand-400" />}
                <div className="min-w-0">
                  <div className="text-[13px] text-ink-50">{c.display_name || c.name}</div>
                  <div className="text-[10px] text-ink-600 uppercase tracking-wider">{c.category}</div>
                </div>
                <Pill tone={c.enabled ? "green" : "amber"} className="ml-auto">{c.enabled ? "on" : "off"}</Pill>
              </div>
            ))}
          </SectionCard>

          <SectionCard label="Threats" title="By type">
            {Object.keys(byType).length === 0 ? <div className="text-ink-500 text-[13px]">No threats recorded.</div> : (
              <div className="space-y-3">
                {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => {
                  const max = Math.max(...Object.values(byType), 1);
                  return (
                    <div key={k}>
                      <div className="flex justify-between text-[12px] mb-1"><span className="capitalize text-ink-200">{k.replace(/_/g, " ")}</span><span className="font-mono">{v}</span></div>
                      <ProgressBar percent={(v / max) * 100} color={ACCENT.red} />
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard label="Triage" title="Open security events" bodyClassName="p-0">
          {events.isLoading ? <div className="p-5"><Skeleton className="h-32 w-full" /></div> :
            <Table
              rows={evs}
              rowKey={(r) => r.id}
              empty="No open events — workspace is clean."
              columns={[
                { key: "time", header: "Time", render: (r) => <span className="text-ink-500 text-xs">{(r.created_at || "").slice(0, 19).replace("T", " ")}</span> },
                { key: "type", header: "Event", render: (r) => <span className="text-ink-100">{(r.event_type || "").replace(/_/g, " ")}</span> },
                { key: "threat", header: "Threat", render: (r) => <span className="font-mono text-xs text-ink-400">{r.threat_type}</span> },
                { key: "desc", header: "Description", render: (r) => <span className="text-ink-300">{r.description}</span> },
                { key: "sev", header: "Severity", render: (r) => <Pill tone={sevTone(r.severity) as any}>{r.severity}</Pill> },
                { key: "act", header: "", width: "110px", render: (r) => <Button variant="ghost" onClick={() => resolve(r.id)} loading={busyId === r.id}>Resolve</Button> },
              ]}
            />
          }
        </SectionCard>
      </TierGate>
    </Shell>
  );
}
