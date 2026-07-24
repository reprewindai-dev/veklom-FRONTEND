"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal, Fingerprint, Shield, Database, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { VNPScore } from "@/lib/vnp/types";
import { VNP_REGIONS, gradeForScore } from "@/lib/vnp/constants";

interface FeedEntry {
  id: string;
  hash: string;
  region: string;
  apiName: string;
  type: "MEASUREMENT" | "ANCHOR" | "SCORE_UPDATE" | "DISPUTE";
  message: string;
  timestamp: string;
}

function deterministicHash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) - h + input.charCodeAt(i)) | 0;
  }
  let result = "";
  for (let j = 0; j < 4; j++) {
    result += Math.abs(h + j * 7919).toString(16).padStart(8, "0");
  }
  return result.substring(0, 16);
}

interface MeasurementFeedProps {
  scores: VNPScore[];
}

export default function MeasurementFeed({ scores }: MeasurementFeedProps) {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const indexRef = useRef(0);

  // Build feed entries from real score data — deterministic, cycling through scored APIs
  useEffect(() => {
    if (!scores || scores.length === 0) return;
    const measuredScores = scores.filter((score) => score.status !== "unmeasured" && score.grade !== "N/A");
    if (measuredScores.length === 0) return;

    // Seed initial entries from actual score data
    const initial: FeedEntry[] = measuredScores.slice(0, 8).flatMap((score, si) => {
      const entries: FeedEntry[] = [];
      const region = score.regions[si % score.regions.length];
      if (!region) return entries;

      entries.push({
        id: `init-meas-${si}`,
        hash: deterministicHash(score.apiId + region.region),
        region: VNP_REGIONS.find((r) => r.id === region.region)?.shortLabel || region.region,
        apiName: score.apiName,
        type: "MEASUREMENT",
        message: `[${VNP_REGIONS.find((r) => r.id === region.region)?.shortLabel || region.region}] ${score.apiName} — p99: ${region.p99.toFixed(1)}ms, uptime: ${region.availability.toFixed(2)}%`,
        timestamp: score.lastMeasured,
      });

      if (si % 3 === 0) {
        entries.push({
          id: `init-score-${si}`,
          hash: deterministicHash(score.apiId + "score"),
          region: "VNP",
          apiName: score.apiName,
          type: "SCORE_UPDATE",
          message: `[VNP] ${score.apiName} composite: ${score.composite.toFixed(1)} (${score.grade}) — ${score.confidence.level} confidence`,
          timestamp: score.lastMeasured,
        });
      }

      return entries;
    });

    setEntries(initial.reverse());
    indexRef.current = 0;

    // Cycle through real data periodically — each tick shows the next API's real scores
    const interval = setInterval(() => {
      const idx = indexRef.current % measuredScores.length;
      const score = measuredScores[idx];
      const regionIdx = indexRef.current % VNP_REGIONS.length;
      const region = score.regions[regionIdx];
      indexRef.current++;

      if (!region) return;

      const cycleType = indexRef.current % 5;
      let entry: FeedEntry;

      if (cycleType < 3) {
        // Measurement event from real regional data
        entry = {
          id: `feed-${Date.now()}-${indexRef.current}`,
          hash: deterministicHash(score.apiId + region.region + String(indexRef.current)),
          region: VNP_REGIONS.find((r) => r.id === region.region)?.shortLabel || region.region,
          apiName: score.apiName,
          type: "MEASUREMENT",
          message: `[${VNP_REGIONS.find((r) => r.id === region.region)?.shortLabel || region.region}] ${score.apiName} — p99: ${region.p99.toFixed(1)}ms, avail: ${region.availability.toFixed(2)}%, err: ${region.errorRate.toFixed(2)}%`,
          timestamp: new Date().toISOString(),
        };
      } else if (cycleType === 3) {
        // Score update from real composite data
        entry = {
          id: `feed-${Date.now()}-${indexRef.current}`,
          hash: deterministicHash(score.apiId + "composite" + String(indexRef.current)),
          region: "VNP",
          apiName: score.apiName,
          type: "SCORE_UPDATE",
          message: `[VNP] ${score.apiName} — ${score.grade} ${score.composite.toFixed(1)}, ${score.measurementCount.toLocaleString()} measurements, ±${score.confidence.marginOfError.toFixed(1)}`,
          timestamp: new Date().toISOString(),
        };
      } else {
        // Provenance event from real epoch data
        entry = {
          id: `feed-${Date.now()}-${indexRef.current}`,
          hash: score.provenance.merkleRoot.substring(0, 16),
          region: "BASE",
          apiName: score.apiName,
          type: "ANCHOR",
          message: `[Epoch] ${score.provenance.epochId.substring(0, 32)} — root: ${score.provenance.merkleRoot.substring(0, 12)}... (${score.provenance.measurementCount} records)`,
          timestamp: new Date().toISOString(),
        };
      }

      setEntries((prev) => [entry, ...prev].slice(0, 50));
    }, 3000);

    return () => clearInterval(interval);
  }, [scores]);

  const typeStyles: Record<FeedEntry["type"], { bg: string; text: string; border: string }> = {
    MEASUREMENT: { bg: "bg-[#FFB800]/10", text: "text-[#FFB800]", border: "border-[#FFB800]/20" },
    ANCHOR: { bg: "bg-[#37C9EC]/10", text: "text-[#37C9EC]", border: "border-[#37C9EC]/20" },
    SCORE_UPDATE: { bg: "bg-[#3EE7A2]/10", text: "text-[#3EE7A2]", border: "border-[#3EE7A2]/20" },
    DISPUTE: { bg: "bg-[#FF5C6C]/10", text: "text-[#FF5C6C]", border: "border-[#FF5C6C]/20" },
  };

  return (
    <div className="h-full flex flex-col font-mono text-xs">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-[#1A1A1A] bg-[#050505]">
        <Terminal className="w-4 h-4 text-[#FFB800]" />
        <span className="text-[#A1A1A6] font-semibold tracking-widest uppercase text-[10px]">
          VNP Measurement Feed
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#3EE7A2] animate-pulse" />
          <span className="text-[#3EE7A2] tracking-widest text-[10px]">LIVE</span>
        </div>
      </div>

      {/* Proof state banner */}
      <div className="px-3 py-2 bg-[#FFB800]/5 border-b border-[#FFB800]/10 flex items-center gap-2">
        <AlertCircle className="w-3 h-3 text-[#FFB800]" />
        <span className="text-[9px] text-[#FFB800]/80 tracking-wide">
          Feed derived from scored API data. Independent k6 SSE stream: Needs proof
        </span>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#0A0A0A] custom-scrollbar">
        <AnimatePresence>
          {entries.map((entry) => {
            const style = typeStyles[entry.type];
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="group"
              >
                <div className="text-[#6E6E73] opacity-60 mb-0.5 flex items-center gap-1">
                  <Fingerprint className="w-3 h-3" />
                  <span>{entry.hash}...</span>
                </div>
                <div className="flex items-start gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest border shrink-0 ${style.bg} ${style.text} ${style.border}`}
                  >
                    {entry.type.replace("_", " ")}
                  </span>
                  <span className="text-white/80 mt-0.5 leading-relaxed break-all">{entry.message}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {entries.length === 0 && (
          <div className="text-[#6E6E73] text-center mt-10 flex flex-col items-center gap-2">
            <Shield className="w-6 h-6 opacity-30" />
            <span>Awaiting measurement data...</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#1A1A1A] bg-[#050505]">
        <div className="flex justify-between items-center text-[#6E6E73] text-[10px]">
          <span className="flex items-center gap-1.5">
            <Database className="w-3 h-3" />
            <span>Target: Base L2 (eip155:8453)</span>
          </span>
          <span>k6-vnp-0.1.3</span>
        </div>
      </div>
    </div>
  );
}
