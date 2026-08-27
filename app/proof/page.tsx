import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Canonical Evidence | Veklom',
};

export default function ProofPage() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-mono font-bold text-sm tracking-widest text-[#00E5FF] hover:opacity-80">
              ← VEKLOM
            </Link>
            <span className="text-white/30">/</span>
            <span className="font-mono text-sm text-white/60">PROOF</span>
          </div>
          <div className="flex gap-4 text-xs font-mono">
            <Link href="/" className="text-white/40 hover:text-white/60">Human</Link>
            <Link href="/machine" className="text-[#00E5FF]/60 hover:text-[#00E5FF]">Machine</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-12">
          <div className="flex items-center flex-wrap gap-3 mb-4">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border text-emerald-400 border-emerald-400/40 bg-emerald-400/10">
              P5/C0 CLOSED
            </span>
            <span className="text-[10px] font-mono text-white/50 bg-[#111827] px-2 py-0.5 rounded border border-white/10">
              veklom-p5-closure-v1
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Canonical Evidence Surface</h1>
          <p className="text-[#8A9BB0] text-lg max-w-2xl">
            This is the first truthful vertical slice of the Veklom independent authority boundary.
            Do not trust marketing copy. Download the raw cryptographic evidence bundle below and verify it locally.
          </p>
        </div>

        <section className="mb-16">
          <h2 className="text-xl font-bold mb-6 text-[#00E5FF]">Evidence Bundle (R2 Mirror)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { file: 'receipt.cose', desc: 'The signed execution consequence' },
              { file: 'public-key.pem', desc: 'Ed25519 public key of the consequence kernel' },
              { file: 'proof.json', desc: 'Merkle inclusion proof' },
              { file: 'checkpoint.json', desc: 'Local tree state' },
              { file: 'veklom-verify.py', desc: 'Standalone Python verifier script' },
              { file: 'README.md', desc: 'Instructions' },
            ].map(item => (
              <a
                key={item.file}
                href={`https://evidence.veklom.com/${item.file}`}
                download
                className="block p-5 rounded-xl border border-white/10 bg-[#111827] hover:border-[#00E5FF]/40 hover:bg-[#0D1220] transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono font-bold text-sm text-white group-hover:text-[#00E5FF] transition-colors">{item.file}</span>
                  <span className="text-white/20 group-hover:text-[#00E5FF] transition-colors">↓</span>
                </div>
                <span className="text-[#8A9BB0] text-xs leading-relaxed">{item.desc}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-xl font-bold mb-6 text-[#00E5FF]">Independent Verification</h2>
          <div className="p-6 rounded-xl border border-white/10 bg-black">
            <pre className="text-xs font-mono text-green-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
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
        </section>

        <section className="p-6 rounded-xl border border-amber-400/20 bg-amber-400/5">
          <h3 className="font-bold text-amber-400 mb-2">Limitations & What Is NOT Claimed</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-[#8A9BB0]">
            <li>Liveness is <strong className="text-white/80">not formally proven</strong>. A machine may hang or be disconnected.</li>
            <li>G1 (offline sovereign execution) is only partially verified (1/5 sub-gates).</li>
            <li>Global reconciliation is pending.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
