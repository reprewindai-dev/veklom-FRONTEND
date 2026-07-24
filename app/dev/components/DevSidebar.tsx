"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Terminal, Shield, BookOpen, KeyRound, Cpu, Layers } from "lucide-react";

export const CHAPTERS = [
  { id: "strategic-imperative", title: "1. The Strategic Imperative", icon: Shield },
  { id: "pgl-identity", title: "2. PGL IdentityRAG", icon: KeyRound },
  { id: "seked-policy", title: "3. SEKED Guardrails", icon: Cpu },
  { id: "interlink-capi", title: "4. CAPPO Runtime & Swarm", icon: Layers },
  { id: "x402-vnp", title: "5. x402 & Micro-Stakes", icon: Terminal },
];

export default function DevSidebar() {
  const [activeId, setActiveId] = useState<string>("strategic-imperative");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -60% 0px" }
    );

    CHAPTERS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-64 shrink-0 hidden lg:block border-r border-[#2a2630] bg-[#070a10]/80 backdrop-blur-md h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto py-8 px-4 custom-scrollbar">
      <div className="mb-6 px-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-[#f05a70]/10 border border-[#f05a70]/30 flex items-center justify-center">
            <BookOpen className="w-3 h-3 text-[#f05a70]" />
          </div>
          <h3 className="text-[10px] font-mono font-bold tracking-widest text-[#918d98] uppercase">
            Veklom Codex
          </h3>
        </div>
        <div className="text-xs font-semibold text-[#c9c5cf]">Sovereign Operator Fleet</div>
      </div>
      
      <nav className="space-y-1">
        {CHAPTERS.map((chapter) => {
          const isActive = activeId === chapter.id;
          const Icon = chapter.icon;
          
          return (
            <Link 
              key={chapter.id} 
              href={`#${chapter.id}`}
              className={`relative flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors font-mono ${
                isActive ? "text-[#f05a70] bg-[#f05a70]/10 font-bold" : "text-[#918d98] hover:text-[#c9c5cf] hover:bg-white/[0.02]"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{chapter.title}</span>
              {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-70" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
