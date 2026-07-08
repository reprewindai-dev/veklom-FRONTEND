"use client";

import React from "react";
import { Award, FileCheck } from "lucide-react";

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

function axisLabel(name: string) {
  const compact = name
    .replace(/\([^)]*\)/g, "")
    .replace(/&/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!compact) return "Axis";
  const words = compact.split(" ");
  if (words.length === 1) return words[0].slice(0, 10);
  return words
    .map((word) => word[0])
    .join("")
    .slice(0, 8);
}

function pointsForDimensions(dimensions: DimensionScore[], width: number, height: number, radius: number) {
  const cx = width / 2;
  const cy = height / 2 + 8;
  const count = Math.max(dimensions.length, 3);

  return dimensions.map((dim, idx) => {
    const angle = -Math.PI / 2 + (idx / count) * Math.PI * 2;
    const scoreRadius = radius * (0.36 + (Math.max(0, Math.min(100, dim.score)) / 100) * 0.64);
    const outerX = cx + Math.cos(angle) * radius;
    const outerY = cy + Math.sin(angle) * radius;
    const x = cx + Math.cos(angle) * scoreRadius;
    const y = cy + Math.sin(angle) * scoreRadius;

    return {
      idx,
      dim,
      label: axisLabel(dim.name),
      angle,
      x,
      y,
      outerX,
      outerY,
      labelX: cx + Math.cos(angle) * (radius + 24),
      labelY: cy + Math.sin(angle) * (radius + 24),
    };
  });
}

export const ApiDnaVisualizer: React.FC<ApiDnaVisualizerProps> = ({
  dimensions,
  apiName,
  apiScore,
  apiGrade,
  hoveredIndex,
  setHoveredIndex,
}) => {
  const width = 300;
  const height = 330;
  const radius = 112;
  const points = pointsForDimensions(dimensions, width, height, radius);
  const polygon = points.map((point) => `${point.x},${point.y}`).join(" ");
  const gridRings = [0.4, 0.62, 0.84, 1].map((scale) =>
    points
      .map((point) => {
        const x = width / 2 + Math.cos(point.angle) * radius * scale;
        const y = height / 2 + 8 + Math.sin(point.angle) * radius * scale;
        return `${x},${y}`;
      })
      .join(" ")
  );

  const active = hoveredIndex !== null ? dimensions[hoveredIndex] : null;

  return (
    <div className="flex flex-col p-4 bg-black/60 rounded-xl border border-white/5 relative overflow-hidden select-none w-full h-full min-h-[400px] justify-between">
      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#00E5FF]/40" />
      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[#00E5FF]/40" />
      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[#00E5FF]/40" />
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[#00E5FF]/40" />

      <div className="w-full flex items-center justify-between border-b border-white/5 pb-2.5 font-mono text-[10px] tracking-wider text-white/40">
        <div className="flex items-center gap-1.5">
          <FileCheck size={13} className="text-[#00E5FF]" />
          <span className="uppercase">BENCHMARK CARD VECTOR</span>
        </div>
        <div className="text-glow-cyan text-[#00E5FF] font-bold">VNP SCORE VECTOR</div>
      </div>

      <div className="relative flex-grow flex items-center justify-center py-2 w-full">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          <defs>
            <radialGradient id="vnp-card-fill" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#00FF66" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.1" />
            </radialGradient>
            <filter id="vnp-card-glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {gridRings.map((ring, idx) => (
            <polygon
              key={idx}
              points={ring}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={idx === gridRings.length - 1 ? 1.25 : 0.75}
            />
          ))}

          {points.map((point) => (
            <g key={`axis-${point.idx}`}>
              <line
                x1={width / 2}
                y1={height / 2 + 8}
                x2={point.outerX}
                y2={point.outerY}
                stroke="rgba(255,255,255,0.07)"
                strokeWidth={0.75}
              />
              <text
                x={point.labelX}
                y={point.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white/45 text-[9px] font-mono"
              >
                {point.label}
              </text>
            </g>
          ))}

          <polygon
            points={polygon}
            fill="url(#vnp-card-fill)"
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
                  <circle cx={point.x} cy={point.y} r={10} fill="#00E5FF" opacity={0.1} />
                )}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? 5.5 : 3.4}
                  fill={isHovered ? "#FFFFFF" : "#00FF66"}
                  stroke="#06110C"
                  strokeWidth={1.2}
                />
              </g>
            );
          })}

          <g>
            <rect x={width - 84} y={16} width={58} height={25} rx={4} fill="rgba(0,255,102,0.12)" stroke="rgba(0,255,102,0.24)" />
            <text x={width - 55} y={32} textAnchor="middle" className="fill-[#00FF66] text-[10px] font-bold font-mono">
              {apiGrade}
            </text>
            <text x={width - 54} y={64} textAnchor="middle" className="fill-[#00E5FF] text-[30px] font-mono">
              {apiScore}
            </text>
          </g>
        </svg>

        {active && (
          <div className="absolute bottom-4 left-4 right-4 bg-void-black/95 border border-white/10 p-3 rounded-lg backdrop-blur shadow-xl font-mono text-[9px] flex flex-col gap-1 transition-all duration-200 z-20">
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
      </div>

      <div className="w-full grid grid-cols-3 gap-2 border-t border-white/5 pt-2.5">
        <div className="rounded bg-white/[0.03] border border-white/5 px-2 py-1.5">
          <div className="text-[8px] font-mono text-white/30 uppercase">Benchmark</div>
          <div className="text-[9px] font-bold text-white truncate">{apiName}</div>
        </div>
        <div className="rounded bg-white/[0.03] border border-white/5 px-2 py-1.5">
          <div className="text-[8px] font-mono text-white/30 uppercase">Updated</div>
          <div className="text-[9px] font-bold text-[#00FF66]">July 7</div>
        </div>
        <div className="rounded bg-white/[0.03] border border-white/5 px-2 py-1.5">
          <div className="text-[8px] font-mono text-white/30 uppercase">Method</div>
          <div className="text-[9px] font-bold text-[#00E5FF]">VNP</div>
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
  const width = 200;
  const height = 42;
  const points = pointsForDimensions(dimensions, width, height, 17);
  const polygon = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="w-full h-8 flex items-center justify-between gap-3 relative overflow-hidden select-none">
      <svg width="64" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible shrink-0">
        <polygon points={polygon} fill="rgba(0,255,102,0.16)" stroke="#00FF66" strokeWidth={1.2} />
        {points.map((point) => (
          <circle key={point.idx} cx={point.x} cy={point.y} r={1.3} fill="#00E5FF" />
        ))}
      </svg>
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
        <div className="h-full bg-gradient-to-r from-[#00E5FF] to-[#00FF66]" style={{ width: `${score}%` }} />
      </div>
      <div className="flex items-center gap-1 text-[8px] font-mono text-white/40 uppercase">
        <Award className="w-3 h-3 text-[#00FF66]" />
        <span>{score}</span>
      </div>
    </div>
  );
};
