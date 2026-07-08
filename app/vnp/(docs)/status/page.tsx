"use client";

import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface VnpMetrics {
  total_probes_recorded: number;
  total_slashed_minor: number;
  active_validators: number;
  avg_composite_score: number;
}

export default function StatusPage() {
  const [metricsData, setMetricsData] = useState<VnpMetrics | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get<VnpMetrics>('/api/v1/vnp/metrics');
        setMetricsData(res);
        setLastError(null);
      } catch (err) {
        console.error("Failed to fetch VNP metrics", err);
        setLastError("Disconnected");
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const probesCount = metricsData?.total_probes_recorded ?? 0;
  const activeValidators = metricsData?.active_validators ?? 0;
  const compositeScore = metricsData?.avg_composite_score ?? 0;
  const slashedTotal = metricsData?.total_slashed_minor
    ? `$${(metricsData.total_slashed_minor / 1_000_000).toFixed(6)}`
    : "$0.000000";
  const isConnected = Boolean(metricsData && probesCount > 0);
  const statusLabel = lastError ?? (isConnected ? "Connected" : "Config Incomplete");

  const metrics = [
    { label: "Physical Probes Recorded", value: probesCount.toLocaleString(), status: statusLabel },
    { label: "Active Validators", value: activeValidators.toLocaleString(), status: activeValidators > 0 ? "Connected" : "Config Incomplete" },
    { label: "Total SLA Slashed (USDC)", value: slashedTotal, status: "Connected" },
    { label: "Robust Scoring Composite", value: compositeScore ? compositeScore.toFixed(2) : "Pending", status: compositeScore ? "Connected" : "Config Incomplete" }
  ];

  return (
    <div className="space-y-12 pb-24">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-4xl font-extrabold tracking-tight">Network Status & Uptime</h1>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            {statusLabel}
          </span>
        </div>
        <p className="text-xl text-gray-400 leading-relaxed mb-8">
          Live BYOS telemetry from physical probes, settlement entries, validators, and robust scoring.
        </p>
      </div>

      <div className={`${isConnected ? "bg-green-500/10 border-green-500/20" : "bg-yellow-500/10 border-yellow-500/20"} border rounded-xl p-8 flex items-center justify-between mb-12`}>
        <div>
          <h2 className={`text-2xl font-bold mb-2 ${isConnected ? "text-green-400" : "text-yellow-300"}`}>
            {isConnected ? "Physical Probe Telemetry Connected" : "Physical Probe Telemetry Pending"}
          </h2>
          <p className={isConnected ? "text-green-200/70" : "text-yellow-100/70"}>
            {isConnected
              ? "The Veklom Nexus Protocol is reading live probe and settlement data from the BYOS backend."
              : "The BYOS metric route is reachable but has not returned recorded physical probes yet."}
          </p>
        </div>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${isConnected ? "bg-green-500/20 border-green-500/30" : "bg-yellow-500/20 border-yellow-500/30"}`}>
          {isConnected ? <CheckCircle2 className="w-8 h-8 text-green-400" /> : <AlertCircle className="w-8 h-8 text-yellow-300" />}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {metrics.map((metric, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-xl flex flex-col justify-between h-32">
            <span className="text-gray-400 text-sm uppercase tracking-wider font-bold">{metric.label}</span>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold font-mono text-white">{metric.value}</span>
              <div className={`${metric.status === "Connected" ? "text-green-400 bg-green-400/10" : "text-yellow-300 bg-yellow-400/10"} flex items-center gap-2 text-xs px-2 py-1 rounded`}>
                <span className={`w-2 h-2 rounded-full ${metric.status === "Connected" ? "bg-green-400" : "bg-yellow-300"} animate-pulse`} />
                {metric.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-white/5 border border-white/10 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-6 h-6 text-[#FFB800]" />
          <h3 className="text-xl font-bold">Cryptographic Status Receipts</h3>
        </div>
        <p className="text-gray-400 leading-relaxed mb-6">
          x402 settlement evidence is read from the BYOS settlement ledger, while CAPPO supplies governed runtime enforcement through ExecutionIdentityV1 and LAW 0 execution controls.
        </p>
        <div className="bg-black/50 p-4 rounded-lg font-mono text-sm text-gray-300 border border-white/10">
          $ vnp-cli network verify --depth 1000
        </div>
      </div>
    </div>
  );
}
