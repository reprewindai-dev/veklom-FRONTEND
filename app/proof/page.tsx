import React from 'react';
import Link from 'next/link';

export default function ProofPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-6">Veklom P0 Public Proof Surface</h1>
      
      <p className="mb-4 text-gray-700">
        This is the first truthful vertical slice of the Veklom independent authority boundary.
      </p>

      <div className="bg-gray-100 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">What This Proves</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-800">
          <li>A workload identity was validated</li>
          <li>Bounded authority was presented</li>
          <li>Attempts to widen that authority failed</li>
          <li>CAPPO allowed exactly one consequence</li>
          <li>One signed COSE evidence statement was produced</li>
          <li>That exact statement is included in a local Merkle commitment</li>
          <li><span className="font-semibold">Global reconciliation:</span> NOT YET CLAIMED</li>
        </ul>
      </div>

      <h2 className="text-2xl font-bold mb-4">Independent Verification</h2>
      <p className="mb-4 text-gray-700">
        You do not have to trust our marketing copy. Download the raw cryptographic evidence bundle below and verify it locally.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <a href="/proof-bundle/receipt.cose" download className="block p-4 border rounded hover:bg-gray-50">
          <span className="font-bold block">receipt.cose</span>
          <span className="text-sm text-gray-500">The signed execution consequence</span>
        </a>
        <a href="/proof-bundle/public-key.pem" download className="block p-4 border rounded hover:bg-gray-50">
          <span className="font-bold block">public-key.pem</span>
          <span className="text-sm text-gray-500">The Ed25519 public key of the consequence kernel</span>
        </a>
        <a href="/proof-bundle/proof.json" download className="block p-4 border rounded hover:bg-gray-50">
          <span className="font-bold block">proof.json</span>
          <span className="text-sm text-gray-500">Merkle inclusion proof</span>
        </a>
        <a href="/proof-bundle/checkpoint.json" download className="block p-4 border rounded hover:bg-gray-50">
          <span className="font-bold block">checkpoint.json</span>
          <span className="text-sm text-gray-500">Local tree state</span>
        </a>
        <a href="/proof-bundle/veklom-verify.py" download className="block p-4 border rounded hover:bg-gray-50">
          <span className="font-bold block">veklom-verify.py</span>
          <span className="text-sm text-gray-500">Tiny standalone Python verifier script</span>
        </a>
        <a href="/proof-bundle/README.md" download className="block p-4 border rounded hover:bg-gray-50">
          <span className="font-bold block">README.md</span>
          <span className="text-sm text-gray-500">Instructions</span>
        </a>
      </div>

      <h3 className="text-lg font-bold mb-2">How to Verify</h3>
      <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-sm">
        {`$ pip install cbor2 cryptography
$ python veklom-verify.py

Veklom P0 Evidence Verifier
---------------------------
[V] SIGNATURE_VALID=true
    EXECUTION_ID=exec_01J6B9...
    ACTION=contact.read
    RESOURCE=/contacts/123
[V] MERKLE_INCLUSION_VALID=true
[i] RECONCILIATION_STATUS=pending`}
      </pre>
    </div>
  );
}
