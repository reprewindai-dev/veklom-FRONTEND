import React from 'react';
import { X, Layers, ShieldCheck, RefreshCw, Cpu, Globe, Lock, Terminal, Zap, Check } from 'lucide-react';

interface ArchitectureStackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureStackModal: React.FC<ArchitectureStackModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const stackLayers = [
    {
      num: 8,
      name: 'EVIDENCE, MEASUREMENT & SETTLEMENT',
      components: 'PGL Cryptographic Proof Ledger | VNP Metrics | x402 Micropayment Gas',
      color: 'border-amber-500/40 text-amber-300 bg-amber-950/20',
      description: 'Produces SHA-256 state transition signatures and handles micro-metered gas finality.',
    },
    {
      num: 7,
      name: 'EXECUTION',
      components: 'Local Container Enclave | AWS Edge | Azure Sovereign | MCP Tools | RF Sensor',
      color: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/20',
      description: 'Physical or virtual workload runner executing stateless capability commands.',
    },
    {
      num: 6,
      name: 'ROUTING (HRMR)',
      components: 'Hierarchical Resource & Multicast Router | 503 Fallback Handler',
      color: 'border-sky-500/40 text-sky-300 bg-sky-950/20',
      description: 'Chooses execution path among authorized nodes with zero authority drift.',
    },
    {
      num: 5,
      name: 'AUTHORITY (CAPPO)',
      components: 'Scoped Capability Grants | Cryptographic Token Signatures | 403 Terminal Check',
      color: 'border-rose-500/40 text-rose-300 bg-rose-950/20',
      description: 'Strict authority invariance. 403 is terminal, blocking permission hunting.',
    },
    {
      num: 4,
      name: 'CAPABILITY SEMANTICS',
      components: 'Action Specifications | Required Roles | JSON Input/Output Schemas',
      color: 'border-indigo-500/40 text-indigo-300 bg-indigo-950/20',
      description: 'Defines the exact action scope requested independently of provider implementation.',
    },
    {
      num: 3,
      name: 'FEDERATION',
      components: 'Interlink Protocol | cAPI Cross-Node Discovery Mesh',
      color: 'border-purple-500/40 text-purple-300 bg-purple-950/20',
      description: 'Federates multiple cloud and local sovereign nodes into a single substrate.',
    },
    {
      num: 2,
      name: 'NETWORK & WEB SEMANTICS',
      components: 'IP | TLS | HTTP | DNS | REST Endpoints | MCP JSON-RPC 2.0',
      color: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/20',
      description: 'Universal extensible HTTP grammar providing standardized transport.',
    },
    {
      num: 1,
      name: 'PHYSICAL & VIRTUAL SUBSTRATE',
      components: 'On-Prem Servers | Edge Clusters | RF-Powered Microcontrollers | Docker/K8s',
      color: 'border-slate-500/40 text-slate-300 bg-slate-900/50',
      description: 'Foundational medium providing isolation, locality enforcement, and hardware resilience.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <Layers className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">The 8-Layer Unified Substrate Stack</h2>
              <p className="text-xs text-slate-400 font-mono">
                "HTTP gives you a universal grammar. Computless gives you universal governance."
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* The Stack Visualizer */}
        <div className="space-y-2 font-mono text-xs">
          {stackLayers.map((layer) => (
            <div
              key={layer.num}
              className={`p-3.5 rounded-xl border ${layer.color} transition hover:scale-[1.005] space-y-1`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold tracking-wider">
                  LAYER {layer.num}: {layer.name}
                </span>
                <span className="text-[10px] opacity-75">{layer.components}</span>
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed font-sans">{layer.description}</p>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Portable Cloud: AWS, Azure &amp; Local Sovereign Compatibility</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition cursor-pointer"
          >
            Close Diagram
          </button>
        </div>
      </div>
    </div>
  );
};
