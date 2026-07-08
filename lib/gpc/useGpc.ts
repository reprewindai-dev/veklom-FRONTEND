/**
 * useGpc Hook
 * High-level API for all GPC operations: compile, execute, generate
 * Manages error handling, SSE streaming, and state updates
 * 
 * Generated for: veklom-control-plane/lib/gpc/useGpc.ts
 */

import { useCallback, useState } from 'react';
import { useCanvasStore, useExecutionStore, usePreviewStore } from '@/lib/gpc/stores';
import {
  GPCPipelineGraph,
  NLToGraphRequest,
  NLToGraphResult,
  PipelineCompilationResult,
  ExecutionEvent,
} from '@/types/gpc';

interface UseGpcOptions {
  baseUrl?: string;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export function useGpc(options: UseGpcOptions = {}) {
  const baseUrl = options.baseUrl || '/api/v1/gpc';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasStore = useCanvasStore();
  const executionStore = useExecutionStore();
  const previewStore = usePreviewStore();

  // ========================================================================
  // COMPILE: Graph → Python
  // ========================================================================

  const compile = useCallback(
    async (pipelineId?: string): Promise<PipelineCompilationResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // Use provided pipeline_id or generate a new one
        const graph = canvasStore.exportGraph();
        const actualPipelineId = pipelineId || graph.pipeline_id;

        const response = await fetch(`${baseUrl}/compile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}`,
          },
          body: JSON.stringify({
            pipeline_id: actualPipelineId,
            tenant_id: graph.tenant_id,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Compilation failed: ${response.status} ${response.statusText}`
          );
        }

        const result: PipelineCompilationResult = await response.json();

        if (!result.success) {
          throw new Error(result.warnings?.join(', ') || 'Compilation failed');
        }

        // Store compilation result in session (optional: show in modal)
        sessionStorage.setItem('gpc_last_compilation', JSON.stringify(result));
        options.onSuccess?.('Pipeline compiled successfully');

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        options.onError?.(errorMsg);
        console.error('Compilation error:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl, canvasStore, options]
  );

  // ========================================================================
  // EXECUTE: Run pipeline with SSE streaming
  // ========================================================================

  const execute = useCallback(
    async (pipelineId?: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const graph = canvasStore.exportGraph();
        const actualPipelineId = pipelineId || graph.pipeline_id;

        // Start execution
        executionStore.startExecution(actualPipelineId, [], []);

        // Fetch and compile first
        const compilationResult = await compile(actualPipelineId);
        if (!compilationResult) {
          throw new Error('Failed to compile pipeline');
        }

        // Update execution store with execution order
        executionStore.startExecution(
          actualPipelineId,
          compilationResult.execution_order,
          compilationResult.parallel_levels
        );

        // Open SSE connection for streaming execution
        const eventSource = new EventSource(
          `${baseUrl}/execute?pipeline_id=${actualPipelineId}`,
          {
            withCredentials: true,
          }
        );

        eventSource.addEventListener('message', (event) => {
          try {
            const data: ExecutionEvent = JSON.parse(event.data);

            switch (data.event) {
              case 'start':
                executionStore.startExecution(
                  actualPipelineId,
                  compilationResult.execution_order,
                  compilationResult.parallel_levels
                );
                break;

              case 'node_start':
                if (data.node_id) {
                  executionStore.setCurrentNode(data.node_id);
                  executionStore.updateNodeStatus(data.node_id, {
                    status: 'running',
                    progress: (data.index || 0) * 20,
                  });
                }
                break;

              case 'node_complete':
                if (data.node_id) {
                  executionStore.updateNodeStatus(data.node_id, {
                    status: 'success',
                    progress: 100,
                  });
                  if (data.preview) {
                    previewStore.setPreview(data.node_id, data.preview);
                  }
                }
                break;

              case 'complete':
                executionStore.completeExecution();
                options.onSuccess?.('Pipeline executed successfully');
                eventSource.close();
                break;

              case 'error':
                throw new Error(data.error || data.message || 'Execution error');
            }
          } catch (err) {
            console.error('Error parsing SSE event:', err);
          }
        });

        eventSource.addEventListener('error', () => {
          const errorMsg = 'Execution connection lost';
          setError(errorMsg);
          options.onError?.(errorMsg);
          executionStore.failExecution(errorMsg);
          eventSource.close();
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Execution failed';
        setError(errorMsg);
        options.onError?.(errorMsg);
        executionStore.failExecution(errorMsg);
        console.error('Execution error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl, canvasStore, executionStore, previewStore, compile, options]
  );

  // ========================================================================
  // GENERATE: NL → Graph
  // ========================================================================

  const generateFromIntent = useCallback(
    async (
      intent: string,
      dataResidencyRegion: 'ca-central-1' | 'ca-west-1' | 'on-premise' = 'ca-central-1'
    ): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${baseUrl}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}`,
          },
          body: JSON.stringify({
            tenant_id: 'default',
            user_intent: intent,
            data_residency_region: dataResidencyRegion,
          } as NLToGraphRequest),
        });

        if (!response.ok) {
          throw new Error(
            `Generation failed: ${response.status} ${response.statusText}`
          );
        }

        const result: NLToGraphResult = await response.json();

        if (!result.success || !result.pipeline_graph) {
          throw new Error(result.errors?.join(', ') || 'Generation failed');
        }

        // Load generated graph into canvas
        canvasStore.loadGraph(result.pipeline_graph);
        options.onSuccess?.(
          `Pipeline generated (confidence: ${(result.confidence_score! * 100).toFixed(0)}%)`
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Generation failed';
        setError(errorMsg);
        options.onError?.(errorMsg);
        console.error('Generation error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl, canvasStore, options]
  );

  // ========================================================================
  // LOAD COMPONENTS (for sidebar palette)
  // ========================================================================

  const loadComponents = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/components`, {
        headers: {
          Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load components');
      }

      return await response.json();
    } catch (err) {
      console.error('Failed to load components:', err);
      return [];
    }
  }, [baseUrl]);

  // ========================================================================
  // CLEAR STATE
  // ========================================================================

  const reset = useCallback(() => {
    canvasStore.loadGraph({
      pipeline_id: `pipeline_${Date.now()}`,
      tenant_id: 'default',
      nodes: [],
      edges: [],
    });
    executionStore.completeExecution();
    previewStore.clearPreview(
      Array.from(previewStore.previews.keys())[0] || ''
    );
    setError(null);
  }, [canvasStore, executionStore, previewStore]);

  return {
    // Actions
    compile,
    execute,
    generateFromIntent,
    loadComponents,
    reset,

    // State
    isLoading,
    error,
  };
}
