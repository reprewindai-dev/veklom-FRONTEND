"use client";

import { useEffect, useState } from "react";
import { PhaseTrace } from "@/components/cos/PhaseTrace";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";

export default function EvidencePage() {
  const stage = getStage("evidence");
  const data = useStageData("evidence", { autoGet: true });
  const [executionId, setExecutionId] = useState<string | null>(null);

  useEffect(() => {
    const id = sessionStorage.getItem("veklom_execution_id");
    if (id) {
      setExecutionId(id);
      
      const ledgerEndpoint = stage.endpoints.find(e => e.path === "/api/v1/ledger/agents/{id}");
      if (ledgerEndpoint) {
        data.call({ ...ledgerEndpoint, path: `/api/v1/ledger/agents/${id}` });
      }
      
      const verifyEndpoint = stage.endpoints.find(e => e.path === "/api/v1/ledger/agents/{id}/verify");
      if (verifyEndpoint) {
        data.call({ ...verifyEndpoint, path: `/api/v1/ledger/agents/${id}/verify` });
      }
    }
  }, [stage.endpoints, data.call]);

  const hasEvidence = Object.keys(data.payloads).length > 0;
  const phaseStatus = data.loading ? "current" : hasEvidence ? "complete" : "pending";

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="space-y-4">
        <Pillar title="Work" proof={data.stageProof}><PhaseTrace phases={[
          { id: "ledger", name: "Ledger", status: phaseStatus },
          { id: "verify", name: "Verify", status: hasEvidence ? "current" : "pending" },
          { id: "replay", name: "Replay", status: "pending" },
        ]} /></Pillar>
        <Pillar title="Telemetry" proof={data.stageProof}><HonestEmpty title="Evidence telemetry is route-backed" route="GET /v1/audit/ledger" detail="Latency and status remain in the route ledger below." /></Pillar>
        <Pillar title="Authority" proof={data.stageProof}>
          {executionId ? (
            <div className="rounded-xl border border-cos-border bg-[#050505] p-5">
              <h3 className="mb-2 text-sm font-semibold text-cos-text">Execution ID Active</h3>
              <p className="font-mono text-xs text-cos-muted break-all">{executionId}</p>
            </div>
          ) : (
            <HonestEmpty title="Evidence authority not returned" route="GET /api/v1/ledger/agents/{id}" detail="An execution identity is required for the parameterized ledger view. Run an execution first." />
          )}
        </Pillar>
      </div>
      <div className="space-y-4">
        <Pillar title="Evidence" proof={data.stageProof}><HonestEmpty title={hasEvidence ? "Evidence payload observed" : "No evidence payload observed"} route="GET /v1/audit/verify" detail={hasEvidence ? "The response is available to the route-backed data layer." : "No verifier result has been returned."} /></Pillar>
        <Pillar title="Drift" proof={data.stageProof}><HonestEmpty title="Evidence drift not measured" route="GET /v1/audit/verify" detail="No comparison result was returned." /></Pillar>
      </div>
    </SectionShell>
  );
}
