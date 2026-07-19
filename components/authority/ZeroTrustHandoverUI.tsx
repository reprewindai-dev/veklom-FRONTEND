"use client";
import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle, Key } from 'lucide-react';

export default function ZeroTrustHandoverUI({ backendStatus, onApprove, onReject }: any) {
  const [quorumSigned, setQuorumSigned] = useState(false);

  if (backendStatus !== 'quarantine' && backendStatus !== 'approval_required') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-red-500/50 rounded-xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />
        
        <div className="flex items-center gap-3 mb-6">
          <ShieldAlert className="w-8 h-8 text-red-500" />
          <h2 className="text-2xl font-bold text-white tracking-tight">Zero-Trust Handover</h2>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-red-400 font-medium">
            System Quarantine Active — Human-in-the-loop Approval Required
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Phase 5 of the MCP API V2 pipeline has flagged this payload. Quorum signing is required to proceed.
          </p>
        </div>

        {!quorumSigned ? (
          <div className="space-y-4">
            <button 
              onClick={() => setQuorumSigned(true)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg flex items-center justify-center gap-2 transition-colors font-semibold"
            >
              <Key className="w-5 h-5" />
              Provide Quorum Signature
            </button>
            <button 
              onClick={onReject}
              className="w-full bg-transparent border border-gray-600 hover:bg-gray-800 text-gray-300 p-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <XCircle className="w-5 h-5" />
              Reject & Abort
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <span className="text-green-400 font-medium">Quorum Signature Verified</span>
            </div>
            
            <button 
              onClick={onApprove}
              className="w-full bg-green-600 hover:bg-green-500 text-white p-3 rounded-lg flex items-center justify-center gap-2 transition-colors font-semibold"
            >
              Proceed with Handover
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
