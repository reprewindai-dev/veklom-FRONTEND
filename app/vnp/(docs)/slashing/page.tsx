"use client";

import React from 'react';
import { ShieldAlert, TrendingDown } from 'lucide-react';

export default function SlashingPage() {
  return (
    <div className="space-y-12 pb-24">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">Slashing Mechanics</h1>
        <p className="text-xl text-gray-400 leading-relaxed mb-8">
          Protecting honest providers through the inherent structural strength of robust statistics.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4 border-b border-white/10 pb-4">The "Remaining Node Poisoning Trap"</h2>
          <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-xl text-gray-300">
            <p className="leading-relaxed mb-4">
              Previous protocol versions (v0.1.15) utilized strict minimum functions for proxy score caps. This created a devastating vulnerability where an attacker could DDoS 3 out of 5 regional nodes, and execute a localized BGP route-leak on the remaining 2 nodes.
            </p>
            <p className="leading-relaxed">
              Because a minimum function has a breakdown point of 0%, a single adversarial input of zero completely dictates the output—resulting in unjust financial slashing for flawless competitors.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 border-b border-white/10 pb-4">Bounding Outliers via MAD</h2>
          <div className="prose prose-invert max-w-none text-gray-300 mb-6">
            <p className="leading-relaxed">
              VNP v1.0 abandons strict minimums for robust statistical estimators based on the <strong>Median Absolute Deviation (MAD)</strong>. The median boasts the maximum possible theoretical breakdown point of 50%, ensuring extreme resilience against adversarial data poisoning.
            </p>
            
            <div className="bg-black/50 p-6 rounded-lg font-mono text-sm overflow-x-auto border border-white/10 my-6">
              MAD = 1.4826 × median(|x_i - median(x)|)
            </div>
            
            <p className="leading-relaxed">
              By calculating a Weighted Confidence Multiplier based on surviving node count and interpolating between the raw observation and a dynamically enforced lower bound, VNP successfully isolates adversarial outliers.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mt-8">
            <div className="p-4 bg-white/5 font-bold text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#FFB800]" /> MAD-Bounded Estimator Resilience
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/50 text-gray-400">
                  <tr>
                    <th className="p-4 font-medium">Scenario</th>
                    <th className="p-4 font-medium">Active Nodes</th>
                    <th className="p-4 font-medium">Raw Obs.</th>
                    <th className="p-4 font-medium">Bounded Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="p-4">DDoS 3/5 nodes + Route leak on 2</td>
                    <td className="p-4 font-mono">2</td>
                    <td className="p-4 font-mono text-red-400">0.0</td>
                    <td className="p-4 font-mono text-green-400">47.70</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="p-4">DDoS 4/5 nodes + Route leak on 1</td>
                    <td className="p-4 font-mono">1</td>
                    <td className="p-4 font-mono text-red-400">0.0</td>
                    <td className="p-4 font-mono text-green-400">63.60</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="p-4">DDoS 5/5 nodes (Blackout)</td>
                    <td className="p-4 font-mono">0</td>
                    <td className="p-4 font-mono text-red-400">0.0</td>
                    <td className="p-4 font-mono text-green-400">79.50</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="p-4">Genuine partial failure on 2</td>
                    <td className="p-4 font-mono">2</td>
                    <td className="p-4 font-mono text-yellow-400">50.0</td>
                    <td className="p-4 font-mono text-green-400">67.70</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
