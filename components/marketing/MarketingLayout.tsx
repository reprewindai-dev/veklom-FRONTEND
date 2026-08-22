"use client";

import React from "react";
import { GlobalNav } from "./GlobalNav";
import { GlobalFooter } from "./GlobalFooter";
import { useUIStore } from "@/lib/store/ui-store";

interface MarketingLayoutProps {
  children: React.ReactNode;
  isMachine?: boolean;
}

export function MarketingLayout({ 
  children,
  isMachine: isMachineOverride,
}: MarketingLayoutProps) {
  const { isMachine: storedIsMachine } = useUIStore();
  const isMachine = isMachineOverride ?? storedIsMachine;
  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${isMachine ? 'bg-[#0D1114] text-[#CFEFE9]' : 'bg-[#E8E5E1] text-[#1C1917]'}`}>
      <style jsx global>{`
        :root {
          --void: #0D1114;
          --void-panel: #07090B;
          --paper: #E8E5E1;
          --paper-dim: #D9D5CF;
          --ink: #1C1917;
          --machine-ink: #CFEFE9;
          --brass: #B5772E;
          --brass-deep: #8B5820;
          --wire: rgba(76,242,214,0.15);
          --rule: rgba(28,25,23,0.1);
          --cyan: #4CF2D6;
          --cyan-dim: #1E8B79;
        }

        .m2m-container {
          font-family: 'Inter', sans-serif;
        }

        .m2m-container.machine {
          font-family: 'JetBrains Mono', monospace;
        }

        @keyframes typeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .feed-line {
          opacity: 0;
          animation: typeIn 400ms ease forwards;
        }
        .feed-line:nth-child(1) { animation-delay: .1s; }
        .feed-line:nth-child(2) { animation-delay: .35s; }
        .feed-line:nth-child(3) { animation-delay: .6s; }
        .feed-line:nth-child(4) { animation-delay: .85s; color: var(--cyan); }

        .live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          display: inline-block; margin-right: 6px;
          animation: pulse 1.6s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .bg-cos-bg { background-color: var(--paper); }
        .m2m-container.machine .bg-cos-bg { background-color: var(--void); }

        .bg-cos-bg-dim { background-color: var(--paper-dim); }
        .m2m-container.machine .bg-cos-bg-dim { background-color: var(--void-panel); }

        .bg-void { background-color: var(--void); }
        .bg-void-panel { background-color: var(--void-panel); }

        .text-cos-text { color: var(--ink); }
        .m2m-container.machine .text-cos-text { color: var(--machine-ink); }

        .text-machine-ink { color: var(--machine-ink); }

        .text-cos-accent { color: var(--brass); }
        .m2m-container.machine .text-cos-accent { color: var(--cyan); }

        .text-cos-accent-dim { color: var(--brass-deep); }
        .m2m-container.machine .text-cos-accent-dim { color: var(--cyan-dim); }

        .text-brass { color: var(--brass); }
        .text-brass-deep { color: var(--brass-deep); }

        .border-rule { border-color: var(--rule); }
        .m2m-container.machine .border-rule { border-color: var(--wire); }

        .border-wire { border-color: var(--wire); }
      `}</style>

      <div className={`relative z-10 m2m-container ${isMachine ? 'machine' : ''} min-h-screen flex flex-col`}>
        <div className="relative z-20">
          <GlobalNav isMachineOverride={isMachineOverride} />
        </div>
        
        <main className="flex-1">
          {children}
        </main>

        <GlobalFooter isMachine={isMachine} />
      </div>
    </div>
  );
}
