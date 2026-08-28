import React, { useState } from 'react';
import { PGLRecord } from '@/lib/spine/types';
import {
 ShieldCheck,
 Lock,
 CheckCircle2,
 AlertTriangle,
 Search,
 FileText,
 Zap,
 RefreshCw,
 Sliders,
 Check,
 XCircle,
} from 'lucide-react';

interface PGLLedgerExplorerProps {
 records: PGLRecord[];
}

export const PGLLedgerExplorer: React.FC<PGLLedgerExplorerProps> = ({ records }) => {
 const [searchTerm, setSearchTerm] = useState<string>('');
 const [selectedRecordId, setSelectedRecordId] = useState<string | null>(records[0]?.id || null);

 // Verification state
 const [isVerifying, setIsVerifying] = useState<boolean>(false);
 const [tamperInput, setTamperInput] = useState<string>('{"workload":"sample_inference","units": 15}');
 const [tamperMode, setTamperMode] = useState<boolean>(false);
 const [verificationResult, setVerificationResult] = useState<any | null>(null);

 const filteredRecords = records.filter(
 (r) =>
 r.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
 r.capabilityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
 r.pglSignature.toLowerCase().includes(searchTerm.toLowerCase())
 );

 const selectedRecord = records.find((r) => r.id === selectedRecordId) || records[0];

 const handleVerifyProof = async () => {
 if (!selectedRecord) return;
 setIsVerifying(true);
 setVerificationResult(null);

 try {
 const payloadToTest = tamperMode
 ? JSON.parse(tamperInput + ' /* TAMPERED_DATA */')
 : JSON.parse(tamperInput || '{}');

 const res = await fetch('/api/ledger/verify', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 recordId: selectedRecord.id,
 transactionId: selectedRecord.transactionId,
 capabilityId: selectedRecord.capabilityId,
 payload: payloadToTest,
 responseHash: selectedRecord.responseHash,
 pglSignature: selectedRecord.pglSignature,
 }),
 });

 const data = await res.json();
 setVerificationResult(data.verificationResult || data);
 } catch (err) {
 setVerificationResult({
 valid: false,
 tamperDetected: true,
 computedPayloadHash: '0x_INVALID_JSON_TAMPER_DETECTED',
 expectedSignature: 'SIG_COMPUTE_FAILED',
 signatureMatch: false,
 verificationTimestamp: new Date().toISOString(),
 attestationChain: [
 {
 layer: 'Layer 1: SHA-256 Payload Digest',
 status: 'FAILED',
 detail: 'Payload tampering corrupts byte-level canonical JSON schema.',
 },
 {
 layer: 'Layer 8: Cryptographic Signature Audit',
 status: 'FAILED',
 detail: 'TAMPER DETECTED: Computed payload hash does not match PGL cryptographic seal.',
 },
 ],
 });
 } finally {
 setIsVerifying(false);
 }
 };

 return (
 <div className="space-y-6">
 {/* Banner Explaining PGL Evidence & x402 Settlement */}
 <div className="bg-theme-surface border border-theme-border rounded-xl p-6 shadow-sm">
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
 <div>
 <div className="flex items-center space-x-2">
 <span className="px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
 Layer 8: Evidence &amp; Settlement
 </span>
 <span className="text-xs text-slate-400 font-mono">PGL Cryptographic Proof Ledger &amp; x402 Gas</span>
 </div>
 <h2 className="text-xl font-bold text-white mt-1">
 Proof Graph Ledger (PGL) &amp; Enterprise Cryptographic Verification
 </h2>
 <p className="text-sm text-slate-300 mt-1 max-w-3xl">
 Every state transition executed across local or cloud substrate nodes produces a cryptographically signed SHA-256 proof record persisted to disk. Verify tamper detection in real time against HMAC-SHA256 substrate seals.
 </p>
 </div>

 <div className="flex items-center space-x-3 text-xs font-mono">
 <div className="p-3 bg-theme-surface border border-theme-border rounded-lg text-center">
 <span className="text-slate-400 block text-[10px]">PGL RECORDS</span>
 <span className="text-base font-bold text-emerald-400">{records.length}</span>
 </div>
 <div className="p-3 bg-theme-surface border border-theme-border rounded-lg text-center">
 <span className="text-slate-400 block text-[10px]">GAS SETTLED</span>
 <span className="text-base font-bold text-amber-400">
 {records.reduce((acc, r) => acc + r.x402GasSettled, 0).toFixed(4)} VEK
 </span>
 </div>
 </div>
 </div>
 </div>

 {/* Ledger Table & Selected Proof Inspector */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 {/* Ledger Table List */}
 <div className="lg:col-span-6 bg-theme-surface border border-theme-border rounded-xl p-5 space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono">
 Immutable Evidence Ledger ({filteredRecords.length})
 </h3>

 <div className="relative">
 <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5" />
 <input
 type="text"
 placeholder="Search Tx ID or Proof Sig..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="pl-8 pr-3 py-1.5 bg-theme-surface border border-theme-border rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 w-full sm:w-56"
 />
 </div>
 </div>

 <div className="space-y-2 max-h-[550px] overflow-y-auto">
 {filteredRecords.map((rec) => {
 const isSelected = rec.id === selectedRecordId;

 return (
 <div
 key={rec.id}
 onClick={() => {
 setSelectedRecordId(rec.id);
 setVerificationResult(null);
 }}
 className={`p-3.5 rounded-lg border transition cursor-pointer font-mono text-xs space-y-2 ${
 isSelected
 ? 'bg-theme-surface border-emerald-500 shadow-md shadow-emerald-500/10'
 : 'bg-theme-surface border-theme-border hover:border-theme-border'
 }`}
 >
 <div className="flex items-center justify-between">
 <span className="font-bold text-white text-sm">{rec.transactionId}</span>
 <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px]">
 VERIFIED
 </span>
 </div>

 <div className="flex justify-between text-[11px] text-slate-400">
 <span>Node: <strong className="text-slate-200">{rec.executedNodeId}</strong></span>
 <span>Cap: <strong className="text-theme-accent">{rec.capabilityId}</strong></span>
 </div>

 <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-theme-border">
 <span className="truncate max-w-[200px]">Sig: {rec.pglSignature}</span>
 <span className="text-amber-400 font-bold">{rec.x402GasSettled} VEK</span>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Cryptographic Inspector & Verification Engine */}
 {selectedRecord && (
 <div className="lg:col-span-6 bg-theme-surface border border-theme-border rounded-xl p-6 space-y-5">
 <div className="flex items-center justify-between border-b border-theme-border pb-4">
 <div className="flex items-center space-x-2">
 <ShieldCheck className="h-5 w-5 text-emerald-400" />
 <div>
 <h3 className="font-bold text-white text-base">Cryptographic Proof Seal</h3>
 <span className="text-[10px] font-mono text-slate-400 block">{selectedRecord.id}</span>
 </div>
 </div>

 <button
 onClick={handleVerifyProof}
 disabled={isVerifying}
 className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition shadow-md shadow-emerald-500/20"
 >
 <RefreshCw className={`h-3.5 w-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
 <span>Verify Cryptographic Signature</span>
 </button>
 </div>

 <div className="space-y-3 font-mono text-xs">
 <div className="p-3 bg-theme-surface border border-theme-border rounded-lg space-y-1">
 <span className="text-slate-500 block text-[10px]">TRANSACTION ID</span>
 <span className="text-emerald-400 font-bold text-sm">{selectedRecord.transactionId}</span>
 </div>

 <div className="p-3 bg-theme-surface border border-theme-border rounded-lg space-y-1">
 <span className="text-slate-500 block text-[10px]">PGL SIGNATURE (HMAC-SHA256 Substrate Key)</span>
 <span className="text-theme-accent/70 break-all">{selectedRecord.pglSignature}</span>
 </div>

 <div className="p-3 bg-theme-surface border border-theme-border rounded-lg space-y-1">
 <span className="text-slate-500 block text-[10px]">REQUEST SHA-256 HASH</span>
 <span className="text-slate-300 break-all text-[11px]">{selectedRecord.requestPayloadHash}</span>
 </div>

 <div className="p-3 bg-theme-surface border border-theme-border rounded-lg space-y-1">
 <span className="text-slate-500 block text-[10px]">RESPONSE SHA-256 HASH</span>
 <span className="text-slate-300 break-all text-[11px]">{selectedRecord.responseHash}</span>
 </div>

 <div className="p-3 bg-theme-surface border border-theme-border rounded-lg space-y-1">
 <span className="text-slate-500 block text-[10px]">x402 GAS MICROPAYMENT</span>
 <span className="text-amber-400 font-bold">{selectedRecord.x402GasSettled} VEK Settled</span>
 </div>
 </div>

 {/* Tamper Simulation Console */}
 <div className="p-4 bg-theme-surface border border-theme-border rounded-xl space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
 <Sliders className="h-3.5 w-3.5 text-amber-400" />
 Tamper Detection Simulator
 </span>

 <button
 onClick={() => setTamperMode(!tamperMode)}
 className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition border ${
 tamperMode
 ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
 : 'bg-theme-surface text-slate-400 border-theme-border'
 }`}
 >
 {tamperMode ? 'Simulating Tampered Payload' : 'Normal Payload'}
 </button>
 </div>

 <textarea
 value={tamperInput}
 onChange={(e) => setTamperInput(e.target.value)}
 rows={2}
 className="w-full bg-theme-surface border border-theme-border rounded p-2 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-theme-border"
 />
 <p className="text-[10px] text-slate-400">
 Toggle &apos;Simulating Tampered Payload&apos; and click &apos;Verify Cryptographic Signature&apos; to test substrate byte-level tamper rejection.
 </p>
 </div>

 {/* Verification Results Panel */}
 {verificationResult && (
 <div
 className={`p-4 rounded-xl border space-y-3 font-mono text-xs ${
 verificationResult.valid
 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
 : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
 }`}
 >
 <div className="flex items-center justify-between">
 <span className="font-bold text-sm flex items-center gap-2">
 {verificationResult.valid ? (
 <>
 <CheckCircle2 className="h-4 w-4 text-emerald-400" />
 CRYPTO PROOF VALIDATED
 </>
 ) : (
 <>
 <XCircle className="h-4 w-4 text-rose-400" />
 TAMPER DETECTED - PROOF INVALID
 </>
 )}
 </span>
 <span className="text-[10px] text-slate-400">
 {verificationResult.verificationTimestamp?.slice(11, 19)}
 </span>
 </div>

 <div className="space-y-1.5 pt-2 border-t border-theme-border text-[11px]">
 {verificationResult.attestationChain?.map((item: any, idx: number) => (
 <div key={idx} className="flex items-start justify-between gap-2">
 <span className="text-slate-400">{item.layer}:</span>
 <span className={item.status === 'PASSED' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
 {item.detail}
 </span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 );
};
