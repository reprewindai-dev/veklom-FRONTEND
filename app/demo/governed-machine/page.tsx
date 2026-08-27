"use client";
import React, { useState } from "react";
import Link from "next/link";

type StepStatus = "idle" | "running" | "done";
type ResultType = "ALLOW" | "DENY" | "INVALID" | "GOVERNED" | "UNKNOWN" | "REPLAY_DENIED";

interface Scenario {
  id: number;
  title: string;
  description: string;
  threat: string;
  result: ResultType;
  evidence: string;
  explanation: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: "Normal Allowed Action",
    description: "Machine requests a bounded action within its capability.",
    threat: "None — baseline authorized path",
    result: "ALLOW",
    evidence: '{"decision":"ALLOW","execution_id":"exec_a1b2c3","action":"contact.read","resource":"/contacts/123","biscuit_verified":true,"evidence_produced":true}',
    explanation: "Identity verified. Capability token valid. Policy allows this action. Budget not exceeded. ALLOW issued. Signed COSE evidence produced.",
  },
  {
    id: 2,
    title: "Over-Authority Attempt",
    description: "Same machine tries to write outside its read-only capability.",
    threat: "Authority widening — requesting more than granted",
    result: "DENY",
    evidence: '{"decision":"DENY","reason":"ACTION_NOT_IN_CAPABILITY","action":"contact.delete","authorized_actions":["contact.read"],"consequence_produced":false}',
    explanation: "Token does not grant contact.delete. DENY before any consequence. Denial evidence produced. No side effect occurred.",
  },
  {
    id: 3,
    title: "Evidence Tamper Attempt",
    description: "Attacker modifies one byte of the signed COSE receipt.",
    threat: "Tamper — forged evidence",
    result: "INVALID",
    evidence: '{"verification":"INVALID","error":"SIGNATURE_MISMATCH","tampered_field":"execution_id","original_verified":true,"tampered_verified":false}',
    explanation: "Ed25519 signature over the COSE_Sign1 envelope fails. The verifier catches the tamper. This is verifiable offline — no network needed.",
  },
  {
    id: 4,
    title: "Race / Double-Spend Attack",
    description: "Two workers race to consume the same authority token simultaneously.",
    threat: "Race condition — authority overspend",
    result: "GOVERNED",
    evidence: '{"worker_a":"ALLOW — consumed token","worker_b":"DENY — token already consumed","duplicate_consequence":false,"governed_path_held":true}',
    explanation: "Veklom's governed path uses atomic token consumption. Worker B's attempt is denied after Worker A commits. No duplicate consequence.",
  },
  {
    id: 5,
    title: "Unknown Outcome",
    description: "Execution begins but the process fails before producing completion proof.",
    threat: "Uncertain outcome — neither success nor failure",
    result: "UNKNOWN",
    evidence: '{"decision":"ALLOW","execution_id":"exec_d4e5f6","outcome":"OUTCOME_UNKNOWN","reason":"PROCESS_FAILED_BEFORE_PROOF","fake_success_claimed":false}',
    explanation: "Veklom never claims success without evidence. OUTCOME_UNKNOWN is the honest state. No fake success. No fake failure. The boundary is clear.",
  },
  {
    id: 6,
    title: "Post-Termination Replay",
    description: "Reuse of an old capability handle/token after execution has terminated.",
    threat: "Replay — residual agency after death",
    result: "REPLAY_DENIED",
    evidence: '{"decision":"DENY","reason":"TOKEN_REPLAY_EXPIRED","mount_status":"TERMINATED","replay_attempt":true,"residual_agency":false}',
    explanation: "The capability mount is in TERMINATED state. The old handle carries zero authority. No consequence possible. Denial evidence produced.",
  },
];

const RESULT_STYLES: Record<ResultType, string> = {
  ALLOW: "text-emerald-400 border-emerald-400/40 bg-emerald-400/5",
  DENY: "text-red-400 border-red-400/40 bg-red-400/5",
  INVALID: "text-amber-400 border-amber-400/40 bg-amber-400/5",
  GOVERNED: "text-[#00E5FF] border-[#00E5FF]/40 bg-[#00E5FF]/5",
  UNKNOWN: "text-gray-400 border-gray-400/40 bg-gray-400/5",
  REPLAY_DENIED: "text-red-400 border-red-400/40 bg-red-400/5",
};

