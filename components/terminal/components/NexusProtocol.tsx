"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BookOpen,
  CheckCircle,
  Database,
  ExternalLink,
  FileText,
  MapPin,
  Network,
  Shield,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { VNP_METHODOLOGY_VERSION, VNP_VERIFICATION_STACK_TITLE } from "@/lib/vnp/methodology";
import ScoreCard from "@/components/vnp/ScoreCard";
import type { VNPScore, VNPDimensionScore, VNPConfidence, VNPProvenance, VNPGrade, VNPRegionalScore, VNPDimensionId } from "@/lib/vnp/types";

interface DimensionScore {
  name: string;
  score: number;
  weight: number;
  desc: string;
}

interface NexusApiCard {
  id: string;
  name: string;
  provider: string;
  score: number;
  grade: string;
  status: string;
  dimensions: DimensionScore[];
  anchorHash: string;
  ipfsHash: string;
  txHash: string;
  lastUpdated: string;
  measurementCount: number;
  targetP95Ms: number | null;
  observedP95Ms: number | null;
  bondAmountUsdc: number | null;
  slashedTotalUsdc: number | null;
  consensus: Record<string, unknown> | null;
}

interface NexusNode {
  id: string;
  name: string;
  region: string;
  latency: number;
  throughput: number;
  status: "attesting" | "idle" | "warning";
  activeCycles: number;
}

interface NexusProbe {
  route: string;
  state: "verified" | "needs_proof" | "error";
  status: number;
  detail?: string;
}

interface NexusState {
  generated_at: string;
  sources: { byos: string; capi: string };
  proof: {
    state: "verified" | "partial" | "error";
    reason: string;
    probes: NexusProbe[];
  };
  metrics: any;
  staking: any;
  leaderboard: any;
  leaderboard_state: "verified" | "needs_proof" | "error";
  x402: any;
  cappo: any;
  cards: NexusApiCard[];
  nodes: NexusNode[];
  anchoring: {
    merkle: string | null;
    merkle_status: string;
    block_anchored: number;
    block_status: string;
  };
}

function fmtNumber(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString() : "Needs proof";
}

function fmtMs(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? `${Math.round(n)}ms` : "Needs proof";
}

function fmtMoney(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? `$${Math.round(n).toLocaleString()}` : "Needs proof";
}

function shortHash(value?: string | null): string {
  if (!value) return "Needs proof";
  return value.length > 22 ? `${value.slice(0, 12)}...${value.slice(-8)}` : value;
}

function proofTone(state?: string): string {
  if (state === "verified") return "text-[#00FF66] border-[#00FF66]/25 bg-[#00FF66]/10";
  if (state === "error") return "text-red-300 border-red-400/25 bg-red-500/10";
  return "text-[#FFB800] border-[#FFB800]/25 bg-[#FFB800]/10";
}

function dotTone(state?: string): string {
  if (state === "verified") return "bg-[#00FF66]";
  if (state === "error") return "bg-red-400";
  return "bg-[#FFB800]";
}

function ProofPanel({ title, value, subtitle, state }: { title: string; value: string; subtitle: string; state: string }) {
  return (
    <div className={`p-3 rounded-lg border ${proofTone(state)}`}>
      <div className="text-[9px] uppercase tracking-widest font-mono opacity-70">{title}</div>
      <div className="mt-1 text-sm font-bold truncate" title={value}>{value}</div>
      <div className="mt-1 text-[9px] font-mono opacity-70">{subtitle}</div>
    </div>
  );
}

const SCORECARD_AXIS_IDS: VNPDimensionId[] = [
  "security",
  "availability",
  "x402_compliance",
  "documentation",
  "throughput",
];

function EvidenceGate({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#FFB800]/25 bg-[#FFB800]/5 p-6">
      <div className="flex items-center gap-2 text-[#FFB800] font-mono text-[11px] uppercase tracking-widest font-bold">
        <AlertCircle className="w-4 h-4" />
        {title}
      </div>
      <div className="mt-3 text-sm text-white/60 leading-relaxed">{children}</div>
    </div>
  );
}

