"use client";

import React from 'react';
import { Server } from 'lucide-react';
import dynamicImport from "next/dynamic";
import { CANONICAL_TOPOLOGY_URL } from "@/lib/vnp-topology";

const NetworkTopologyPanel = dynamicImport(
  () => import("@/components/vnp/NetworkTopologyPanel"),
  { ssr: false, loading: () => <div className="h-[500px] bg-white/5 rounded-xl animate-pulse" /> }
);

// The five canonical physical VNP nodes (all Hetzner). These are the only
// valid sites; the panel reflects each node's actual returned state.
const CANONICAL_NODES = [
  { region: "us-ashburn", location: "Ashburn, Virginia, United States" },
  { region: "us-hillsboro", location: "Hillsboro, Oregon, United States" },
  { region: "de-nuremberg", location: "Nuremberg, Germany" },
  { region: "de-falkenstein", location: "Falkenstein, Germany" },
  { region: "sg-singapore", location: "Singapore" },
];

export default function TopologyPage() {
  return (
    <div className="space-y-12 pb-24">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">VNP Beacon Topology</h1>
        <p className="text-xl text-gray-400 leading-relaxed mb-2">
          The five canonical physical VNP nodes and their live state, read directly from the beacon.
          Each node&rsquo;s connectivity is derived from its returned status and heartbeat freshness
          — no node is shown as live unless the backend reports it.
        </p>
        <p className="text-sm text-gray-500 font-mono">source: {CANONICAL_TOPOLOGY_URL}</p>
      </div>

      <div className="space-y-8">
        <section>
          <div className="w-full mb-8 rounded-2xl overflow-hidden border border-white/10 relative p-4 bg-[#060608]">
            <NetworkTopologyPanel />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 border-b border-white/10 pb-4">
            The five canonical nodes
          </h2>
          <div className="grid gap-4 mt-6 sm:grid-cols-2">
            {CANONICAL_NODES.map((node) => (
              <div
                key={node.region}
                className="bg-white/5 border border-white/10 p-6 rounded-xl flex gap-4"
              >
                <Server className="w-7 h-7 text-[#FFB800] shrink-0" />
                <div>
                  <h3 className="font-bold text-white mb-1 font-mono">{node.region}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{node.location}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Hetzner site · live state reported by the beacon above.
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 leading-relaxed mt-6">
            These are the only valid VNP sites. Any operational state — registration, active keys,
            heartbeat freshness, observation counts — is shown exactly as the beacon returns it. When
            the beacon is unreachable or a node is not currently connected, the panel reads{" "}
            <span className="text-amber-300 font-semibold">Needs proof</span> rather than implying a
            live mesh.
          </p>
        </section>
      </div>
    </div>
  );
}
