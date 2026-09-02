"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { Card, Section, StatusPill } from "@/components/ui/SharedUI";
import { useAuth } from '@/lib/auth-context';

export default function OsPage() {
  const { me, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !me) {
      router.push('/login?returnTo=/os');
    }
  }, [loading, me, router]);

  if (loading || !me) {
    return (
      <HumanAppShell>
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <StatusPill status="unknown" label="AUTHENTICATING..." />
        </div>
      </HumanAppShell>
    );
  }

  return (
    <HumanAppShell>
      <main className="flex-1 w-full bg-theme-bg">
        
        {/* Workspace Sub-header */}
        <div className="border-b border-theme-border bg-theme-surface">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-theme-ink">My Workspace</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-theme-inkDim px-2 py-0.5 border border-theme-border rounded">Default Tenant</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-theme-inkDim">Role:</span>
              <span className="text-theme-ink font-bold">OPERATOR</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="mb-10">
            <h1 className="text-3xl font-sans font-bold text-theme-ink mb-2">Capability Cockpit</h1>
            <p className="text-theme-inkDim text-sm max-w-2xl">
              Discover capabilities, compose work, request bounded authority, execute, and preserve evidence.
            </p>
          </div>

          <Section title="Mounted Capabilities">
          <div className="mb-6 border border-[var(--theme-accent)]/30 bg-[var(--theme-accent)]/5 rounded p-4 flex items-center justify-between shadow-sm">
            <div>
              <h3 className="font-bold text-[var(--theme-accent)] mb-1 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> 
                Proof Sandbox
              </h3>
              <p className="text-sm opacity-80 text-theme-ink">The Veklom continuous conformance and activation sandbox.</p>
            </div>
            <Link href="/activate" className="px-4 py-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded text-sm font-medium hover:bg-[var(--theme-bg)] transition-colors">
              Re-run activation proof
            </Link>
          </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
              <Card>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-theme-bg border border-theme-border rounded">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-theme-ink">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                  </div>
                  <StatusPill status="verified" label="ACTIVE" />
                </div>
                <h3 className="font-bold text-theme-ink mb-1">core.compute.spawn</h3>
                <p className="text-xs text-theme-inkDim mb-4">Spawn sandboxed node tasks with a bound lifecycle.</p>
                <Link href="#" className="text-xs font-mono font-bold text-theme-accent hover:underline">Manage &rarr;</Link>
              </Card>

              <Card>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-theme-bg border border-theme-border rounded">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-theme-ink">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                    </svg>
                  </div>
                  <StatusPill status="warn" label="NEEDS BUDGET" />
                </div>
                <h3 className="font-bold text-theme-ink mb-1">pgl.ledger.write</h3>
                <p className="text-xs text-theme-inkDim mb-4">Commit cryptographic execution evidence to the genome ledger.</p>
                <Link href="#" className="text-xs font-mono font-bold text-theme-accent hover:underline">Manage &rarr;</Link>
              </Card>
            </div>
          </Section>

          <Section title="Execution Evidence">
            <div className="border border-theme-border bg-theme-surface rounded overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-theme-surface2 border-b border-theme-border font-mono text-[10px] uppercase tracking-widest text-theme-inkDim">
                  <tr>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3">Identity</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border">
                  <tr className="hover:bg-theme-bg transition-colors">
                    <td className="px-6 py-4 text-theme-ink font-mono text-xs">2026-08-27 14:02:11</td>
                    <td className="px-6 py-4 text-theme-ink">contact.read</td>
                    <td className="px-6 py-4 text-theme-inkDim font-mono text-xs">exec_a1b2c3</td>
                    <td className="px-6 py-4"><StatusPill status="verified" label="ALLOW" /></td>
                    <td className="px-6 py-4"><Link href="#" className="text-theme-accent text-xs font-mono hover:underline">View Receipt</Link></td>
                  </tr>
                  <tr className="hover:bg-theme-bg transition-colors">
                    <td className="px-6 py-4 text-theme-ink font-mono text-xs">2026-08-27 13:45:00</td>
                    <td className="px-6 py-4 text-theme-ink">contact.delete</td>
                    <td className="px-6 py-4 text-theme-inkDim font-mono text-xs">exec_a1b2c3</td>
                    <td className="px-6 py-4"><StatusPill status="danger" label="DENY" /></td>
                    <td className="px-6 py-4"><Link href="#" className="text-theme-accent text-xs font-mono hover:underline">View Rejection</Link></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      </main>
    </HumanAppShell>
  );
}

