"use client";

import React, { useState } from "react";
import { CheckCircle2, Shield, Activity, Lock, Database, Copy, Check, Terminal, Globe, Zap, Cpu } from "lucide-react";

export default function WhitepaperContent() {
  const [copied, setCopied] = useState(false);
  const installCmd = "curl -sSf https://api.veklom.com/install.sh | sh";

  const handleCopy = () => {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl py-12 px-6 lg:px-12 text-[#c9c5cf] font-sans selection:bg-[#f05a70]/30 selection:text-white">
      
      {/* Doc Head */}
      <div className="mb-12 border-b border-[#2a2630] pb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f05a70]/10 border border-[#f05a70]/20 text-[#f05a70] text-[10px] font-mono font-bold uppercase tracking-widest mb-6">
          <Shield className="w-3.5 h-3.5" />
          VEKLOM DEVELOPER PORTAL
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#f2f2f5] mb-4 tracking-tight font-sans leading-tight">
          Sovereign AI Fleet Codex
        </h1>
        <p className="text-base text-[#918d98] font-mono leading-relaxed mb-8">
          The definitive machine-readable contract suite for PGL, SEKED, CAPI, and VNP.
        </p>

        {/* Crabfleet style SSH installer */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-[#06080d] border border-[#1c2030] rounded-xl p-3.5 font-mono text-xs max-w-2xl shadow-[0_4px_18px_rgba(0,0,0,.45)]">
          <div className="flex items-center gap-2 text-[#7e8ba3] shrink-0 select-none">
            <Terminal className="w-4 h-4 text-[#f05a70]" />
            <span>$</span>
          </div>
          <code className="text-[#e6edf3] flex-1 truncate select-all">{installCmd}</code>
          <button 
            onClick={handleCopy}
            className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              copied 
                ? "bg-[#34d399]/10 border-[#34d399]/30 text-[#34d399]" 
                : "bg-white/5 border-white/10 hover:border-[#f05a70] hover:text-[#f05a70] text-[#918d98]"
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Chapter 1 */}
      <section id="strategic-imperative" className="mb-20 scroll-mt-24">
        <h2 className="text-xl font-bold text-[#f2f2f5] mb-6 border-b border-[#2a2630] pb-3 flex items-center gap-2">
          <span className="text-[#f05a70] font-mono">01.</span> The Strategic Imperative
        </h2>
        <div className="space-y-4 text-[#c9c5cf] leading-relaxed text-sm">
          <p>
            The transition from experiment loops to autonomous, machine-to-machine production systems requires the abandonment of "trust-based" opaque models. Ungoverned agent behaviors inherit sweeping permissions, lack replayable audit logic, and generate unconstrained execution spend.
          </p>
          <div className="bg-[#100b0d] border border-[#f05a70]/20 p-5 rounded-xl my-6 relative overflow-hidden">
            <h4 className="text-[#f05a70] font-mono font-bold text-xs mb-1 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-4 h-4" /> Core Principle
            </h4>
            <p className="text-white text-xs leading-relaxed font-mono">
              Sovereignty is the absolute runtime enforcement of quality, schema, and economic boundaries at the gateway level. You cannot govern what you cannot verify.
            </p>
          </div>
          <h3 className="text-sm font-mono font-bold uppercase text-[#f2f2f5] tracking-wider mt-8 mb-3">Systemic Security Vulnerabilities</h3>
          <div className="grid gap-3">
            {[
              { title: "Visual Shell Drift", desc: "AI writing code guess-formats components, leading to broken frames and monad errors." },
              { title: "Ghost Tool Execution", desc: "No runtime gating for execution layers, allowing unauthorized file writes or database overrides." },
              { title: "Spend Slashes", desc: "Inability to govern per-completion spend in real-time, resulting in runaway API charges." }
            ].map((v, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-lg border border-[#2a2630] bg-[#100b0d]/50">
                <div className="mt-1 w-5 h-5 rounded-full bg-[#f05a70]/10 border border-[#f05a70]/30 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f05a70]" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-xs mb-1 font-mono">{v.title}</h4>
                  <p className="text-[11px] text-[#918d98] leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chapter 2 */}
      <section id="pgl-identity" className="mb-20 scroll-mt-24">
        <h2 className="text-xl font-bold text-[#f2f2f5] mb-6 border-b border-[#2a2630] pb-3 flex items-center gap-2">
          <span className="text-[#f05a70] font-mono">02.</span> PGL IdentityRAG
        </h2>
        <div className="space-y-4 text-[#c9c5cf] leading-relaxed text-sm">
          <p>
            Standard SaaS products rely on user-interactive cookies. A machine-readable agent system requires signed JWT credentials mapping back to static workspaces via cross-cluster **IdentityRAG (PGL)**.
          </p>
          <div className="p-4 bg-[#06080d] border-l-2 border-[#3b82f6] rounded text-[#918d98] font-mono text-xs leading-relaxed">
            By extracting claims dynamically from bearer credentials starting with the `vk_key_` token parser, Zero-Trust middleware continuous resolves auth states.
          </div>
          
          <h3 className="text-sm font-mono font-bold uppercase text-[#f2f2f5] tracking-wider mt-8 mb-4">PGL Identity Architecture Matrix</h3>
          <div className="overflow-x-auto border border-[#2a2630] rounded-lg">
            <table className="w-full text-xs text-left border-collapse font-mono">
              <thead>
                <tr className="border-b border-[#2a2630] text-white bg-[#06080d]">
                  <th className="p-3">Parameter</th>
                  <th className="p-3 text-[#f05a70]">Legacy Context</th>
                  <th className="p-3 text-[#34d399]">IdentityRAG (PGL)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2630] bg-[#100b0d]/20">
                {[
                  ["Tenant Resolution", "Client-supplied body parameters", "JWT payload-derived Claims mapping"],
                  ["Session Uptime", "Short-lived ephemeral sessions", "Continuous ZK-attested secure key chains"],
                  ["Trace Integrity", "Weak local telemetry files", "Sha256 hash chains written off the hotpath"],
                  ["Integration", "Hardcoded credentials", "Symmetric AES Fernet decryption on fetch"]
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="p-3 text-[#918d98] font-semibold">{row[0]}</td>
                    <td className="p-3 text-[#918d98]/70">{row[1]}</td>
                    <td className="p-3 text-white flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" /> {row[2]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Chapter 3 */}
      <section id="seked-policy" className="mb-20 scroll-mt-24">
        <h2 className="text-xl font-bold text-[#f2f2f5] mb-6 border-b border-[#2a2630] pb-3 flex items-center gap-2">
          <span className="text-[#f05a70] font-mono">03.</span> SEKED Policy Guardrails
        </h2>
        <div className="space-y-4 text-[#c9c5cf] leading-relaxed text-sm">
          <p>
            Autonomous operators must execute within rigid, decoupled policies. The **SEKED Policy Engine** provides compile-time and runtime check gates preventing context exfiltration, malformed schema writes, or PII leaks.
          </p>
          <div className="bg-[#06080d] border border-[#2a2630] p-5 rounded-xl font-mono text-xs text-white/80 space-y-3">
            <div className="flex items-center gap-2 border-b border-[#2a2630] pb-2 text-[#f05a70] font-bold">
              <Cpu className="w-4 h-4" /> SEKED Enforcement Stages
            </div>
            <ol className="space-y-2.5 list-decimal list-inside text-[#918d98]">
              <li><span className="text-white font-bold">Plan Sniffing:</span> Structured intent parsed from execution queue.</li>
              <li><span className="text-white font-bold">PII/PHI Sanitization:</span> Regex screening filters database variables.</li>
              <li><span className="text-white font-bold">Schema Gating:</span> Rejects generic empty schemas <code className="bg-white/5 px-1">{"{}"}</code>.</li>
              <li><span className="text-white font-bold">Sandbox Isolation:</span> Code executes inside micro-virtual env.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Chapter 4 */}
      <section id="interlink-capi" className="mb-20 scroll-mt-24">
        <h2 className="text-xl font-bold text-[#f2f2f5] mb-6 border-b border-[#2a2630] pb-3 flex items-center gap-2">
          <span className="text-[#f05a70] font-mono">04.</span> CAPPO Runtime & Swarm
        </h2>
        <div className="space-y-4 text-[#c9c5cf] leading-relaxed text-sm">
          <p>
            The main operating surface decouples the backend headlessly from the Next.js control plane. Standard routing rules configured via the Traefik configuration file map subdomains dynamically to internal container ports:
          </p>
          <div className="bg-[#06080d] border border-[#2a2630] rounded-xl p-4 font-mono text-[11px] text-[#e6edf3] overflow-x-auto shadow-[0_4px_18px_rgba(0,0,0,.45)]">
            <div className="text-[#7c8597] mb-2"># Traefik routing configuration (Dynamic)</div>
            <div>http:</div>
            <div className="pl-4">routers:</div>
            <div className="pl-8">veklom-api:</div>
            <div className="pl-12">rule: <span className="text-[#a6e3a1]">"Host(`api.veklom.com`)"</span></div>
            <div className="pl-12">service: veklom-api</div>
            <div className="pl-8">veklom-control:</div>
            <div className="pl-12">rule: <span className="text-[#a6e3a1]">"Host(`control.veklom.com`)"</span></div>
            <div className="pl-12">service: veklom-control</div>
          </div>
        </div>
      </section>

      {/* Chapter 5 */}
      <section id="x402-vnp" className="mb-32 scroll-mt-24">
        <h2 className="text-xl font-bold text-[#f2f2f5] mb-6 border-b border-[#2a2630] pb-3 flex items-center gap-2">
          <span className="text-[#f05a70] font-mono">05.</span> x402 & Micro-Stakes (VNP)
        </h2>
        <div className="space-y-4 text-[#c9c5cf] leading-relaxed text-sm">
          <p>
            Under the **x402 Protocol**, every completion requires cryptographic payment proof using USDC. If an agent breaches SLA commitments, micro-stakes (VNP) are slashed instantly off the hot-path.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 border border-[#2a2630] rounded-lg bg-[#06080d] hover:border-[#f05a70]/50 transition-colors">
              <Zap className="w-5 h-5 text-[#f05a70] mb-2" />
              <div className="text-white font-mono font-bold text-xs mb-1">USDC Gas Delegation</div>
              <p className="text-[11px] text-[#918d98] leading-relaxed">Pay per inference completion token directly to Base address.</p>
            </div>
            <div className="p-4 border border-[#2a2630] rounded-lg bg-[#06080d] hover:border-[#f05a70]/50 transition-colors">
              <Activity className="w-5 h-5 text-[#3b82f6] mb-2" />
              <div className="text-white font-mono font-bold text-xs mb-1">VNP Ledger logging</div>
              <p className="text-[11px] text-[#918d98] leading-relaxed">Off-hotpath append-only snapshots preventing latency issues.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
