"use client";

import React, { useState, useEffect } from 'react';
import {
 SubstrateNode,
 CapabilityDefinition,
 CAPPOGrant,
 AgentTask,
 PluginModule,
 PGLRecord,
 HRMRRouteResult,
 FPIProvider,
 FPIResourceAllocation,
 FPIExecutionJob,
 FPIBillingSettlement,
} from '@/lib/spine/types';
import {
 INITIAL_SUBSTRATE_NODES,
 CAPABILITY_CATALOG,
 INITIAL_CAPPO_GRANTS,
 INITIAL_PLUGINS,
 INITIAL_AGENT_TASKS,
 INITIAL_PGL_RECORDS,
 INITIAL_FPI_PROVIDERS,
 INITIAL_FPI_ALLOCATIONS,
 INITIAL_FPI_JOBS,
 INITIAL_FPI_SETTLEMENTS,
} from '@/lib/spine/mockData';
import { Header } from '@/components/spine/Header';
import { SubstrateTopology } from '@/components/spine/SubstrateTopology';
import { InvariantSimulator } from '@/components/spine/InvariantSimulator';
import { HerdrAgentEngine } from '@/components/spine/HerdrAgentEngine';
import { PGLLedgerExplorer } from '@/components/spine/PGLLedgerExplorer';
import { APIStudioMCP } from '@/components/spine/APIStudioMCP';
import { FederationProviderInterface } from '@/components/spine/FederationProviderInterface';
import { ArchitectureStackModal } from '@/components/spine/ArchitectureStackModal';

