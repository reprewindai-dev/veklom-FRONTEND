import React, { useState, useMemo } from 'react';
import {
 Globe,
 Server,
 Cpu,
 Zap,
 ShieldCheck,
 FileText,
 CheckCircle2,
 AlertTriangle,
 Clock,
 Coins,
 Terminal,
 ArrowRight,
 PlusCircle,
 Search,
 RefreshCw,
 Layers,
 Download,
 Copy,
 ExternalLink,
 Database,
 Activity,
 Play,
 Sliders,
 Check,
 BookOpen,
 History,
} from 'lucide-react';
import {
 FPIProvider,
 FPIResourceAllocation,
 FPIExecutionJob,
 FPIBillingSettlement,
 FPIDiscoveryQuery,
 CapabilityDefinition,
} from '@/lib/spine/types';

interface FederationProviderInterfaceProps {
 providers: FPIProvider[];
 allocations: FPIResourceAllocation[];
 jobs: FPIExecutionJob[];
 settlements: FPIBillingSettlement[];
 capabilities: CapabilityDefinition[];
 onRefreshData: () => void;
}

export const FederationProviderInterface: React.FC<FederationProviderInterfaceProps> = ({
 providers,
 allocations,
 jobs,
 settlements,
 capabilities,
 onRefreshData,
}) => {
 const [activeSubTab, setActiveSubTab] = useState<
 'overview_spec' | 'lineage' | 'providers' | 'discovery' | 'allocations' | 'execution' | 'billing' | 'sdk_code'
 >('overview_spec');

 // Form State - Register Provider
 const [showRegForm, setShowRegForm] = useState(false);
 const [regName, setRegName] = useState('');
 const [regType, setRegType] = useState<'hyperscaler' | 'sovereign_enclave' | 'decentralized_mesh' | 'edge_telecom'>('hyperscaler');
 const [regEndpoint, setRegEndpoint] = useState('https://fpi.custom-provider.cloud/v1');
 const [regRegions, setRegRegions] = useState('us-east-1, eu-central-1');
 const [regLatency, setRegLatency] = useState(20);
 const [regPrice, setRegPrice] = useState(0.0008);
 const [regSovereign, setRegSovereign] = useState(false);
 const [regMsg, setRegMsg] = useState('');

 // Form State - Service Discovery
 const [discCap, setDiscCap] = useState('cap-compute-v1');
 const [discRegion, setDiscRegion] = useState('');
 const [discMaxLatency, setDiscMaxLatency] = useState<number | ''>(50);
 const [discSovereign, setDiscSovereign] = useState(false);
 const [discMaxPrice, setDiscMaxPrice] = useState<number | ''>(0.002);
 const [discResults, setDiscResults] = useState<FPIProvider[] | null>(null);
 const [isDiscovering, setIsDiscovering] = useState(false);

 // Form State - Resource Allocation
 const [showAllocModal, setShowAllocModal] = useState(false);
 const [allocProviderId, setAllocProviderId] = useState('');
 const [allocUnits, setAllocUnits] = useState(100);
 const [allocMemory, setAllocMemory] = useState(128);
 const [allocGpu, setAllocGpu] = useState(4);
 const [allocType, setAllocType] = useState<'reserved' | 'spot' | 'on_demand'>('reserved');
 const [allocDuration, setAllocDuration] = useState(120); // 2 hours
 const [allocSubject, setAllocSubject] = useState('agent:herdr-autonomous-core');
 const [allocMsg, setAllocMsg] = useState('');

 // Form State - Federated Execution
 const [execProviderId, setExecProviderId] = useState('');
 const [execCapId, setExecCapId] = useState('cap-compute-v1');
 const [execGrantId, setExecGrantId] = useState('cappo-grant-alpha-001');
 const [execPayloadText, setExecPayloadText] = useState('{\n"workload":"InferenceModel-v4",\n"epochs": 100\n}');
 const [execForceFallback, setExecForceFallback] = useState(false);
 const [execResult, setExecResult] = useState<any | null>(null);
 const [isExecuting, setIsExecuting] = useState(false);

 // Form State - Settle Billing
 const [settleMsg, setSettleMsg] = useState('');

 // SDK Code Snippet Tab Selection
 const [sdkLang, setSdkLang] = useState<'typescript' | 'python' | 'curl' | 'openapi'>('typescript');
 const [copiedCode, setCopiedCode] = useState(false);

 // Aggregate provider economic finality summary calculations
 const providerSummaryMap = useMemo(() => {
 const map = new Map<
 string,
 {
 providerId: string;
 providerName: string;
 providerType?: string;
 settledVEK: number;
 pendingVEK: number;
 totalVEK: number;
 jobsExecuted: number;
 computeUnitsUsed: number;
 settledCount: number;
 pendingCount: number;
 pendingSettlementIds: string[];
 latestTxHash?: string;
 }
 >();

 // Pre-populate with all known registered providers
 providers.forEach((p) => {
 map.set(p.id, {
 providerId: p.id,
 providerName: p.providerName,
 providerType: p.providerType,
 settledVEK: 0,
 pendingVEK: 0,
 totalVEK: 0,
 jobsExecuted: 0,
 computeUnitsUsed: 0,
 settledCount: 0,
 pendingCount: 0,
 pendingSettlementIds: [],
 latestTxHash: undefined,
 });
 });

 // Accumulate from settlements
 settlements.forEach((s) => {
 let entry = map.get(s.providerId);
 if (!entry) {
 entry = {
 providerId: s.providerId,
 providerName: s.providerName,
 providerType: 'hyperscaler',
 settledVEK: 0,
 pendingVEK: 0,
 totalVEK: 0,
 jobsExecuted: 0,
 computeUnitsUsed: 0,
 settledCount: 0,
 pendingCount: 0,
 pendingSettlementIds: [],
 latestTxHash: undefined,
 };
 map.set(s.providerId, entry);
 }

 if (s.payoutStatus === 'settled') {
 entry.settledVEK += s.totalx402EarnedVEK;
 entry.settledCount += 1;
 if (!entry.latestTxHash && s.payoutTxHash) {
 entry.latestTxHash = s.payoutTxHash;
 }
 } else {
 entry.pendingVEK += s.totalx402EarnedVEK;
 entry.pendingCount += 1;
 entry.pendingSettlementIds.push(s.id);
 }

 entry.totalVEK += s.totalx402EarnedVEK;
 entry.jobsExecuted += s.jobsExecuted;
 entry.computeUnitsUsed += s.totalComputeUnitsUsed;
 });

 return Array.from(map.values());
 }, [providers, settlements]);

 const globalTotalSettledVEK = useMemo(
 () => providerSummaryMap.reduce((acc, p) => acc + p.settledVEK, 0),
 [providerSummaryMap]
 );
 const globalTotalPendingVEK = useMemo(
 () => providerSummaryMap.reduce((acc, p) => acc + p.pendingVEK, 0),
 [providerSummaryMap]
 );
 const globalGrandTotalVEK = globalTotalSettledVEK + globalTotalPendingVEK;
 const globalFinalityRate =
 globalGrandTotalVEK > 0
 ? ((globalTotalSettledVEK / globalGrandTotalVEK) * 100).toFixed(1)
 : '100.0';

 // Handlers
 const handleRegisterProvider = async (e: React.FormEvent) => {
 e.preventDefault();
 setRegMsg('');
 try {
 const res = await fetch('/api/fpi/providers/register', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 providerName: regName,
 providerType: regType,
 endpointUrl: regEndpoint,
 regions: regRegions.split(',').map((r) => r.trim()).filter(Boolean),
 maxLatencyMs: Number(regLatency),
 pricePerComputeUnitVEK: Number(regPrice),
 isSovereignEnclave: regSovereign,
 supportedCapabilities: ['cap-compute-v1', 'cap-db-persist'],
 }),
 });
 const data = await res.json();
 if (res.ok) {
 setRegMsg(`Provider"${data.provider.providerName}" registered! Key: ${data.provider.authKeyHash}`);
 setRegName('');
 setShowRegForm(false);
 onRefreshData();
 } else {
 setRegMsg(`Error: ${data.error}`);
 }
 } catch (err: any) {
 setRegMsg(`Error registering: ${err.message}`);
 }
 };

 const handleDiscoveryQuery = async () => {
 setIsDiscovering(true);
 try {
 const res = await fetch('/api/fpi/discovery', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 capabilityId: discCap || undefined,
 region: discRegion || undefined,
 maxLatencyMs: discMaxLatency === '' ? undefined : Number(discMaxLatency),
 isSovereignRequired: discSovereign,
 maxPricePerUnitVEK: discMaxPrice === '' ? undefined : Number(discMaxPrice),
 }),
 });
 const data = await res.json();
 setDiscResults(data.matchedProviders || []);
 } catch (err) {
 console.error('Discovery query failed:', err);
 } finally {
 setIsDiscovering(false);
 }
 };

 const handleAllocateResource = async (e: React.FormEvent) => {
 e.preventDefault();
 setAllocMsg('');
 try {
 const res = await fetch('/api/fpi/resources/allocate', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 providerId: allocProviderId || providers[0]?.id,
 granteeSubject: allocSubject,
 computeUnits: Number(allocUnits),
 memoryGb: Number(allocMemory),
 gpuCores: Number(allocGpu),
 allocationType: allocType,
 leaseDurationMinutes: Number(allocDuration),
 }),
 });
 const data = await res.json();
 if (res.ok) {
 setAllocMsg(`Lease allocated: ID ${data.allocation.id} (${data.allocation.x402TotalLeaseCostVEK} VEK)`);
 setShowAllocModal(false);
 onRefreshData();
 } else {
 setAllocMsg(`Allocation Failed: ${data.error}`);
 }
 } catch (err: any) {
 setAllocMsg(`Error: ${err.message}`);
 }
 };

 const handleDeallocate = async (allocationId: string) => {
 try {
 await fetch('/api/fpi/resources/deallocate', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ allocationId }),
 });
 onRefreshData();
 } catch (err) {
 console.error('Deallocate failed:', err);
 }
 };

 const handleExecuteFederatedJob = async () => {
 setIsExecuting(true);
 setExecResult(null);
 let parsedPayload = {};
 try {
 parsedPayload = JSON.parse(execPayloadText);
 } catch {
 parsedPayload = { raw: execPayloadText };
 }

 try {
 const res = await fetch('/api/fpi/execute', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 providerId: execProviderId || providers[0]?.id,
 capabilityId: execCapId,
 cappoGrantId: execGrantId,
 payload: parsedPayload,
 forceFallback: execForceFallback,
 }),
 });
 const data = await res.json();
 setExecResult(data);
 onRefreshData();
 } catch (err: any) {
 setExecResult({ error: err.message });
 } finally {
 setIsExecuting(false);
 }
 };

 const handleSettleBilling = async (settlementId?: string) => {
 try {
 const res = await fetch('/api/fpi/billing/settle', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ settlementId }),
 });
 const data = await res.json();
 if (res.ok) {
 setSettleMsg(`x402 Payout Settled! Tx: ${data.settlement.payoutTxHash.slice(0, 18)}...`);
 onRefreshData();
 }
 } catch (err: any) {
 setSettleMsg(`Settlement error: ${err.message}`);
 }
 };

 const codeSnippets = {
 typescript: `import { ComputlessFPIClient } from '@computless/fpi-sdk';

// Initialize Federation Provider Interface client
const fpi = new ComputlessFPIClient({
 endpoint: 'https://ais-dev-tl2yeqtvmcgg2ynzx5y3a5-803186795055.us-east1.run.app',
 cappoGrantToken: 'cappo-grant-alpha-001',
});

// 1. Discover compliant providers via HRMR Matchmaker
const discovery = await fpi.discovery.match({
 capabilityId: 'cap-compute-v1',
 maxLatencyMs: 30,
 isSovereignRequired: true,
 maxPricePerUnitVEK: 0.001,
});
console.log('Discovered Providers:', discovery.matchedProviders);

// 2. Reserve Compute Lease Allocation
const lease = await fpi.resources.allocate({
 providerId: discovery.matchedProviders[0].id,
 computeUnits: 100,
 allocationType: 'reserved',
 leaseDurationMinutes: 120,
});
console.log('Active Lease:', lease.allocation.id, lease.allocation.x402TotalLeaseCostVEK);

// 3. Dispatch Federated Execution Workload
const job = await fpi.execution.dispatch({
 capabilityId: 'cap-compute-v1',
 payload: { model: 'Llama3-Substrate', task: 'autonomous_audit' },
 forceFallbackIfUnreachable: true,
});
console.log('Execution Status:', job.status, 'PGL Proof:', job.pglProofSignature);`,

 python: `from computless_fpi import FPIGateway, CAPPOConfig

fpi = FPIGateway(
 host="https://ais-dev-tl2yeqtvmcgg2ynzx5y3a5-803186795055.us-east1.run.app",
 cappo_grant_id="cappo-grant-alpha-001"
)

# 1. Register External Provider Node
provider = fpi.register_provider(
 provider_name="Sovereign Edge GPU Node",
 provider_type="sovereign_enclave",
 endpoint_url="https://edge-gpu.sovereign.cloud/v1",
 regions=["us-west-2","eu-central-1"],
 price_per_compute_unit_vek=0.0008,
 is_sovereign_enclave=True
)

# 2. Dispatch Workload with Automated x402 Gas Metering
result = fpi.execute_job(
 provider_id=provider["id"],
 capability_id="cap-compute-v1",
 payload={"action":"run_inference","batch_size": 32}
)

print(f"Executed in {result['executionTimeMs']}ms. PGL Hash: {result['pglProofSignature']}")`,

 curl: `# 1. Register Federation Provider
curl -X POST https://ais-dev-tl2yeqtvmcgg2ynzx5y3a5-803186795055.us-east1.run.app/api/fpi/providers/register \\
 -H"Content-Type: application/json" \\
 -d '{"providerName":"Equinix Metal Edge","providerType":"edge_telecom","endpointUrl":"https://fpi.equinix.computless.org/v1","regions": ["us-west-2"],"pricePerComputeUnitVEK": 0.0005,"maxLatencyMs": 10
 }'

# 2. Query Matchmaker Discovery
curl -X POST https://ais-dev-tl2yeqtvmcgg2ynzx5y3a5-803186795055.us-east1.run.app/api/fpi/discovery \\
 -H"Content-Type: application/json" \\
 -d '{"capabilityId":"cap-compute-v1","maxLatencyMs": 30,"isSovereignRequired": false
 }'

# 3. Dispatch Federated Execution
curl -X POST https://ais-dev-tl2yeqtvmcgg2ynzx5y3a5-803186795055.us-east1.run.app/api/fpi/execute \\
 -H"Content-Type: application/json" \\
 -d '{"providerId":"fpi-provider-aws-sovereign","capabilityId":"cap-compute-v1","cappoGrantId":"cappo-grant-alpha-001","payload": {"task":"benchmark" }
 }'`,

 openapi: JSON.stringify(
 {
 openapi: '3.0.3',
 info: {
 title: 'Computeless Cloud Federation Provider Interface (FPI)',
 version: '1.0.0-FPI-SPEC',
 description:
 'Open standard protocol interface for federated cloud providers, sovereign enclaves, and decentralized edge swarms.',
 },
 paths: {
 '/api/fpi/providers': { get: { summary: 'List Federation Providers' } },
 '/api/fpi/providers/register': { post: { summary: 'Register External Provider' } },
 '/api/fpi/discovery': { post: { summary: 'HRMR Service Discovery Matchmaker' } },
 '/api/fpi/resources/allocate': { post: { summary: 'Lease Compute Resource Quota' } },
 '/api/fpi/execute': { post: { summary: 'Dispatch Workload with CAPPO & x402 Settlement' } },
 '/api/fpi/billing': { get: { summary: 'x402 Payout Ledger & Settlements' } },
 },
 },
 null,
 2
 ),
 };

 const copyToClipboard = (text: string) => {
 navigator.clipboard.writeText(text);
 setCopiedCode(true);
 setTimeout(() => setCopiedCode(false), 2000);
 };

 // Metrics summary
 const activeProvidersCount = providers.filter((p) => p.status === 'active').length;
 const totalAllocatedCompute = providers.reduce((acc, p) => acc + p.quota.totalAllocatedUnits, 0);
 const totalx402Earned = settlements.reduce((acc, s) => acc + s.totalx402EarnedVEK, 0);

 return (
 <div className="space-y-6">
 {/* Top Banner & Header */}
 <div className="bg-theme-surface border border-theme-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
 <div className="absolute top-0 right-0 w-96 h-96 bg-theme-surface to-transparent rounded-full blur-3xl pointer-events-none" />
 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
 <div>
 <div className="flex items-center space-x-3 mb-2">
 <span className="p-2 rounded-xl bg-theme-accent/10 border border-theme-border text-theme-accent">
 <Globe className="h-6 w-6" />
 </span>
 <div>
 <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
 Federation Provider Interface (FPI)
 <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
 Open Protocol v1.0
 </span>
 </h1>
 <p className="text-sm text-slate-400 mt-0.5">
 Universal specification &amp; runtime harness for external cloud providers, sovereign enclaves, and edge swarms.
 </p>
 </div>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
 <div className="px-3.5 py-2 rounded-xl bg-theme-surface border border-theme-border flex items-center space-x-2">
 <Server className="h-4 w-4 text-theme-accent" />
 <div>
 <span className="text-slate-500 block text-[10px] uppercase">Active Providers</span>
 <span className="text-white font-bold text-sm">{activeProvidersCount} / {providers.length}</span>
 </div>
 </div>

 <div className="px-3.5 py-2 rounded-xl bg-theme-surface border border-theme-border flex items-center space-x-2">
 <Cpu className="h-4 w-4 text-theme-accent" />
 <div>
 <span className="text-slate-500 block text-[10px] uppercase">Leased Compute</span>
 <span className="text-theme-accent/70 font-bold text-sm">{totalAllocatedCompute} Units</span>
 </div>
 </div>

 <div className="px-3.5 py-2 rounded-xl bg-theme-surface border border-theme-border flex items-center space-x-2">
 <Coins className="h-4 w-4 text-amber-400" />
 <div>
 <span className="text-slate-500 block text-[10px] uppercase">x402 Gas Metered</span>
 <span className="text-amber-300 font-bold text-sm">{totalx402Earned.toFixed(2)} VEK</span>
 </div>
 </div>

 <button
 onClick={onRefreshData}
 className="p-2.5 rounded-xl bg-theme-surface hover:bg-theme-surface text-slate-300 border border-theme-border transition cursor-pointer"
 title="Refresh FPI State"
 >
 <RefreshCw className="h-4 w-4" />
 </button>
 </div>
 </div>

 {/* FPI Navigation Tabs */}
 <div className="flex space-x-2 border-t border-theme-border pt-4 mt-6 overflow-x-auto scrollbar-none">
 <button
 onClick={() => setActiveSubTab('overview_spec')}
 className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
 activeSubTab === 'overview_spec'
 ? 'bg-theme-accent text-white shadow-lg shadow-theme-accent/20'
 : 'bg-theme-surface text-slate-400 hover:text-white hover:bg-theme-surface'
 }`}
 >
 <FileText className="h-3.5 w-3.5" />
 <span>Specification &amp; Architecture</span>
 </button>

 <button
 onClick={() => setActiveSubTab('lineage')}
 className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
 activeSubTab === 'lineage'
 ? 'bg-theme-accent text-white shadow-lg shadow-theme-accent/20'
 : 'bg-theme-surface text-slate-400 hover:text-white hover:bg-theme-surface'
 }`}
 >
 <History className="h-3.5 w-3.5 text-amber-400" />
 <span>Protocol Archaeology &amp; Lineage</span>
 </button>

 <button
 onClick={() => setActiveSubTab('providers')}
 className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
 activeSubTab === 'providers'
 ? 'bg-theme-accent text-white shadow-lg shadow-theme-accent/20'
 : 'bg-theme-surface text-slate-400 hover:text-white hover:bg-theme-surface'
 }`}
 >
 <Server className="h-3.5 w-3.5" />
 <span>Provider Directory ({providers.length})</span>
 </button>

 <button
 onClick={() => setActiveSubTab('discovery')}
 className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
 activeSubTab === 'discovery'
 ? 'bg-theme-accent text-white shadow-lg shadow-theme-accent/20'
 : 'bg-theme-surface text-slate-400 hover:text-white hover:bg-theme-surface'
 }`}
 >
 <Search className="h-3.5 w-3.5" />
 <span>Service Discovery</span>
 </button>

 <button
 onClick={() => setActiveSubTab('allocations')}
 className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
 activeSubTab === 'allocations'
 ? 'bg-theme-accent text-white shadow-lg shadow-theme-accent/20'
 : 'bg-theme-surface text-slate-400 hover:text-white hover:bg-theme-surface'
 }`}
 >
 <Cpu className="h-3.5 w-3.5" />
 <span>Resource Allocation ({allocations.length})</span>
 </button>

 <button
 onClick={() => setActiveSubTab('execution')}
 className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
 activeSubTab === 'execution'
 ? 'bg-theme-accent text-white shadow-lg shadow-theme-accent/20'
 : 'bg-theme-surface text-slate-400 hover:text-white hover:bg-theme-surface'
 }`}
 >
 <Zap className="h-3.5 w-3.5" />
 <span>Federated Execution ({jobs.length})</span>
 </button>

 <button
 onClick={() => setActiveSubTab('billing')}
 className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
 activeSubTab === 'billing'
 ? 'bg-theme-accent text-white shadow-lg shadow-theme-accent/20'
 : 'bg-theme-surface text-slate-400 hover:text-white hover:bg-theme-surface'
 }`}
 >
 <Coins className="h-3.5 w-3.5" />
 <span>Billing &amp; x402 Settlements</span>
 </button>

 <button
 onClick={() => setActiveSubTab('sdk_code')}
 className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
 activeSubTab === 'sdk_code'
 ? 'bg-theme-accent text-white shadow-lg shadow-theme-accent/20'
 : 'bg-theme-surface text-slate-400 hover:text-white hover:bg-theme-surface'
 }`}
 >
 <Terminal className="h-3.5 w-3.5" />
 <span>OpenAPI &amp; SDK Code</span>
 </button>
 </div>
 </div>

 {/* SUB-TAB 1: OVERVIEW & SPECIFICATION DOCUMENTATION */}
 {activeSubTab === 'overview_spec' && (
 <div className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-theme-surface border border-theme-border rounded-xl p-5 hover:border-theme-border transition">
 <div className="h-10 w-10 rounded-lg bg-theme-accent/10 border border-theme-border text-theme-accent flex items-center justify-center mb-4">
 <Search className="h-5 w-5" />
 </div>
 <h3 className="text-base font-bold text-white mb-2">1. Service Discovery Protocol</h3>
 <p className="text-xs text-slate-400 leading-relaxed">
 External providers register endpoint URLs, geographical regions, hardware attestation capabilities, max latency SLAs, and unit pricing. Computeless Cloud’s HRMR matchmaker dynamically filters and orders providers based on caller constraints.
 </p>
 </div>

 <div className="bg-theme-surface border border-theme-border rounded-xl p-5 hover:border-theme-border transition">
 <div className="h-10 w-10 rounded-lg bg-theme-accent/10 border border-theme-border text-theme-accent flex items-center justify-center mb-4">
 <Cpu className="h-5 w-5" />
 </div>
 <h3 className="text-base font-bold text-white mb-2">2. Resource Allocation Specification</h3>
 <p className="text-xs text-slate-400 leading-relaxed">
 Provides dynamic compute unit leasing across vCPUs, RAM, and Tensor GPU Cores. Supports spot pricing vs reserved capacity leases, time-bound quotas, and automatic deallocation upon lease expiration.
 </p>
 </div>

 <div className="bg-theme-surface border border-theme-border rounded-xl p-5 hover:border-theme-border transition">
 <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
 <Coins className="h-5 w-5" />
 </div>
 <h3 className="text-base font-bold text-white mb-2">3. x402 Metering &amp; Payout Settlement</h3>
 <p className="text-xs text-slate-400 leading-relaxed">
 Leverages HTTP 402 micro-gas payments for pay-per-execution execution. Every task execution produces a cryptographic Proof Graph Ledger (PGL) hash, guaranteeing transparent provider payouts in VEK tokens.
 </p>
 </div>
 </div>

 {/* Deep Protocol Architectural Matrix */}
 <div className="bg-theme-surface border border-theme-border rounded-xl p-6 space-y-6">
 <h2 className="text-lg font-bold text-white flex items-center gap-2">
 <Layers className="h-5 w-5 text-theme-accent" />
 Federation Provider Interface (FPI) Architectural Protocol Specification
 </h2>

 <div className="space-y-4">
 <div className="p-4 rounded-xl bg-theme-surface border border-theme-border space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs font-mono font-bold text-theme-accent uppercase">
 Protocol Module A: Provider Registration &amp; Onboarding
 </span>
 <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-theme-accent/10 text-theme-accent/70 border border-theme-border">
 POST /api/fpi/providers/register
 </span>
 </div>
 <p className="text-xs text-slate-300">
 Providers present cryptographic identity keys, endpoint base URIs, and capabilities list. Registration generates a unique Provider ID and issuing auth key hash. Status heartbeats (<code className="text-theme-accent/70 font-mono">POST /api/fpi/providers/:id/status</code>) periodically update latency metrics and availability.
 </p>
 </div>

 <div className="p-4 rounded-xl bg-theme-surface border border-theme-border space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs font-mono font-bold text-theme-accent uppercase">
 Protocol Module B: Service Discovery Matchmaker
 </span>
 <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-theme-accent/10 text-theme-accent/70 border border-theme-border">
 POST /api/fpi/discovery
 </span>
 </div>
 <p className="text-xs text-slate-300">
 Clients query the discovery service specifying required capability string (e.g. <code className="text-theme-accent/70 font-mono">cap-compute-v1</code>), max latency boundary, price ceiling, and sovereign cloud requirements. The matchmaker ranks eligible nodes by optimal score (latency + price weighting).
 </p>
 </div>

 <div className="p-4 rounded-xl bg-theme-surface border border-theme-border space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
 Protocol Module C: Resource Quota &amp; Lease Allocation
 </span>
 <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
 POST /api/fpi/resources/allocate
 </span>
 </div>
 <p className="text-xs text-slate-300">
 Clients reserve dedicated compute units (vCPUs, RAM GB, GPU cores) on a target provider for a specified duration. The system verifies that requested compute units do not exceed provider capacity quotas, assigns lease expiration timestamps, and calculates total upfront x402 gas fees.
 </p>
 </div>

 <div className="p-4 rounded-xl bg-theme-surface border border-theme-border space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs font-mono font-bold text-amber-400 uppercase">
 Protocol Module D: Federated Execution &amp; Two Invariants Gateway
 </span>
 <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
 POST /api/fpi/execute
 </span>
 </div>
 <p className="text-xs text-slate-300">
 Workloads are dispatched alongside CAPPO Grant signatures. Invariant 1 enforces terminal 403 denial if authority is invalid. Invariant 2 triggers transparent fallback rerouting to alternative registered federation providers if the target provider endpoint yields HTTP 503 infrastructure failure.
 </p>
 </div>

 <div className="p-4 rounded-xl bg-theme-surface border border-theme-border space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs font-mono font-bold text-theme-accent uppercase">
 Protocol Module E: Billing Ledger &amp; Payout Settlement
 </span>
 <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-theme-accent/10 text-theme-accent/70 border border-theme-border">
 GET /api/fpi/billing
 </span>
 </div>
 <p className="text-xs text-slate-300">
 Execution micro-gas is accumulated per provider per epoch. Payouts are verified against PGL cryptographic execution receipts and settled via x402 token transfer transactions.
 </p>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* SUB-TAB: PROTOCOL ARCHAEOLOGY & HISTORICAL LINEAGE */}
 {activeSubTab === 'lineage' && (
 <div className="space-y-6">
 {/* Main Hero Header */}
 <div className="bg-theme-surface border border-theme-border rounded-xl p-6 relative overflow-hidden">
 <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
 <div className="flex items-start gap-4 relative z-10">
 <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
 <History className="h-6 w-6" />
 </div>
 <div className="space-y-2">
 <div className="flex items-center gap-2">
 <h2 className="text-xl font-bold text-white">Protocol Archaeology for Machine Agency</h2>
 <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
 35-Year Lineage
 </span>
 </div>
 <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
 HTTP was never just a browser document transport—it was built by Web architecturalists as an extensible machine-interaction substrate. Computless Cloud synthesizes this 35-year lineage into an open governed capability profile.
 </p>
 <div className="p-3 rounded-lg bg-theme-surface border border-theme-border text-xs text-amber-200/90 font-mono italic">
 &ldquo;HTTP supplies the universal grammar of machine interaction. Computless supplies invariant authority over the state transitions expressed through that grammar.&rdquo;
 </div>
 </div>
 </div>
 </div>

 {/* 5 Generations Timeline */}
 <div className="bg-theme-surface border border-theme-border rounded-xl p-6 space-y-6">
 <h3 className="text-base font-bold text-white flex items-center gap-2">
 <BookOpen className="h-4 w-4 text-theme-accent" />
 The 5 Generations of HTTP Architecturalists
 </h3>

 <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
 {/* Gen 1 */}
 <div className="p-4 rounded-xl bg-theme-surface border border-theme-border hover:border-theme-border transition space-y-2">
 <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-theme-accent/10 text-theme-accent/70 border border-theme-border">
 Gen 1 (1945–1965)
 </span>
 <h4 className="text-sm font-bold text-white">Associative Intelligence</h4>
 <p className="text-[11px] text-slate-400 font-mono">Vannevar Bush, Doug Engelbart, Ted Nelson</p>
 <p className="text-xs text-slate-300 leading-normal">
 Human/computer systems navigate relationships &amp; process capability hierarchies, not rigid databases.
 </p>
 </div>

 {/* Gen 2 */}
 <div className="p-4 rounded-xl bg-theme-surface border border-theme-border hover:border-theme-border transition space-y-2">
 <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-theme-accent/10 text-theme-accent/70 border border-theme-border">
 Gen 2 (1989)
 </span>
 <h4 className="text-sm font-bold text-white">Open Hypertext Web</h4>
 <p className="text-[11px] text-slate-400 font-mono">Tim Berners-Lee (CERN)</p>
 <p className="text-xs text-slate-300 leading-normal">
 Universal identifiers + live links. Deliberately separated linking from authorization/accounting for future extension.
 </p>
 </div>

 {/* Gen 3 */}
 <div className="p-4 rounded-xl bg-theme-surface border border-theme-border hover:border-theme-border transition space-y-2">
 <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-theme-accent/10 text-theme-accent/70 border border-theme-border">
 Gen 3 (2000)
 </span>
 <h4 className="text-sm font-bold text-white">Web Architecture &amp; REST</h4>
 <p className="text-[11px] text-slate-400 font-mono">Roy Fielding</p>
 <p className="text-xs text-slate-300 leading-normal">
 Distributed hypermedia with embedded action controls, independent deployment, and multi-trust boundary proxies.
 </p>
 </div>

 {/* Gen 4 */}
 <div className="p-4 rounded-xl bg-theme-surface border border-theme-border hover:border-theme-border transition space-y-2">
 <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
 Gen 4 (1997–2000)
 </span>
 <h4 className="text-sm font-bold text-white">Extensibility Radicals</h4>
 <p className="text-[11px] text-slate-400 font-mono">Henrik Frystyk Nielsen, HTTP-NG, PEP, WebDAV</p>
 <p className="text-xs text-slate-300 leading-normal">
 Explicitly designed for &ldquo;running agents &amp; complex services&rdquo; with mandatory fail-closed semantics (RFC 2774).
 </p>
 </div>

 {/* Gen 5 */}
 <div className="p-4 rounded-xl bg-theme-surface border border-theme-border hover:border-theme-border transition space-y-2">
 <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
 Gen 5 (2015–2026)
 </span>
 <h4 className="text-sm font-bold text-white">Modern HTTP Stewards</h4>
 <p className="text-[11px] text-slate-400 font-mono">HTTPbis / HTTPAPI (Nottingham, Reschke, etc.)</p>
 <p className="text-xs text-slate-300 leading-normal">
 Composable machine building blocks: Problem Details (RFC 9457), Link-Templates (RFC 9652), HTTP Signatures (RFC 9421).
 </p>
 </div>
 </div>
 </div>

 {/* Historical Protocol Rooms Mined */}
 <div className="bg-theme-surface border border-theme-border rounded-xl p-6 space-y-6">
 <h3 className="text-base font-bold text-white flex items-center gap-2">
 <Layers className="h-4 w-4 text-theme-accent" />
 Historical Protocol Rooms Mined &amp; Activated in Computless
 </h3>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {/* Room 1: PEP / RFC 2774 */}
 <div className="p-5 rounded-xl bg-theme-surface border border-theme-border space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-mono font-bold text-amber-300 uppercase">
 1. PEP / RFC 2774
 </span>
 <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
 Mandatory Extensions
 </span>
 </div>
 <h4 className="text-sm font-bold text-white">Fail-Closed Capability Contract</h4>
 <p className="text-xs text-slate-300 leading-relaxed">
 RFC 2774 specified that mandatory extension declarations must be fully understood or answered with <code className="text-amber-300 font-mono">510 Not Extended</code>.
 </p>
 <div className="p-2.5 rounded bg-theme-surface border border-theme-border font-mono text-[11px] text-slate-400">
 <span className="text-emerald-400">Computless Application:</span> CAPPO Authority Gate enforces zero silent governance downgrades. Missing or invalid grant tokens yield immediate terminal denial.
 </div>
 </div>

 {/* Room 2: WebDAV State Tokens */}
 <div className="p-5 rounded-xl bg-theme-surface border border-theme-border space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-mono font-bold text-theme-accent/70 uppercase">
 2. WebDAV (RFC 2518/4918)
 </span>
 <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-theme-accent/10 text-theme-accent/70 border border-theme-border">
 State Tokens &amp; Locks
 </span>
 </div>
 <h4 className="text-sm font-bold text-white">Lease Token &ne; Authority</h4>
 <p className="text-xs text-slate-300 leading-relaxed">
 WebDAV explicitly separated lock/state tokens from authorization rights, using conditional headers (<code className="text-theme-accent/70 font-mono">If-Match</code>) and <code className="text-theme-accent/70 font-mono">424 Failed Dependency</code>.
 </p>
 <div className="p-2.5 rounded bg-theme-surface border border-theme-border font-mono text-[11px] text-slate-400">
 <span className="text-emerald-400">Computless Application:</span> Compute lease handles, x402 payment proofs, and mount state are strictly decoupled from CAPPO execution authority.
 </div>
 </div>

 {/* Room 3: Transparent Content Negotiation */}
 <div className="p-5 rounded-xl bg-theme-surface border border-theme-border space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-mono font-bold text-theme-accent/70 uppercase">
 3. Conneg (RFC 2295)
 </span>
 <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-theme-accent/10 text-theme-accent/70 border border-theme-border">
 Variant Negotiation
 </span>
 </div>
 <h4 className="text-sm font-bold text-white">Capability to Provider Matching</h4>
 <p className="text-xs text-slate-300 leading-relaxed">
 Defined one URI with multiple variant realizations selected dynamically via feature tags, latency constraints, and quality factors.
 </p>
 <div className="p-2.5 rounded bg-theme-surface border border-theme-border font-mono text-[11px] text-slate-400">
 <span className="text-emerald-400">Computless Application:</span> HRMR Matchmaker maps 1 capability ID to multiple federated cloud, enclave, or edge providers based on cost, latency, &amp; sovereignty.
 </div>
 </div>

 {/* Room 4: Henrik Nielsen's HTTP-NG */}
 <div className="p-5 rounded-xl bg-theme-surface border border-theme-border space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-mono font-bold text-theme-accent/70 uppercase">
 4. HTTP-NG Architecture
 </span>
 <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-theme-accent/10 text-theme-accent/70 border border-theme-border">
 Automatibility
 </span>
 </div>
 <h4 className="text-sm font-bold text-white">Layered Extensibility for Agents</h4>
 <p className="text-xs text-slate-300 leading-relaxed">
 Archived 1998 W3C notes explicitly cited &ldquo;running agents, advanced search engines, complex services&rdquo; as the primary rationale for modular HTTP layering.
 </p>
 <div className="p-2.5 rounded bg-theme-surface border border-theme-border font-mono text-[11px] text-slate-400">
 <span className="text-emerald-400">Computless Application:</span> Implements Nielsen&apos;s modular layering across physical substrate, web transport, capability semantics, and proof settlement.
 </div>
 </div>

 {/* Room 5: Fielding's Intermediaries */}
 <div className="p-5 rounded-xl bg-theme-surface border border-theme-border space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-mono font-bold text-emerald-300 uppercase">
 5. Fielding Intermediaries
 </span>
 <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
 Multi-Trust Boundaries
 </span>
 </div>
 <h4 className="text-sm font-bold text-white">Action Controls &amp; Enforcement</h4>
 <p className="text-xs text-slate-300 leading-relaxed">
 REST defined intermediaries as first-class components enforcing security, transaction accounting, and legacy encapsulation across trust boundaries.
 </p>
 <div className="p-2.5 rounded bg-theme-surface border border-theme-border font-mono text-[11px] text-slate-400">
 <span className="text-emerald-400">Computless Application:</span> Edge proxies act as authority gateways and proof loggers between autonomous agents and multi-cloud execution enclaves.
 </div>
 </div>

 {/* Room 6: Modern HTTP Building Blocks */}
 <div className="p-5 rounded-xl bg-theme-surface border border-theme-border space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-mono font-bold text-rose-300 uppercase">
 6. Modern Machine Specs
 </span>
 <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
 RFC 9457, 9652, 9421
 </span>
 </div>
 <h4 className="text-sm font-bold text-white">Machine Refusal &amp; Signatures</h4>
 <p className="text-xs text-slate-300 leading-relaxed">
 Combines RFC 9457 Problem Details (<code className="text-rose-300 font-mono">application/problem+json</code>), RFC 9652 Link-Templates, and RFC 9421 HTTP Signatures.
 </p>
 <div className="p-2.5 rounded bg-theme-surface border border-theme-border font-mono text-[11px] text-slate-400">
 <span className="text-emerald-400">Computless Application:</span> Returns URI-typed problem detail refusals and seals execution receipts with cryptographic HTTP digests and PGL signatures.
 </div>
 </div>
 </div>
 </div>

 {/* The 6-Stage Governed Capability Profile Pipeline */}
 <div className="bg-theme-surface border border-theme-border rounded-xl p-6 space-y-6">
 <h3 className="text-base font-bold text-white flex items-center gap-2">
 <Zap className="h-4 w-4 text-amber-400" />
 The Governed Capability HTTP Application Profile
 </h3>

 <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
 <div className="p-3.5 rounded-xl bg-theme-surface border border-theme-border text-center space-y-1.5">
 <span className="text-[10px] font-mono text-theme-accent uppercase font-bold block">1. Discovery</span>
 <span className="text-xs font-bold text-white block">RFC 9652 Link-Template</span>
 <span className="text-[10px] text-slate-400 block font-mono">Action &amp; capability catalog lookup</span>
 </div>

 <div className="p-3.5 rounded-xl bg-theme-surface border border-theme-border text-center space-y-1.5">
 <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">2. Authority</span>
 <span className="text-xs font-bold text-white block">CAPPO Gate (RFC 2774)</span>
 <span className="text-[10px] text-slate-400 block font-mono">Fail-closed token authorization</span>
 </div>

 <div className="p-3.5 rounded-xl bg-theme-surface border border-theme-border text-center space-y-1.5">
 <span className="text-[10px] font-mono text-theme-accent uppercase font-bold block">3. Routing</span>
 <span className="text-xs font-bold text-white block">HRMR Matchmaker</span>
 <span className="text-[10px] text-slate-400 block font-mono">RFC 2295 variant selection</span>
 </div>

 <div className="p-3.5 rounded-xl bg-theme-surface border border-theme-border text-center space-y-1.5">
 <span className="text-[10px] font-mono text-theme-accent uppercase font-bold block">4. Execution</span>
 <span className="text-xs font-bold text-white block">Stateless Enclave</span>
 <span className="text-[10px] text-slate-400 block font-mono">RFC 7240 respond-async processing</span>
 </div>

 <div className="p-3.5 rounded-xl bg-theme-surface border border-theme-border text-center space-y-1.5">
 <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">5. Evidence</span>
 <span className="text-xs font-bold text-white block">PGL Proof Signature</span>
 <span className="text-[10px] text-slate-400 block font-mono">RFC 9530 Digest + RFC 9421 Sign</span>
 </div>

 <div className="p-3.5 rounded-xl bg-theme-surface border border-theme-border text-center space-y-1.5">
 <span className="text-[10px] font-mono text-amber-300 uppercase font-bold block">6. Settlement</span>
 <span className="text-xs font-bold text-white block">x402 Micro-Gas</span>
 <span className="text-[10px] text-slate-400 block font-mono">Pay-per-execution token payout</span>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* SUB-TAB 2: PROVIDER DIRECTORY & REGISTRATION PORTAL */}
 {activeSubTab === 'providers' && (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-bold text-white flex items-center gap-2">
 <Server className="h-5 w-5 text-theme-accent" />
 Registered Federation Providers
 </h2>

 <button
 onClick={() => setShowRegForm(!showRegForm)}
 className="px-4 py-2 rounded-xl bg-theme-accent hover:bg-theme-accent text-white font-medium text-xs flex items-center space-x-2 transition cursor-pointer shadow-lg shadow-theme-accent/20"
 >
 <PlusCircle className="h-4 w-4" />
 <span>Register New External Provider</span>
 </button>
 </div>

 {regMsg && (
 <div className="p-4 rounded-xl bg-theme-accent/10 border border-theme-border text-theme-accent/70 text-xs font-mono">
 {regMsg}
 </div>
 )}

 {/* Registration Form Modal/Card */}
 {showRegForm && (
 <form onSubmit={handleRegisterProvider} className="bg-theme-surface border border-theme-border rounded-xl p-6 space-y-4">
 <h3 className="text-sm font-bold text-white flex items-center gap-2">
 <Server className="h-4 w-4 text-theme-accent" />
 Register External Federation Provider Node
 </h3>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
 <div>
 <label className="block text-slate-400 mb-1">Provider Name</label>
 <input
 type="text"
 required
 value={regName}
 onChange={(e) => setRegName(e.target.value)}
 placeholder="e.g. Oracle Sovereign Enclave"
 className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-theme-border"
 />
 </div>

 <div>
 <label className="block text-slate-400 mb-1">Provider Type</label>
 <select
 value={regType}
 onChange={(e: any) => setRegType(e.target.value)}
 className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-theme-border"
 >
 <option value="hyperscaler">Hyperscaler Cloud</option>
 <option value="sovereign_enclave">Sovereign Enclave</option>
 <option value="decentralized_mesh">Decentralized Mesh Swarm</option>
 <option value="edge_telecom">Edge Telecom Baremetal</option>
 </select>
 </div>

 <div>
 <label className="block text-slate-400 mb-1">FPI Endpoint Base URI</label>
 <input
 type="url"
 required
 value={regEndpoint}
 onChange={(e) => setRegEndpoint(e.target.value)}
 className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-theme-border font-mono text-xs"
 />
 </div>

 <div>
 <label className="block text-slate-400 mb-1">Supported Regions (comma separated)</label>
 <input
 type="text"
 value={regRegions}
 onChange={(e) => setRegRegions(e.target.value)}
 placeholder="us-east-1, eu-central-1"
 className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-theme-border"
 />
 </div>

 <div>
 <label className="block text-slate-400 mb-1">Max Latency SLA (ms)</label>
 <input
 type="number"
 value={regLatency}
 onChange={(e) => setRegLatency(Number(e.target.value))}
 className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-theme-border"
 />
 </div>

 <div>
 <label className="block text-slate-400 mb-1">Price per Compute Unit (VEK)</label>
 <input
 type="number"
 step="0.0001"
 value={regPrice}
 onChange={(e) => setRegPrice(Number(e.target.value))}
 className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-theme-border"
 />
 </div>
 </div>

 <div className="flex items-center space-x-2">
 <input
 type="checkbox"
 id="regSovereign"
 checked={regSovereign}
 onChange={(e) => setRegSovereign(e.target.checked)}
 className="rounded bg-theme-surface border-theme-border text-theme-inkDim focus:ring-theme-accent"
 />
 <label htmlFor="regSovereign" className="text-xs text-slate-300">
 Is Hardware Attested Sovereign Enclave (National Isolation)
 </label>
 </div>

 <div className="flex justify-end space-x-3 pt-2">
 <button
 type="button"
 onClick={() => setShowRegForm(false)}
 className="px-4 py-2 rounded-lg bg-theme-surface text-slate-300 hover:bg-theme-surface text-xs font-medium cursor-pointer"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="px-4 py-2 rounded-lg bg-theme-accent text-white hover:bg-theme-accent text-xs font-semibold cursor-pointer shadow-md"
 >
 Submit Registration
 </button>
 </div>
 </form>
 )}

 {/* Provider Directory Table */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {providers.map((p) => {
 const capacityPct = Math.round((p.quota.usedUnits / p.quota.maxCapacityUnits) * 100);
 return (
 <div
 key={p.id}
 className="bg-theme-surface border border-theme-border rounded-xl p-5 space-y-4 hover:border-theme-border transition"
 >
 <div className="flex items-start justify-between">
 <div>
 <div className="flex items-center space-x-2">
 <h3 className="text-sm font-bold text-white">{p.providerName}</h3>
 {p.isSovereignEnclave && (
 <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
 Sovereign Enclave
 </span>
 )}
 </div>
 <p className="text-xs text-slate-500 font-mono mt-0.5">{p.endpointUrl}</p>
 </div>

 <span
 className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
 p.status === 'active'
 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
 : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
 }`}
 >
 {p.status}
 </span>
 </div>

 <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-theme-surface p-3 rounded-lg border border-theme-border">
 <div>
 <span className="text-slate-500 block text-[10px]">Type</span>
 <span className="text-slate-200 capitalize">{p.providerType.replace('_', ' ')}</span>
 </div>
 <div>
 <span className="text-slate-500 block text-[10px]">Latency SLA</span>
 <span className="text-theme-accent/70">{p.maxLatencyMs}ms</span>
 </div>
 <div>
 <span className="text-slate-500 block text-[10px]">Rate</span>
 <span className="text-amber-300">{p.pricing.pricePerComputeUnitVEK} VEK/u</span>
 </div>
 </div>

 <div>
 <div className="flex justify-between text-xs font-mono mb-1">
 <span className="text-slate-400">Capacity Utilization</span>
 <span className="text-slate-200">
 {p.quota.usedUnits} / {p.quota.maxCapacityUnits} units ({capacityPct}%)
 </span>
 </div>
 <div className="h-2 w-full bg-theme-surface rounded-full overflow-hidden border border-theme-border">
 <div
 className={`h-full rounded-full transition-all duration-500 ${
 capacityPct > 80 ? 'bg-amber-500' : 'bg-theme-accent'
 }`}
 style={{ width: `${capacityPct}%` }}
 />
 </div>
 </div>

 <div className="flex items-center justify-between pt-1 text-xs">
 <span className="text-slate-500 font-mono text-[10px]">
 Regions: {p.regions.join(', ')}
 </span>
 <span className="text-slate-500 font-mono text-[10px]">
 SLA Uptime: {p.slaUptimePct}%
 </span>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* SUB-TAB 3: SERVICE DISCOVERY MATCHMAKER */}
 {activeSubTab === 'discovery' && (
 <div className="space-y-6">
 <div className="bg-theme-surface border border-theme-border rounded-xl p-6 space-y-6">
 <h2 className="text-lg font-bold text-white flex items-center gap-2">
 <Search className="h-5 w-5 text-theme-accent" />
 HRMR Service Discovery Matchmaker Query
 </h2>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
 <div>
 <label className="block text-slate-400 mb-1">Required Capability ID</label>
 <select
 value={discCap}
 onChange={(e) => setDiscCap(e.target.value)}
 className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-theme-border"
 >
 {capabilities.map((c) => (
 <option key={c.id} value={c.id}>
 {c.name} ({c.id})
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-slate-400 mb-1">Target Region (Optional)</label>
 <input
 type="text"
 value={discRegion}
 onChange={(e) => setDiscRegion(e.target.value)}
 placeholder="e.g. us-east-1 or europe-west3"
 className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-theme-border"
 />
 </div>

 <div>
 <label className="block text-slate-400 mb-1">Max Acceptable Latency (ms)</label>
 <input
 type="number"
 value={discMaxLatency}
 onChange={(e) => setDiscMaxLatency(e.target.value === '' ? '' : Number(e.target.value))}
 placeholder="50"
 className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-theme-border"
 />
 </div>

 <div>
 <label className="block text-slate-400 mb-1">Max Price Ceiling (VEK per unit)</label>
 <input
 type="number"
 step="0.0001"
 value={discMaxPrice}
 onChange={(e) => setDiscMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
 placeholder="0.002"
 className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-theme-border"
 />
 </div>

 <div className="flex items-center space-x-2 pt-6">
 <input
 type="checkbox"
 id="discSovereign"
 checked={discSovereign}
 onChange={(e) => setDiscSovereign(e.target.checked)}
 className="rounded bg-theme-surface border-theme-border text-theme-inkDim focus:ring-theme-accent"
 />
 <label htmlFor="discSovereign" className="text-xs text-slate-300">
 Require Sovereign Hardware Attestation
 </label>
 </div>

 <div className="flex items-end">
 <button
 type="button"
 onClick={handleDiscoveryQuery}
 disabled={isDiscovering}
 className="w-full px-4 py-2.5 rounded-lg bg-theme-accent hover:bg-theme-accent text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-theme-accent/20"
 >
 <Search className="h-4 w-4" />
 <span>{isDiscovering ? 'Executing HRMR Search...' : 'Run Discovery Matchmaker'}</span>
 </button>
 </div>
 </div>

 {/* Results Display */}
 {discResults && (
 <div className="space-y-4 border-t border-theme-border pt-6">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-bold text-white flex items-center gap-2">
 <CheckCircle2 className="h-4 w-4 text-emerald-400" />
 Matchmaker Search Results ({discResults.length} Compliant Providers Found)
 </h3>
 </div>

 {discResults.length === 0 ? (
 <div className="p-6 text-center text-slate-400 text-xs bg-theme-surface rounded-xl border border-theme-border">
 No active providers matched your exact filter constraints. Try relaxing latency or price ceilings.
 </div>
 ) : (
 <div className="space-y-3">
 {discResults.map((p, idx) => (
 <div
 key={p.id}
 className="p-4 rounded-xl bg-theme-surface border border-theme-border flex items-center justify-between"
 >
 <div className="flex items-center space-x-3">
 <span className="h-7 w-7 rounded-lg bg-theme-accent/10 border border-theme-border text-theme-accent flex items-center justify-center font-mono font-bold text-xs">
 #{idx + 1}
 </span>
 <div>
 <h4 className="text-sm font-bold text-white flex items-center gap-2">
 {p.providerName}
 {p.isSovereignEnclave && (
 <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/10 text-emerald-400 rounded font-mono border border-emerald-500/20">
 Sovereign
 </span>
 )}
 </h4>
 <p className="text-xs text-slate-400 font-mono">
 Regions: {p.regions.join(', ')} • Latency: {p.maxLatencyMs}ms
 </p>
 </div>
 </div>

 <div className="text-right font-mono text-xs">
 <div className="text-amber-300 font-bold">{p.pricing.pricePerComputeUnitVEK} VEK/unit</div>
 <div className="text-slate-500 text-[10px]">Uptime SLA: {p.slaUptimePct}%</div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 )}

 {/* SUB-TAB 4: RESOURCE ALLOCATION & LEASING */}
 {activeSubTab === 'allocations' && (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-bold text-white flex items-center gap-2">
 <Cpu className="h-5 w-5 text-theme-accent" />
 Active Compute Resource Leases
 </h2>

 <button
 onClick={() => setShowAllocModal(!showAllocModal)}
 className="px-4 py-2 rounded-xl bg-theme-accent hover:bg-theme-accent text-white font-medium text-xs flex items-center space-x-2 transition cursor-pointer shadow-lg shadow-theme-accent/20"
 >
 <PlusCircle className="h-4 w-4" />
 <span>Create Compute Lease</span>
 </button>
 </div>

 {allocMsg && (
 <div className="p-4 rounded-xl bg-theme-accent/10 border border-theme-border text-theme-accent/70 text-xs font-mono">
 {allocMsg}
 </div>
 )}

 {/* Allocation Modal */}
 {showAllocModal && (
 <form onSubmit={handleAllocateResource} className="bg-theme-surface border border-theme-border rounded-xl p-6 space-y-4">
 <h3 className="text-sm font-bold text-white flex items-center gap-2">
 <Cpu className="h-4 w-4 text-theme-accent" />
 Lease Compute Capacity from Provider
 </h3>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
 <div>
 <label className="block text-slate-400 mb-1">Target Provider</label>
 <select
 value={allocProviderId}
 onChange={(e) => setAllocProviderId(e.target.value)}
 className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-theme-border"
 >
 {providers.map((p) => (
 <option key={p.id} value={p.id}>
 {p.providerName} ({p.pricing.pricePerComputeUnitVEK} VEK/unit)
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-slate-400 mb-1">Grantee Subject Identity</label>
 <input
 type="text"
 value={allocSubject}
 onChange={(e) => setAllocSubject(e.target.value)}
 className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-theme-border font-mono text-xs"
 />
 </div>

 <div>
 <label className="block text-slate-400 mb-1">Compute Units (vCPUs)</label>
 <input
 type="number"
 value={allocUnits}
 onChange={(e) => setAllocUnits(Number(e.target.value))}
 className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-theme-border"
 />
 </div>

 <div>
 <label className="block text-slate-400 mb-1">Memory (GB)</label>
 <input
 type="number"
 value={allocMemory}
 onChange={(e) => setAllocMemory(Number(e.target.value))}
 className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-theme-border"
 />
 </div>

 <div>
 <label className="block text-slate-400 mb-1">GPU Tensor Cores</label>
 <input
 type="number"
 value={allocGpu}
 onChange={(e) => setAllocGpu(Number(e.target.value))}
 className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-theme-border"
 />
 </div>

 <div>
 <label className="block text-slate-400 mb-1">Lease Duration (Minutes)</label>
 <input
 type="number"
 value={allocDuration}
 onChange={(e) => setAllocDuration(Number(e.target.value))}
 className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-theme-border"
 />
 </div>

 <div>
 <label className="block text-slate-400 mb-1">Allocation Pricing Type</label>
 <select
 value={allocType}
 onChange={(e: any) => setAllocType(e.target.value)}
 className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-theme-border"
 >
 <option value="reserved">Reserved (Guaranteed SLA)</option>
 <option value="spot">Spot Lease (35% Discount)</option>
 <option value="on_demand">On-Demand</option>
 </select>
 </div>
 </div>

 <div className="flex justify-end space-x-3 pt-2">
 <button
 type="button"
 onClick={() => setShowAllocModal(false)}
 className="px-4 py-2 rounded-lg bg-theme-surface text-slate-300 hover:bg-theme-surface text-xs font-medium cursor-pointer"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="px-4 py-2 rounded-lg bg-theme-accent text-white hover:bg-theme-accent text-xs font-semibold cursor-pointer shadow-md"
 >
 Confirm &amp; Allocate
 </button>
 </div>
 </form>
 )}

 {/* Allocations Table */}
 <div className="bg-theme-surface border border-theme-border rounded-xl overflow-hidden shadow-lg">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs font-mono">
 <thead className="bg-theme-surface text-slate-400 border-b border-theme-border uppercase text-[10px]">
 <tr>
 <th className="py-3 px-4">Lease ID</th>
 <th className="py-3 px-4">Provider</th>
 <th className="py-3 px-4">Subject</th>
 <th className="py-3 px-4">Units (CPU/RAM/GPU)</th>
 <th className="py-3 px-4">Type</th>
 <th className="py-3 px-4">x402 Cost</th>
 <th className="py-3 px-4">Status</th>
 <th className="py-3 px-4 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-800 text-slate-300">
 {allocations.map((a) => (
 <tr key={a.id} className="hover:bg-theme-surface transition">
 <td className="py-3 px-4 font-bold text-theme-accent">{a.id}</td>
 <td className="py-3 px-4 text-white font-sans">{a.providerName}</td>
 <td className="py-3 px-4 text-slate-400">{a.granteeSubject}</td>
 <td className="py-3 px-4 text-theme-accent/70">
 {a.computeUnits} vCPU / {a.memoryGb}GB / {a.gpuCores} GPU
 </td>
 <td className="py-3 px-4 capitalize text-slate-300">{a.allocationType}</td>
 <td className="py-3 px-4 text-amber-300 font-bold">{a.x402TotalLeaseCostVEK} VEK</td>
 <td className="py-3 px-4">
 <span
 className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
 a.status === 'active'
 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
 : 'bg-theme-surface text-slate-500'
 }`}
 >
 {a.status}
 </span>
 </td>
 <td className="py-3 px-4 text-right">
 {a.status === 'active' && (
 <button
 onClick={() => handleDeallocate(a.id)}
 className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[10px] cursor-pointer transition"
 >
 Release Lease
 </button>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}

 {/* SUB-TAB 5: FEDERATED EXECUTION SANDBOX */}
 {activeSubTab === 'execution' && (
 <div className="space-y-6">
 <div className="bg-theme-surface border border-theme-border rounded-xl p-6 space-y-6">
 <h2 className="text-lg font-bold text-white flex items-center gap-2">
 <Zap className="h-5 w-5 text-amber-400" />
 Dispatch Federated Execution Workload
 </h2>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
 <div>
 <label className="block text-slate-400 mb-1">Target Federation Provider</label>
 <select
 value={execProviderId}
 onChange={(e) => setExecProviderId(e.target.value)}
 className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-theme-border"
 >
 {providers.map((p) => (
 <option key={p.id} value={p.id}>
 {p.providerName} ({p.status})
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-slate-400 mb-1">Required Capability</label>
 <select
 value={execCapId}
 onChange={(e) => setExecCapId(e.target.value)}
 className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-theme-border"
 >
 {capabilities.map((c) => (
 <option key={c.id} value={c.id}>
 {c.name} ({c.id})
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-slate-400 mb-1">CAPPO Grant Token</label>
 <input
 type="text"
 value={execGrantId}
 onChange={(e) => setExecGrantId(e.target.value)}
 className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-theme-border font-mono text-xs"
 />
 </div>
 </div>

 <div className="text-xs">
 <label className="block text-slate-400 mb-1">Execution Payload (JSON)</label>
 <textarea
 rows={3}
 value={execPayloadText}
 onChange={(e) => setExecPayloadText(e.target.value)}
 className="w-full bg-theme-surface border border-theme-border rounded-lg p-3 text-emerald-400 font-mono focus:outline-none focus:border-theme-border text-xs"
 />
 </div>

 <div className="flex items-center justify-between border-t border-theme-border pt-4">
 <div className="flex items-center space-x-2">
 <input
 type="checkbox"
 id="execFallback"
 checked={execForceFallback}
 onChange={(e) => setExecForceFallback(e.target.checked)}
 className="rounded bg-theme-surface border-theme-border text-theme-inkDim focus:ring-theme-accent"
 />
 <label htmlFor="execFallback" className="text-xs text-amber-300">
 Simulate Provider HTTP 503 Outage (Triggers HRMR Fallback Rerouting)
 </label>
 </div>

 <button
 type="button"
 onClick={handleExecuteFederatedJob}
 disabled={isExecuting}
 className="px-6 py-2.5 rounded-lg bg-theme-accent hover:bg-theme-accent text-white font-semibold text-xs transition cursor-pointer flex items-center space-x-2 shadow-lg shadow-theme-accent/20"
 >
 <Play className="h-4 w-4 fill-current" />
 <span>{isExecuting ? 'Dispatching Workload...' : 'Dispatch Execution Workload'}</span>
 </button>
 </div>

 {/* Execution Result Output */}
 {execResult && (
 <div className="space-y-4 border-t border-theme-border pt-4">
 <h3 className="text-sm font-bold text-white flex items-center gap-2">
 <Terminal className="h-4 w-4 text-theme-accent" />
 Execution Result &amp; Cryptographic PGL Proof
 </h3>

 <div className="p-4 rounded-xl bg-theme-surface border border-theme-border font-mono text-xs space-y-2">
 <div className="flex items-center justify-between text-slate-400 border-b border-theme-border pb-2">
 <span>Job ID: <strong className="text-theme-accent">{execResult.job?.id}</strong></span>
 <span>Status: <strong className="text-emerald-400">{execResult.job?.status}</strong></span>
 <span>x402 Gas Settled: <strong className="text-amber-300">{execResult.job?.x402GasSettled} VEK</strong></span>
 </div>

 <p className="text-slate-200">{execResult.job?.outputSummary}</p>

 <div className="space-y-1 text-[11px] text-slate-400 pt-2">
 {execResult.job?.logs?.map((l: string, i: number) => (
 <div key={i} className="flex items-center space-x-2">
 <span className="text-theme-accent">›</span>
 <span>{l}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Historical Execution Jobs Log */}
 <div className="bg-theme-surface border border-theme-border rounded-xl overflow-hidden">
 <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between">
 <h3 className="text-sm font-bold text-white">Federated Execution History</h3>
 <span className="text-xs text-slate-400 font-mono">{jobs.length} Executed Jobs</span>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs font-mono">
 <thead className="bg-theme-surface text-slate-400 border-b border-theme-border uppercase text-[10px]">
 <tr>
 <th className="py-3 px-4">Job ID</th>
 <th className="py-3 px-4">Provider</th>
 <th className="py-3 px-4">Capability</th>
 <th className="py-3 px-4">Time (ms)</th>
 <th className="py-3 px-4">x402 Gas</th>
 <th className="py-3 px-4">PGL Proof Signature</th>
 <th className="py-3 px-4">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-800 text-slate-300">
 {jobs.map((j) => (
 <tr key={j.id} className="hover:bg-theme-surface transition">
 <td className="py-3 px-4 font-bold text-theme-accent">{j.id}</td>
 <td className="py-3 px-4 text-white font-sans">{j.providerName}</td>
 <td className="py-3 px-4 text-slate-400">{j.capabilityId}</td>
 <td className="py-3 px-4 text-theme-accent/70">{j.executionTimeMs}ms</td>
 <td className="py-3 px-4 text-amber-300 font-bold">{j.x402GasSettled} VEK</td>
 <td className="py-3 px-4 text-slate-400 truncate max-w-[150px]">{j.pglProofSignature}</td>
 <td className="py-3 px-4">
 <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
 {j.status}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}

 {/* SUB-TAB 6: BILLING & X402 SETTLEMENTS */}
 {activeSubTab === 'billing' && (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-lg font-bold text-white flex items-center gap-2">
 <Coins className="h-5 w-5 text-amber-400" />
 x402 Provider Billing &amp; Micro-Gas Settlements
 </h2>
 <p className="text-xs text-slate-400 mt-1">
 Real-time economic finality tracking, aggregate provider payouts, and instant x402 gas settlement verification.
 </p>
 </div>

 <button
 onClick={() => handleSettleBilling()}
 className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition cursor-pointer shadow-lg shadow-amber-500/20"
 >
 <Coins className="h-4 w-4" />
 <span>Settle All Outstanding Payouts</span>
 </button>
 </div>

 {settleMsg && (
 <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
 {settleMsg}
 </div>
 )}

 {/* AGGREGATE FINALITY KPI CARDS */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 <div className="p-4 rounded-xl bg-theme-surface border border-theme-border space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-[11px] font-mono text-slate-400 uppercase">Total Settled Revenue</span>
 <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
 FINALIZED
 </span>
 </div>
 <div className="text-xl font-bold font-mono text-emerald-400">
 {globalTotalSettledVEK.toFixed(4)} <span className="text-xs text-emerald-300 font-normal">VEK</span>
 </div>
 <p className="text-[10px] text-slate-400">Cryptographically settled via x402 gas</p>
 </div>

 <div className="p-4 rounded-xl bg-theme-surface border border-theme-border space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-[11px] font-mono text-slate-400 uppercase">Pending Epoch Payouts</span>
 <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
 PENDING
 </span>
 </div>
 <div className="text-xl font-bold font-mono text-amber-300">
 {globalTotalPendingVEK.toFixed(4)} <span className="text-xs text-amber-200 font-normal">VEK</span>
 </div>
 <p className="text-[10px] text-slate-400">Awaiting batch finality trigger</p>
 </div>

 <div className="p-4 rounded-xl bg-theme-surface border border-theme-border space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-[11px] font-mono text-slate-400 uppercase">Economic Finality Rate</span>
 <span className="text-xs font-mono font-bold text-theme-accent">{globalFinalityRate}%</span>
 </div>
 <div className="text-xl font-bold font-mono text-white">
 {globalFinalityRate}%
 </div>
 <div className="w-full bg-theme-surface h-1.5 rounded-full overflow-hidden mt-2">
 <div
 className="bg-emerald-400 h-full transition-all duration-500"
 style={{ width: `${globalFinalityRate}%` }}
 />
 </div>
 </div>

 <div className="p-4 rounded-xl bg-theme-surface border border-theme-border space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-[11px] font-mono text-slate-400 uppercase">Provider Nodes</span>
 <ShieldCheck className="h-4 w-4 text-theme-accent" />
 </div>
 <div className="text-xl font-bold font-mono text-white">
 {providerSummaryMap.length} <span className="text-xs text-slate-400 font-normal">Invoiced</span>
 </div>
 <p className="text-[10px] text-slate-400">Active x402 metering participants</p>
 </div>
 </div>

 {/* SUMMARY PANEL: AGGREGATE SETTLEMENT TOTALS BY PROVIDER */}
 <div className="bg-theme-surface border border-theme-border rounded-xl p-6 space-y-4">
 <div className="flex items-center justify-between border-b border-theme-border pb-4">
 <div>
 <h3 className="text-base font-bold text-white flex items-center gap-2">
 <Coins className="h-4 w-4 text-amber-400" />
 Aggregate Settlement Finality by Provider
 </h3>
 <p className="text-xs text-slate-400 mt-0.5">
 Per-provider settlement breakdown showing total earned gas, finalized payouts, and immediate execution finality triggers.
 </p>
 </div>
 <span className="text-xs font-mono text-theme-accent bg-theme-accent/10 border border-theme-border px-2.5 py-1 rounded-md hidden sm:inline-block">
 x402 Gas Engine Active
 </span>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {providerSummaryMap.map((prov) => {
 const finalityPct =
 prov.totalVEK > 0
 ? ((prov.settledVEK / prov.totalVEK) * 100).toFixed(1)
 : '100.0';
 const isFullySettled = prov.pendingVEK === 0;

 return (
 <div
 key={prov.providerId}
 className="p-5 rounded-xl bg-theme-surface border border-theme-border hover:border-theme-border transition space-y-4"
 >
 {/* Header */}
 <div className="flex items-start justify-between">
 <div>
 <h4 className="text-sm font-bold text-white flex items-center gap-2">
 {prov.providerName}
 </h4>
 <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
 ID: {prov.providerId}
 </span>
 </div>
 <span
 className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
 isFullySettled
 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
 : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
 }`}
 >
 {isFullySettled ? '100% Finalized' : 'Pending Epoch Payout'}
 </span>
 </div>

 {/* Financial Metrics */}
 <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-theme-surface border border-theme-border text-center font-mono text-xs">
 <div>
 <span className="text-[10px] text-slate-400 block uppercase">Settled</span>
 <span className="font-bold text-emerald-400">
 {prov.settledVEK.toFixed(2)} VEK
 </span>
 </div>
 <div>
 <span className="text-[10px] text-slate-400 block uppercase">Pending</span>
 <span className="font-bold text-amber-300">
 {prov.pendingVEK.toFixed(2)} VEK
 </span>
 </div>
 <div>
 <span className="text-[10px] text-slate-400 block uppercase">Total Earned</span>
 <span className="font-bold text-white">
 {prov.totalVEK.toFixed(2)} VEK
 </span>
 </div>
 </div>

 {/* Execution & Compute Volume */}
 <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
 <span>Jobs: <strong className="text-theme-accent/70">{prov.jobsExecuted.toLocaleString()}</strong></span>
 <span>Compute: <strong className="text-slate-200">{prov.computeUnitsUsed.toLocaleString()} vCPU-hrs</strong></span>
 <span>Epochs: <strong className="text-slate-200">{prov.settledCount + prov.pendingCount}</strong></span>
 </div>

 {/* Finality Progress Bar */}
 <div className="space-y-1">
 <div className="flex justify-between text-[10px] font-mono text-slate-400">
 <span>Economic Finality Ratio</span>
 <span className={isFullySettled ? 'text-emerald-400 font-bold' : 'text-amber-300'}>
 {finalityPct}% Finalized
 </span>
 </div>
 <div className="w-full bg-theme-surface h-2 rounded-full overflow-hidden border border-theme-border">
 <div
 className={`h-full transition-all duration-500 ${
 isFullySettled ? 'bg-emerald-400' : 'bg-theme-surface from-emerald-400 to-amber-400'
 }`}
 style={{ width: `${finalityPct}%` }}
 />
 </div>
 </div>

 {/* Footer Actions & Latest Tx */}
 <div className="pt-2 border-t border-theme-border flex items-center justify-between text-xs">
 <div className="text-[11px] font-mono text-slate-400 truncate max-w-[200px]">
 {prov.latestTxHash ? (
 <span title={prov.latestTxHash}>
 Tx: <code className="text-slate-300">{prov.latestTxHash.slice(0, 10)}...{prov.latestTxHash.slice(-6)}</code>
 </span>
 ) : (
 <span className="italic text-slate-500">No settled tx yet</span>
 )}
 </div>

 {prov.pendingVEK > 0 ? (
 <button
 onClick={() => handleSettleBilling(prov.pendingSettlementIds[0])}
 className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] cursor-pointer transition shadow-md shadow-amber-500/10 flex items-center space-x-1"
 >
 <Coins className="h-3 w-3" />
 <span>Settle Payout ({prov.pendingVEK.toFixed(2)} VEK)</span>
 </button>
 ) : (
 <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
 <CheckCircle2 className="h-3 w-3" />
 Finality Verified
 </span>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* DETAILED SETTLEMENT LEDGER TABLE */}
 <div className="bg-theme-surface border border-theme-border rounded-xl overflow-hidden shadow-lg space-y-2 p-4">
 <h3 className="text-sm font-bold text-white px-2 pt-2">Detailed Historical Settlement Ledger</h3>
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs font-mono">
 <thead className="bg-theme-surface text-slate-400 border-b border-theme-border uppercase text-[10px]">
 <tr>
 <th className="py-3 px-4">Settlement ID</th>
 <th className="py-3 px-4">Provider</th>
 <th className="py-3 px-4">Billing Period</th>
 <th className="py-3 px-4">Jobs Executed</th>
 <th className="py-3 px-4">x402 VEK Earned</th>
 <th className="py-3 px-4">Status</th>
 <th className="py-3 px-4">Payout Transaction Hash</th>
 <th className="py-3 px-4 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-800 text-slate-300">
 {settlements.map((s) => (
 <tr key={s.id} className="hover:bg-theme-surface transition">
 <td className="py-3 px-4 font-bold text-theme-accent">{s.id}</td>
 <td className="py-3 px-4 text-white font-sans">{s.providerName}</td>
 <td className="py-3 px-4 text-slate-400">{s.period}</td>
 <td className="py-3 px-4 text-theme-accent/70">{s.jobsExecuted}</td>
 <td className="py-3 px-4 text-amber-300 font-bold">{s.totalx402EarnedVEK} VEK</td>
 <td className="py-3 px-4">
 <span
 className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
 s.payoutStatus === 'settled'
 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
 : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
 }`}
 >
 {s.payoutStatus}
 </span>
 </td>
 <td className="py-3 px-4 text-slate-400 truncate max-w-[180px]">{s.payoutTxHash}</td>
 <td className="py-3 px-4 text-right">
 {s.payoutStatus === 'pending' && (
 <button
 onClick={() => handleSettleBilling(s.id)}
 className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[10px] cursor-pointer transition font-bold"
 >
 Settle Now
 </button>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}

 {/* SUB-TAB 7: OPENAPI & SDK CODE SNIPPETS */}
 {activeSubTab === 'sdk_code' && (
 <div className="space-y-6">
 <div className="bg-theme-surface border border-theme-border rounded-xl p-6 space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-bold text-white flex items-center gap-2">
 <Terminal className="h-5 w-5 text-theme-accent" />
 FPI OpenAPI Specification &amp; Client SDK Examples
 </h2>

 <div className="flex items-center space-x-2">
 <button
 onClick={() => copyToClipboard(codeSnippets[sdkLang])}
 className="px-3 py-1.5 rounded-lg bg-theme-surface hover:bg-theme-surface text-slate-200 text-xs font-mono flex items-center space-x-1.5 transition cursor-pointer"
 >
 {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
 <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
 </button>

 <a
 href="/api/fpi/openapi"
 target="_blank"
 rel="noreferrer"
 className="px-3 py-1.5 rounded-lg bg-theme-accent hover:bg-theme-accent text-white text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer shadow-md"
 >
 <Download className="h-3.5 w-3.5" />
 <span>Download OpenAPI 3.0</span>
 </a>
 </div>
 </div>

 {/* Language Selector Tabs */}
 <div className="flex space-x-2 border-b border-theme-border pb-3">
 {(['typescript', 'python', 'curl', 'openapi'] as const).map((lang) => (
 <button
 key={lang}
 onClick={() => setSdkLang(lang)}
 className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold capitalize transition cursor-pointer ${
 sdkLang === lang
 ? 'bg-theme-accent/30 text-theme-accent/70 border border-theme-border'
 : 'text-slate-400 hover:text-slate-200'
 }`}
 >
 {lang === 'openapi' ? 'OpenAPI Spec (JSON)' : lang}
 </button>
 ))}
 </div>

 {/* Code Output Box */}
 <div className="relative">
 <pre className="p-4 rounded-xl bg-theme-surface border border-theme-border text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed max-h-[500px]">
 <code>{codeSnippets[sdkLang]}</code>
 </pre>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};
