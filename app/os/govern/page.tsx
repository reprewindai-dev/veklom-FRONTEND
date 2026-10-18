"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Play, ShieldCheck } from "lucide-react";
import type { Edge, Node } from "reactflow";
import GovernCanvas from "@/components/cos/GovernCanvas";
import PipelinePropertyPanel from "@/components/cos/PipelinePropertyPanel";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { JsonPanel } from "@/components/cos/StageParts";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { readSessionCapabilityLease } from "@/lib/cos/lease-session";
import { getToken } from "@/lib/api";

const BLUEPRINT_STORAGE_KEY = "veklom.blueprint.plan.v1";

function graphFromPayload(payload: unknown): { nodes: Node[]; edges: Edge[] } | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const graph = (payload as { graph?: unknown }).graph;
  if (!graph || typeof graph !== "object") return undefined;
  const { nodes, edges } = graph as { nodes?: unknown; edges?: unknown };
  return Array.isArray(nodes) && Array.isArray(edges)
    ? { nodes: nodes as Node[], edges: edges as Edge[] }
    : undefined;
}

function readBlueprintGraphFallback(): { nodes: Node[]; edges: Edge[] } | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.sessionStorage.getItem(BLUEPRINT_STORAGE_KEY);
    if (!raw) return undefined;
    return graphFromPayload(JSON.parse(raw));
  } catch {
    return undefined;
  }
}

