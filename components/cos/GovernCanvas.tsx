'use client';

import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';

interface GovernCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  isExecuting?: boolean;
}

// Custom Node for COS styling
const CosGovernNode = React.memo(({ data, selected, isConnectable }: any) => {
  const statusColors: any = {
    idle: 'bg-cos-surface border-cos-border text-cos-text',
    running: 'bg-cos-accent/10 border-cos-accent shadow-[0_0_15px_rgba(0,229,255,0.2)] text-cos-accent animate-pulse',
    success: 'bg-cos-verified/10 border-cos-verified text-cos-verified',
    failure: 'bg-cos-danger/10 border-cos-danger text-cos-danger',
  };

  const statusColor = statusColors[data.status || 'idle'];

  return (
    <div className={`px-4 py-3 rounded-lg border-2 transition-all min-w-[160px] text-center ${statusColor} ${selected ? 'border-cos-present shadow-xl scale-105' : ''}`}>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!bg-cos-muted" />
      <div className="text-xs font-black uppercase tracking-wider mb-1">
        {data.label}
      </div>
      {data.subtitle ? (
        <div className="mb-1 text-[9px] leading-4 opacity-80">
          {data.subtitle}
        </div>
      ) : null}
      <div className="text-[9px] font-mono opacity-70 tracking-widest uppercase">
        {data.node_type}
        {typeof data.entropy === 'number' ? ` · H=${data.entropy.toFixed(2)}` : ''}
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!bg-cos-muted" />
    </div>
  );
});

CosGovernNode.displayName = 'CosGovernNode';

export default function GovernCanvas({ nodes, edges, onNodeClick, isExecuting }: GovernCanvasProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const nodeTypes = useMemo(() => ({ custom: CosGovernNode }), []);

  const { rfNodes, rfEdges } = useMemo(() => {
    const normalizedEdges: Edge[] = (edges || []).map((e: any, index: number) => {
      const source = String(e.source ?? e.from ?? '');
      const target = String(e.target ?? e.to ?? '');
      return {
        ...e,
        id: e.id || `${source || 'edge'}-${target || index}-${index}`,
        source,
        target,
        animated: Boolean(isExecuting || e.animated),
        style: { stroke: isExecuting ? 'rgb(var(--theme-accent))' : 'var(--theme-border)', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isExecuting ? 'rgb(var(--theme-accent))' : 'var(--theme-border)',
        },
      };
    });

    const indegree = new Map<string, number>();
    const outgoing = new Map<string, string[]>();
    for (const n of nodes || []) {
      indegree.set(n.id, 0);
      outgoing.set(n.id, []);
    }
    for (const e of normalizedEdges) {
      if (outgoing.has(e.source) && indegree.has(e.target)) {
        outgoing.get(e.source)!.push(e.target);
        indegree.set(e.target, (indegree.get(e.target) ?? 0) + 1);
      }
    }

    const rankById = new Map<string, number>();
    const queue: string[] = [];
    for (const [id, deg] of indegree.entries()) {
      if (deg === 0) {
        rankById.set(id, 0);
        queue.push(id);
      }
    }
    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentRank = rankById.get(current) ?? 0;
      for (const next of outgoing.get(current) ?? []) {
        const nextRank = Math.max(rankById.get(next) ?? 0, currentRank + 1);
        rankById.set(next, nextRank);
        const remaining = (indegree.get(next) ?? 1) - 1;
        indegree.set(next, remaining);
        if (remaining === 0) queue.push(next);
      }
    }

    const rankBuckets = new Map<number, number>();
    const rankIndices = new Map<string, number>();
    (nodes || []).forEach((n, idx) => {
      const r = rankById.get(n.id) ?? idx;
      rankById.set(n.id, r);
      const posInRank = rankBuckets.get(r) ?? 0;
      rankIndices.set(n.id, posInRank);
      rankBuckets.set(r, posInRank + 1);
    });

    const normalizedNodes: Node[] = (nodes || []).map((n: any, idx: number) => {
      const rank = rankById.get(n.id) ?? idx;
      const countInRank = rankBuckets.get(rank) ?? 1;
      const indexInRank = rankIndices.get(n.id) ?? 0;
      const xOffset = (indexInRank - (countInRank - 1) / 2) * 250;
      const hasValidPosition =
        n.position && typeof n.position.x === 'number' && typeof n.position.y === 'number';
      const existingData = n.data && typeof n.data === 'object' ? n.data : {};
      const label = existingData.label || n.description || n.id;
      const subtitle = existingData.subtitle ?? (n.description ? n.id : undefined);
      const nodeType = existingData.node_type || [n.type, n.policy_tag].filter(Boolean).join(' · ') || 'governed';
      const entropy = typeof existingData.entropy === 'number' ? existingData.entropy : n.entropy;
      const policyTag = existingData.policy_tag || n.policy_tag || 'governance';
      const status = existingData.status || (isExecuting ? 'running' : 'idle');

      return {
        ...n,
        id: String(n.id),
        type: 'custom',
        position: hasValidPosition ? n.position : { x: 260 + xOffset, y: 36 + rank * 145 },
        selected: n.id === selectedNodeId,
        data: {
          ...existingData,
          label,
          subtitle,
          node_type: nodeType,
          status,
          entropy,
          policy_tag: policyTag,
          rank,
          config: existingData.config || {
            node_id: n.id,
            policy_tag: policyTag,
            entropy: typeof entropy === 'number' ? entropy : 0,
            dag_rank: rank,
            description: label,
          },
        },
      };
    });

    return { rfNodes: normalizedNodes, rfEdges: normalizedEdges };
  }, [nodes, edges, isExecuting, selectedNodeId]);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    if (onNodeClick) onNodeClick(event, node);
  }, [onNodeClick]);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  return (
    <div className="w-full h-[500px] border border-cos-border rounded-xl overflow-hidden bg-cos-bg shadow-[inset_0_4px_24px_rgb(0_0_0_/_0.6)]">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        onlyRenderVisibleElements
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--theme-border)" />
        <Controls className="!bg-cos-surface !border-cos-border !text-cos-text !fill-cos-text" />
        <MiniMap
          pannable
          zoomable
          className="!bg-cos-surface !border !border-cos-border rounded-md"
          maskColor="rgba(0, 0, 0, 0.45)"
        />
      </ReactFlow>
    </div>
  );
}