export default function SpineApp() {
 const [activeTab, setActiveTab] = useState<string>('fpi');
 const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
 const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState<boolean>(false);

 // App State
 const [nodes, setNodes] = useState<SubstrateNode[]>(INITIAL_SUBSTRATE_NODES);
 const [capabilities, setCapabilities] = useState<CapabilityDefinition[]>(CAPABILITY_CATALOG);
 const [grants, setGrants] = useState<CAPPOGrant[]>(INITIAL_CAPPO_GRANTS);
 const [tasks, setTasks] = useState<AgentTask[]>(INITIAL_AGENT_TASKS);
 const [plugins, setPlugins] = useState<PluginModule[]>(INITIAL_PLUGINS);
 const [pglRecords, setPglRecords] = useState<PGLRecord[]>(INITIAL_PGL_RECORDS);

 // FPI State
 const [fpiProviders, setFpiProviders] = useState<FPIProvider[]>(INITIAL_FPI_PROVIDERS);
 const [fpiAllocations, setFpiAllocations] = useState<FPIResourceAllocation[]>(INITIAL_FPI_ALLOCATIONS);
 const [fpiJobs, setFpiJobs] = useState<FPIExecutionJob[]>(INITIAL_FPI_JOBS);
 const [fpiSettlements, setFpiSettlements] = useState<FPIBillingSettlement[]>(INITIAL_FPI_SETTLEMENTS);

 const fetchFpiData = async () => {
 try {
 const [provRes, allocRes, jobsRes, billRes] = await Promise.all([
 fetch('/api/fpi/providers'),
 fetch('/api/fpi/resources'),
 fetch('/api/fpi/jobs'),
 fetch('/api/fpi/billing'),
 ]);

 if (provRes.ok) setFpiProviders(await provRes.json());
 if (allocRes.ok) setFpiAllocations(await allocRes.json());
 if (jobsRes.ok) setFpiJobs(await jobsRes.json());
 if (billRes.ok) setFpiSettlements(await billRes.json());
 } catch (err) {
 console.warn('FPI sync warning:', err);
 }
 };

 // Poll health and sync state on mount
 useEffect(() => {
 const fetchInitialData = async () => {
 try {
 const healthRes = await fetch('/api/health');
 if (healthRes.ok) {
 setIsBackendConnected(true);
 }

 const [nodesRes, capsRes, grantsRes, tasksRes, pluginsRes, pglRes] = await Promise.all([
 fetch('/api/substrate/nodes'),
 fetch('/api/substrate/capabilities'),
 fetch('/api/substrate/cappo'),
 fetch('/api/agents'),
 fetch('/api/plugins'),
 fetch('/api/ledger'),
 ]);

 if (nodesRes.ok) setNodes(await nodesRes.json());
 if (capsRes.ok) setCapabilities(await capsRes.json());
 if (grantsRes.ok) setGrants(await grantsRes.json());
 if (tasksRes.ok) setTasks(await tasksRes.json());
 if (pluginsRes.ok) setPlugins(await pluginsRes.json());
 if (pglRes.ok) setPglRecords(await pglRes.json());

 await fetchFpiData();
 } catch (err) {
 console.warn('Backend not yet ready or offline, using fallback state:', err);
 }
 };

 fetchInitialData();
 }, []);

 // Handlers
 const handleToggleNodeStatus = async (nodeId: string, status: 'online' | 'degraded' | 'offline') => {
 setNodes((prev) =>
 prev.map((n) => (n.id === nodeId ? { ...n, status } : n))
 );

 try {
 await fetch('/api/substrate/nodes/toggle', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ nodeId, status }),
 });
 } catch (err) {
 console.error('Failed to sync node status toggle:', err);
 }
 };

 const handleUpdateNodeLatency = async (nodeId: string, latencyMs: number) => {
 setNodes((prev) =>
 prev.map((n) => (n.id === nodeId ? { ...n, latencyMs } : n))
 );

 try {
 await fetch('/api/substrate/nodes/toggle', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ nodeId, latencyMs }),
 });
 } catch (err) {
 console.error('Failed to sync node latency:', err);
 }
 };

 const handleExecuteRoute = async (
 capabilityId: string,
 cappoGrantId: string,
 preferredNodeId: string,
 force503NodeId?: string,
 invalidCappo?: boolean
 ): Promise<HRMRRouteResult> => {
 const res = await fetch('/api/substrate/route', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 capabilityId,
 cappoGrantId,
 preferredNodeId,
 force503NodeId,
 invalidCappo,
 }),
 });

 const data: HRMRRouteResult = await res.json();

 try {
 const pglRes = await fetch('/api/ledger');
 if (pglRes.ok) setPglRecords(await pglRes.json());
 } catch (err) {
 console.warn('Ledger refresh failed:', err);
 }

 return data;
 };

 const handleTriggerAgentStep = async (taskId: string, userPrompt?: string) => {
 try {
 const res = await fetch('/api/agents/step', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ taskId, userPrompt }),
 });

 if (res.ok) {
 const data = await res.json();
 setTasks((prev) =>
 prev.map((t) => (t.id === taskId ? data.task : t))
 );
 }
 } catch (err) {
 console.error('Failed agent step:', err);
 }
 };

 const handleTogglePlugin = async (pluginId: string, enabled: boolean) => {
 setPlugins((prev) =>
 prev.map((p) => (p.id === pluginId ? { ...p, enabled } : p))
 );

 try {
 await fetch('/api/plugins/toggle', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ pluginId, enabled }),
 });
 } catch (err) {
 console.error('Failed to toggle plugin:', err);
 }
 };

 return (
 <div className="min-h-screen bg-theme-surface text-slate-100 font-sans selection:bg-theme-accent selection:text-white pb-16">
 <Header
 activeTab={activeTab}
 setActiveTab={setActiveTab}
 isBackendConnected={isBackendConnected}
 onOpenArchitectureModal={() => setIsArchitectureModalOpen(true)}
 pglCount={pglRecords.length}
 />

 <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
 {activeTab === 'fpi' && (
 <FederationProviderInterface
 providers={fpiProviders}
 allocations={fpiAllocations}
 jobs={fpiJobs}
 settlements={fpiSettlements}
 capabilities={capabilities}
 onRefreshData={fetchFpiData}
 />
 )}

 {activeTab === 'topology' && (
 <SubstrateTopology
 nodes={nodes}
 onToggleNodeStatus={handleToggleNodeStatus}
 onUpdateNodeLatency={handleUpdateNodeLatency}
 />
 )}

 {activeTab === 'simulator' && (
 <InvariantSimulator
 nodes={nodes}
 capabilities={capabilities}
 grants={grants}
 onExecuteRoute={handleExecuteRoute}
 />
 )}

 {activeTab === 'herdr' && (
 <HerdrAgentEngine
 tasks={tasks}
 plugins={plugins}
 onTriggerAgentStep={handleTriggerAgentStep}
 onTogglePlugin={handleTogglePlugin}
 />
 )}

 {activeTab === 'ledger' && <PGLLedgerExplorer records={pglRecords} />}

 {activeTab === 'api' && <APIStudioMCP capabilities={capabilities} />}
 </main>

 <ArchitectureStackModal
 isOpen={isArchitectureModalOpen}
 onClose={() => setIsArchitectureModalOpen(false)}
 />
 </div>
 );
}
