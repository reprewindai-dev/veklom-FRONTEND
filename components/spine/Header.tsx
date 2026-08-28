import React from 'react';
import { ShieldCheck, Cpu, Layers, RefreshCw, Zap, ExternalLink } from 'lucide-react';

interface HeaderProps {
 activeTab: string;
 setActiveTab: (tab: string) => void;
 isBackendConnected: boolean;
 onOpenArchitectureModal: () => void;
 pglCount: number;
}

export const Header: React.FC<HeaderProps> = ({
 activeTab,
 setActiveTab,
 isBackendConnected,
 onOpenArchitectureModal,
 pglCount,
}) => {
 return (
 <header className="bg-theme-surface border-b border-theme-border sticky top-0 z-40">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex items-center justify-between h-16">
 {/* Brand Logo & Title */}
 <div className="flex items-center space-x-3">
 <div className="h-10 w-10 rounded-xl bg-theme-surface to-emerald-400 p-0.5 shadow-lg shadow-theme-accent/20">
 <div className="h-full w-full bg-theme-surface rounded-[10px] flex items-center justify-center">
 <Cpu className="h-5 w-5 text-theme-accent" />
 </div>
 </div>
 <div>
 <div className="flex items-center space-x-2">
 <span className="text-lg font-bold tracking-tight text-white">COMPUTLESS</span>
 <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-theme-accent/10 text-theme-accent border border-theme-border font-mono">
 CLOUD
 </span>
 </div>
 <p className="text-xs text-slate-400">
 Decentralized Substrate &amp; Autonomous Agent Governance
 </p>
 </div>
 </div>

 {/* Quick Metrics & Architecture Trigger */}
 <div className="hidden lg:flex items-center space-x-4 text-xs font-mono">
 <button
 onClick={onOpenArchitectureModal}
 className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-theme-surface hover:bg-theme-surface text-slate-200 border border-theme-border transition cursor-pointer"
 >
 <Layers className="h-3.5 w-3.5 text-theme-accent" />
 <span>8-Layer Substrate Stack</span>
 </button>

 <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-theme-surface border border-theme-border text-slate-300">
 <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
 <span>Invariants Active: <strong className="text-emerald-400">403 &amp; 503</strong></span>
 </div>

 <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-theme-surface border border-theme-border text-slate-300">
 <Zap className="h-3.5 w-3.5 text-theme-accent" />
 <span>PGL Proofs: <strong className="text-theme-accent">{pglCount}</strong></span>
 </div>

 <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-theme-surface border border-theme-border">
 <span className={`h-2 w-2 rounded-full ${isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
 <span className="text-slate-400">{isBackendConnected ? 'HTTP/REST Live' : 'Connecting...'}</span>
 </div>
 </div>
 </div>

 {/* Navigation Tabs */}
 <div className="flex space-x-1 border-t border-theme-border overflow-x-auto py-2 scrollbar-none">
 <button
 onClick={() => setActiveTab('fpi')}
 className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
 activeTab === 'fpi'
 ? 'bg-theme-surface text-theme-accent/70 border border-theme-border shadow-lg shadow-theme-accent/20'
 : 'text-slate-300 hover:text-white hover:bg-theme-surface'
 }`}
 >
 <span>Federation Provider Interface (FPI)</span>
 <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 rounded font-mono font-bold">
 FPI Spec
 </span>
 </button>

 <button
 onClick={() => setActiveTab('topology')}
 className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
 activeTab === 'topology'
 ? 'bg-theme-accent/20 text-theme-accent/70 border border-theme-border'
 : 'text-slate-400 hover:text-slate-200 hover:bg-theme-surface'
 }`}
 >
 <span>Topology &amp; Substrate</span>
 </button>

 <button
 onClick={() => setActiveTab('simulator')}
 className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
 activeTab === 'simulator'
 ? 'bg-theme-accent/20 text-theme-accent/70 border border-theme-border'
 : 'text-slate-400 hover:text-slate-200 hover:bg-theme-surface'
 }`}
 >
 <span>Two Invariants Router</span>
 <span className="px-1.5 py-0.5 text-[10px] bg-theme-accent/20 text-theme-accent/70 rounded font-mono">403/503</span>
 </button>

 <button
 onClick={() => setActiveTab('herdr')}
 className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
 activeTab === 'herdr'
 ? 'bg-theme-accent/20 text-theme-accent/70 border border-theme-border'
 : 'text-slate-400 hover:text-slate-200 hover:bg-theme-surface'
 }`}
 >
 <span>Herdr Agent Loop</span>
 <span className="px-1.5 py-0.5 text-[10px] bg-theme-accent/20 text-theme-accent/70 rounded font-mono">Recursion</span>
 </button>

 <button
 onClick={() => setActiveTab('ledger')}
 className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
 activeTab === 'ledger'
 ? 'bg-theme-accent/20 text-theme-accent/70 border border-theme-border'
 : 'text-slate-400 hover:text-slate-200 hover:bg-theme-surface'
 }`}
 >
 <span>PGL Ledger &amp; x402</span>
 </button>

 <button
 onClick={() => setActiveTab('api')}
 className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
 activeTab === 'api'
 ? 'bg-theme-accent/20 text-theme-accent/70 border border-theme-border'
 : 'text-slate-400 hover:text-slate-200 hover:bg-theme-surface'
 }`}
 >
 <span>REST API &amp; MCP Bench</span>
 </button>
 </div>
 </div>
 </header>
 );
};
