"use client";

import { Fingerprint, Link as LinkIcon, Database, Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import type { VNPProvenance } from "@/lib/vnp/types";

interface ProvenanceChainProps {
  provenance: VNPProvenance;
  compact?: boolean;
}

function truncHash(hash: string, len = 12): string {
  if (hash.length <= len * 2 + 3) return hash;
  return hash.substring(0, len) + "..." + hash.substring(hash.length - 6);
}

function ProofState({ state, label }: { state: "verified" | "present" | "needs_proof" | "not_started"; label: string }) {
  const styles = {
    verified: { color: "#3EE7A2", bg: "rgba(62,231,162,0.1)", border: "rgba(62,231,162,0.25)", icon: CheckCircle2 },
    present: { color: "#FFB800", bg: "rgba(255,184,0,0.1)", border: "rgba(255,184,0,0.25)", icon: CheckCircle2 },
    needs_proof: { color: "#FF9F43", bg: "rgba(255,159,67,0.1)", border: "rgba(255,159,67,0.25)", icon: AlertCircle },
    not_started: { color: "#6E6E73", bg: "rgba(110,110,115,0.1)", border: "rgba(110,110,115,0.25)", icon: AlertCircle },
  };
  const s = styles[state];
  const Icon = s.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[8px] font-mono font-bold uppercase tracking-widest"
      style={{ color: s.color, backgroundColor: s.bg, borderColor: s.border }}
    >
      <Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

export default function ProvenanceChain({ provenance, compact = false }: ProvenanceChainProps) {
  const hasAnchor = provenance.chainAnchorTx !== null && provenance.chainAnchorTx !== "";
  const baseScanUrl = hasAnchor
    ? `https://basescan.org/tx/${provenance.chainAnchorTx}`
    : null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[10px] font-mono text-[#6E6E73]">
        <Fingerprint className="w-3 h-3 text-[#FFB800]/50" />
        <span title={provenance.merkleRoot}>{truncHash(provenance.merkleRoot, 8)}</span>
        {hasAnchor ? (
          <a
            href={baseScanUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FFB800]/60 hover:text-[#FFB800] transition-colors"
          >
            <LinkIcon className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-[#6E6E73]">No anchor</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 rounded-xl border border-[#242424] bg-[#0A0A0A]/80">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-[#FFB800]" />
        <span className="text-xs font-semibold uppercase tracking-widest text-[#A1A1A6]">
          Cryptographic Provenance
        </span>
      </div>

      {/* Proof-state summary */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-[#1A1A1A] bg-[#0D0D0D]">
        <span className="text-[10px] text-[#6E6E73] mr-1">Proof States:</span>
        <ProofState state="present" label="Merkle Root" />
        <ProofState state="present" label="Epoch Window" />
        <ProofState state="present" label="Node Operators" />
        <ProofState state={hasAnchor ? "verified" : "not_started"} label="Base L2 Anchor" />
        <ProofState state="needs_proof" label="Independent k6 Nodes" />
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        <Row label="Epoch" value={provenance.epochId} />
        <Row
          label="Window"
          value={`${new Date(provenance.epochStart).toLocaleTimeString()} — ${new Date(provenance.epochEnd).toLocaleTimeString()}`}
        />

        {/* Merkle root */}
        <div className="flex items-start gap-2 py-1.5 border-b border-[#242424]/50">
          <span className="text-[11px] text-[#6E6E73] w-28 shrink-0">Merkle Root</span>
          <div className="flex items-center gap-2 min-w-0">
            <Fingerprint className="w-3 h-3 text-[#FFB800] shrink-0" />
            <code className="text-[11px] text-[#FFC94D] font-mono break-all">
              {provenance.merkleRoot}
            </code>
          </div>
        </div>

        {/* Chain anchor — honest state */}
        <div className="flex items-start gap-2 py-1.5 border-b border-[#242424]/50">
          <span className="text-[11px] text-[#6E6E73] w-28 shrink-0">Base L2 Anchor</span>
          <div className="flex items-center gap-2 min-w-0">
            <Database className="w-3 h-3 text-[#37C9EC] shrink-0" />
            {hasAnchor ? (
              <>
                <a
                  href={baseScanUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#37C9EC] font-mono break-all hover:text-[#7fdcf0] transition-colors"
                >
                  {truncHash(provenance.chainAnchorTx || "", 16)}
                </a>
                {provenance.chainAnchorBlock && (
                  <span className="text-[10px] text-[#6E6E73] font-mono">
                    Block #{provenance.chainAnchorBlock.toLocaleString()}
                  </span>
                )}
              </>
            ) : (
              <span className="text-[11px] text-[#6E6E73] font-mono italic">
                Not started — IVNPAnchorRegistry contract pending deployment on Base (eip155:8453)
              </span>
            )}
          </div>
        </div>

        <Row label="Measurements" value={provenance.measurementCount.toLocaleString()} />
        <Row label="Node Operators" value={provenance.nodeOperators.join(", ")} />
        <Row label="Harness" value={provenance.harnessVersion} />
        <Row label="Script Hash" value={truncHash(provenance.scriptHash, 16)} mono />
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-[#242424]/50 last:border-0">
      <span className="text-[11px] text-[#6E6E73]">{label}</span>
      <span className={`text-[11px] text-[#E6E6E9] text-right ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
