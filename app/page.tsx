"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Shield, Globe, Zap, Server, Activity, Lock, Coins, FileSpreadsheet, Fingerprint, Check, Terminal, Code2, Database, Workflow, Cpu, Eye, Scale } from "lucide-react";
import { motion } from "framer-motion";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-[#FFB800]/30 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center overflow-hidden">
              <img src="/logo-square.png" alt="Veklom Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold tracking-wider text-lg">VEKLOM</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#monopoly" className="hover:text-white transition-colors">The Monopoly</a>
            <a href="#routing" className="hover:text-white transition-colors">Surfaces</a>
            <a href="#mcp-comparison" className="hover:text-white transition-colors">vs. MCP</a>
            <Link href="/blog" className="hover:text-white transition-colors">Whitepaper</Link>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Launch Dashboard</Link>
            <Link href="/docs" className="bg-[#FFB800] text-black px-4 py-2 rounded-md hover:bg-[#FFC833] transition-colors font-bold">
              Documentation
            </Link>
          </div>
        </div>
      </nav>

      {/* Banner */}
      <div className="mt-16 w-full bg-[#111111] border-b border-white/5 text-center py-3">
        <p className="text-sm text-gray-300 font-medium flex items-center justify-center gap-2">
          <span className="bg-[#FFB800]/20 text-[#FFB800] px-2 py-0.5 rounded text-xs font-bold border border-[#FFB800]/30">LAW 25</span>
          Protect your enterprise AI workflows with 100% local bare-metal data routing.
          <Link href="/blog/sovereign-ai" className="text-white underline hover:text-[#FFB800] transition-colors">Read the brief.</Link>
        </p>
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 max-w-7xl mx-auto relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FFB800]/5 rounded-full blur-[120px] -z-10" />
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-5xl mx-auto text-center">
          <motion.div variants={fadeUpVariants} className="inline-block mb-6 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-gray-300">
            The Stateless Tourist vs. The Permanent Resident
          </motion.div>
          <motion.h1 variants={fadeUpVariants} className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 leading-[1.05]">
            The Sovereign <br/> Control Plane.
          </motion.h1>
          <motion.p variants={fadeUpVariants} className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
            Veklom is the native governance, evidence, and settlement layer for the <strong className="text-white">Machine-to-Machine (M2M) Economy</strong>. Transform raw capabilities into globally compliant, cryptographic assets.
          </motion.p>
          <motion.div variants={fadeUpVariants} className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="#routing" className="bg-white text-black px-8 py-4 rounded-md font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-lg">
              View Surfaces <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#mcp-comparison" className="bg-transparent border border-white/20 text-white px-8 py-4 rounded-md font-bold hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-lg">
              Compare Architecture <Code2 className="w-5 h-5" />
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Conjoined Service Monopoly */}
      <section id="monopoly" className="py-24 px-6 bg-gradient-to-b from-[#0A0A0A] to-[#050505] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-sm font-bold text-[#FFB800] tracking-widest uppercase mb-4">The Conjoined Service Monopoly</h2>
            <h3 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Capability is the Product.</h3>
            <p className="text-gray-400 text-lg leading-relaxed">
              We synthesize the entire M2M loop into one unified, trustless architecture. No fragmented point-solutions. Just deterministic execution.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-10 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#FFB800]/50 transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-colors" />
              <Activity className="w-10 h-10 text-blue-400 mb-6" />
              <h4 className="text-2xl font-bold mb-4">Universal Intelligence (EUC)</h4>
              <p className="text-gray-400 leading-relaxed mb-6">
                Break absolute vendor lock-in. <strong>Everything Universal Code</strong> wraps capabilities inside the cAPI layer, allowing seamless execution across Claude, Gemini, local Ollama, Devin, or Cursor.
              </p>
              <div className="text-xs font-mono text-blue-400 bg-blue-400/10 px-3 py-1 rounded inline-block border border-blue-400/20">cAPI Harness Router</div>
            </div>

            <div className="p-10 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#FFB800]/50 transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl group-hover:bg-red-500/20 transition-colors" />
              <Shield className="w-10 h-10 text-red-400 mb-6" />
              <h4 className="text-2xl font-bold mb-4">Zero-Trust Security</h4>
              <p className="text-gray-400 leading-relaxed mb-6">
                Before execution, <strong>RepoGate</strong> parses the Abstract Syntax Tree (AST) to intercept hidden shell commands, block dynamic <code>eval()</code>, and prevent undeclared network exfiltration.
              </p>
              <div className="text-xs font-mono text-red-400 bg-red-400/10 px-3 py-1 rounded inline-block border border-red-400/20">SDI (\delta) Thresholds</div>
            </div>

            <div className="p-10 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#FFB800]/50 transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl group-hover:bg-green-500/20 transition-colors" />
              <Database className="w-10 h-10 text-green-400 mb-6" />
              <h4 className="text-2xl font-bold mb-4">Mathematical Proof</h4>
              <p className="text-gray-400 leading-relaxed mb-6">
                <strong>GnomLedger</strong> mints an immutable Execution Identity (EI) token for every action. Inputs, outputs, and policies are hashed into a SHA-256 Merkle tree for undeniable audit evidence.
              </p>
              <div className="text-xs font-mono text-green-400 bg-green-400/10 px-3 py-1 rounded inline-block border border-green-400/20">Ed25519 Certificates</div>
            </div>

            <div className="p-10 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#FFB800]/50 transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl group-hover:bg-purple-500/20 transition-colors" />
              <Coins className="w-10 h-10 text-purple-400 mb-6" />
              <h4 className="text-2xl font-bold mb-4">Instant Settlement</h4>
              <p className="text-gray-400 leading-relaxed mb-6">
                <strong>X402 Protocol</strong> revives HTTP 402 for sub-cent agent micro-transactions over Layer-2 (Base/Solana). Conjoined smart contracts split royalties between nodes, networks, and creators.
              </p>
              <div className="text-xs font-mono text-purple-400 bg-purple-400/10 px-3 py-1 rounded inline-block border border-purple-400/20">RFC 9396 RAR Leases</div>
            </div>
          </div>
        </div>
      </section>

      {/* Storyboard: MCP vs Veklom */}
      <section id="mcp-comparison" className="py-24 px-6 border-t border-white/5 bg-[#080808]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
             <h2 className="text-sm font-bold text-[#FFB800] tracking-widest uppercase mb-4">Architecture Brief</h2>
             <h3 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">Raw MCP Tools vs. Governed Capability Plane</h3>
             <p className="text-gray-400 max-w-3xl text-lg leading-relaxed">
               Model Context Protocol (MCP) servers are incredible developer tools, but they leave a massive gap between "demo" and "profitable, sovereign enterprise reality." Here is the difference.
             </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-0 border border-white/10 rounded-2xl overflow-hidden">
            {/* The Before */}
            <div className="p-8 md:p-12 bg-[#111111] border-b lg:border-b-0 lg:border-r border-white/10">
              <div className="flex items-center gap-3 mb-8">
                <span className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center font-bold text-gray-400">1</span>
                <h4 className="text-2xl font-bold text-gray-300">Raw MCP Server (Today)</h4>
              </div>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="mt-1"><Terminal className="w-5 h-5 text-gray-500" /></div>
                  <div>
                    <strong className="block text-white mb-1">Developer-First Tooling</strong>
                    <p className="text-gray-400 text-sm leading-relaxed">Raw endpoints require ambient API keys. There is no concept of a budget, role-based access, or tenant isolation.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1"><Eye className="w-5 h-5 text-gray-500" /></div>
                  <div>
                    <strong className="block text-white mb-1">Zero Audit Trail</strong>
                    <p className="text-gray-400 text-sm leading-relaxed">If the agent hallucinates or goes rogue, standard logs can be deleted. You have no cryptographic proof of the interaction.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1"><Globe className="w-5 h-5 text-gray-500" /></div>
                  <div>
                    <strong className="block text-white mb-1">Cross-Border Risk</strong>
                    <p className="text-gray-400 text-sm leading-relaxed">Telemetry and PII data are blindly sent to cloud LLM providers, violating Law 25 and PIPEDA residency controls.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* The After */}
            <div className="p-8 md:p-12 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFB800]/10 blur-[80px]" />
              <div className="flex items-center gap-3 mb-8 relative z-10">
                <span className="w-8 h-8 rounded bg-[#FFB800] text-black flex items-center justify-center font-bold">2</span>
                <h4 className="text-2xl font-bold text-white">Veklom Governed Capability</h4>
              </div>
              <ul className="space-y-6 relative z-10">
                <li className="flex gap-4">
                  <div className="mt-1"><Shield className="w-5 h-5 text-[#FFB800]" /></div>
                  <div>
                    <strong className="block text-white mb-1">Identity & Policy Gates</strong>
                    <p className="text-gray-400 text-sm leading-relaxed">uacpv3 enforces tenant, role, and budget lanes. RepoGate checks the Semantic Deviation Index before execution.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1"><Database className="w-5 h-5 text-[#FFB800]" /></div>
                  <div>
                    <strong className="block text-white mb-1">Immutable Evidence (PGL)</strong>
                    <p className="text-gray-400 text-sm leading-relaxed">GnomLedger mints a receipt tied to an EI token, recording exactly what data classes were touched in a SHA-256 chain.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1"><Scale className="w-5 h-5 text-[#FFB800]" /></div>
                  <div>
                    <strong className="block text-white mb-1">Sovereign Law 25 Routing</strong>
                    <p className="text-gray-400 text-sm leading-relaxed">PII tags automatically override cloud requests, forcing the pipeline onto local bare-metal endpoints.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Canonical Separation */}
      <section id="routing" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-sm font-bold text-[#FFB800] tracking-widest uppercase mb-4">Canonical Separation</h2>
            <h3 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">100% Transparent Reality.</h3>
            <p className="text-gray-400 text-lg leading-relaxed">
              We do not build monolithic dashboards. The interface you see is perfectly tailored to your role in the M2M economy.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Terminal */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-8 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <Terminal className="w-8 h-8 text-white" />
                <span className="bg-green-500/20 text-green-400 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded border border-green-500/30">PROD_LIVE</span>
              </div>
              <h4 className="text-xl font-bold mb-2">The Governance Terminal</h4>
              <p className="text-sm text-gray-500 mb-6">For Enterprise Compliance Officers</p>
              <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-grow">
                An instrument panel for absolute authority. Features the Ambient Intervention UI for pausing risky agent actions, Live X402 Budget Burn Dashboards, and the Semantic Audit Trail viewer for human-readable GnomLedger hashes.
              </p>
              <Link href="/dashboard" className="text-sm font-bold text-white flex items-center gap-2 hover:text-[#FFB800] transition-colors w-max">
                Open Unified Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Gateway */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-8 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <Cpu className="w-8 h-8 text-white" />
                <span className="bg-green-500/20 text-green-400 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded border border-green-500/30">PROD_LIVE</span>
              </div>
              <h4 className="text-xl font-bold mb-2">M2M Interaction Gateway</h4>
              <p className="text-sm text-gray-500 mb-6">For Autonomous Agents</p>
              <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-grow">
                A headless, zero-friction automated gateway. Requires ECDSA Machine Passports. Implements HTTP 402 Paywalls requiring agents to sign micro-transactions to unlock capability streams instantly.
              </p>
              <Link href="https://api.veklom.com/docs" className="text-sm font-bold text-white flex items-center gap-2 hover:text-[#FFB800] transition-colors w-max">
                View API Specs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Engine Room */}
            <div className="bg-[#111111]/50 border border-white/5 rounded-2xl p-8 flex flex-col h-full border-dashed">
              <div className="flex items-center justify-between mb-6">
                <Workflow className="w-8 h-8 text-gray-600" />
                <span className="bg-amber-500/10 text-amber-500 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded border border-amber-500/20">INTERNAL TOOL</span>
              </div>
              <h4 className="text-xl font-bold mb-2 text-gray-300">ABIDE & GPC Workbench</h4>
              <p className="text-sm text-gray-600 mb-6">For Internal Developers</p>
              <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-grow">
                The developer engine room operating on isolated canonical ports. Converts messy intent into cycle-free Python AST logic via a 60fps ReactFlow canvas, deploying straight into sandboxed CI/CD workflows.
              </p>
              <span className="text-sm font-bold text-gray-600 flex items-center gap-2 cursor-not-allowed w-max">
                Requires UACP_ADMIN_KEY <Lock className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 bg-[#030303]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center overflow-hidden">
               <img src="/logo-square.png" alt="Veklom Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold tracking-wider text-sm text-gray-400">VEKLOM SOVEREIGN INFRASTRUCTURE</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-600">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
            <Link href="/compliance" className="hover:text-gray-300 transition-colors">SOC2 & Law 25</Link>
          </div>
          <div className="text-sm text-gray-700">
            © {new Date().getFullYear()} Veklom. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
