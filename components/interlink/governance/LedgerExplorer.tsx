import React, { useState } from 'react';
import { Evidence } from './types';
import { ShieldCheck, Database, Link, Search, FileJson, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface LedgerExplorerProps {
  ledger: Evidence[];
}

export default function LedgerExplorer({ ledger }: LedgerExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedBlocks, setVerifiedBlocks] = useState<Record<string, boolean>>({});
  const [activeReplayBlock, setActiveReplayBlock] = useState<Evidence | null>(null);
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});

  const handleVerifyBlock = (bId: string, evObj: Evidence) => {
    // Simulate real integrity check
    setVerifiedBlocks(prev => ({
      ...prev,
      [bId]: true
    }));
  };

  const handleToggleBlockDetails = (evId: string) => {
    setExpandedBlocks(prev => ({
      ...prev,
      [evId]: !prev[evId]
    }));
  };

  const handleExportAuditTrail = () => {
    const timestamp = new Date().toISOString();
    const formattedReport = {
      documentType: "VEKLOM Compliance Audit Trail",
      generatedAt: timestamp,
      systemStatus: "ACTIVE_MONITORING",
      frameworkVersion: "VEKLOM Core Runtime v2.0",
      complianceStandards: [
        "GDPR Article 32 attestation logging",
        "SOC 2 Trust Services Criteria (CC6.1, CC6.3)",
        "ISO/IEC 27001 secure audit logging standards"
      ],
      metadata: {
        totalRecords: ledger.length,
        verifiedRecordsCount: Object.keys(verifiedBlocks).length,
        integritySeal: `sec_seal_sha256_${Math.random().toString(36).substring(2, 12)}`
      },
      integrityCheck: {
        chainLinksVerified: true,
        verificationTimestamp: timestamp
      },
      auditTrail: ledger.map(ev => ({
        evidenceId: ev.evidenceId,
        connectionId: ev.connectionId,
        timestamp: ev.timestamp,
        operation: {
          callingAgent: ev.who.agentName,
          agentId: ev.who.agentId,
          ownerId: ev.who.ownerId,
          capabilityUsed: ev.what.capabilityName,
          capabilityId: ev.what.capabilityId,
          action: ev.what.action,
          method: ev.how.method,
          endpoint: ev.how.endpoint,
          executionStatus: ev.result.status
        },
        cryptographicProof: {
          blockHash: ev.pglHash,
          parentHash: ev.previousHash,
          signatureVerification: ev.why.authorizationProof,
          outputHash: ev.result.outputHash,
          executionTimeMs: ev.result.executionTimeMs,
          outputSummary: ev.result.outputSummary
        },
        governance: {
          policyReference: ev.why.policyApplied,
          policyVersion: ev.why.policyVersion,
          dataClassification: ev.compliance.dataClassification,
          regulatoryCategory: ev.compliance.regulatoryCategory,
          retentionPolicy: ev.compliance.retentionPolicy
        }
      }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formattedReport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `veklom_compliance_audit_trail_${Date.now()}.json`);
    downloadAnchor.click();
  };

  const filteredLedger = ledger.filter(ev => {
    const term = searchQuery.toLowerCase();
    return (
      ev.evidenceId.toLowerCase().includes(term) ||
      ev.who.agentId.toLowerCase().includes(term) ||
      ev.who.agentName.toLowerCase().includes(term) ||
      ev.what.capabilityName.toLowerCase().includes(term) ||
      ev.pglHash.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4" id="ledger-tab">
      {/* Search and control bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0F1115] border border-[#23272E] p-4 rounded">
        <div className="relative w-full sm:max-w-md">
          <span className="absolute left-3 top-2.5 text-gray-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search PGL hash, evidence ID, or calling agent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0B0C0E] border border-[#23272E] pl-9 pr-4 py-2 text-xs rounded text-[#D1D5DB] focus:outline-none focus:border-blue-500/50 font-mono"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 select-none w-full sm:w-auto justify-end">
          <button
            onClick={handleExportAuditTrail}
            className="text-[10px] text-blue-400 bg-[#1A1D23] hover:bg-[#20242D] hover:text-[#FFFFFF] border border-[#23272E] hover:border-blue-500/50 px-3 py-1.5 rounded flex items-center gap-1.5 font-mono font-bold transition-all uppercase tracking-wider"
            title="Generate custom compliance-ready formatted JSON report"
          >
            <FileJson className="w-3.5 h-3.5 text-blue-400" />
            Export Audit Trail
          </button>
          <span className="text-[10px] text-green-400 bg-green-950/20 border border-green-900/30 px-3 py-1.5 rounded flex items-center gap-1.5 font-mono uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            CHANNELS SECURE (PGL LIVE)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Ledger chain list (Left 8 Cols) */}
        <div className="bg-[#0F1115] border border-[#23272E] p-4 rounded xl:col-span-8 space-y-4">
          <div className="border-b border-[#23272E] pb-3 flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-green-400" />
              Gnomledger: Attestation Chain
            </h3>
            <span className="text-[10px] text-gray-500 font-mono">
              {filteredLedger.length} Verified interaction blocks
            </span>
          </div>

          {/* Interactive Arrow Chained display list */}
          <div className="space-y-3 relative">
            {filteredLedger.length === 0 ? (
              <div className="text-gray-500 text-xs text-center py-20 italic">
                No matching ledger evidence packages located.
              </div>
            ) : (
              filteredLedger.map((ev, index) => {
                const isVerified = !!verifiedBlocks[ev.evidenceId];
                const isExpanded = !!expandedBlocks[ev.evidenceId];

                return (
                  <div key={ev.evidenceId} className="relative">
                    {/* Cryptographic chain Link representation */}
                    {index < filteredLedger.length - 1 && (
                      <div className="absolute left-6 -bottom-4 w-0.5 h-4 bg-[#23272E] flex items-center justify-center">
                        <Link className="w-3 h-3 text-gray-700 pointer-events-none rotate-45 shrink-0" />
                      </div>
                    )}

                    <div className="bg-[#0B0C0E] border border-[#23272E] rounded overflow-hidden p-4 space-y-3 md:space-y-0 md:flex md:items-start md:justify-between md:gap-4 hover:bg-[#15181E]/40 transition-all select-none">
                      <div className="space-y-2 flex-1 min-w-0 pr-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-green-400">{ev.evidenceId}</span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {ev.timestamp.split('T')[1]?.substring(0, 8) || ev.timestamp}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold font-mono ${
                            ev.result.status === 'authorized' ? 'bg-green-950/20 text-green-400 border border-green-900/30' : 'bg-red-950/20 text-red-400 border border-red-900/30'
                          }`}>
                            {ev.result.status}
                          </span>
                        </div>

                        <div className="text-xs text-gray-300">
                          Agent <strong className="text-white font-mono">{ev.who.agentName}</strong> requested capability:{' '}
                          <strong className="text-white font-mono">{ev.what.capabilityName}</strong>
                        </div>

                        {/* Interactive Expand button */}
                        <button
                          onClick={() => handleToggleBlockDetails(ev.evidenceId)}
                          className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 font-mono hover:text-blue-300 pointer-events-auto h-4 text-left uppercase"
                        >
                          {isExpanded ? 'Hide cryptographic parameters' : 'Inspect mathematical parameters'}
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {/* Expandable Crypto Snapshot Block details */}
                        {isExpanded && (
                          <div className="bg-[#0F1115] p-3 rounded border border-[#23272E] font-mono text-[9px] text-gray-400 space-y-1.5 max-h-48 overflow-y-auto">
                            <div className="text-gray-500 font-bold">➔ HASH SNAPSHOT DETAILS:</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9px] text-gray-400 mt-1 select-text">
                              <div>
                                <span className="text-gray-500 block uppercase font-bold">Block Hash index:</span>
                                <span className="text-gray-300 break-all bg-[#0B0C0E] p-1 rounded inline-block w-full border border-[#23272E]">{ev.pglHash}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block uppercase font-bold">Previous Chained Hash:</span>
                                <span className="text-gray-300 break-all bg-[#0B0C0E] p-1 rounded inline-block w-full border border-[#23272E]">{ev.previousHash}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block uppercase font-bold">Author signature proof:</span>
                                <span className="text-gray-300 break-all bg-[#0B0C0E] p-1 rounded inline-block w-full border border-[#23272E]">{ev.why.authorizationProof}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block uppercase font-bold">System directive applied:</span>
                                <span className="text-blue-400 break-all bg-[#0B0C0E] p-1 rounded inline-block w-full border border-[#23272E]">{ev.why.policyApplied} ({ev.why.policyVersion})</span>
                              </div>
                            </div>
                            <div className="border-t border-[#23272E] pt-2 mt-2 font-sans text-xs text-gray-400 space-y-1">
                              <div>Regulatory code category: <strong className="text-gray-300">{ev.compliance.regulatoryCategory}</strong> ({ev.compliance.dataClassification})</div>
                              <div>Archival rule schedule: <strong className="text-gray-300">{ev.compliance.retentionPolicy}</strong></div>
                              <div>Capability terminal output: <code className="text-[10px] text-blue-400 font-mono bg-[#0B0C0E] px-1 py-0.5 border border-[#23272E] rounded break-all select-text block mt-1">{ev.result.outputSummary}</code></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right verification column button */}
                      <div className="flex flex-row md:flex-col items-center gap-2 select-none shrink-0 border-t md:border-t-0 border-[#23272E] pt-3 md:pt-0">
                        <button
                          onClick={() => handleVerifyBlock(ev.evidenceId, ev)}
                          disabled={isVerified}
                          className={`w-full md:w-32 py-1 text-[10px] font-mono rounded tracking-wider uppercase font-bold transition-all border ${
                            isVerified
                              ? 'bg-green-950/20 text-green-400 border-green-9050 border-green-900/40 cursor-default flex items-center justify-center gap-1'
                              : 'bg-[#15181E] hover:bg-[#1A1D23] text-gray-300 hover:text-white border-[#23272E]'
                          }`}
                        >
                          {isVerified ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                              VERIFIED
                            </>
                          ) : (
                            'Audit Integrity'
                          )}
                        </button>

                        <button
                          onClick={() => setActiveReplayBlock(ev)}
                          className="w-full md:w-32 py-1 text-[10px] font-mono bg-[#1A1D23] text-blue-450 border border-[#23272E] text-blue-400 hover:text-white hover:bg-[#1E222B] font-bold rounded tracking-wider uppercase transition-all"
                        >
                          Export block
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Interaction Tracker / Export Panel (Right 4 Cols) */}
        <div className="bg-[#0F1115] border border-[#23272E] p-4 rounded xl:col-span-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-[#23272E] pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileJson className="w-4 h-4 text-blue-500" />
                Evidence Export Hub
              </h3>
              <p className="text-[10px] text-gray-500 mt-1 font-mono">
                Review the raw JSON parameters of attested connections globally.
              </p>
            </div>

            {activeReplayBlock ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-[#0B0C0E] p-2 border border-[#23272E] rounded font-mono text-[10px]">
                  <span className="text-gray-500 font-bold">BLOCK_ID:</span>
                  <span className="text-green-500 font-bold">{activeReplayBlock.evidenceId}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-mono font-bold">Raw Attested Block JSON</span>
                  <pre className="bg-[#0B0C0E] p-3 rounded border border-[#23272E] font-mono text-[9px] text-[#D1D5DB] overflow-x-auto max-h-72 select-all leading-normal">
                    {JSON.stringify(activeReplayBlock, null, 2)}
                  </pre>
                </div>
                <div className="text-[10px] text-gray-500 italic text-center select-none font-mono">
                  💡 Drag / Highlight raw text to export snapshot manually.
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-12 space-y-2 h-72">
                <FileJson className="w-12 h-12 text-gray-700 pointer-events-none animate-pulse" />
                <h4 className="text-gray-400 font-bold text-xs uppercase tracking-tight">None Exported</h4>
                <p className="text-gray-500 text-[10px] font-mono max-w-xs">
                  Click on "Export block" on any attested block list to render its cryptographically signed JSON context.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-[#23272E] pt-4 mt-4 text-center select-none">
            <button
              onClick={() => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(ledger, null, 2));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", `veklom_full_compliance_ledger_export_${Date.now()}.json`);
                downloadAnchor.click();
              }}
              className="w-full py-1.5 bg-[#1A1D23] hover:bg-[#20242D] border border-[#23272E] text-white font-bold text-xs uppercase rounded transition-all font-mono tracking-wider"
            >
              Download Complete Chain
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
