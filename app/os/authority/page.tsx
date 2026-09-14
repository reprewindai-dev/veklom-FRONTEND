"use client";

import { AlertList } from "@/components/cos/AlertList";
import { KeyAuthorityCard } from "@/components/cos/KeyAuthorityCard";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { VeklomActivityCue, type ActivityCondition } from "@/components/cos/VeklomActivityCue";

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function identityCondition(value: Record<string, unknown>): ActivityCondition | undefined {
  if (value.revoked === true) return "failed";
  const lifecycle = asRecord(value.lifecycle);
  const raw = value.status ?? value.state ?? lifecycle?.status ?? lifecycle?.state;
  if (typeof raw !== "string") return undefined;
  const normalized = raw.toLowerCase();
  if (["active", "mounted"].includes(normalized)) return "active";
  if (normalized === "suspended") return "degraded";
  if (["revoked", "expired", "terminated", "failed"].includes(normalized)) return "failed";
  if (["issued", "created", "present"].includes(normalized)) return "present";
  return undefined;
}

function identityRows(payloads: Record<string, unknown>): Record<string, unknown>[] {
  return Object.values(payloads).flatMap((payload) => {
    if (Array.isArray(payload)) return payload.filter((item): item is Record<string, unknown> => Boolean(asRecord(item)));
    const record = asRecord(payload);
    if (!record) return [];
    const nested = Array.isArray(record.identities) ? record.identities : Array.isArray(record.agents) ? record.agents : undefined;
    return nested ? nested.filter((item): item is Record<string, unknown> => Boolean(asRecord(item))) : [record];
  });
}

export default function AuthorityPage() {
  const stage = getStage("authority");
  const data = useStageData("authority", { autoGet: true });
  const firstPayload = asRecord(Object.values(data.payloads)[0]);
  const keyId = firstPayload?.key_id ?? firstPayload?.keyId;
  const role = firstPayload?.role;
  const rows = identityRows(data.payloads);

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
          {rows.length ? <div className="space-y-2">{rows.map((row, index) => { const condition = identityCondition(row); const identity = row.execution_id ?? row.agent_id ?? row.certificate_id ?? row.id ?? `identity-${index}`; return <div key={`${String(identity)}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-cos-border bg-cos-bg/35 px-3 py-2"><span className="font-mono text-xs text-cos-text">{String(identity)}</span>{condition ? <VeklomActivityCue kind="authority" condition={condition} size={18} showCaption={false} /> : null}</div>; })}</div> : <HonestEmpty title="Authority details unavailable" route="GET /api/v1/agents" detail="No additional authority fields were observed." />}
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
