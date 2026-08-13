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

  const getRecord = (path: string) => data.records.find((r) => r.path === path);
  
  const certRecord = getRecord("/api/v1/agents/{id}/certificate");
  const certProof = certRecord?.proof ?? "Needs proof";
  const certPayload = certRecord ? asRecord(data.payloads[`${certRecord.method} ${certRecord.path}`]) : undefined;
  
  const lifecycleRecord = getRecord("/api/v1/agents/{id}/lifecycle");
  const lifecycleProof = lifecycleRecord?.proof ?? "Needs proof";
  
  const agentsRecord = getRecord("/api/v1/agents");
  const agentsProof = agentsRecord?.proof ?? "Needs proof";

  const revokeRecord = getRecord("/v1/identities/{execution_id}/revoke");
  const revokeProof = revokeRecord?.proof ?? "Needs proof";

  const runsRecord = getRecord("/v1/runs");
  const runsProof = runsRecord?.proof ?? "Needs proof";

  const firstPayload = asRecord(Object.values(data.payloads)[0]);
  const keyId = certPayload?.key_id ?? certPayload?.keyId ?? firstPayload?.key_id ?? firstPayload?.keyId;
  const role = certPayload?.role ?? firstPayload?.role;

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="space-y-4">
        <Pillar title="Work" proof={certProof}>
          {keyId ? (
            <KeyAuthorityCard
              title="Observed authority"
              keyId={String(keyId)}
              role={role ? String(role) : "Role not returned"}
              status={certProof}
            />
          ) : (
            <HonestEmpty title="No authority identity returned" route="GET /api/v1/agents/{id}/certificate" detail="The route has not returned a key identifier for this workspace." />
          )}
        </Pillar>
        <Pillar title="Telemetry" proof={lifecycleProof}><AlertList alerts={[]} /></Pillar>
        <Pillar title="Authority" proof={agentsProof}>
          <HonestEmpty title="Authority details unavailable" route="GET /api/v1/agents" detail="No additional authority fields were observed." />
        </Pillar>
      </div>
      <div className="space-y-4">
        <Pillar title="Evidence" proof={revokeProof}>
          <HonestEmpty title="Revocation evidence not observed" route="POST /v1/identities/{execution_id}/revoke" detail="A parameterized revocation route requires an execution identity." />
        </Pillar>
        <Pillar title="Drift" proof={runsProof}>
          <HonestEmpty title="Drift not measured" route="GET /v1/runs" detail="No authority drift signal was returned." />
        </Pillar>
      </div>
    </SectionShell>
  );
}
