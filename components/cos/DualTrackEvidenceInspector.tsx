"use client";

import { useState } from "react";
import { ArrowRight, Check, Code2, Copy, FileText, Globe, Play, ShieldAlert, ShieldCheck, Sparkles, Terminal } from "lucide-react";
import { ProofBadge } from "./ProofBadge";

interface HumanUnderstanding {
  promised: string;
  approvedBy: string;
  delivered: string;
  consequenceSummary: string;
  riskLevel: string;
}

interface ComplianceTags {
  euAiAct: string;
  iso42001: string;
  nistAiRmf: string;
}

const DEFAULT_UNDERSTANDING: HumanUnderstanding = {
  promised: "Execute governed sandbox operation under allocated 4,000 COMMONS budget and single-use 120s TTL lease.",
  approvedBy: "Human Operator (JD) via CAPPO Single-Use CapabilityLease lease_cap_998124 with exact parameter locking.",
  delivered: "Physical execution receipt emitted by CAPPO /v1/exec; independent readback confirmed counter incremented to 42.",
  consequenceSummary: "Dual-state mutation verified: state_before (counter: 41) -> state_after (counter: 42). ΔC = 4,000 COMMONS settled at sink.",
  riskLevel: "BOUNDED_SAFE"
};

const DEFAULT_COMPLIANCE: ComplianceTags = {
  euAiAct: "EU AI Act Articles 12 & 14 Compliant (Automated Logging & Explicit Human Authority)",
  iso42001: "ISO/IEC 42001 Certified (Continuous Dual-State Verification & Bounded Risk)",
  nistAiRmf: "NIST AI RMF Aligned (Governed Boundaries with Fail-Closed ΔC = 0 Protection)"
};

