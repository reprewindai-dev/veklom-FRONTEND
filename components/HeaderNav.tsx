import React, { useState, useEffect } from 'react';
import { ShieldCheck, Server, Cpu, Key, UserCheck, Activity, Terminal, Database, Sparkles, Layers, Lock, RefreshCw, Zap, Command } from 'lucide-react';
import { SystemMode, UserRole, OllamaStatus } from '../types.js';

interface HeaderNavProps {
 mode: SystemMode;
 setMode: (m: SystemMode) => void;
 role: UserRole;
 setRole: (r: UserRole) => void;
 activeTab: string;
 setActiveTab: (t: string) => void;
 ollamaStatus: OllamaStatus | null;
 refreshOllama: () => void;
 onOpenQuickAction: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
 mode,
 setMode,
 role,
 setRole,
 activeTab,
 setActiveTab,
 ollamaStatus,
 refreshOllama,
 onOpenQuickAction
}) => {
 const [isRefreshing, setIsRefreshing] = useState(false);

 const navItems = [
 { id: 'eval', label: 'Architecture & Thesis', icon: ShieldCheck },
 { id: 'capi', label: 'cAPI Sandbox & Harnesses', icon: Terminal },
 { id: 'abide', label: 'Abide Plan Controller', icon: Sparkles },
 { id: 'registry', label: 'Skill Registry & RepoGate', icon: Layers },
 { id: 'pgl', label: 'PGL Evidence Ledger', icon: Database },
 { id: 'vnp', label: 'VNP & Node Health', icon: Activity },
 { id: 'rbac', label: 'UACP RBAC Policy', icon: Lock },
 { id: 'docs', label: 'API Reference', icon: Server }
 ];

 const handleRefresh = async () => {
 setIsRefreshing(true);
 await refreshOllama();
 setTimeout(() => setIsRefreshing(false), 500);
 };

 return (
 <header className="bg-theme-surface border-b border-theme-border text-slate-100 sticky top-0 z-50 shadow-xl">
 {/* Top Banner Bar */}
 <div className="bg-theme-surface border-b border-theme-border px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2">
 <span className="relative flex h-2.5 w-2.5">
 <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${mode === 'production' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
 <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${mode === 'production' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
 </span>
 <span className="font-semibold tracking-wide text-slate-200">
 VEKLOM cAPI CONTROL PLANE v2.4.0
 </span>
 </div>

 {/* Mode Switcher Badge */}
 <div className="flex items-center bg-theme-surface rounded-md p-0.5 border border-theme-border">
 <button
 onClick={() => setMode('production')}
 className={`px-2.5 py-1 rounded text-2xs font-semibold tracking-wider transition-all ${
 mode === 'production'
 ? 'bg-emerald-600 text-white shadow'
 : 'text-slate-400 hover:text-slate-200'
 }`}
 >
 PROD MODE (VERIFIED)
 </button>
 <button
 onClick={() => setMode('demo')}
 className={`px-2.5 py-1 rounded text-2xs font-semibold tracking-wider transition-all ${
 mode === 'demo'
 ? 'bg-amber-600 text-white shadow'
 : 'text-slate-400 hover:text-slate-200'
 }`}
 >
 DEMO (SANDBOX)
 </button>
 </div>
 </div>

 <div className="flex items-center gap-4 text-slate-300">
 {/* Local Ollama Status Pill */}
 <div className="flex items-center gap-2 bg-theme-surface px-2.5 py-1 rounded border border-theme-border">
 <Cpu className="w-3.5 h-3.5 text-theme-accent" />
 <span className="font-mono text-2xs">
 Ollama Local: {ollamaStatus?.connected ? (
 <span className="text-emerald-400 font-bold">ONLINE ({ollamaStatus.latencyMs}ms)</span>
 ) : (
 <span className="text-amber-400 font-medium">STANDBY ({ollamaStatus?.error ? 'Daemon Offline' : 'Checking...'})</span>
 )}
 </span>
 <button
 onClick={handleRefresh}
 title="Re-check local Ollama daemon"
 className="hover:text-theme-accent transition-colors ml-1"
 >
 <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-theme-accent' : ''}`} />
 </button>
 </div>

 {/* User Requester Identity */}
 <div className="flex items-center gap-1.5 bg-theme-surface px-2.5 py-1 rounded border border-theme-border text-2xs">
 <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
 <span className="text-slate-400">Requester:</span>
 <span className="font-mono text-slate-200 font-semibold">reprewindai@gmail.com</span>
 </div>

 {/* Role Switcher */}
 <div className="flex items-center gap-1.5 bg-theme-surface px-2 py-0.5 rounded border border-theme-border text-2xs">
 <Key className="w-3 h-3 text-theme-accent" />
 <span className="text-slate-400">Role:</span>
 <select
 value={role}
 onChange={(e) => setRole(e.target.value as UserRole)}
 className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
 >
 <option value="admin" className="bg-theme-surface">Admin</option>
 <option value="architect" className="bg-theme-surface">Architect</option>
 <option value="auditor" className="bg-theme-surface">Auditor</option>
 <option value="operator" className="bg-theme-surface">Operator</option>
 </select>
 </div>

 {/* Global Quick Action Modal Button */}
 <button
 onClick={onOpenQuickAction}
 title="Open Global Quick Action Modal (Cmd+K / Ctrl+K)"
 className="flex items-center gap-2 bg-theme-surface from-emerald-500/10 hover:from-emerald-500/20 hover: hover: text-theme-accent/70 px-3 py-1 rounded border border-theme-border shadow-sm transition-all text-2xs font-mono font-semibold"
 >
 <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
 <span>Quick Action</span>
 <span className="bg-theme-surface px-1.5 py-0.5 rounded text-3xs text-slate-400 border border-theme-border">
 ⌘K
 </span>
 </button>
 </div>
 </div>

 {/* Main Navigation Bar */}
 <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 overflow-x-auto">
 <div className="flex items-center gap-3 shrink-0">
 <div className="w-9 h-9 rounded-lg bg-theme-surface to-emerald-500 p-0.5 flex items-center justify-center shadow-lg shadow-theme-accent/20">
 <div className="w-full h-full bg-theme-surface rounded-[7px] flex items-center justify-center">
 <Layers className="w-5 h-5 text-theme-accent" />
 </div>
 </div>
 <div>
 <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-2">
 VEKLOM
 <span className="bg-theme-accent/10 text-theme-accent text-3xs font-mono font-semibold px-2 py-0.5 rounded border border-theme-border">
 cAPI
 </span>
 </h1>
 <p className="text-3xs text-slate-400 font-mono">Multi-Agent Control Plane & Governance</p>
 </div>
 </div>

 {/* Tab Buttons */}
 <nav className="flex items-center gap-1 shrink-0 overflow-x-auto py-1">
 {navItems.map((item) => {
 const Icon = item.icon;
 const isActive = activeTab === item.id;
 return (
 <button
 key={item.id}
 onClick={() => setActiveTab(item.id)}
 className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
 isActive
 ? 'bg-theme-accent/15 text-theme-accent/70 border border-theme-border shadow-sm'
 : 'text-slate-400 hover:text-slate-200 hover:bg-theme-surface border border-transparent'
 }`}
 >
 <Icon className={`w-4 h-4 ${isActive ? 'text-theme-accent' : 'text-slate-400'}`} />
 <span>{item.label}</span>
 </button>
 );
 })}
 </nav>
 </div>
 </header>
 );
};
