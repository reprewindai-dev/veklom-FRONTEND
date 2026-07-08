"use client";

import React from 'react';
import { Lock, Zap, FileJson } from 'lucide-react';

export default function x402Page() {
  return (
    <div className="space-y-12 pb-24">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">x402 Settlement</h1>
        <p className="text-xl text-gray-400 leading-relaxed mb-8">
          The resolution of the Time-Lock Paradox using zero-knowledge proofs for trustless M2M financial SLA settlement.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4 border-b border-white/10 pb-4">The x402 Specification</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <p className="text-gray-300 leading-relaxed">
              HTTP status 402 ("Payment Required") was reserved by standard in 1999 but never fully realized. The Veklom Nexus Protocol introduces the <strong>x402 extension</strong>, binding cryptographic settlement receipts to STAMP SLA assertions natively in the HTTP layer. 
            </p>
          </div>
          <div className="bg-black/50 p-6 rounded-lg font-mono text-sm overflow-x-auto border border-white/10">
            <div className="text-gray-500 mb-2">// VNP x402 Encapsulated Header Example</div>
            <div className="text-green-400">HTTP/1.1 200 OK</div>
            <div className="text-blue-300">X-VNP-Stake-Result: <span className="text-white">yield=0.005_USDC,slashed=false</span></div>
            <div className="text-blue-300">X-Veklom-Receipt-ID: <span className="text-white">0x3a74772e925b54F7dAD7FD95c9Ba30825033f970</span></div>
            <div className="text-blue-300">X-VNP-Evidence-Hash: <span className="text-white">zKSNARK_proof_alpha</span></div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 border-b border-white/10 pb-4">Resolving the Time-Lock Paradox</h2>
          <div className="prose prose-invert max-w-none text-gray-300">
            <p className="leading-relaxed">
              To assert SLA performance across decentralized nodes, raw timing measurements must be pooled. However, if a node broadcasts its measurement instantly, adversarial nodes can manipulate their own submissions to poison the resulting aggregate score. 
            </p>
            <p className="leading-relaxed">
              If nodes delay disclosure, latency-sensitive M2M economies stall waiting for settlement. This is the Time-Lock Paradox. VNP v1.0 solves this via a combination of <strong>Verifiable Delay Functions (VDFs)</strong> and <strong>zk-SNARKs</strong>.
            </p>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="bg-[#FFB800]/5 border border-[#FFB800]/20 p-6 rounded-xl relative overflow-hidden group hover:border-[#FFB800]/50 transition-colors">
            <Lock className="w-8 h-8 text-[#FFB800] mb-4" />
            <h3 className="font-bold text-lg mb-2 text-white">Verifiable Delay Functions (VDF)</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Nodes publish an encrypted commitment of their timing data, utilizing a strict sequential VDF. This mathematically guarantees a 30-second delay before the decryption key can be calculated, preventing front-running and ensuring that all node commitments are irrevocably locked before the plaintext is revealed.
            </p>
          </div>
          
          <div className="bg-[#FFB800]/5 border border-[#FFB800]/20 p-6 rounded-xl relative overflow-hidden group hover:border-[#FFB800]/50 transition-colors">
            <Zap className="w-8 h-8 text-[#FFB800] mb-4" />
            <h3 className="font-bold text-lg mb-2 text-white">zk-SNARK Instant Settlement</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Despite the 30-second VDF lock, settlement must occur instantly. VNP nodes generate a zk-SNARK proof demonstrating that their encrypted commitment constitutes a genuine SLA failure based on local TTFB timings. The smart contract validates this mathematical proof instantly without seeing the raw data, allowing immediate micro-slashing of the provider's bond.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
