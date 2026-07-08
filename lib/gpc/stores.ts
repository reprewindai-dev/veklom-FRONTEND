/**
 * GPC Zustand Stores
 * Three decoupled stores prevent re-render cascades during drag/execution
 * 
 * Generated for: veklom-control-plane/lib/gpc/stores.ts
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { GPCNode, GPCEdge, GPCPipelineGraph, PortType, NodeExecutionState, PreviewData } from '@/types/gpc';

// ============================================================================
// CANVAS STORE — Node/Edge state only (UI structure)
// ============================================================================

interface CanvasStore {
  // State
  nodes: GPCNode[];
  edges: GPCEdge[];
  selectedNodeIds: Set<string>;
  zoom: number;
  pan: { x: number; y: number };

  // Node mutations
  addNode: (node: GPCNode) => void;
  updateNode: (nodeId: string, partial: Partial<GPCNode>) => void;
  deleteNode: (nodeId: string) => void;
  moveNode: (nodeId: string, position: { x: number; y: number }) => void;
  toggleNodeSelection: (nodeId: string) => void;
  setSelectedNodes: (nodeIds: string[]) => void;
  clearSelection: () => void;

  // Edge mutations
  addEdge: (edge: GPCEdge) => void;
  deleteEdge: (edgeId: string) => void;

  // Viewport
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;

  // Load from graph
  loadGraph: (graph: GPCPipelineGraph) => void;
  exportGraph: () => GPCPipelineGraph;

  // Queries
  getNode: (nodeId: string) => GPCNode | undefined;
  getNodeInputs: (nodeId: string) => Array<{ edgeId: string; sourceNodeId: string }>;
  getNodeOutputs: (nodeId: string) => Array<{ edgeId: string; targetNodeId: string }>;
}

export const useCanvasStore = create<CanvasStore>()(
  subscribeWithSelector((set, get) => ({
    nodes: [],
    edges: [],
    selectedNodeIds: new Set(),
    zoom: 1,
    pan: { x: 0, y: 0 },

    addNode: (node) =>
      set((state) => ({
        nodes: [...state.nodes, node],
      })),

    updateNode: (nodeId, partial) =>
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === nodeId ? { ...n, ...partial } : n
        ),
      })),

    deleteNode: (nodeId) =>
      set((state) => ({
        nodes: state.nodes.filter((n) => n.id !== nodeId),
        edges: state.edges.filter(
          (e) => e.source_node_id !== nodeId && e.target_node_id !== nodeId
        ),
        selectedNodeIds: new Set(
          [...state.selectedNodeIds].filter((id) => id !== nodeId)
        ),
      })),

    moveNode: (nodeId, position) =>
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === nodeId ? { ...n, position } : n
        ),
      })),

    toggleNodeSelection: (nodeId) =>
      set((state) => {
        const newSelected = new Set(state.selectedNodeIds);
        if (newSelected.has(nodeId)) {
          newSelected.delete(nodeId);
        } else {
          newSelected.add(nodeId);
        }
        return { selectedNodeIds: newSelected };
      }),

    setSelectedNodes: (nodeIds) =>
      set({ selectedNodeIds: new Set(nodeIds) }),

    clearSelection: () =>
      set({ selectedNodeIds: new Set() }),

    addEdge: (edge) =>
      set((state) => ({
        edges: [...state.edges, edge],
      })),

    deleteEdge: (edgeId) =>
      set((state) => ({
        edges: state.edges.filter((e) => e.id !== edgeId),
      })),

    setZoom: (zoom) =>
      set({ zoom: Math.max(0.1, Math.min(4, zoom)) }),

    setPan: (pan) =>
      set({ pan }),

    loadGraph: (graph) =>
      set({
        nodes: graph.nodes || [],
        edges: graph.edges || [],
        selectedNodeIds: new Set(),
      }),

    exportGraph: () => {
      const state = get();
      return {
        pipeline_id: "new_pipeline",
        tenant_id: "",
        nodes: state.nodes,
        edges: state.edges,
        schema_version: "1.0",
      };
    },

    getNode: (nodeId) => get().nodes.find((n) => n.id === nodeId),

    getNodeInputs: (nodeId) =>
      get().edges
        .filter((e) => e.target_node_id === nodeId)
        .map((e) => ({
          edgeId: e.id,
          sourceNodeId: e.source_node_id,
        })),

    getNodeOutputs: (nodeId) =>
      get().edges
        .filter((e) => e.source_node_id === nodeId)
        .map((e) => ({
          edgeId: e.id,
          targetNodeId: e.target_node_id,
        })),
  }))
);

// ============================================================================
// EXECUTION STORE — Pipeline run state (completely separate)
// ============================================================================

interface ExecutionStore {
  // State
  isRunning: boolean;
  runId: string;
  nodeStatus: Map<string, NodeExecutionState>;
  currentNodeId: string | null;
  executionOrder: string[];
  parallelLevels: string[][];

  // Mutations
  startExecution: (runId: string, nodeOrder: string[], levels: string[][]) => void;
  updateNodeStatus: (nodeId: string, status: Partial<NodeExecutionState>) => void;
  setCurrentNode: (nodeId: string | null) => void;
  completeExecution: () => void;
  failExecution: (error: string) => void;

  // Queries
  getNodeStatus: (nodeId: string) => NodeExecutionState | undefined;
  getRunProgress: () => { completed: number; total: number; percent: number };
}

export const useExecutionStore = create<ExecutionStore>()(
  subscribeWithSelector((set, get) => ({
    isRunning: false,
    runId: "",
    nodeStatus: new Map(),
    currentNodeId: null,
    executionOrder: [],
    parallelLevels: [],

    startExecution: (runId, nodeOrder, levels) =>
      set({
        isRunning: true,
        runId,
        executionOrder: nodeOrder,
        parallelLevels: levels,
        nodeStatus: new Map(
          nodeOrder.map((nid) => [
            nid,
            {
              node_id: nid,
              status: "idle",
              progress: 0,
            },
          ])
        ),
        currentNodeId: nodeOrder[0] || null,
      }),

    updateNodeStatus: (nodeId, partial) =>
      set((state) => {
        const newStatus = new Map(state.nodeStatus);
        const current = newStatus.get(nodeId);
        if (current) {
          newStatus.set(nodeId, { ...current, ...partial });
        }
        return { nodeStatus: newStatus };
      }),

    setCurrentNode: (nodeId) =>
      set({ currentNodeId: nodeId }),

    completeExecution: () =>
      set((state) => {
        const newStatus = new Map(state.nodeStatus);
        newStatus.forEach((status) => {
          if (status.status === "idle" || status.status === "running") {
            status.status = "success";
          }
        });
        return {
          isRunning: false,
          nodeStatus: newStatus,
        };
      }),

    failExecution: (error) =>
      set((state) => {
        const newStatus = new Map(state.nodeStatus);
        if (state.currentNodeId) {
          const current = newStatus.get(state.currentNodeId);
          if (current) {
            current.status = "failure";
            current.error = error;
          }
        }
        return {
          isRunning: false,
          nodeStatus: newStatus,
        };
      }),

    getNodeStatus: (nodeId) => get().nodeStatus.get(nodeId),

    getRunProgress: () => {
      const state = get();
      const total = state.executionOrder.length;
      const completed = Array.from(state.nodeStatus.values()).filter(
        (s) => s.status === "success" || s.status === "failure"
      ).length;
      return {
        completed,
        total,
        percent: total > 0 ? (completed / total) * 100 : 0,
      };
    },
  }))
);

// ============================================================================
// PREVIEW STORE — Data previews (completely isolated)
// ============================================================================

interface PreviewStore {
  // State
  previews: Map<string, PreviewData>;
  selectedPreviewNodeId: string | null;

  // Mutations
  setPreview: (nodeId: string, data: PreviewData) => void;
  clearPreview: (nodeId: string) => void;
  selectPreview: (nodeId: string | null) => void;

  // Queries
  getPreview: (nodeId: string) => PreviewData | undefined;
}

export const usePreviewStore = create<PreviewStore>()(
  subscribeWithSelector((set, get) => ({
    previews: new Map(),
    selectedPreviewNodeId: null,

    setPreview: (nodeId, data) =>
      set((state) => {
        const newPreviews = new Map(state.previews);
        newPreviews.set(nodeId, { ...data, timestamp: Date.now() });
        return { previews: newPreviews };
      }),

    clearPreview: (nodeId) =>
      set((state) => {
        const newPreviews = new Map(state.previews);
        newPreviews.delete(nodeId);
        return { previews: newPreviews };
      }),

    selectPreview: (nodeId) =>
      set({ selectedPreviewNodeId: nodeId }),

    getPreview: (nodeId) => get().previews.get(nodeId),
  }))
);

// ============================================================================
// SELECTORS for fine-grained subscriptions (prevent cascade re-renders)
// ============================================================================

// Canvas selectors
export const useSelectedNodeIds = () =>
  useCanvasStore((state) => state.selectedNodeIds);

export const useCanvasNodes = () =>
  useCanvasStore((state) => state.nodes);

export const useCanvasEdges = () =>
  useCanvasStore((state) => state.edges);

export const useCanvasZoom = () =>
  useCanvasStore((state) => state.zoom);

// Execution selectors
export const useIsExecuting = () =>
  useExecutionStore((state) => state.isRunning);

export const useCurrentExecutingNode = () =>
  useExecutionStore((state) => state.currentNodeId);

export const useExecutionProgress = () =>
  useExecutionStore((state) => state.getRunProgress());

// Preview selectors
export const useSelectedPreview = () =>
  usePreviewStore((state) => {
    const nodeId = state.selectedPreviewNodeId;
    return nodeId ? state.previews.get(nodeId) : undefined;
  });
