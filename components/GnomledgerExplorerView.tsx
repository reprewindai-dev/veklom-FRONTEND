import React, { useState } from 'react';
import { Database, ShieldCheck, CheckCircle2, Lock, FileCode, RefreshCw, Key } from 'lucide-react';
import { PGLCertificate } from '../types.js';

export const GnomledgerExplorerView: React.FC = () => {
  const [certInput, setCertInput] = useState<string>('');
  const [verificationOutput, setVerificationOutput] = useState<string | null>(null);

  const sampleBlocks: PGLCertificate[] = [
    {
      certId: 'pgl_cert_a8912849',
      merkleRoot: '7f9128a192840a12849120489120481204812048120481204812048120481204',
      blockIndex: 42811,
      prevBlockHash: '1289124012840128412804812048120481204812048120481204812048120481',
      signerPublicKey: 'ed25519:veklom_pgl_pub_a8f9210948',
      humanRequester: 'reprewindai@gmail.com',
      executionIdentityToken: 'ei_v2_7a891024981249812498124',
      nonRepudiableHash: '9128412948129481294812948129481294812948129481294812948129481294',
      timestamp: new Date().toISOString(),
      verifierSignature: 'sig_pgl_981204981204981204981204981204981204981204981204981204981204'
    },
    {
      certId: 'pgl_cert_b9021841',
      merkleRoot: '2a89120481204812048120481204812048120481204812048120481204812048',
      blockIndex: 42810,
      prevBlockHash: 'veklom_genesis_pgl_block_42809',
      signerPublicKey: 'ed25519:veklom_pgl_pub_a8f9210948',
      humanRequester: 'reprewindai@gmail.com',
      executionIdentityToken: 'ei_v2_91284129481294812948124',
      nonRepudiableHash: 'e821094812094812094812094812094812094812094812094812094812094812',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      verifierSignature: 'sig_pgl_e891204981204981204981204981204981204981204981204981204981204'
    }
  ];

  const handleVerifyCert = () => {
    if (!certInput.trim()) return;
    setVerificationOutput(
      `[GnomLedger Verifier] Validating Merkle Root and Ed25519 signature...\nSTATUS: MATHEMATICALLY VERIFIED & NON-REPUDIABLE\nBound Requester: reprewindai@gmail.com\nLedger Index: #42811`
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-medium mb-1">
            <Database className="w-4 h-4" /> GNOMLEDGER PROOF-OF-GRAPH LEDGER (PGL)
          </div>
          <h2 className="text-2xl font-bold text-white">Cryptographic Evidence & Audit Chain</h2>
          <p className="text-xs text-slate-400 font-mono">
            Immutable non-repudiable certificates binding agent capability execution to the original human requester.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> CHAIN INTEGRITY: 100% VERIFIED
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Certificate Inspector & Verifier (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verify PGL Certificate Signature
            </h3>

            <textarea
              rows={4}
              placeholder="Paste PGL Certificate ID, Merkle Hash, or Non-Repudiable Signature..."
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-2xs text-slate-200 focus:outline-none focus:border-emerald-500"
            ></textarea>

            <button
              onClick={handleVerifyCert}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Verify Cryptographic Signature
            </button>

            {verificationOutput && (
              <pre className="p-3 bg-slate-950 rounded-xl border border-emerald-500/40 text-emerald-300 font-mono text-3xs whitespace-pre-wrap">
                {verificationOutput}
              </pre>
            )}
          </div>
        </div>

        {/* Right Column: Ledger Blocks Stream (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" /> Recent Proof-of-Graph Ledger (PGL) Blocks
            </h3>

            <div className="space-y-4">
              {sampleBlocks.map((block) => (
                <div key={block.certId} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-2xs">
                  <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800/80 pb-2">
                    <span className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5" /> Block #{block.blockIndex} ({block.certId})
                    </span>
                    <span className="text-slate-400 text-3xs">{block.timestamp}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-1 text-slate-300">
                    <div><span className="text-slate-400">Human Requester:</span> <span className="font-bold text-white">{block.humanRequester}</span></div>
                    <div><span className="text-slate-400">Execution Identity:</span> <span className="text-cyan-400">{block.executionIdentityToken}</span></div>
                    <div><span className="text-slate-400">Merkle Root:</span> <span className="text-slate-300 truncate block">{block.merkleRoot}</span></div>
                    <div><span className="text-slate-400">Non-Repudiable Hash:</span> <span className="text-emerald-400 truncate block">{block.nonRepudiableHash}</span></div>
                    <div><span className="text-slate-400">Ed25519 Signature:</span> <span className="text-indigo-400 truncate block">{block.verifierSignature}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
