"use client";

import React, { useState } from 'react';
import { NeuralCanvas } from './NeuralCanvas';

export function FourSplitDemo() {
 const [chaosInjected, setChaosInjected] = useState(false);

 const handleInjectChaos = () => {
 setChaosInjected(true);
 // Auto reset after 5 seconds
 setTimeout(() => {
 setChaosInjected(false);
 }, 5000);
 };

 return (
 <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto p-4">
 <div className="flex flex-col sm:flex-row justify-between items-center bg-[var(--theme-surface)] p-6 rounded-xl border border-[var(--theme-border)] shadow-cos-card">
 <div>
 <h2 className="text-2xl font-bold text-glow-cyan text-[var(--theme-text)]">Governed Execution Pipeline</h2>
 <p className="text-[var(--theme-text-muted)] text-sm mt-1">
 Observe the agent workflows. Inject chaos to see Veklom's absolute failstop intercept rogue threads.
 </p>
 </div>
 <button
 onClick={handleInjectChaos}
 disabled={chaosInjected}
 className={`mt-4 sm:mt-0 px-6 py-3 rounded-lg font-bold uppercase tracking-widest text-xs transition-all ${
 chaosInjected 
 ? 'bg-[var(--theme-danger)] text-black shadow-[0_0_20px_rgba(255,77,77,0.6)] cursor-not-allowed'
 : 'btn-primary'
 }`}
 >
 {chaosInjected ? 'Failstop Triggered' : 'Inject Chaos'}
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-[600px]">
 {/* Quadrant 1 - Always safe */}
 <div className="relative w-full h-full">
 <div className="absolute top-4 left-4 z-10 px-3 py-1 text-xs font-mono rounded bg-black/50 border border-[var(--theme-verified)] text-[var(--theme-verified)] backdrop-blur-md">
 Thread-01: Aligned
 </div>
 <NeuralCanvas status="running" color="#00FF66" />
 </div>

 {/* Quadrant 2 - Goes rogue */}
 <div className="relative w-full h-full">
 <div className={`absolute top-4 left-4 z-10 px-3 py-1 text-xs font-mono rounded bg-black/50 border backdrop-blur-md transition-colors ${chaosInjected ? 'border-[var(--theme-danger)] text-[var(--theme-danger)]' : 'border-[var(--theme-accent)] text-[var(--theme-accent)]'}`}>
 Thread-02: {chaosInjected ? 'HALTED (Policy Breach)' : 'Executing'}
 </div>
 <NeuralCanvas status={chaosInjected ? 'halted' : 'running'} color="#00E5FF" />
 </div>

 {/* Quadrant 3 - Goes rogue */}
 <div className="relative w-full h-full">
 <div className={`absolute top-4 left-4 z-10 px-3 py-1 text-xs font-mono rounded bg-black/50 border backdrop-blur-md transition-colors ${chaosInjected ? 'border-[var(--theme-danger)] text-[var(--theme-danger)]' : 'border-[var(--theme-accent)] text-[var(--theme-accent)]'}`}>
 Thread-03: {chaosInjected ? 'HALTED (Data Egress Blocked)' : 'Executing'}
 </div>
 <NeuralCanvas status={chaosInjected ? 'halted' : 'running'} color="#00E5FF" />
 </div>

 {/* Quadrant 4 - Always safe */}
 <div className="relative w-full h-full">
 <div className="absolute top-4 left-4 z-10 px-3 py-1 text-xs font-mono rounded bg-black/50 border border-[var(--theme-verified)] text-[var(--theme-verified)] backdrop-blur-md">
 Thread-04: Aligned
 </div>
 <NeuralCanvas status="running" color="#00FF66" />
 </div>
 </div>
 </div>
 );
}
