"use client";

import React from 'react';
import { ShieldCheck, Server, AlertCircle } from 'lucide-react';

export default function EEEVerificationPage() {
  return (
    <div className="space-y-12 pb-24 text-cos-text">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cos-accent/10 border border-cos-accent/20 text-cos-accent text-sm font-medium font-mono mb-6">
          EEE VERIFICATION
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
          Verification Procedure
        </h1>
        <p className="text-xl text-cos-text/70 leading-relaxed mb-8">
          The 12-step cryptographic verification process. How to prove an execution is valid without trusting the issuer's infrastructure.
        </p>
      </div>

      <div className="bg-void-panel border border-border rounded-xl p-6 mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-cos-accent" /> Issuer Requirements
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-cos-text/90">
          <li>Produce exactly one terminal Envelope per execution attempt, including attempts that are denied. A denial without an Envelope is a spec violation.</li>
          <li>Sign every Envelope with a key whose public counterpart is discoverable via JWKS or DID.</li>
          <li>Set `enforcement_mode` honestly. A boundary that failed open MUST say so.</li>
          <li>Never mint an Envelope for an execution it did not actually gate.</li>
        </ul>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-4">12-Step Verification</h2>
        <p className="text-cos-text/80 mb-6">A verifier MUST perform these steps in order without making network calls beyond key discovery:</p>
        
        <div className="space-y-4">
          {[
            "Parse the Envelope and check required members, including enforcer.",
            "Check eee_version against implemented versions.",
            "Check hash_alg against the local allowlist.",
            "Recompute envelope_hash using JCS Canonicalization and compare.",
            "Resolve the issuer's public key using kid and validate at least one signature.",
            "Check authority_window containment and every authority_chain expiration.",
            "Check actual_effects ⊆ allowed_effects if grammar is supported.",
            "Check budget.consumed ≤ budget.granted per dimension.",
            "Check gate coverage: every decision references rules present in the bundle.",
            "Report enforcement_mode. Conformance claims MUST be computed exclusively over fail-closed envelopes.",
            "Report revocation_check.method: 'none' as REVOCATION_NOT_CHECKED.",
            "Report a verdict: VALID, VALID_WITH_UNRESOLVED_REFS, or INVALID."
          ].map((step, idx) => (
            <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-bg-900/40">
              <div className="w-8 h-8 rounded-full bg-cos-accent/10 border border-cos-accent/20 flex items-center justify-center font-bold text-cos-accent shrink-0">
                {idx + 1}
              </div>
              <p className="text-cos-text/90 pt-1 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-xl mt-12">
        <h4 className="text-orange-400 font-bold mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> Detached Attestations
        </h4>
        <p className="text-cos-text/80 leading-relaxed">
          Validator attestations are separate signed documents referencing the Envelope by <code>envelope_hash</code>. They MUST NOT modify the Envelope. Post-issuance attestations therefore never invalidate evidence root recomputation.
        </p>
      </div>
    </div>
  );
}
