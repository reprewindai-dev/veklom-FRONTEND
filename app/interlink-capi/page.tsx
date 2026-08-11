import React from 'react';
import Link from 'next/link';
import { ArrowRight, Code, Shield, Wallet, Cpu, CheckCircle } from 'lucide-react';

export default function CappoLandingPage() {
  const phases = [
    { num: 1, title: 'RepoGate AST Scan', output: 'Security Validated AST', icon: <Code className="w-5 h-5" /> },
    { num: 2, title: 'PII Detection (Quebec Law 25)', output: 'Privacy Clearance Hash', icon: <Shield className="w-5 h-5" /> },
    { num: 3, title: 'Budget Check', output: 'Authorized Funds Lock', icon: <Wallet className="w-5 h-5" /> },
    { num: 4, title: 'Authority Verification', output: 'RBAC Policy Token', icon: <CheckCircle className="w-5 h-5" /> },
    { num: 5, title: 'LAW 0 Check', output: 'Safety Override Cleared', icon: <Shield className="w-5 h-5" /> },
    { num: 6, title: 'Execution Identity Mint', output: 'EI Token', icon: <Cpu className="w-5 h-5" /> },
    { num: 7, title: 'Capability Execution', output: 'Compute Output', icon: <Code className="w-5 h-5" /> },
    { num: 8, title: 'PGL Evidence Recording', output: 'Evidence Envelope Hash', icon: <Shield className="w-5 h-5" /> },
    { num: 9, title: 'Settlement (x402)', output: 'Cryptographic Receipt', icon: <Wallet className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-void-charcoal text-ink-50 font-sans selection:bg-brand-500/30">
      {/* Hero */}
      <section className="relative px-6 pt-32 pb-24 overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-cos-grid opacity-20 pointer-events-none"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-electric-cyan/10 blur-[120px] rounded-full"></div>
        
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-surface2 border border-border/50 text-electric-cyan text-sm font-mono shadow-cos-glow">
            <span className="w-2 h-2 rounded-full bg-matrix-emerald animate-pulse"></span>
            CAPPO Runtime Active
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Every action. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan to-brand-400">
              Governed. Evidenced.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-ink-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The unified machine+human capability orchestration layer. Nine deterministic phases 
            guarantee zero-trust execution, local sovereign compliance, and cryptographic proof-of-graph.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/interlink-capi/diagram" className="px-6 py-3 rounded-md bg-white text-black font-medium hover:bg-ink-200 transition-colors">
              View Architecture
            </Link>
            <Link href="/nexus" className="px-6 py-3 rounded-md border border-border/50 hover:border-electric-cyan/50 hover:bg-surface2 transition-colors font-medium">
              Explore MCP Server
            </Link>
          </div>
        </div>
      </section>

      {/* Nine-Phase Pipeline */}
      <section className="py-24 px-6 border-b border-border/50 bg-void-metal">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">The Nine-Phase Governance Pipeline</h2>
            <p className="text-ink-400 max-w-2xl mx-auto">Deterministic execution routing. No agent bypasses the pipeline.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {phases.map((phase) => (
              <div key={phase.num} className="group relative p-6 rounded-xl bg-bg-800 border border-border/50 shadow-card hover:border-electric-cyan/30 transition-all overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <div className="text-8xl font-black">{phase.num}</div>
                </div>
                <div className="mb-4 text-electric-cyan">
                  {phase.icon}
                </div>
                <h3 className="text-lg font-medium mb-2">{phase.title}</h3>
                <div className="flex items-center gap-2 text-sm text-ink-400 mt-4 pt-4 border-t border-border/30">
                  <span className="font-mono text-brand-400 text-xs">Output:</span>
                  <span className="truncate">{phase.output}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Discovery CTA */}
      <section className="py-24 px-6 border-b border-border/50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Machine Discovery Flow</h2>
            <p className="text-ink-400 mb-8 leading-relaxed">
              Autonomous clients fetch rate limits, endpoint schemas, and micro-pricing dynamically. 
              Zero-touch onboarding for governed agents via the universal Model Context Protocol.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-bg-800 border border-border flex items-center justify-center font-mono text-sm">1</div>
                <div>
                  <div className="font-mono text-sm text-electric-cyan mb-1">GET /.well-known/agent-card.json</div>
                  <p className="text-sm text-ink-400">Discover capabilities and network endpoints.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-bg-800 border border-border flex items-center justify-center font-mono text-sm">2</div>
                <div>
                  <div className="font-mono text-sm text-electric-cyan mb-1">POST /mcp (tools/list)</div>
                  <p className="text-sm text-ink-400">Query the available tool catalog. (Free)</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-bg-800 border border-border flex items-center justify-center font-mono text-sm">3</div>
                <div>
                  <div className="font-mono text-sm text-brand-400 mb-1">POST /mcp (tools/call)</div>
                  <p className="text-sm text-ink-400">Execute with X-VNP-Stake and Payment-Signature.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-brand-500/10 blur-[100px] rounded-full"></div>
            <div className="relative rounded-xl border border-border bg-void-black p-6 shadow-cos-card font-mono text-sm text-ink-200">
              <div className="flex gap-2 mb-4 pb-4 border-b border-border/50">
                <div className="w-3 h-3 rounded-full bg-border"></div>
                <div className="w-3 h-3 rounded-full bg-border"></div>
                <div className="w-3 h-3 rounded-full bg-border"></div>
              </div>
              <pre className="overflow-x-auto text-electric-cyan/90">
{`{
  "protocol": "mcp-uacp-v1",
  "identity": "cappo-node-us-east",
  "capabilities": [
    "gov.execute",
    "pgl.attest"
  ],
  "settlement": "x402"
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-void-deep">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Capability Pricing</h2>
            <p className="text-ink-400">Micro-transactions settled instantly via x402 headers.</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4">
            {['Micro', 'Read', 'Action', 'Compute'].map((tier, i) => (
              <div key={tier} className="p-6 rounded-xl border border-border bg-bg-900 hover:bg-bg-800 transition-colors">
                <h3 className="font-medium text-ink-200 mb-2">{tier} Tier</h3>
                <div className="font-mono text-2xl font-bold text-brand-400 mb-4">
                  {(i * 0.05 + 0.01).toFixed(2)}<span className="text-sm text-ink-600">¢/req</span>
                </div>
                <ul className="space-y-2 text-sm text-ink-400">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-matrix-emerald" /> Base SLA</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-matrix-emerald" /> PGL Proof</li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
