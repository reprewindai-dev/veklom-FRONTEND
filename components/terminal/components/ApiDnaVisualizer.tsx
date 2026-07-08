"use client";

import React from "react";
import { Award, FileCheck } from "lucide-react";
import { VNP_DIMENSIONS } from "@/lib/vnp/constants";

interface DimensionScore {
  name: string;
  score: number;
  weight: number;
  desc: string;
}

interface ApiDnaVisualizerProps {
  dimensions: DimensionScore[];
  apiName: string;
  apiScore: number;
  apiGrade: string;
  hoveredIndex: number | null;
  setHoveredIndex: (idx: number | null) => void;
}

interface VectorPoint {
  idx: number;
  dim: DimensionScore;
  label: string;
  x: number;
  y: number;
  baselineY: number;
}

function normalizedText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findDimensionFor(defLabel: string, shortLabel: string, dimensions: DimensionScore[], index: number) {
  const normalizedDef = normalizedText(defLabel);
  const normalizedShort = normalizedText(shortLabel);
  const match = dimensions.find((dim) => {
    const name = normalizedText(dim.name);
    return name.includes(normalizedShort) || normalizedDef.includes(name) || name.includes(normalizedDef);
  });

  return match || dimensions[index] || {
    name: defLabel,
    score: 0,
    weight: Math.round((VNP_DIMENSIONS[index]?.weight || 0) * 100),
    desc: VNP_DIMENSIONS[index]?.description || "Canonical VNP dimension awaiting backend score.",
  };
}

function canonicalDimensions(dimensions: DimensionScore[]) {
  return VNP_DIMENSIONS.map((def, index) => ({
    ...findDimensionFor(def.label, def.shortLabel, dimensions, index),
    name: def.label,
    weight: Math.round(def.weight * 100),
    desc: def.description,
    shortLabel: def.shortLabel,
  }));
}

function pointsForVector(dimensions: DimensionScore[], width: number, height: number): VectorPoint[] {
  const lanes = canonicalDimensions(dimensions);
  const paddingX = 22;
  const usableWidth = width - paddingX * 2;
  const baselineY = height / 2;
  const count = Math.max(lanes.length - 1, 1);

  return lanes.map((dim, idx) => {
    const clamped = Math.max(0, Math.min(100, dim.score));
    const x = paddingX + (idx / count) * usableWidth;
    const y = baselineY + (50 - clamped) * 0.44;
    return { idx, dim, label: dim.shortLabel, x, y, baselineY };
  });
}

function pathFromPoints(points: VectorPoint[], offset: number) {
  return points
    .map((point, idx) => `${idx === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${(point.y + offset).toFixed(1)}`)
    .join(" ");
}

