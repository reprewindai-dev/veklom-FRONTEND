"use client";

import React from 'react';
import { Scale, MapPin, CheckCircle } from 'lucide-react';

export default function GovernancePage() {
  return (
    <div className="space-y-12 pb-24">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">Governance Charter</h1>
        <p className="text-xl text-gray-400 leading-relaxed mb-8">
          The Veklom Nexus Protocol asserts a foundational epistemic claim: trust is not required because cryptographic verification is native. 
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Decentralized Epistemic Claims</h2>
          <div className="prose prose-invert max-w-none text-gray-300">
            <p className="leading-relaxed">
              Every API measurement must be independently reproducible from published raw data and node attestations. Furthermore, every composite score must be computable by third parties from locked mathematical formulas. 
              <strong> There are no subjective, non-mechanical decision paths within the protocol's certification pipeline.</strong>
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Strategic Localization: Quinte West Epicenter</h2>
          <div className="bg-[#FFB800]/5 border border-[#FFB800]/20 rounded-xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <MapPin className="w-32 h-32 text-[#FFB800]" />
            </div>
            <div className="relative z-10">
              <h3 className="text-[#FFB800] text-lg font-bold mb-4">Canadian Operational Anchor</h3>
              <p className="text-gray-300 leading-relaxed mb-6">
                For a cryptographic protocol of this magnitude to achieve universal adoption, a highly specialized workforce must be trained to deploy, monitor, and defend its infrastructure. The operational rollout and academic integration of VNP is strategically anchored in the Quinte West and Belleville technology corridor in Ontario, Canada.
              </p>
              <ul className="space-y-4">
                <li className="flex gap-3 text-sm text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                  <span><strong>Loyalist College Integration:</strong> Direct academic pipeline with the Cyber Security post-graduate program, aligning coursework (CYSE1006, CYSE2000) directly with VNP operational mechanics like HSM enclaves and zk-SNARK auditing.</span>
                </li>
                <li className="flex gap-3 text-sm text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                  <span><strong>Sovereign Security:</strong> Proximity to Canadian Forces Base (CFB) Trenton reinforces the critical infrastructure resilience required for federal compliance.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Regulatory Compliance</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
              <h4 className="font-bold text-white mb-2">OSFI Guidelines B-10 & B-13</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                VNP's Emergency Topology State directly satisfies OSFI requirements for proactive threat hunting and incident detection, deploying ephemeral proxy swarms during localized failures.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
              <h4 className="font-bold text-white mb-2">Critical Cyber Systems Protection Act (CCSPA)</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                Mathematical resilience against BGP route leaks and adversarial infrastructure manipulation via robust statistics provides designated operators with an incontestable defense.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
