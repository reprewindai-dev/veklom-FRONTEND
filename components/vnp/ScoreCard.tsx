"use client";

import { Shield, Zap, CheckCircle2, Activity, BarChart3, Clock, CheckCircle } from "lucide-react";
import type { VNPScore } from "@/lib/vnp/types";
import { gradeForScore } from "@/lib/vnp/constants";

interface ScoreCardProps {
  score: VNPScore;
}

function generatePolygonPath(dimensions: number[], width: number, height: number) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 40;
  const numPoints = dimensions.length;

  return dimensions.map((val, index) => {
    const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
    const r = (val / 100) * radius;
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ") + " Z";
}

function isIsoDate(value: string | null | undefined): value is string {
  return Boolean(value && !Number.isNaN(Date.parse(value)));
}

export default function ScoreCard({ score }: ScoreCardProps) {
  const band = gradeForScore(score.composite);
  const axes = score.dimensions.slice(0, 5);
  while (axes.length < 5) {
    axes.push({
      id: "documentation",
      label: "Needs proof",
      raw: 0,
      normalized: 0,
      weight: 0,
      weighted: 0,
    });
  }
  const polygonDimensions = axes.map((dimension) => dimension.normalized);
  const assessedOn = isIsoDate(score.provenance.epochEnd)
    ? new Date(score.provenance.epochEnd).toLocaleString("en-US", { timeZone: "UTC" }) + " UTC"
    : "Needs proof";
  const windowLabel = isIsoDate(score.provenance.epochStart) && isIsoDate(score.provenance.epochEnd)
    ? `${new Date(score.provenance.epochStart).toLocaleTimeString("en-US", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" })} - ${new Date(score.provenance.epochEnd).toLocaleTimeString("en-US", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" })} UTC`
    : "Needs proof";
  const assessmentId = score.provenance.merkleRoot && score.provenance.merkleRoot !== "Needs proof"
    ? score.provenance.merkleRoot
    : score.provenance.chainAnchorTx || "Needs proof";
  const dataSources = score.provenance.nodeOperators.length > 0
    ? String(score.provenance.nodeOperators.length)
    : "Needs proof";
  const telemetryPoints = score.measurementCount > 0
    ? score.measurementCount.toLocaleString()
    : "Needs proof";

  const width = 400;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = height / 2 - 40;

  const dataPath = generatePolygonPath(polygonDimensions, width, height);

  return (
    <div className="bg-[#080B09] border border-[#1E2C22] rounded-xl p-6 relative overflow-hidden flex flex-col font-sans text-white max-w-[650px] mx-auto w-full">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(62,231,162,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(62,231,162,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-2 text-[#3EE7A2] font-mono text-[10px] font-semibold tracking-widest">
          <Shield className="w-3.5 h-3.5" />
          <span>VNP Methodology v1.0</span>
        </div>
        <div className="text-[9px] font-mono border border-[#1E2C22] bg-[#0C120E] text-[#3EE7A2] px-3 py-1 rounded tracking-widest">
          SCORECARD
        </div>
      </div>

      {/* Title & Grade Row */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-white mb-1 tracking-tight">{score.apiName}</h2>
          <p className="text-xs text-[#A1A1A6] mb-6">API Trust Benchmark Scorecard</p>
          
          <div className="text-[9px] text-[#A1A1A6] uppercase tracking-wider font-semibold mb-1">
            OVERALL SCORE
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-bold text-[#3EE7A2] tracking-tighter">
              {score.composite.toFixed(1)}
            </span>
            <span className="text-lg text-[#3EE7A2]/60">/100</span>
          </div>
        </div>

        <div className="flex flex-col items-end text-right">
          <div className="border border-[#1E2C22] bg-[#0C120E] rounded-lg p-3 flex flex-col items-center justify-center min-w-[90px] mb-4">
            <span className="text-4xl font-bold text-[#3EE7A2] leading-none mb-1">{band.grade}</span>
            <span className="text-[9px] font-mono text-[#3EE7A2] uppercase tracking-wider">TRUST GRADE</span>
          </div>

          <div className="space-y-1.5 text-[9px] font-mono">
            <div className="flex flex-col items-end">
              <span className="text-[#6E6E73] mb-0.5">ASSESSMENT ID</span>
              <span className="text-[#A1A1A6] tracking-wider truncate max-w-[120px]" title={assessmentId}>
                {assessmentId.length > 18 ? assessmentId.substring(0, 12) + "..." : assessmentId}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[#6E6E73] mb-0.5">ASSESSED ON</span>
              <span className="text-[#A1A1A6]">{assessedOn}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[#6E6E73] mb-0.5">ASSESSMENT TYPE</span>
              <span className="text-[#A1A1A6]">{score.confidence.level === "high" ? "Route-backed evaluation" : "Partial proof evaluation"}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[#6E6E73] mb-0.5">FRAMEWORK</span>
              <span className="text-[#A1A1A6]">{score.provenance.harnessVersion || "VNP v1.0"}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[#6E6E73] mb-0.5">EVIDENCE STATE</span>
              <span className="text-[#A1A1A6]">{score.status === "active" ? "Live" : "Needs proof"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Radar Chart Center */}
      <div className="flex-1 flex items-center justify-center relative z-10 py-4 min-h-[350px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[350px] h-auto overflow-visible">
          <defs>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(62,231,162,0.15)" />
              <stop offset="100%" stopColor="rgba(62,231,162,0)" />
            </radialGradient>
          </defs>
          
          {/* Axis Web */}
          {[1, 0.75, 0.5, 0.25].map((scale, i) => (
            <polygon
              key={i}
              points={generatePolygonPath([100, 100, 100, 100, 100].map(v => v * scale), width, height)}
              fill="none"
              stroke="rgba(62,231,162,0.15)"
              strokeWidth="1"
            />
          ))}

          {/* Axis Spoke Lines */}
          {[0, 1, 2, 3, 4].map((index) => {
            const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
            return (
              <line
                key={index}
                x1={centerX}
                y1={centerY}
                x2={centerX + Math.cos(angle) * maxRadius}
                y2={centerY + Math.sin(angle) * maxRadius}
                stroke="rgba(62,231,162,0.2)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Value Path */}
          <polygon
            points={dataPath}
            fill="url(#glow)"
            stroke="#3EE7A2"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Value Points */}
          {polygonDimensions.map((val, index) => {
            const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
            const r = (val / 100) * maxRadius;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            return (
              <circle
                key={`point-${index}`}
                cx={x}
                cy={y}
                r="4"
                fill="#0C120E"
                stroke="#3EE7A2"
                strokeWidth="2"
              />
            );
          })}

          {/* Scale Labels */}
          <text x={centerX} y={centerY - maxRadius + 12} fill="#A1A1A6" fontSize="9" textAnchor="middle">100</text>
          <text x={centerX} y={centerY - maxRadius * 0.75 + 12} fill="#A1A1A6" fontSize="9" textAnchor="middle">75</text>
          <text x={centerX} y={centerY - maxRadius * 0.5 + 12} fill="#A1A1A6" fontSize="9" textAnchor="middle">50</text>
          <text x={centerX} y={centerY - maxRadius * 0.25 + 12} fill="#A1A1A6" fontSize="9" textAnchor="middle">25</text>
          <text x={centerX} y={centerY + 3} fill="#A1A1A6" fontSize="9" textAnchor="middle">0</text>
        </svg>

        {/* Absolute positioned labels for dimensions */}
        <div className="absolute top-[8%] left-[50%] -translate-x-1/2 flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-[10px] text-white tracking-wider mb-1">
            <Shield className="w-3 h-3 text-[#3EE7A2]" /> {axes[0].label}
          </div>
          <div className="text-[#3EE7A2] font-mono text-sm leading-none">{polygonDimensions[0]?.toFixed(0)}</div>
        </div>

        <div className="absolute top-[35%] right-[5%] flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-[10px] text-white tracking-wider mb-1">
            <CheckCircle2 className="w-3 h-3 text-[#3EE7A2]" /> {axes[1].label}
          </div>
          <div className="text-[#3EE7A2] font-mono text-sm leading-none">{polygonDimensions[1]?.toFixed(0)}</div>
        </div>

        <div className="absolute bottom-[5%] right-[15%] flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-[10px] text-white tracking-wider mb-1">
            <Zap className="w-3 h-3 text-[#3EE7A2]" /> {axes[2].label}
          </div>
          <div className="text-[#3EE7A2] font-mono text-sm leading-none">{polygonDimensions[2]?.toFixed(0)}</div>
        </div>

        <div className="absolute bottom-[5%] left-[15%] flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-[10px] text-white tracking-wider mb-1">
            <Activity className="w-3 h-3 text-[#3EE7A2]" /> {axes[3].label}
          </div>
          <div className="text-[#3EE7A2] font-mono text-sm leading-none">{polygonDimensions[3]?.toFixed(0)}</div>
        </div>

        <div className="absolute top-[35%] left-[5%] flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-[10px] text-white tracking-wider mb-1">
            <Shield className="w-3 h-3 text-[#3EE7A2]" /> {axes[4].label}
          </div>
          <div className="text-[#3EE7A2] font-mono text-sm leading-none">{polygonDimensions[4]?.toFixed(0)}</div>
        </div>
      </div>

      {/* Footer Grid */}
      <div className="grid grid-cols-4 mt-6 pt-5 border-t border-[#1E2C22] relative z-10">
        <div className="flex items-start gap-2">
          <BarChart3 className="w-4 h-4 text-[#3EE7A2] mt-0.5" />
          <div>
            <div className="text-[7px] font-mono text-[#6E6E73] uppercase tracking-widest mb-1">DATA SOURCES</div>
            <div className="text-white font-mono text-xs">{dataSources}</div>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <Activity className="w-4 h-4 text-[#3EE7A2] mt-0.5" />
          <div>
            <div className="text-[7px] font-mono text-[#6E6E73] uppercase tracking-widest mb-1">TELEMETRY POINTS</div>
            <div className="text-white font-mono text-xs">{telemetryPoints}</div>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <Clock className="w-4 h-4 text-[#3EE7A2] mt-0.5" />
          <div>
            <div className="text-[7px] font-mono text-[#6E6E73] uppercase tracking-widest mb-1">EVALUATION WINDOW</div>
            <div className="text-white font-mono text-xs">{windowLabel}</div>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-[#3EE7A2] mt-0.5" />
          <div>
            <div className="text-[7px] font-mono text-[#6E6E73] uppercase tracking-widest mb-1">CONFIDENCE</div>
            <div className="text-white font-bold text-xs tracking-wide">{score.confidence.level}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
