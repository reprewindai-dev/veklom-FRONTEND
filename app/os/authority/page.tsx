"use client";

import { AlertList } from "@/components/cos/AlertList";
import { KeyAuthorityCard } from "@/components/cos/KeyAuthorityCard";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export default function AuthorityPage() {
  const stage = getStage("authority");
  const data = useStageData("authority", { autoGet: true });
  const firstPayload = asRecord(Object.values(data.payloads)[0]);
  const keyId = firstPayload?.key_id ?? firstPayload?.keyId;
  const role = firstPayload?.role;

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="space-y-4">
        <Pillar title="Work" proof={data.stageProof}>
          {keyId ? (
            <KeyAuthorityCard
              title="Observed authority"
              keyId={String(keyId)}
              role={role ? String(role) : "Role not returned"}
              status={data.stageProof}
            />
          ) : (
            <HonestEmpty title="No authority identity returned" route="GET /api/v1/agents/{id}/certificate" detail="The route has not returned a key identifier for this workspace." />
          )}
        </Pillar>
        <Pillar title="Telemetry" proof={data.stageProof}><AlertList alerts={[]} /></Pillar>
        <Pillar title="Authority" proof={data.stageProof}>
          <HonestEmpty title="Authority details unavailable" route="GET /api/v1/agents" detail="No additional authority fields were observed." />
        </Pillar>
      </div>
      <div className="space-y-4">
        <Pillar title="Evidence" proof={data.stageProof}>
          <HonestEmpty title="Revocation evidence not observed" route="POST /v1/identities/{execution_id}/revoke" detail="A parameterized revocation route requires an execution identity." />
        </Pillar>
        <Pillar title="Drift" proof={data.stageProof}>
          <HonestEmpty title="Drift not measured" route="GET /v1/runs" detail="No authority drift signal was returned." />
        </Pillar>
      </div>
    </SectionShell>
  );
}
