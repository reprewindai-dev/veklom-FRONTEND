"use client";

import { useMemo } from "react";
import type { Edge, Node } from "reactflow";
import GovernCanvas from "./GovernCanvas";
import type { GpcCompileResponse } from "@/lib/cos/gpc";

export function PlanGraphCanvas({ graph }: { graph: NonNullable<GpcCompileResponse["graph"]> }) {
  const { nodes, edges } = useMemo(() => {
    const incoming = new Map<string, string[]>();
    for (const n of graph.nodes) incoming.set(n.id, []);
    for (const e of graph.edges) {
      if (!incoming.has(e.to)) incoming.set(e.to, []);
      incoming.get(e.to)!.push(e.from);
    }

    const rankMemo = new Map<string, number>();
    const computeRank = (id: string, stack = new Set<string>()): number => {
      if (rankMemo.has(id)) return rankMemo.get(id)!;
      if (stack.has(id)) return 0;
      stack.add(id);
      const parents = incoming.get(id) ?? [];
      const rank = parents.length === 0 ? 0 : Math.max(...parents.map((p) => computeRank(p, new Set(stack)) + 1));
      rankMemo.set(id, rank);
      return rank;
    };

    const layers = new Map<number, typeof graph.nodes>();
    for (const node of graph.nodes) {
      const r = computeRank(node.id);
      if (!layers.has(r)) layers.set(r, []);
      layers.get(r)!.push(node);
    }

    const builtNodes: Node[] = [];
    for (const [rank, layerNodes] of layers.entries()) {
      layerNodes.forEach((node, siblingIdx) => {
        const xOffset = (siblingIdx - (layerNodes.length - 1) / 2) * 240;
        builtNodes.push({
          id: node.id,
          position: { x: xOffset, y: rank * 145 },
          data: {
            label: node.id,
            node_type: node.type,
            subtitle: [node.description, node.policy_tag].filter(Boolean).join(" · "),
            policy_tag: node.policy_tag,
            entropy: node.entropy,
            rank,
            status: "idle",
          },
        });
      });
    }

    const builtEdges: Edge[] = graph.edges.map((edge, index) => ({
      id: `${edge.from}-${edge.to}-${index}`,
      source: edge.from,
      target: edge.to,
    }));

    return { nodes: builtNodes, edges: builtEdges };
  }, [graph]);

  return <GovernCanvas nodes={nodes} edges={edges} />;
}
