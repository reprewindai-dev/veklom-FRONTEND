"use client";
import { Card, Table, ErrorBox } from "@/components/ui";
import { Activity } from "lucide-react";
import useSWR from 'swr';

import { fetcher } from '@/lib/api';

export function PglLineageTracker() {
  const { data: registry, error } = useSWR('/api/v1/pgl/registry', fetcher, {
    refreshInterval: 10000
  });

  // Merge real backend registry into table if available
  const displayData = registry && registry.length > 0 
    ? registry.map((r: any) => ({
        id: "pgl_id_" + r.id.substring(0, 8),
        agent: "Identity",
        workspace: r.tenant_id,
        action: r.status === "QUARANTINED" ? r.containment_reason : "Active Registration",
        time: r.created_at ? new Date(r.created_at).toLocaleTimeString() : "N/A",
      }))
    : [];

  return (
    <Card className="flex flex-col h-full border-border">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="text-brand-400" size={18} />
        <h2 className="text-lg font-medium text-white">PGL Lineage Tracker</h2>
      </div>
      <p className="text-sm text-ink-300 mb-4">Identity & Forensics: Map of certified, governed AI identities tracing exact operational rights.</p>
      
      {error && <ErrorBox message={error.message || "Failed to load PGL Registry"} />}
      
      <div className="flex-1 overflow-auto">
        <Table
          rows={displayData}
          rowKey={(r: any) => r.id}
          columns={[
            { key: "cert", header: "PGL Anchor", render: (r: any) => <span className="font-mono text-xs text-brand-300">{r.id}</span> },
            { key: "agent", header: "Genome", render: (r: any) => <span className="text-white font-medium">{r.agent}</span> },
            { key: "workspace", header: "Workspace", render: (r: any) => <span className="text-ink-300 font-mono text-xs">{r.workspace}</span> },
            { key: "action", header: "Status/Action", render: (r: any) => r.action },
            { key: "time", header: "Time", render: (r: any) => <span className="text-ink-400">{r.time}</span> },
          ]}
        />
      </div>
    </Card>
  );
}
