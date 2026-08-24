"use client";

import React, { useState, useEffect } from "react";
import { Moon, Sun, Lock, Shield, Server, Activity, Database, CheckCircle, FileText, Zap } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export default function LandingPage() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <div className={min-h-screen transition-colors duration-300 }>
      
      {/* Theme Toggle Navbar */}
      <nav className={ixed top-0 w-full z-50 px-6 py-4 border-b transition-colors }>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#00E5FF] flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold tracking-widest uppercase text-sm">Veklom</span>
          </div>
          <button 
            onClick={toggleTheme}
            className={p-2 rounded-md border transition-colors }
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-6 text-xs font-mono font-semibold uppercase tracking-widest shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-colors
            ">
            Sovereign Consequence Authority
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            I ∧ P ∧ A ∧ S ∧ X ∧ E
          </h1>
          <p className={max-w-2xl mx-auto text-lg }>
            The unbreakable six-part invariant flow. Zero-trust architecture anchoring agentic execution in cryptographically verified proof.
          </p>
        </div>

        {/* Interactive Architecture Flow */}
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 z-0 hidden lg:block overflow-hidden rounded-full">
            <div className={w-full h-full }></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent opacity-50 animate-[liquid-fill_3s_ease-in-out_infinite]"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 relative z-10">
            
            {/* I - Identity */}
            <div className={p-6 rounded-xl border relative group transition-all duration-300 hover:-translate-y-2
              }>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black font-mono text-[#00E5FF]">I</span>
                <Lock className={w-5 h-5 } />
              </div>
              <h3 className="font-bold text-sm mb-2 uppercase tracking-wide">Identity</h3>
              <p className={	ext-xs }>SPIFFE / OIDC</p>
              <div className={mt-4 pt-4 border-t text-[10px] font-mono flex justify-between }>
                <span>Protocol</span>
                <span className="text-[#00E5FF] font-bold">mTLS+JWT</span>
              </div>
            </div>

            {/* P - Policy */}
            <div className={p-6 rounded-xl border relative group transition-all duration-300 hover:-translate-y-2
              }>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black font-mono text-[#00E5FF]">P</span>
                <Shield className={w-5 h-5 } />
              </div>
              <h3 className="font-bold text-sm mb-2 uppercase tracking-wide">Policy</h3>
              <p className={	ext-xs }>SEKED Engine</p>
              <div className={mt-4 pt-4 border-t text-[10px] font-mono flex justify-between }>
                <span>Type</span>
                <span className="text-[#00E5FF] font-bold">Middleware</span>
              </div>
            </div>

            {/* A - Authority */}
            <div className={p-6 rounded-xl border relative group transition-all duration-300 hover:-translate-y-2
              }>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black font-mono text-[#00E5FF]">A</span>
                <Server className={w-5 h-5 } />
              </div>
              <h3 className="font-bold text-sm mb-2 uppercase tracking-wide">Authority</h3>
              <p className={	ext-xs }>CAPPO-BACKEND</p>
              <div className={mt-4 pt-4 border-t text-[10px] font-mono flex justify-between }>
                <span>Port</span>
                <span className="font-bold">8002</span>
              </div>
            </div>

            {/* S - State */}
            <div className={p-6 rounded-xl border relative group transition-all duration-300 hover:-translate-y-2
              }>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black font-mono text-[#00FF66]">S</span>
                <Activity className={w-5 h-5 } />
              </div>
              <h3 className="font-bold text-sm mb-2 uppercase tracking-wide">State</h3>
              <p className={	ext-xs }>Live Target Check (TOCTOU)</p>
              <div className={mt-4 pt-4 border-t text-[10px] font-mono flex justify-between }>
                <span>Execution</span>
                <span className="font-bold">Pre-Flight</span>
              </div>
            </div>

            {/* X - Execution */}
            <div className={p-6 rounded-xl border relative group transition-all duration-300 hover:-translate-y-2
              }>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black font-mono text-[#FF003C]">X</span>
                <Database className={w-5 h-5 } />
              </div>
              <h3 className="font-bold text-sm mb-2 uppercase tracking-wide">Execution</h3>
              <p className={	ext-xs }>LOCKERPHYCER</p>
              <div className={mt-4 pt-4 border-t text-[10px] font-mono flex justify-between }>
                <span>Port</span>
                <span className="text-[#FF003C] font-bold">8001</span>
              </div>
            </div>

            {/* E - Evidence */}
            <div className={p-6 rounded-xl border relative group transition-all duration-300 hover:-translate-y-2
              }>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black font-mono text-[#00E5FF]">E</span>
                <FileText className={w-5 h-5 } />
              </div>
              <h3 className="font-bold text-sm mb-2 uppercase tracking-wide">Evidence</h3>
              <p className={	ext-xs }>GnomLedger / PGL</p>
              <div className={mt-4 pt-4 border-t text-[10px] font-mono flex justify-between }>
                <span>Port</span>
                <span className="text-[#00E5FF] font-bold">8092</span>
              </div>
            </div>

          </div>
        </div>

        {/* Secondary Sub-Systems */}
        <div className="mt-16 flex flex-col items-center">
          <div className="w-px h-16 bg-gradient-to-b from-[#00E5FF] to-transparent opacity-50"></div>
          <div className={px-6 py-4 rounded-xl border flex items-center gap-4 shadow-lg
            }>
            <CheckCircle className="w-6 h-6 text-[#00FF66]" />
            <div>
              <h4 className="font-bold text-sm">x402 Settlement Engine</h4>
              <div className={	ext-xs font-mono mt-1 flex justify-between }>
                <span>Port</span>
                <span className="text-[#00E5FF] font-bold ml-2">9002</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
