import React, { useState } from 'react';
import { Layers, Search, ShieldCheck, ShieldAlert, Plus, CheckCircle2, FileCode, Key, AlertTriangle, RefreshCw } from 'lucide-react';
import { SkillSpec, SecurityScanResult } from '../types.js';

interface SkillRegistryViewProps {
 skills: SkillSpec[];
 onSkillAdded: (skill: SkillSpec) => void;
}

export const SkillRegistryView: React.FC<SkillRegistryViewProps> = ({ skills, onSkillAdded }) => {
 const [searchTerm, setSearchTerm] = useState<string>('');
 const [selectedCategory, setSelectedCategory] = useState<string>('all');
 const [showImportModal, setShowImportModal] = useState<boolean>(false);
 const [importName, setImportName] = useState<string>('');
 const [importDescription, setImportDescription] = useState<string>('');
 const [importCode, setImportCode] = useState<string>(
 `name: ECC Code Analyzer\nversion: 1.0.0\ndescription: Custom ECC skill for code quality\npermissions:\n - read:workspace\ntools:\n - name: analyze_file\n parameters:\n filePath: string`
 );
 const [isScanning, setIsScanning] = useState<boolean>(false);
 const [scanResult, setScanResult] = useState<SecurityScanResult | null>(null);
 const [importError, setImportError] = useState<string | null>(null);

 const filteredSkills = skills.filter((s) => {
 const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
 s.id.toLowerCase().includes(searchTerm.toLowerCase());
 const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
 return matchesSearch && matchesCat;
 });

 const handleIntakeSubmit = async () => {
 if (!importName.trim() || !importCode.trim()) return;
 setIsScanning(true);
 setScanResult(null);
 setImportError(null);

 try {
 const response = await fetch('/api/local/skills/intake', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 name: importName.trim(),
 description: importDescription.trim(),
 skillCodeOrManifest: importCode,
 category: 'code-gen',
 author: 'Enterprise Developer'
 })
 });

 const data = await response.json();
 if (data.securityScan) {
 setScanResult(data.securityScan);
 }

 if (response.ok && data.success && data.skill) {
 onSkillAdded(data.skill);
 setTimeout(() => {
 setShowImportModal(false);
 setImportName('');
 setImportDescription('');
 setScanResult(null);
 }, 1500);
 } else {
 setImportError(data.error || 'Skill intake rejected by RepoGate Scanner');
 }
 } catch (err: any) {
 setImportError(err.message || 'Intake failed');
 } finally {
 setIsScanning(false);
 }
 };

 return (
 <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-slate-200">
 {/* Top Header */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-theme-border">
 <div>
 <div className="flex items-center gap-2 text-theme-accent text-xs font-mono font-medium mb-1">
 <Layers className="w-4 h-4" /> VEKLOM SKILL REGISTRY & REPO-GATE
 </div>
 <h2 className="text-2xl font-bold text-white">Capability Registry & Security Intake</h2>
 <p className="text-xs text-slate-400 font-mono">
 Manage EUC (Everything Universal Code) skills, MCP tools, and cAPI capabilities across any IDE or agent runtime with RepoGate AST security scanning.
 </p>
 </div>

 <button
 onClick={() => setShowImportModal(true)}
 className="px-4 py-2 rounded-xl bg-theme-accent hover:bg-theme-accent text-white font-bold text-xs tracking-wider uppercase shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
 >
 <Plus className="w-4 h-4" /> Register New Skill / EUC Import
 </button>
 </div>

 {/* Filter and Search Bar */}
 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-theme-surface p-4 rounded-xl border border-theme-border">
 <div className="relative w-full sm:w-96">
 <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
 <input
 type="text"
 placeholder="Search skills, hashes, or descriptions..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full bg-theme-surface border border-theme-border rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-theme-border"
 />
 </div>

 <div className="flex items-center gap-2 text-xs font-mono w-full sm:w-auto overflow-x-auto">
 {['all', 'code-gen', 'mcp-tool', 'data-pipeline', 'orchestration'].map((cat) => (
 <button
 key={cat}
 onClick={() => setSelectedCategory(cat)}
 className={`px-3 py-1.5 rounded-lg border transition-all uppercase text-3xs font-bold ${
 selectedCategory === cat
 ? 'bg-theme-accent/20 border-theme-border text-theme-accent/70'
 : 'bg-theme-surface border-theme-border text-slate-400 hover:text-slate-200'
 }`}
 >
 {cat}
 </button>
 ))}
 </div>
 </div>

 {/* Skill Cards Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredSkills.map((s) => (
 <div key={s.id} className="bg-theme-surface p-5 rounded-2xl border border-theme-border space-y-4 hover:border-theme-border transition-all flex flex-col justify-between">
 <div className="space-y-3">
 <div className="flex items-start justify-between gap-2">
 <div>
 <div className="flex items-center gap-2">
 <h3 className="font-bold text-sm text-white">{s.name}</h3>
 {(s.eucCompatible || s.eccCompatible) && (
 <span className="px-2 py-0.5 rounded bg-theme-accent/10 border border-theme-border text-theme-accent text-3xs font-mono font-bold">
 EUC
 </span>
 )}
 </div>
 <div className="text-3xs font-mono text-slate-400 mt-0.5">{s.id} (v{s.version})</div>
 </div>

 <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-3xs font-mono font-bold shrink-0">
 {s.reputationScore}/100 Rep
 </span>
 </div>

 <p className="text-xs text-slate-300 leading-relaxed font-sans">{s.description}</p>

 <div className="p-2.5 bg-theme-surface rounded-lg border border-theme-border space-y-1 font-mono text-3xs">
 <div><span className="text-slate-400">Author:</span> <span className="text-slate-200">{s.author}</span></div>
 <div><span className="text-slate-400">SHA-256 Hash:</span> <span className="text-theme-accent truncate block">{s.hash.substring(0, 28)}...</span></div>
 <div><span className="text-slate-400">Signer:</span> <span className="text-emerald-400">{s.provenanceSigner}</span></div>
 </div>

 {s.codeSnippet && (
 <div className="space-y-1">
 <span className="text-3xs font-mono text-slate-400 uppercase">YAML Manifest Snippet</span>
 <pre className="p-2.5 bg-theme-surface rounded-lg border border-theme-border text-3xs font-mono text-slate-300 overflow-x-auto max-h-24">
 {s.codeSnippet}
 </pre>
 </div>
 )}
 </div>

 <div className="pt-3 border-t border-theme-border flex items-center justify-between text-3xs font-mono">
 <span className="text-slate-400">Permissions:</span>
 <div className="flex items-center gap-1">
 {s.permissions.map((p) => (
 <span key={p} className="px-1.5 py-0.5 rounded bg-theme-surface text-slate-300">
 {p}
 </span>
 ))}
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Intake Security Scan Modal */}
 {showImportModal && (
 <div className="fixed inset-0 bg-theme-surface backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <div className="bg-theme-surface border border-theme-border rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
 <div className="flex items-center justify-between border-b border-theme-border pb-3">
 <h3 className="font-bold text-base text-white flex items-center gap-2">
 <ShieldCheck className="w-5 h-5 text-theme-accent" /> RepoGate Skill Intake & Security Scanner
 </h3>
 <button
 onClick={() => setShowImportModal(false)}
 className="text-slate-400 hover:text-white text-xs font-mono"
 >
 ✕ Close
 </button>
 </div>

 <div className="space-y-3 text-xs font-mono">
 <div className="space-y-1">
 <label className="text-slate-400 uppercase text-3xs">Skill Name</label>
 <input
 type="text"
 placeholder="e.g., ECC AST Security Linter"
 value={importName}
 onChange={(e) => setImportName(e.target.value)}
 className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-theme-border"
 />
 </div>

 <div className="space-y-1">
 <label className="text-slate-400 uppercase text-3xs">Description</label>
 <input
 type="text"
 placeholder="Brief description of capabilities..."
 value={importDescription}
 onChange={(e) => setImportDescription(e.target.value)}
 className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-theme-border"
 />
 </div>

 <div className="space-y-1">
 <label className="text-slate-400 uppercase text-3xs">SKILL.md Manifest or JS/TS Source Code</label>
 <textarea
 rows={7}
 value={importCode}
 onChange={(e) => setImportCode(e.target.value)}
 className="w-full bg-theme-surface border border-theme-border rounded-lg p-3 text-2xs text-slate-200 focus:outline-none focus:border-theme-border"
 ></textarea>
 </div>

 {scanResult && (
 <div className={`p-3 rounded-xl border space-y-1 text-2xs ${
 scanResult.passed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
 }`}>
 <div className="font-bold flex items-center justify-between">
 <span>RepoGate Threat Level: {scanResult.threatLevel}</span>
 <span>Signature: {scanResult.repoGateSignature.substring(0, 16)}...</span>
 </div>
 {scanResult.astVulnerabilities.map((v, i) => (
 <div key={i}>• {v}</div>
 ))}
 </div>
 )}

 {importError && (
 <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-2xs">
 {importError}
 </div>
 )}
 </div>

 <div className="flex items-center justify-end gap-3 pt-3 border-t border-theme-border">
 <button
 onClick={() => setShowImportModal(false)}
 className="px-4 py-2 rounded-lg bg-theme-surface hover:bg-theme-surface text-slate-300 font-mono text-xs cursor-pointer"
 >
 Cancel
 </button>
 <button
 onClick={handleIntakeSubmit}
 disabled={isScanning || !importName.trim()}
 className="px-5 py-2 rounded-lg bg-theme-accent hover:bg-theme-accent text-white font-mono font-bold text-xs uppercase flex items-center gap-2 cursor-pointer disabled:opacity-50"
 >
 {isScanning ? (
 <>
 <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Scanning AST & Registering...
 </>
 ) : (
 <>
 <ShieldCheck className="w-3.5 h-3.5" /> Scan & Register Skill
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};
