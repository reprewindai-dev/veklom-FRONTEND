"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Scale,
  Shield,
  Globe,
  Database,
  Fingerprint,
  AlertTriangle,
  FileText,
  Lock,
  Activity,
} from "lucide-react";
import { VNP_DIMENSIONS, VNP_REGIONS, VNP_GRADE_BANDS, CONFIDENCE_THRESHOLDS, NORMALIZATION } from "@/lib/vnp/constants";
import type { VNPDimensionId } from "@/lib/vnp/types";

export default function MethodologyPanel() {
  const [expandedSection, setExpandedSection] = useState<string | null>("dimensions");

  const toggle = (id: string) =>
    setExpandedSection((prev) => (prev === id ? null : id));

  return (
    <div className="max-w-5xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-lg bg-[#FFB800]/10">
          <BookOpen className="w-5 h-5 text-[#FFB800]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">VNP Methodology v0.1</h2>
          <p className="text-[11px] text-[#6E6E73]">
            Locked specification — 10 dimensions, asymmetric weighting, cryptographic provenance
          </p>
        </div>
        <span className="ml-auto px-2 py-0.5 rounded border text-[9px] font-mono font-bold uppercase tracking-widest bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/30">
          v0.1.0
        </span>
      </div>

      {/* Product Principles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Open Methodology", desc: "Published weights, formulas, thresholds", icon: BookOpen },
          { label: "Reproducible", desc: "Any party can verify from raw data", icon: Scale },
          { label: "Tail-Latency First", desc: "p99 weighted highest — outliers break agents", icon: Activity },
          { label: "Anti-Gaming", desc: "Randomized timing, multi-node validation", icon: Shield },
        ].map((p) => (
          <div key={p.label} className="p-3 rounded-lg border border-[#242424] bg-[#0D0D0D]">
            <p.icon className="w-4 h-4 text-[#FFB800] mb-2" />
            <div className="text-[11px] font-semibold text-white">{p.label}</div>
            <div className="text-[10px] text-[#6E6E73] mt-0.5">{p.desc}</div>
          </div>
        ))}
      </div>

      {/* Expandable Sections */}
      <Section
        id="dimensions"
        label="10-Dimension Scoring Model"
        icon={Scale}
        expanded={expandedSection === "dimensions"}
        onToggle={() => toggle("dimensions")}
      >
        <div className="space-y-2">
          <p className="text-[11px] text-[#A1A1A6] mb-3">
            Each API is measured across 10 dimensions with asymmetric weights summing to 1.0.
            Direction-aware normalization maps raw measurements to 0–100 scores.
          </p>
          <div className="space-y-1.5">
            {VNP_DIMENSIONS.map((dim) => {
              const norm = NORMALIZATION[dim.id as VNPDimensionId];
              return (
                <div key={dim.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] hover:border-[#333] transition-colors">
                  <div className="col-span-4">
                    <div className="text-[11px] text-white font-medium">{dim.label}</div>
                    <div className="text-[9px] text-[#6E6E73]">{dim.description}</div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="text-[10px] font-mono text-[#FFB800] font-bold">
                      {(dim.weight * 100).toFixed(0)}%
                    </div>
                    <div className="text-[8px] text-[#6E6E73]">weight</div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="text-[10px] font-mono text-[#A1A1A6]">
                      {dim.direction === "lower" ? "↓ lower better" : "↑ higher better"}
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="text-[10px] font-mono text-[#3EE7A2]">
                      {dim.direction === "lower" ? `≤${norm.ideal}${dim.unit}` : `≥${norm.ideal}${dim.unit}`}
                    </div>
                    <div className="text-[8px] text-[#6E6E73]">ideal</div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="text-[10px] font-mono text-[#FF5C6C]">
                      {dim.direction === "lower" ? `≥${norm.poor}${dim.unit}` : `≤${norm.poor}${dim.unit}`}
                    </div>
                    <div className="text-[8px] text-[#6E6E73]">poor</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A]">
            <div className="text-[10px] font-mono text-[#6E6E73]">
              Composite = Σ(normalized_i × weight_i) for i in [1..10] — Weight sum validated at module load: 1.000
            </div>
          </div>
        </div>
      </Section>

      <Section
        id="grading"
        label="Grade Bands (AAA → D)"
        icon={Shield}
        expanded={expandedSection === "grading"}
        onToggle={() => toggle("grading")}
      >
        <div className="grid grid-cols-5 gap-2">
          {VNP_GRADE_BANDS.map((band) => (
            <div
              key={band.grade}
              className="p-3 rounded-lg border text-center"
              style={{
                borderColor: band.borderColor,
                backgroundColor: band.bgColor,
              }}
            >
              <div className="text-lg font-mono font-bold" style={{ color: band.color }}>
                {band.grade}
              </div>
              <div className="text-[10px] font-mono text-[#A1A1A6]">
                ≥ {band.min}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="confidence"
        label="Confidence Intervals"
        icon={Activity}
        expanded={expandedSection === "confidence"}
        onToggle={() => toggle("confidence")}
      >
        <div className="space-y-3">
          <p className="text-[11px] text-[#A1A1A6]">
            95% confidence intervals computed using 1.96 × σ / √n on the composite score distribution.
          </p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { level: "HIGH", min: CONFIDENCE_THRESHOLDS.high, color: "#3EE7A2" },
              { level: "MEDIUM", min: CONFIDENCE_THRESHOLDS.medium, color: "#FFB800" },
              { level: "LOW", min: CONFIDENCE_THRESHOLDS.low, color: "#FF9F43" },
              { level: "PROVISIONAL", min: 0, color: "#FF5C6C" },
            ].map((t) => (
              <div key={t.level} className="p-3 rounded-lg border border-[#242424] bg-[#0A0A0A]">
                <span className="text-[10px] font-mono font-bold tracking-widest" style={{ color: t.color }}>
                  {t.level}
                </span>
                <div className="text-[10px] text-[#6E6E73] mt-1">
                  ≥ {t.min} measurements
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section
        id="regions"
        label="5-Region Measurement Network"
        icon={Globe}
        expanded={expandedSection === "regions"}
        onToggle={() => toggle("regions")}
      >
        <div className="space-y-2">
          <p className="text-[11px] text-[#A1A1A6] mb-3">
            Geographic normalization subtracts baseline RTT to isolate API-layer performance from network distance.
          </p>
          {VNP_REGIONS.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A]">
              <Globe className="w-4 h-4 text-[#37C9EC] shrink-0" />
              <div className="flex-1">
                <div className="text-[11px] text-white font-medium">{r.label}</div>
                <div className="text-[10px] font-mono text-[#6E6E73]">{r.id}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-mono text-[#A1A1A6]">
                  {r.baselineRttMs}ms baseline
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="provenance"
        label="Cryptographic Provenance"
        icon={Lock}
        expanded={expandedSection === "provenance"}
        onToggle={() => toggle("provenance")}
      >
        <div className="space-y-3">
          <p className="text-[11px] text-[#A1A1A6]">
            Every scoring epoch produces a Merkle root of all measurement records, anchored on Base L2 as an append-only registry.
          </p>
          <div className="space-y-2">
            {[
              { step: "1", label: "Measurement Collection", desc: "k6 agents emit signed measurement records from 5 regions" },
              { step: "2", label: "Validation Pipeline", desc: "Signature verification, schema validation, outlier detection" },
              { step: "3", label: "Merkle Construction", desc: "SHA-256 tree from all valid measurements in the scoring window" },
              { step: "4", label: "Score Computation", desc: "10-dimension normalization, weighting, confidence intervals" },
              { step: "5", label: "Chain Anchoring", desc: "Merkle root + score hash published to Base L2 (EIP-155:8453)" },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3 p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A]">
                <div className="w-6 h-6 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/30 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-mono font-bold text-[#FFB800]">{s.step}</span>
                </div>
                <div>
                  <div className="text-[11px] text-white font-medium">{s.label}</div>
                  <div className="text-[10px] text-[#6E6E73]">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section
        id="openapi"
        label="OpenAPI x-vnp-score Extension"
        icon={FileText}
        expanded={expandedSection === "openapi"}
        onToggle={() => toggle("openapi")}
      >
        <div className="space-y-3">
          <p className="text-[11px] text-[#A1A1A6]">
            API providers can publish VNP metadata directly in their OpenAPI documents via vendor extensions.
          </p>
          <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] font-mono text-[11px]">
            <div className="text-[#6E6E73] mb-2"># OpenAPI 3.1 info-level placement</div>
            <div className="space-y-0.5">
              <div><span className="text-[#A1A1A6]">x-vnp-score:</span> <span className="text-[#3EE7A2]">87.4</span></div>
              <div><span className="text-[#A1A1A6]">x-vnp-last-measured:</span> <span className="text-[#FFC94D]">&quot;2026-06-22T14:30:00Z&quot;</span></div>
              <div><span className="text-[#A1A1A6]">x-vnp-score-uri:</span> <span className="text-[#37C9EC]">&quot;https://control.veklom.com/api/vnp/score/&lt;apiId&gt;&quot;</span></div>
              <div><span className="text-[#A1A1A6]">x-vnp-score-window:</span> <span className="text-[#FFC94D]">&quot;30d-rolling&quot;</span></div>
              <div><span className="text-[#A1A1A6]">x-vnp-x402-ready:</span> <span className="text-[#3EE7A2]">true</span></div>
              <div><span className="text-[#A1A1A6]">x-vnp-confidence-interval:</span></div>
              <div className="pl-4"><span className="text-[#A1A1A6]">lower:</span> <span className="text-[#3EE7A2]">86.2</span></div>
              <div className="pl-4"><span className="text-[#A1A1A6]">upper:</span> <span className="text-[#3EE7A2]">88.6</span></div>
              <div className="pl-4"><span className="text-[#A1A1A6]">level:</span> <span className="text-[#3EE7A2]">0.95</span></div>
            </div>
          </div>
          <div className="text-[10px] text-[#6E6E73]">
            Extensions may appear at document root, path-item level, or operation level.
            Consumers should prefer the score registry API where freshness matters.
          </div>
        </div>
      </Section>

      <Section
        id="anchoring"
        label="Base L2 Anchor Contract (IVNPAnchorRegistry)"
        icon={Database}
        expanded={expandedSection === "anchoring"}
        onToggle={() => toggle("anchoring")}
      >
        <div className="space-y-3">
          <p className="text-[11px] text-[#A1A1A6]">
            Minimal append-only registry on Base (EIP-155:8453). No score calculation on-chain — only Merkle root anchoring.
          </p>
          <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] font-mono text-[11px]">
            <div className="text-[#6E6E73] mb-2">{"// Solidity Interface"}</div>
            <div className="space-y-0.5">
              <div className="text-[#A78BFA]">function</div>
              <div className="pl-2 text-[#FFB800]">publishAnchor(</div>
              <div className="pl-4 text-[#A1A1A6]">uint256 windowStart,</div>
              <div className="pl-4 text-[#A1A1A6]">uint256 windowEnd,</div>
              <div className="pl-4 text-[#A1A1A6]">bytes32 merkleRoot,</div>
              <div className="pl-4 text-[#A1A1A6]">bytes32 metadataHash,</div>
              <div className="pl-4 text-[#A1A1A6]">bytes32 scoreHash</div>
              <div className="pl-2 text-[#FFB800]">) → uint256 anchorId</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="p-2 rounded border border-[#1A1A1A] bg-[#0A0A0A]">
              <div className="text-[#3EE7A2] font-mono font-bold">No Deletion</div>
              <div className="text-[#6E6E73]">Anchors are immutable</div>
            </div>
            <div className="p-2 rounded border border-[#1A1A1A] bg-[#0A0A0A]">
              <div className="text-[#3EE7A2] font-mono font-bold">Minimal Gas</div>
              <div className="text-[#6E6E73]">Append-only writes</div>
            </div>
            <div className="p-2 rounded border border-[#1A1A1A] bg-[#0A0A0A]">
              <div className="text-[#3EE7A2] font-mono font-bold">Public Reads</div>
              <div className="text-[#6E6E73]">Anyone can verify</div>
            </div>
          </div>
        </div>
      </Section>

      <Section
        id="disputes"
        label="Dispute Resolution Process"
        icon={AlertTriangle}
        expanded={expandedSection === "disputes"}
        onToggle={() => toggle("disputes")}
      >
        <div className="space-y-3">
          <p className="text-[11px] text-[#A1A1A6]">
            Three-tier dispute process — automated re-measurement, independent review, TSC arbitration.
          </p>
          <div className="space-y-2">
            {[
              { tier: "Tier 1 — Automated", desc: "On dispute, fresh measurements from N nodes. Auto-resolve if within threshold.", color: "#FFB800" },
              { tier: "Tier 2 — Independent Review", desc: "Human review of measurement methodology and edge cases.", color: "#37C9EC" },
              { tier: "Tier 3 — TSC Arbitration", desc: "Technical Steering Committee formal ruling. Decision is final and recorded on-chain.", color: "#A78BFA" },
            ].map((t) => (
              <div key={t.tier} className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A]">
                <div className="text-[11px] font-semibold" style={{ color: t.color }}>{t.tier}</div>
                <div className="text-[10px] text-[#6E6E73] mt-0.5">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({
  id,
  label,
  icon: Icon,
  expanded,
  onToggle,
  children,
}: {
  id: string;
  label: string;
  icon: React.ElementType;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#0D0D0D] border border-[#242424] rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 hover:bg-[#111111] transition-colors text-left"
      >
        <div className="p-1.5 rounded-lg bg-[#FFB800]/10">
          <Icon className="w-4 h-4 text-[#FFB800]" />
        </div>
        <span className="text-sm font-semibold text-white flex-1">{label}</span>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-[#6E6E73]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[#6E6E73]" />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
