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

  const lockerHealthRecord = getRecord("/lockerphycer/health");
  const lockerHealth = asRecord(data.payloads["GET /lockerphycer/health"]);
  const lockerDependenciesRecord = getRecord("/lockerphycer/health/dependencies");
  const lockerDependencies = asRecord(data.payloads["GET /lockerphycer/health/dependencies"]);
  const lockerManifestRecord = getRecord("/lockerphycer/protocol.json");
  const lockerManifest = asRecord(data.payloads["GET /lockerphycer/protocol.json"]);
  const dependencyRows = Array.isArray(lockerDependencies?.dependencies)
    ? lockerDependencies.dependencies.map(asRecord).filter(Boolean)
    : [];
  const capabilityRows = Array.isArray(lockerManifest?.capabilities)
    ? lockerManifest.capabilities.filter((value): value is string => typeof value === "string")
    : [];
  
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
          {lockerHealth ? (
            <KeyAuthorityCard
              title={String(lockerHealth.service ?? "Lockerphycer Security Core")}
              keyId={String(lockerHealth.version ?? "version not returned")}
              role="Security control plane"
              status={lockerHealthRecord?.proof ?? "Needs proof"}
            />
          ) : keyId ? (
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
        <Pillar title="Telemetry" proof={lockerDependenciesRecord?.proof ?? lifecycleProof}>
          <AlertList alerts={dependencyRows.map((dependency, index) => {
            const state = String(dependency?.state ?? "unknown");
            return {
              id: String(dependency?.name ?? index),
              type: state === "healthy" ? "info" : state === "unconfigured" ? "warning" : "critical",
              message: `${String(dependency?.name ?? "dependency")}: ${state}`,
              time: String(dependency?.verification_scope ?? "dependency state returned by Lockerphycer"),
            };
          })} />
        </Pillar>
        <Pillar title="Authority" proof={lockerManifestRecord?.proof ?? agentsProof}>
          {capabilityRows.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {capabilityRows.map((capability) => (
                <div key={capability} className="rounded-lg border border-cos-border bg-cos-surface2 px-3 py-2 font-mono text-xs text-cos-text">
                  {capability}
                </div>
              ))}
            </div>
          ) : (
            <HonestEmpty title="Lockerphycer capability manifest unavailable" route="GET /lockerphycer/protocol.json" detail="No security capabilities are displayed until Lockerphycer returns its live manifest." />
          )}
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
