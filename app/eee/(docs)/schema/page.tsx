"use client";

import React from 'react';
import { Database, FileText, AlertTriangle } from 'lucide-react';

export default function EEESchemaPage() {
  return (
    <div className="space-y-12 pb-24 text-cos-text">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cos-accent/10 border border-cos-accent/20 text-cos-accent text-sm font-medium font-mono mb-6">
          EEE SPECIFICATION v0.1.0
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
          Envelope Schema
        </h1>
        <p className="text-xl text-cos-text/70 leading-relaxed mb-8">
          The Envelope Schema defines the structure of the Execution Evidence Envelope (EEE). An Envelope is a record of a past decision, never an authorization artifact.
        </p>
      </div>

      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl mb-12">
        <h4 className="text-red-400 font-bold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Normative Role of the Envelope
        </h4>
        <p className="text-cos-text/80 leading-relaxed">
          An Envelope is a <strong>record of a past decision</strong>, never an authorization artifact. Relying systems MUST NOT accept an Envelope as authority for a new execution. Authority flows only through `authority_chain`-type artifacts. Presenting a historical Envelope as current authority is a known confusion attack and MUST be rejected.
        </p>
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl font-bold border-b border-border pb-4">1. Identity of the Execution</h2>
        <div className="bg-bg-900 border border-border rounded-xl p-6 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-cos-text/50 uppercase bg-bg-800">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Field</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 rounded-tr-lg">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 font-mono text-cos-accent">eee_version</td>
                <td className="px-4 py-3 font-mono">string</td>
                <td className="px-4 py-3">Spec version, e.g. "0.1.0".</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-cos-accent">execution_id</td>
                <td className="px-4 py-3 font-mono">string</td>
                <td className="px-4 py-3">Unique execution identifier. MUST be unique per issuer.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-cos-accent">issuer</td>
                <td className="px-4 py-3 font-mono">string</td>
                <td className="px-4 py-3">Identifier of the enforcing system (HTTPS identifier or DID).</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-cos-accent">enforcer</td>
                <td className="px-4 py-3 font-mono">object</td>
                <td className="px-4 py-3">The enforcement software that produced this Envelope: name, version, build_hash.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-2xl font-bold border-b border-border pb-4">2. Capability & Authority</h2>
        <div className="bg-bg-900 border border-border rounded-xl p-6 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-cos-text/50 uppercase bg-bg-800">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Field</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 rounded-tr-lg">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 font-mono text-cos-accent">capability_id</td>
                <td className="px-4 py-3 font-mono">string</td>
                <td className="px-4 py-3">Stable identifier of the invoked capability, e.g. "commerce.purchase".</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-cos-accent">capability_hash</td>
                <td className="px-4 py-3 font-mono">string</td>
                <td className="px-4 py-3">Hash of the canonical capability contract in effect. Binds the Envelope to the exact capability definition.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-cos-accent">authority_chain</td>
                <td className="px-4 py-3 font-mono">array</td>
                <td className="px-4 py-3">Ordered delegation artifacts (x401-token, oauth-grant, etc).</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-cos-accent">authority_window</td>
                <td className="px-4 py-3 font-mono">object</td>
                <td className="px-4 py-3">not_before, not_after bounds. Execution outside this window MUST have been denied.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-2xl font-bold border-b border-border pb-4">3. Policy & Execution</h2>
        <div className="bg-bg-900 border border-border rounded-xl p-6 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-cos-text/50 uppercase bg-bg-800">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Field</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 rounded-tr-lg">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 font-mono text-cos-accent">policy_decisions</td>
                <td className="px-4 py-3 font-mono">array</td>
                <td className="px-4 py-3">Every gate evaluated MUST appear, in evaluation order.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-cos-accent">enforcement_mode</td>
                <td className="px-4 py-3 font-mono">string</td>
                <td className="px-4 py-3">"fail-closed" or "fail-open". Fail-open Envelopes MUST set violations.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-cos-accent">input_commitment</td>
                <td className="px-4 py-3 font-mono">string</td>
                <td className="px-4 py-3">Hash of canonical inputs. Raw inputs MAY be omitted for confidentiality.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-cos-accent">budget</td>
                <td className="px-4 py-3 font-mono">object</td>
                <td className="px-4 py-3">Monetary/fractional values MUST be decimal strings, never JSON numbers.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-cos-accent">status</td>
                <td className="px-4 py-3 font-mono">string</td>
                <td className="px-4 py-3">"completed", "denied", "violated", "expired", "revoked", "error".</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-2xl font-bold border-b border-border pb-4">4. Integrity & Settlement</h2>
        <div className="bg-bg-900 border border-border rounded-xl p-6 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-cos-text/50 uppercase bg-bg-800">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Field</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 rounded-tr-lg">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 font-mono text-cos-accent">envelope_hash</td>
                <td className="px-4 py-3 font-mono">string</td>
                <td className="px-4 py-3">Evidence root over all preceding members (JCS Canonicalization).</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-cos-accent">signatures</td>
                <td className="px-4 py-3 font-mono">array</td>
                <td className="px-4 py-3">At least one issuer signature is REQUIRED. JWS compact serialization permitted.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-cos-accent">settlement</td>
                <td className="px-4 py-3 font-mono">object</td>
                <td className="px-4 py-3">Payment replays MUST be detectable via transaction_ref uniqueness.</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
