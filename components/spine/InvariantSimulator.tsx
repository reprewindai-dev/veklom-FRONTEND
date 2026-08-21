import React, { useState } from 'react';
import { SubstrateNode, CapabilityDefinition, CAPPOGrant, HRMRRouteResult } from '@/lib/spine/types';
import { ShieldAlert, RefreshCw, ArrowRight, CheckCircle2, AlertTriangle, Terminal, Lock, Play, Cpu } from 'lucide-react';

interface InvariantSimulatorProps {
  nodes: SubstrateNode[];
  capabilities: CapabilityDefinition[];
  grants: CAPPOGrant[];
  onExecuteRoute: (
    capabilityId: string,
    cappoGrantId: string,
    preferredNodeId: string,
    force503NodeId?: string,
    invalidCappo?: boolean
  ) => Promise<HRMRRouteResult>;
}

export const InvariantSimulator: React.FC<InvariantSimulatorProps> = ({
  nodes,
  capabilities,
  grants,
  onExecuteRoute,
}) => {
  const [selectedCapabilityId, setSelectedCapabilityId] = useState<string>(capabilities[0]?.id || 'cap-compute-v1');
  const [selectedGrantId, setSelectedGrantId] = useState<string>(grants[0]?.grantId || 'cappo-grant-alpha-001');
  const [selectedNodeId, setSelectedNodeId] = useState<string>(nodes[0]?.id || 'node-local-k8s');

  // Simulation Toggles
  const [simulateInvalidCappo, setSimulateInvalidCappo] = useState<boolean>(false);
  const [simulatePrimary503, setSimulatePrimary503] = useState<boolean>(false);

  // Execution state
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [routeResult, setRouteResult] = useState<HRMRRouteResult | null>(null);

  const handleRunTest = async () => {
    setIsExecuting(true);
    try {
      const result = await onExecuteRoute(
        selectedCapabilityId,
        selectedGrantId,
        selectedNodeId,
        simulatePrimary503 ? selectedNodeId : undefined,
        simulateInvalidCappo
      );
      setRouteResult(result);
    } catch (err) {
      console.error('Routing execution error:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Explaining the Two Invariants */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              CORE BREAKTHROUGH: THE TWO INVARIANTS
            </span>
            <h2 className="text-xl font-bold text-white mt-1">
              HRMR Hierarchical Resource Router &amp; Governance Testbed
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Execution location is interchangeable; authority identity is not. Test how HTTP 403 terminal checks block permission hunting while 503 infrastructure failures transparently reroute compute.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleRunTest}
              disabled={isExecuting}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition flex items-center space-x-2 cursor-pointer shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {isExecuting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
              <span>{isExecuting ? 'Routing Substrate...' : 'Execute Request Flow'}</span>
            </button>
          </div>
        </div>

        {/* The Two Invariants Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-indigo-500/20">
          <div className="p-4 rounded-lg bg-slate-950/70 border border-rose-500/30 space-y-1">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
              <ShieldAlert className="h-4 w-4" />
              <span>Invariant 1: Authority Cannot Move (403 Terminal)</span>
            </div>
            <p className="text-xs text-slate-300">
              403 is non-routable and non-retryable. It cannot be bypassed by fallback or reinterpreted across nodes.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/70 border border-sky-500/30 space-y-1">
            <div className="flex items-center space-x-2 text-sky-400 font-bold text-sm">
              <RefreshCw className="h-4 w-4" />
              <span>Invariant 2: Execution Can Move (503 Fallback)</span>
            </div>
            <p className="text-xs text-slate-300">
              503 infrastructure failure triggers transparent fallback to AWS/Azure/Local without authority drift.
            </p>
          </div>
        </div>
      </div>

      {/* Control Panel & Simulator Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Test Harness Configuration Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center space-x-2">
            <Cpu className="h-4 w-4 text-indigo-400" />
            <span>Request Parameter Builder</span>
          </h3>

          {/* 1. Capability Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-400">Target Capability</label>
            <select
              value={selectedCapabilityId}
              onChange={(e) => setSelectedCapabilityId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {capabilities.map((cap) => (
                <option key={cap.id} value={cap.id}>
                  {cap.name} ({cap.category})
                </option>
              ))}
            </select>
          </div>

          {/* 2. CAPPO Grant Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-400">CAPPO Authority Grant</label>
            <select
              value={selectedGrantId}
              onChange={(e) => setSelectedGrantId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {grants.map((grant) => (
                <option key={grant.grantId} value={grant.grantId}>
                  {grant.grantId} - [{grant.subject}]
                </option>
              ))}
            </select>
          </div>

          {/* 3. Preferred Substrate Target */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-400">Preferred Substrate Node</label>
            <select
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name} [{node.region}] ({node.status})
                </option>
              ))}
            </select>
          </div>

          {/* Scenario Trigger Switches */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-mono font-semibold text-slate-300">Simulate Failure Scenarios:</h4>

            {/* Switch 1: Force Invalid CAPPO (403) */}
            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
              <div>
                <span className="text-xs font-semibold text-rose-400 block font-mono">Invalidate Authority (403)</span>
                <span className="text-[11px] text-slate-400">Simulates revoked or unauthorized token</span>
              </div>
              <input
                type="checkbox"
                checked={simulateInvalidCappo}
                onChange={(e) => setSimulateInvalidCappo(e.target.checked)}
                className="h-4 w-4 accent-rose-500 cursor-pointer"
              />
            </label>

            {/* Switch 2: Force Primary Node Offline (503) */}
            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
              <div>
                <span className="text-xs font-semibold text-sky-400 block font-mono">Simulate Primary Node 503</span>
                <span className="text-[11px] text-slate-400">Forces primary substrate infrastructure fail</span>
              </div>
              <input
                type="checkbox"
                checked={simulatePrimary503}
                onChange={(e) => setSimulatePrimary503(e.target.checked)}
                className="h-4 w-4 accent-sky-500 cursor-pointer"
              />
            </label>
          </div>

          <button
            onClick={handleRunTest}
            disabled={isExecuting}
            className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {isExecuting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
            <span>Execute HRMR Route Request</span>
          </button>
        </div>

        {/* Execution Output & Trace Inspector */}
        <div className="lg:col-span-7 space-y-4">
          {routeResult ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
              {/* Outcome Header Pill */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  {routeResult.finalHttpStatus === 200 && (
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                    </div>
                  )}
                  {routeResult.finalHttpStatus === 403 && (
                    <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                      <ShieldAlert className="h-6 w-6 text-rose-400" />
                    </div>
                  )}
                  {routeResult.finalHttpStatus === 503 && (
                    <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-cyan-400" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-white">HTTP {routeResult.finalHttpStatus}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                          routeResult.finalHttpStatus === 200
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : routeResult.finalHttpStatus === 403
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-cyan-500/10 text-cyan-400'
                        }`}
                      >
                        {routeResult.authorityDecision}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      Tx: {routeResult.transactionId} | Execution Time: {routeResult.executionTimeMs}ms
                    </span>
                  </div>
                </div>

                {routeResult.executionStatus === 'REROUTED_FALLBACK' && (
                  <span className="px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full text-xs font-mono font-semibold">
                    REROUTED FALLBACK
                  </span>
                )}
              </div>

              {/* Header Inspector */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  HTTP Response Headers Inspector
                </h4>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">X-Veklom-CAPPO:</span>
                    <span className={routeResult.finalHttpStatus === 403 ? 'text-rose-400' : 'text-emerald-400'}>
                      {routeResult.finalHttpStatus === 403 ? 'DENIED_TERMINAL' : 'AUTHORIZED'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">X-Substrate-PGL:</span>
                    <span className="text-sky-400 truncate max-w-[240px]">
                      {routeResult.pglProofHash || 'N/A (403 Terminal)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">X-x402-Settlement:</span>
                    <span className="text-cyan-400">
                      {routeResult.x402SettlementGas ? `${routeResult.x402SettlementGas} VEK` : '0 VEK'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Layer Trace Steps */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Substrate Layer Trace Logs ({routeResult.trace.length} Steps)</span>
                </h4>

                <div className="space-y-2">
                  {routeResult.trace.map((step) => {
                    const isErr = step.status === 'TERMINAL_403' || step.status === 'FALLBACK_503';
                    const isFallback = step.status === 'FALLBACK_503';

                    return (
                      <div
                        key={step.step}
                        className={`p-3 rounded-lg border text-xs font-mono space-y-1 ${
                          step.status === 'TERMINAL_403'
                            ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                            : isFallback
                            ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-bold text-slate-200">{step.layer}</span>
                          <span>{new Date(step.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed">{step.detail}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
                <Terminal className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-white text-base">Ready to Execute HRMR Test Route</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Configure your target capability, authority grant, and failure switches on the left, then click "Execute Request Flow" to observe 403 terminal checks and 503 transparent fallback routing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
