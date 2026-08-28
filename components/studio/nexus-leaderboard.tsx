"use client";
import { Card, Table } from"@/components/ui";
import { BarChart2, CheckCircle2, ShieldAlert } from"lucide-react";
import useSWR from"swr";
import { fetcher } from"@/lib/api";

export function NexusLeaderboard() {
 const { data, isLoading } = useSWR<any>("/api/v1/vnp/beacon?mode=advisory", fetcher);

 const routes = data?.routes || [];

 return (
 <Card className="flex flex-col h-full border-border">
 <div className="flex items-center gap-2 mb-4">
 <BarChart2 className="text-brand-400" size={18} />
 <h2 className="text-lg font-medium text-white">Nexus Protocol: BYOS Certification</h2>
 </div>
 <p className="text-sm text-ink-300 mb-4">Is this framework safe for production? Benchmarking custom agent stacks on policy adherence and overhead.</p>
 
 <div className="flex-1">
 {isLoading ? (
 <div className="text-ink-400 text-sm">Loading beacon routes...</div>
 ) : routes.length === 0 ? (
 <div className="text-ink-400 text-sm">No routes found.</div>
 ) : (
 <Table
 rows={routes}
 rowKey={(r: any) => r.api_id}
 columns={[
 { key:"stack", header:"Framework / Model", render: (r: any) => <span className="text-white font-medium">{r.provider ||"Unknown"}</span> },
 { key:"adherence", header:"Policy Adherence", render: (r: any) => (
 <span className={r.composite_score > 90 ?"text-accent-green" :"text-accent-red"}>{r.composite_score || 0}%</span>
 ) },
 { key:"stability", header:"Stability", render: (r: any) => <span className="text-ink-300">{r.stability ||"Unknown"}</span> },
 { key:"safe", header:"Prod Ready", render: (r: any) => (
 r.stability ==="Stable" || r.composite_score > 95 ? <CheckCircle2 className="text-accent-green" size={16} /> : <ShieldAlert className="text-accent-red" size={16} />
 ) },
 ]}
 />
 )}
 </div>
 </Card>
 );
}
