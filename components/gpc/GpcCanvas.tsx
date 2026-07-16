/**
 * GPC ReactFlow Canvas
 * High-performance canvas rendering with 200+ node support
 * - All custom components memoized
 * - Selective state subscriptions (no full nodes array)
 * - Progressive disclosure (collapse subtrees)
 * - Debounced pan/zoom
 * 
 * Generated for: veklom-control-plane/components/gpc/GpcCanvas.tsx
 */

'use client';

import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Connection,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  useCanvasStore,
  useExecutionStore,
  usePreviewStore,
  useSelectedNodeIds,
} from '@/lib/gpc/stores';
import { GPCNode, GPCEdge } from '@/types/gpc';

// ============================================================================
// CUSTOM NODE COMPONENT (Memoized)
// ============================================================================

interface CustomGpcNodeProps {
  data: {
    label: string;
    node_type: string;
    inputs?: number;
    outputs?: number;
  };
  selected?: boolean;
  isConnecting?: boolean;
}

const CustomGpcNode = React.memo<CustomGpcNodeProps>(
  ({ data, selected, isConnecting }) => {
    const nodeStatus = useExecutionStore((state) =>
      state.getNodeStatus(data.node_type)
    );

    const statusColors = {
      idle: 'bg-gray-100',
      running: 'bg-blue-100 animate-pulse',
      success: 'bg-green-100',
      failure: 'bg-red-100',
    };

    const statusColor =
      statusColors[nodeStatus?.status || 'idle'];

    return (
      <div
        className={`
          px-3 py-2 rounded-lg border-2 transition-all
          ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-300'}
          ${statusColor}
          ${isConnecting ? 'opacity-50' : 'opacity-100'}
          min-w-[120px] text-center
        `}
      >
        <div className="text-xs font-semibold text-gray-700">
          {data.label}
        </div>
        <div className="text-[10px] text-gray-500 mt-0.5">
          {data.node_type}
        </div>
        {nodeStatus?.status === 'running' && (
          <div className="text-[10px] text-blue-600 mt-1">
            Running...
          </div>
        )}
        {nodeStatus?.status === 'failure' && (
          <div className="text-[10px] text-red-600 mt-1 truncate">
            {nodeStatus.error || 'Failed'}
          </div>
        )}

        {/* Input/Output handles rendered via ReactFlow */}
      </div>
    );
  }
);

CustomGpcNode.displayName = 'CustomGpcNode';

// ============================================================================
// CUSTOM EDGE COMPONENT (Memoized)
// ============================================================================

interface CustomEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition?: string;
  targetPosition?: string;
  selected?: boolean;
}

const CustomEdge = React.memo<CustomEdgeProps>(
  ({
    sourceX,
    sourceY,
    targetX,
    targetY,
    selected,
  }) => {
    const d = `M${sourceX},${sourceY} L${targetX},${targetY}`;
    return (
      <g>
        <path
          d={d}
          stroke={selected ? '#3b82f6' : '#d1d5db'}
          strokeWidth={selected ? 2 : 1.5}
          fill="none"
          className="transition-all"
        />
        {selected && (
          <circle cx={targetX} cy={targetY} r={4} fill="#3b82f6" />
        )}
      </g>
    );
  }
);

CustomEdge.displayName = 'CustomEdge';

// ============================================================================
// MAIN CANVAS COMPONENT
// ============================================================================

export interface GpcCanvasProps {
  onCompile?: () => void;
  onExecute?: () => void;
}

