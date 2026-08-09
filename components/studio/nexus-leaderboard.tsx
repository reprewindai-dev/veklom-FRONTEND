"use client";
import { Card, Table } from "@/components/ui";
import useSWR from "swr";
import { api } from "@/lib/api";
import { BarChart2, CheckCircle2, ShieldAlert } from "lucide-react";

export function NexusLeaderboard() {
  const { data: rows = [] } = useSWR<any[]>("/api/v1/benchmarks/leaderboard", api);

  return (
    <Card className="flex flex-col h-full border-border">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="text-brand-400" size={18} />
        <h2 className="text-lg font-medium text-white">Nexus Protocol: BYOS Certification</h2>
      </div>
      <p className="text-sm text-ink-300 mb-4">Is this framework safe for production? Benchmarking custom agent stacks on policy adherence and overhead.</p>
      
      <div className="flex-1">
        <Table
          rows={rows}
          rowKey={(r) => r.stack}
          columns={[
            { key: "stack", header: "Framework / Model", render: (r) => <span className="text-white font-medium">{r.stack}</span> },
            { key: "adherence", header: "Policy Adherence", render: (r) => (
              <span className={parseFloat(r.adherence) > 95 ? "text-accent-green" : "text-accent-red"}>{r.adherence}</span>
            ) },
            { key: "latency", header: "Overhead", render: (r) => <span className="text-ink-300">{r.latency}</span> },
            { key: "safe", header: "Prod Ready", render: (r) => (
              r.safe ? <CheckCircle2 className="text-accent-green" size={16} /> : <ShieldAlert className="text-accent-red" size={16} />
            ) },
          ]}
        />
      </div>
    </Card>
  );
}
