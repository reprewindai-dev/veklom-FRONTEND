"use client";

import Link from "next/link";
import dynamicImport from "next/dynamic";
import { 
  ArrowRight, Shield, Globe, Zap, Server, Activity, Lock, 
  Coins, FileSpreadsheet, Power, ShieldAlert, Fingerprint, 
  Check, Mail, ArrowUpRight, Award, AlertTriangle, ShieldCheck,
  Calendar, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import blogsData from "../data/blog-index.json";

// Swarm Terminal is now the standalone Veklom-RealTerminal service at terminal.veklom.com
const TERMINAL_URL = 'https://terminal.veklom.com';

const NetworkTopologyPanel = dynamicImport(
  () => import("@/components/vnp/NetworkTopologyPanel"),
  { ssr: false, loading: () => <div className="h-[500px] bg-white/5 rounded-xl animate-pulse" /> }
);
const StakingProtocol = dynamicImport(
  () => import("@/components/vnp/StakingProtocol"),
  { ssr: false, loading: () => <div className="h-[400px] bg-white/5 rounded-xl animate-pulse" /> }
);
const HostileAgentDemo = dynamicImport(
  () => import("@/app/dev/components/HostileAgentDemo"),
  { ssr: false, loading: () => <div className="h-[600px] bg-white/5 rounded-xl animate-pulse" /> }
);
const GovernedExportDemo = dynamicImport(
  () => import("@/app/dev/components/GovernedExportDemo"),
  { ssr: false, loading: () => <div className="h-[600px] bg-white/5 rounded-xl animate-pulse" /> }
);

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
} as any;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function Home() {
  const now = new Date();
  const activeBlogs = blogsData
    .filter(blog => new Date(blog.publishDate) <= now)
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
    .slice(0, 3); // Top 3

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden selection:bg-[#FFB800]/30 relative z-10">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFB800] rounded flex items-center justify-center brand-glow">
              <span className="font-bold text-black leading-none">V</span>
            </div>
            <span className="font-bold tracking-wider text-lg font-mono">VEKLOM</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#problem" className="hover:text-white transition-colors">The Problem</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#vnp" className="hover:text-white transition-colors">VNP Spec</a>
            <Link href="/blog" className="hover:text-white transition-colors font-medium text-brand-300">Blog</Link>
            <a href="#deployment" className="hover:text-white transition-colors">Deployment</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Trust Strip Marquee */}
      <div className="trust-strip mt-16">
        <div className="trust-strip-inner">
          <span className="trust-badge">SOC2-Ready</span>
          <span className="trust-badge">HIPAA-Aware</span>
          <span className="trust-badge">GDPR-Compliant</span>
          <span className="trust-badge">EU-Sovereign</span>
          <span className="trust-badge">ISO 27001 Aligned</span>
          <span className="trust-badge">FedRAMP-Ready</span>
          <span className="trust-badge">PIPEDA Compliant</span>
          <span className="trust-badge">Base L2 Settled</span>
          <span className="trust-badge">x402 Native</span>
          <span className="trust-badge">Air-Gap Ready</span>
          {/* Loop duplicates */}
          <span className="trust-badge">SOC2-Ready</span>
          <span className="trust-badge">HIPAA-Aware</span>
          <span className="trust-badge">GDPR-Compliant</span>
          <span className="trust-badge">EU-Sovereign</span>
          <span className="trust-badge">ISO 27001 Aligned</span>
          <span className="trust-badge">FedRAMP-Ready</span>
          <span className="trust-badge">PIPEDA Compliant</span>
          <span className="trust-badge">Base L2 Settled</span>
          <span className="trust-badge">x402 Native</span>
          <span className="trust-badge">Air-Gap Ready</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 lg:pt-32 lg:pb-32 px-6">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[50%] -translate-x-1/2 w-[1000px] h-[500px] bg-[#FFB800]/15 blur-[120px] rounded-full opacity-50 mix-blend-screen" />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 max-w-7xl mx-auto text-center"
        >
          <motion.div variants={fadeUpVariants} className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800] text-xs font-semibold uppercase tracking-wider mb-6">
            <Shield className="w-3.5 h-3.5" />
            Sovereign AI Infrastructure
          </motion.div>

          <motion.h1 variants={fadeUpVariants} className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
            Control your AI agents.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FFE6A8] to-[#FFB800]">
              Prove everything they do.
            </span>
          </motion.h1>

          <motion.p variants={fadeUpVariants} className="text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Veklom is the operating layer between your AI agents and the real world. Every action is checked against policy guardrails, every result is cryptographically sealed, and payments are settled instantly on-chain.
          </motion.p>

          <motion.div variants={fadeUpVariants} className="flex flex-wrap items-center justify-center gap-4 mb-20">
            <Link href="/signup" className="bg-white text-black px-8 py-4 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 text-lg shadow-lg shadow-white/5">
              Start Free <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#live-demo" className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-lg font-bold hover:bg-white/10 transition-colors flex items-center gap-2 text-lg">
              See Live Demo
            </a>
          </motion.div>

          {/* High Density Metric Row */}
          <motion.div variants={fadeUpVariants} className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-20 border-y border-white/5 py-8 bg-white/[0.01] backdrop-blur-sm px-6 rounded-2xl">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-[#FFB800] font-mono mb-2">99.9%</div>
              <div className="text-xs text-gray-400 uppercase tracking-widest font-mono">Live Uptime SLA</div>
            </div>
            <div className="text-center border-l border-white/5">
              <div className="text-3xl md:text-4xl font-extrabold text-[#FFB800] font-mono mb-2">&lt;200ms</div>
              <div className="text-xs text-gray-400 uppercase tracking-widest font-mono">Gate Latency</div>
            </div>
            <div className="text-center border-l border-white/5">
              <div className="text-3xl md:text-4xl font-extrabold text-[#FFB800] font-mono mb-2">9 Phases</div>
              <div className="text-xs text-gray-400 uppercase tracking-widest font-mono">Check Gateways</div>
            </div>
            <div className="text-center border-l border-white/5">
              <div className="text-3xl md:text-4xl font-extrabold text-[#FFB800] font-mono mb-2">SHA-256</div>
              <div className="text-xs text-gray-400 uppercase tracking-widest font-mono">Sealed Proof</div>
            </div>
          </motion.div>

          {/* Swarm Terminal CTA — powered by Veklom-RealTerminal */}
          <motion.div variants={fadeUpVariants} id="live-demo" className="relative scroll-mt-24 w-full">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#FFB800]/10 to-transparent blur-3xl opacity-50 rounded-3xl -z-10" />
            <div className="grid md:grid-cols-2 gap-8">
                <HostileAgentDemo />
                <GovernedExportDemo />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* The Problem Section */}
      <section className="py-24 border-t border-white/5 bg-[#0B0B0D] relative scroll-mt-16" id="problem">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1 text-[#FFB800] text-xs font-bold uppercase tracking-widest bg-[#FFB800]/5 border border-[#FFB800]/10 px-3 py-1 rounded-full mb-4">
              <AlertTriangle className="w-3 h-3" /> System Vulnerabilities
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">
              AI agents are powerful.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-500">But who is watching them?</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              Companies want to deploy autonomous AI agents for critical tasks. But without strict operational guardrails, agents can leak sensitive data, exhaust APIs, and incur invisible on-chain liabilities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Lock,
                title: "Uncontrolled access",
                desc: "Agents touch files, databases, and APIs without clear network boundaries. One unverified request can expose backend infrastructure or leak database keys."
              },
              {
                icon: Coins,
                title: "Invisible spending",
                desc: "API compute costs and token requests scale exponentially. Without absolute per-agent micro-budgets and rate governors, balances drain in minutes."
              },
              {
                icon: FileSpreadsheet,
                title: "No audit trail",
                desc: "Standard SaaS logging fails when agents self-correct and loop. Auditors require an unbreakable, cryptographically sealed record of exact agent intents."
              },
              {
                icon: Power,
                title: "No global kill switch",
                desc: "When a multi-agent swarm encounters a logical race condition or hallucination loop, developers lack a centralized override gateway to freeze the cluster instantly."
              },
              {
                icon: Globe,
                title: "Data leaves the building",
                desc: "Centralized AI proxies transmit proprietary workflows across geographic regions. Regulated enterprises cannot permit unmonitored egress of governed PII."
              },
              {
                icon: Fingerprint,
                title: "No verifiable identity",
                desc: "Every agent executes under a generalized server key. Without a native tenant-bound cryptographic identifier (PGL), resource tracking is impossible."
              }
            ].map((card, idx) => (
              <div key={idx} className="card obsidian-glass p-8 flex flex-col justify-between hover:border-[#FFB800]/30 transition-all group duration-300">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#FFB800]/10 flex items-center justify-center border border-[#FFB800]/20 mb-6 group-hover:bg-[#FFB800]/20 group-hover:border-[#FFB800]/40 transition-colors duration-300">
                    <card.icon className="w-6 h-6 text-[#FFB800]" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 border-t border-white/5 bg-[#0A0A0C] relative scroll-mt-16" id="how-it-works">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1 text-[#FFB800] text-xs font-bold uppercase tracking-widest bg-[#FFB800]/5 border border-[#FFB800]/10 px-3 py-1 rounded-full mb-4">
              <Activity className="w-3 h-3" /> Runtime Interception
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">Three steps. Full control.</h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              Veklom intercepts agent request-intents at the virtualization layer before they reach the public web.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="card obsidian-glass p-8 flex flex-col justify-between border-l-4 border-l-[#FFB800]/50">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[#FFB800] font-mono text-xs font-extrabold bg-[#FFB800]/10 border border-[#FFB800]/20 px-2.5 py-1 rounded-full">STEP 01</span>
                  <span className="text-gray-500 text-xs font-mono">HTTP INTERCEPT</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Agent sends intent</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  Your agent compiles an operational request (e.g. read files, pay for API, execute shell code). Veklom hooks the call at the edge.
                </p>
              </div>
              <div className="bg-black/40 border border-white/5 p-4 rounded-xl font-mono text-[11px] text-gray-300 leading-relaxed">
                <span className="text-[#FFB800]">POST</span> <span className="text-white">/capi/execute</span><br />
                agent: <span className="text-[#FFB800]">analyst-bot-01</span><br />
                action: <span className="text-[#FFB800]">read_repository</span><br />
                target: <span className="text-gray-400">github.com/your-org</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="card obsidian-glass p-8 flex flex-col justify-between border-l-4 border-l-[#FFB800]/50">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[#FFB800] font-mono text-xs font-extrabold bg-[#FFB800]/10 border border-[#FFB800]/20 px-2.5 py-1 rounded-full">STEP 02</span>
                  <span className="text-gray-500 text-xs font-mono">DETERMINISTIC GATE</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Veklom checks the rules</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  Nine phases of checks run synchronously. Tenant identity, PGL policy, budget solvency, PHI filters, and approval steps.
                </p>
              </div>
              <div className="bg-black/40 border border-white/5 p-4 rounded-xl font-mono text-[11px] text-gray-300 leading-relaxed">
                <span className="text-green-400">Phase 1: Identity</span> ......... PASS<br />
                <span className="text-green-400">Phase 2: Policy</span> ........... PASS<br />
                <span className="text-green-400">Phase 3: Safety</span> ........... PASS<br />
                <span className="text-[#FFB800]">Verdict:</span> <span className="text-green-400 font-extrabold">APPROVED</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="card obsidian-glass p-8 flex flex-col justify-between border-l-4 border-l-[#FFB800]/50">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[#FFB800] font-mono text-xs font-extrabold bg-[#FFB800]/10 border border-[#FFB800]/20 px-2.5 py-1 rounded-full">STEP 03</span>
                  <span className="text-gray-500 text-xs font-mono">EVIDENCE ANCHOR</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Tamper-evident audit</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  Events are written append-only and hash-chained. The chain head is periodically anchored externally to guarantee it has not been silently rewritten.
                </p>
              </div>
              <div className="bg-black/40 border border-white/5 p-4 rounded-xl font-mono text-[11px] text-gray-300 leading-relaxed">
                <span className="text-green-400">Execution Complete</span><br />
                Previous Hash: <span className="text-[#FFB800]">a3f8b2...c91d</span><br />
                Chain Head: <span className="text-green-400">SEALED (Anchored)</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Provable Governance Section */}
      <section className="py-24 border-t border-white/5 bg-[#0B0B0D] relative scroll-mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1 text-[#FFB800] text-xs font-bold uppercase tracking-widest bg-[#FFB800]/5 border border-[#FFB800]/10 px-3 py-1 rounded-full mb-4">
              <ShieldCheck className="w-3 h-3" /> Provable Governance
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">A runtime built to show its work.</h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              We do not claim that logs are "perfect" or that governance is "magic." We built a runtime with verifiable distributed properties you can check yourself.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="card obsidian-glass p-8 hover:border-[#FFB800]/30 transition-all duration-300">
              <h3 className="text-xl font-bold mb-3">Distributed Single-Use Approvals</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                High-risk actions are gated by nonce-bound tokens. Nonces are burned atomically via Redis <code className="text-[#FFB800] bg-black px-1 py-0.5 rounded">SET NX EX</code>, mathematically guaranteeing they cannot be replayed across the mesh.
              </p>
            </div>
            
            <div className="card obsidian-glass p-8 hover:border-[#FFB800]/30 transition-all duration-300">
              <h3 className="text-xl font-bold mb-3">Tamper-Evident Audit Chains</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Every event commits to the previous hash inside an atomic <code className="text-[#FFB800] bg-black px-1 py-0.5 rounded">WATCH/MULTI/EXEC</code> optimistic lock. The chain head is periodically externally anchored for independent verification.
              </p>
            </div>
            
            <div className="card obsidian-glass p-8 hover:border-[#FFB800]/30 transition-all duration-300">
              <h3 className="text-xl font-bold mb-3">Configurable & Legal-Aware</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Profiles separate legal obstacles from internal policy. Legal denials (e.g. data residency) explicitly return HTTP 451 with <code className="text-[#FFB800] bg-black px-1 py-0.5 rounded">rel="blocked-by"</code> metadata.
              </p>
            </div>

            <div className="card obsidian-glass p-8 hover:border-[#FFB800]/30 transition-all duration-300">
              <h3 className="text-xl font-bold mb-3">Fail-Closed by Default</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                If an environment profile is missing or malformed, the runtime assumes "no". It blocks external context, blocks sensitive actions, and retains nothing.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* VNP Section */}
      <section className="py-24 border-t border-white/5 bg-[#0B0B0D] relative scroll-mt-16" id="vnp">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800] text-sm font-medium font-mono uppercase tracking-widest">
                <Globe className="w-4 h-4" />
                VNP: Global Standard
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
                Benchmark APIs with physics. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD366] to-[#FFB800]">
                  Settle them with X402.
                </span>
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Before your autonomous agents execute and pay for an API, they need to know if it's real. The Veklom Nexus Protocol (VNP) is a 5-region cryptographic telemetry mesh that ranks APIs across 10 dimensions—including Geo-Adjusted Latency, Error Rates, and Security Posture. No marketing. No black boxes. Just physics.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: ShieldCheck, text: "5-Region Trust Matrix (US, EU, AP)" },
                  { icon: Award, text: "Unbiased 10-D Composite Scores (AAA Ratings)" },
                  { icon: Activity, text: "Automated API Discovery & Routing" }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-[0_0_10px_rgba(255,184,0,0.1)]">
                      <item.icon className="w-4 h-4 text-[#FFB800]" />
                    </div>
                    <span className="text-sm font-bold tracking-wide">{item.text}</span>
                  </li>
                ))}
              </ul>
              
              <div className="pt-4">
                <Link href="/vnp" className="inline-flex px-8 py-4 rounded-lg bg-white text-black font-bold text-lg hover:bg-gray-200 transition-colors items-center gap-2 shadow-lg shadow-white/5">
                  View the VNP Master Plane <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#FFB800]/10 to-transparent blur-2xl opacity-50 rounded-3xl -z-10" />
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0A0A0A] shadow-2xl">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-mono text-gray-400">VNP NODE WEB: live_topology_attestation</span>
                </div>
                <div className="h-[500px] overflow-hidden p-6 relative bg-[#060608]">
                  <div className="transform scale-[0.85] origin-top-left w-[117%] h-[117%] pointer-events-none">
                    <NetworkTopologyPanel />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* x402 Section */}
      <section className="py-24 border-t border-white/5 bg-[#0A0A0C] relative scroll-mt-16" id="x402">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative order-last lg:order-first">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#FFB800]/10 to-transparent blur-2xl opacity-50 rounded-3xl -z-10" />
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0A0A0C] shadow-2xl">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="ml-4 text-xs font-mono text-gray-400 flex items-center gap-2">
                    <Lock className="w-3 h-3 text-[#FFB800]" />
                    x402-micropayments.ts
                  </div>
                </div>
                <div className="p-6 bg-[#070709]">
                  <StakingProtocol />
                </div>
              </div>
            </div>
            <div className="space-y-8 lg:pl-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800] text-sm font-medium font-mono uppercase tracking-widest">
                <Zap className="w-4 h-4" />
                X402: Sovereign Settlement
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
                Priced, discovered, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-[#FFB800]">
                  and settled in milliseconds.
                </span>
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Once VNP discovers and benchmarks an API, the X402 protocol handles the financial reality. X402 natively manages micro-transactions, SLA performance bonds, and yield delegation. Every single API route is priced and metered. If a provider drops their P99 latency SLA, their Micro-Stakes are slashed automatically.
              </p>
              <div className="pt-2">
                <Link href="/signup" className="inline-flex items-center gap-2 text-[#FFB800] hover:text-[#FFB800]/80 font-bold transition-colors uppercase tracking-wider text-sm">
                  Initialize your ledger workspace <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deployment Section */}
      <section className="py-24 border-t border-white/5 bg-[#0B0B0D] relative scroll-mt-16" id="deployment">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1 text-[#FFB800] text-xs font-bold uppercase tracking-widest bg-[#FFB800]/5 border border-[#FFB800]/10 px-3 py-1 rounded-full mb-4">
              <Server className="w-3 h-3" /> INFRASTRUCTURE
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4 font-mono">One runtime. Your choice of boundary.</h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              Start hosted on Veklom Cloud in minutes. Deploy to a dedicated sovereign hardware node or go fully private with air-gapped VPC architecture.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="card obsidian-glass p-8 flex flex-col justify-between hover:border-[#FFB800]/30 transition-all duration-300">
              <div>
                <span className="font-mono text-gray-500 font-extrabold text-3xl">01</span>
                <span className="block text-xs uppercase tracking-widest font-bold text-[#FFB800] mt-4 mb-2">Hosted Cloud</span>
                <h3 className="text-2xl font-bold mb-4">Start immediately</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  Use Veklom's fully-managed cloud. Fast deployment, integrated playtesting, central security dashboard, and remote audit streaming.
                </p>
                <div className="flex flex-wrap gap-2 mb-8">
                  <span className="text-[10px] uppercase font-semibold font-mono px-2 py-0.5 rounded bg-white/5 border border-white/5 text-gray-300">Instant Sandbox</span>
                  <span className="text-[10px] uppercase font-semibold font-mono px-2 py-0.5 rounded bg-white/5 border border-white/5 text-gray-300">Shared Nodes</span>
                </div>
              </div>
              <Link href="/signup" className="btn btn-ghost w-full">Start Free</Link>
            </div>

            {/* Card 2 */}
            <div className="card obsidian-glass p-8 flex flex-col justify-between border-2 border-[#FFB800] relative bg-[#121216]/50 shadow-xl shadow-[#FFB800]/5 hover:border-[#FFC94D] transition-all duration-300">
              <div className="absolute top-4 right-4 bg-[#FFB800] text-black text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full">
                RECOMMENDED
              </div>
              <div>
                <span className="font-mono text-[#FFB800] font-extrabold text-3xl">02</span>
                <span className="block text-xs uppercase tracking-widest font-bold text-[#FFB800] mt-4 mb-2">Sovereign Node</span>
                <h3 className="text-2xl font-bold mb-4">Dedicated EU Hardware</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  Your isolated VM hosted directly on Hetzner EU bare metal. Guaranteed processing isolation, custom rule limits, and sovereign data boundaries.
                </p>
                <div className="flex flex-wrap gap-2 mb-8">
                  <span className="text-[10px] uppercase font-semibold font-mono px-2 py-0.5 rounded bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800]">Dedicated VM</span>
                  <span className="text-[10px] uppercase font-semibold font-mono px-2 py-0.5 rounded bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800]">Hetzner EU</span>
                  <span className="text-[10px] uppercase font-semibold font-mono px-2 py-0.5 rounded bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800]">Sovereign IP</span>
                </div>
              </div>
              <Link href="/signup" className="btn btn-primary w-full">Deploy Node</Link>
            </div>

            {/* Card 3 */}
            <div className="card obsidian-glass p-8 flex flex-col justify-between hover:border-[#FFB800]/30 transition-all duration-300">
              <div>
                <span className="font-mono text-gray-500 font-extrabold text-3xl">03</span>
                <span className="block text-xs uppercase tracking-widest font-bold text-[#FFB800] mt-4 mb-2">BYOS Deployment</span>
                <h3 className="text-2xl font-bold mb-4">On-prem / Air-gap</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  Run inside your own AWS/GCP virtual private cloud or disconnected air-gapped infrastructure. Zero third-party cloud data egress.
                </p>
                <div className="flex flex-wrap gap-2 mb-8">
                  <span className="text-[10px] uppercase font-semibold font-mono px-2 py-0.5 rounded bg-white/5 border border-white/5 text-gray-300">Self-Hosted</span>
                  <span className="text-[10px] uppercase font-semibold font-mono px-2 py-0.5 rounded bg-white/5 border border-white/5 text-gray-300">Zero-Outflow</span>
                </div>
              </div>
              <a href="mailto:sales@veklom.com" className="btn btn-ghost w-full">Talk to Sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 border-t border-white/5 bg-[#0A0A0C] relative scroll-mt-16" id="pricing">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1 text-[#FFB800] text-xs font-bold uppercase tracking-widest bg-[#FFB800]/5 border border-[#FFB800]/10 px-3 py-1 rounded-full mb-4">
              <Coins className="w-3 h-3" /> CLEAR ACCOUNTING
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4 font-mono">Pay for what you use. No surprises.</h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              No hidden SaaS subscriptions. Fund your workspace micro-staking reserve and settle costs per request.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Free */}
            <div className="card obsidian-glass p-8 flex flex-col justify-between hover:border-[#FFB800]/20 transition-all duration-200">
              <div>
                <span className="text-xs uppercase tracking-widest text-gray-400 font-bold font-mono">Evaluation</span>
                <div className="text-4xl font-bold font-mono text-white my-4">$0</div>
                <span className="text-xs text-gray-500 font-mono block mb-6">No credit card required</span>
                <ul className="space-y-3 border-t border-white/5 pt-6 text-sm text-gray-300">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> 15 Playground runs</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> 3 benchmark reports</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> 20 rule compilations</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> BYOK provider config</li>
                </ul>
              </div>
              <Link href="/signup" className="btn btn-ghost w-full mt-8">Start Free</Link>
            </div>

            {/* Founding */}
            <div className="card obsidian-glass p-8 flex flex-col justify-between border-2 border-[#FFB800] bg-[#121216]/50 relative shadow-xl shadow-[#FFB800]/5 hover:border-[#FFC94D] transition-all duration-200">
              <span className="absolute top-4 right-4 bg-[#FFB800] text-black text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full">POPULAR</span>
              <div>
                <span className="text-xs uppercase tracking-widest text-[#FFB800] font-bold font-mono">Founding</span>
                <div className="text-4xl font-bold font-mono text-white my-4">$395</div>
                <span className="text-xs text-gray-400 font-mono block mb-6">One-time fee + $150 deposit</span>
                <ul className="space-y-3 border-t border-white/5 pt-6 text-sm text-gray-300">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#FFB800] flex-shrink-0" /> Playground run $0.25</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#FFB800] flex-shrink-0" /> Benchmark test $0.75</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#FFB800] flex-shrink-0" /> UACP compile $1.50</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#FFB800] flex-shrink-0" /> Pipeline execution $0.25</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#FFB800] flex-shrink-0" /> BYOK Gov Call $6/1k</li>
                </ul>
              </div>
              <Link href="/signup" className="btn btn-primary w-full mt-8">Activate Workspace</Link>
            </div>

            {/* Standard */}
            <div className="card obsidian-glass p-8 flex flex-col justify-between hover:border-[#FFB800]/20 transition-all duration-200">
              <div>
                <span className="text-xs uppercase tracking-widest text-gray-400 font-bold font-mono">Standard</span>
                <div className="text-4xl font-bold font-mono text-white my-4">$795</div>
                <span className="text-xs text-gray-500 font-mono block mb-6">One-time fee + $300 deposit</span>
                <ul className="space-y-3 border-t border-white/5 pt-6 text-sm text-gray-300">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> Playground run $0.40</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> Benchmark test $1.20</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> UACP compile $2.00</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> Pipeline execution $0.40</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> BYOK Gov Call $8/1k</li>
                </ul>
              </div>
              <Link href="/signup" className="btn btn-ghost w-full mt-8">Activate Workspace</Link>
            </div>

            {/* Enterprise */}
            <div className="card obsidian-glass p-8 flex flex-col justify-between hover:border-[#FFB800]/20 transition-all duration-200">
              <div>
                <span className="text-xs uppercase tracking-widest text-gray-400 font-bold font-mono">Enterprise</span>
                <div className="text-4xl font-bold font-mono text-white my-4">$2,500+</div>
                <span className="text-xs text-gray-500 font-mono block mb-6">Custom terms + $2,500 deposit</span>
                <ul className="space-y-3 border-t border-white/5 pt-6 text-sm text-gray-300">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> Dedicated SLA commitments</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> Full VPC private hosting</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> Custom compliance mapping</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> Handled security audit logs</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> Dedicated account support</li>
                </ul>
              </div>
              <a href="mailto:sales@veklom.com" className="btn btn-ghost w-full mt-8">Talk to Sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* Sovereign Intelligence Section */}
      <section className="py-24 border-t border-white/5 relative bg-[#060608]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,216,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,216,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Sovereign Intelligence</h2>
              <p className="text-ink-300 max-w-2xl text-lg">Engineering deep dives into zero-trust architectures, Option-C latency mechanics, and agentic settlement.</p>
            </div>
            <Link href="/blog" className="shrink-0 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
              View All Articles <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeBlogs.map(blog => {
              const formattedDate = new Date(blog.publishDate).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
              });
              
              return (
                <Link key={blog.slug} href={`/blog/${blog.slug}`} className="block group">
                  <div className="h-full bg-[#0A0A0C] border border-white/10 group-hover:border-brand-500/50 p-6 rounded-xl transition-all duration-300 flex flex-col hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(0,180,216,0.15)]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-xs font-mono text-brand-400">
                        <Calendar size={12} />
                        {formattedDate}
                      </div>
                      <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-brand-500/10 group-hover:text-brand-400 transition-colors">
                        <ArrowUpRight size={14} />
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-300 transition-colors line-clamp-2">{blog.title}</h3>
                    <p className="text-ink-400 text-sm leading-relaxed flex-grow line-clamp-3 mb-6">{blog.excerpt}</p>
                    <div className="mt-auto text-sm font-medium text-brand-500 flex items-center">
                      Read Full Deep Dive <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#FFB800]/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FFB800]/10 blur-[100px] rounded-full pointer-events-none" />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="relative z-10 max-w-4xl mx-auto text-center px-6"
        >
          <motion.h2 variants={fadeUpVariants} className="text-4xl lg:text-5xl font-extrabold mb-6">Stop simulating. Start executing.</motion.h2>
          <motion.p variants={fadeUpVariants} className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join the enterprise network providing real cryptographic guarantees and secure financial solvency boundaries for agentic swarms.
          </motion.p>
          <motion.div variants={fadeUpVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto bg-white text-black px-8 py-4 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-lg">
              Initialize Sovereign Workspace <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="w-full sm:w-auto bg-[#1A1A1A] border border-white/10 text-white px-8 py-4 rounded-lg font-bold hover:bg-[#222] transition-colors flex items-center justify-center text-lg">
              Sign In
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center text-gray-500 text-sm bg-[#0A0A0C]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#FFB800] rounded flex items-center justify-center">
              <span className="font-bold text-black text-xs leading-none">V</span>
            </div>
            <span className="font-bold font-mono tracking-wider text-white">VEKLOM</span>
          </div>
          <p>© 2026 Veklom Corporation. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <a href="mailto:support@veklom.com" className="hover:text-white transition-colors flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> support@veklom.com</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
