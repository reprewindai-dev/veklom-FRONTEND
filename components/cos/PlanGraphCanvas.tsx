"use client";

import type { Edge, Node } from "reactflow";
import GovernCanvas from "./GovernCanvas";
import type { GpcCompileResponse } from "@/lib/cos/gpc";

export function PlanGraphCanvas({ graph }: { graph: NonNullable<GpcCompileResponse["graph"]> }) {
  const nodes: Node[] = graph.nodes.map((node, index) => ({
    id: node.id,
    position: { x: 0, y: index * 140 },
    data: {
      label: node.id,
      node_type: node.type,
      subtitle: [node.description, node.policy_tag].filter(Boolean).join(" · "),
      status: "idle",
    },
  }));
  const edges: Edge[] = graph.edges.map((edge, index) => ({
    id: `${edge.from}-${edge.to}-${index}`,
    source: edge.from,
    target: edge.to,
  }));

  return <GovernCanvas nodes={nodes} edges={edges} />;
}
