"use client";

import { useMemo, useState } from "react";
import type { Edge, Node } from "reactflow";
import GovernCanvas from "@/components/cos/GovernCanvas";
import PipelinePropertyPanel from "@/components/cos/PipelinePropertyPanel";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";

function graphFromPayload(payload: unknown): { nodes: Node[]; edges: Edge[] } | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const graph = (payload as { graph?: unknown }).graph;
  if (!graph || typeof graph !== "object") return undefined;
  const { nodes, edges } = graph as { nodes?: unknown; edges?: unknown };
  return Array.isArray(nodes) && Array.isArray(edges)
    ? { nodes: nodes as Node[], edges: edges as Edge[] }
    : undefined;
}

export default function GovernPage() {
  const stage = getStage("govern");
  const data = useStageData("govern");
  const graph = useMemo(() => Object.values(data.payloads).map(graphFromPayload).find(Boolean), [data.payloads]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="space-y-4">
        <Pillar title="Work" proof={data.stageProof}>{graph ? <GovernCanvas nodes={graph.nodes} edges={graph.edges} onNodeClick={(_, node) => setSelectedNode(node)} /> : <HonestEmpty title="No decision graph returned" route="POST /api/v1/execution/authorize" detail="The canvas remains empty until a real governance response supplies nodes and edges." />}</Pillar>
        <Pillar title="Telemetry" proof={data.stageProof}><HonestEmpty title="Governance telemetry is route-backed" route="POST /v1/governance/v2/assess" detail="No seeded confidence or burn values are rendered." /></Pillar>
        <Pillar title="Authority" proof={data.stageProof}><PipelinePropertyPanel selectedNode={selectedNode} /></Pillar>
      </div>
      <div className="space-y-4">
        <Pillar title="Evidence" proof={data.stageProof}><HonestEmpty title="Governance evidence not returned" route="GET /v1/governance/v2/quarantine" detail="No quarantine or assessment evidence is available yet." /></Pillar>
        <Pillar title="Drift" proof={data.stageProof}><HonestEmpty title="Policy drift not measured" route="GET /v1/governance/v2/quarantine" detail="No drift signal was returned." /></Pillar>
      </div>
    </SectionShell>
  );
}
