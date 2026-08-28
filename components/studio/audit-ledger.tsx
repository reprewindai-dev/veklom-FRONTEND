"use client";
import { Card, Table } from"@/components/ui";
import { HardDrive, PlayCircle } from"lucide-react";
import useSWR from"swr";
import { fetcher } from"@/lib/api";

export function AuditLedger() {
 const { data, isLoading } = useSWR<any>("/api/v1/pgl/status", fetcher);

 const packets = data?.events || [];

 return (
 <Card className="flex flex-col h-full border-border">
 <div className="flex items-center gap-2 mb-4">
 <HardDrive className="text-brand-400" size={18} />
 <h2 className="text-lg font-medium text-white">Audit Sealing Ledger</h2>
 </div>
 <p className="text-sm text-ink-300 mb-4">Immutable, cryptographically sealed packets making execution history mathematically unforgeable for SOC2/HIPAA.</p>
 
 <div className="flex-1">
 {isLoading ? (
 <div className="text-ink-400 text-sm">Loading ledger...</div>
 ) : packets.length === 0 ? (
 <div className="text-ink-400 text-sm">No ledger events found.</div>
 ) : (
 <Table
 rows={packets}
 rowKey={(r: any) => r.hash}
 columns={[
 { key:"hash", header:"SHA256 Hash", render: (r: any) => <span className="font-mono text-xs text-ink-300">{r.hash}</span> },
 { key:"event", header:"Event", render: (r: any) => <span className="text-white text-sm">{r.event}</span> },
 { key:"tenant", header:"Tenant", render: (r: any) => <span className="text-ink-400 text-xs">{r.tenant}</span> },
 { key:"replay", header:"Forensics", render: (r: any) => (
 <button className="text-brand-400 hover:text-brand-300 flex items-center gap-1 text-xs">
 <PlayCircle size={14} /> Replay
 </button>
 ) },
 ]}
 />
 )}
 </div>
 </Card>
 );
}