export default function GovernPage() {
  const stage = getStage("govern");
  const data = useStageData("govern", { autoGet: true });
  const authorizeEndpoint = stage.endpoints.find((e) => e.path === "/api/v1/execution/authorize") ?? stage.endpoints[0];
  const assessEndpoint = stage.endpoints.find((e) => e.path === "/v1/governance/v2/assess");

  const [lease] = useState(() => readSessionCapabilityLease());
  const [agentId, setAgentId] = useState(() => lease?.mountId ? `mount-holder:${lease.mountId}` : "agent_primary_v1");
  const [capabilityId, setCapabilityId] = useState(() => lease?.packageRef || "cap.counter.increment.v1");
  const [directive, setDirective] = useState("ALLOW");
  const [trustScore, setTrustScore] = useState(92);
  const [blueprintGraph] = useState<{ nodes: Node[]; edges: Edge[] } | undefined>(() => readBlueprintGraphFallback());
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const autoEvaluatedRef = useRef(false);

  const liveGraph = useMemo(
    () => Object.values(data.payloads).map(graphFromPayload).find(Boolean),
    [data.payloads],
  );
  const graph = liveGraph ?? blueprintGraph;

  const authorizePayload = data.payloads["POST /api/v1/execution/authorize"] as Record<string, unknown> | undefined;
  const assessPayload = data.payloads["POST /v1/governance/v2/assess"] as Record<string, unknown> | undefined;
  const quarantinePayload = data.payloads["GET /v1/governance/v2/quarantine"];

  const handleAuthorize = useCallback(async () => {
    await data.call(authorizeEndpoint, {
      agent_id: agentId,
      capability_id: capabilityId,
      directive,
      trust_score: Number(trustScore) || 75.0,
      requests_per_hour: 12.0,
      failure_rate: 0.0,
      time_of_day: 12,
      request: {
        mount_id: lease?.mountId,
        resource: lease?.resource || "counter",
      },
    });
    if (assessEndpoint) {
      void data.call(assessEndpoint, {
        agent_id: agentId,
        action_type: capabilityId,
        target_resource: lease?.resource || "counter",
        trust_score: Number(trustScore) || 75.0,
        requests_per_hour: 12.0,
        failure_rate: 0.0,
        time_of_day: 12,
        context: { directive },
      });
    }
  }, [agentId, assessEndpoint, authorizeEndpoint, capabilityId, data, directive, lease?.mountId, lease?.resource, trustScore]);

  useEffect(() => {
    if (autoEvaluatedRef.current) return;
    if (getToken()) {
      autoEvaluatedRef.current = true;
      void handleAuthorize();
    }
  }, [handleAuthorize]);

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="space-y-4">
        <Pillar title="Work" proof={data.stageProof}>
          <div className="mb-4 space-y-3 rounded-lg border border-cos-border bg-cos-bg/60 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cos-accent">
                <ShieldCheck size={14} /> Pre-Execution Governance & LAW-0 Gate
              </span>
              {authorizePayload?.decision ? (
                <span className="font-mono text-[10px] text-cos-verified">
                  Decision: {String(authorizePayload.decision)} ({String(authorizePayload.lane ?? "standard")})
                </span>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">
                  Principal / Agent ID
                </label>
                <input
                  type="text"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="mt-1 w-full rounded border border-cos-border bg-cos-surface px-3 py-1.5 font-mono text-xs text-cos-text"
                />
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">
                  Capability ID
                </label>
                <input
                  type="text"
                  value={capabilityId}
                  onChange={(e) => setCapabilityId(e.target.value)}
                  className="mt-1 w-full rounded border border-cos-border bg-cos-surface px-3 py-1.5 font-mono text-xs text-cos-text"
                />
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">
                  Directive
                </label>
                <select
                  value={directive}
                  onChange={(e) => setDirective(e.target.value)}
                  className="mt-1 w-full rounded border border-cos-border bg-cos-surface px-3 py-1.5 font-mono text-xs text-cos-text"
                >
                  <option value="ALLOW">ALLOW</option>
                  <option value="DENY">DENY</option>
                </select>
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">
                  Trust Score
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={trustScore}
                  onChange={(e) => setTrustScore(Number(e.target.value))}
                  className="mt-1 w-full rounded border border-cos-border bg-cos-surface px-3 py-1.5 font-mono text-xs text-cos-text"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => void handleAuthorize()}
                disabled={data.loading}
                className="inline-flex items-center gap-2 rounded border border-cos-accent/40 bg-cos-accent/15 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-cos-accent transition hover:bg-cos-accent/25 disabled:opacity-50"
              >
                <Play size={13} />
                {data.loading ? "Evaluating Policy..." : "Evaluate Governance & Authorize"}
              </button>
              <div className="flex items-center gap-4">
                <Link
                  href="/os/authority"
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-cos-text hover:underline"
                >
                  Inspect Authority <ArrowRight size={13} />
                </Link>
                <Link
                  href="/os/execute"
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-cos-verified hover:underline"
                >
                  Continue to Execute <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
          {graph ? (
            <GovernCanvas
              nodes={graph.nodes}
              edges={graph.edges}
              onNodeClick={(_, node) => setSelectedNode(node)}
            />
          ) : (
            <HonestEmpty
              title="No decision graph returned"
              route="POST /api/v1/execution/authorize"
              detail="Click Evaluate Governance & Authorize to render the live governance topology."
            />
          )}
        </Pillar>
        <Pillar title="Telemetry" proof={data.stageProof}>
          {authorizePayload || assessPayload ? (
            <JsonPanel
              value={{
                authorization: authorizePayload
                  ? {
                      decision: authorizePayload.decision,
                      authorization_id: authorizePayload.authorization_id,
                      lane: authorizePayload.lane,
                      decision_hash: authorizePayload.decision_hash,
                      evidence_hash: authorizePayload.evidence_hash,
                      reason: authorizePayload.reason,
                    }
                  : undefined,
                assessment: assessPayload,
              }}
              empty="No governance telemetry returned."
            />
          ) : (
            <HonestEmpty title="Governance telemetry is route-backed" route="POST /v1/governance/v2/assess" detail="No seeded confidence or burn values are rendered." />
          )}
        </Pillar>
        <Pillar title="Authority" proof={data.stageProof}><PipelinePropertyPanel selectedNode={selectedNode} /></Pillar>
      </div>
      <div className="space-y-4">
        <Pillar title="Evidence" proof={data.stageProof}>
          {quarantinePayload || authorizePayload ? (
            <JsonPanel
              value={{
                decision_hash: authorizePayload?.decision_hash,
                evidence_hash: authorizePayload?.evidence_hash,
                quarantine: quarantinePayload,
              }}
              empty="No quarantine or assessment evidence is available yet."
            />
          ) : (
            <HonestEmpty title="Governance evidence not returned" route="GET /v1/governance/v2/quarantine" detail="No quarantine or assessment evidence is available yet." />
          )}
        </Pillar>
        <Pillar title="Drift" proof={data.stageProof}><HonestEmpty title="Policy drift not measured" route="GET /v1/governance/v2/quarantine" detail="No drift signal was returned." /></Pillar>
      </div>
    </SectionShell>
  );
}

