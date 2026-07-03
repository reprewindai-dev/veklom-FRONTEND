import React, { useState } from 'react';
import { Evidence, QuarantinedTicket, Agent } from './types';
import { calculateSHA256 } from './scenarios';
import { ShieldAlert, Users, CheckCircle, Clock, AlertOctagon, Signature, HelpCircle, ArrowRight } from 'lucide-react';

interface QuarantineCenterProps {
  tickets: QuarantinedTicket[];
  onApproveTicket: (ticketId: string, updatedTicket: QuarantinedTicket, newEvidenceBlock: Evidence) => void;
  onDenyTicket: (ticketId: string) => void;
  onAppendLedgerBlock: (block: Evidence) => void;
  agents?: Agent[];
}

export default function QuarantineCenter({
  tickets,
  onApproveTicket,
  onDenyTicket,
  onAppendLedgerBlock,
  agents = []
}: QuarantineCenterProps) {
  // Currently active quarantine ticket being reviewed
  const [activeTicketId, setActiveTicketId] = useState<string | null>(
    tickets.find(t => t.status === 'pending')?.ticketId || null
  );

  // Identify rogue agents exceeding 3 consecutive anomalies
  const rogueAgents = agents.filter(agent => agent.consecutiveAnomalies > 3);


  // Signer slots states
  const [boardSigners, setBoardSigners] = useState([
    { id: 'approver-system', name: 'Sovereign Root Auditor (System)', trust: 98, role: 'Chief Security Officer', signed: false },
    { id: 'approver-kate', name: 'Kate (Research Director)', trust: 92, role: 'Data Governance Owner', signed: false },
    { id: 'approver-dave', name: 'Dave (Operations Admin)', trust: 85, role: 'Infrastructure Coordinator', signed: false }
  ]);

  const activeTicket = tickets.find(t => t.ticketId === activeTicketId && t.status === 'pending');

  const handleToggleSigner = (signerId: string) => {
    setBoardSigners(prev =>
      prev.map(s => (s.id === signerId ? { ...s, signed: !s.signed } : s))
    );
  };

  const signedCount = boardSigners.filter(s => s.signed).length;
  const quorumMet = signedCount >= 2;

  // Execute the quarantined action after quorum met
  const handleConsensusExecute = () => {
    if (!activeTicket) return;

    const curTime = new Date().toISOString();
    const outputTxt = 'Cascading delete initiated. Truncated 45 records under ticket consensus authorization ' + activeTicket.ticketId;
    const outputHash = calculateSHA256(outputTxt);

    // Build the final multi-sig evidence block
    const approverNames = boardSigners.filter(s => s.signed).map(s => s.name).join(', ');
    const newEvidence: Evidence = {
      evidenceId: 'ev-' + Math.floor(Math.random() * 89999 + 10000),
      connectionId: activeTicket.connectionId,
      previousHash: 'pgl_sha256_c23a1099fe42_ec4', // link to historical
      pglHash: '',
      timestamp: curTime,
      who: {
        agentId: activeTicket.agentId,
        agentName: activeTicket.agentName,
        publicKey: 'ed25519_pub_ff2084bce12040d9981',
        ownerId: 'owner-system-delegated'
      },
      what: {
        capabilityId: activeTicket.capabilityId,
        capabilityName: activeTicket.capabilityName,
        action: 'execute_quarantined_cascading_delete'
      },
      why: {
        policyApplied: 'sys-policy-01 (Quorum Triggered Override)',
        policyVersion: '2.0.0',
        authorizationProof: `quorum_signatures_ok_by_${approverNames}`
      },
      how: {
        method: 'mcp',
        endpoint: 'mcp://core-db/delete'
      },
      result: {
        status: 'authorized',
        outputHash: outputHash,
        executionTimeMs: 400,
        outputSummary: outputTxt
      },
      compliance: {
        regulatoryCategory: 'Cascading Truncation Records Retain Track',
        dataClassification: 'restricted',
        retentionPolicy: 'Regulated Records: 7 Years Retention'
      }
    };
    newEvidence.pglHash = calculateSHA256(JSON.stringify(newEvidence));

    const updatedTicket: QuarantinedTicket = {
      ...activeTicket,
      approvalsCollected: boardSigners.filter(s => s.signed).map(s => s.id),
      status: 'approved'
    };

    onApproveTicket(activeTicket.ticketId, updatedTicket, newEvidence);
    onAppendLedgerBlock(newEvidence);

    // Reset signers for future tickets
    setBoardSigners(prev => prev.map(s => ({ ...s, signed: false })));
    setActiveTicketId(null);

    alert(`CONGRATULATIONS: Autonomous consensus executed successfully: Codes dispatched to MCP Daemon. Cryptographic block ${newEvidence.evidenceId} mined to Ledger chain.`);
  };

  const handleDenyExecution = () => {
    if (!activeTicket) return;

    onDenyTicket(activeTicket.ticketId);
    setActiveTicketId(null);
    setBoardSigners(prev => prev.map(s => ({ ...s, signed: false })));
    alert('Security warning: Operation code denied manually. Quarantine ticket deactivated.');
  };

  return (
    <div className="space-y-4" id="quarantine-tab">
      {rogueAgents.length > 0 && (
        <div className="bg-red-950/20 border border-red-500/50 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_4px_25px_rgba(239,68,68,0.15)] animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-950 text-red-500 rounded border border-red-500/40 shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                Rogue Agent Risk Warning
              </h4>
              <p className="text-[11px] text-gray-400 mt-1 max-w-2xl leading-relaxed">
                Critical threshold breached! The following autonomous intelligence agents have exceeded <strong className="text-red-400 font-mono">3 consecutive anomalies</strong> without successful compliance clearings. Executive override containment procedures are advised.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {rogueAgents.map(ag => (
                  <span key={ag.id} className="bg-red-950/60 text-red-400 border border-red-900/60 text-[9.5px] font-mono px-2 py-0.5 rounded font-bold">
                    {ag.name}: {ag.consecutiveAnomalies} CONSECUTIVE ANOMALIES
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="text-[10px] bg-red-950 text-red-400 font-mono font-bold px-2.5 py-1 rounded border border-red-500/40 uppercase tracking-widest whitespace-nowrap">
            HALT AGENT RUNS
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Outstanding Tickets Queue (Left 4 Cols) */}
        <div className="bg-[#0F1115] border border-[#23272E] p-4 rounded xl:col-span-4 space-y-4">
          <div className="border-b border-[#23272E] pb-3 flex justify-between items-center">
            <h3 className="text-xs font-bold text-[#D1D5DB] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              Under Containment
            </h3>
            <span className="text-[10px] bg-amber-950/20 text-amber-400 border border-amber-900/40 px-2 py-0.5 rounded font-mono">
              {tickets.filter(t => t.status === 'pending').length} Held
            </span>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {tickets.filter(t => t.status === 'pending').length === 0 ? (
              <div className="text-gray-500 italic text-xs py-10 text-center">
                All quarantine queues are clear. Safe environment.
              </div>
            ) : (
              tickets
                .filter(t => t.status === 'pending')
                .map(ticket => (
                  <button
                    key={ticket.ticketId}
                    onClick={() => {
                      setActiveTicketId(ticket.ticketId);
                      setBoardSigners(prev => prev.map(s => ({ ...s, signed: false })));
                    }}
                    className={`w-full text-left p-3 rounded border transition-all flex flex-col gap-2 relative ${
                      activeTicketId === ticket.ticketId
                        ? 'bg-amber-950/20 border-amber-500'
                        : 'bg-[#0B0C0E] border-[#23272E] hover:bg-[#15181E]'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-bold text-amber-400">{ticket.ticketId}</span>
                      <span className="text-[9px] bg-[#0B0C0E] border border-[#23272E] text-slate-400 font-mono px-2 py-0.5 rounded">
                        M-of-N: 2 Approvers
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-white text-xs block">{ticket.agentName}</span>
                      <span className="text-[10px] text-gray-400">wants to use: <strong>{ticket.capabilityName}</strong></span>
                    </div>
                    <div className="text-[10px] text-gray-500 space-y-0.5 border-t border-[#23272E] pt-2 mt-1">
                      <div>CON_ID: {ticket.connectionId}</div>
                      <div>ALERT TIMESTAMP: {ticket.timestamp.split('T')[1]?.substring(0, 5) || '3:00 AM'}</div>
                    </div>
                  </button>
                ))
            )}
          </div>
        </div>

        {/* Quorum authorization terminal (Right 8 Cols) */}
        <div className="bg-[#0F1115] border border-[#23272E] p-4 rounded xl:col-span-8 flex flex-col justify-between min-h-[480px]">
          {activeTicket ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="border-b border-[#23272E] pb-3 flex justify-between items-start sm:items-center gap-4 flex-col sm:row-reverse sm:flex-row">
                <div>
                  <h3 className="text-xs font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-amber-500" />
                    Review Quarantine Event: {activeTicket.ticketId}
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-1 font-mono">
                    Anomalous behavioral payload isolated inside security containment pipelines.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase font-bold font-mono px-2.5 py-1 rounded bg-red-950/20 text-red-400 border border-red-900/40">
                    High threat score detected
                  </span>
                </div>
              </div>

              {/* Anomaly list block */}
              <div className="bg-red-950/10 border border-red-900/20 rounded p-4 space-y-2">
                <div className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  Sensing Diagnostics Alert triggers:
                </div>
                <ul className="space-y-1.5 text-xs text-gray-300 list-inside list-disc pl-1 decoration-rose-500">
                  {activeTicket.anomalies.map((anom, idx) => (
                    <li key={idx} className="leading-snug">{anom}</li>
                  ))}
                </ul>
              </div>

              {/* Signers Matrix Grid */}
              <div className="space-y-2">
                <h4 className="text-xs text-gray-300 uppercase tracking-widest font-bold flex items-center gap-1">
                  <Users className="w-4 h-4 text-blue-500" />
                  M-of-N Security Quorum Ledger (Need 2-of-3 board signatures)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {boardSigners.map(signer => (
                    <div
                      key={signer.id}
                      className={`p-3 rounded border transition-all flex flex-col justify-between gap-3 ${
                        signer.signed
                          ? 'bg-green-950/10 border-green-500/50'
                          : 'bg-[#0B0C0E] border-[#23272E]'
                      }`}
                    >
                      <div className="space-y-1 select-none">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white text-xs truncate">{signer.name.split(' ')[0]}</span>
                          <span className="text-[9px] text-gray-500 font-mono">Trust: {signer.trust}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">{signer.role}</div>
                      </div>

                      <button
                        id={`sign-quorum-${signer.id}`}
                        onClick={() => handleToggleSigner(signer.id)}
                        className={`w-full py-1.5 text-[10px] uppercase font-bold rounded transition-all font-mono tracking-wider flex items-center justify-center gap-1.5 ${
                          signer.signed
                            ? 'bg-green-900/20 text-green-400 hover:bg-[#1C1F26] border border-green-800'
                            : 'bg-[#15181E] text-gray-300 hover:text-white border border-[#23272E] shadow'
                        }`}
                      >
                        <Signature className="w-3.5 h-3.5" />
                        {signer.signed ? 'REVOKE SIGN' : 'SIGN COMPLIANCE'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Consensus Execute buttons */}
              <div className="border-t border-[#23272E] pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0B0C0E] p-3 rounded border border-[#23272E] mt-4 select-none">
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-500 font-mono uppercase font-bold">Current quorum criteria:</div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 bg-[#0F1115] border border-[#23272E] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${quorumMet ? 'bg-green-500' : 'bg-amber-500'}`}
                        style={{ width: `${(signedCount / 2) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-300">{signedCount} of 2 approvals</span>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    id="deny-quarantine-btn"
                    onClick={handleDenyExecution}
                    className="flex-1 sm:flex-none uppercase text-[10px] font-bold text-red-400 hover:text-red-300 border border-red-900/40 hover:bg-red-950/10 px-4 py-2.5 rounded transition-all font-mono tracking-wider bg-transparent"
                  >
                    Deny Action
                  </button>

                  <button
                    id="execute-consensus-btn"
                    onClick={handleConsensusExecute}
                    disabled={!quorumMet}
                    className={`flex-1 sm:flex-none py-2 px-4 font-bold uppercase text-[10px] rounded transition-all tracking-wider font-mono flex items-center justify-center gap-2 border ${
                      quorumMet
                        ? 'bg-[#15181E] hover:bg-[#1C1F26] border-green-500 text-white shadow'
                        : 'bg-[#0B0C0E] text-gray-500 border-[#23272E] cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    Bypass & Execute
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-12 space-y-3 h-full">
              <Signature className="w-16 h-16 text-gray-700 pointer-events-none animate-pulse" />
              <h3 className="text-gray-400 font-bold text-xs uppercase font-mono">No Quarantine Event Loaded</h3>
              <p className="text-gray-500 text-[11px] max-w-sm">
                Select an ongoing security ticket from the list on the left to review alerts and cast quorum approvals.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
