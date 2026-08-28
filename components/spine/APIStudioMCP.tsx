import React, { useState } from 'react';
import { CapabilityDefinition, MCPTool } from '@/lib/spine/types';
import { Terminal, Copy, Check, Play, Code, Cpu, ExternalLink, RefreshCw } from 'lucide-react';

interface APIStudioMCPProps {
 capabilities: CapabilityDefinition[];
}

export const APIStudioMCP: React.FC<APIStudioMCPProps> = ({ capabilities }) => {
 const [activeTab, setActiveTab] = useState<'rest' | 'mcp' | 'openapi'>('rest');
 const [copied, setCopied] = useState<boolean>(false);

 // REST Tester State
 const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/substrate/route');
 const [restPayload, setRestPayload] = useState<string>(
 JSON.stringify(
 {
 capabilityId: 'cap-compute-v1',
 cappoGrantId: 'cappo-grant-alpha-001',
 preferredNodeId: 'node-local-k8s',
 payload: { command: 'run_stateless_workload', memoryMb: 512 },
 },
 null,
 2
 )
 );
 const [restResponse, setRestResponse] = useState<string>('');
 const [isSendingRest, setIsSendingRest] = useState<boolean>(false);

 // MCP Tester State
 const [mcpMethod, setMcpMethod] = useState<'tools/list' | 'tools/call'>('tools/list');
 const [mcpToolName, setMcpToolName] = useState<string>('substrate_execute_workload');
 const [mcpToolArgs, setMcpToolArgs] = useState<string>(
 JSON.stringify({ command: 'echo"Hello Computless Cloud"', timeoutMs: 3000 }, null, 2)
 );
 const [mcpResponse, setMcpResponse] = useState<string>('');
 const [isSendingMcp, setIsSendingMcp] = useState<boolean>(false);

 const handleSendRest = async () => {
 setIsSendingRest(true);
 try {
 const res = await fetch(selectedEndpoint, {
 method: selectedEndpoint === '/api/substrate/route' ? 'POST' : 'GET',
 headers: { 'Content-Type': 'application/json' },
 body: selectedEndpoint === '/api/substrate/route' ? restPayload : undefined,
 });
 const data = await res.json();
 setRestResponse(JSON.stringify(data, null, 2));
 } catch (err) {
 setRestResponse(JSON.stringify({ error: String(err) }, null, 2));
 } finally {
 setIsSendingRest(false);
 }
 };

 const handleSendMcp = async () => {
 setIsSendingMcp(true);
 try {
 let argsObj = {};
 if (mcpMethod === 'tools/call') {
 try {
 argsObj = JSON.parse(mcpToolArgs);
 } catch (e) {
 console.warn('Invalid JSON in args:', e);
 }
 }

 const mcpPayload = {
 jsonrpc: '2.0',
 method: mcpMethod,
 params:
 mcpMethod === 'tools/call'
 ? { name: mcpToolName, arguments: argsObj }
 : {},
 id: 'mcp-req-' + Date.now().toString().slice(-4),
 };

 const res = await fetch('/api/mcp', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(mcpPayload),
 });
 const data = await res.json();
 setMcpResponse(JSON.stringify(data, null, 2));
 } catch (err) {
 setMcpResponse(JSON.stringify({ error: String(err) }, null, 2));
 } finally {
 setIsSendingMcp(false);
 }
 };

 const generatedCurl = `curl -X POST"${window.location.origin}/api/substrate/route" \\
 -H"Content-Type: application/json" \\
 -H"Authorization: Bearer cappo-grant-alpha-001" \\
 -d '${restPayload.replace(/\n/g, '')}'`;

 const copyCurl = () => {
 navigator.clipboard.writeText(generatedCurl);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 };

 return (
 <div className="space-y-6">
 {/* Banner */}
 <div className="bg-theme-surface border border-theme-border rounded-xl p-6 shadow-sm">
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
 <div>
 <div className="flex items-center space-x-2">
 <span className="px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-theme-accent/10 text-theme-accent border border-theme-border">
 REST &amp; MCP PROTOCOL CONSOLE
 </span>
 <span className="text-xs text-slate-400 font-mono">Portable Substrate Interop</span>
 </div>
 <h2 className="text-xl font-bold text-white mt-1">
 API Documentation, cURL Generator &amp; MCP Test Bench
 </h2>
 <p className="text-sm text-slate-300 mt-1 max-w-3xl">
 Utilizing standard REST and HTTP for inter-service communication with CAPPO security headers. Model Context Protocol (MCP) JSON-RPC support enhances microservices architecture efficiency.
 </p>
 </div>

 <div className="flex space-x-2 bg-theme-surface p-1.5 rounded-lg border border-theme-border font-mono text-xs">
 <button
 onClick={() => setActiveTab('rest')}
 className={`px-3 py-1.5 rounded transition cursor-pointer ${
 activeTab === 'rest' ? 'bg-theme-accent text-white font-bold' : 'text-slate-400 hover:text-slate-200'
 }`}
 >
 REST HTTP Console
 </button>
 <button
 onClick={() => setActiveTab('mcp')}
 className={`px-3 py-1.5 rounded transition cursor-pointer ${
 activeTab === 'mcp' ? 'bg-theme-accent text-white font-bold' : 'text-slate-400 hover:text-slate-200'
 }`}
 >
 MCP (JSON-RPC 2.0)
 </button>
 <button
 onClick={() => setActiveTab('openapi')}
 className={`px-3 py-1.5 rounded transition cursor-pointer ${
 activeTab === 'openapi' ? 'bg-theme-accent text-white font-bold' : 'text-slate-400 hover:text-slate-200'
 }`}
 >
 OpenAPI Spec
 </button>
 </div>
 </div>
 </div>

 {activeTab === 'rest' && (
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 {/* Request Form */}
 <div className="lg:col-span-6 bg-theme-surface border border-theme-border rounded-xl p-6 space-y-4">
 <div className="flex justify-between items-center">
 <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono">
 HTTP Request Builder
 </h3>
 <button
 onClick={copyCurl}
 className="px-2.5 py-1 bg-theme-surface border border-theme-border hover:border-theme-border text-slate-300 rounded text-xs font-mono transition flex items-center space-x-1 cursor-pointer"
 >
 {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
 <span>{copied ? 'Copied cURL' : 'Copy cURL'}</span>
 </button>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-mono text-slate-400">Select API Endpoint</label>
 <select
 value={selectedEndpoint}
 onChange={(e) => setSelectedEndpoint(e.target.value)}
 className="w-full bg-theme-surface border border-theme-border rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-theme-border"
 >
 <option value="/api/substrate/route">POST /api/substrate/route (HRMR Router)</option>
 <option value="/api/substrate/nodes">GET /api/substrate/nodes (Nodes List)</option>
 <option value="/api/substrate/capabilities">GET /api/substrate/capabilities (Catalog)</option>
 <option value="/api/health">GET /api/health (Substrate Health)</option>
 </select>
 </div>

 {selectedEndpoint === '/api/substrate/route' && (
 <div className="space-y-1.5">
 <label className="text-xs font-mono text-slate-400">JSON Payload</label>
 <textarea
 rows={8}
 value={restPayload}
 onChange={(e) => setRestPayload(e.target.value)}
 className="w-full bg-theme-surface border border-theme-border rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-theme-border"
 />
 </div>
 )}

 <button
 onClick={handleSendRest}
 disabled={isSendingRest}
 className="w-full py-3 bg-theme-accent hover:bg-theme-accent text-white font-semibold text-xs rounded-lg transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
 >
 {isSendingRest ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
 <span>Send HTTP Request</span>
 </button>
 </div>

 {/* Response Console */}
 <div className="lg:col-span-6 bg-theme-surface border border-theme-border rounded-xl p-6 space-y-4">
 <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center space-x-2">
 <Terminal className="h-4 w-4 text-emerald-400" />
 <span>HTTP Response Output</span>
 </h3>

 <pre className="p-4 bg-theme-surface border border-theme-border rounded-lg text-xs font-mono text-emerald-300 max-h-[420px] overflow-auto leading-relaxed">
 {restResponse || '// Send a request to observe real HTTP response headers and JSON output.'}
 </pre>
 </div>
 </div>
 )}

 {activeTab === 'mcp' && (
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 {/* MCP Builder */}
 <div className="lg:col-span-6 bg-theme-surface border border-theme-border rounded-xl p-6 space-y-4">
 <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono">
 MCP JSON-RPC 2.0 Test Bench
 </h3>

 <div className="space-y-2">
 <label className="text-xs font-mono text-slate-400">MCP Method</label>
 <div className="flex space-x-2 font-mono text-xs">
 <button
 onClick={() => setMcpMethod('tools/list')}
 className={`flex-1 py-2 rounded-lg border cursor-pointer ${
 mcpMethod === 'tools/list'
 ? 'bg-theme-accent text-white border-theme-border font-bold'
 : 'bg-theme-surface text-slate-400 border-theme-border'
 }`}
 >
 tools/list
 </button>
 <button
 onClick={() => setMcpMethod('tools/call')}
 className={`flex-1 py-2 rounded-lg border cursor-pointer ${
 mcpMethod === 'tools/call'
 ? 'bg-theme-accent text-white border-theme-border font-bold'
 : 'bg-theme-surface text-slate-400 border-theme-border'
 }`}
 >
 tools/call
 </button>
 </div>
 </div>

 {mcpMethod === 'tools/call' && (
 <div className="space-y-3">
 <div className="space-y-1">
 <label className="text-xs font-mono text-slate-400">Tool Name</label>
 <select
 value={mcpToolName}
 onChange={(e) => setMcpToolName(e.target.value)}
 className="w-full bg-theme-surface border border-theme-border rounded-lg p-2.5 text-xs font-mono text-slate-200"
 >
 <option value="substrate_execute_workload">substrate_execute_workload</option>
 <option value="substrate_persist_evidence">substrate_persist_evidence</option>
 <option value="herdr_trigger_agent_recursion">herdr_trigger_agent_recursion</option>
 </select>
 </div>

 <div className="space-y-1">
 <label className="text-xs font-mono text-slate-400">Tool Arguments (JSON)</label>
 <textarea
 rows={5}
 value={mcpToolArgs}
 onChange={(e) => setMcpToolArgs(e.target.value)}
 className="w-full bg-theme-surface border border-theme-border rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-theme-border"
 />
 </div>
 </div>
 )}

 <button
 onClick={handleSendMcp}
 disabled={isSendingMcp}
 className="w-full py-3 bg-theme-accent hover:bg-theme-accent text-white font-semibold text-xs rounded-lg transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
 >
 {isSendingMcp ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
 <span>Send MCP Request</span>
 </button>
 </div>

 {/* MCP Response */}
 <div className="lg:col-span-6 bg-theme-surface border border-theme-border rounded-xl p-6 space-y-4">
 <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center space-x-2">
 <Terminal className="h-4 w-4 text-theme-accent" />
 <span>MCP Protocol Output</span>
 </h3>

 <pre className="p-4 bg-theme-surface border border-theme-border rounded-lg text-xs font-mono text-theme-accent/70 max-h-[420px] overflow-auto leading-relaxed">
 {mcpResponse || '// Execute tools/list or tools/call to inspect JSON-RPC 2.0 response.'}
 </pre>
 </div>
 </div>
 )}

 {activeTab === 'openapi' && (
 <div className="bg-theme-surface border border-theme-border rounded-xl p-6 space-y-4 font-mono text-xs">
 <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
 <Code className="h-4 w-4 text-theme-accent" />
 <span>OpenAPI 3.0 Substrate Specification Preview</span>
 </h3>

 <pre className="p-4 bg-theme-surface border border-theme-border rounded-lg text-slate-300 max-h-[450px] overflow-auto leading-relaxed">
{`openapi: 3.0.3
info:
 title: Computless Cloud Substrate API
 description: Universal governance layer implementing HRMR routing, CAPPO authority, and PGL evidence ledger.
 version: 1.0.0
paths:
 /api/substrate/route:
 post:
 summary: HRMR Capability Router
 description: Routes capability workload to preferred or fallback substrate node.
 parameters:
 - in: header
 name: Authorization
 schema:
 type: string
 required: true
 description: CAPPO Grant authorization token
 requestBody:
 required: true
 content:
 application/json:
 schema:
 type: object
 properties:
 capabilityId:
 type: string
 preferredNodeId:
 type: string
 payload:
 type: object
 responses:
 '200':
 description: Execution successful or rerouted via fallback.
 '403':
 description: Terminal Authority Denial (Invariant 1 enforced).
 '503':
 description: Infrastructure failure across all nodes.`}
 </pre>
 </div>
 )}
 </div>
 );
};
