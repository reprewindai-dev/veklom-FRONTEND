// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Key, Database, ShieldCheck, Server, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-[#FFB800]/30 font-sans pb-24">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-bold tracking-wider text-lg">SYSTEM INTEGRATIONS</span>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#FFB800] text-black px-4 py-2 rounded-md hover:bg-[#FFC833] transition-colors font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Configuration"}
            <Save className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <section className="pt-32 px-6 max-w-4xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={fadeUpVariants}>
          
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3 mb-10">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-red-400 font-bold mb-1">Security Notice: Server-Side Secrets</h4>
              <p className="text-red-300/80 text-sm leading-relaxed">
                As part of the recent security audit remediation, API keys are no longer stored in local storage or sent via browser headers. These configurations are synced directly to the Server 0 Lockerphycer Vault via encrypted UDS.
              </p>
            </div>
          </div>

          <div className="space-y-12">
            
            {/* LLM Providers */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-400" />
                Intelligence Providers
              </h2>
              <div className="bg-[#111111] border border-white/10 rounded-xl p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Ollama Base URL (Primary)</label>
                  <input type="text" defaultValue="http://167.233.202.195:11434" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FFB800] transition-colors font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Anthropic API Key (Fallback)</label>
                  <input type="password" placeholder="sk-ant-..." className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FFB800] transition-colors font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">OpenAI API Key (Fallback)</label>
                  <input type="password" placeholder="sk-proj-..." className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FFB800] transition-colors font-mono text-sm" />
                </div>
              </div>
            </div>

            {/* Core Infrastructure */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Server className="w-5 h-5 text-green-400" />
                Core Infrastructure Mesh
              </h2>
              <div className="bg-[#111111] border border-white/10 rounded-xl p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">cAPI Container Address (Port 3003)</label>
                  <input type="text" defaultValue="http://capi-container:3003" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FFB800] transition-colors font-mono text-sm" />
                  <p className="text-xs text-gray-500 mt-2">The unified capability execution layer connecting authorized workloads to backend skills.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Lockerphycer Vault (Port 8092)</label>
                  <input type="text" defaultValue="http://lockerphycer-api:8092" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FFB800] transition-colors font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Vector Retrieval Service (Port 8095)</label>
                  <input type="text" defaultValue="http://veklom-vector-service:8095" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FFB800] transition-colors font-mono text-sm" />
                </div>
              </div>
            </div>

            {/* Evidence & Compliance */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                Evidence & Compliance
              </h2>
              <div className="bg-[#111111] border border-white/10 rounded-xl p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">GnomLedger / PGL Endpoint (Port 8001)</label>
                  <input type="text" defaultValue="http://gnomledger-api-1:8001" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FFB800] transition-colors font-mono text-sm" />
                </div>
                <div className="pt-4 border-t border-white/10">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" defaultChecked />
                      <div className="w-10 h-6 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors"></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-[#FFB800] rounded-full transition-transform translate-x-4"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-300">Enforce Law 25 PII Detection Override</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-2 ml-13">Automatically routes payloads containing PII to local Ollama bare-metal nodes.</p>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </section>
    </main>
  );
}
