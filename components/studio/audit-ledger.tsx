"use client";
import { Card, Table } from "@/components/ui";
import useSWR from "swr";
import { api } from "@/lib/api";
import { HardDrive, PlayCircle } from "lucide-react";

export function AuditLedger() {
  const { data: logs } = useSWR<any[]>("/api/v1/audit?limit=5", api);
  const packets = (logs || []).map((log) => ({
    hash: log.hmac_hash || log.id,
    event: log.operation_type,
    tenant: log.workspace_id || "System",
    time: log.created_at ? new Date(log.created_at).toLocaleTimeString() : "Just now"
  }));

  return (
    <Card className="flex flex-col h-full border-border">
      <div className="flex items-center gap-2 mb-4">
        <HardDrive className="text-brand-400" size={18} />
        <h2 className="text-lg font-medium text-white">Audit Sealing Ledger</h2>
      </div>
      <p className="text-sm text-ink-300 mb-4">Immutable, cryptographically sealed packets making execution history mathematically unforgeable for SOC2/HIPAA.</p>
      
      <div className="flex-1">
        <Table
          rows={packets}
          rowKey={(r) => r.hash}
          columns={[
            { key: "hash", header: "SHA256 Hash", render: (r) => <span className="font-mono text-xs text-ink-300">{r.hash}</span> },
            { key: "event", header: "Event", render: (r) => <span className="text-white text-sm">{r.event}</span> },
            { key: "tenant", header: "Tenant", render: (r) => <span className="text-ink-400 text-xs">{r.tenant}</span> },
            { key: "replay", header: "Forensics", render: (r) => (
              <button className="text-brand-400 hover:text-brand-300 flex items-center gap-1 text-xs">
                <PlayCircle size={14} /> Replay
              </button>
            ) },
          ]}
        />
      </div>
    </Card>
  );
}
