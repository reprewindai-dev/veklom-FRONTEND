'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  Zap,
  TrendingUp,
  RefreshCw,
  Server,
  ShieldAlert,
  Terminal,
  Network
} from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import Shell from '@/components/Shell';
import { Pill } from '@/components/telemetry';

interface SystemMetrics {
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
  uptime_seconds: number;
  avg_latency_ms: number;
  requests_per_second: number;
  error_rate_percent: number;
  active_agents: number;
  total_executions: number;
}

interface CircuitBreakerStatus {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  threshold: number;
  last_failure?: string;
}

interface SystemEvent {
  id: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  service: string;
  message: string;
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency_ms: number;
  uptime_percent: number;
  last_check: string;
}

export default function OverviewPage() {
  const { data, error } = useSWR<any>('/api/v1/platform/pulse', fetcher, {
    refreshInterval: 2000
  });

  const metrics: SystemMetrics = data?.metrics || {
    cpu_percent: 0,
    memory_percent: 0,
    disk_percent: 0,
    uptime_seconds: 0,
    avg_latency_ms: 0,
    requests_per_second: 0,
    error_rate_percent: 0,
    active_agents: 0,
    total_executions: 0
  };

  const circuitBreaker: CircuitBreakerStatus = data?.circuit_breakers?.['Ollama Primary'] || {
    state: 'CLOSED',
    failures: 0,
    threshold: 5
  };

  const events: SystemEvent[] = data?.recent_events || [];
  const services: ServiceHealth[] = data?.services || [];

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    return `${days}d ${hours}h`;
  };

  const getHealthScore = () => {
    let score = 100;
    if (circuitBreaker.state === 'OPEN') score -= 30;
    else if (circuitBreaker.state === 'HALF_OPEN') score -= 15;
    
    const downServices = services.filter(s => s.status === 'down').length;
    const degradedServices = services.filter(s => s.status === 'degraded').length;
    
    score -= (downServices * 20);
    score -= (degradedServices * 5);
    score -= (metrics.error_rate_percent * 10);
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const healthScore = getHealthScore();

  return (
    <Shell>
      <div className="space-y-6 animate-fade-up">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-2">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-[0.18em] text-ink-600">
              Workspace · Command Center
            </span>
            <h1 className="text-[28px] font-semibold tracking-tight text-gradient">
              Veklom Sovereign Control Node
            </h1>
            <p className="text-sm text-ink-400 max-w-2xl mt-1.5">
              Real-time telemetry, routing mesh health, and system-wide anomaly detection for the Veklom decentralized agentic network.
            </p>
          </div>

          <div className="flex items-center gap-6 shrink-0 bg-white/[0.02] border border-[#242424] rounded-xl p-4">
            <div className="text-right">
              <p className="text-[10px] font-mono font-bold text-ink-500 mb-1 tracking-wider uppercase">Node Health</p>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-black ${
                  healthScore > 90 ? 'text-brand-400' : healthScore > 70 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {healthScore}/100
                </span>
                <Activity className={`w-5 h-5 ${
                  healthScore > 90 ? 'text-brand-400 animate-pulse' : healthScore > 70 ? 'text-amber-500' : 'text-red-500'
                }`} />
              </div>
            </div>
          </div>
        </div>

        {/* Bucket A: Live Telemetry Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-mono font-bold text-ink-500 tracking-wider">CPU USAGE</h4>
              <Cpu className="w-4 h-4 text-brand-400" />
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">{metrics.cpu_percent.toFixed(1)}%</p>
            <div className="w-full bg-white/[0.04] h-1 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-brand-400 rounded-full transition-all duration-1000" style={{ width: `${metrics.cpu_percent}%` }} />
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-mono font-bold text-ink-500 tracking-wider">MEMORY</h4>
              <HardDrive className="w-4 h-4 text-brand-400" />
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">{metrics.memory_percent.toFixed(1)}%</p>
            <div className="w-full bg-white/[0.04] h-1 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-brand-400 rounded-full transition-all duration-1000" style={{ width: `${metrics.memory_percent}%` }} />
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-mono font-bold text-ink-500 tracking-wider">LATENCY</h4>
              <Zap className="w-4 h-4 text-brand-400" />
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">{Math.round(metrics.avg_latency_ms)}ms</p>
            <p className="text-[11px] text-ink-500 mt-2 font-mono">P50 AVERAGE</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-mono font-bold text-ink-500 tracking-wider">THROUGHPUT</h4>
              <TrendingUp className="w-4 h-4 text-brand-400" />
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">{Math.round(metrics.requests_per_second)}<span className="text-sm text-ink-500 ml-1">/s</span></p>
            <p className="text-[11px] text-ink-500 mt-2 font-mono">LIVE TRAFFIC</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-mono font-bold text-ink-500 tracking-wider">UPTIME</h4>
              <Clock className="w-4 h-4 text-brand-400" />
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">{formatUptime(metrics.uptime_seconds)}</p>
            <p className="text-[11px] text-brand-400 mt-2 font-mono flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> 99.99% SLA
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Bucket B: Service Dependency Health */}
          <div className="lg:col-span-1 space-y-5">
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-[#242424] flex items-center justify-between bg-white/[0.01]">
                <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <Network className="w-4 h-4 text-brand-400" />
                  Service Health Map
                </h3>
              </div>
              <div className="p-2 divide-y divide-[#242424]">
                {services.length === 0 ? (
                  <div className="text-xs text-ink-500 p-4 text-center">No services registered</div>
                ) : (
                  services.map(service => (
                    <div key={service.name} className="flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          service.status === 'healthy' ? 'bg-brand-400 shadow-[0_0_8px_rgba(255,184,0,0.6)]' : 
                          service.status === 'degraded' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                        }`} />
                        <span className="text-xs font-semibold text-ink-100">{service.name}</span>
                      </div>
                      <span className="text-[11px] font-mono text-ink-400">{service.latency_ms}ms</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="p-4 border-b border-[#242424] flex items-center justify-between bg-white/[0.01]">
                <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-brand-400" />
                  Circuit Breaker
                </h3>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  circuitBreaker.state === 'CLOSED' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' :
                  circuitBreaker.state === 'HALF_OPEN' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {circuitBreaker.state}
                </span>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-mono font-bold text-ink-500 mb-1">FAILURES</p>
                  <p className="text-lg font-bold text-white tabular-nums">{circuitBreaker.failures} / {circuitBreaker.threshold}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold text-ink-500 mb-1">PROTECTION</p>
                  <p className="text-xs font-bold text-brand-400 mt-1">ACTIVE</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bucket B: Event Stream */}
          <div className="lg:col-span-2">
            <div className="card overflow-hidden h-full flex flex-col">
              <div className="p-4 border-b border-[#242424] flex items-center justify-between bg-white/[0.01]">
                <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <Terminal className="w-4 h-4 text-brand-400" />
                  Live Event Stream
                </h3>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 bg-[#151515] border border-[#242424] px-2.5 py-1 rounded-md text-[9px] font-mono font-bold tracking-wider text-brand-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />STREAMING
                  </span>
                </div>
              </div>
              
              <div className="flex-1 p-4 overflow-auto custom-scrollbar bg-black/45 m-2.5 rounded-xl border border-[#242424]/70 font-mono text-xs space-y-1.5">
                {events.length === 0 ? (
                  <div className="text-ink-500 text-center py-10">Waiting for live events stream...</div>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className={`flex items-start gap-3 p-2 rounded hover:bg-white/[0.02] transition-colors border-l-2 ${
                      event.severity === 'INFO' ? 'border-brand-500/30' :
                      event.severity === 'WARNING' ? 'border-amber-500/50' :
                      event.severity === 'ERROR' ? 'border-red-500/50' : 'border-brand-500'
                    }`}>
                      <span className="text-ink-500 whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className={`font-bold shrink-0 min-w-[70px] ${
                        event.severity === 'INFO' ? 'text-brand-400/80' :
                        event.severity === 'WARNING' ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        [{event.severity}]
                      </span>
                      <span className="text-brand-400 shrink-0 min-w-[80px]">{event.service}</span>
                      <span className="text-ink-200 break-all">{event.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #242424; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2e2e2e; }
      `}} />
    </Shell>
  );
}
