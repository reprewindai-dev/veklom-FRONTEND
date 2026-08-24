/**
 * useGpc Hook
 * High-level API for GPC compile/generate/component discovery.
 * Consequential execution is intentionally fail-closed until the workflow is
 * bound to the canonical CAPPO CapabilityLease execution contract.
 */

import { useCallback, useState } from 'react';
import { api } from '@/lib/api';
import { useCanvasStore, useExecutionStore, usePreviewStore } from '@/lib/gpc/stores';
import {
  NLToGraphRequest,
  NLToGraphResult,
  PipelineCompilationResult,
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

  const compile = useCallback(
    async (pipelineId?: string): Promise<PipelineCompilationResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const graph = canvasStore.exportGraph();
        const actualPipelineId = pipelineId || graph.pipeline_id;
        const result = await api.post<PipelineCompilationResult>(`${baseUrl}/compile`, {
          pipeline_id: actualPipelineId,
          tenant_id: graph.tenant_id,
        });

        if (!result.success) {
          throw new Error(result.warnings?.join(', ') || 'Compilation failed');
        }

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

  const execute = useCallback(
    async (pipelineId?: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const graph = canvasStore.exportGraph();
        const actualPipelineId = pipelineId || graph.pipeline_id;
        const compilationResult = await compile(actualPipelineId);
        if (!compilationResult) throw new Error('Failed to compile pipeline');

        executionStore.startExecution(
          actualPipelineId,
          compilationResult.execution_order,
          compilationResult.parallel_levels
        );

        throw new Error(
          'Workflow execution is not yet bound to the canonical CAPPO CapabilityLease contract. The legacy cAPI execution path is retired fail-closed.'
        );
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
    [canvasStore, executionStore, compile, options]
  );

  const generateFromIntent = useCallback(
    async (
      intent: string,
      dataResidencyRegion: 'ca-central-1' | 'ca-west-1' | 'on-premise' = 'ca-central-1'
    ): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await api.post<NLToGraphResult>(`${baseUrl}/generate`, {
          tenant_id: 'default',
          user_intent: intent,
          data_residency_region: dataResidencyRegion,
        } as NLToGraphRequest);

        if (!result.success || !result.pipeline_graph) {
          throw new Error(result.errors?.join(', ') || 'Generation failed');
        }

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

  const loadComponents = useCallback(async () => {
    try {
      return await api.get<unknown[]>(`${baseUrl}/components`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load components';
      setError(errorMsg);
      options.onError?.(errorMsg);
      console.error('Failed to load components:', err);
      throw err;
    }
  }, [baseUrl, options]);

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
    compile,
    execute,
    generateFromIntent,
    loadComponents,
    reset,
    isLoading,
    error,
  };
}
