import React from 'react';
import VeklomFooter from '@/components/marketing/VeklomFooter';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#FFB800]/30 font-sans flex flex-col">
      <nav className="border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFB800] rounded flex items-center justify-center brand-glow">
              <span className="font-bold text-black leading-none">V</span>
            </div>
            <span className="font-bold tracking-wider text-lg font-mono">VEKLOM</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto py-24 px-6 flex-grow w-full">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-gray-400 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="prose prose-invert prose-brand max-w-none space-y-6 text-gray-300">
          <p>Welcome to Veklom. These terms govern your use of the Veklom Control Plane, VNP, and associated autonomous AI routing networks.</p>
          <div className="bg-white/5 p-6 rounded-lg border border-white/10 my-8">
            <p className="text-[#FFB800] font-mono text-sm">Note: This is a placeholder for the official Veklom Terms of Service document.</p>
          </div>
          <h2>1. Network Access & Governance</h2>
          <p>By accessing the Veklom network, you agree to cryptographic settlement of API telemetry via x402 and PBFT consensus mechanisms.</p>
          
          <h2>2. Agentic Accountability</h2>
          <p>Autonomous agents deployed via the Control Plane are subject to the strict physics-based SLAs established by the VNP network.</p>
        </div>
      </div>

      <VeklomFooter />
    </main>
  );
}