export const ApiDnaVisualizer: React.FC<ApiDnaVisualizerProps> = ({
  dimensions,
  apiName,
  apiScore,
  apiGrade,
  hoveredIndex,
  setHoveredIndex,
}) => {
  const width = 420;
  const height = 150;
  const points = pointsForVector(dimensions, width, height);
  const active = hoveredIndex !== null ? points[hoveredIndex]?.dim : null;
  const compositeLine = pathFromPoints(points, 0);
  const verificationLine = pathFromPoints(
    points.map((point, idx) => ({
      ...point,
      y: point.baselineY + (point.y - point.baselineY) * (idx % 2 === 0 ? -0.42 : 0.38),
    })),
    0
  );
  const topDimensions = points
    .map((point) => point.dim)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4);

  return (
    <div className="flex flex-col p-4 bg-[#050505] rounded-lg border border-white/10 relative overflow-hidden select-none w-full h-full min-h-[400px] justify-between">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

      <div className="relative w-full flex items-center justify-between border-b border-white/5 pb-2.5 font-mono text-[10px] tracking-wider text-white/40">
        <div className="flex items-center gap-1.5">
          <FileCheck size={13} className="text-[#00E5FF]" />
          <span className="uppercase">VNP METHODOLOGY SCORECARD</span>
        </div>
        <div className="text-glow-cyan text-[#00E5FF] font-bold">{points.length}-D SEQ</div>
      </div>

      <div className="relative flex-grow flex flex-col justify-center gap-4 py-3 w-full">
        <div>
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[15px] font-bold text-white/85 truncate">{apiName}</div>
              <div className="mt-0.5 text-[9px] font-mono uppercase tracking-[0.18em] text-white/35">
                Canonical API trust vector
              </div>
            </div>
            <div className="shrink-0 rounded border border-[#00FF66]/25 bg-[#00FF66]/10 px-2.5 py-1 text-right font-mono">
              <div className="text-[10px] font-bold text-[#00FF66]">{apiScore} {apiGrade}</div>
              <div className="text-[7px] uppercase tracking-widest text-[#00FF66]/70">Trust Grade</div>
            </div>
          </div>

          <div className="mb-1 flex items-center justify-between text-[8.5px] font-mono uppercase tracking-[0.18em] text-white/30">
            <span>Quality Vector Signature</span>
            <span className="text-[#00E5FF]/70">Locked VNP v0.1</span>
          </div>

          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible rounded border border-white/5 bg-black/45">
          <defs>
            <filter id="vnp-card-glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

            {[25, 50, 75, 100].map((score) => (
              <line
                key={score}
                x1="14"
                x2={width - 14}
                y1={height / 2 + (50 - score) * 0.44}
                y2={height / 2 + (50 - score) * 0.44}
                stroke="rgba(255,255,255,0.045)"
                strokeDasharray="6 8"
              />
            ))}

          {points.map((point) => (
            <g key={`axis-${point.idx}`}>
              <line
                x1={point.x}
                y1={28}
                x2={point.x}
                y2={height - 38}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={0.75}
              />
              <text
                x={point.x}
                y={height - 16}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white/45 text-[9px] font-mono"
              >
                {point.label}
              </text>
            </g>
          ))}

          <path
            d={verificationLine}
            fill="none"
            stroke="rgba(0,229,255,0.38)"
            strokeWidth={1.1}
          />
          <path
            d={compositeLine}
            fill="none"
            stroke="#00FF66"
            strokeWidth={1.6}
            filter="url(#vnp-card-glow)"
          />

          {points.map((point) => {
            const isHovered = hoveredIndex === point.idx;
            return (
              <g
                key={`point-${point.idx}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(point.idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(isHovered ? null : point.idx)}
              >
                {isHovered && (
                  <circle cx={point.x} cy={point.y} r={8} fill="#00E5FF" opacity={0.12} />
                )}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? 4.5 : 3.1}
                  fill={isHovered ? "#FFFFFF" : "#00FF66"}
                  stroke="#06110C"
                  strokeWidth={1.2}
                />
                <line
                  x1={point.x}
                  y1={point.y}
                  x2={point.x}
                  y2={point.y + (point.idx % 2 === 0 ? 11 : -11)}
                  stroke="#00FF66"
                  strokeOpacity={0.65}
                  strokeWidth={1}
                />
              </g>
            );
          })}
        </svg>
        </div>

        {active && (
          <div className="absolute bottom-20 left-4 right-4 bg-void-black/95 border border-white/10 p-3 rounded-lg backdrop-blur shadow-xl font-mono text-[9px] flex flex-col gap-1 transition-all duration-200 z-20">
            <div className="flex justify-between items-center text-[10.5px]">
              <span className="font-bold text-white uppercase">{active.name}</span>
              <span className="font-bold text-[#00E5FF]">{active.score} / 100</span>
            </div>
            <div className="text-white/50 leading-normal">{active.desc}</div>
            <div className="flex justify-between items-center text-[8px] text-white/30 uppercase mt-0.5 pt-1 border-t border-white/5">
              <span>WEIGHT VALUE</span>
              <span className="font-bold text-white/60">{active.weight}% COMPONENT</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {topDimensions.map((dim) => (
            <div key={dim.name} className="rounded border border-white/5 bg-white/[0.025] px-2.5 py-2">
              <div className="text-[8px] font-mono uppercase tracking-wider text-white/30 truncate">{dim.name}</div>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <span className="text-[12px] font-mono font-bold text-white/80">{dim.score.toFixed(1)}</span>
                <span className="text-[8px] font-mono text-[#00E5FF]/70">W {dim.weight}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative w-full grid grid-cols-3 gap-2 border-t border-white/5 pt-2.5">
        <div className="rounded bg-white/[0.03] border border-white/5 px-2 py-1.5">
          <div className="text-[8px] font-mono text-white/30 uppercase">Method</div>
          <div className="text-[9px] font-bold text-[#00E5FF]">VNP v0.1</div>
        </div>
        <div className="rounded bg-white/[0.03] border border-white/5 px-2 py-1.5">
          <div className="text-[8px] font-mono text-white/30 uppercase">Dimensions</div>
          <div className="text-[9px] font-bold text-[#00FF66]">{points.length} canonical</div>
        </div>
        <div className="rounded bg-white/[0.03] border border-white/5 px-2 py-1.5">
          <div className="text-[8px] font-mono text-white/30 uppercase">Target</div>
          <div className="text-[9px] font-bold text-white truncate">{apiName}</div>
        </div>
      </div>
    </div>
  );
};

interface MiniDnaVisualizerProps {
  dimensions: DimensionScore[];
  score: number;
}

export const MiniDnaVisualizer: React.FC<MiniDnaVisualizerProps> = ({ dimensions, score }) => {
  const width = 220;
  const height = 46;
  const points = pointsForVector(dimensions, width, height);
  const compositeLine = pathFromPoints(points, 0);
  const verificationLine = pathFromPoints(
    points.map((point, idx) => ({
      ...point,
      y: point.baselineY + (point.y - point.baselineY) * (idx % 2 === 0 ? -0.42 : 0.38),
    })),
    0
  );

  return (
    <div className="w-full h-9 flex items-center justify-between gap-3 relative overflow-hidden select-none">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
        <line x1="12" x2={width - 12} y1={height / 2} y2={height / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="6 9" />
        <path d={verificationLine} fill="none" stroke="rgba(0,229,255,0.28)" strokeWidth={1} />
        <path d={compositeLine} fill="none" stroke="#00FF66" strokeWidth={1.35} />
        {points.map((point) => (
          <g key={point.idx}>
            <line x1={point.x} y1={point.y} x2={point.x} y2={point.y + (point.idx % 2 === 0 ? 7 : -7)} stroke="#00FF66" strokeOpacity={0.55} />
            <circle cx={point.x} cy={point.y} r={1.7} fill="#00FF66" />
          </g>
        ))}
      </svg>
      <div className="w-14 h-1.5 rounded bg-white/5 overflow-hidden border border-white/5 shrink-0">
        <div className="h-full bg-gradient-to-r from-[#00E5FF] to-[#00FF66]" style={{ width: `${score}%` }} />
      </div>
      <div className="flex items-center gap-1 text-[8px] font-mono text-white/40 uppercase">
        <Award className="w-3 h-3 text-[#00FF66]" />
        <span>{score}</span>
      </div>
    </div>
  );
};
