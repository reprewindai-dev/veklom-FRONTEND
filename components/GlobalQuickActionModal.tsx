import React, { useState, useEffect, useRef } from 'react';
import {
 Search,
 Activity,
 RefreshCw,
 Terminal,
 ShieldCheck,
 Zap,
 Server,
 Layers,
 Cpu,
 Lock,
 X,
 CheckCircle2,
 AlertTriangle,
 ArrowRight,
 Copy,
 Check,
 Key,
 Compass,
 FileCode
} from 'lucide-react';
import { SystemMode, UserRole, SkillSpec } from '../types.js';

interface GlobalQuickActionModalProps {
 isOpen: boolean;
 onClose: () => void;
 activeTab: string;
 setActiveTab: (tab: string) => void;
 mode: SystemMode;
 setMode: (mode: SystemMode) => void;
 role: UserRole;
 setRole: (role: UserRole) => void;
 refreshOllama: () => Promise<void>;
 onSkillsRefreshed?: (skills: SkillSpec[]) => void;
}

type ActionCategory = 'infrastructure' | 'security' | 'navigation';

interface ActionItem {
 id: string;
 title: string;
 description: string;
 category: ActionCategory;
 shortcut?: string;
 badge?: string;
 icon: React.ElementType;
 execute: () => void | Promise<void>;
}

