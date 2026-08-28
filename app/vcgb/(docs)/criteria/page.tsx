"use client";

import React from 'react';
import { Target, CheckSquare, Activity, AlertCircle } from 'lucide-react';

export default function VCGBCriteriaPage() {
 return (
 <div className="space-y-12 pb-24 text-cos-text">
 <div>
 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cos-accent/10 border border-cos-accent/20 text-cos-accent text-sm font-medium font-mono mb-6">
 VCGB EVALUATION CRITERIA
 </div>
 <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
 The Five Evaluation Dimensions
 </h1>
 <p className="text-xl text-cos-text/70 leading-relaxed mb-8">
 Every scenario is scored on five dimensions. Each is independently pass/fail. Scenario verdict = PASS iff all applicable dimensions pass.
 </p>
 </div>

 <div className="bg-void-panel border border-border rounded-xl p-6 mb-12">
 <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
 <Activity className="w-5 h-5 text-cos-accent" /> Ground Truth Principle
 </h2>
 <p className="text-cos-text/90 leading-relaxed">
 The harness — not the implementation under test (IUT) — owns the effect environment: mock merchant APIs, mock filesystems, mock network egress, mock payment rails. Effect correctness is <strong>observed by the harness</strong>, never self-reported.
 </p>
 </div>

 <div className="space-y-8">
 <div className="bg-bg-900 border border-border rounded-xl p-6 overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="text-xs text-cos-text/50 uppercase bg-bg-800">
 <tr>
 <th className="px-4 py-3 rounded-tl-lg">Dimension</th>
 <th className="px-4 py-3">Question</th>
 <th className="px-4 py-3 rounded-tr-lg">Ground truth source</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 <tr>
 <td className="px-4 py-4 font-bold text-cos-text">Decision correctness</td>
 <td className="px-4 py-4 text-cos-text/80">Was ALLOW/DENY correct per the declared authority and policy?</td>
 <td className="px-4 py-4 text-cos-text/80">Harness comparison against <code>expected.decision</code></td>
 </tr>
 <tr>
 <td className="px-4 py-4 font-bold text-cos-text">Effect correctness</td>
 <td className="px-4 py-4 text-cos-text/80">Did prohibited effects actually not occur? Did required effects occur?</td>
 <td className="px-4 py-4 text-cos-text/80">Harness-owned effect probes</td>
 </tr>
 <tr>
 <td className="px-4 py-4 font-bold text-cos-text">Evidence correctness</td>
 <td className="px-4 py-4 text-cos-text/80">Does a conformant EEE artifact exist, and does it independently verify?</td>
 <td className="px-4 py-4 text-cos-text/80">EEE verification procedure, run by the harness</td>
 </tr>
 <tr>
 <td className="px-4 py-4 font-bold text-cos-text">Fail-mode correctness</td>
 <td className="px-4 py-4 text-cos-text/80">Under injected infrastructure failure, did the system exhibit the specified safe behavior?</td>
 <td className="px-4 py-4 text-cos-text/80">Harness fault injection + effect probes</td>
 </tr>
 <tr>
 <td className="px-4 py-4 font-bold text-cos-text">Performance</td>
 <td className="px-4 py-4 text-cos-text/80">Was the enforcement decision made within the declared budget?</td>
 <td className="px-4 py-4 text-cos-text/80">External wall-clock measurement by the harness</td>
 </tr>
 </tbody>
 </table>
 </div>

 <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-xl">
 <h4 className="text-orange-400 font-bold mb-3 flex items-center gap-2">
 <AlertCircle className="w-5 h-5" /> Rationale
 </h4>
 <p className="text-cos-text/80 leading-relaxed">
 A policy engine that decides correctly but doesn't sit on the side-effect boundary fails <em>effect correctness</em>. A fast engine that can't prove what it did fails <em>evidence correctness</em>. A correct engine that's too slow to sit inline fails <em>performance</em>. VCGB is specifically designed so that no single strong component can carry a weak system.
 </p>
 </div>
 </div>
 </div>
 );
}
