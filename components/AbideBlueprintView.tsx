import React, { useState } from 'react';
import { Sparkles, Play, CheckCircle2, FileText, ArrowRight, RefreshCw, Cpu, Layers, DollarSign } from 'lucide-react';
import { AbideBlueprint } from '../types.js';

export const AbideBlueprintView: React.FC = () => {
 const [rawIntent, setRawIntent] = useState<string>(
 'Refactor our TypeScript microservice repo to remove duplicate type imports, enforce cAPI schema validation, scan for secret leaks with RepoGate, and generate a non-repudiable PGL audit log for production release.'
 );
 const [isCompiling, setIsCompiling] = useState<boolean>(false);
 const [blueprint, setBlueprint] = useState<AbideBlueprint | null>(null);

 const handleCompileIntent = async () => {
 setIsCompiling(true);
 try {
 const response = await fetch('/api/local/abide/plan', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ rawIntent })
 });
 const data: AbideBlueprint = await response.json();
 setBlueprint(data);
 } catch (err) {
 console.error('Abide error:', err);
 } finally {
 setIsCompiling(false);
 }
 };

 return (
 <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-slate-200">
 {/* Title Header */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-theme-border">
 <div>
 <div className="flex items-center gap-2 text-theme-accent text-xs font-mono font-medium mb-1">
 <Sparkles className="w-4 h-4" /> ABIDE UNIVERSAL ABSTRACT PLAN CONTROLLER
 </div>
 <h2 className="text-2xl font-bold text-white">Intent-to-Blueprint Compilation Engine</h2>
 <p className="text-xs text-slate-400 font-mono">
 Compiles messy natural language intent into gold-standard execution blueprints backed by Einstein trend probability, SSRN validation, and X402 settlements.
 </p>
 </div>

 <div className="flex items-center gap-2 text-2xs font-mono">
 <span className="px-2.5 py-1 rounded bg-theme-accent/10 border border-theme-border text-theme-accent font-bold">
 EINSTEIN MODEL: ACTIVE
 </span>
 <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
 SSRN VALIDATOR: ON-CHAIN
 </span>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 {/* Left Column: Intent Input (5 cols) */}
 <div className="lg:col-span-5 space-y-6">
 <div className="bg-theme-surface p-5 rounded-2xl border border-theme-border space-y-4">
 <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
 <FileText className="w-4 h-4 text-theme-accent" /> Enter Raw Developer Intent
 </h3>

 <textarea
 rows={6}
 value={rawIntent}
 onChange={(e) => setRawIntent(e.target.value)}
 placeholder="Describe what you want your coding agents or cAPI tools to accomplish..."
 className="w-full bg-theme-surface border border-theme-border rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-theme-border leading-relaxed"
 ></textarea>

 <button
 onClick={handleCompileIntent}
 disabled={isCompiling || !rawIntent.trim()}
 className="w-full py-3 rounded-xl bg-theme-surface to-emerald-600 hover: hover:to-emerald-500 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-theme-accent/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
 >
 {isCompiling ? (
 <>
 <RefreshCw className="w-4 h-4 animate-spin" /> Compiling Gold-Standard Blueprint...
 </>
 ) : (
 <>
 <Sparkles className="w-4 h-4" /> Compile Intent into Abide Blueprint
 </>
 )}
 </button>
 </div>
 </div>

 {/* Right Column: Compiled Blueprint Output (7 cols) */}
 <div className="lg:col-span-7 space-y-6">
 {blueprint ? (
 <div className="space-y-6">
 {/* Top Summary Box */}
 <div className="bg-theme-surface p-5 rounded-2xl border border-theme-border space-y-4 font-mono text-xs">
 <div className="flex items-center justify-between pb-3 border-b border-theme-border">
 <div className="text-slate-300 font-bold">
 ABIDE BLUEPRINT: <span className="text-theme-accent">{blueprint.blueprintId}</span>
 </div>
 <span className="text-3xs text-slate-400">{blueprint.timestamp}</span>
 </div>

 {/* Academic Metrics Row */}
 <div className="grid grid-cols-3 gap-2 text-center text-2xs">
 <div className="p-3 bg-theme-surface rounded-xl border border-theme-border">
 <div className="text-slate-400 text-3xs">Einstein Trend Prob.</div>
 <div className="text-emerald-400 font-bold text-sm mt-0.5">
 {(blueprint.einsteinProbabilityScore * 100).toFixed(2)}%
 </div>
 </div>
 <div className="p-3 bg-theme-surface rounded-xl border border-theme-border">
 <div className="text-slate-400 text-3xs">SSRN Academic Citation</div>
 <div className="text-theme-accent font-bold text-3xs mt-1 truncate">
 {blueprint.ssrnAcademicValidator.doi}
 </div>
 </div>
 <div className="p-3 bg-theme-surface rounded-xl border border-theme-border">
 <div className="text-slate-400 text-3xs">X402 Settlement</div>
 <div className="text-amber-400 font-bold text-2xs mt-1 flex items-center justify-center gap-1">
 <DollarSign className="w-3 h-3" /> {blueprint.x402Settlement.amountMicroTokens} uVNP
 </div>
 </div>
 </div>

 {/* Compiled Steps Tree */}
 <div className="space-y-3 pt-2">
 <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
 Hierarchical Execution Steps
 </div>
 <div className="space-y-3">
 {blueprint.compiledSteps.map((step, idx) => (
 <div key={step.stepId} className="p-4 bg-theme-surface rounded-xl border border-theme-border space-y-2">
 <div className="flex items-center justify-between text-xs font-bold text-theme-accent/70">
 <span className="flex items-center gap-2">
 <span className="w-5 h-5 rounded-full bg-theme-accent/20 text-theme-accent flex items-center justify-center text-3xs">
 {idx + 1}
 </span>
 {step.title}
 </span>
 <span className="text-3xs text-emerald-400">
 {(step.confidenceScore * 100).toFixed(1)}% Confidence
 </span>
 </div>

 <div className="flex items-center gap-4 text-3xs text-slate-400 font-mono">
 <span>Capability: <strong className="text-slate-200">{step.capabilityRequired}</strong></span>
 <span>Harness Rec: <strong className="text-theme-accent uppercase">{step.harnessRecommendation}</strong></span>
 </div>

 <ul className="text-3xs text-slate-400 space-y-1 pt-1 border-t border-theme-border pl-2">
 {step.subtasks.map((sub, sIdx) => (
 <li key={sIdx} className="flex items-start gap-1.5">
 <span className="text-theme-accent font-bold">•</span>
 <span>{sub}</span>
 </li>
 ))}
 </ul>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 ) : (
 <div className="bg-theme-surface p-12 rounded-2xl border border-theme-border text-center space-y-4">
 <div className="w-12 h-12 rounded-2xl bg-theme-accent/10 border border-theme-border text-theme-accent flex items-center justify-center mx-auto">
 <Sparkles className="w-6 h-6" />
 </div>
 <h3 className="text-base font-bold text-white">Abide Compiler Ready</h3>
 <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed font-mono">
 Provide developer or organizational intent on the left to compile a gold-standard execution plan verified by the Einstein trend probability model.
 </p>
 </div>
 )}
 </div>
 </div>
 </div>
 );
};