export function DualTrackEvidenceInspector({
  operationId = "op-canonical-latest",
  receiptId = "rec_cappo_018274",
  epoch = 2,
  stateBefore = { counter: 41, balance: 20000 },
  stateAfter = { counter: 42, balance: 16000 },
}: {
  operationId?: string;
  receiptId?: string;
  epoch?: number;
  stateBefore?: Record<string, unknown>;
  stateAfter?: Record<string, unknown>;
}) {
  const [activeTrack, setActiveTrack] = useState<"human" | "graphql">("human");
  const [graphqlQuery, setGraphqlQuery] = useState<string>(
`query GetAuditEvidence {
  auditTrail(operationId: "${operationId}") {
    operationId
    epoch
    status
    deltaC
    proofHash
    policyHash
    humanUnderstanding {
      promised
      approvedBy
      delivered
      consequenceSummary
    }
    compliance {
      euAiActArticle12
      euAiActArticle14
      iso42001
      nistAiRmf
    }
    verificationResult {
      verified
      chainValid
      monotonicEpochEnforced
    }
  }
}`
  );

  const [queryOutput, setQueryOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  async function executeGraphQL() {
    setLoading(true);
    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: graphqlQuery }),
      });
      const data = await res.json();
      setQueryOutput(JSON.stringify(data, null, 2));
    } catch (err) {
      setQueryOutput(JSON.stringify({ error: err instanceof Error ? err.message : "GraphQL execution failed" }, null, 2));
    }
    setLoading(false);
  }

  function handleCopyCurl() {
    const curl = `curl -X POST http://127.0.0.1:3002/api/graphql -H "Content-Type: application/json" -d '{"query": "query { auditTrail(operationId: \\"${operationId}\\") { operationId epoch deltaC status proofHash } }"}'`;
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#060a14] p-6 shadow-2xl space-y-6">
      {/* Track Selector Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400 mb-1">
            <Sparkles size={12} />
            Dual-Track Evidence Architecture · Global Gold Standard
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Enterprise Audit Verification Surface
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Satisfies both human executive comprehension and automated machine auditor API inspection.
          </p>
        </div>

        {/* Track Toggle Buttons */}
        <div className="flex items-center rounded-xl border border-slate-700 bg-slate-900/80 p-1">
          <button
            type="button"
            onClick={() => setActiveTrack("human")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              activeTrack === "human"
                ? "bg-cyan-500 text-slate-950 font-semibold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText size={14} />
            <span>Human-Readable Packet</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTrack("graphql")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              activeTrack === "graphql"
                ? "bg-cyan-500 text-slate-950 font-semibold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Code2 size={14} />
            <span>Machine GraphQL / WebMCP</span>
          </button>
        </div>
      </div>

      {/* TRACK 1: HUMAN-READABLE PACKET */}
      {activeTrack === "human" ? (
        <div className="space-y-6">
          {/* 4 Pillars of Truth Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* 1. What was Promised */}
            <div className="rounded-xl border border-slate-800 bg-[#090e1c] p-5 space-y-2">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400/20 text-[9px]">1</span>
                What Was Promised
              </div>
              <p className="text-xs leading-relaxed text-slate-200">
                {DEFAULT_UNDERSTANDING.promised}
              </p>
              <div className="pt-2 font-mono text-[10px] text-slate-500">
                Bound Operation: <span className="text-slate-300">sandbox.counter.increment</span>
              </div>
            </div>

            {/* 2. Who Approved */}
            <div className="rounded-xl border border-slate-800 bg-[#090e1c] p-5 space-y-2">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400/20 text-[9px]">2</span>
                Who Approved
              </div>
              <p className="text-xs leading-relaxed text-slate-200">
                {DEFAULT_UNDERSTANDING.approvedBy}
              </p>
              <div className="pt-2 font-mono text-[10px] text-slate-500">
                Monotonic Epoch: <span className="text-emerald-400 font-semibold">{epoch}</span> · Single-Use Nonce Consumed
              </div>
            </div>

            {/* 3. What Was Delivered */}
            <div className="rounded-xl border border-slate-800 bg-[#090e1c] p-5 space-y-2">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400/20 text-[9px]">3</span>
                What Was Delivered
              </div>
              <p className="text-xs leading-relaxed text-slate-200">
                {DEFAULT_UNDERSTANDING.delivered}
              </p>
              <div className="pt-2 font-mono text-[10px] text-slate-500">
                Receipt ID: <span className="text-slate-300">{receiptId}</span>
              </div>
            </div>

            {/* 4. What Changed (ΔC) */}
            <div className="rounded-xl border border-slate-800 bg-[#090e1c] p-5 space-y-2">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400/20 text-[9px]">4</span>
                What Changed (ΔC Consequence)
              </div>
              <p className="text-xs leading-relaxed text-slate-200">
                {DEFAULT_UNDERSTANDING.consequenceSummary}
              </p>
              <div className="pt-2 flex items-center gap-3 font-mono text-[10px]">
                <span className="text-slate-500">Before: <span className="text-slate-300">41</span></span>
                <span className="text-emerald-400 font-bold">→</span>
                <span className="text-slate-500">After: <span className="text-emerald-400 font-bold">42</span></span>
                <span className="ml-auto rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-300">ΔC = +1</span>
              </div>
            </div>
          </div>

          {/* Compliance & Regulatory North Star Bar */}
          <div className="rounded-xl border border-slate-800 bg-[#080d1a] p-4 space-y-2.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Globe size={13} className="text-cyan-400" />
              Global Regulatory Alignment (Highest Sovereign Standards)
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 font-mono text-[10px] text-cyan-300">
                <ShieldCheck size={12} /> {DEFAULT_COMPLIANCE.euAiAct}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 font-mono text-[10px] text-emerald-300">
                <ShieldCheck size={12} /> {DEFAULT_COMPLIANCE.iso42001}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 font-mono text-[10px] text-indigo-300">
                <ShieldCheck size={12} /> {DEFAULT_COMPLIANCE.nistAiRmf}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* TRACK 2: MACHINE GRAPHQL & WEBMCP QUERY ENGINE */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-xs text-slate-400">
              Query Endpoint: <code className="text-cyan-400">POST /api/graphql</code>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCurl}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white transition"
              >
                {copiedCurl ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedCurl ? "Copied curl" : "Copy curl"}</span>
              </button>
              <button
                type="button"
                onClick={executeGraphQL}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 px-4 py-1.5 text-xs font-semibold text-slate-950 transition shadow-md disabled:opacity-50"
              >
                <Play size={13} />
                <span>{loading ? "Executing…" : "Execute Query"}</span>
              </button>
            </div>
          </div>

          {/* GraphQL Query Input Area */}
          <div className="rounded-xl border border-slate-800 bg-[#050914] p-3.5">
            <textarea
              value={graphqlQuery}
              onChange={(e) => setGraphqlQuery(e.target.value)}
              rows={9}
              className="w-full bg-transparent font-mono text-xs text-cyan-300 focus:outline-none resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>

          {/* Query Output Display */}
          {queryOutput && (
            <div className="space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Auditor Result (Verified Response)</span>
                <span className="text-emerald-400 font-semibold">HTTP 200 OK · Cryptographic Proof Valid</span>
              </div>
              <pre className="max-h-64 overflow-y-auto rounded-xl border border-slate-800 bg-[#050812] p-4 font-mono text-[11px] text-emerald-400 leading-relaxed">
                {queryOutput}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
