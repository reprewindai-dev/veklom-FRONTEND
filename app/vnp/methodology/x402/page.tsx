"use client";

import Link from "next/link";
import { ArrowLeft, Zap, Coins, Activity, TrendingDown, ServerCrash, ShieldAlert, FileSignature } from "lucide-react";
import { motion } from "framer-motion";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function X402SettlementPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#FFB800]/30 font-sans pb-32">
      
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-[#0A0A0A]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/vnp/methodology" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Methodology
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
            <Zap className="w-3.5 h-3.5" /> X402 Financial Layer
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            X402 Settlement Mapping
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed max-w-2xl">
            How VNP telemetry directly drives API pricing, financial slashing, and SLA performance bonds on the ledger.
          </p>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-500 uppercase tracking-widest font-bold">
            <span className="flex items-center gap-1.5"><FileSignature className="w-4 h-4 text-amber-400" /> Contract Standard v0.1</span>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div initial="hidden" animate="visible" variants={fadeUpVariants} className="space-y-16">
          
          <section className="space-y-6 bg-[#050505] border border-slate-900 rounded-2xl p-8">
            <h2 className="text-2xl font-bold border-b border-white/10 pb-4">
              Truth → Money: The X402 Paradigm
            </h2>
            <p className="text-gray-400 leading-relaxed">
              The VNP Master Plane is the truth surface. X402 is the money surface. 
              Under X402, an API provider does not simply publish a PDF claiming "99.9% uptime". They must lock a Micro-Stake (a performance bond) into a smart contract on the Base L2 ledger.
            </p>
            <p className="text-gray-400 leading-relaxed">
              As the VNP 5-region mesh continuously monitors the API, the X402 contract reads the cryptographic state output (the Merkle root). If the telemetry shows the provider failed to meet their SLA, the contract automatically slashes their stake and refunds the autonomous agents that consumed the degraded service.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold border-b border-white/10 pb-4">
              Penalty Curves & Slashing Conditions
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              
              {/* Condition 1 */}
              <div className="p-6 bg-red-950/10 border border-red-500/20 rounded-xl space-y-4">
                <div className="flex items-center gap-3 text-red-400">
                  <ServerCrash className="w-6 h-6" />
                  <h3 className="font-bold font-mono uppercase tracking-widest">Availability Breach</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  If the median-of-regional window detects uptime dropping below 99.9% for a sustained 5-minute epoch.
                </p>
                <div className="p-3 bg-[#0a0a0a] rounded border border-red-900/50 font-mono text-[11px] text-red-200">
                  Penalty: 15% stake slash + 100% refund for requests in window.
                </div>
              </div>

              {/* Condition 2 */}
              <div className="p-6 bg-amber-950/10 border border-amber-500/20 rounded-xl space-y-4">
                <div className="flex items-center gap-3 text-amber-400">
                  <TrendingDown className="w-6 h-6" />
                  <h3 className="font-bold font-mono uppercase tracking-widest">Latency Degradation</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  If Option-C Geo-Adjusted Latency exceeds the baseline SLA + 20ms across 3 of the 5 global nodes.
                </p>
                <div className="p-3 bg-[#0a0a0a] rounded border border-amber-900/50 font-mono text-[11px] text-amber-200">
                  Penalty: Dynamic fee reduction (Linear 5% fee drop per 10ms drift).
                </div>
              </div>

              {/* Condition 3 */}
              <div className="p-6 bg-red-950/10 border border-red-500/20 rounded-xl space-y-4">
                <div className="flex items-center gap-3 text-red-400">
                  <ShieldAlert className="w-6 h-6" />
                  <h3 className="font-bold font-mono uppercase tracking-widest">Error Rate Spike</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  If HTTP 5xx errors exceed 1% of total throughput within a rolling 60-second window.
                </p>
                <div className="p-3 bg-[#0a0a0a] rounded border border-red-900/50 font-mono text-[11px] text-red-200">
                  Penalty: Instant circuit break (halts all agent routing) + 5% stake slash.
                </div>
              </div>

              {/* Condition 4 */}
              <div className="p-6 bg-emerald-950/10 border border-emerald-500/20 rounded-xl space-y-4">
                <div className="flex items-center gap-3 text-emerald-400">
                  <Activity className="w-6 h-6" />
                  <h3 className="font-bold font-mono uppercase tracking-widest">AAA Compliance Bonus</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  If an API maintains a 10-D Composite Score of 96+ (AAA Grade) for 30 consecutive days.
                </p>
                <div className="p-3 bg-[#0a0a0a] rounded border border-emerald-900/50 font-mono text-[11px] text-emerald-200">
                  Reward: 1.5x Multiplier on Base L2 Yield Delegation.
                </div>
              </div>

            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold border-b border-white/10 pb-4">
              Cryptographic Execution
            </h2>
            <p className="text-gray-400 leading-relaxed">
              X402 contracts do not rely on subjective human auditors or standard SaaS logs. The X402 smart contract directly ingests the <code>merkle_root</code> generated by the VNP aggregator.
            </p>
            <div className="bg-[#050505] border border-slate-900 rounded-xl p-6 font-mono text-sm space-y-4">
              <div className="text-blue-400 font-bold mb-2">// X402 State Resolution</div>
              <p className="text-slate-300">
                1. <code>fetch(vnp_state.json)</code>
              </p>
              <p className="text-slate-300">
                2. <code>verify_signature(merkle_root, vnp_authority_pubkey)</code>
              </p>
              <p className="text-slate-300">
                3. <code>if (vnp_state.regional_metrics["us-east"].error_rate &gt; 1.0) {"{"}</code>
              </p>
              <p className="text-amber-400 pl-8">
                <code>trigger_slash(provider_id, "ERROR_BREACH", 0.05)</code>
              </p>
              <p className="text-slate-300 pl-4">
                <code>{"}"}</code>
              </p>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              This creates an unbreakable loop: Physics generates the telemetry, cryptography secures the state, and X402 enforces the financial reality.
            </p>
          </section>

          {/* CTA */}
          <section className="pt-12 border-t border-white/5 text-center">
            <Link href="/signup" className="inline-flex items-center gap-2 bg-[#FFB800] text-black px-8 py-4 rounded-lg font-bold hover:bg-[#FFD366] transition-colors shadow-lg shadow-[#FFB800]/20">
              <Coins className="w-5 h-5" /> Initialize your X402 Ledger Workspace
            </Link>
          </section>

        </motion.div>
      </div>
    </main>
  );
}
