import { WorkspaceScaffold } from "@/components/cos/WorkspaceScaffold";
import { PhaseTrace } from "@/components/cos/PhaseTrace";
import { MetricCard } from "@/components/cos/MetricCard";

export default function ExecutePage() { 
  return (
    <WorkspaceScaffold stage="Execute" title="Execute" description="Observe live execution telemetry and runtime behavior.">
      <div className="flex flex-col gap-8">
        <PhaseTrace phases={[
          { id: "mount", name: "Mount", status: "complete" },
          { id: "govern", name: "Govern", status: "complete" },
          { id: "execute", name: "Execute", status: "pending" },
          { id: "evidence", name: "Evidence", status: "pending" }
        ]} />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard title="Compute Yield" value="0.00" unit="VNK" trend="neutral" trendValue="Awaiting execution" />
          <MetricCard title="Latency" value="--" unit="ms" trend="neutral" trendValue="Awaiting execution" />
          <MetricCard title="Execution State" value="Halted" trend="neutral" trendValue="Requires intent" />
        </div>
      </div>
    </WorkspaceScaffold>
  ); 
}
