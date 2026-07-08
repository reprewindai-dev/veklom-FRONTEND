"use client";

import React from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function VNPFooter() {
  return (
    <footer className="py-16 border-t border-[#FFB800]/20 bg-[#0A0A0C] text-sm relative z-10 mt-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-black border-2 border-[#FFB800] rounded flex items-center justify-center">
                <span className="font-bold text-[#FFB800] text-sm leading-none">VNP</span>
              </div>
              <span className="font-bold font-mono tracking-wider text-white text-lg">VEKLOM NEXUS PROTOCOL</span>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              The global standard for autonomous API performance benchmarking and zero-trust SLA settlement. Governing the autonomous web with mathematical certainty.
            </p>
            <div className="flex flex-col gap-2 text-xs text-[#FFB800] bg-[#FFB800]/10 border border-[#FFB800]/20 px-3 py-2 rounded">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span><strong>60-Day Compliance Window</strong></span>
              </div>
              <p className="text-[#FFB800]/80">APIs failing to meet P99 SLA targets for 60 consecutive days will be permanently delisted from the active mesh.</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Protocol</h3>
            <ul className="space-y-3 text-gray-400">
              <li><Link href="/vnp/methodology" className="hover:text-[#FFB800] transition-colors">Methodology v1.0</Link></li>
              <li><Link href="/vnp/governance" className="hover:text-[#FFB800] transition-colors">Governance Charter</Link></li>
              <li><Link href="/vnp/slashing" className="hover:text-[#FFB800] transition-colors">Slashing Mechanics</Link></li>
              <li><Link href="/vnp/x402" className="hover:text-[#FFB800] transition-colors">x402 Settlement</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Developers</h3>
            <ul className="space-y-3 text-gray-400">
              <li><Link href="/vnp/docs" className="hover:text-[#FFB800] transition-colors">Documentation</Link></li>
              <li><Link href="/vnp/sdk/python" className="hover:text-[#FFB800] transition-colors">Python Probe SDK</Link></li>
              <li><Link href="/vnp/sdk/fastapi" className="hover:text-[#FFB800] transition-colors">FastAPI Integration</Link></li>
              <li><a href="https://github.com/veklom/veklom-vnp" target="_blank" rel="noopener noreferrer" className="hover:text-[#FFB800] transition-colors flex items-center gap-1">GitHub Repository <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Network</h3>
            <ul className="space-y-3 text-gray-400">
              <li><Link href="/vnp/topology" className="hover:text-[#FFB800] transition-colors">Global Topology Map</Link></li>
              <li><Link href="/vnp/operators" className="hover:text-[#FFB800] transition-colors">Node Operator Guide</Link></li>
              <li><Link href="/vnp/directory" className="hover:text-[#FFB800] transition-colors">API Directory</Link></li>
              <li><Link href="/vnp/status" className="hover:text-[#FFB800] transition-colors">Status & Uptime</Link></li>
            </ul>
          </div>
          
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-xs">
          <p>© {new Date().getFullYear()} Veklom Nexus Protocol. A Veklom Foundation Standard.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition-colors">Veklom Home</Link>
            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
              <div className="w-2 h-2 rounded-full bg-[#FFB800] animate-pulse"></div>
              <span className="text-[#FFB800]">VNP Oracles Active</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
