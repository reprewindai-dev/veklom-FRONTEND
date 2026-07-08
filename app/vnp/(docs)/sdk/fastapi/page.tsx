"use client";

import React from 'react';
import { Cpu, Server, CheckCircle } from 'lucide-react';

export default function FastAPIPage() {
  return (
    <div className="space-y-12 pb-24">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">FastAPI Integration</h1>
        <p className="text-xl text-gray-400 leading-relaxed mb-8">
          The official middleware for exposing your API to the VNP scoring mesh and accepting x402 settlement requests natively.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4 border-b border-white/10 pb-4">VNP Interceptor Middleware</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            To participate in the VNP ecosystem and prove your SLA compliance, simply wrap your FastAPI application with the VNP Interceptor. This automatically responds to STAMP RFC 8762 probes from the VNP Mesh and processes x402 payment headers.
          </p>
          <div className="bg-black/50 p-6 rounded-lg font-mono text-sm overflow-x-auto border border-white/10">
            <pre className="text-gray-300">
<span className="text-blue-400">from</span> fastapi <span className="text-blue-400">import</span> FastAPI
<span className="text-blue-400">from</span> veklom_vnp.fastapi <span className="text-blue-400">import</span> VNPx402Middleware

app = FastAPI(title=<span className="text-green-300">"My Tier 1 API"</span>)

<span className="text-gray-500"># Bind the VNP Settlement Middleware</span>
app.add_middleware(
    VNPx402Middleware,
    wallet_address=<span className="text-green-300">"0xYourProviderWallet..."</span>,
    enforce_sla_stakes=<span className="text-blue-400">True</span>,
    max_latency_p99_ms=<span className="text-purple-400">150</span>
)

<span className="text-purple-400">@app.get</span>(<span className="text-green-300">"/v1/resource"</span>)
<span className="text-blue-400">async def</span> <span className="text-yellow-200">get_critical_data</span>():
    <span className="text-blue-400">return</span> {"{"}<span className="text-green-300">"status"</span>: <span className="text-green-300">"success"</span>, <span className="text-green-300">"data"</span>: <span className="text-green-300">"..."</span>{"}"}
            </pre>
          </div>
        </section>

        <section>
          <div className="grid sm:grid-cols-2 gap-6 mt-8">
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-[#FFB800]/10 flex items-center justify-center mb-4">
                <Server className="w-5 h-5 text-[#FFB800]" />
              </div>
              <h3 className="font-bold text-white mb-2">Zero-Overhead Probing</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                The middleware handles VNP probe requests entirely off the main thread using asyncio, guaranteeing zero impact on your actual API consumers' latency.
              </p>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="font-bold text-white mb-2">Automated zk-SNARK Verification</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Automatically verifies incoming x402 settlement proofs and logs the cryptographic receipts before allowing the request to hit your business logic.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
