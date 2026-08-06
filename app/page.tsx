// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowRight, Shield, Globe, Zap, Server, Activity, Lock, Coins, 
  FileSpreadsheet, Fingerprint, Check, Terminal, Code2, Database, 
  Workflow, Cpu, Eye, Scale, FileText, Search, CreditCard, Radio 
} from "lucide-react";
import { motion } from "framer-motion";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function OverviewDashboard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const pipelineSteps = [
    { id: "01", name: "Messy Intent", icon: FileText, desc: "Raw ingestion of human goals & docs", status: "Live", color: "text-blue-400" },
    { id: "02", name: "ABIDE Blueprint", icon: FileSpreadsheet, desc: "Compile to Sovereign Plan IR", status: "Live", color: "text-blue-400" },
    { id: "03", name: "GPC Pipeline", icon: Workflow, desc: "Visual pipeline construction", status: "Stubbed", color: "text-amber-400" },
    { id: "04", name: "RepoGate", icon: Search, desc: "AST Zero-Trust Inspection", status: "Live", color: "text-blue-400" },
    { id: "05", name: "UACP / CAPPO", icon: Shield, desc: "Authorization & Tenant Isolation", status: "Blocked", color: "text-red-400", sub: "(Requires Auth)" },
    { id: "06", name: "cAPI", icon: Cpu, desc: "Capability Execution Mesh", status: "Live", color: "text-green-400" },
    { id: "07", name: "GnomLedger", icon: Database, desc: "Immutable PGL Evidence", status: "Connected", color: "text-blue-400" },
    { id: "08", name: "x402 Settlement", icon: CreditCard, desc: "HTTP 402 Micro-payments", status: "Planned", color: "text-gray-500" },
    { id: "09", name: "VNP Monitoring", icon: Radio, desc: "Passive Cyber Sonar", status: "Live", color: "text-blue-400" }
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-[#FFB800]/30 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center overflow-hidden">
              <img src="/logo-square.png" alt="Veklom Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold tracking-wider text-lg">VEKLOM CONTROL PLANE</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <Link href="/" className="text-white transition-colors">Overview</Link>
            <Link href="/os" className="hover:text-white transition-colors">Capability OS</Link>
            <Link href="/settings" className="hover:text-white transition-colors">Integrations & Settings</Link>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
             <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded border border-red-500/30 font-mono text-xs">
              UNAUTHENTICATED (SYSTEM DEFAULT)
             </span>
          </div>
        </div>
      </nav>

      {/* Main Dashboard */}
      <section className="pt-32 pb-24 px-6 max-w-7xl mx-auto relative">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.div variants={fadeUpVariants} className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">M2M Execution Reality</h1>
            <p className="text-xl text-gray-400 max-w-3xl leading-relaxed font-light">
              The continuous pipeline transforming chaotic AI intent into strictly governed, mathematically verified digital execution.
            </p>
          </motion.div>

          {/* Pipeline Visualization */}
          <motion.div variants={fadeUpVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {pipelineSteps.map((step, idx) => (
              <div key={step.id} className="bg-[#111111] border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:border-white/20 transition-all">
                {/* Connector Line (Desktop) */}
                {idx % 3 !== 2 && idx < pipelineSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 right-0 w-6 h-[1px] bg-white/10 translate-x-full z-0" />
                )}
                
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-lg bg-white/5 border border-white/5 ${step.color}`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-mono text-gray-500 font-bold">{step.id}</span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border 
                      ${step.status === 'Live' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                        step.status === 'Connected' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        step.status === 'Stubbed' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        step.status === 'Blocked' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                      {step.status}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-2 text-gray-200 group-hover:text-white transition-colors">{step.name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                {step.sub && <p className="text-xs text-red-400 mt-2 font-mono">{step.sub}</p>}
              </div>
            ))}
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeUpVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/os" className="bg-[#111111] border border-white/10 rounded-xl p-8 hover:border-[#FFB800]/50 transition-colors flex items-center justify-between group">
              <div>
                <h4 className="text-xl font-bold mb-2">Launch Capability OS</h4>
                <p className="text-sm text-gray-500">Dispatch governed intent & view telemetry</p>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-600 group-hover:text-[#FFB800] transition-colors" />
            </Link>
            
            <Link href="/settings" className="bg-[#111111] border border-white/10 rounded-xl p-8 hover:border-white/30 transition-colors flex items-center justify-between group">
              <div>
                <h4 className="text-xl font-bold mb-2">System Integrations</h4>
                <p className="text-sm text-gray-500">Manage LLM keys & backend endpoints</p>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" />
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
