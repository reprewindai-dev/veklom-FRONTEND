"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function CappoDiagramSuite() {
  const [activeTab, setActiveTab] = useState<'linear' | 'entity' | 'ecosystem'>('linear');

  return (
    <div className="min-h-screen bg-void-charcoal text-ink-50 font-sans flex flex-col">
      <header className="px-6 py-4 border-b border-border/50 flex justify-between items-center bg-bg-900">
        <div className="flex items-center gap-4">
          <Link href="/interlink-capi" className="text-sm text-ink-400 hover:text-white transition-colors">
            ← Back to CAPPO
          </Link>
          <div className="h-4 w-px bg-border"></div>
          <h1 className="font-medium">Diagram Suite</h1>
        </div>
        
        <div className="flex p-1 bg-surface2 rounded-lg border border-border/50">
          <button 
            onClick={() => setActiveTab('linear')}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${activeTab === 'linear' ? 'bg-bg-700 text-white shadow-sm' : 'text-ink-400 hover:text-ink-200'}`}
          >
            Linear Flow
          </button>
          <button 
            onClick={() => setActiveTab('entity')}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${activeTab === 'entity' ? 'bg-bg-700 text-white shadow-sm' : 'text-ink-400 hover:text-ink-200'}`}
          >
            Entity Map
          </button>
          <button 
            onClick={() => setActiveTab('ecosystem')}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${activeTab === 'ecosystem' ? 'bg-bg-700 text-white shadow-sm' : 'text-ink-400 hover:text-ink-200'}`}
          >
            Ecosystem
          </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden bg-void-deep p-8 flex items-center justify-center">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-cos-grid opacity-10 pointer-events-none"></div>

        {/* Dynamic Diagram Views */}
        <div className="relative z-10 w-full max-w-5xl aspect-video bg-bg-900 rounded-2xl border border-border/50 shadow-cos-card p-8 flex items-center justify-center">
          
          {activeTab === 'linear' && (
            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500 w-full">
              <h2 className="absolute top-8 left-8 text-xl font-bold text-ink-200">Governance Pipeline</h2>
              <div className="flex flex-col gap-2 w-full max-w-md mt-12">
                {['AST Scan', 'PII Detect', 'Budget Lock', 'Execute', 'PGL Attest'].map((step, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-full bg-surface2 border border-border/80 rounded-lg p-4 text-center hover:border-electric-cyan/50 hover:shadow-cos-glow transition-all cursor-pointer group">
                      <span className="font-mono text-xs text-brand-400 mb-1 block">PHASE 0{i+1}</span>
                      <span className="font-medium group-hover:text-electric-cyan transition-colors">{step}</span>
                    </div>
                    {i < 4 && <div className="h-6 w-px bg-electric-cyan/30 my-1 group-hover:bg-electric-cyan transition-colors"></div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'entity' && (
            <div className="flex items-center justify-center w-full h-full animate-in fade-in zoom-in duration-500">
               <h2 className="absolute top-8 left-8 text-xl font-bold text-ink-200">PGL Entity Relationships</h2>
               <div className="relative w-full max-w-3xl h-96">
                 {/* Simplified mock nodes for the diagram */}
                 <div className="absolute top-4 left-1/2 -translate-x-1/2 p-3 bg-surface2 border border-border rounded-lg shadow-card text-sm">Organization</div>
                 <div className="absolute top-24 left-1/4 p-3 bg-surface2 border border-border rounded-lg shadow-card text-sm">Principal User</div>
                 <div className="absolute top-24 right-1/4 p-3 bg-surface2 border border-border rounded-lg shadow-card text-sm text-electric-cyan">AI Agent</div>
                 <div className="absolute top-48 left-1/2 -translate-x-1/2 p-3 bg-void-black border border-brand-500/50 rounded-lg shadow-cos-glow font-mono text-sm text-brand-400">Execution Identity (EI)</div>
                 <div className="absolute bottom-12 left-1/3 p-3 bg-surface2 border border-border rounded-lg shadow-card text-sm">Capability Context</div>
                 <div className="absolute bottom-12 right-1/3 p-3 bg-surface2 border border-border rounded-lg shadow-card text-sm text-matrix-emerald">PGL Evidence Hash</div>
                 
                 {/* Connecting lines via SVG */}
                 <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
                    <path d="M 384 48 L 220 100" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
                    <path d="M 384 48 L 540 100" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
                    <path d="M 220 130 L 384 200" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
                    <path d="M 540 130 L 384 200" stroke="rgba(0,229,255,0.3)" strokeWidth="2" strokeDasharray="4 4" fill="none" className="animate-pulse" />
                    <path d="M 384 240 L 280 330" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
                    <path d="M 384 240 L 480 330" stroke="rgba(0,255,102,0.3)" strokeWidth="2" fill="none" />
                 </svg>
               </div>
            </div>
          )}

          {activeTab === 'ecosystem' && (
            <div className="flex items-center justify-center w-full h-full animate-in fade-in zoom-in duration-500">
               <h2 className="absolute top-8 left-8 text-xl font-bold text-ink-200">Veklom Ecosystem Overlay</h2>
               <div className="grid grid-cols-3 gap-8 w-full max-w-4xl">
                 <div className="p-6 border border-border bg-bg-800 rounded-xl text-center hover:border-brand-500/50 transition-colors cursor-default shadow-card">
                   <div className="text-brand-400 font-mono text-sm mb-2">Edge Layer</div>
                   <h3 className="font-bold mb-2">Control Plane</h3>
                   <p className="text-xs text-ink-400">Client Interfaces, Nexus UI, ABIDE Compilers</p>
                 </div>
                 <div className="p-6 border border-electric-cyan/30 bg-bg-800 rounded-xl text-center relative shadow-cos-glow">
                   <div className="text-electric-cyan font-mono text-sm mb-2">Core Engine</div>
                   <h3 className="font-bold mb-2">CAPPO Runtime</h3>
                   <p className="text-xs text-ink-400">Governed Execution, PII Shield, x402 Gateway</p>
                 </div>
                 <div className="p-6 border border-border bg-bg-800 rounded-xl text-center hover:border-matrix-emerald/50 transition-colors cursor-default shadow-card">
                   <div className="text-matrix-emerald font-mono text-sm mb-2">Immutable Trust</div>
                   <h3 className="font-bold mb-2">GnomLedger</h3>
                   <p className="text-xs text-ink-400">Proof of Graph, Lineage, Evidence Signatures</p>
                 </div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