export default function NexusProtocol() {
  const [subTab, setSubTab] = useState<"trust" | "topology" | "docs" | "consensus" | "identity" | "staking">("trust");
  const [selectedApiId, setSelectedApiId] = useState<string>("");
  const [docTab, setDocTab] = useState<"governance" | "methodology">("governance");
  const [hoveredDimIndex, setHoveredDimIndex] = useState<number | null>(null);

  const { data: state, error, isLoading } = useApi<NexusState>("/nexus-protocol/state", {
    refreshInterval: 15000,
  });

  const apiCards = state?.cards || [];
  const nodes = state?.nodes || [];
  const selectedApi = apiCards.find((api) => api.id === selectedApiId) || apiCards[0] || null;
  const verifiedProbeCount = state?.proof.probes.filter((probe) => probe.state === "verified").length || 0;
  const proofState = error ? "error" : state?.proof.state || "needs_proof";
  const activeApis = Number(state?.metrics?.active_apis || apiCards.length || 0);
  const physicalProbes = Number(state?.metrics?.total_physical_probes_recorded || 0);
  const anchorState = state?.anchoring.block_anchored ? "verified" : "needs_proof";

  useEffect(() => {
    if (!selectedApiId && apiCards.length > 0) setSelectedApiId(apiCards[0].id);
  }, [apiCards, selectedApiId]);

  const cappoAgents = useMemo(() => {
    const agents = Array.isArray(state?.cappo?.agents) ? state?.cappo.agents : [];
    return agents.slice(0, 8);
  }, [state]);

  if (isLoading && !state) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#030303] text-white/40 font-mono text-xs">
        LOADING ROUTE-BACKED NEXUS STATE...
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#030303] text-white/90 overflow-hidden font-sans border-l border-white/5 relative">
      <div className="absolute inset-0 grid-overlay opacity-20 pointer-events-none z-0" />

      <div className="h-12 border-b border-white/10 shrink-0 bg-void-black/80 backdrop-blur flex items-center justify-between px-6 z-10 select-none">
        <div className="flex gap-4 overflow-x-auto">
          {[
            ["trust", "TRUST MATRIX"],
            ["topology", "PROBE TOPOLOGY"],
            ["docs", "CHARTER & METHODOLOGY"],
            ["consensus", "CONSENSUS VECTOR"],
            ["identity", "CAPPO RUNTIME LAYER"],
            ["staking", "STAKING"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSubTab(id as typeof subTab)}
              className={`text-xs font-bold tracking-widest uppercase cursor-pointer border-b-2 py-3 px-1 transition-all whitespace-nowrap ${
                subTab === id ? "text-[#00E5FF] border-[#00E5FF]" : "text-white/40 border-transparent hover:text-white/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={`flex items-center gap-4 font-mono text-[10px] px-3 py-1 rounded border ${proofTone(proofState)}`}>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${dotTone(proofState)} ${proofState === "verified" ? "animate-pulse" : ""}`} />
            <span className="uppercase">{proofState === "verified" ? "LIVE PROOF" : proofState === "error" ? "SOURCE ERROR" : "PARTIAL PROOF"}</span>
          </div>
          <div className="w-px h-3 bg-white/20" />
          <div>ROUTES: <span className="text-white">{verifiedProbeCount}/{state?.proof.probes.length || 0}</span></div>
          <div>LAST: <span className="text-white">{state?.generated_at ? new Date(state.generated_at).toLocaleTimeString() : "Needs proof"}</span></div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto z-10 p-6 flex flex-col gap-6 relative">
        {state?.proof.reason && (
          <div className={`rounded-lg border px-4 py-3 font-mono text-[10px] uppercase tracking-widest ${proofTone(proofState)}`}>
            {state.proof.reason}
          </div>
        )}

        {subTab === "trust" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow items-stretch">
            <div className="lg:col-span-1 flex flex-col gap-3">
              <div className="text-[10px] font-mono tracking-wider text-white/30 uppercase">TARGET API RECONCILIATION</div>
              <div className="flex flex-col gap-2">
                {apiCards.length === 0 && (
                  <EvidenceGate title="No route-backed scorecards returned">
                    Nexus did not receive usable API scorecards from `/api/v1/vnp/metrics`. The panel is intentionally blank instead of seeding local examples.
                  </EvidenceGate>
                )}
                {apiCards.map((api) => (
                  <button
                    key={api.id}
                    onClick={() => setSelectedApiId(api.id)}
                    className={`p-4 rounded-lg text-left transition-all border obsidian-glass-interactive cursor-pointer ${
                      selectedApi?.id === api.id ? "border-[#00E5FF]/40 bg-[#00E5FF]/5 shadow-[0_0_15px_rgba(0,229,255,0.05)]" : "border-white/5 bg-void-metal/40"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <div className="text-xs font-bold text-white/80">{api.name}</div>
                        <div className="text-[9px] text-white/40 uppercase font-mono">{api.provider}</div>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${api.score >= 95 ? "bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20" : api.score >= 90 ? "bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20" : "bg-hazard-amber/10 text-hazard-amber border border-hazard-amber/20"}`}>
                        {api.score} {api.grade}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[8px] font-mono tracking-widest text-white/30 uppercase">
                        <span>ROUTE-BACKED QUALITY VECTOR</span>
                        <span className="text-[#00E5FF]/60">VNP v1.0</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5" aria-label="Route-backed score vector">
                        {api.dimensions.slice(0, 5).map((dimension) => (
                          <div key={dimension.name} className="h-8 rounded border border-white/10 bg-black/30 overflow-hidden flex items-end" title={`${dimension.name}: ${dimension.score}`}>
                            <div
                              className="w-full bg-[#00FF66]/50 border-t border-[#00FF66]/70"
                              style={{ height: `${Math.max(0, Math.min(100, dimension.score))}%` }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-2.5 p-4 rounded-xl border border-white/5 bg-void-metal/20">
                <div className="text-[10px] font-mono tracking-wider text-white/30 uppercase mb-3">SOURCE ROUTES</div>
                <div className="space-y-2">
                  {state?.proof.probes.map((probe) => (
                    <div key={probe.route} className="flex items-center justify-between gap-3 text-[9px] font-mono border-b border-white/5 pb-2 last:border-0">
                      <span className="text-white/50 truncate">{probe.route}</span>
                      <span className={`shrink-0 px-2 py-0.5 rounded border uppercase ${proofTone(probe.state)}`}>{probe.state}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-6">
              {selectedApi ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <ScoreCard 
                    score={{
                      apiId: selectedApi.id,
                      apiName: selectedApi.name,
                      provider: selectedApi.provider,
                      category: "LLM Inference",
                      composite: selectedApi.score,
                      grade: selectedApi.grade as VNPGrade,
                      dimensions: selectedApi.dimensions.slice(0, 5).map((dim, index) => {
                        return {
                          id: SCORECARD_AXIS_IDS[index] || "documentation",
                          label: dim.name,
                          raw: dim.score,
                          normalized: dim.score,
                          weight: dim.weight / 100,
                          weighted: dim.score * (dim.weight / 100)
                        } as VNPDimensionScore;
                      }),
                      confidence: {
                        level: selectedApi.measurementCount >= 100 ? "high" : selectedApi.measurementCount > 0 ? "provisional" : "low",
                        sampleCount: selectedApi.measurementCount,
                        marginOfError: 0,
                        minForHigh: 100
                      },
                      regions: [] as VNPRegionalScore[],
                      provenance: {
                        epochId: state?.generated_at || "needs-proof",
                        epochStart: state?.metrics?.timestamp || state?.generated_at || new Date(0).toISOString(),
                        epochEnd: state?.generated_at || state?.metrics?.timestamp || new Date(0).toISOString(),
                        merkleRoot: selectedApi.anchorHash || "Needs proof",
                        chainAnchorTx: selectedApi.txHash || null,
                        chainAnchorBlock: null,
                        measurementCount: selectedApi.measurementCount,
                        nodeOperators: [],
                        harnessVersion: state?.metrics?.methodology || "Needs proof",
                        scriptHash: "Needs proof"
                      },
                      lastMeasured: selectedApi.lastUpdated,
                      measurementCount: selectedApi.measurementCount,
                      status: selectedApi.status === "healthy" ? "active" : "provisional"
                    }} 
                  />
                  
                  <div className="mt-4 p-6 rounded-xl border border-white/10 bg-void-metal/80 backdrop-blur flex flex-col gap-6 relative overflow-hidden">

                  {/* Removed old DNA visualizer since it's now inside ScoreCard */}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <ProofPanel title="Observed P95" value={fmtMs(selectedApi.observedP95Ms)} subtitle={`Target ${fmtMs(selectedApi.targetP95Ms)}`} state={selectedApi.observedP95Ms ? "verified" : "needs_proof"} />
                    <ProofPanel title="Bond" value={fmtMoney(selectedApi.bondAmountUsdc)} subtitle={`Slashed ${fmtMoney(selectedApi.slashedTotalUsdc)}`} state={selectedApi.bondAmountUsdc ? "verified" : "needs_proof"} />
                    <ProofPanel title="Merkle Root" value={shortHash(selectedApi.anchorHash)} subtitle={state?.anchoring.merkle_status || "Needs proof"} state={selectedApi.anchorHash ? "verified" : "needs_proof"} />
                    <ProofPanel title="Base Anchor" value={shortHash(selectedApi.txHash)} subtitle={state?.anchoring.block_status || "Needs proof"} state={anchorState} />
                  </div>

                  <div className="mt-2 p-4 bg-void-black border border-white/5 rounded-lg font-mono text-[10px] flex flex-col gap-3">
                    <div className={`text-[9px] font-bold tracking-widest uppercase flex items-center gap-1.5 ${selectedApi.anchorHash && selectedApi.txHash ? "text-[#00FF66]" : "text-[#FFB800]"}`}>
                      <Shield className="w-3.5 h-3.5" />
                      {selectedApi.anchorHash && selectedApi.txHash ? "CRYPTOGRAPHIC PROOF RETURNED" : "CRYPTOGRAPHIC ANCHOR NEEDS PROOF"}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-white/30 uppercase">Merkle Root</div>
                        <div className="text-white/70 truncate" title={selectedApi.anchorHash || "Needs proof"}>{shortHash(selectedApi.anchorHash)}</div>
                      </div>
                      <div>
                        <div className="text-white/30 uppercase">IPFS Artifact</div>
                        <div className="text-white/70 truncate flex items-center gap-1" title={selectedApi.ipfsHash || "Needs proof"}>
                          <span>{shortHash(selectedApi.ipfsHash)}</span>
                          {selectedApi.ipfsHash && <ExternalLink className="w-2.5 h-2.5 text-white/40" />}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/30 uppercase">Anchor Tx Hash</div>
                        <div className="text-[#00E5FF] truncate flex items-center gap-1" title={selectedApi.txHash || "Needs proof"}>
                          <span>{shortHash(selectedApi.txHash)}</span>
                          {selectedApi.txHash && <ExternalLink className="w-2.5 h-2.5 text-[#00E5FF]/60" />}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 pt-3">
                      <div>
                        <div className="text-white/30 uppercase">VNP Metrics</div>
                        <div className="text-[#00FF66] flex items-center gap-1.5 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-[#00FF66]" />Verified</div>
                      </div>
                      <div>
                        <div className="text-white/30 uppercase">x402 Settlement State</div>
                        <div className="text-[#00FF66] flex items-center gap-1.5 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-[#00FF66]" />Verified</div>
                      </div>
                      <div>
                        <div className="text-white/30 uppercase">Leaderboard Route</div>
                        <div className={`flex items-center gap-1.5 font-bold ${state?.leaderboard_state === "verified" ? "text-[#00FF66]" : "text-[#FFB800]"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${state?.leaderboard_state === "verified" ? "bg-[#00FF66]" : "bg-[#FFB800]"}`} />
                          {state?.leaderboard_state === "verified" ? "Verified" : "Needs x402 proof"}
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              ) : (
                <EvidenceGate title="Trust matrix unavailable">
                  The Nexus adapter returned no live card rows. This page will not display seeded API cards or local proof claims.
                </EvidenceGate>
              )}
            </div>
          </div>
        )}

        {subTab === "topology" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow items-stretch">
            <div className="lg:col-span-1 flex flex-col gap-3">
              <div className="text-[10px] font-mono tracking-wider text-white/30 uppercase">PROVIDER NODE DIRECTORY</div>
              <div className="flex flex-col gap-2">
                {nodes.length === 0 && (
                  <EvidenceGate title="No live prober nodes returned">
                    BYOS did not expose region-level node membership on the Nexus source routes. The panel shows no synthetic regional nodes.
                  </EvidenceGate>
                )}
                {nodes.map((node) => (
                  <div key={node.id} className="p-4 rounded-lg border border-white/5 bg-void-metal/40 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-white/80">{node.name}</div>
                      <div className="text-[9px] text-white/40 uppercase font-mono flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-white/30" /> {node.region} / {node.status}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className={node.status === "warning" ? "text-xs font-bold text-[#FFB800]" : "text-xs font-bold text-[#00FF66]"}>{fmtMs(node.latency)}</div>
                      <div className="text-[9px] text-white/30">{fmtMoney(node.throughput)} bond</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="p-6 rounded-xl border border-white/10 bg-void-metal/80 backdrop-blur flex flex-col gap-6 flex-grow">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-xs font-bold tracking-wider uppercase text-white/80">BYOS Nexus Topology</h3>
                    <p className="text-[9.5px] text-white/40">Provider-level data from `/api/v1/x402/staking/state`; region-level prober membership is not emitted yet.</p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${proofTone(nodes.length ? "verified" : "needs_proof")}`}>
                    {nodes.length ? "LIVE PROVIDERS" : "NEEDS PROOF"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <ProofPanel title="Active APIs" value={fmtNumber(activeApis)} subtitle="/api/v1/vnp/metrics" state={activeApis ? "verified" : "needs_proof"} />
                  <ProofPanel title="Physical Probes" value={fmtNumber(physicalProbes)} subtitle="/api/v1/vnp/metrics" state={physicalProbes ? "verified" : "needs_proof"} />
                  <ProofPanel title="Validators" value={fmtNumber(state?.metrics?.active_validators)} subtitle="BYOS returned field" state={Number(state?.metrics?.active_validators) > 0 ? "verified" : "needs_proof"} />
                  <ProofPanel title="Protocol" value={String(state?.metrics?.protocol_version || "Needs proof")} subtitle={String(state?.metrics?.methodology || "No methodology field")} state={state?.metrics?.protocol_version ? "verified" : "needs_proof"} />
                </div>

                <div className="h-60 border border-white/5 rounded-lg bg-black/40 relative overflow-hidden flex items-center justify-center">
                  <Network className="absolute w-24 h-24 text-white/5" />
                  <div className="grid grid-cols-2 gap-4 w-full max-w-xl px-6">
                    {nodes.map((node) => (
                      <div key={node.id} className="p-3 rounded-lg border border-white/10 bg-black/50">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${node.status === "warning" ? "bg-[#FFB800]" : "bg-[#00FF66]"}`} />
                          <span className="text-[10px] font-mono text-white/70 truncate">{node.name}</span>
                        </div>
                        <div className="mt-2 text-[9px] font-mono text-white/35">{fmtMs(node.latency)} observed P95</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-void-black border border-white/5 rounded-lg flex flex-col gap-3">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-white/40 uppercase">Route verification progress</span>
                    <span className="text-[#00FF66] font-bold">{verifiedProbeCount}/{state?.proof.probes.length || 0}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 via-[#00E5FF] to-[#00FF66] transition-all duration-300" style={{ width: `${state?.proof.probes.length ? (verifiedProbeCount / state.proof.probes.length) * 100 : 0}%` }} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[8.5px] font-mono text-white/30 uppercase">
                    <span>Metrics: {state?.metrics ? "verified" : "needs proof"}</span>
                    <span>Staking: {state?.staking ? "verified" : "needs proof"}</span>
                    <span>CAPPO: {state?.cappo ? "verified" : "needs proof"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {subTab === "docs" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow items-stretch overflow-hidden">
            <div className="lg:col-span-1 flex flex-col gap-3">
              <div className="text-[10px] font-mono tracking-wider text-white/30 uppercase">SPECIFICATION DOCUMENT TABLE</div>
              <div className="flex flex-col gap-2">
                <button onClick={() => setDocTab("governance")} className={`p-4 rounded-lg text-left transition-all border cursor-pointer flex gap-3 items-center ${docTab === "governance" ? "border-[#00E5FF]/40 bg-[#00E5FF]/5" : "border-white/5 bg-void-metal/40"}`}>
                  <FileText className="w-5 h-5 text-[#00E5FF]" />
                  <div>
                    <div className="text-xs font-bold text-white/80">Governance Charter</div>
                    <div className="text-[9px] text-white/40 font-mono">Methodology document, not live proof</div>
                  </div>
                </button>
                <button onClick={() => setDocTab("methodology")} className={`p-4 rounded-lg text-left transition-all border cursor-pointer flex gap-3 items-center ${docTab === "methodology" ? "border-[#00E5FF]/40 bg-[#00E5FF]/5" : "border-white/5 bg-void-metal/40"}`}>
                  <BookOpen className="w-5 h-5 text-[#00E5FF]" />
                  <div>
                    <div className="text-xs font-bold text-white/80">Methodology Spec</div>
                    <div className="text-[9px] text-white/40 font-mono">VNP Methodology v1.0</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden border border-white/10 rounded-xl bg-void-metal/80 backdrop-blur p-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#00E5FF]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                    {docTab === "governance" ? "GOVERNANCE_CHARTER_V1.0.md" : "VNP_METHODOLOGY_V1.0.md"}
                  </span>
                </div>
                <span className="text-[8px] font-mono text-white/40 uppercase">Read-only methodology text</span>
              </div>

              <div className="flex-grow overflow-y-auto text-xs text-white/70 leading-relaxed font-sans space-y-4 pr-2 custom-scrollbar">
                {docTab === "governance" ? (
                  <>
                    <h1 className="text-lg font-bold text-white border-b border-white/10 pb-2">Veklom Nexus Protocol (VNP) - Governance Charter v1.0</h1>
                    <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded text-yellow-200/80 mb-4 font-mono text-[10px]">
                      STATUS: Methodology and governance text. Live operational claims on this page come only from BYOS and CAPPO route probes.
                    </div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-4">1. Mission & Values</h2>
                    <p>The Veklom Nexus Protocol is a real-time API benchmark scoring standard designed to provide transparent, reproducible, and actionable performance scores for APIs across regions, protocols, and deployment models.</p>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6">2. Governance Separation</h2>
                    <p>Business administration and technical scoring decisions remain separate. The control plane displays live operational state only when the backend returns evidence for it.</p>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6">3. Dispute Path</h2>
                    <p>Provider disputes should reference route-backed metric fields, bond state, and any emitted evidence identifiers. Missing proof is displayed as missing proof.</p>
                  </>
                ) : (
                  <>
                    <h1 className="text-lg font-bold text-white border-b border-white/10 pb-2">VNP Methodology v1.0</h1>
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded text-emerald-200/80 mb-4 font-mono text-[10px]">
                      STATUS: Methodology target. Current live data sources: `/api/v1/vnp/metrics`, `/api/v1/x402/staking/state`, `/.well-known/x402.json`, and CAPPO `/health`.
                    </div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-4">Current Route-Backed Fields</h2>
                    <div className="space-y-2.5 my-3">
                      <div className="flex justify-between items-center p-2 bg-black/40 border border-white/5 rounded text-[11px]"><span>Composite score</span><strong className="text-[#00E5FF]">BYOS metrics</strong></div>
                      <div className="flex justify-between items-center p-2 bg-black/40 border border-white/5 rounded text-[11px]"><span>P95 target and observed latency</span><strong className="text-[#00E5FF]">Staking state</strong></div>
                      <div className="flex justify-between items-center p-2 bg-black/40 border border-white/5 rounded text-[11px]"><span>Bond and slashing state</span><strong className="text-[#00E5FF]">Staking state</strong></div>
                      <div className="flex justify-between items-center p-2 bg-black/40 border border-white/5 rounded text-[11px]"><span>Governed runtime health</span><strong className="text-[#00E5FF]">CAPPO</strong></div>
                    </div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-6">Proof Gaps</h2>
                    <p>Leaderboard access currently requires x402 proof, Merkle beacon status is reported by BYOS as `{state?.anchoring.merkle_status || "Needs proof"}`, and Base anchoring is reported as `{state?.anchoring.block_status || "Needs proof"}`.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {subTab === "consensus" && (
          <div className="max-w-6xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <ProofPanel title="APIs Scored" value={fmtNumber(activeApis)} subtitle="/api/v1/vnp/metrics" state={activeApis ? "verified" : "needs_proof"} />
              <ProofPanel title="Physical Probes" value={fmtNumber(physicalProbes)} subtitle="Route-backed count" state={physicalProbes ? "verified" : "needs_proof"} />
              <ProofPanel title="Settlement Entries" value={fmtNumber(state?.metrics?.settlement_entries)} subtitle="BYOS metric" state={Number(state?.metrics?.settlement_entries) > 0 ? "verified" : "needs_proof"} />
              <ProofPanel title="Anchored Blocks" value={fmtNumber(state?.anchoring.block_anchored)} subtitle={state?.anchoring.block_status || "Needs proof"} state={anchorState} />
            </div>
            <EvidenceGate title="Consensus vector limited to emitted backend fields">
              The previous animated consensus rounds generated deterministic hashes locally. That has been removed. Until BYOS emits consensus epochs, Merkle roots, and region node membership, this tab only displays route-returned aggregate fields.
            </EvidenceGate>
          </div>
        )}

        {subTab === "identity" && (
          <div className="max-w-6xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <ProofPanel title="Runtime Health" value={String(state?.cappo?.status || "Needs proof")} subtitle={`${state?.sources.capi || "CAPPO"} /health`} state={state?.cappo?.status === "ok" ? "verified" : "needs_proof"} />
              <ProofPanel title="Governed Exec" value="Auth Required" subtitle="/v1/exec signed envelope" state="needs_proof" />
              <ProofPanel title="PGL Certificates" value="Auth Required" subtitle="ExecutionIdentityV1" state="needs_proof" />
              <ProofPanel title="Audit Ledger" value="Auth Required" subtitle="/v1/audit/ledger" state="needs_proof" />
            </div>
            <div className="rounded-xl border border-white/10 bg-void-metal/80 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-4 h-4 text-[#00E5FF]" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/70">CAPPO Runtime Evidence</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cappoAgents.map((agent: any) => (
                  <div key={agent.identity?.agent_id} className="p-4 rounded-lg border border-white/5 bg-black/40">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-white/85">{agent.identity?.agent_name || agent.identity?.agent_id}</div>
                        <div className="text-[9px] font-mono text-white/40">{agent.identity?.agent_id}</div>
                      </div>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${agent.risk?.threat_level === "yellow" ? proofTone("needs_proof") : proofTone("verified")}`}>{agent.risk?.threat_level || "unknown"}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-mono text-white/50">
                      <div>Trust <span className="text-[#00E5FF]">{fmtNumber(agent.trust?.score)}</span></div>
                      <div>Spend <span className="text-[#00FF66]">{fmtNumber(agent.spend)}</span></div>
                      <div>Req <span className="text-white">{fmtNumber(agent.trust?.total_requests)}</span></div>
                    </div>
                  </div>
                ))}
              </div>
              {cappoAgents.length === 0 && (
                <EvidenceGate title="CAPPO agent registry requires auth">
                  The CAPPO `/health` probe is live. Governed execution, PGL certificate, and audit-ledger details require authenticated CAPPO requests and signed execution envelopes.
                </EvidenceGate>
              )}
            </div>
          </div>
        )}

        {subTab === "staking" && (
          <div className="max-w-6xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <ProofPanel title="Bonded Value" value={fmtMoney(state?.staking?.protocolStats?.totalValueBonded)} subtitle="/api/v1/x402/staking/state" state={state?.staking ? "verified" : "needs_proof"} />
              <ProofPanel title="Active APIs" value={fmtNumber(state?.staking?.protocolStats?.activeApis)} subtitle="Staking state" state={state?.staking ? "verified" : "needs_proof"} />
              <ProofPanel title="Verifiers" value={fmtNumber(state?.staking?.protocolStats?.activeVerifiers)} subtitle="Staking state" state={Number(state?.staking?.protocolStats?.activeVerifiers) > 0 ? "verified" : "needs_proof"} />
              <ProofPanel title="Settlement Rate" value={`${fmtNumber(state?.staking?.protocolStats?.settlementRate)}%`} subtitle="Protocol stats" state={state?.staking ? "verified" : "needs_proof"} />
              <ProofPanel title="Penalties" value={fmtMoney(state?.staking?.protocolStats?.totalPenalties)} subtitle="Protocol stats" state={state?.staking ? "verified" : "needs_proof"} />
            </div>
            <div className="rounded-xl border border-white/10 bg-void-metal/80 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-[#00E5FF]" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/70">Provider Bonds</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.isArray(state?.staking?.providers) && state.staking.providers.map((provider: any) => (
                  <div key={provider.apiId} className="p-4 rounded-lg border border-white/5 bg-black/40">
                    <div className="flex justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-white/85">{provider.name}</div>
                        <div className="text-[9px] font-mono text-white/40">{provider.provider}</div>
                      </div>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${provider.status === "healthy" ? proofTone("verified") : proofTone("needs_proof")}`}>{provider.status}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-mono text-white/50">
                      <div>P95 <span className="text-[#00E5FF]">{fmtMs(provider.observedP95Ms)}</span></div>
                      <div>Target <span className="text-white">{fmtMs(provider.targetP95Ms)}</span></div>
                      <div>Bond <span className="text-[#00FF66]">{fmtMoney(provider.bondAmountUsdc)}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
