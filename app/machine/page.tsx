import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Machine Contract Surface | Veklom',
};

const ROUTES = [
  { path: '/api/machine/manifest.json', desc: 'Full service manifest with canonical SHA' },
  { path: '/api/machine/claims.json', desc: 'Structured conformance claim registry' },
  { path: '/api/machine/conformance.json', desc: 'G0A/G0B/G1/P5 status' },
  { path: '/api/machine/evidence-index.json', desc: 'Evidence artifact index with hashes' },
  { path: '/api/machine/routes.json', desc: 'Full route manifest' },
  { path: '/api/machine/openapi.json', desc: 'OpenAPI 3.1 spec' },
];

export default function MachineModePage() {
  const jsonContent = JSON.stringify(
    {
      canonical_tag: 'veklom-p5-closure-v1',
      canonical_sha: 'b48007614bee92d1caacc628d96fe9a786e8cd47',
      adversarial_tests: '75/75',
      tla_safety: true,
      liveness_claimed: false,
      g0a: '9/9 VERIFIED',
      g0b: '6/6 VERIFIED',
      g1: '1/5 IN PROGRESS',
      p5: 'CLOSED'
    },
    null,
    2
  );

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-6 sm:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 border-b border-green-900 pb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-widest mb-2">VEKLOM MACHINE CONTRACT SURFACE v1.0</h1>
            <p className="text-green-600 text-sm">Strictly structured, verifiable boundaries for autonomous clients.</p>
          </div>
          <Link href="/" className="text-sm border border-green-800 px-3 py-1 hover:bg-green-900/30 transition-colors">
            [← Human Mode]
          </Link>
        </header>

        <section className="mb-12">
          <h2 className="text-lg font-bold mb-4 uppercase tracking-wider text-green-500">Endpoints</h2>
          <div className="space-y-4">
            {ROUTES.map(route => (
              <div key={route.path} className="border border-green-900/50 p-4 bg-green-950/10">
                <div className="text-white mb-2">{route.path}</div>
                <div className="text-sm text-green-600">{route.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-lg font-bold mb-4 uppercase tracking-wider text-green-500">Canonical State</h2>
          <div className="border border-green-900/50 p-4 bg-green-950/10 overflow-x-auto">
            <pre className="text-sm">{jsonContent}</pre>
          </div>
        </section>

        <footer className="text-xs text-green-800 mt-20">
          SYSTEM: VEKLOM CAPABILITY OS // MODE: MACHINE // PROTOCOL: HTTP GET
        </footer>
      </div>
    </div>
  );
}
