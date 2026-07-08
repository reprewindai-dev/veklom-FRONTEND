"use client";

import { Activity, ExternalLink, FileCheck } from "lucide-react";
import type { VNPScore } from "@/lib/vnp/types";
import { gradeForScore, VNP_DIMENSIONS } from "@/lib/vnp/constants";
import { VNP_METHODOLOGY_VERSION, VNP_VERIFICATION_STACK_TITLE } from "@/lib/vnp/methodology";
import GradeBadge from "./GradeBadge";
import ConfidenceBadge from "./ConfidenceBadge";
import RegionalBreakdown from "./RegionalBreakdown";
import ProvenanceChain from "./ProvenanceChain";
import Link from "next/link";

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

export default function ScoreCard({ score }: ScoreCardProps) {
  const band = gradeForScore(score.composite);
  const width = 520;
  const height = 140;
  const primaryPath = scorePath(score, width, height);
  const verificationPath = scorePath(score, width, height, true);
  const topWeightedDimensions = [...score.dimensions]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4);
  const hasAnchor = Boolean(score.provenance.chainAnchorTx);

  return (
    <div
      className="bg-[#080909] border border-[#242424] rounded-lg p-5 hover:border-opacity-70 transition-all group relative overflow-hidden"
      style={{ borderColor: `${band.borderColor}` }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.014)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.014)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      {/* Header: Name + Grade */}
      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.18em] text-[#3EE7A2]">
            <FileCheck className="h-3 w-3" />
            <span>{VNP_METHODOLOGY_VERSION}</span>
          </div>
          <Link
            href={`/benchmarks/${score.apiId}`}
            className="text-lg font-semibold text-white hover:text-[#FFC94D] transition-colors truncate block"
          >
            {score.apiName}
          </Link>
          <div className="text-[10px] font-mono text-[#6E6E73] uppercase tracking-widest mt-0.5">
            {score.provider} &middot; {score.category} &middot; API telemetry scorecard
          </div>
        </div>
        <GradeBadge grade={score.grade} composite={score.composite} size="md" />
      </div>

      {/* VNP verification spine indicators */}
      <div className="flex flex-wrap gap-1 mb-4 relative z-10">
        <span className="inline-flex items-center gap-1 rounded bg-[#3EE7A2]/10 border border-[#3EE7A2]/20 px-1.5 py-0.5 text-[7.5px] font-bold font-mono text-[#3EE7A2] uppercase tracking-wider">
          Physical Measurements
        </span>
        <span className="inline-flex items-center gap-1 rounded bg-[#3EE7A2]/10 border border-[#3EE7A2]/20 px-1.5 py-0.5 text-[7.5px] font-bold font-mono text-[#3EE7A2] uppercase tracking-wider">
          Signed Telemetry
        </span>
        <span className="inline-flex items-center gap-1 rounded bg-[#3EE7A2]/10 border border-[#3EE7A2]/20 px-1.5 py-0.5 text-[7.5px] font-bold font-mono text-[#3EE7A2] uppercase tracking-wider">
          Route Beacons
        </span>
        <span className="inline-flex items-center gap-1 rounded bg-[#3EE7A2]/10 border border-[#3EE7A2]/20 px-1.5 py-0.5 text-[7.5px] font-bold font-mono text-[#3EE7A2] uppercase tracking-wider">
          {hasAnchor ? "Base Anchor" : "Merkle Pending Anchor"}
        </span>
      </div>

      {/* UACP-style vector signature */}
      <div className="w-full relative z-10 mb-4">
        <div className="mb-1.5 flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.18em] text-[#6E6E73]">
          <span className="inline-flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-[#37C9EC]" />
            Quality Vector Signature
          </span>
          <span className="text-[#37C9EC]/70">{VNP_VERIFICATION_STACK_TITLE}</span>
        </div>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[150px] w-full rounded-md border border-[#242424] bg-black/35"
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
                <line
                  x1={x}
                  x2={x}
                  y1={y}
                  y2={y + (index % 2 === 0 ? 10 : -10)}
                  stroke={band.color}
                  strokeOpacity={0.65}
                />
                <circle cx={x} cy={y} r="3" fill={band.color} stroke="#06110C" strokeWidth="1.2" />
                <text
                  x={x}
                  y={height - 13}
                  textAnchor="middle"
                  className="fill-[#A1A1A6] text-[9px] font-mono"
                >
                  {def.shortLabel}
                </text>
              </g>
            );
          })}
          <path d={verificationPath} fill="none" stroke="rgba(55,201,236,0.36)" strokeWidth="1.2" />
          <path d={primaryPath} fill="none" stroke={band.color} strokeWidth="1.7" />
        </svg>
      </div>

      {/* Dimension grid — top 4 dimensions */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 relative z-10">
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

      {/* Regional mini-bars */}
      <div className="mb-4 relative z-10">
        <RegionalBreakdown regions={score.regions} compact />
      </div>

      {/* Footer: confidence + provenance + link */}
      <div className="pt-3 border-t border-[#242424] flex items-center justify-between relative z-10">
        <ConfidenceBadge confidence={score.confidence} />
        <ProvenanceChain provenance={score.provenance} compact />
      </div>

      {/* Detail link */}
      <Link
        href={`/benchmarks/${score.apiId}`}
        className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-[#FFB800]/60 hover:text-[#FFB800] uppercase tracking-widest transition-colors relative z-10"
      >
        Full Report <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  );
}