function ScenarioCard({ scenario, active, onRun }: { scenario: Scenario; active: boolean; onRun: () => void }) {
  const [status, setStatus] = useState<StepStatus>("idle");
  const [showEvidence, setShowEvidence] = useState(false);

  async function handleRun() {
    if (status === "running") return;
    setStatus("running");
    onRun();
    await new Promise((r) => setTimeout(r, 900));
    setStatus("done");
    setShowEvidence(true);
  }

  return (
    <div className={`rounded-xl border transition-all ${active ? "border-[#00E5FF]/30 bg-[#0D1220]" : "border-white/10 bg-[#111827]"}`}>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-bold flex items-center justify-center text-white/50">
              {scenario.id}
            </span>
            <h3 className="font-semibold">{scenario.title}</h3>
          </div>
          {status === "done" && (
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${RESULT_STYLES[scenario.result]}`}>
              {scenario.result}
            </span>
          )}
        </div>
        <p className="text-[#8A9BB0] text-sm mb-2">{scenario.description}</p>
        <p className="text-xs font-mono text-amber-400/60 mb-4">Threat: {scenario.threat}</p>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRun}
            disabled={status === "running"}
            className="px-4 py-1.5 rounded text-xs font-mono font-bold bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] hover:bg-[#00E5FF]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "idle" ? "▶ Run" : status === "running" ? "Running…" : "↺ Re-run"}
          </button>
          <span className="text-[10px] font-mono text-amber-400/50">SIMULATED — DEMO HARNESS</span>
        </div>

        {status === "done" && (
          <div className="mt-4 space-y-3">
            <div className="p-3 rounded bg-[#0A0E1A] border border-white/5">
              <p className="text-xs text-[#8A9BB0] mb-2 font-mono">Explanation</p>
              <p className="text-sm text-white/80">{scenario.explanation}</p>
            </div>
            {showEvidence && (
              <div className="p-3 rounded bg-black border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-white/30">EVIDENCE OUTPUT (SIMULATED)</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(scenario.evidence)}
                    className="text-[10px] font-mono text-[#00E5FF]/50 hover:text-[#00E5FF] transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <pre className="text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(JSON.parse(scenario.evidence), null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GovernedMachineDemo() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm font-mono">
            <Link href="/" className="text-[#00E5FF] hover:opacity-80">VEKLOM</Link>
            <span className="text-white/30">/</span>
            <Link href="/demo" className="text-white/50 hover:text-white/80">DEMO</Link>
            <span className="text-white/30">/</span>
            <span className="text-white/60">GOVERNED MACHINE</span>
          </div>
          <span className="text-[10px] font-mono text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded">
            SIMULATED — DEMO HARNESS
          </span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-3">Governed Machine Demo</h1>
          <p className="text-[#8A9BB0] text-lg max-w-2xl">
            One capability. Six attacks. Veklom shows what was allowed, what was blocked, what happened,
            what is proven, and what remains unknown.
          </p>
        </div>

        <div className="mb-8 p-4 rounded-lg border border-amber-400/20 bg-amber-400/5">
          <p className="text-xs font-mono text-amber-400/80">
            ⚠ ALL SCENARIOS BELOW ARE SIMULATED. Evidence outputs are generated by the demo harness,
            not by the live production backend. Canonical production evidence lives at{" "}
            <Link href="/proof" className="underline hover:text-amber-400">
              /proof
            </Link>.
          </p>
        </div>

        <div className="space-y-4">
          {SCENARIOS.map((s) => (
            <ScenarioCard
              key={s.id}
              scenario={s}
              active={activeStep === s.id}
              onRun={() => setActiveStep(s.id)}
            />
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {["No consequence beyond authority", "No truth claim beyond evidence", "No residual agency after termination"].map((principle) => (
            <div key={principle} className="p-4 rounded-lg border border-white/10 bg-[#111827]">
              <p className="text-sm font-mono text-[#00E5FF]/80">{principle}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href="/proof"
            className="px-5 py-2.5 rounded-lg border border-emerald-400/30 text-emerald-400 text-sm font-mono hover:bg-emerald-400/5 transition-colors text-center"
          >
            View Canonical Evidence →
          </Link>
          <Link
            href="/conformance"
            className="px-5 py-2.5 rounded-lg border border-white/10 text-white/50 text-sm font-mono hover:border-white/20 hover:text-white/70 transition-colors text-center"
          >
            Conformance Registry →
          </Link>
        </div>
      </main>
    </div>
  );
}
