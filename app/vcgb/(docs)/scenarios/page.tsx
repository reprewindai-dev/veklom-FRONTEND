"use client";

import React from 'react';
import { ListChecks, AlertTriangle } from 'lucide-react';

export default function VCGBScenariosPage() {
 return (
 <div className="space-y-12 pb-24 text-cos-text">
 <div>
 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cos-accent/10 border border-cos-accent/20 text-cos-accent text-sm font-medium font-mono mb-6">
 VCGB SCENARIOS
 </div>
 <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
 Adversarial Test Suite
 </h1>
 <p className="text-xl text-cos-text/70 leading-relaxed mb-8">
 The suite contains 25 canonical scenarios across 5 adversarial families. Scenario IDs are immutable.
 </p>
 </div>

 <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl mb-12">
 <h4 className="text-red-400 font-bold mb-3 flex items-center gap-2">
 <AlertTriangle className="w-5 h-5" /> No Partial Credit
 </h4>
 <p className="text-cos-text/80 leading-relaxed">
 A headline claim (e.g.,"25/25") MUST name: suite version, <code>suite_hash</code>, implementation commit, and publish the full result bundle."23/25" is a matrix result, not a headline. Rounding it into a pass is non-conformant marketing.
 </p>
 </div>

 <div className="space-y-8">
 <h2 className="text-2xl font-bold border-b border-border pb-4">Suite Contents (v0.1.0)</h2>
 <div className="bg-bg-900 border border-border rounded-xl p-6 overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="text-xs text-cos-text/50 uppercase bg-bg-800">
 <tr>
 <th className="px-4 py-3 rounded-tl-lg">Family</th>
 <th className="px-4 py-3 text-center">Count</th>
 <th className="px-4 py-3 rounded-tr-lg">IDs</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 <tr>
 <td className="px-4 py-4 font-bold text-cos-text">Authority attenuation</td>
 <td className="px-4 py-4 text-center font-mono">6</td>
 <td className="px-4 py-4 text-cos-text/80 font-mono text-xs">AUTH-EXPIRED-001, AUTH-WRONGCAP-002, AUTH-ARGESC-003, AUTH-SPEND-004, AUTH-DEPTH-005, AUTH-REVOKED-006</td>
 </tr>
 <tr>
 <td className="px-4 py-4 font-bold text-cos-text">Integrity</td>
 <td className="px-4 py-4 text-center font-mono">5</td>
 <td className="px-4 py-4 text-cos-text/80 font-mono text-xs">INT-CAPHASH-001, INT-POLSUB-002, INT-EVIDMOD-003, INT-IDSUB-004, INT-RUNTIME-005</td>
 </tr>
 <tr>
 <td className="px-4 py-4 font-bold text-cos-text">Fail-closed availability</td>
 <td className="px-4 py-4 text-center font-mono">4</td>
 <td className="px-4 py-4 text-cos-text/80 font-mono text-xs">FC-POLICY-001, FC-SIGNER-002, FC-REGISTRY-003, FC-SETTLE-004</td>
 </tr>
 <tr>
 <td className="px-4 py-4 font-bold text-cos-text">Replay & concurrency</td>
 <td className="px-4 py-4 text-center font-mono">5</td>
 <td className="px-4 py-4 text-cos-text/80 font-mono text-xs">RC-AUTHREPLAY-001, RC-PAYREPLAY-002, RC-DUPEXEC-003, RC-BUDGETRACE-004, RC-DELEGRACE-005</td>
 </tr>
 <tr>
 <td className="px-4 py-4 font-bold text-cos-text">Execution escape</td>
 <td className="px-4 py-4 text-center font-mono">5</td>
 <td className="px-4 py-4 text-cos-text/80 font-mono text-xs">ESC-UNKTOOL-001, ESC-BACKEND-002, ESC-NET-003, ESC-DOWNSTREAM-004, ESC-TOOLCHAIN-005</td>
 </tr>
 </tbody>
 </table>
 </div>
 <p className="text-sm text-cos-text/60 italic">Canonical scenario definitions: <code>vcgb-scenarios-v0.1.0.yaml</code></p>
 </div>
 
 <div className="space-y-8 mt-12">
 <h2 className="text-2xl font-bold border-b border-border pb-4">Scenario Schema</h2>
 <div className="bg-bg-900 border border-border rounded-xl p-6 overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="text-xs text-cos-text/50 uppercase bg-bg-800">
 <tr>
 <th className="px-4 py-3 rounded-tl-lg">Field</th>
 <th className="px-4 py-3">Req</th>
 <th className="px-4 py-3 rounded-tr-lg">Description</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 <tr>
 <td className="px-4 py-3 font-mono text-cos-accent">scenario.id</td>
 <td className="px-4 py-3 text-green-400">yes</td>
 <td className="px-4 py-3">Stable forever; fixed scenarios get new IDs, not edits.</td>
 </tr>
 <tr>
 <td className="px-4 py-3 font-mono text-cos-accent">expected.decision</td>
 <td className="px-4 py-3 text-green-400">yes</td>
 <td className="px-4 py-3">ALLOW / DENY / structured outcomes.</td>
 </tr>
 <tr>
 <td className="px-4 py-3 font-mono text-cos-accent">expected.effects.prohibited</td>
 <td className="px-4 py-3 text-green-400">yes</td>
 <td className="px-4 py-3">Effects the harness MUST NOT observe.</td>
 </tr>
 <tr>
 <td className="px-4 py-3 font-mono text-cos-accent">expected.evidence</td>
 <td className="px-4 py-3 text-green-400">yes</td>
 <td className="px-4 py-3">Assertions over envelope fields evaluated after independent EEE verification.</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
}
