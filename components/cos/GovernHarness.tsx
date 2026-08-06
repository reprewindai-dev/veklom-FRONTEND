'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Shield, ShieldCheck, Activity, Search, RefreshCw, AlertTriangle, Lock } from 'lucide-react';
import { ProofBadge } from './ProofBadge';

interface SecurityStats {
  status: string;
  threat_level: string;
  active_threats: number;
  total_events: number;
}

export function GovernHarness() {
  const [apiKey, setApiKey] = useState('');
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('https://api.veklom.com/api/v1/security/stats', {
        headers: {
          'Authorization': `Bearer ${apiKey || 'byos_test_key'}`,
          'X-API-Key': apiKey || 'byos_test_key',
        }
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch governance stats');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 lg:px-10">
      <div className="mb-10 flex items-start justify-between gap-6">
        <div>
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-cos-accent">
            Govern Workspace
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-cos-text">
            Policy & Security
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-cos-muted">
            Zero-Trust Middleware policies, CAPPO boundaries, and active threat telemetry.
          </p>
        </div>
        <ProofBadge status={stats ? "Verified" : "Pending"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-cos-border bg-cos-surface/50 p-5">
            <h3 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-cos-text mb-4">
              <Lock size={14} className="text-cos-accent" />
              Authority
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-cos-steel mb-1.5">Governance Key</label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="byos_..."
                  className="w-full bg-cos-surface2 border border-cos-border rounded p-2 text-sm text-cos-text font-mono focus:border-cos-accent focus:outline-none"
                />
              </div>
              <button 
                onClick={fetchStats}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-cos-surface2 border border-cos-border text-cos-text font-mono uppercase tracking-wider text-[10px] py-2.5 rounded hover:border-cos-accent transition-all"
              >
                {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                {isLoading ? 'Scanning...' : 'Fetch Threat Stats'}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border border-cos-border bg-[#050505] overflow-hidden flex flex-col min-h-[300px]">
            <div className="bg-[#0A0A0A] border-b border-[#222] p-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldAlert size={14} className="text-[#666]" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#666]">Security Gateway</span>
              </div>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="mb-5 p-4 border border-red-900/50 bg-red-950/20 text-red-400 font-mono text-sm rounded">
                  <div className="font-bold mb-1">[GOVERNANCE ERROR]</div>
                  {error}
                </div>
              )}

              {!error && !stats && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-[#555] font-mono text-xs py-10 text-center min-h-[200px]">
                  <Shield size={32} className="mb-4 opacity-50" />
                  CAPPO Gateway offline.<br/>Provide Governance key to inspect boundaries.
                </div>
              )}

              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-[fadeIn_0.3s_ease-out]">
                  <div className="bg-[#111] border border-[#222] rounded-lg p-5 flex flex-col items-center justify-center text-center">
                    <ShieldCheck size={24} className={stats.status === 'healthy' ? "text-[#00FF41] mb-2" : "text-cos-accent mb-2"} />
                    <div className="text-[10px] uppercase tracking-widest text-[#666] mb-1">Gateway Status</div>
                    <div className={stats.status === 'healthy' ? "text-xl font-mono text-[#00FF41]" : "text-xl font-mono text-cos-accent"}>
                      {stats.status.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="bg-[#111] border border-[#222] rounded-lg p-5 flex flex-col items-center justify-center text-center">
                    <AlertTriangle size={24} className="text-[#FF6B00] mb-2" />
                    <div className="text-[10px] uppercase tracking-widest text-[#666] mb-1">Active Threats</div>
                    <div className="text-3xl font-mono text-[#FF6B00]">{stats.active_threats}</div>
                  </div>
                  
                  <div className="bg-[#111] border border-[#222] rounded-lg p-5 flex flex-col items-center justify-center text-center">
                    <Activity size={24} className="text-gray-300 mb-2" />
                    <div className="text-[10px] uppercase tracking-widest text-[#666] mb-1">Total Monitored Events</div>
                    <div className="text-3xl font-mono text-gray-300">{stats.total_events}</div>
                  </div>
                  
                  <div className="md:col-span-3 bg-[#111] border border-[#222] rounded-lg p-5">
                    <div className="text-[10px] uppercase tracking-widest text-[#666] mb-3">Threat Level Matrix</div>
                    <div className="font-mono text-sm text-gray-300">
                      Current Evaluation: <span className="text-cos-accent font-bold">{stats.threat_level.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
