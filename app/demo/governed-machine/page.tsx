"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { StatusPill } from "@/components/ui/SharedUI";

type StepStatus = "idle" | "running" | "done" | "error";
type ResultType = "ALLOW" | "DENY" | "INVALID" | "GOVERNED" | "UNKNOWN" | "OUTCOME_UNKNOWN" | "REPLAY_DENIED";

interface ScenarioDef {
  id: string; // Updated to match API schema (string keys)
  title: string;
  description: string;
  threat: string;
}

const SCENARIOS: ScenarioDef[] = [
  {
    id: "normal_allowed_action",
    title: "Normal Allowed Action",
    description: "Machine requests a bounded action within its capability.",
    threat: "None - baseline authorized path",
  },
  {
    id: "over_authority_attempt",
    title: "Over-Authority Attempt",
    description: "Same machine tries to write outside its read-only capability.",
    threat: "Authority widening - requesting more than granted",
  },
  {
    id: "evidence_tamper_attempt",
    title: "Evidence Tamper Attempt",
    description: "Attacker modifies one byte of the signed COSE receipt.",
    threat: "Tamper - forged evidence",
  },
  {
    id: "race_double_spend_attack",
    title: "Race / Double-Spend Attack",
    description: "Two workers race to consume the same authority token simultaneously.",
    threat: "Race condition - authority overspend",
  },
  {
    id: "unknown_outcome",
    title: "Unknown Outcome",
    description: "Execution begins but the process fails before producing completion proof.",
    threat: "Uncertain outcome - neither success nor failure",
  },
  {
    id: "post_termination_replay",
    title: "Post-Termination Replay",
    description: "Reuse of an old capability handle/token after execution has terminated.",
    threat: "Replay - residual agency after death",
  },
];

function getStatusProps(res: ResultType): "verified" | "danger" | "warn" | "info" | "unknown" {
  if (res === "ALLOW") return "verified";
  if (res === "DENY" || res === "REPLAY_DENIED") return "danger";
  if (res === "INVALID") return "warn";
  if (res === "GOVERNED") return "info";
  return "unknown";
}

function ScenarioCard({ scenario, active, onRun }: { scenario: ScenarioDef; active: boolean; onRun: () => void }) {
  const [status, setStatus] = useState<StepStatus>("idle");
  const [showEvidence, setShowEvidence] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function handleRun() {
    if (status === "running") return;
    setStatus("running");
    setShowEvidence(false);
    setErrorMsg("");
    onRun();

    try {
      const res = await fetch("/api/demo/governed-machine/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario_id: scenario.id })
      });

      if (!res.ok) {
        throw new Error("Failed to execute scenario via API");
      }

      const data = await res.json();
      setRunResult(data);
      setStatus("done");
      setShowEvidence(true);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
      setStatus("error");
    }
  }

  return (
    <div className={`rounded-xl border shadow-sm transition-all ${active ? "border-theme-accent/30 bg-theme-surface2" : "border-theme-border bg-theme-surface"}`}>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded border border-theme-border text-xs font-mono font-bold flex items-center justify-center text-theme-inkDim bg-theme-surface">
              {SCENARIOS.findIndex(s => s.id === scenario.id) + 1}
            </span>
            <h3 className="font-semibold text-theme-ink">{scenario.title}</h3>
          </div>
          {status === "done" && runResult && (
            <StatusPill status={getStatusProps(runResult.decision as ResultType)} label={runResult.decision} />
          )}
        </div>
        <p className="text-theme-inkDim text-sm mb-2">{scenario.description}</p>
        <p className="text-xs font-mono text-theme-warn mb-4">Threat: {scenario.threat}</p>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRun}
            disabled={status === "running"}
            className="px-4 py-1.5 rounded text-xs font-mono font-bold bg-theme-accent/10 border border-theme-accent/30 text-theme-accent hover:bg-theme-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "idle" ? "Run Test" : status === "running" ? "Running..." : "Run Again"}
          </button>
        </div>
        
        {status === "error" && (
          <p className="text-xs text-theme-danger mt-3">{errorMsg}</p>
        )}
      </div>

      {showEvidence && runResult && (
        <div className="border-t border-theme-border p-6 bg-theme-surface2 rounded-b-xl">
          <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
            <div>
              <p className="text-theme-inkDim font-mono font-bold mb-1">Run Source:</p>
              <p className="text-theme-ink font-mono">{runResult.source}</p>
            </div>
            <div>
              <p className="text-theme-inkDim font-mono font-bold mb-1">Classification:</p>
              <StatusPill status="warn" label={runResult.classification} />
            </div>
            <div>
              <p className="text-theme-inkDim font-mono font-bold mb-1">Scenario Run ID:</p>
              <p className="text-theme-ink font-mono">{runResult.scenario_run_id}</p>
            </div>
            <div>
              <p className="text-theme-inkDim font-mono font-bold mb-1">Backend Timestamp:</p>
              <p className="text-theme-ink font-mono">{runResult.backend_timestamp}</p>
            </div>
            <div>
              <p className="text-theme-inkDim font-mono font-bold mb-1">Evidence ID:</p>
              <p className="text-theme-ink font-mono">{runResult.evidence_id !== "none" ? runResult.evidence_id : "No canonical evidence"}</p>
            </div>
          </div>
          
          <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-theme-inkDim mb-3">Consequence / Evidence</h4>
          <pre className="text-[10px] font-mono text-theme-inkDim bg-theme-surface border border-theme-border p-3 rounded mb-4 overflow-x-auto shadow-sm">
            <code>{JSON.stringify(runResult.receipt, null, 2)}</code>
          </pre>
          <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-theme-inkDim mb-1">Explanation</h4>
          <p className="text-sm text-theme-ink">{runResult.explanation}</p>
          
          {runResult.limitations && runResult.limitations.length > 0 && (
            <div className="mt-4 p-3 bg-theme-warn/10 border border-theme-warn/30 rounded">
              <p className="text-xs font-bold text-theme-warn mb-1">Demo Limitations:</p>
              <ul className="list-disc list-inside text-xs text-theme-inkDim">
                {runResult.limitations.map((lim: string, i: number) => <li key={i}>{lim}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GovernedMachineDemo() {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  return (
    <HumanAppShell>
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/demo" className="text-theme-accent hover:underline text-sm font-mono">&larr; Back to Demo Hub</Link>
          </div>
          <div className="flex items-center flex-wrap gap-3 mb-4">
            <StatusPill status="warn" label="Demo Harness Status: SIMULATED — BACKEND DEMO HARNESS" />
          </div>
          <h1 className="text-4xl font-sans font-bold mb-4 text-theme-ink">Governed Machine Attack Vectors</h1>
          <p className="text-theme-inkDim text-lg max-w-2xl mb-4">
            A machine (agent) has been given a capability. Now, try to abuse it.
            Run these scenarios to see how the Veklom independent authority boundary handles each threat.
          </p>
          <p className="text-sm text-theme-warn font-mono bg-theme-warn/10 border border-theme-warn/20 p-3 rounded">
            NOTE: This page calls a real backend API, but currently returns canned logic rather than invoking a live Canonical PGL Evidence cluster. 
          </p>
        </div>

        <div className="space-y-4">
          {SCENARIOS.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              active={activeScenario === scenario.id}
              onRun={() => setActiveScenario(scenario.id)}
            />
          ))}
        </div>
      </main>
    </HumanAppShell>
  );
}
