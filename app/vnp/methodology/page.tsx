"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Activity, ShieldCheck, Zap, Server, Code, HardDrive, Anchor, Database } from "lucide-react";
import { motion } from "framer-motion";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#FFB800]/30 font-sans pb-32">
      
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-[#0A0A0A]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/vnp" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Master Plane
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-[#FFB800] rounded flex items-center justify-center">
              <span className="font-bold text-black text-xs leading-none">V</span>
            </div>
            <span className="font-bold tracking-wider text-sm font-mono">VEKLOM NEXUS</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-16">
        
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUpVariants} className="space-y-6 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800] text-xs font-mono font-bold uppercase tracking-widest">
            <FileText className="w-3.5 h-3.5" /> Open Standard
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            VNP Methodology v0.1
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed max-w-2xl">
            The formal cryptographic and physical specification for the Veklom Nexus Protocol. A standard for machine-consumable API trust scoring.
          </p>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-500 uppercase tracking-widest font-bold">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Locked until 2027-06-22</span>
            <span>Document Revision: a9f83c1</span>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div initial="hidden" animate="visible" variants={fadeUpVariants} className="space-y-16">
          
          {/* Section 1 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold border-b border-white/10 pb-4 flex items-center gap-3">
              <span className="text-[#FFB800] font-mono text-lg">01</span> The 10-Dimensional Vector
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Every API measured by the VNP is evaluated continuously against 10 explicit dimensions. This produces a vector that cannot be easily gamed by optimizing a single metric (e.g., placing servers next to a single probe location).
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-sm font-mono">
              {[
                { name: "P99 Latency", desc: "Absolute latency threshold (ms)" },
                { name: "Geo-Adjusted Latency", desc: "Speed of light baseline variance (ms)" },
                { name: "Error Rate", desc: "Percentage of HTTP 4xx/5xx" },
                { name: "Availability", desc: "Uptime across rolling 30d window" },
                { name: "Throughput (RPS)", desc: "Sustained requests per second limit" },
                { name: "Security Posture", desc: "TLS versions, ciphers, Ed25519 support" },
                { name: "SLA Variance", desc: "Drift from provider-published SLA" },
                { name: "Data Residency", desc: "Routing boundaries (e.g., EU-only)" },
                { name: "Documentation & DX", desc: "OpenAPI strictness compliance" },
                { name: "TTFC (Rate Limit)", desc: "Time To First Choke (transparent limits)" }
              ].map((dim, i) => (
                <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div className="text-white font-bold mb-1">{dim.name}</div>
                  <div className="text-gray-500 text-xs">{dim.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold border-b border-white/10 pb-4 flex items-center gap-3">
              <span className="text-[#FFB800] font-mono text-lg">02</span> Option-C Geo-Physics (Speed of Light)
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Raw latency is meaningless without geographic context. An API taking 120ms is unacceptable if the client is 10 miles away, but physically necessary if the client is halfway across the globe. VNP uses the <strong>Option-C</strong> formula.
            </p>
            <div className="bg-[#050505] border border-slate-900 rounded-xl p-6 font-mono text-sm space-y-4">
              <div className="text-emerald-400 font-bold mb-2">// The Option-C Haversine Penalty Formula</div>
              <p className="text-slate-300">
                1. Compute <code>d = Haversine(Probe_Coord, Server_Coord)</code>
              </p>
              <p className="text-slate-300">
                2. Calculate Speed of Light in Fiber: <code>SoL_fiber ≈ 200,000 km/s</code>
              </p>
              <p className="text-slate-300">
                3. Expected Latency: <code>E_latency = (d / SoL_fiber) * 2</code> (Round Trip)
              </p>
              <p className="text-[#00E5FF] font-bold bg-[#00E5FF]/10 px-3 py-2 rounded">
                Geo_Adjusted_Latency = Raw_Latency - E_latency
              </p>
              <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                This effectively normalizes all latency scores to isolate the actual processing and routing overhead introduced by the API provider, completely factoring out distance.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold border-b border-white/10 pb-4 flex items-center gap-3">
              <span className="text-[#FFB800] font-mono text-lg">03</span> Composite Score & Median-of-Regional Window
            </h2>
            <p className="text-gray-400 leading-relaxed">
              The 10 dimensions are reduced to a single <strong>Composite VNP Score (0-100)</strong> using a dynamic Consensus Coefficient Matrix. By default, the Base Golden Ratio applies weights (Latency 40%, Uptime 30%, Security 20%, Throughput 10%). 
            </p>
            <p className="text-gray-400 leading-relaxed">
              To prevent localized ISP outages from tanking an API's global score, telemetry is processed using a <strong>Median-of-Regional</strong> window. If the US-East probe experiences a localized BGP route leak, the median function across the 5 global nodes discards the outlier, preserving the true state of the API provider.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold border-b border-white/10 pb-4 flex items-center gap-3">
              <span className="text-[#FFB800] font-mono text-lg">04</span> Strict "Awaiting Node" Anti-Contamination
            </h2>
            <p className="text-gray-400 leading-relaxed">
              VNP strictly forbids the synthesis of theoretical data. If a regional node goes offline, or if a new region is provisioned but not yet actively participating in the gossip protocol, its status must explicitly reflect <code>AWAITING_NODE</code> or <code>NULL</code>.
            </p>
            <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-4 flex items-start gap-4">
              <Activity className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200 leading-relaxed font-medium">
                Synthetic telemetry interpolation is considered critical state contamination. Any aggregator producing synthetic data for missing regions will have its cryptographic stakes slashed by the surrounding consensus mesh.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold border-b border-white/10 pb-4 flex items-center gap-3">
              <span className="text-[#FFB800] font-mono text-lg">05</span> Merkle + Ed25519 Cryptographic Pipeline
            </h2>
            <p className="text-gray-400 leading-relaxed">
              To guarantee that telemetry has not been tampered with post-ingestion by benchmark administrators, the entire feed is cryptographically sealed.
            </p>
            <ul className="space-y-3 text-gray-300 list-disc pl-5">
              <li>Every edge probe signs its packet using an <strong>Ed25519</strong> private key.</li>
              <li>The hub aggregator verifies the signatures and hashes the aggregated JSON state payload.</li>
              <li>A <strong>Merkle Root</strong> is constructed containing the tree of all measurements over the 30-second epoch.</li>
              <li>The Root is periodically anchored to the Base L2 blockchain, ensuring a permanent, immutable record of API performance.</li>
            </ul>
          </section>

          {/* Next Steps / Integration */}
          <section className="pt-12 border-t border-white/5">
            <div className="grid sm:grid-cols-2 gap-6">
              <Link href="/vnp/methodology/x402" className="group p-6 bg-white/[0.02] border border-white/10 rounded-2xl hover:bg-white/[0.04] hover:border-white/20 transition-all">
                <Zap className="w-6 h-6 text-[#FFB800] mb-4" />
                <h3 className="text-lg font-bold mb-2 group-hover:text-[#FFB800] transition-colors">X402 Settlement Mapping</h3>
                <p className="text-sm text-gray-400">See how VNP methodologies directly drive financial slashing and API pricing.</p>
              </Link>
              
              <Link href="/api/vnp.json" target="_blank" className="group p-6 bg-white/[0.02] border border-white/10 rounded-2xl hover:bg-white/[0.04] hover:border-white/20 transition-all">
                <Code className="w-6 h-6 text-[#00E5FF] mb-4" />
                <h3 className="text-lg font-bold mb-2 group-hover:text-[#00E5FF] transition-colors">Public VNP Feed</h3>
                <p className="text-sm text-gray-400">Access the machine-readable live telemetry state for programmatic consumption.</p>
              </Link>
            </div>
          </section>

        </motion.div>
      </div>
    </main>
  );
}
