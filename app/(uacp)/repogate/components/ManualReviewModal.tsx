import React, { useState } from 'react';
import { VerifiedFinding } from '../types';
import { ShieldAlert, CheckCircle, Ban, ArrowRight } from 'lucide-react';

interface ManualReviewModalProps {
  isOpen: boolean;
  finding: VerifiedFinding | null;
  onDecision: (decision: 'APPROVED' | 'ESCALATED' | 'BLOCKED', note: string) => void;
}

export const ManualReviewModal: React.FC<ManualReviewModalProps> = ({ isOpen, finding, onDecision }) => {
  const [operatorNote, setOperatorNote] = useState('');

  if (!isOpen || !finding) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in font-mono">
      <div className="w-full max-w-xl bg-[#0F0F0F] border-4 border-[#FF6B00] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Banner */}
        <div className="bg-[#FF6B00] text-black px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
            <h3 className="font-bold uppercase text-[13px] tracking-widest">
              GPC Global Policy Violation Intercept
            </h3>
          </div>
          <span className="text-[10px] bg-black text-white px-2 py-0.5 font-bold">MODE: ENFORCED</span>
        </div>

        {/* Modal Metadata information */}
        <div className="p-6 space-y-5 flex-1 select-text">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest block">INTERCEPTED TARGET</span>
            <span className="text-white text-base font-bold break-all">{finding.path}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-y border-[#222] py-4">
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest block">TRIGGERED POLICY RULE</span>
              <span className="text-[#FF6B00] text-xs font-bold uppercase block mt-1">{finding.matched_rule}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest block">RULE RISK WEIGHT</span>
              <span className="text-red-500 text-xs font-bold uppercase block mt-1">{finding.risk_level}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest block">SYSTEM COMPLIANCE RISK SUMMARY</span>
            <p className="text-gray-400 text-xs leading-relaxed">
              {finding.reason} Operator digital signature required to continue or override this block action according to the system governance rules.
            </p>
          </div>

          {/* Decision Note input */}
          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 uppercase tracking-widest block" htmlFor="note-input">
              Operator Sign-off Remarks / Compliance Log
            </label>
            <textarea
              id="note-input"
              value={operatorNote}
              onChange={(e) => setOperatorNote(e.target.value)}
              placeholder="Provide reason for approval override, security elevation protocol, or block log..."
              className="w-full h-20 bg-black border border-[#333] focus:border-[#FF6B00] focus:ring-0 text-white text-xs p-3 outline-none resize-none font-mono tracking-wide placeholder-neutral-700"
            />
          </div>
        </div>

        {/* Modal Action Controls */}
        <div className="bg-[#121212] p-5 border-t border-[#222] flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          {/* Reject */}
          <button
            onClick={() => onDecision('BLOCKED', operatorNote || 'Policy rejected: Operator intervention block.')}
            className="px-4 py-2 bg-red-950/40 border border-red-500 text-red-500 text-xs font-bold uppercase tracking-wider hover:bg-red-900/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Block Action</span>
          </button>

          {/* Escalate */}
          <button
            onClick={() => onDecision('ESCALATED', operatorNote || 'Risk gate warning escalation triggered: Security team audit requested.')}
            className="px-4 py-2 bg-neutral-900 border border-yellow-500/70 text-yellow-500 text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>Escalate Authority</span>
          </button>

          {/* Approve */}
          <button
            onClick={() => onDecision('APPROVED', operatorNote || 'Operator reviewed and signed authorization.')}
            className="px-5 py-2.5 bg-[#FF6B00] text-black text-xs font-black uppercase tracking-wider hover:bg-opacity-90 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Approve & Seal Ledger</span>
          </button>
        </div>
      </div>
    </div>
  );
};
