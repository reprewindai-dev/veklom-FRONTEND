import { Check, CircleDot, Lock, ShieldX, Clock } from "lucide-react";

/**
 * The Covenant Trace Rail: one governed call moving through the phases that judge it.
 *
 *   IDENTITY → POLICY → SAFETY → COST → APPROVAL → EXECUTION → EVIDENCE → AUDIT → RESPONSE
 *
 * The rail is a projection, never a narrative. A phase is only `passed`, `denied` or
 * `sealed` when a response said so; anything not yet decided stays `pending`, and a
 * phase the backend never reported is `unreported` rather than silently green. A rail
 * that fills itself in would be the most convincing lie this product could tell.
 */

export const COVENANT_PHASES = [
  "IDENTITY",
  "POLICY",
  "SAFETY",
  "COST",
  "APPROVAL",
  "EXECUTION",
  "EVIDENCE",
  "AUDIT",
  "RESPONSE",
] as const;

export type CovenantPhaseName = (typeof COVENANT_PHASES)[number];

export type CovenantPhaseState = "pending" | "passed" | "denied" | "sealed" | "unreported";

export interface CovenantPhase {
  name: CovenantPhaseName;
  state: CovenantPhaseState;
  /** Reason code or verdict returned for this phase. Shown verbatim. */
  detail?: string;
}

const PHASE_PRESENTATION: Record<
  CovenantPhaseState,
  { node: string; label: string; line: string; text: string }
> = {
  passed: {
    node: "border-cos-accent/60 bg-cos-accent/10",
    label: "text-cos-accent",
    line: "bg-cos-accent/50",
    text: "passed",
  },
  sealed: {
    node: "border-cos-identity/60 bg-cos-identity/10",
    label: "text-cos-identity",
    line: "bg-cos-identity/50",
    text: "sealed",
  },
  denied: {
    node: "border-cos-deny/70 bg-cos-deny/10",
    label: "text-cos-deny",
    line: "bg-cos-deny/40",
    text: "denied",
  },
  pending: {
    node: "border-cos-warn/50 bg-cos-warn/5",
    label: "text-cos-warn",
    line: "bg-cos-border",
    text: "pending",
  },
  unreported: {
    node: "border-cos-border bg-cos-surface2",
    label: "text-cos-muted",
    line: "bg-cos-border",
    text: "not reported",
  },
};

function PhaseIcon({ state }: { state: CovenantPhaseState }) {
  switch (state) {
    case "passed":
      return <Check size={13} className="text-cos-accent" />;
    case "sealed":
      return <Lock size={12} className="text-cos-identity" />;
    case "denied":
      return <ShieldX size={13} className="text-cos-deny" />;
    case "pending":
      return <CircleDot size={13} className="text-cos-warn animate-pulse" />;
    default:
      return <Clock size={12} className="text-cos-muted opacity-50" />;
  }
}

/**
 * Once a phase denies, downstream phases did not run. Rendering them as `pending`
 * would imply work still in flight, so they are explicitly `unreported`.
 */
export function sealRailAfterDenial(phases: CovenantPhase[]): CovenantPhase[] {
  const denialIndex = phases.findIndex((phase) => phase.state === "denied");
  if (denialIndex === -1) return phases;
  return phases.map((phase, index) =>
    index > denialIndex ? { ...phase, state: "unreported" as const, detail: undefined } : phase
  );
}

export function CovenantTraceRail({
  phases,
  requestId,
  verdict,
  simulated = false,
}: {
  phases: CovenantPhase[];
  requestId?: string;
  /** The overall verdict as returned. Omitted when no verdict has been reported. */
  verdict?: string;
  simulated?: boolean;
}) {
  const resolved = sealRailAfterDenial(phases);

  return (
    <div className="rounded-lg border border-cos-border bg-cos-panel/80 p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cos-muted">
            Covenant trace
          </span>
          {requestId ? (
            <span className="font-mono text-[11px] text-cos-steel">{requestId}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {simulated ? (
            <span className="rounded border border-cos-warn/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-cos-warn">
              simulated
            </span>
          ) : null}
          {verdict ? (
            <span className="font-mono text-[11px] uppercase tracking-widest text-cos-text">
              {verdict}
            </span>
          ) : (
            <span className="font-mono text-[11px] uppercase tracking-widest text-cos-muted">
              no verdict reported
            </span>
          )}
        </div>
      </div>

      <div className="flex w-full items-start overflow-x-auto pb-1">
        {resolved.map((phase, index) => {
          const presentation = PHASE_PRESENTATION[phase.state];
          return (
            <div key={phase.name} className="flex min-w-0 flex-1 items-center">
              <div className="flex min-w-[76px] flex-col items-center gap-1.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${presentation.node}`}
                >
                  <PhaseIcon state={phase.state} />
                </div>
                <span
                  className={`text-[9px] font-semibold uppercase tracking-[0.12em] ${presentation.label}`}
                >
                  {phase.name}
                </span>
                <span className="font-mono text-[9px] text-cos-muted">{presentation.text}</span>
                {phase.detail ? (
                  <span
                    className={`max-w-[92px] break-words text-center font-mono text-[9px] ${presentation.label}`}
                  >
                    {phase.detail}
                  </span>
                ) : null}
              </div>
              {index < resolved.length - 1 ? (
                <div className={`mx-1 mt-3 h-[2px] flex-1 self-start ${presentation.line}`} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
