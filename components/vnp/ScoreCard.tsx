"use client";

import { Activity, ExternalLink, FileCheck, Shield, BookOpen, Database, Users, Scale, FileText, AlertCircle } from "lucide-react";
import type { VNPScore } from "@/lib/vnp/types";
import { gradeForScore, VNP_DIMENSIONS } from "@/lib/vnp/constants";
import { VNP_METHODOLOGY_VERSION, VNP_VERIFICATION_STACK_TITLE } from "@/lib/vnp/methodology";
import GradeBadge from "./GradeBadge";
import ConfidenceBadge from "./ConfidenceBadge";
import RegionalBreakdown from "./RegionalBreakdown";
import ProvenanceChain from "./ProvenanceChain";
import Link from "next/link";
import { useState } from "react";

interface ScoreCardProps {
  score: VNPScore;
}

function scorePath(score: VNPScore, width: number, height: number, invert = false) {
  const paddingX = 18;
  const usableWidth = width - paddingX * 2;
  const baselineY = height / 2;
  const count = Math.max(VNP_DIMENSIONS.length - 1, 1);

  return VNP_DIMENSIONS.map((def, index) => {
    const dim = score.dimensions.find((d) => d.id === def.id);
    const normalized = dim?.normalized ?? 0;
    const x = paddingX + (index / count) * usableWidth;
    const y = baselineY + (50 - normalized) * 0.38 * (invert ? -0.42 : 1);
    return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

type TabType = 'overview' | 'purpose' | 'data' | 'methodology' | 'risks' | 'ethical';

export default function ScoreCard({ score }: ScoreCardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const band = gradeForScore(score.composite);
  const width = 520;
  const height = 140;
  const primaryPath = scorePath(score, width, height);
  const verificationPath = scorePath(score, width, height, true);
  const topWeightedDimensions = [...score.dimensions]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4);
  const hasAnchor = Boolean(score.provenance.chainAnchorTx);

  const tabs = [
    { id: 'overview', label: 'Benchmark Details', icon: Activity },
    { id: 'purpose', label: 'Purpose & Users', icon: Users },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'methodology', label: 'Methodology', icon: BookOpen },
    { id: 'risks', label: 'Targeted Risks', icon: Shield },
    { id: 'ethical', label: 'Ethical & Legal', icon: Scale },
  ] as const;

  return (
    <div
      className="bg-[#080909] border border-[#242424] rounded-lg p-5 transition-all group relative overflow-hidden flex flex-col"
      style={{ borderColor: `${band.borderColor}` }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.014)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.014)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      {/* Header: Name + Grade */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.18em] text-[#3EE7A2]">
            <FileCheck className="h-3 w-3" />
            <span>BenchmarkCard / {VNP_METHODOLOGY_VERSION}</span>
          </div>
          <Link
            href={`/benchmarks/${score.apiId}`}
            className="text-xl font-bold text-white hover:text-[#FFC94D] transition-colors truncate block"
          >
            {score.apiName}
          </Link>
          <div className="text-[10px] font-mono text-[#6E6E73] uppercase tracking-widest mt-1">
            {score.provider} &middot; {score.category}
          </div>
        </div>
        <div className="flex flex-col items-end">
          <GradeBadge grade={score.grade} composite={score.composite} size="lg" />
          <div className="text-[9px] font-mono text-[#6E6E73] mt-2 uppercase tracking-widest">
            Composite Score
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b border-[#242424] pb-2 mb-4 relative z-10 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md text-[10px] font-mono uppercase tracking-wider transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? "bg-[#242424] text-white border-b-2 border-[#3EE7A2]" 
                : "text-[#6E6E73] hover:text-[#A1A1A6] hover:bg-[#1A1A1A]"
            }`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="relative z-10 flex-1 min-h-[300px]">
        {activeTab === 'overview' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* UACP-style vector signature */}
            <div className="w-full mb-4">
              <div className="mb-1.5 flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.18em] text-[#6E6E73]">
                <span className="inline-flex items-center gap-1.5">
                  <Activity className="h-3 w-3 text-[#37C9EC]" />
                  Quality Vector Signature
                </span>
                <span className="text-[#37C9EC]/70">{VNP_VERIFICATION_STACK_TITLE}</span>
              </div>
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="h-[120px] w-full rounded-md border border-[#242424] bg-black/35"
                preserveAspectRatio="none"
              >
                {[25, 50, 75, 100].map((level) => (
                  <line
                    key={level}
                    x1="14"
                    x2={width - 14}
                    y1={height / 2 + (50 - level) * 0.38}
                    y2={height / 2 + (50 - level) * 0.38}
                    stroke="rgba(255,255,255,0.055)"
                    strokeDasharray="7 9"
                  />
                ))}
                {VNP_DIMENSIONS.map((def, index) => {
                  const dim = score.dimensions.find((d) => d.id === def.id);
                  const normalized = dim?.normalized ?? 0;
                  const count = Math.max(VNP_DIMENSIONS.length - 1, 1);
                  const x = 18 + (index / count) * (width - 36);
                  const y = height / 2 + (50 - normalized) * 0.38;
                  return (
                    <g key={def.id}>
                      <line x1={x} x2={x} y1={24} y2={height - 32} stroke="rgba(255,255,255,0.045)" />
                      <line x1={x} x2={x} y1={y} y2={y + (index % 2 === 0 ? 10 : -10)} stroke={band.color} strokeOpacity={0.65} />
                      <circle cx={x} cy={y} r="3" fill={band.color} stroke="#06110C" strokeWidth="1.2" />
                      <text x={x} y={height - 13} textAnchor="middle" className="fill-[#A1A1A6] text-[9px] font-mono">
                        {def.shortLabel}
                      </text>
                    </g>
                  );
                })}
                <path d={verificationPath} fill="none" stroke="rgba(55,201,236,0.36)" strokeWidth="1.2" />
                <path d={primaryPath} fill="none" stroke={band.color} strokeWidth="1.7" />
              </svg>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-[#111] rounded border border-[#242424]">
                <div className="text-[9px] font-mono text-[#6E6E73] uppercase mb-1">Data Type</div>
                <div className="text-xs text-[#E6E6E9]">API Telemetry & Synthetic Probes</div>
              </div>
              <div className="p-3 bg-[#111] rounded border border-[#242424]">
                <div className="text-[9px] font-mono text-[#6E6E73] uppercase mb-1">Domains</div>
                <div className="text-xs text-[#E6E6E9] truncate">{score.category} Infrastructure</div>
              </div>
            </div>

            {/* Dimension grid — top 4 dimensions */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
              {topWeightedDimensions.map((dim) => (
                <div key={dim.id}>
                  <div className="text-[9px] font-mono text-[#6E6E73] uppercase tracking-wider">
                    {dim.label}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-mono tabular-nums text-[#E6E6E9]">
                      {dim.normalized.toFixed(1)}
                    </span>
                    <span className="text-[9px] text-[#6E6E73]">/ 100</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-2">
              <RegionalBreakdown regions={score.regions} compact />
            </div>
          </div>
        )}

        {activeTab === 'purpose' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
            <div className="bg-[#111] p-4 rounded-lg border border-[#242424]">
              <h3 className="text-xs font-bold text-white mb-2 uppercase tracking-wider">Goal & Audience</h3>
              <p className="text-[11px] text-[#A1A1A6] leading-relaxed mb-4">
                Designed to autonomously benchmark {score.apiName} latency, uptime, and SLA adherence across a distributed edge mesh. Target audience includes network engineers, enterprise SLA administrators, and algorithmic traders.
              </p>
              
              <h3 className="text-xs font-bold text-white mb-2 uppercase tracking-wider">Limitations & Out-of-Scope</h3>
              <p className="text-[11px] text-[#A1A1A6] leading-relaxed">
                Scorecard is strictly quantitative. Does not measure LLM hallucination rates or contextual accuracy unless specifically probed via a designated semantic dimension. Avoid interpreting latency drops as model degradation.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#111] p-3 rounded border border-[#242424]">
                <div className="text-[9px] font-mono text-[#6E6E73] uppercase mb-1">Source</div>
                <div className="text-xs text-white">VNP Edge Node Mesh</div>
              </div>
              <div className="bg-[#111] p-3 rounded border border-[#242424]">
                <div className="text-[9px] font-mono text-[#6E6E73] uppercase mb-1">Size</div>
                <div className="text-xs text-white">10M+ probes/day</div>
              </div>
              <div className="bg-[#111] p-3 rounded border border-[#242424]">
                <div className="text-[9px] font-mono text-[#6E6E73] uppercase mb-1">Format</div>
                <div className="text-xs text-white">Signed JSON Telemetry</div>
              </div>
              <div className="bg-[#111] p-3 rounded border border-[#242424]">
                <div className="text-[9px] font-mono text-[#6E6E73] uppercase mb-1">Annotation</div>
                <div className="text-xs text-white">Cryptographically Attested</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'methodology' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
            <div className="bg-[#111] p-4 rounded-lg border border-[#242424]">
              <div className="space-y-4 text-[11px] text-[#A1A1A6]">
                <div>
                  <strong className="text-white">Methods:</strong> Continuous synthetic health checks dispatched from 8 global regions.
                </div>
                <div>
                  <strong className="text-white">Metrics:</strong> P99 Latency (ms), Uptime (%), Connection Drop Rate.
                </div>
                <div>
                  <strong className="text-white">Validation:</strong> Results are filtered for regional network anomalies using a consensus vector before final score aggregation.
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'risks' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-red-900/10 p-4 rounded-lg border border-red-500/20">
              <h3 className="text-xs font-bold text-red-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Operational Risks Assessed
              </h3>
              <ul className="list-disc list-inside text-[11px] text-[#A1A1A6] space-y-2">
                <li><strong className="text-white">SLA Violations:</strong> Continuous tracking of sub-optimal latency resulting in financial slashing.</li>
                <li><strong className="text-white">Regional Outages:</strong> Single-region degradation masking as global stability.</li>
                <li><strong className="text-white">Data Staleness:</strong> Nodes reporting cached or outdated responses without active processing.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'ethical' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-[#111] p-4 rounded-lg border border-[#242424]">
              <h3 className="text-xs font-bold text-white mb-2 uppercase tracking-wider">Privacy & Licensing</h3>
              <p className="text-[11px] text-[#A1A1A6] leading-relaxed mb-4">
                No user payloads are intercepted. Edge nodes only measure network-level telemetry and protocol handshakes.
              </p>
              <div className="flex items-center gap-2 p-2 bg-[#1A1A1A] rounded border border-[#333]">
                <FileText className="w-4 h-4 text-[#3EE7A2]" />
                <span className="text-[10px] text-white">VNP Open Data License v1.0</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer: confidence + provenance + link */}
      <div className="pt-3 mt-4 border-t border-[#242424] flex flex-col sm:flex-row items-center justify-between relative z-10 gap-3">
        <div className="flex items-center gap-3">
          <ConfidenceBadge confidence={score.confidence} />
          <ProvenanceChain provenance={score.provenance} compact />
        </div>
        <Link
          href={`/benchmarks/${score.apiId}`}
          className="flex items-center gap-1.5 text-[10px] font-mono text-[#FFB800]/60 hover:text-[#FFB800] uppercase tracking-widest transition-colors"
        >
          View Live Feed <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

