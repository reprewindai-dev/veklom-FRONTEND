"use client";

import React from 'react';
import { Server, Lock, HardDrive, Cpu, Terminal } from 'lucide-react';

export default function OperatorsPage() {
  return (
    <div className="space-y-12 pb-24">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">Node Operator Guide</h1>
        <p className="text-xl text-gray-400 leading-relaxed mb-8">
          Technical specifications for running a VNP Tier-1 Autonomous Relay or contributing to the RPN Swarm.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4 border-b border-white/10 pb-4">Hardware Requirements (Tier-1 Core Relay)</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Core Relays act as the primary aggregators for Edge Probes and execute the computationally heavy zk-SNARK settlements. They must be provisioned on bare-metal infrastructure.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4">
              <Cpu className="w-6 h-6 text-[#FFB800]" />
              <div>
                <span className="block font-bold text-sm">Processor</span>
                <span className="text-gray-400 text-sm">32+ Cores (AVX-512 required for VDFs)</span>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4">
              <HardDrive className="w-6 h-6 text-[#FFB800]" />
              <div>
                <span className="block font-bold text-sm">Storage</span>
                <span className="text-gray-400 text-sm">2TB NVMe PCIe 4.0</span>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4">
              <Server className="w-6 h-6 text-[#FFB800]" />
              <div>
                <span className="block font-bold text-sm">Memory</span>
                <span className="text-gray-400 text-sm">128GB ECC RAM</span>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4">
              <Lock className="w-6 h-6 text-[#FFB800]" />
              <div>
                <span className="block font-bold text-sm">Security</span>
                <span className="text-gray-400 text-sm">HSM / TPM 2.0 Enclave</span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 border-b border-white/10 pb-4">Ed25519 Key Generation</h2>
          <div className="bg-black/50 p-6 rounded-lg font-mono text-sm overflow-x-auto border border-white/10">
            <div className="text-gray-500 mb-2"># Generate cryptographic identity inside HSM</div>
            <div className="text-green-400">$ vnp-cli identity generate --type ed25519 --hsm-pin ****</div>
            <div className="text-blue-300 mt-2">Success! Node PubKey: <span className="text-white">vnp1...a9f2</span></div>
            <div className="text-gray-500 mt-4"># Register identity on Base Mainnet</div>
            <div className="text-green-400">$ vnp-cli chain register --rpc https://base-mainnet.infura.io/v3/YOUR_API_KEY</div>
          </div>
        </section>
      </div>
    </div>
  );
}
