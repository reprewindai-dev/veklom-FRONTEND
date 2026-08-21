"use client";

import Link from "next/link";
import { ArrowLeft, Check, X, ShieldAlert, Crosshair, Cpu, Lock, Coins } from "lucide-react";
import { motion } from "framer-motion";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function WhyVNPWinsPage() {
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

      <div className="max-w-5xl mx-auto px-6 pt-16">
        
        {/* Hero Section */}
        <motion.div initial="hidden" animate="visible" variants={fadeUpVariants} className="space-y-6 mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800] text-xs font-mono font-bold uppercase tracking-widest">
            <Crosshair className="w-3.5 h-3.5" /> Competitive Analysis
          </div>
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight leading-tight">
            VNP Measures <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-amber-500">Reality.</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed max-w-3xl mx-auto">
            Legacy benchmarks use synthetic data, opaque formulas, and centralized logs to tell you what an API <em>should</em> do. The Veklom Nexus Protocol uses physics, cryptography, and financial slashing to tell you what it <em>actually</em> did.
          </p>
        </motion.div>

        {/* The Brutal Comparison Matrix */}
        <motion.div initial="hidden" animate="visible" variants={fadeUpVariants} className="space-y-8 mb-24">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10 text-xs font-mono tracking-widest uppercase">
                  <th className="py-6 px-4 text-slate-500 font-bold w-1/4">Capability</th>
                  <th className="py-6 px-4 bg-[#FFB800]/5 text-[#FFB800] font-bold w-1/4 rounded-t-lg border-x border-t border-[#FFB800]/20">VNP (Veklom)</th>
                  <th className="py-6 px-4 text-slate-400 font-bold w-1/4">ABI Standard</th>
                  <th className="py-6 px-4 text-slate-400 font-bold w-1/4">CASC Blend</th>
                </tr>
              </thead>
              <tbody className="text-sm border-b border-white/10">
                
                {/* Row 1 */}
                <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-4 font-bold flex items-center gap-2"><Cpu className="w-4 h-4 text-slate-400" /> Data Source</td>
                  <td className="py-5 px-4 bg-[#FFB800]/5 font-bold text-white border-x border-[#FFB800]/20">
                    Active 5-Region Edge Mesh (Live)
                  </td>
                  <td className="py-5 px-4 text-slate-400">Provider Self-Reported Logs</td>
                  <td className="py-5 px-4 text-slate-400">Synthetic Interpolation</td>
                </tr>

                {/* Row 2 */}
                <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-4 font-bold flex items-center gap-2"><Crosshair className="w-4 h-4 text-slate-400" /> Latency Physics</td>
                  <td className="py-5 px-4 bg-[#FFB800]/5 font-bold text-white border-x border-[#FFB800]/20">
                    Option-C Geo-Adjusted (Haversine)
                  </td>
                  <td className="py-5 px-4 text-slate-400">Raw Ping (Geographically Biased)</td>
                  <td className="py-5 px-4 text-slate-400">Estimated Average</td>
                </tr>

                {/* Row 3 */}
                <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-4 font-bold flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-slate-400" /> Methodology Openness</td>
                  <td className="py-5 px-4 bg-[#FFB800]/5 font-bold text-white border-x border-[#FFB800]/20">
                    Fully Public (VNP Methodology v1.0)
                  </td>
                  <td className="py-5 px-4 text-slate-400">Opaque / Black Box</td>
                  <td className="py-5 px-4 text-slate-400">Proprietary Paid Tier</td>
                </tr>

                {/* Row 4 */}
                <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-4 font-bold flex items-center gap-2"><Lock className="w-4 h-4 text-slate-400" /> State Integrity</td>
                  <td className="py-5 px-4 bg-[#FFB800]/5 font-bold text-white border-x border-[#FFB800]/20">
                    Merkle Root Anchored (Ed25519)
                  </td>
                  <td className="py-5 px-4 text-slate-400">Centralized DB (Mutable)</td>
                  <td className="py-5 px-4 text-slate-400">Centralized DB (Mutable)</td>
                </tr>

                {/* Row 5 */}
                <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-4 font-bold flex items-center gap-2"><Coins className="w-4 h-4 text-slate-400" /> Financial Settlement</td>
                  <td className="py-5 px-4 bg-[#FFB800]/5 font-bold text-emerald-400 border-x border-[#FFB800]/20 border-b rounded-b-lg">
                    X402 Micro-Stake Slashing
                  </td>
                  <td className="py-5 px-4 text-slate-400">None (Read Only)</td>
                  <td className="py-5 px-4 text-slate-400">None (Read Only)</td>
                </tr>

              </tbody>
            </table>
          </div>
        </motion.div>

        {/* VNP Scope Architecture */}
        <motion.div initial="hidden" animate="visible" variants={fadeUpVariants} className="grid md:grid-cols-2 gap-12 mb-24">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold border-b border-white/10 pb-4">
              The VNP Scope
            </h2>
            <p className="text-gray-400 leading-relaxed font-bold text-lg text-white">
              VNP benchmarks the APIs that actually matter: the services Veklom owns, the providers Veklom depends on, and the endpoints that directly affect trust, routing, and settlement.
            </p>
            <ul className="space-y-6 mt-4">
              <li className="flex gap-3 text-slate-300">
                <Check className="w-6 h-6 text-[#FFB800] shrink-0 mt-1" />
                <div>
                  <strong className="text-white block text-lg mb-1">First-Party Veklom APIs</strong>
                  <span className="text-gray-400 text-sm">APIs owned and operated by Veklom (api.veklom.com, capi.veklom.com, etc.).</span>
                </div>
              </li>
              <li className="flex gap-3 text-slate-300">
                <Check className="w-6 h-6 text-[#FFB800] shrink-0 mt-1" />
                <div>
                  <strong className="text-white block text-lg mb-1">Operational Dependencies</strong>
                  <span className="text-gray-400 text-sm">External APIs that Veklom directly relies on in production, such as payments, auth, messaging, and model infrastructure.</span>
                </div>
              </li>
              <li className="flex gap-3 text-slate-300">
                <Check className="w-6 h-6 text-[#FFB800] shrink-0 mt-1" />
                <div>
                  <strong className="text-white block text-lg mb-1">Future Benchmark Expansion</strong>
                  <span className="text-gray-400 text-sm">Additional third-party APIs added under the same public methodology once they meet inclusion criteria.</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-[#050505] border border-slate-900 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-[#FFB800]/5 blur-3xl rounded-full" />
            <h3 className="text-xl font-bold mb-6 font-mono text-white">Trust Model</h3>
            <div className="space-y-4 font-mono text-sm">
              <div className="p-4 bg-white/5 border border-white/10 rounded">
                <div className="text-slate-500 mb-1">Standard Trust:</div>
                <div className="text-red-400">Provider → Client (Blind Trust)</div>
              </div>
              <div className="p-4 bg-[#FFB800]/10 border border-[#FFB800]/20 rounded">
                <div className="text-slate-500 mb-1">VNP Trust:</div>
                <div className="text-emerald-400">Provider → VNP Mesh → Merkle Root → X402 Contract → Client (Zero Trust)</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Links */}
        <motion.div initial="hidden" animate="visible" variants={fadeUpVariants} className="pt-12 border-t border-white/5 text-center space-y-8">
          <h2 className="text-2xl font-bold">Standardize Your Organization</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/vnp/methodology" className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors font-medium">
              Read the Methodology
            </Link>
            <Link href="/api/vnp.json" target="_blank" className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors font-medium">
              Access Public Feed
            </Link>
            <Link href="/vnp/x402" className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors font-medium">
              X402 Contract Mapping
            </Link>
          </div>
        </motion.div>

      </div>
    </main>
  );
}