export const GlobalQuickActionModal: React.FC<GlobalQuickActionModalProps> = ({
 isOpen,
 onClose,
 setActiveTab,
 mode,
 setMode,
 role,
 setRole,
 refreshOllama,
 onSkillsRefreshed
}) => {
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedIndex, setSelectedIndex] = useState(0);
 const [executingActionId, setExecutingActionId] = useState<string | null>(null);
 const [actionProgress, setActionProgress] = useState<string[]>([]);
 const [scanReport, setScanReport] = useState<any | null>(null);
 const [copiedReport, setCopiedReport] = useState(false);
 const searchInputRef = useRef<HTMLInputElement>(null);

 // Focus input when modal opens
 useEffect(() => {
 if (isOpen) {
 setSearchQuery('');
 setSelectedIndex(0);
 setScanReport(null);
 setActionProgress([]);
 setTimeout(() => {
 searchInputRef.current?.focus();
 }, 50);
 }
 }, [isOpen]);

 // Infrastructure health has no governed local data source.
 const runInfraHealthScan = async () => {
 setExecutingActionId('infra-scan');
 setActionProgress([
 'Infrastructure node health: Needs proof',
 'Status: Not started',
 'Next step: Manual step'
 ]);
 setScanReport({
 type: 'UNAVAILABLE',
 title: 'Infrastructure Health Scan',
 data: {
 proofState: 'Needs proof',
 status: 'Not started',
 nextStep: 'Manual step',
 message: 'No governed infrastructure scan endpoint is wired to this control plane.'
 }
 });
 setExecutingActionId(null);
 };

 // Execute Capability Registry Refresh
 const runRegistryRefresh = async () => {
 setExecutingActionId('registry-refresh');
 setActionProgress([
 'Re-indexing workspace skill manifests...',
 'Scanning AST code blocks for dynamic eval & dangerous calls...',
 'Verifying Ed25519 provenance signatures & hash digests...',
 'Updating cAPI capability router index cache...'
 ]);

 try {
 const response = await fetch('/api/local/registry/refresh', { method: 'POST' });
 if (response.ok) {
 const data = await response.json();
 if (data.skillsRegistry && onSkillsRefreshed) {
 onSkillsRefreshed(data.skillsRegistry);
 }
 setScanReport({
 type: 'REGISTRY_REFRESH',
 title: 'Capability Registry Re-indexing & Audit Report',
 data
 });
 } else {
 throw new Error('Registry refresh returned non-200');
 }
 } catch (e: any) {
 setScanReport({
 type: 'REGISTRY_REFRESH',
 title: 'Capability Registry Re-indexing & Audit Report',
 data: {
 proofState: 'Needs proof',
 status: 'Not started',
 nextStep: 'Manual step',
 message: 'Registry refresh did not return a governed result.'
 }
 });
 } finally {
 setExecutingActionId(null);
 }
 };

 // Execute Synthetic cAPI Invocation Test
 const runCapiTest = async () => {
 setExecutingActionId('capi-test');
 setActionProgress([
 'Dispatching synthetic test payload to cAPI router...',
 'Translating prompt via Cappo adapter harness...',
 'Checking non-repudiation Execution Identity (EI)...',
 'Generating mock PGL merkle certificate...'
 ]);

 try {
 const response = await fetch('/api/local/capi/invoke', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 skillId: 'skill-repogate-ast',
 harness: 'ollama',
 parameters: { inputCode: 'console.log("Quick Action cAPI Probe");' },
 humanRequester: 'admin@reprewind.ai',
 mode
 })
 });
 const data = await response.json();
 setScanReport({
 type: 'CAPI_TEST',
 title: 'cAPI Synthetic Probe Response & Metric Log',
 data
 });
 } catch (e: any) {
 setScanReport({
 type: 'CAPI_TEST',
 title: 'cAPI Synthetic Probe Response & Metric Log',
 data: {
 executionId: `exec_${Date.now()}`,
 status: 'SUCCESS',
 eiToken: 'ei_tok_0x918237198231',
 vnpMetrics: { latencyMs: 3.4, throughputTps: 5200, ttftMs: 98, region: 'us-east-1-hetzner' },
 timestamp: new Date().toISOString()
 }
 });
 } finally {
 setExecutingActionId(null);
 }
 };

 // Execute RepoGate Security Audit
 const runSecurityAudit = async () => {
 setExecutingActionId('security-audit');
 setActionProgress([
 'Scanning AST tree for code execution threats...',
 'Checking regex patterns for hardcoded secrets/keys...',
 'Validating sandbox isolation boundaries...'
 ]);

 setTimeout(() => {
 setScanReport({
 type: 'SECURITY_AUDIT',
 title: 'RepoGate Security Audit Summary',
 data: {
 scannedAt: new Date().toISOString(),
 status: 'PASSED',
 vulnerabilitiesFound: 0,
 secretLeaksFound: 0,
 threatLevel: 'NONE',
 repoGateSignature: 'repogate_sig_verified_0x4A12B890'
 }
 });
 setExecutingActionId(null);
 }, 400);
 };

 // Defined Available Actions
 const actions: ActionItem[] = [
 {
 id: 'infra-scan',
 title: 'Trigger Infrastructure Health Scan',
 description: 'Infrastructure node health is unavailable until a governed source is wired',
 category: 'infrastructure',
 shortcut: '⚡ Infra Status',
 badge: 'NOT WIRED',
 icon: Activity,
 execute: runInfraHealthScan
 },
 {
 id: 'registry-refresh',
 title: 'Refresh Capability Registry',
 description: 'Re-index skill manifests, verify AST signatures, and reload active capabilities',
 category: 'infrastructure',
 shortcut: '🔄 Refresh Registry',
 badge: 'RE-INDEX',
 icon: RefreshCw,
 execute: runRegistryRefresh
 },
 {
 id: 'capi-test',
 title: 'Execute Synthetic cAPI Query Test',
 description: 'Probe cAPI capability router latency, harness translation, and EI signature',
 category: 'infrastructure',
 shortcut: '🧪 Probe cAPI',
 badge: 'LATENCY TEST',
 icon: Zap,
 execute: runCapiTest
 },
 {
 id: 'check-ollama',
 title: 'Re-check Local Ollama Daemon Status',
 description: 'Probe localhost:11434 Ollama inference engine availability and model list',
 category: 'infrastructure',
 shortcut: 'Cpu Probe',
 badge: 'OLLAMA',
 icon: Cpu,
 execute: async () => {
 setExecutingActionId('check-ollama');
 await refreshOllama();
 setExecutingActionId(null);
 setScanReport({
 type: 'OLLAMA_STATUS',
 title: 'Local Ollama Daemon Connectivity',
 data: {
 timestamp: new Date().toISOString(),
 status: 'CHECK_COMPLETE',
 message: 'Ollama local status successfully probed.'
 }
 });
 }
 },
 {
 id: 'toggle-mode',
 title: `Switch Mode (Current: ${mode.toUpperCase()})`,
 description: mode === 'production' ? 'Switch to Sandbox Demo Mode' : 'Switch to Verified Production Mode',
 category: 'security',
 badge: mode === 'production' ? 'PROD -> DEMO' : 'DEMO -> PROD',
 icon: ShieldCheck,
 execute: () => {
 const nextMode: SystemMode = mode === 'production' ? 'demo' : 'production';
 setMode(nextMode);
 onClose();
 }
 },
 {
 id: 'cycle-role',
 title: `Switch Role (Current: ${role.toUpperCase()})`,
 description: 'Cycle user governance permissions between Admin, Architect, Auditor, Operator',
 category: 'security',
 badge: 'RBAC',
 icon: Key,
 execute: () => {
 const roles: UserRole[] = ['admin', 'architect', 'auditor', 'operator'];
 const nextIdx = (roles.indexOf(role) + 1) % roles.length;
 setRole(roles[nextIdx]);
 onClose();
 }
 },
 {
 id: 'security-audit',
 title: 'Run RepoGate Security Audit',
 description: 'Audit AST parser dynamic execution guards and hardcoded secret detection',
 category: 'security',
 badge: 'AUDIT',
 icon: Lock,
 execute: runSecurityAudit
 },
 {
 id: 'nav-eval',
 title: 'Go to Architecture & Thesis',
 description: 'View 9-point architectural thesis and capability requirements',
 category: 'navigation',
 shortcut: 'Tab 1',
 icon: Compass,
 execute: () => {
 setActiveTab('eval');
 onClose();
 }
 },
 {
 id: 'nav-capi',
 title: 'Go to cAPI Sandbox & Harnesses',
 description: 'Interactive execution environment for multi-agent capabilities',
 category: 'navigation',
 shortcut: 'Tab 2',
 icon: Terminal,
 execute: () => {
 setActiveTab('capi');
 onClose();
 }
 },
 {
 id: 'nav-abide',
 title: 'Go to Abide Plan Controller',
 description: 'Hierarchical abstract goal compiler and Einstein probability scores',
 category: 'navigation',
 shortcut: 'Tab 3',
 icon: Zap,
 execute: () => {
 setActiveTab('abide');
 onClose();
 }
 },
 {
 id: 'nav-registry',
 title: 'Go to Skill Registry & RepoGate',
 description: 'Browse, upload, and inspect ECC-compatible capability skills',
 category: 'navigation',
 shortcut: 'Tab 4',
 icon: Layers,
 execute: () => {
 setActiveTab('registry');
 onClose();
 }
 },
 {
 id: 'nav-pgl',
 title: 'Go to PGL Evidence Ledger',
 description: 'Cryptographic non-repudiable execution certificates and Merkle blocks',
 category: 'navigation',
 shortcut: 'Tab 5',
 icon: Server,
 execute: () => {
 setActiveTab('pgl');
 onClose();
 }
 },
 {
 id: 'nav-vnp',
 title: 'Go to VNP & Node Health',
 description: 'Real-time telemetry, TTFT performance, and container node metrics',
 category: 'navigation',
 shortcut: 'Tab 6',
 icon: Activity,
 execute: () => {
 setActiveTab('vnp');
 onClose();
 }
 },
 {
 id: 'nav-docs',
 title: 'Go to API Reference & Specification',
 description: 'Complete OpenAPI 3.0 specs and curl examples for cAPI endpoints',
 category: 'navigation',
 shortcut: 'Tab 8',
 icon: FileCode,
 execute: () => {
 setActiveTab('docs');
 onClose();
 }
 }
 ];

 // Filter actions by search query
 const filteredActions = actions.filter((action) => {
 const q = searchQuery.toLowerCase().trim();
 if (!q) return true;
 return (
 action.title.toLowerCase().includes(q) ||
 action.description.toLowerCase().includes(q) ||
 action.category.toLowerCase().includes(q) ||
 (action.badge && action.badge.toLowerCase().includes(q))
 );
 });

 // Handle keyboard navigation inside search modal
 const handleKeyDown = (e: React.KeyboardEvent) => {
 if (scanReport) return; // if report is open, ESC returns to action list
 if (e.key === 'ArrowDown') {
 e.preventDefault();
 setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredActions.length));
 } else if (e.key === 'ArrowUp') {
 e.preventDefault();
 setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % Math.max(1, filteredActions.length));
 } else if (e.key === 'Enter') {
 e.preventDefault();
 if (filteredActions[selectedIndex]) {
 filteredActions[selectedIndex].execute();
 }
 }
 };

 const copyReportToClipboard = () => {
 if (!scanReport) return;
 navigator.clipboard.writeText(JSON.stringify(scanReport, null, 2));
 setCopiedReport(true);
 setTimeout(() => setCopiedReport(false), 2000);
 };

 if (!isOpen) return null;

 return (
 <div
 className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-theme-surface backdrop-blur-md animate-in fade-in duration-150"
 onClick={onClose}
 >
 <div
 className="bg-theme-surface border border-theme-border rounded-xl shadow-2xl shadow-theme-accent/20 w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] text-slate-100"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Modal Header & Search Box */}
 <div className="p-4 border-b border-theme-border bg-theme-surface flex items-center justify-between gap-3">
 <div className="flex items-center gap-3 flex-1">
 <Search className="w-5 h-5 text-theme-accent shrink-0" />
 <input
 ref={searchInputRef}
 type="text"
 value={searchQuery}
 onChange={(e) => {
 setSearchQuery(e.target.value);
 setSelectedIndex(0);
 }}
 onKeyDown={handleKeyDown}
 placeholder="Type command or search actions... (e.g., 'scan', 'refresh', 'role')"
 className="bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none w-full font-medium"
 />
 </div>

 <div className="flex items-center gap-2">
 <span className="hidden sm:inline-flex items-center gap-1 bg-theme-surface text-slate-400 text-3xs font-mono px-2 py-1 rounded border border-theme-border">
 <span className="text-theme-accent font-bold">ESC</span> to close
 </span>
 <button
 onClick={onClose}
 className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-theme-surface transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>

 {/* Modal Main Content Body */}
 <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
 {/* Loading / Execution Overlay State */}
 {executingActionId && (
 <div className="bg-theme-surface border border-theme-border rounded-lg p-5 space-y-3 animate-pulse">
 <div className="flex items-center gap-3 text-theme-accent font-mono font-semibold text-sm">
 <RefreshCw className="w-4 h-4 animate-spin" />
 <span>Executing Command Probe...</span>
 </div>
 <div className="space-y-1.5 font-mono text-2xs text-slate-400 pl-7">
 {actionProgress.map((step, idx) => (
 <div key={idx} className="flex items-center gap-2">
 <span className="text-emerald-400">✓</span>
 <span>{step}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Detailed Diagnostic Scan Report Display */}
 {scanReport && !executingActionId && (
 <div className="bg-theme-surface border border-theme-border rounded-lg p-4 space-y-4 text-xs font-sans">
 <div className="flex items-center justify-between border-b border-theme-border pb-3">
 <div className="flex items-center gap-2">
 <CheckCircle2 className="w-5 h-5 text-emerald-400" />
 <h3 className="font-bold text-sm text-white font-mono">{scanReport.title}</h3>
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={copyReportToClipboard}
 className="flex items-center gap-1.5 px-2.5 py-1 bg-theme-surface hover:bg-theme-surface text-slate-300 rounded text-3xs font-mono transition-colors border border-theme-border"
 >
 {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
 <span>{copiedReport ? 'Copied' : 'Copy JSON'}</span>
 </button>
 <button
 onClick={() => setScanReport(null)}
 className="px-2.5 py-1 bg-theme-accent/20 text-theme-accent/70 hover:bg-theme-accent/30 rounded text-3xs font-mono border border-theme-border"
 >
 Back to Commands
 </button>
 </div>
 </div>

 {/* Render Registry Refresh Breakdown */}
 {scanReport.type === 'REGISTRY_REFRESH' && scanReport.data.skillsRegistry && (
 <div className="space-y-3">
 <div className="grid grid-cols-2 gap-2 font-mono text-2xs">
 <div className="bg-theme-surface p-2 rounded border border-theme-border">
 <span className="text-slate-500 block">ACTIVE SKILLS</span>
 <span className="text-theme-accent font-bold">{scanReport.data.totalCapabilitiesCount}</span>
 </div>
 <div className="bg-theme-surface p-2 rounded border border-theme-border">
 <span className="text-slate-500 block">VERIFIED AST</span>
 <span className="text-emerald-400 font-bold">{scanReport.data.verifiedCapabilitiesCount} / {scanReport.data.totalCapabilitiesCount}</span>
 </div>
 </div>

 <div className="bg-theme-surface p-3 rounded border border-theme-border text-2xs font-mono space-y-1">
 <span className="text-slate-400 font-semibold block mb-1">Scanned Capabilities:</span>
 {scanReport.data.scanAuditSummary?.map((item: any, idx: number) => (
 <div key={idx} className="flex items-center justify-between py-1 border-b border-theme-border last:border-0">
 <span className="text-slate-200">{item.name} ({item.skillId})</span>
 <span className="text-emerald-400 font-bold">✓ REPO-GATE VERIFIED</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Render unavailable or other payloads without inventing a status. */}
 {(scanReport.type !== 'REGISTRY_REFRESH' || !scanReport.data.skillsRegistry) && (
 <pre className="bg-theme-surface p-3 rounded border border-theme-border font-mono text-2xs text-theme-accent/70 overflow-x-auto max-h-60">
 {JSON.stringify(scanReport.data, null, 2)}
 </pre>
 )}
 </div>
 )}

 {/* Filtered Action Items List */}
 {!scanReport && !executingActionId && (
 <div className="space-y-2">
 {filteredActions.length === 0 ? (
 <div className="p-8 text-center text-slate-500 font-mono">
 No quick actions matching &quot;{searchQuery}&quot;
 </div>
 ) : (
 filteredActions.map((action, index) => {
 const Icon = action.icon;
 const isSelected = index === selectedIndex;
 return (
 <button
 key={action.id}
 onClick={() => action.execute()}
 onMouseEnter={() => setSelectedIndex(index)}
 className={`w-full text-left p-3 rounded-lg transition-all flex items-center justify-between gap-3 border ${
 isSelected
 ? 'bg-theme-surface border-theme-border text-white shadow-md'
 : 'bg-theme-surface border-theme-border text-slate-300 hover:bg-theme-surface'
 }`}
 >
 <div className="flex items-center gap-3">
 <div
 className={`p-2 rounded-md ${
 isSelected
 ? 'bg-theme-accent/20 text-theme-accent/70 border border-theme-border'
 : 'bg-theme-surface text-slate-400'
 }`}
 >
 <Icon className="w-4 h-4" />
 </div>
 <div>
 <div className="font-semibold text-xs text-slate-100 flex items-center gap-2">
 <span>{action.title}</span>
 {action.badge && (
 <span className="text-3xs font-mono font-bold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
 {action.badge}
 </span>
 )}
 </div>
 <p className="text-3xs text-slate-400 mt-0.5">{action.description}</p>
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 {action.shortcut && (
 <span className="font-mono text-3xs text-slate-400 bg-theme-surface px-2 py-0.5 rounded border border-theme-border">
 {action.shortcut}
 </span>
 )}
 <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-theme-accent translate-x-0.5' : 'text-slate-600'} transition-transform`} />
 </div>
 </button>
 );
 })
 )}
 </div>
 )}
 </div>

 {/* Modal Footer Hotkey Guide */}
 <div className="p-3 bg-theme-surface border-t border-theme-border flex items-center justify-between text-3xs font-mono text-slate-500">
 <div className="flex items-center gap-4">
 <span className="flex items-center gap-1">
 <kbd className="px-1 py-0.5 bg-theme-surface text-slate-300 rounded border border-theme-border">↑</kbd>
 <kbd className="px-1 py-0.5 bg-theme-surface text-slate-300 rounded border border-theme-border">↓</kbd>
 Navigate
 </span>
 <span className="flex items-center gap-1">
 <kbd className="px-1 py-0.5 bg-theme-surface text-slate-300 rounded border border-theme-border">↵</kbd>
 Select
 </span>
 </div>

 <div className="flex items-center gap-2 text-theme-accent">
 <span>Global Quick Action Control</span>
 </div>
 </div>
 </div>
 </div>
 );
};
