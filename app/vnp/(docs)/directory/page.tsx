"use client";

import React, { useEffect, useState } from 'react';
import { Search, Cpu, Wallet, CheckCircle2, Activity, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface RealtimeMetric {
  latency_ms: number;
  is_up: boolean;
  measured_at: string;
}

interface RealtimeDirectoryResponse {
  realtime_metrics?: Record<string, RealtimeMetric>;
}

export default function DirectoryPage() {
  const [realtimeData, setRealtimeData] = useState<Record<string, RealtimeMetric>>({});
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRealtime = async () => {
      try {
        const res = await api.get<RealtimeDirectoryResponse>('/api/v1/vnp/directory/realtime');
        if (res.realtime_metrics) {
          setRealtimeData(res.realtime_metrics);
          setLastError(null);
        }
      } catch (err) {
        console.error("Failed to fetch realtime metrics", err);
        setLastError("Disconnected");
      }
    };

    fetchRealtime();
    const interval = setInterval(fetchRealtime, 10000);
    return () => clearInterval(interval);
  }, []);

  const categories = [
    {
      title: "AI Infrastructure",
      icon: Cpu,
      apis: [
        { id: "openai", name: "OpenAI API", status: "Live", stake: "x402 Connected", defaultLatency: "Awaiting probe" },
        { id: "anthropic", name: "Anthropic API", status: "Live", stake: "x402 Connected", defaultLatency: "Awaiting probe" },
      ]
    },
    {
      title: "Financial & Web3",
      icon: Wallet,
      apis: [
        { id: "stripe", name: "Stripe API", status: "Live", stake: "x402 Connected", defaultLatency: "Awaiting probe" },
      ]
    }
  ];

  return (
    <div className="space-y-12 pb-24">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-4xl font-extrabold tracking-tight">Tier-1 API Directory</h1>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            LIVE PHYSICAL PROBES
          </span>
          {lastError && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
              <AlertCircle className="w-3.5 h-3.5" />
              {lastError}
            </span>
          )}
        </div>
        <p className="text-xl text-gray-400 leading-relaxed mb-8">
          Live physical probe readings from the VNP backend for OpenAI, Anthropic, and Stripe.
        </p>
      </div>

      <div className="relative mb-12">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search by API name, provider, or category..."
          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#FFB800]/50 transition-colors"
        />
      </div>

      <div className="space-y-12">
        {categories.map((category, i) => {
          const Icon = category.icon;
          return (
            <section key={i}>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
                <Icon className="w-6 h-6 text-[#FFB800]" />
                {category.title}
              </h2>
              <div className="grid gap-4">
                {category.apis.map((api, j) => {
                  const liveData = realtimeData[api.id];
                  const latencyDisplay = liveData ? `${liveData.latency_ms}ms` : api.defaultLatency;
                  const isUp = liveData ? liveData.is_up : false;
                  const statusLabel = liveData ? (isUp ? api.status : "Disconnected") : "Config Incomplete";

                  return (
                    <div key={j} className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#FFB800]/30 transition-colors cursor-pointer group">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg group-hover:text-[#FFB800] transition-colors">{api.name}</h3>
                          {liveData && (
                            <Activity className={`w-4 h-4 ${isUp ? 'text-green-500' : 'text-red-500'}`} />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {statusLabel === "Live" ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" /> {statusLabel}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">
                              {statusLabel}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8 text-sm">
                        <div className="flex flex-col items-end">
                          <span className="text-gray-500 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                            {liveData && <span className={`w-1.5 h-1.5 rounded-full ${isUp ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>}
                            Physical Probe
                          </span>
                          <span className="font-mono text-white">{latencyDisplay}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Settlement</span>
                          <span className="font-mono text-[#FFB800] font-bold">{api.stake}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  );
}
