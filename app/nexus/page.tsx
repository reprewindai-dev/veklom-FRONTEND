"use client";

import React, { useState } from 'react';
import { Terminal, Database, Send, History, Search } from 'lucide-react';

export default function NexusMcpConsole() {
  const [activeTab, setActiveTab] = useState<'discovery' | 'introspect' | 'forge' | 'ledger'>('introspect');

  return (
    <div className="min-h-screen bg-[#050505] text-[#E6E6E9] font-sans flex flex-col">
      {/* Console Header */}
      <header className="px-6 py-4 border-b border-[#242424] flex justify-between items-center bg-[#0A0A0A]">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-[#00E5FF]" />
          <h1 className="font-mono font-medium tracking-wide">NEXUS<span className="text-[#6E6E73]">::MCP_CONSOLE</span></h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse"></div>
          <span className="text-xs font-mono text-[#A1A1A6]">SERVER_ONLINE</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-64 border-r border-[#242424] bg-[#0A0A0A] p-4 flex flex-col gap-2">
          <button onClick={() => setActiveTab('discovery')} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-mono transition-colors ${activeTab === 'discovery' ? 'bg-[#1F1F1F] text-[#00E5FF]' : 'text-[#A1A1A6] hover:text-white hover:bg-[#171717]'}`}>
            <Search className="w-4 h-4" /> Discovery Flow
          </button>
          <button onClick={() => setActiveTab('introspect')} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-mono transition-colors ${activeTab === 'introspect' ? 'bg-[#1F1F1F] text-[#00E5FF]' : 'text-[#A1A1A6] hover:text-white hover:bg-[#171717]'}`}>
            <Database className="w-4 h-4" /> Introspect Catalog
          </button>
          <button onClick={() => setActiveTab('forge')} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-mono transition-colors ${activeTab === 'forge' ? 'bg-[#1F1F1F] text-[#00E5FF]' : 'text-[#A1A1A6] hover:text-white hover:bg-[#171717]'}`}>
            <Send className="w-4 h-4" /> Request Forge
          </button>
          <button onClick={() => setActiveTab('ledger')} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-mono transition-colors ${activeTab === 'ledger' ? 'bg-[#1F1F1F] text-[#00E5FF]' : 'text-[#A1A1A6] hover:text-white hover:bg-[#171717]'}`}>
            <History className="w-4 h-4" /> PGL Ledger
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-[#0A0A0C] p-6 overflow-y-auto relative">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
          
          <div className="relative z-10 max-w-5xl mx-auto">
            
            {activeTab === 'discovery' && (
              <div className="space-y-6 animate-in fade-in">
                <h2 className="text-xl font-mono text-white border-b border-[#242424] pb-2">Agent Discovery Protocol</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-[#121215] border border-[#242424] rounded-lg p-5 shadow-sm">
                    <h3 className="font-mono text-sm text-[#00E5FF] mb-4">1. GET /.well-known/agent-card.json</h3>
                    <pre className="text-xs text-[#A1A1A6] overflow-x-auto bg-[#0A0A0A] p-4 rounded border border-[#333333]">
{`{
  "protocol": "mcp-uacp-v1",
  "identity": "nexus-us-east-core",
  "capabilities": ["gov.execute", "pgl.attest"],
  "endpoints": {
    "mcp": "https://mcp.veklom.com/v1"
  },
  "settlement": "x402"
}`}
                    </pre>
                  </div>
                  <div className="bg-[#121215] border border-[#242424] rounded-lg p-5 shadow-sm flex flex-col justify-center gap-6">
                     <div className="flex justify-between items-center text-sm font-mono">
                       <span className="text-[#A1A1A6]">2. POST /mcp (tools/list)</span>
                       <span className="px-2 py-1 bg-[#171717] rounded text-xs">Free</span>
                     </div>
                     <div className="h-px bg-[#242424] w-full relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#A1A1A6]"></div>
                     </div>
                     <div className="flex justify-between items-center text-sm font-mono">
                       <span className="text-[#00E5FF]">3. POST /mcp (tools/call)</span>
                       <span className="px-2 py-1 bg-[#FFB800]/10 text-[#FFB800] rounded text-xs border border-[#FFB800]/20">Requires x402</span>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'introspect' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center border-b border-[#242424] pb-2">
                  <h2 className="text-xl font-mono text-white">Tool Catalog</h2>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1A6]" />
                    <input type="text" placeholder="Filter tools..." className="bg-[#121215] border border-[#333333] rounded-md pl-9 pr-4 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-[#00E5FF] transition-colors" />
                  </div>
                </div>

                <div className="grid gap-4">
                  {/* Tool Card */}
                  <div className="bg-[#121215] border border-[#242424] rounded-lg p-5 hover:border-[#333333] transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-mono text-[#00E5FF] text-lg">evaluate_repository</h3>
                        <p className="text-sm text-[#A1A1A6] mt-1">Performs an AST-level zero-trust evaluation on a target repository.</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                         <span className="px-2 py-1 bg-[#171717] rounded text-xs font-mono border border-[#333333]">Tier: Compute</span>
                         <span className="px-2 py-1 bg-[#00FF66]/10 text-[#00FF66] rounded text-xs font-mono border border-[#00FF66]/20">PGL: Immutable</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs font-mono text-[#6E6E73] mb-2">inputSchema:</p>
                      <pre className="text-xs text-[#E6E6E9] bg-[#0A0A0A] p-3 rounded border border-[#242424] overflow-x-auto">
{`{
  "type": "object",
  "properties": {
    "repo_url": { "type": "string" },
    "branch": { "type": "string", "default": "main" }
  },
  "required": ["repo_url"]
}`}
                      </pre>
                    </div>
                  </div>
                  
                  {/* Tool Card 2 */}
                  <div className="bg-[#121215] border border-[#242424] rounded-lg p-5 hover:border-[#333333] transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-mono text-[#00E5FF] text-lg">mint_identity</h3>
                        <p className="text-sm text-[#A1A1A6] mt-1">Generates an ephemeral Execution Identity for a workload.</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                         <span className="px-2 py-1 bg-[#171717] rounded text-xs font-mono border border-[#333333]">Tier: Action</span>
                         <span className="px-2 py-1 bg-[#00FF66]/10 text-[#00FF66] rounded text-xs font-mono border border-[#00FF66]/20">PGL: Ephemeral</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'forge' && (
              <div className="space-y-6 animate-in fade-in">
                 <h2 className="text-xl font-mono text-white border-b border-[#242424] pb-2">Request Forge</h2>
                 <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                     <div>
                       <label className="block text-xs font-mono text-[#A1A1A6] mb-1">Tool Selection</label>
                       <select className="w-full bg-[#121215] border border-[#333333] rounded-md px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#00E5FF]">
                         <option>evaluate_repository</option>
                         <option>mint_identity</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-xs font-mono text-[#A1A1A6] mb-1">Parameters (JSON)</label>
                       <textarea className="w-full h-32 bg-[#121215] border border-[#333333] rounded-md p-3 text-sm font-mono text-[#E6E6E9] focus:outline-none focus:border-[#00E5FF]" defaultValue={`{\n  "repo_url": "https://github.com/veklom/core"\n}`}></textarea>
                     </div>
                     <div>
                       <label className="block text-xs font-mono text-[#FFB800] mb-1">Payment-Signature (x402)</label>
                       <input type="text" className="w-full bg-[#121215] border border-[#FFB800]/30 rounded-md px-3 py-2 text-sm font-mono text-[#FFB800] focus:outline-none focus:border-[#FFB800]" defaultValue="sig_e2d3f4a1..." />
                     </div>
                     <button className="w-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 hover:bg-[#00E5FF]/20 rounded-md py-2 font-mono text-sm transition-colors flex items-center justify-center gap-2">
                       <Send className="w-4 h-4" /> EXECUTE TOOL
                     </button>
                   </div>
                   
                   <div className="bg-[#121215] border border-[#242424] rounded-lg p-4 flex flex-col">
                     <h3 className="text-xs font-mono text-[#A1A1A6] mb-2 border-b border-[#333333] pb-2">Response Terminal</h3>
                     <pre className="flex-1 text-xs text-[#00FF66] overflow-x-auto p-2 font-mono mt-2">
{`> Initializing request...
> Verifying x402 signature... [OK]
> Budget check passed.
> Executing 'evaluate_repository'...

{
  "status": "success",
  "result": {
    "ast_clean": true,
    "violations": 0
  },
  "evidence_hash": "0x8f3c...9a21"
}`}
                     </pre>
                   </div>
                 </div>
              </div>
            )}

            {activeTab === 'ledger' && (
              <div className="space-y-6 animate-in fade-in">
                 <h2 className="text-xl font-mono text-white border-b border-[#242424] pb-2">PGL Receipt Ledger</h2>
                 <div className="bg-[#121215] border border-[#242424] rounded-lg overflow-hidden">
                   <table className="w-full text-left text-sm font-mono">
                     <thead className="bg-[#171717] border-b border-[#333333]">
                       <tr>
                         <th className="px-4 py-3 text-[#A1A1A6] font-normal">Timestamp</th>
                         <th className="px-4 py-3 text-[#A1A1A6] font-normal">Tool</th>
                         <th className="px-4 py-3 text-[#A1A1A6] font-normal">Evidence Hash</th>
                         <th className="px-4 py-3 text-[#A1A1A6] font-normal">Status</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-[#242424]">
                       <tr className="hover:bg-[#1A1A1A] transition-colors">
                         <td className="px-4 py-3 text-[#E6E6E9]">2026-08-10 14:02:11</td>
                         <td className="px-4 py-3 text-[#00E5FF]">evaluate_repository</td>
                         <td className="px-4 py-3 text-[#6E6E73] truncate max-w-[150px]">0x8f3c...9a21</td>
                         <td className="px-4 py-3"><span className="text-[#00FF66]">Settled</span></td>
                       </tr>
                       <tr className="hover:bg-[#1A1A1A] transition-colors">
                         <td className="px-4 py-3 text-[#E6E6E9]">2026-08-10 13:45:00</td>
                         <td className="px-4 py-3 text-[#00E5FF]">mint_identity</td>
                         <td className="px-4 py-3 text-[#6E6E73] truncate max-w-[150px]">0x2b1d...4f99</td>
                         <td className="px-4 py-3"><span className="text-[#00FF66]">Settled</span></td>
                       </tr>
                       <tr className="hover:bg-[#1A1A1A] transition-colors">
                         <td className="px-4 py-3 text-[#E6E6E9]">2026-08-10 11:20:30</td>
                         <td className="px-4 py-3 text-[#00E5FF]">read_logs</td>
                         <td className="px-4 py-3 text-[#6E6E73] truncate max-w-[150px]">0x9a8b...1c2d</td>
                         <td className="px-4 py-3"><span className="text-[#FFB800]">Pending</span></td>
                       </tr>
                     </tbody>
                   </table>
                 </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
