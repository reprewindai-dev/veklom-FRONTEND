"use client";

import React from 'react';
import { Globe, ShieldAlert, Server, Network } from 'lucide-react';
import dynamicImport from "next/dynamic";

const NetworkTopologyPanel = dynamicImport(
  () => import("@/components/vnp/NetworkTopologyPanel"),
  { ssr: false, loading: () => <div className="h-[500px] bg-white/5 rounded-xl animate-pulse" /> }
);

export default function TopologyPage() {
  return (
    <div className="space-y-12 pb-24">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">Global Topology Map</h1>
        <p className="text-xl text-gray-400 leading-relaxed mb-8">
          The physical distribution of the VNP Edge Probes and the Emergency Topology State.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <div className="w-full h-[500px] mb-8 rounded-2xl overflow-hidden border border-white/10 relative">
            <div className="absolute inset-0 z-10 pointer-events-none"></div>
            <NetworkTopologyPanel />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 border-b border-white/10 pb-4">The Tri-Tier Observer Network</h2>
          <div className="grid gap-6 mt-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl flex gap-4">
              <Server className="w-8 h-8 text-[#FFB800] shrink-0" />
              <div>
                <h3 className="font-bold text-white mb-2">1. Core Autonomous Relays</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Hardened bare-metal infrastructure (primarily Hetzner and AWS outposts) functioning as the primary aggregation layer for zk-SNARK settlement processing. High bandwidth, extreme reliability.
                </p>
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl flex gap-4">
              <Network className="w-8 h-8 text-[#FFB800] shrink-0" />
              <div>
                <h3 className="font-bold text-white mb-2">2. Decentralized Residential Proxy Networks (RPNs)</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Millions of IP-rotated residential devices globally. RPNs guarantee that providers cannot detect and whitelist VNP probes, ensuring the latency measured is the exact latency a real M2M user experiences.
                </p>
              </div>
            </div>

            <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-xl flex gap-4 relative overflow-hidden group">
              <ShieldAlert className="w-8 h-8 text-red-500 shrink-0" />
              <div>
                <h3 className="font-bold text-red-100 mb-2">3. Emergency Topology State (Vantage Swarms)</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  When the MAD estimators detect severe localized BGP routing failures or undersea cable faults, VNP triggers the Emergency Topology State. Ephemeral serverless functions are immediately spinned up across unaffected geographic regions to re-triangulate provider SLA compliance.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