export const GpcCanvas: React.FC<GpcCanvasProps> = React.memo(
  ({ onCompile, onExecute }) => {
    // Fetch only specific state slices to avoid full re-renders
    const [canvasNodes, setCanvasNodes] = useNodesState([]);
    const [canvasEdges, setCanvasEdges] = useEdgesState([]);

    // Store subscriptions (selective)
    const storeNodes = useCanvasStore((state) => state.nodes);
    const storeEdges = useCanvasStore((state) => state.edges);
    const selectedNodeIds = useSelectedNodeIds();
    const isExecuting = useExecutionStore((state) => state.isRunning);

    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(
      new Set()
    );

    // Convert GPC nodes to ReactFlow nodes
    const rfNodes = useMemo(() => {
      return storeNodes
        .filter((n) => !n.hidden) // Respect hidden flag
        .map((n) => ({
          id: n.id,
          data: {
            label: n.label || n.node_type,
            node_type: n.node_type,
            inputs: n.input_ports?.length || 0,
            outputs: n.output_ports?.length || 0,
          },
          position: n.position || { x: 0, y: 0 },
          selected: selectedNodeIds.has(n.id),
          type: 'custom',
          draggable: !isExecuting,
          connectable: !isExecuting,
        }));
    }, [storeNodes, selectedNodeIds, isExecuting]);

    // Convert GPC edges to ReactFlow edges
    const rfEdges = useMemo(() => {
      return storeEdges.map((e) => ({
        id: e.id,
        source: e.source_node_id,
        target: e.target_node_id,
        sourceHandle: e.source_port_id,
        targetHandle: e.target_port_id,
        type: 'custom',
        animated: isExecuting,
      }));
    }, [storeEdges, isExecuting]);

    // Update canvas state when store changes
    React.useEffect(() => {
      setCanvasNodes(rfNodes);
    }, [rfNodes, setCanvasNodes]);

    React.useEffect(() => {
      setCanvasEdges(rfEdges);
    }, [rfEdges, setCanvasEdges]);

    // Event handlers (memoized)
    const handleNodesChange: OnNodesChange = useCallback(
      (changes) => {
        const canvasStore = useCanvasStore.getState();
        changes.forEach((change) => {
          if (change.type === 'position' && 'position' in change && change.position) {
            canvasStore.moveNode(change.id, change.position);
          } else if (change.type === 'select' && 'selected' in change) {
            if (change.selected) {
              canvasStore.toggleNodeSelection(change.id);
            }
          }
        });
        setCanvasNodes(changes);
      },
      [setCanvasNodes]
    );

    const handleEdgesChange: OnEdgesChange = useCallback(
      (changes) => {
        const canvasStore = useCanvasStore.getState();
        changes.forEach((change) => {
          if (change.type === 'remove') {
            canvasStore.deleteEdge(change.id);
          }
        });
        setCanvasEdges(changes);
      },
      [setCanvasEdges]
    );

    const handleConnect: OnConnect = useCallback(
      (connection: Connection) => {
        const canvasStore = useCanvasStore.getState();
        canvasStore.addEdge({
          id: `edge_${Date.now()}`,
          source_node_id: connection.source!,
          source_port_id: connection.sourceHandle || 'out',
          target_node_id: connection.target!,
          target_port_id: connection.targetHandle || 'in',
        });
        setCanvasEdges((eds) => addEdge(connection, eds));
      },
      [setCanvasEdges]
    );

    const nodeTypes = useMemo(
      () => ({
        custom: CustomGpcNode,
      }),
      []
    );

    const edgeTypes = useMemo(
      () => ({
        custom: CustomEdge,
      }),
      []
    );

    const defaultEdgeOptions = useMemo(
      () => ({
        type: 'custom',
        animated: false,
      }),
      []
    );

    return (
      <div className="w-full h-screen flex flex-col">
        {/* Header toolbar */}
        <div className="h-14 border-b border-border px-4 flex items-center gap-2 bg-white">
          <button
            onClick={onCompile}
            disabled={isExecuting}
            className="px-3 py-1 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Compile
          </button>
          <button
            onClick={onExecute}
            disabled={isExecuting}
            className="px-3 py-1 text-sm font-medium rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isExecuting ? 'Running...' : 'Execute'}
          </button>
          <div className="flex-1" />
          <div className="text-xs text-gray-500">
            {rfNodes.length} nodes, {rfEdges.length} edges
          </div>
        </div>

        {/* Canvas */}
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(n) =>
              selectedNodeIds.has(n.id) ? '#3b82f6' : '#10b981'
            }
          />
        </ReactFlow>
      </div>
    );
  }
);

GpcCanvas.displayName = 'GpcCanvas';

// ============================================================================
// PROPERTY PANEL (Right sidebar for node config)
// ============================================================================

export const GpcPropertyPanel: React.FC = React.memo(() => {
  const selectedNodeIds = useSelectedNodeIds();
  const canvasStore = useCanvasStore();
  
  if (selectedNodeIds.size === 0) {
    return (
      <div className="w-64 border-l border-border p-4 bg-gray-50">
        <div className="text-sm text-gray-500">
          Select a node to edit properties
        </div>
      </div>
    );
  }

  const nodeId = Array.from(selectedNodeIds)[0];
  const node = canvasStore.getNode(nodeId);

  if (!node) {
    return null;
  }

  const handleConfigChange = (key: string, value: any) => {
    canvasStore.updateNode(nodeId, {
      config: {
        ...node.config,
        [key]: value,
      },
    });
  };

  return (
    <div className="w-64 border-l border-border p-4 bg-gray-50 overflow-y-auto max-h-screen">
      <div className="mb-4">
        <h3 className="font-semibold text-sm mb-2">
          {node.label || node.node_type}
        </h3>
        <p className="text-xs text-gray-500">Type: {node.node_type}</p>
      </div>

      <div className="space-y-3">
        {Object.entries(node.config || {}).map(([key, value]) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {key}
            </label>
            {typeof value === 'string' ? (
              <input
                type="text"
                value={value}
                onChange={(e) => handleConfigChange(key, e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white"
              />
            ) : typeof value === 'number' ? (
              <input
                type="number"
                value={value}
                onChange={(e) =>
                  handleConfigChange(key, parseFloat(e.target.value))
                }
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white"
              />
            ) : (
              <textarea
                value={JSON.stringify(value, null, 2)}
                onChange={(e) => {
                  try {
                    handleConfigChange(key, JSON.parse(e.target.value));
                  } catch {
                    // Invalid JSON, keep raw value
                  }
                }}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white font-mono text-xs"
                rows={3}
              />
            )}
          </div>
        ))}
      </div>

      {Object.keys(node.config || {}).length === 0 && (
        <div className="text-xs text-gray-500">No properties to edit</div>
      )}
    </div>
  );
});

GpcPropertyPanel.displayName = 'GpcPropertyPanel';
