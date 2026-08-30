"use client";

import { AlertTriangle, Activity } from "lucide-react";

interface TriageTelemetryProps {
  context: "overview" | "pipelines" | "terminal" | "benchmarks" | "interlink";
}

/**
 * Triage telemetry boundary.
 *
 * The previous component retained Firebase-shaped stubs and generated sample
 * audit hashes after Firebase had been removed. That made a presentation
 * surface look proof-bearing even though no canonical telemetry store backed
 * it. Until the Veklom-native telemetry source is wired, render an explicit
 * unavailable state instead of synthesizing incidents, hashes, or evidence.
 */
export default function TriageTelemetry({ context }: TriageTelemetryProps) {
  return (
    <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-amber-300">
          <AlertTriangle size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-white">Triage telemetry unavailable</h2>
            <span className="rounded border border-white/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-white/40">
              {context}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/55">
            No canonical Veklom telemetry source is connected to this surface. Synthetic incidents,
            generated audit hashes, and Firebase placeholder state are intentionally disabled.
          </p>
          <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-amber-300/80">
            <Activity size={12} />
            NOT YET WIRED — NO PROOF CLAIMED
          </div>
        </div>
      </div>
    </section>
  );
}
