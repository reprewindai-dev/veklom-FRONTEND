"use client";
import { Card, Table } from "@/components/ui";
import { DollarSign } from "lucide-react";

import useSWR from "swr";
import { fetcher } from "@/lib/api";

export function X402Tracker() {
  const { data, isLoading } = useSWR<any>("/api/v1/x402/spend", fetcher);
  const rows = data?.runs || [];

  return (
    <Card className="flex flex-col h-full border-border">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="text-brand-400" size={18} />
        <h2 className="text-lg font-medium text-white">x402 FinOps Micropayments</h2>
      </div>
      <p className="text-sm text-ink-300 mb-4">Base Network USDC Ledger: Granular budgets enforcing hard runtime constraints on infinite loops.</p>
      
      <div className="flex-1">
        {isLoading ? (
          <div className="text-ink-400 text-sm">Loading ledger...</div>
        ) : rows.length === 0 ? (
          <div className="text-ink-400 text-sm">No active micropayments.</div>
        ) : (
          <Table
            rows={rows}
            rowKey={(r: any) => r.run}
          columns={[
            { key: "agent", header: "Agent", render: (r) => <span className="text-white font-medium">{r.agent}</span> },
            { key: "route", header: "Route", render: (r) => <span className="font-mono text-xs text-ink-400">{r.route}</span> },
            { key: "cost", header: "Spend", render: (r) => <span className="font-medium text-brand-300">{r.cost}</span> },
            { key: "status", header: "Status", render: (r) => (
              <span className={`text-xs px-1.5 py-0.5 rounded ${r.status.includes('Halted') ? 'bg-accent-red/20 text-accent-red' : 'bg-bg-700 text-ink-300'}`}>
                {r.status}
              </span>
            ) },
          ]}
        />
        )}
      </div>
    </Card>
  );
}
