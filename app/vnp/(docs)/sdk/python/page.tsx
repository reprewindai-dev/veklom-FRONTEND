"use client";

import React from 'react';
import { Terminal, Download, ShieldCheck } from 'lucide-react';

export default function PythonSDKPage() {
  return (
    <div className="space-y-12 pb-24">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">Python Probe SDK</h1>
        <p className="text-xl text-gray-400 leading-relaxed mb-8">
          The official Python implementation for VNP Edge Probes. Deploy STAMP RFC 8762 compliant timing interceptors across your residential proxy networks.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4 border-b border-white/10 pb-4">Installation</h2>
          <div className="bg-black/50 p-4 rounded-lg font-mono text-sm border border-white/10 flex items-center justify-between">
            <span className="text-green-400">$ pip install veklom-vnp-probe</span>
            <Download className="w-4 h-4 text-gray-500" />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 border-b border-white/10 pb-4">Basic Implementation</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            The SDK natively handles the 4-phase network timings (DNS, TCP, TLS, TTFB) and automatically injects PAD Type-Length-Value (TLV) payloads to prevent provider traffic shaping.
          </p>
          <div className="bg-black/50 p-6 rounded-lg font-mono text-sm overflow-x-auto border border-white/10">
            <pre className="text-gray-300">
<span className="text-blue-400">import</span> asyncio
<span className="text-blue-400">from</span> veklom_vnp <span className="text-blue-400">import</span> VNPNodeOracle

<span className="text-gray-500"># Initialize the oracle with your Node Operator Identity</span>
oracle = VNPNodeOracle(
    node_id=<span className="text-green-300">"vnp-node-xyz"</span>,
    ed25519_private_key=<span className="text-green-300">"..."</span>
)

<span className="text-blue-400">async def</span> <span className="text-yellow-200">monitor_api</span>():
    <span className="text-gray-500"># Execute STAMP RFC 8762 micro-session</span>
    result = <span className="text-blue-400">await</span> oracle.probe(
        target_url=<span className="text-green-300">"https://api.tier1-provider.com/v1/chat"</span>,
        pad_tlv_bytes=<span className="text-purple-400">2048</span>
    )
    
    <span className="text-gray-500"># Submit cryptographically signed timings to the VNP Mesh</span>
    <span className="text-blue-400">await</span> oracle.submit_attestation(result)

<span className="text-blue-400">if</span> __name__ == <span className="text-green-300">"__main__"</span>:
    asyncio.run(monitor_api())
            </pre>
          </div>
        </section>

        <section>
          <div className="bg-[#FFB800]/5 border border-[#FFB800]/20 p-6 rounded-xl flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 text-[#FFB800] shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-white mb-2">Hardware Security Module (HSM) Requirement</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                For production deployments routing mainnet x402 settlement proofs, the SDK requires your Ed25519 signing keys to be isolated within an HSM or Secure Enclave. The Python SDK interfaces directly via PKCS#11.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
