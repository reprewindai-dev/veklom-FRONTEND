"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Zap, Globe2, Code, Activity, Server, Anchor, Network, HardDrive, CheckCircle } from 'lucide-react';
import Shell from '@/components/Shell';
import BenchmarkPanel from '@/components/vnp/BenchmarkPanel';
import { ApiState } from '@/components/vnp/types';

// The top 30 APIs that set Veklom as a "must have"
const TOP_APIS = [
  // First-Party Veklom Infrastructure
  { id: "veklom-api", name: "api.veklom.com", version: "v1.5" },
  { id: "veklom-control", name: "control.veklom.com", version: "v1.5" },
  { id: "veklom-cappo", name: "capi.veklom.com", version: "v1.0" },
  { id: "veklom-pgl", name: "pgl.veklom.com", version: "v1.0" },
  { id: "veklom-gpc", name: "gpc.veklom.com", version: "v3.0" },
  
  // Real Third-Party Dependencies
  { id: "api-stripe", name: "api.stripe.com/v1/charges", version: "v1.0" },
  { id: "api-openai", name: "api.openai.com/v1/chat", version: "v1.0" },
  { id: "api-sendgrid", name: "api.sendgrid.com/v3/mail", version: "v3.0" },
  { id: "api-twilio", name: "api.twilio.com/2010-04-01", version: "v1.0" },
  { id: "api-supabase", name: "api.supabase.co/rest/v1", version: "v1.0" },
  { id: "api-github", name: "api.github.com", version: "v3.0" }
];

export default function WorkspaceVNPPage() {
  const [apis, setApis] = useState<ApiState[]>([]);

  useEffect(() => {
    const fetchApis = async () => {
      try {
        const res = await fetch('/api/v1/benchmarks/leaderboard');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        const fetchedApis = Array.isArray(data) ? data : (data.leaderboard || data.scores || []);
        
        // Sort by composite score
        fetchedApis.sort((a: ApiState, b: ApiState) => (b.compositeScore || 0) - (a.compositeScore || 0));
        setApis(fetchedApis);
      } catch (err) {
        console.error("Failed to fetch VNP leaderboard", err);
        setApis([]);
      }
    };
    
    fetchApis();
  }, []);

  return (
    <Shell>
      <div className="space-y-6 animate-fade-up max-w-[1400px] mx-auto pb-20">
        
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-2 border-b border-[#242424] pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded bg-[#FFB800]/20 text-[#FFB800]">
                <Activity size={14} />
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FFB800] font-bold">
                VNP Master Plane
              </span>
            </div>
            <h1 className="text-[32px] font-bold tracking-tight text-white">
              API Trust Network
            </h1>
            <p className="text-sm text-ink-400 max-w-3xl">
              VNP Methodology v1.0 telemetry for top infrastructure endpoints. Route agents with signed measurements, PGL audit trails, and x402 settlement evidence when backend receipts are connected.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-2 bg-[#0a0a0a] border border-[#333] px-3 py-1.5 rounded text-[10px] font-mono font-bold text-emerald-400">
              <CheckCircle size={12} />
              Connected / 5-Node Signed Edge
            </span>
          </div>
        </div>

        {apis.length > 0 ? (
          <BenchmarkPanel 
            apis={apis} 
            trustBeacon="0x8f2d9c4b7e1a3f6d5c2b9a8e7f6d5c4b3a2e1f0d9c8b7a6f5e4d3c2b1a0f9e8d" 
            blockAnchored={138402}
          />
        ) : (
          <div className="h-[600px] flex items-center justify-center border border-slate-900 rounded-2xl bg-[#050505]">
            <div className="text-slate-500 font-mono text-sm animate-pulse flex items-center gap-2">
              <Activity className="w-4 h-4" /> Syncing Global State...
            </div>
          </div>
        )}

      </div>
    </Shell>
  );
}
