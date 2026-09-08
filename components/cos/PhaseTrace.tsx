import type { ActivityCondition, ActivityKind } from "./VeklomActivityCue";
import { VeklomActivityCue } from "./VeklomActivityCue";

export interface TracePhase {
  id: string;
  name: string;
  status: "complete" | "current" | "pending" | "error";
  duration?: string;
  kind?: ActivityKind;
}

export function PhaseTrace({ phases }: { phases: TracePhase[] }) {
  const getStatusCondition = (status: TracePhase["status"]): ActivityCondition => {
    switch (status) {
      case "complete": return "present";
      case "current": return "active";
      case "error": return "failed";
      default: return "unknown";
    }
  };

  const getLineColor = (status: TracePhase["status"]) => {
    return status === "complete" ? "bg-cos-present" : "bg-cos-border";
  };

  return (
    <div className="flex w-full items-center pb-8 pt-2">
      {phases.map((phase, i) => (
        <div key={phase.id} className="flex flex-1 items-center">
          <div className="relative flex flex-col items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border border-cos-border bg-cos-surface2 shadow-sm transition-all ${phase.status === 'current' ? 'border-cos-accent/50 shadow-[0_0_10px_rgba(0,229,255,0.2)]' : ''}`}>
              <VeklomActivityCue kind={phase.kind ?? "execution"} condition={getStatusCondition(phase.status)} size={18} showCaption={false} />
            </div>
            <span className={`absolute -bottom-6 w-max text-[10px] font-medium uppercase tracking-wider transition-colors ${phase.status === 'current' ? 'text-cos-accent' : phase.status === 'complete' ? 'text-cos-text' : 'text-cos-muted'}`}>
              {phase.name}
            </span>
          </div>
          {i < phases.length - 1 && (
            <div className={`mx-2 h-[2px] flex-1 ${getLineColor(phase.status)} opacity-50 transition-colors`} />
          )}
        </div>
      ))}
    </div>
  );
}
