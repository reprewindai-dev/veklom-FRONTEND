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
    <div className={`px-4 py-3 rounded-lg border-2 transition-all min-w-[160px] text-center ${statusColor} ${selected ? 'border-white shadow-xl scale-105' : ''}`}>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!bg-cos-muted" />
      <div className="text-xs font-black uppercase tracking-wider mb-1">
        {data.label}
      </div>
      <div className="text-[9px] font-mono opacity-70 tracking-widest uppercase">
        {data.node_type}
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!bg-cos-muted" />
    </div>
  );
});

CosGovernNode.displayName = 'CosGovernNode';

export default function GovernCanvas({ nodes, edges, onNodeClick, isExecuting }: GovernCanvasProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const nodeTypes = useMemo(() => ({ custom: CosGovernNode }), []);

  const rfNodes = useMemo(() => {
    return nodes.map(n => ({
      ...n,
      type: 'custom',
      selected: n.id === selectedNodeId
    }));
  }, [nodes, selectedNodeId]);

  const rfEdges = useMemo(() => {
    return edges.map(e => ({
      ...e,
      animated: isExecuting || e.animated,
      style: { stroke: isExecuting ? '#00E5FF' : 'rgba(255,255,255,0.15)', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isExecuting ? '#00E5FF' : 'rgba(255,255,255,0.15)',
      },
    }));
  }, [edges, isExecuting]);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    if (onNodeClick) onNodeClick(event, node);
  }, [onNodeClick]);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  return (
    <div className="w-full h-[500px] border border-cos-border rounded-xl overflow-hidden bg-[#0A0A0A] shadow-[inset_0_4px_24px_rgba(0,0,0,0.6)]">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }} // hide default react flow attribution
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.05)" />
        <Controls className="!bg-cos-surface !border-cos-border !text-cos-text !fill-cos-text" />
      </ReactFlow>
    </div>
  );
}
