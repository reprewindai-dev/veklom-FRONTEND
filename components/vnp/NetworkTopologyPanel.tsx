"use client";
import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { Server, Radio, Terminal, Database } from "lucide-react";
import {
  TOPOLOGY_ENDPOINT,
  formatFreshness,
  formatTimestamp,
  nodeConnectivityState,
  proofStateClasses,
  type ProofState,
  type VnpTopology,
  type VnpTopologyNode,
  type VnpTopologyResponse,
} from "@/lib/vnp-topology";

interface X402Config {
  enabled?: boolean;
  network?: string;
}

interface LedgerEntry {
  id?: string;
  tenant?: string;
  amount?: number;
  status?: string;
  signature?: string;
  proposer?: string;
}

// Public, truth-locked topology panel.
//
// It renders ONLY what `GET /api/v1/beacon/topology` returns. It does NOT
// fabricate connectivity, stake, settlement, or packet flow, and it exposes
// NO admin/debug mutation controls (storm / slash / config) on this public
// surface. Node connectivity is derived from each node's returned status and
// heartbeat freshness, never from the existence of a node record.

function ProofPill({ state, className = "" }: { state: ProofState; className?: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${proofStateClasses(
        state
      )} ${className}`}
    >
      {state}
    </span>
  );
}

function nodeColor(state: ProofState): { fill: string; stroke: string; led: string } {
  switch (state) {
    case "Present":
    case "Verified":
      return { fill: "#022c22", stroke: "rgba(16,185,129,0.8)", led: "#10b981" };
    case "Needs proof":
    case "Insufficient Evidence":
      return { fill: "#2a1e05", stroke: "rgba(245,158,11,0.7)", led: "#f59e0b" };
    default:
      return { fill: "#0f172a", stroke: "rgba(148,163,184,0.6)", led: "#94a3b8" };
  }
}

export default function NetworkTopologyPanel() {
  const { data, error, isLoading } = useSWR<VnpTopologyResponse>(TOPOLOGY_ENDPOINT, fetcher, {
    refreshInterval: 15000,
  });
  const { data: x402Config } = useSWR<X402Config>("/api/v1/x402/config", fetcher, {
    refreshInterval: 60000,
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string>("");

  const topology: VnpTopology | null =
    data && (data.status !== "error" ? data.topology ?? null : null) ? data.topology ?? null : null;
  const sourceReachable = Boolean(data && data.status !== "error" && data.topology);

  const nodes: VnpTopologyNode[] = topology?.nodes ?? [];
  const eventsLog: string[] = topology?.eventsLog ?? [];
  const ledgerFeed = (topology?.ledgerFeed ?? []) as LedgerEntry[];
  const totalSettledUsd = topology?.totalSettledUsd ?? 0;

  const expected = topology?.expectedNodes ?? 5;
  const registered = topology?.registeredNodes ?? nodes.length;
  const connected =
    topology?.activeNodes ??
    nodes.filter((n) => (n.status_str ?? "").toLowerCase() === "connected").length;

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? nodes[0] ?? null,
    [nodes, selectedNodeId]
  );

  const meshState: ProofState = !sourceReachable
    ? "Needs proof"
    : connected >= expected && expected > 0
    ? "Present"
    : "Needs proof";
  const meshLabel = !sourceReachable
    ? "TOPOLOGY SOURCE UNAVAILABLE"
    : `${connected}/${expected} CONNECTED · ${registered}/${expected} REGISTERED`;

  const x402State: ProofState = x402Config?.enabled ? "Present" : "Needs proof";
  const x402Label = x402Config?.enabled
    ? `x402 protocol configured (${x402Config?.network ?? "base"})`
    : "x402 protocol config unavailable";

  const settlementState: ProofState = totalSettledUsd > 0 ? "Present" : "Needs proof";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-[11px] font-mono">
      {/* LEFT: node map */}
      <div className="lg:col-span-8 flex flex-col bg-gradient-to-br from-[#080d15] to-[#04070a] border border-cyan-900/30 rounded-2xl p-5 relative overflow-hidden h-[570px]">
        <div className="flex items-center justify-between border-b border-cyan-900/30 pb-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-sans tracking-wide text-white/90">
                VNP Beacon Topology
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-widest border px-2 py-0.5 rounded text-slate-300 bg-slate-900/50 border-slate-700/50">
                {meshLabel}
              </span>
              <ProofPill state={meshState} />
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1.5">
              {x402Label}
              <ProofPill state={x402State} />
            </span>
            <span className="text-[9px] text-slate-500">
              source: GET {TOPOLOGY_ENDPOINT}
            </span>
          </div>
        </div>

        <div className="flex-1 min-h-[300px] relative mt-2 select-none">
          <svg viewBox="0 0 600 450" className="w-full h-full block">
            <g stroke="rgba(34, 211, 238, 0.05)" strokeWidth="1">
              {Array.from({ length: 9 }).map((_, i) => (
                <line key={`grid-v-${i}`} x1={i * 70 + 20} y1="0" x2={i * 70 + 20} y2="450" />
              ))}
              {Array.from({ length: 7 }).map((_, i) => (
                <line key={`grid-h-${i}`} x1="0" y1={i * 70 + 15} x2="600" y2={i * 70 + 15} />
              ))}
            </g>

            {/* Static reference links between registered sites (no traffic claims) */}
            <g>
              {nodes.map((n1, idx1) =>
                nodes.slice(idx1 + 1).map((n2) => (
                  <line
                    key={`link-${n1.id}-${n2.id}`}
                    x1={n1.x ?? 0}
                    y1={n1.y ?? 0}
                    x2={n2.x ?? 0}
                    y2={n2.y ?? 0}
                    stroke="rgba(148,163,184,0.12)"
                    strokeWidth="1"
                  />
                ))
              )}
            </g>

            {nodes.map((n) => {
              const conn = nodeConnectivityState(n);
              const c = nodeColor(conn.state);
              const isSelected = selectedNode?.id === n.id;
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x ?? 0}, ${n.y ?? 0})`}
                  className="cursor-pointer group outline-none"
                  onClick={() => setSelectedNodeId(n.id)}
                >
                  <circle cx="0" cy="0" r="26" fill="transparent" />
                  {isSelected && (
                    <circle
                      cx="0"
                      cy="0"
                      r="20"
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                  )}
                  <circle
                    cx="0"
                    cy="0"
                    r="13"
                    fill={c.fill}
                    stroke={c.stroke}
                    strokeWidth={isSelected ? "2" : "1"}
                  />
                  <circle cx="0" cy="0" r="3" fill={c.led} />
                  <g transform="translate(0, 26)">
                    <rect
                      x="-38"
                      y="-8"
                      width="76"
                      height="14"
                      rx="4"
                      fill="rgba(3,7,12,0.85)"
                      stroke={c.stroke}
                      strokeWidth="0.5"
                    />
                    <text
                      x="0"
                      y="3"
                      fill={isSelected ? "#22d3ee" : "#cbd5e1"}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {n.region}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {!sourceReachable && (
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <span className="text-amber-300/80 text-xs bg-[#03070c]/70 px-4 py-2 rounded-lg border border-amber-500/20">
                {isLoading
                  ? "Loading beacon topology…"
                  : error
                  ? "Topology source unreachable — Needs proof."
                  : "Topology source returned no nodes — Needs proof."}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2 mt-4">
          <div className="flex items-center gap-2 text-[10px] text-cyan-500/50 uppercase tracking-widest pb-2 border-b border-cyan-900/20">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Beacon event log (as reported)</span>
          </div>
          <div className="h-[70px] overflow-y-auto text-[10px] leading-relaxed text-slate-300 space-y-1.5 p-2 bg-[#03070c]/50 rounded border border-cyan-900/10">
            {eventsLog.length === 0 ? (
              <div className="text-cyan-500/30 italic">No events reported by the beacon.</div>
            ) : (
              eventsLog.map((log, idx) => (
                <div key={idx} className="text-cyan-200/70 break-all flex gap-2">
                  <span className="text-cyan-500/30 shrink-0">❯</span>
                  <span>{log}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: inspector + honest ledger */}
      <div className="lg:col-span-4 space-y-5 flex flex-col">
        {selectedNode ? (
          <NodeInspector node={selectedNode} />
        ) : (
          <div className="bg-[#080d15]/50 border border-cyan-900/30 rounded-2xl p-5 flex items-center justify-center text-cyan-500/50 text-xs italic h-[280px]">
            No node telemetry available.
          </div>
        )}

        <div className="bg-gradient-to-b from-[#0b1219]/90 to-[#03070c]/90 border border-cyan-900/30 rounded-2xl p-4 flex-1 flex flex-col min-h-[160px]">
          <div className="flex items-center justify-between border-b border-cyan-900/20 pb-3 mb-3">
            <span className="text-[9px] text-cyan-100/50 uppercase tracking-[0.2em] flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              x402 settlement ledger
            </span>
            <ProofPill state={settlementState} />
          </div>
          <div className="flex-1 overflow-y-auto pr-1.5 space-y-2">
            {ledgerFeed.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[10px] text-cyan-500/30 italic">
                No ledger settlements recorded.
              </div>
            ) : (
              ledgerFeed.map((tx, idx) => (
                <div
                  key={tx.id ?? idx}
                  className="p-3 bg-[#03070c]/60 border border-cyan-900/20 rounded-lg flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <span className="font-sans font-medium text-white/90 text-xs">
                      {tx.tenant ?? "—"}
                    </span>
                    <span className="text-[9px] text-cyan-100/30 block">
                      {tx.status ?? "—"}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-400">
                    {typeof tx.amount === "number" ? `$${tx.amount.toFixed(6)}` : "—"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NodeInspector({ node }: { node: VnpTopologyNode }) {
  const conn = nodeConnectivityState(node);
  const rows: Array<[string, string]> = [
    ["Region", node.region],
    ["Physical location", node.physicalLocation ?? "—"],
    ["Jurisdiction", node.jurisdiction ?? "—"],
    ["Registration", node.registrationStatus ?? "unknown"],
    ["Active keys", node.activeKeyCount != null ? String(node.activeKeyCount) : "—"],
    ["Operational status", `${node.status_str ?? "—"}${node.status ? ` (${node.status})` : ""}`],
    ["Heartbeat", formatFreshness(node.heartbeatFreshnessSeconds)],
    [
      "Observations",
      typeof node.observationCount === "number"
        ? node.observationCount.toLocaleString()
        : "—",
    ],
    ["Last observation", formatTimestamp(node.lastObservation)],
    ["Version", node.version ?? "—"],
  ];

  return (
    <div className="bg-gradient-to-b from-[#080d15]/90 to-[#03070c]/90 border border-cyan-900/30 rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-3 border-b border-cyan-900/30 pb-4">
        <div className="p-2 rounded-lg border bg-cyan-950/20 border-cyan-900/30">
          <Server className="text-cyan-400 w-5 h-5" />
        </div>
        <div className="flex-1">
          <span className="text-[9px] uppercase tracking-[0.2em] text-cyan-500/50 block mb-0.5">
            VNP Node
          </span>
          <h3 className="text-sm font-sans font-medium text-white/90">{node.name}</h3>
        </div>
        <ProofPill state={conn.state} />
      </div>
      <p className="text-[10px] text-cyan-100/50 leading-relaxed">{conn.reason}</p>
      <dl className="space-y-2.5 text-[10px]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between items-center gap-3">
            <dt className="uppercase tracking-widest text-[9px] text-cyan-500/50 shrink-0">
              {label}
            </dt>
            <dd className="text-white/90 text-right break-all">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
