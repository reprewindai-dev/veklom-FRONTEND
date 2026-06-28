import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────

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
}

// ── Global Polyfill ────────────────────────────────────────────────────────
// Polyfill navigator.modelContext if it doesn't exist
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

// ── Hook ───────────────────────────────────────────────────────────────────

export function useWebMCP() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<ExecutionReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Routes a tool call through the MCPAPI Backend Governance Pipeline
   */
  const executeGovernedAction = useCallback(async (intent: ExecutionIntent): Promise<ExecutionReceipt> => {
    setIsExecuting(true);
    setError(null);
    setLastReceipt(null);

    try {
      // 1. Send the Execution Intent to the Veklom MCPAPI backend
      const response = await api.post('/api/v1/capi/execute', {
        agent_id: intent.agent_id,
        pgl_id: intent.pgl_id,
        target_protocol: intent.target_protocol,
        action: intent.action,
        payload: intent.payload,
        delegation_chain: intent.delegation_chain
      });

      const receipt: ExecutionReceipt = response.data;
      
      // 2. Handle HTTP 202 Quarantine
      if (response.status === 202) {
        receipt.status = 'quarantined';
      } else if (response.status === 200) {
        receipt.status = 'executed';
      }

      setLastReceipt(receipt);
      return receipt;

    } catch (err: any) {
      console.error('[WebMCP] Governance Error:', err);
      const errMessage = err.response?.data?.detail || err.message || 'Execution blocked by MCPAPI';
      setError(errMessage);
      
      const receipt: ExecutionReceipt = {
        status: 'rejected',
        error: errMessage
      };
      
      setLastReceipt(receipt);
      return receipt;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  /**
   * Registers a capability as a WebMCP browser tool that automatically wraps 
   * its execution in the MCPAPI governance pipeline.
   */
  const registerGovernedTool = useCallback((name: string, description: string, inputSchema: WebMCPToolInputSchema) => {
    if (typeof window === 'undefined' || !window.navigator.modelContext) return;

    window.navigator.modelContext.registerTool({
      name,
      description,
      inputSchema,
      execute: async (input: any) => {
        // Agent calls tool -> Tool automatically routes through MCPAPI
        return await executeGovernedAction({
          agent_id: input.agent_id || 'anonymous-agent',
          pgl_id: input.pgl_id || 'badsig', // Default to badsig for anonymous tests
          target_protocol: 'webmcp',
          action: name,
          payload: input
        });
      }
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
