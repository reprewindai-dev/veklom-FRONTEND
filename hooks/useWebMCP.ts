import { useState, useCallback } from 'react';
import { apiBaseUrl, getToken } from '@/lib/api';

export interface WebMCPToolInputSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
}

export interface WebMCPTool {
  name: string;
  description: string;
  inputSchema: WebMCPToolInputSchema;
  execute: (input: any) => Promise<any>;
}

export interface ExecutionIntent {
  agent_id: string;
  pgl_id: string;
  target_protocol: string;
  action: string;
  payload: Record<string, any>;
  delegation_chain?: string[];
}

export interface ExecutionReceipt {
  status: 'executed' | 'quarantined' | 'rejected';
  quarantine_id?: string;
  evidence_hash?: string;
  trust_delta?: number;
  new_trust_score?: number;
  risk_score?: number;
  anomalies_detected?: number;
  result?: any;
  error?: string;
  phase?: number;
  reason?: string;
  evidence_chain_id?: string;
}

declare global {
  interface Navigator {
    modelContext?: {
      registerTool: (tool: WebMCPTool) => void;
      registeredTools: Map<string, WebMCPTool>;
    };
  }
}

if (typeof window !== 'undefined' && !window.navigator.modelContext) {
  window.navigator.modelContext = {
    registeredTools: new Map(),
    registerTool: (tool: WebMCPTool) => {
      window.navigator.modelContext!.registeredTools.set(tool.name, tool);
      console.log(`[WebMCP] Registered tool: ${tool.name}`);
    }
  };
}

export function useWebMCP() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<ExecutionReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Legacy compatibility transport only.
   *
   * /api/v1/capi/execute is retired fail-closed because cAPI is not
   * consequence authority. This function deliberately preserves the rejection
   * until WebMCP is wired to the canonical CAPPO CapabilityLease contract.
   */
  const executeGovernedAction = useCallback(async (intent: ExecutionIntent, onProgress?: (log: string) => void): Promise<ExecutionReceipt> => {
    setIsExecuting(true);
    setError(null);
    setLastReceipt(null);

    try {
      const token = getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream, application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiBaseUrl()}/api/v1/capi/execute`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          agent_id: intent.agent_id,
          pgl_id: intent.pgl_id,
          target_protocol: intent.target_protocol,
          action: intent.action,
          payload: intent.payload,
          delegation_chain: intent.delegation_chain
        })
      });

      if (!response.ok) {
        let errMessage = `HTTP ${response.status}`;
        try {
          const errJson = await response.json();
          errMessage = errJson.detail?.message || errJson.detail || errJson.error || errMessage;
        } catch {
          // Preserve HTTP status when the response is not JSON.
        }
        throw new Error(errMessage);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/event-stream')) {
        throw new Error(`Expected SSE execution stream but received ${contentType || 'unknown content type'}`);
      }
      if (!response.body) throw new Error('No response body for streaming');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let receipt: ExecutionReceipt | null = null;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.substring(6).trim();
          if (!dataStr) continue;
          const eventData = JSON.parse(dataStr);
          if (eventData.type === 'log') {
            onProgress?.(`[Phase ${eventData.phase}] ${eventData.text}`);
          } else if (eventData.type === 'error') {
            throw new Error(eventData.detail?.message || eventData.detail || 'Execution error');
          } else if (eventData.type === 'receipt') {
            receipt = eventData.data;
          }
        }
      }

      if (!receipt) throw new Error('Stream closed without returning an execution receipt');
      if (!['executed', 'quarantined', 'rejected'].includes(receipt.status)) {
        throw new Error(`Unknown execution receipt status: ${String(receipt.status)}`);
      }

      setLastReceipt(receipt);
      return receipt;
    } catch (err: any) {
      console.error('[WebMCP] Governance Error:', err);
      const errMessage = err.message || 'Execution unavailable';
      setError(errMessage);
      const receipt: ExecutionReceipt = { status: 'rejected', error: errMessage };
      setLastReceipt(receipt);
      return receipt;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const registerGovernedTool = useCallback((name: string, description: string, inputSchema: WebMCPToolInputSchema) => {
    if (typeof window === 'undefined' || !window.navigator.modelContext) return;

    window.navigator.modelContext.registerTool({
      name,
      description,
      inputSchema,
      execute: async (input: any) => executeGovernedAction({
        agent_id: input.agent_id || 'anonymous-agent',
        pgl_id: input.pgl_id || 'badsig',
        target_protocol: 'webmcp',
        action: name,
        payload: input
      })
    });
  }, [executeGovernedAction]);

  return {
    registerGovernedTool,
    executeGovernedAction,
    isExecuting,
    lastReceipt,
    error
  };
}
