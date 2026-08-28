'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface SecurityMitigation {
 status: string;
 threat_mitigated: string;
 [key: string]: any;
}

interface SecurityPosture {
 timestamp: string;
 overall_status: string;
 mitigations: {
 kernel_isolation: SecurityMitigation;
 proxy_security: SecurityMitigation;
 supply_chain_defense: SecurityMitigation;
 ollama_memory_leak: SecurityMitigation;
 lockerphycer_perimeter: SecurityMitigation;
 };
}

export function ForceFieldDashboard() {
 const [posture, setPosture] = useState<SecurityPosture | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 async function fetchPosture() {
 try {
 const data = await api.get('/api/v1/security/posture') as SecurityPosture;
 setPosture(data);
 } catch (error) {
 console.error('Failed to fetch security posture', error);
 } finally {
 setLoading(false);
 }
 }
 
 fetchPosture();
 const interval = setInterval(fetchPosture, 30000);
 return () => clearInterval(interval);
 }, []);

 if (loading) {
 return (
 <div className="animate-pulse bg-theme-surface border border-theme-border rounded-lg p-6">
 <div className="h-6 w-1/3 bg-theme-surface rounded mb-4"></div>
 <div className="space-y-3">
 <div className="h-4 bg-theme-surface rounded w-full"></div>
 <div className="h-4 bg-theme-surface rounded w-full"></div>
 </div>
 </div>
 );
 }

 if (!posture) {
 return (
 <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 text-red-400">
 <h3 className="font-bold mb-2">Shield Status Offline</h3>
 <p>Could not reach the security posture endpoint. The perimeter may be operating in fallback mode.</p>
 </div>
 );
 }

 return (
 <div className="bg-theme-surface border border-theme-border rounded-xl overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.15)] relative">
 <div className="absolute top-0 left-0 w-full h-1 bg-theme-surface from-transparent to-transparent opacity-50"></div>
 
 <div className="p-5 flex justify-between items-center border-b border-white/5">
 <div>
 <h2 className="text-xl font-bold text-white flex items-center gap-2">
 <svg className="w-5 h-5 text-theme-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
 VEKLOM Force Field
 </h2>
 <p className="text-xs text-slate-400 mt-1">Live M2M Zero-Trust Telemetry</p>
 </div>
 <div className="flex items-center gap-2">
 <span className="relative flex h-3 w-3">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-3 w-3 bg-theme-accent"></span>
 </span>
 <span className="text-theme-accent font-mono text-sm tracking-wider uppercase">
 {posture.overall_status}
 </span>
 </div>
 </div>

 <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
 {Object.entries(posture.mitigations).map(([key, mitigation]) => (
 <div key={key} className="bg-theme-surface rounded-lg p-4 border border-white/5 flex flex-col justify-between">
 <div>
 <div className="flex justify-between items-start mb-2">
 <h3 className="text-white font-medium capitalize">
 {key.replace(/_/g, ' ')}
 </h3>
 <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
 {mitigation.status}
 </span>
 </div>
 <p className="text-xs text-slate-400 line-clamp-2">
 Blocks: {mitigation.threat_mitigated || 'Unknown Threat'}
 </p>
 </div>
 
 <div className="mt-4 pt-3 border-t border-white/5">
 <div className="font-mono text-[10px] text-slate-500 flex flex-col gap-1">
 {Object.entries(mitigation).filter(([k]) => k !== 'status' && k !== 'threat_mitigated').map(([k, v]) => (
 <div key={k} className="flex justify-between">
 <span>{k}:</span>
 <span className="text-slate-300 truncate max-w-[120px] text-right" title={String(v)}>{String(v)}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 ))}
 </div>
 
 <div className="bg-theme-surface p-3 text-center border-t border-white/5">
 <p className="text-[10px] text-slate-500 font-mono">
 Last Verified: {new Date(posture.timestamp).toLocaleTimeString()}
 </p>
 </div>
 </div>
 );
}
