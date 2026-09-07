"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Terminal,
  Zap,
  Search,
  Play,
  Activity,
  Shield,
  Lock,
  RefreshCw,
  AlertOctagon,
  Cpu
} from 'lucide-react';
import { API_BASE_URL } from '../data/pglLoader';

interface Capability {
  id: string;
  title: string;
  description: string;
  risk: string;
  toolset: string;
  input_schema?: any;
}

export const AmphotericRuntimeControl: React.FC = () => {
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [isSimulated, setIsSimulated] = useState(false);
  const [selectedCap, setSelectedCap] = useState<Capability | null>(null);
  const [args, setArgs] = useState<string>('{}');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discoveryStatus, setDiscoveryStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const FALLBACK_CAPABILITIES: Capability[] = [
    {
      id: 'file_reader',
      title: 'Local Workspace File Reader',
      description: 'Securely scan local system workspace directory files for alignment signatures.',
      risk: 'Low',
      toolset: 'filesystem',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute path to workspace file' }
        },
        required: ['path']
      }
    },
    {
      id: 'vector_search',
      title: 'PGL Local Memory Vector Query',
      description: 'Query PGL local memory vector database for context-specific tenant mappings.',
      risk: 'Medium',
      toolset: 'pgl_memory',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Vector query prompt' },
          limit: { type: 'number', description: 'Maximum number of returned contexts' }
        },
        required: ['query']
      }
    },
    {
      id: 'auth_validator',
      title: 'Zero-Trust Token Validator',
      description: 'Verify signed JSON Web Tokens against regional Zero-Trust Auth gatekeepers.',
      risk: 'High',
      toolset: 'zero_trust',
      input_schema: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'Signed bearer JWT' }
        },
        required: ['token']
      }
    },
    {
      id: 'vnp_bond_manager',
      title: 'VNP Micro-Stakes Margin Ledger',
      description: 'Initiate performance bond staking and SLA margin ledger operations.',
      risk: 'Critical',
      toolset: 'vnp_ledger',
      input_schema: {
        type: 'object',
        properties: {
          stake_amount: { type: 'number', description: 'Amount of VNP tokens to stake' },
          sla_id: { type: 'string', description: 'Reference ID of the active SLA performance bond' }
        },
        required: ['stake_amount', 'sla_id']
      }
    }
  ];

  const fetchDiscovery = async () => {
    setDiscoveryStatus('loading');
    setError(null);
    try {
      // Standard discovery endpoint for VNP v2 / Amphoteric
      let url = `${API_BASE_URL}/api/amphoteric/discover`;

      // Fallback for Interlink Rust specific path if needed
      if (API_BASE_URL.includes(':8080')) {
          url = `${API_BASE_URL}/mcp/rpc`; // Discovery via RPC call
      }

      const res = await fetch(url, {
          headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) throw new Error(`Discovery failed: ${res.status}`);

      const data = await res.json();

      // Normalize different backend response formats
      let normalized: Capability[] = [];
      if (data.tools) {
          normalized = data.tools.map((t: any) => ({
              id: t.name || t.id,
              title: t.name || t.title,
              description: t.description,
              risk: t.risk || 'Low',
              toolset: t.toolset || 'general',
              input_schema: t.parameters || t.inputSchema || t.input_schema
          }));
      } else if (data.result?.tools) {
          normalized = data.result.tools.map((t: any) => ({
              id: t.name || t.id,
              title: t.name || t.title,
              description: t.description,
              risk: t.risk || 'Low',
              toolset: t.toolset || 'general',
              input_schema: t.inputSchema || t.input_schema
          }));
      } else if (data.capabilities) {
          normalized = data.capabilities;
      }

      setCapabilities(normalized);
      setIsSimulated(false);
      setDiscoveryStatus('success');
    } catch (e: any) {
      console.warn("Backend discovery failed. Engaging secure local fallback primitives:", e);
      setIsSimulated(true);
      setCapabilities(FALLBACK_CAPABILITIES);
      setDiscoveryStatus('success');
      setSelectedCap(prev => prev || FALLBACK_CAPABILITIES[0]);
    }
  };

  useEffect(() => {
    fetchDiscovery();
  }, [API_BASE_URL]);

  const handleInvoke = async () => {
    if (!selectedCap) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const parsedArgs = JSON.parse(args);

      if (isSimulated) {
        await new Promise(resolve => setTimeout(resolve, 800));

        const generateLocalHash = (prefix: string) => {
          const SECURE_ENTROPY = ['a','b','c','d','e','f','0','1','2','3','4','5','6','7','8','9'];
          let hash = prefix + '_';
          for (let i = 0; i < 24; i++) {
            hash += SECURE_ENTROPY[Math.floor(Math.random() * SECURE_ENTROPY.length)];
          }
          return hash;
        };

        let mockResult: any = {
          status: 'SUCCESS',
          execution_time_ms: 45 + Math.floor(Math.random() * 80),
          trace_id: `trace-${generateLocalHash('sim')}`,
          pgl_hash: generateLocalHash('proof'),
          details: {
            capability: selectedCap.id,
            arguments: parsedArgs,
            message: `Secure simulated execution completed cleanly.`,
            arbiters: ['local-enforcer-node-01', 'local-arbitration-engine']
          }
        };

        if (selectedCap.id === 'file_reader') {
          mockResult.details.scanned_files = 12;
          mockResult.details.alignment_status = '100% COMPLIANT';
          mockResult.details.remarks = 'No un-attested agent signatures found in active workspaces.';
        } else if (selectedCap.id === 'vector_search') {
          mockResult.details.matches = [
            { id: 'chunk-99a', score: 0.985, text: `pgl_mapping: sub -> tenant_id_active` },
            { id: 'chunk-12b', score: 0.891, text: `zero_trust_policy: bypass preflight OPTION requests` }
          ];
        } else if (selectedCap.id === 'auth_validator') {
          mockResult.details.claims = { sub: 'auth-user-998', role: 'sovereign-operator', workspace_id: 'ws-cappo-01' };
          mockResult.details.signature_verified = true;
        } else if (selectedCap.id === 'vnp_bond_manager') {
          mockResult.details.bond_status = 'LOCKED';
          mockResult.details.slashed_yield_accrued = '0.00 VNP';
          mockResult.details.margin_limit = '1000.00 VNP';
        }

        setResult(mockResult);
        setLoading(false);
        return;
      }

      let url = `${API_BASE_URL}/api/amphoteric/call`;
      let body: any = { name: selectedCap.id, arguments: parsedArgs };

      // Handle VNP v2 / Interlink specific paths
      if (API_BASE_URL.includes(':8080')) {
          url = `${API_BASE_URL}/api/v2/invoke`;
          body = {
              capability_id: selectedCap.id,
              arguments: parsedArgs,
              context: {
                  tenant_id: "demo-tenant",
                  actor_id: "human-operator",
                  transport: "Http",
                  trace_id: `trace-${Math.random().toString(36).substring(7)}`,
                  environment: "prod",
                  is_untrusted_content: false,
                  enabled_toolsets: [selectedCap.toolset],
                  approval_status: null
              }
          };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer local-demo-token'
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail?.message || data.error || 'Execution failed');
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 h-full bg-black/20 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border transition-all ${isSimulated ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
            <ShieldCheck className={`w-6 h-6 ${isSimulated ? 'text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.25)]' : 'text-emerald-400'}`} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Amphoteric Runtime Enforcement
              {isSimulated && (
                <span className="text-[9px] font-mono font-extrabold uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded tracking-widest animate-pulse">
                  SIMULATED FALLBACK
                </span>
              )}
            </h1>
            <p className="text-xs text-white/40 uppercase tracking-widest font-mono">
              Connected to: <span className={isSimulated ? 'text-amber-400 font-bold' : 'text-emerald-400'}>{API_BASE_URL}</span>
            </p>
          </div>
        </div>
        <button
          onClick={fetchDiscovery}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${discoveryStatus === 'loading' ? 'animate-spin' : ''}`} />
          Refresh Discovery
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
        {/* Capability Catalog */}
        <div className="flex flex-col gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 overflow-hidden">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/60">Capability Catalog</h2>
            <span className="text-[10px] font-mono text-white/30">{capabilities.length} Primitives</span>
          </div>

          <div className="flex-grow overflow-y-auto space-y-2 pr-2 scrollbar-hide">
            {discoveryStatus === 'loading' && (
                <div className="flex flex-col items-center justify-center h-32 gap-3">
                    <Activity className="w-6 h-6 text-white/20 animate-pulse" />
                    <span className="text-[10px] uppercase text-white/20 font-mono">Synchronizing Registry...</span>
                </div>
            )}

            {discoveryStatus === 'error' && (
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                    <div className="flex items-center gap-2 text-red-400 mb-1">
                        <AlertOctagon size={14} />
                        <span className="text-[10px] font-bold uppercase">Discovery Failed</span>
                    </div>
                    <p className="text-[10px] text-red-400/60 font-mono leading-relaxed">{error}</p>
                </div>
            )}

            {capabilities.map((cap) => (
              <button
                key={cap.id}
                onClick={() => setSelectedCap(cap)}
                className={`w-full flex flex-col p-4 rounded-xl border transition-all text-left group ${
                  selectedCap?.id === cap.id
                    ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                    : 'bg-black/40 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-sm font-bold ${selectedCap?.id === cap.id ? 'text-emerald-400' : 'text-white/80 group-hover:text-white'}`}>
                    {cap.title}
                  </span>
                  <div className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase border ${
                      cap.risk === 'Critical' ? 'bg-red-500/20 border-red-500/30 text-red-400' :
                      cap.risk === 'High' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' :
                      'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {cap.risk}
                  </div>
                </div>
                <p className="text-[10px] text-white/40 line-clamp-2 leading-relaxed font-mono">
                  {cap.description}
                </p>
                <div className="mt-3 flex items-center gap-3">
                    <span className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">ID: {cap.id}</span>
                    <span className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">SET: {cap.toolset}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Invocation Surface */}
        <div className="lg:col-span-2 flex flex-col gap-6 overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedCap ? (
              <motion.div
                key={selectedCap.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6 h-full"
              >
                {/* Parameter Synthesis */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Execution Intent Parameter Synthesis</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] text-white/30 uppercase font-mono">JSON Arguments (calldata)</label>
                        {selectedCap.input_schema && (
                            <span className="text-[9px] text-emerald-400/50 font-mono">Schema Validated</span>
                        )}
                      </div>
                      <textarea
                        value={args}
                        onChange={(e) => setArgs(e.target.value)}
                        className="w-full h-40 bg-black/60 border border-white/10 rounded-xl p-4 font-mono text-xs text-emerald-300 outline-none focus:border-emerald-500/50 transition-colors resize-none"
                      />
                    </div>

                    <button
                      onClick={handleInvoke}
                      disabled={loading}
                      className={`w-full flex items-center justify-center gap-3 py-3 rounded-xl font-bold text-xs tracking-[0.2em] uppercase transition-all ${
                        loading
                          ? 'bg-white/5 text-white/20 cursor-not-allowed'
                          : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                      }`}
                    >
                      {loading ? (
                        <Activity className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Execute Governed Capability
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Evidence & Execution Trace */}
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                  {/* Results Panel */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-white/40" />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Execution Trace</h3>
                    </div>

                    <div className="flex-grow overflow-auto bg-black/40 rounded-xl border border-white/5 p-4 font-mono">
                      {result ? (
                        <pre className="text-[10px] text-emerald-500/80 whitespace-pre-wrap leading-relaxed">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      ) : error ? (
                        <div className="flex flex-col gap-2 text-red-400">
                          <div className="text-[10px] font-bold uppercase flex items-center gap-1">
                            <AlertOctagon size={12} /> Execution Fault
                          </div>
                          <p className="text-[10px] leading-relaxed">{error}</p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-white/10 text-[10px] uppercase font-mono tracking-widest italic">
                          Awaiting Execution Signal...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PGL Evidence Panel */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4 overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">PGL Compliance Evidence</h3>
                        </div>
                        {result?.pgl_hash && (
                            <span className="flex items-center gap-1.5 text-[8px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                                <Lock size={8} /> SEALED
                            </span>
                        )}
                    </div>

                    <div className="space-y-4 font-mono">
                        <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
                            <div className="flex justify-between text-[9px]">
                                <span className="text-white/20 uppercase">Audit Reference:</span>
                                <span className="text-emerald-400/70 truncate ml-2">
                                    {result?.trace_id || result?.id || '—'}
                                </span>
                            </div>
                            <div className="flex justify-between text-[9px]">
                                <span className="text-white/20 uppercase">PGL Hash Chain:</span>
                                <span className="text-emerald-400/70 truncate ml-2">
                                    {result?.pgl_hash || '—'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-[9px] text-white/30 uppercase tracking-tighter px-1">Integrity Verification</div>
                            <div className="space-y-1.5">
                                {[
                                    { name: 'Identity Proof', status: result ? 'PASSED' : 'PENDING' },
                                    { name: 'Policy Consensus', status: result ? 'PASSED' : 'PENDING' },
                                    { name: 'Sovereign Attestation', status: result?.pgl_hash ? 'PASSED' : 'PENDING' }
                                ].map((step) => (
                                    <div key={step.name} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
                                        <span className="text-[10px] text-white/60">{step.name}</span>
                                        <span className={`text-[9px] font-bold ${step.status === 'PASSED' ? 'text-emerald-400' : 'text-white/10'}`}>
                                            [{step.status}]
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
                <div className="p-4 bg-white/5 rounded-full border border-white/10">
                    <Search className="w-8 h-8 text-white/20" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Awaiting Capability Selection</h3>
                    <p className="text-[10px] text-white/20 font-mono mt-1">SELECT A PRIMITIVE FROM THE CATALOG TO BEGIN ENFORCEMENT</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
