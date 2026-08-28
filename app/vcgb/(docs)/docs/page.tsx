"use client";

import React from 'react';
import Link from 'next/link';
import { FileText, Target, ListChecks, CheckSquare, Crosshair } from 'lucide-react';

export default function VCGBDocsHubPage() {
 const sections = [
 {
 title:"Evaluation Criteria",
 description:"Understand the five dimensions of evaluation: Decision correctness, Effect correctness, Evidence correctness, Fail-mode correctness, and Performance.",
 icon: CheckSquare,
 links: [
 { name:"The Five Evaluation Dimensions", href:"/vcgb/criteria" }
 ]
 },
 {
 title:"Test Scenarios",
 description:"25 canonical scenarios across 5 adversarial families testing Authority, Integrity, Fail-closed availability, Replay concurrency, and Execution escape.",
 icon: ListChecks,
 links: [
 { name:"Scenario Schema & Index", href:"/vcgb/scenarios" }
 ]
 }
 ];

 return (
 <div className="space-y-12 pb-24 text-cos-text">
 <div>
 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cos-accent/10 border border-cos-accent/20 text-cos-accent text-xs font-bold uppercase tracking-widest mb-5">
 <FileText className="w-3.5 h-3.5" /> Draft: v0.1.0
 </div>
 <h1 className="text-4xl font-extrabold tracking-tight mb-6">VCGB Documentation Hub</h1>
 <p className="text-xl text-cos-text/70 leading-relaxed mb-8">
 The Veklom Capability Governance Benchmark (VCGB) is an open, machine-readable adversarial benchmark for capability governance systems.
 </p>
 </div>

 <div className="grid md:grid-cols-3 gap-4">
 {[
 { icon: Target, label:"Effect Boundary", value:"Ground Truth" },
 { icon: FileText, label:"Evidence", value:"Denials are Evidence" },
 { icon: Crosshair, label:"Scoring", value:"Security vs Operability" }
 ].map((item) => {
 const Icon = item.icon;
 return (
 <div key={item.label} className="bg-bg-900/40 border border-border rounded-xl p-4">
 <div className="flex items-center gap-2 text-cos-accent text-xs font-mono uppercase tracking-widest mb-2">
 <Icon className="w-3.5 h-3.5" /> {item.label}
 </div>
 <div className="text-sm font-semibold text-cos-text">{item.value}</div>
 </div>
 );
 })}
 </div>

 <div className="grid md:grid-cols-2 gap-8">
 {sections.map((section, idx) => {
 const Icon = section.icon;
 return (
 <div key={idx} className="bg-bg-900/50 border border-border p-8 rounded-2xl hover:border-cos-accent/30 transition-colors group">
 <div className="flex items-center gap-4 mb-4">
 <div className="w-12 h-12 rounded-xl bg-cos-accent/10 flex items-center justify-center border border-cos-accent/20 group-hover:bg-cos-accent/20 transition-colors">
 <Icon className="w-6 h-6 text-cos-accent" />
 </div>
 <h2 className="text-xl font-bold">{section.title}</h2>
 </div>
 <p className="text-cos-text/70 mb-6 leading-relaxed">{section.description}</p>
 <ul className="space-y-3">
 {section.links.map((link, i) => (
 <li key={i}>
 <Link href={link.href} className="text-cos-text/90 hover:text-cos-accent transition-colors flex items-center gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-cos-accent/50" />
 {link.name}
 </Link>
 </li>
 ))}
 </ul>
 </div>
 )
 })}
 </div>
 
 <div className="mt-12 p-6 rounded-xl bg-cos-accent/5 border border-cos-accent/10">
 <h3 className="font-bold mb-2 flex items-center gap-2"><CheckSquare className="w-4 h-4 text-cos-accent" /> Conformant Run</h3>
 <p className="text-sm text-cos-text/80">
 A VCGB-Conformant Run satisfies: harness-owned effect environment, GAI adapter, all five evaluation dimensions recorded per scenario, independent EEE verification, and a published result bundle.
 </p>
 </div>
 </div>
 );
}
