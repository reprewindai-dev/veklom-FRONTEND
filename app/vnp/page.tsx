"use client";

import React from 'react';
import Link from 'next/link';
import dynamicImport from "next/dynamic";
import { Activity, Globe, Server, Shield, Zap, ArrowRight, Check, Search, Code, Cpu, ShieldCheck, Lock, AlertTriangle } from 'lucide-react';
import { motion } from "framer-motion";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

type VerificationStackItem = {
  section: string;
  status: string;
};

type VnpPublicManifest = {
  verification_stack?: VerificationStackItem[];
};

const fallbackVerificationStack: VerificationStackItem[] = [
  { section: 'Physical measurements', status: 'Disconnected' },
  { section: 'Signed telemetry', status: 'Disconnected' },
  { section: 'Route beacons', status: 'Disconnected' },
  { section: 'Robust scoring', status: 'Disconnected' },
  { section: 'x402 settlement evidence', status: 'Disconnected' },
  { section: 'PGL audit trails', status: 'Disconnected' },
  { section: 'Agent/runtime enforcement', status: 'Auth Required' }
];

const NetworkTopologyPanel = dynamicImport(
  () => import("@/components/vnp/NetworkTopologyPanel"),
  { ssr: false, loading: () => <div className="h-[500px] bg-white/5 rounded-xl animate-pulse" /> }
);
const StakingProtocol = dynamicImport(
  () => import("@/components/vnp/StakingProtocol"),
  { ssr: false, loading: () => <div className="h-[400px] bg-white/5 rounded-xl animate-pulse" /> }
);

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
} as any;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function VNPLandingPage() {
  const [verificationStack, setVerificationStack] = React.useState<VerificationStackItem[]>(fallbackVerificationStack);

  React.useEffect(() => {
    let cancelled = false;

    async function loadVerificationStack() {
      try {
        const response = await fetch('/api/vnp.json', {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) return;
        const manifest = (await response.json()) as VnpPublicManifest;
        if (!cancelled && manifest.verification_stack?.length) {
          setVerificationStack(manifest.verification_stack);
        }
      } catch {
        // Keep conservative fallback statuses if backend-derived manifest is unavailable.
      }
    }

    loadVerificationStack();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MarketingLayout isMachine={false}>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[50%] -translate-x-1/2 w-[1000px] h-[500px] bg-cos-accent/15 blur-[120px] rounded-full opacity-50 mix-blend-screen" />
        </div>
        
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <motion.div variants={fadeUpVariants} className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cos-accent/10 border border-cos-accent/20 text-cos-accent text-xs font-semibold uppercase tracking-wider mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            VNP Methodology v1.0
          </motion.div>
          
          <motion.h1 variants={fadeUpVariants} className="max-w-4xl mx-auto text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight text-balance text-cos-text">
            Cryptographic <br className="hidden sm:block" />
            <span className="text-cos-accent">
              API telemetry for the M2M Economy.
            </span>
          </motion.h1>
          
          <motion.p variants={fadeUpVariants} className="text-xl text-cos-text/70 mb-10 max-w-3xl mx-auto leading-relaxed">
            Autonomous AI agents require absolute deterministic reliability. Standard status pages are marketing tools. The Veklom Nexus Protocol provides mathematical proof of API uptime, latency, and compliance across a decentralized global mesh.
          </motion.p>
          
          <motion.div variants={fadeUpVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/vnp/docs" className="w-full sm:w-auto px-8 py-4 rounded-lg bg-cos-surface text-paper font-bold text-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/5">
              Open Docs Hub <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/vnp/methodology" className="w-full sm:w-auto px-8 py-4 rounded-lg bg-cos-text/5 border border-cos-text/10 text-cos-text font-bold text-lg hover:bg-cos-text/10 transition-colors flex items-center justify-center">
              Read the Methodology
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Dimensions of Trust Section */}
      <section id="protocol" className="py-24 px-6 border-t border-rule bg-cos-bg-dim relative scroll-mt-16 text-cos-text">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1 text-cos-accent text-xs font-bold uppercase tracking-widest bg-cos-accent/5 border border-cos-accent/10 px-3 py-1 rounded-full mb-4">
              <Activity className="w-3 h-3" /> Observable Reality
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight mb-6">VNP does not measure claims. It measures observable reality.</h2>
            <p className="text-cos-text/70 max-w-2xl mx-auto text-lg leading-relaxed">
              A provider says "99.99% uptime." That's a claim. VNP measures multiple dimensions of trust from independent regions, delivering mathematical proof of network health, compliance, and settlement.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card obsidian-glass p-8 flex flex-col hover:border-cos-accent/30 transition-all group duration-300">
              <div className="w-12 h-12 rounded-xl bg-cos-accent/10 flex items-center justify-center border border-cos-accent/20 mb-6 group-hover:bg-cos-accent/20 group-hover:border-cos-accent/40 transition-colors duration-300">
                <Globe className="w-6 h-6 text-cos-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Physical Trust</h3>
              <p className="text-cos-text/70 text-sm leading-relaxed">
                Latency, regional consistency, and network health observed directly from the global mesh.
              </p>
            </div>
            
            <div className="card obsidian-glass p-8 flex flex-col hover:border-cos-accent/30 transition-all group duration-300">
              <div className="w-12 h-12 rounded-xl bg-cos-accent/10 flex items-center justify-center border border-cos-accent/20 mb-6 group-hover:bg-cos-accent/20 group-hover:border-cos-accent/40 transition-colors duration-300">
                <Cpu className="w-6 h-6 text-cos-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Execution Trust</h3>
              <p className="text-cos-text/70 text-sm leading-relaxed">
                Did the execution complete successfully? VNP tracks deterministic execution outcomes across runtimes.
              </p>
            </div>

            <div className="card obsidian-glass p-8 flex flex-col hover:border-cos-accent/30 transition-all group duration-300">
              <div className="w-12 h-12 rounded-xl bg-cos-accent/10 flex items-center justify-center border border-cos-accent/20 mb-6 group-hover:bg-cos-accent/20 group-hover:border-cos-accent/40 transition-colors duration-300">
                <ShieldCheck className="w-6 h-6 text-cos-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Evidence Trust</h3>
              <p className="text-cos-text/70 text-sm leading-relaxed">
                Is there valid Proof of Graph Ledger (PGL) evidence backing the claim? VNP anchors claims to cryptographic proof.
              </p>
            </div>

            <div className="card obsidian-glass p-8 flex flex-col hover:border-cos-accent/30 transition-all group duration-300">
              <div className="w-12 h-12 rounded-xl bg-cos-accent/10 flex items-center justify-center border border-cos-accent/20 mb-6 group-hover:bg-cos-accent/20 group-hover:border-cos-accent/40 transition-colors duration-300">
                <Shield className="w-6 h-6 text-cos-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Governance Trust</h3>
              <p className="text-cos-text/70 text-sm leading-relaxed">
                Did the execution satisfy organizational policy, jurisdiction mandates, and required standards?
              </p>
            </div>

            <div className="card obsidian-glass p-8 flex flex-col hover:border-cos-accent/30 transition-all group duration-300">
              <div className="w-12 h-12 rounded-xl bg-cos-accent/10 flex items-center justify-center border border-cos-accent/20 mb-6 group-hover:bg-cos-accent/20 group-hover:border-cos-accent/40 transition-colors duration-300">
                <Lock className="w-6 h-6 text-cos-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Economic Trust</h3>
              <p className="text-cos-text/70 text-sm leading-relaxed">
                Was the x402 settlement completed correctly? VNP links SLA performance directly to verifiable payments.
              </p>
            </div>

            <div className="card obsidian-glass p-8 flex flex-col hover:border-cos-accent/30 transition-all group duration-300">
              <div className="w-12 h-12 rounded-xl bg-cos-accent/10 flex items-center justify-center border border-cos-accent/20 mb-6 group-hover:bg-cos-accent/20 group-hover:border-cos-accent/40 transition-colors duration-300">
                <Activity className="w-6 h-6 text-cos-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Confidence Score</h3>
              <p className="text-cos-text/70 text-sm leading-relaxed">
                A unified metric representing how certain we are about the overall measurement, derived from the Trust Spine.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section id="methodology" className="py-24 px-6 border-t border-rule bg-cos-bg relative scroll-mt-16 text-cos-text">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cos-accent/10 border border-cos-accent/20 text-cos-accent text-sm font-medium font-mono">
                VNP Methodology v1.0 - UPDATED JULY 7
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
                VNP v1.0 Verification Stack
              </h2>
              <p className="text-cos-text/70 text-lg leading-relaxed">
                To prevent manipulation, VNP evaluates APIs through a published benchmark-card doctrine: benchmark details, purpose, data provenance, methodology, limitations, targeted risks, validation, interpretation, and resources are documented for every scored endpoint.
              </p>
              
              <div className="space-y-4">
                {verificationStack.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-cos-text/5 border border-cos-text/10 hover:border-cos-accent/30 transition-colors">
                    <span className="font-medium text-cos-text/90">{item.section}</span>
                    <span className="font-mono text-cos-accent font-bold">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-cos-accent/10 to-transparent blur-2xl opacity-50 rounded-3xl -z-10" />
              <div className="border border-rule rounded-2xl overflow-hidden bg-cos-bg-dim shadow-2xl">
                <div className="p-4 border-b border-rule bg-cos-text/5 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-mono text-cos-text/50">BACKEND VIEW: VNP_TOPOLOGY_MESH</span>
                </div>
                <div className="h-[500px] overflow-hidden p-6 relative bg-cos-bg">
                  <div className="transform scale-[0.85] origin-top-left w-[117%] h-[117%] pointer-events-none">
                    <NetworkTopologyPanel />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 border-t border-rule relative overflow-hidden bg-cos-bg text-cos-text">
        <div className="absolute inset-0 bg-cos-accent/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cos-accent/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10 px-6">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Standardize Your Infrastructure</h2>
          <p className="text-xl text-cos-text/70 mb-6">
            Not all APIs belong on VNP. We exclusively measure mission-critical endpoints for the <strong className="text-cos-text">Machine-to-Machine (M2M) Economy</strong>.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 text-left mb-12 max-w-3xl mx-auto">
            <div className="bg-cos-text/5 border border-cos-text/10 rounded-xl p-6">
              <h3 className="text-cos-accent font-bold mb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cos-accent" /> VNP Worthy (Tier 1)</h3>
              <ul className="space-y-2 text-sm text-cos-text/70">
                <li>• <strong className="text-cos-text/90">AI Infrastructure:</strong> LLMs, Vector DBs, Tools</li>
                <li>• <strong className="text-cos-text/90">Financial & Web3:</strong> Payments, Blockchain RPCs</li>
                <li>• <strong className="text-cos-text/90">Core Telecom:</strong> SMS, Email, Routing Oracles</li>
              </ul>
            </div>
            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-6">
              <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400" /> Not Supported</h3>
              <ul className="space-y-2 text-sm text-cos-text/70">
                <li>• Standard blogs or content feeds</li>
                <li>• Hobbyist or non-commercial APIs</li>
                <li>• Internal private endpoints with no public SLA</li>
              </ul>
            </div>
          </div>

          <Link href="/vnp/claim" className="inline-flex px-10 py-5 rounded-lg bg-cos-text text-paper font-bold text-lg hover:opacity-90 transition-colors items-center gap-2 shadow-lg shadow-white/5">
            Submit API for VNP Evaluation <Zap className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
