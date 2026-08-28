import React from 'react';
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { PageHeader } from "@/components/ui/SharedUI";

export const metadata = { title: 'Status | Veklom Capability OS' };

export default function StatusPage() {
  return (
    <HumanAppShell>
      <div className="max-w-4xl mx-auto px-6 py-16 w-full">
        <PageHeader title="System Status" description="Real-time status of Veklom components." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div className="border border-theme-border bg-theme-surface p-4 rounded flex justify-between items-center">
            <span className="font-bold text-theme-ink text-sm font-mono">Public Site</span>
            <span className="text-theme-verified font-mono text-xs font-bold px-2 py-1 bg-theme-verified/10 rounded">OPERATIONAL</span>
          </div>
          <div className="border border-theme-border bg-theme-surface p-4 rounded flex justify-between items-center">
            <span className="font-bold text-theme-ink text-sm font-mono">GitHub Auth (OAuth & Device Flow)</span>
            <span className="text-theme-verified font-mono text-xs font-bold px-2 py-1 bg-theme-verified/10 rounded">OPERATIONAL</span>
          </div>
          <div className="border border-theme-border bg-theme-surface p-4 rounded flex justify-between items-center">
            <span className="font-bold text-theme-ink text-sm font-mono">GitHub App Webhook</span>
            <span className="text-theme-verified font-mono text-xs font-bold px-2 py-1 bg-theme-verified/10 rounded">OPERATIONAL</span>
          </div>
          <div className="border border-theme-border bg-theme-surface p-4 rounded flex justify-between items-center">
            <span className="font-bold text-theme-ink text-sm font-mono">Marketplace Webhook</span>
            <span className="text-theme-verified font-mono text-xs font-bold px-2 py-1 bg-theme-verified/10 rounded">OPERATIONAL</span>
          </div>
          <div className="border border-theme-border bg-theme-surface p-4 rounded flex justify-between items-center">
            <span className="font-bold text-theme-ink text-sm font-mono">Machine WebMCP Surface</span>
            <span className="text-theme-verified font-mono text-xs font-bold px-2 py-1 bg-theme-verified/10 rounded">OPERATIONAL</span>
          </div>
        </div>
      </div>
    </HumanAppShell>
  );
}
