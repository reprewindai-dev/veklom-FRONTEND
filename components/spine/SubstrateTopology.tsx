import React, { useState } from 'react';
import { SubstrateNode } from '@/lib/spine/types';
import { Server, Cloud, Radio, Cpu, Activity, ShieldCheck, Zap, Globe, Sliders } from 'lucide-react';

interface SubstrateTopologyProps {
  nodes: SubstrateNode[];
  onToggleNodeStatus: (nodeId: string, status: 'online' | 'degraded' | 'offline') => void;
  onUpdateNodeLatency: (nodeId: string, latencyMs: number) => void;
}

export const SubstrateTopology: React.FC<SubstrateTopologyProps> = ({
  nodes,
  onToggleNodeStatus,
  onUpdateNodeLatency,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(nodes[0]?.id || 'node-local-k8s');

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const getNodeIcon = (type: SubstrateNode['type']) => {
    switch (type) {
      case 'local_k8s':
        return <Server className="h-6 w-6 text-emerald-400" />;
      case 'aws_edge':
        return <Cloud className="h-6 w-6 text-amber-400" />;
      case 'azure_sovereign':
        return <Globe className="h-6 w-6 text-sky-400" />;
      case 'rf_microcontroller':
        return <Radio className="h-6 w-6 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Topology Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Layer 1: Substrate
              </span>
              <span className="text-xs text-slate-400">Locality-Bounded Hardware &amp; Isolation</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Substrate Infrastructure Topology &amp; Provider Mesh
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Computless Cloud abstracts hardware across AWS, Azure, local container enclaves, and RF microcontrollers.
              Execution location is interchangeable, while authority identity remains strictly invariant.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
              <span className="text-slate-400 block text-[10px]">TOTAL NODES</span>
              <span className="text-base font-bold text-white">{nodes.length}</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
              <span className="text-slate-400 block text-[10px]">SOVEREIGN BOUNDARIES</span>
              <span className="text-base font-bold text-emerald-400">
                {nodes.filter((n) => n.isSovereign).length} / {nodes.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nodes Map & Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Substrate Node Cards List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Active Substrate Instances ({nodes.length})
            </h3>
            <span className="text-xs text-slate-400">Click node to inspect capabilities</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {nodes.map((node) => {
              const isSelected = node.id === selectedNodeId;
              const isOnline = node.status === 'online';
              const isDegraded = node.status === 'degraded';

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-5 rounded-xl border transition cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {/* Status Indicator Pill */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      {getNodeIcon(node.type)}
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isOnline ? 'bg-emerald-400' : isDegraded ? 'bg-amber-400' : 'bg-rose-500'
                        }`}
                      />
                      <span className="text-xs font-mono uppercase text-slate-300">{node.status}</span>
                    </div>
                  </div>

                  <h4 className="font-semibold text-slate-100 text-base">{node.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{node.localityBoundary}</p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-300">
                    <span className="flex items-center space-x-1">
                      <Activity className="h-3.5 w-3.5 text-slate-400" />
                      <span>{node.latencyMs}ms</span>
                    </span>
                    <span className="text-slate-400">CPU {node.cpuUsagePct}%</span>
                    {node.isSovereign && (
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px]">
                        SOVEREIGN
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Node Inspector & Live Controls */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                {getNodeIcon(selectedNode.type)}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{selectedNode.name}</h3>
                <span className="text-xs font-mono text-indigo-400">{selectedNode.region}</span>
              </div>
            </div>

            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => onToggleNodeStatus(selectedNode.id, 'online')}
                className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer ${
                  selectedNode.status === 'online'
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ONLINE
              </button>
              <button
                onClick={() => onToggleNodeStatus(selectedNode.id, 'degraded')}
                className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer ${
                  selectedNode.status === 'degraded'
                    ? 'bg-amber-500/20 text-amber-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                DEGRADED
              </button>
              <button
                onClick={() => onToggleNodeStatus(selectedNode.id, 'offline')}
                className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer ${
                  selectedNode.status === 'offline'
                    ? 'bg-rose-500/20 text-rose-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                OFFLINE (503)
              </button>
            </div>
          </div>

          {/* Node Locality & Hardware Specs */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Locality &amp; Isolation Boundary
            </h4>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Boundary Target:</span>
                <span className="text-slate-200 font-semibold">{selectedNode.localityBoundary}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sovereignty Attestation:</span>
                <span className={selectedNode.isSovereign ? 'text-emerald-400' : 'text-slate-400'}>
                  {selectedNode.isSovereign ? 'Cryptographically Sealed Enclave' : 'Standard Edge Domain'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">MCP Protocol Proxy:</span>
                <span className={selectedNode.mcpEnabled ? 'text-sky-400' : 'text-slate-500'}>
                  {selectedNode.mcpEnabled ? 'Supported (JSON-RPC 2.0)' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Simulated Latency Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center space-x-1">
                <Sliders className="h-3.5 w-3.5 text-indigo-400" />
                <span>Simulated Network Latency:</span>
              </span>
              <span className="text-indigo-400 font-bold">{selectedNode.latencyMs} ms</span>
            </div>
            <input
              type="range"
              min="1"
              max="200"
              value={selectedNode.latencyMs}
              onChange={(e) => onUpdateNodeLatency(selectedNode.id, parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500 bg-slate-950 rounded-lg h-2 cursor-pointer"
            />
          </div>

          {/* Supported Capability List */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Supported Capability Catalog ({selectedNode.supportedCapabilities.length})
            </h4>
            <div className="space-y-1.5">
              {selectedNode.supportedCapabilities.map((cap) => (
                <div
                  key={cap}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono"
                >
                  <span className="text-slate-300">{cap}</span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px]">
                    GRANTED
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
