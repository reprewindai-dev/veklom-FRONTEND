'use client';

import React, { useState, useEffect } from 'react';
import { Database, FileText, Search, Activity, Clock, ShieldCheck, Download } from 'lucide-react';
import { ProofBadge } from './ProofBadge';

interface AuditLog {
  id: string;
  workspace_id: string;
  operation_type: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost: string;
  latency_ms: number;
  hmac_hash: string;
  created_at: string;
}

export function EvidenceHarness() {
  const [apiKey, setApiKey] = useState('');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvidence = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // NOTE: Using /api/v1/audit per backend USER_MANUAL.md
      const res = await fetch('https://api.veklom.com/api/v1/audit?limit=50', {
        headers: {
          'Authorization': `Bearer ${apiKey || 'byos_test_key'}`,
          'X-API-Key': apiKey || 'byos_test_key', // Fallback for either auth method
        }
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch evidence');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 lg:px-10">
      <div className="mb-10 flex items-start justify-between gap-6">
        <div>
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-cos-accent">
            Evidence Workspace
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-cos-text">
            Settlement Ledger
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-cos-muted">
            Cryptographic proof of paid compute. Review execution identity tokens and HMAC hashes across the governed network.
          </p>
        </div>
        <ProofBadge status={logs.length > 0 ? "Verified" : "Pending"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Authority Input */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-cos-border bg-cos-surface/50 p-5">
            <h3 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-cos-text mb-4">
              <ShieldCheck size={14} className="text-cos-accent" />
              Authority
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-cos-steel mb-1.5">Execution Key (API Key)</label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="byos_..."
                  className="w-full bg-cos-surface2 border border-cos-border rounded p-2 text-sm text-cos-text font-mono focus:border-cos-accent focus:outline-none"
                />
              </div>
              <button 
                onClick={fetchEvidence}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-cos-surface2 border border-cos-border text-cos-text font-mono uppercase tracking-wider text-[10px] py-2.5 rounded hover:border-cos-accent transition-all"
              >
                {isLoading ? <Activity size={14} className="animate-spin" /> : <Search size={14} />}
                {isLoading ? 'Querying...' : 'Fetch Evidence'}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-cos-border bg-cos-surface/20 p-5">
            <h3 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-cos-steel mb-4">
              <Database size={14} />
              Ledger State
            </h3>
            <div className="space-y-3 font-mono text-[10px] uppercase tracking-widest text-cos-steel">
              <div className="flex justify-between">
                <span>Total Records</span>
                <span className="text-cos-text">{logs.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Network</span>
                <span className="text-cos-text">Server 0</span>
              </div>
              <div className="flex justify-between">
                <span>Encryption</span>
                <span className="text-cos-text">SHA-256</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Ledger Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border border-cos-border bg-[#050505] overflow-hidden flex flex-col h-full min-h-[500px]">
            <div className="bg-[#0A0A0A] border-b border-[#222] p-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-[#666]" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#666]">Immutable Audit Trail</span>
              </div>
              {logs.length > 0 && (
                <button className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-cos-accent hover:text-white transition-colors">
                  <Download size={12} /> Export CSV
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-x-auto">
              {error && (
                <div className="m-5 p-4 border border-red-900/50 bg-red-950/20 text-red-400 font-mono text-sm rounded">
                  <div className="font-bold mb-1">[LEDGER QUERY FAILED]</div>
                  {error}
                </div>
              )}

              {!error && logs.length === 0 && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-[#555] font-mono text-xs p-10 text-center">
                  <Database size={32} className="mb-4 opacity-50" />
                  No evidence records loaded.<br/>Enter your Authority key and query the ledger.
                </div>
              )}

              {logs.length > 0 && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#222] bg-[#0A0A0A] font-mono text-[9px] uppercase tracking-widest text-[#666]">
                      <th className="p-3 whitespace-nowrap">Timestamp</th>
                      <th className="p-3 whitespace-nowrap">Operation</th>
                      <th className="p-3 whitespace-nowrap">Provider/Model</th>
                      <th className="p-3 whitespace-nowrap">Usage</th>
                      <th className="p-3 whitespace-nowrap">Latency</th>
                      <th className="p-3 whitespace-nowrap">Cryptographic Hash (SHA-256)</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[11px] text-gray-300">
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-[#111] hover:bg-[#111] transition-colors">
                        <td className="p-3 whitespace-nowrap text-[#888]">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="text-cos-accent">{log.operation_type}</span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="text-white">{log.provider}</div>
                          <div className="text-[#666] text-[9px]">{log.model}</div>
                        </td>
                        <td className="p-3 whitespace-nowrap text-right">
                          <span className="text-[#00FF41]">+{log.input_tokens + log.output_tokens}</span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Clock size={10} className="text-[#666]" />
                            {log.latency_ms}ms
                          </span>
                        </td>
                        <td className="p-3 font-bold text-[#888] truncate max-w-[200px]" title={log.hmac_hash}>
                          {log.hmac_hash}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
