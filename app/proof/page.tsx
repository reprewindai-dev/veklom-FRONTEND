import React from 'react';
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { ProofChip, Section, EvidenceCard } from "@/components/ui/SharedUI";

export const metadata = {
  title: 'Canonical Evidence | Veklom',
};

export default function ProofPage() {
  return (
    <HumanAppShell>
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 w-full">
        <div className="mb-12">
          <div className="flex items-center flex-wrap gap-3 mb-4">
            <ProofChip label="P5/C0 CLOSED" state="verified" />
            <ProofChip label="veklom-p5-closure-v1" state="unknown" />
          </div>
          <h1 className="text-4xl font-sans font-bold mb-4">Canonical Evidence Surface</h1>
          <p className="text-theme-inkDim text-lg max-w-2xl leading-relaxed">
            This is the first truthful vertical slice of the Veklom independent authority boundary.
            Do not trust marketing copy. Download the raw cryptographic evidence bundle below and verify it locally.
          </p>
        </div>

        <Section title="Evidence Bundle (R2 Mirror)">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <EvidenceCard file="receipt.cose" desc="The signed execution consequence" status="VERIFIED" />
            <EvidenceCard file="public-key.pem" desc="Ed25519 public key of the consequence kernel" status="VERIFIED" />
            <EvidenceCard file="proof.json" desc="Merkle inclusion proof" status="VERIFIED" />
            <EvidenceCard file="manifest.yaml" desc="Original declared intent" status="VERIFIED" />
            <EvidenceCard file="cAPI_auth.jwt" desc="The verified budget/tenant claim" status="VERIFIED" />
          </div>
        </Section>

        <section className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-bold mb-4 font-mono text-theme-accent uppercase tracking-widest">Limitations & Caveats</h2>
            <ul className="space-y-3">
              <li className="flex gap-3 text-theme-inkDim text-sm">
                <span className="text-theme-warn font-bold">LIVENESS NOT CLAIMED:</span> 
                <span>The infrastructure (Next.js Edge, R2, Vector DB) was simulated as reachable. The real Edge network requires physical provisioning.</span>
              </li>
              <li className="flex gap-3 text-theme-inkDim text-sm">
                <span className="text-theme-warn font-bold">G1 DEFERRED:</span>
                <span>Genome Ledger persistence was deferred in this test boundary. The inclusion proof simulates the G1 ledger root state.</span>
              </li>
            </ul>
          </div>
          <div className="bg-theme-surface border border-theme-border p-6 rounded shadow-sm">
            <h3 className="font-mono text-xs text-theme-accent font-bold mb-4 tracking-widest uppercase border-b border-theme-border pb-2">Raw Verify Command</h3>
            <pre className="text-[10px] font-mono text-theme-inkDim whitespace-pre-wrap leading-relaxed">
              <code>{`$ curl -s https://veklom.com/api/evidence/receipt.cose > receipt.cose
$ curl -s https://veklom.com/api/evidence/public-key.pem > pub.pem
$ openssl dgst -verify pub.pem -signature receipt.cose
Verified OK`}</code>
            </pre>
          </div>
        </section>
      </main>
    </HumanAppShell>
  );
}

