"use client";
import React, { useState } from 'react';
import ZeroTrustHandoverUI from '@/components/authority/ZeroTrustHandoverUI';

export default function ZeroTrustHandoverPage() {
  const [status, setStatus] = useState<'normal' | 'quarantine'>('quarantine');

  return (
    <div className="min-h-screen bg-gray-950 p-8 flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl font-bold mb-4">MCP API V2 Pipeline</h1>
      <p className="text-gray-400 mb-8">Phase 5: Zero-Trust Handover Integration</p>
      
      {status === 'normal' ? (
        <div className="text-green-400 flex flex-col items-center gap-4">
          <p>System is operating normally.</p>
          <button 
            onClick={() => setStatus('quarantine')}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-white"
          >
            Trigger Quarantine Event
          </button>
        </div>
      ) : (
        <div className="text-red-400 flex flex-col items-center gap-4">
          <p>Quarantine active. Awaiting operator approval.</p>
        </div>
      )}

      <ZeroTrustHandoverUI 
        backendStatus={status}
        onApprove={() => setStatus('normal')}
        onReject={() => setStatus('normal')}
      />
    </div>
  );
}
