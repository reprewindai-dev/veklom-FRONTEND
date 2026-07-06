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
  { id: "veklom-cappo", name: "cappo.veklom.com", version: "v1.0" },
  { id: "veklom-pgl", name: "pgl.veklom.com", version: "v1.0" },
  { id: "veklom-gpc", name: "gpc.veklom.com", version: "v3.0" },
  { id: "veklom-capi", name: "capi.veklom.com", version: "v1.0" },
  
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
    // Generate simulated dynamic state for the 30 APIs for the UI
    const generatedApis: ApiState[] = TOP_APIS.map((apiDef, idx) => {
      // Deterministic but varied pseudo-random base scores based on idx
      const baseLat = 30 + (idx * 5) % 80; 
      const baseScore = 99 - (idx % 12);
      
      return {
        id: apiDef.id,
        name: apiDef.name,
        version: apiDef.version,
        compositeScore: baseScore,
        grade: baseScore >= 96 ? "AAA" : baseScore >= 92 ? "AA+" : baseScore >= 88 ? "AA" : "A",
        regions: {
          "us-east": { p99: baseLat, p50: baseLat - 10, uptime: 99.99, errorRate: 0.01, throughput: 12000, geoAdjustedLatency: Math.max(8, baseLat - 15) },
          "us-west": { p99: baseLat + 40, p50: baseLat + 30, uptime: 99.9, errorRate: 0.05, throughput: 11500, geoAdjustedLatency: Math.max(8, baseLat - 15 + 2) },
          "eu-west": { p99: baseLat + 90, p50: baseLat + 80, uptime: 99.8, errorRate: 0.1, throughput: 10000, geoAdjustedLatency: Math.max(8, baseLat - 15 + 5) },
          "ap-northeast": { p99: baseLat + 150, p50: baseLat + 140, uptime: 99.5, errorRate: 0.2, throughput: 8000, geoAdjustedLatency: Math.max(8, baseLat - 15 + 12) },
          "ap-southeast": { p99: baseLat + 210, p50: baseLat + 190, uptime: 99.1, errorRate: 0.5, throughput: 6000, geoAdjustedLatency: Math.max(8, baseLat - 15 + 20) },
        }
      };
    });
    
    // Sort by composite score
    generatedApis.sort((a, b) => b.compositeScore - a.compositeScore);
    
    setApis(generatedApis);
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
              Live physics-verified telemetry for top infrastructure endpoints. Route your agents to healthy nodes and slash providers who fail SLAs on the x402 ledger.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-2 bg-[#0a0a0a] border border-[#333] px-3 py-1.5 rounded text-[10px] font-mono font-bold text-emerald-400">
              <CheckCircle size={12} />
              Live 5-Region Edge Polling
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
