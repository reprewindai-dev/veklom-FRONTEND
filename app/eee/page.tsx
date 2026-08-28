"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Code, Shield, Activity, Terminal } from 'lucide-react';
import { motion } from"framer-motion";
import { MarketingLayout } from"@/components/marketing/MarketingLayout";

const fadeUpVariants = {
 hidden: { opacity: 0, y: 30 },
 visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
} as any;

const staggerContainer = {
 hidden: { opacity: 0 },
 visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function EEELandingPage() {
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
 Execution Evidence Envelope v0.1.0
 </motion.div>
 
 <motion.h1 variants={fadeUpVariants} className="max-w-4xl mx-auto text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight text-balance text-cos-text">
 Execution <br className="hidden sm:block" />
 <span className="text-cos-accent">
 Evidence Envelope
 </span>
 </motion.h1>
 
 <motion.p variants={fadeUpVariants} className="text-xl text-cos-text/70 mb-10 max-w-3xl mx-auto leading-relaxed">
 A portable, signed, independently verifiable record of a single governed machine execution.
 </motion.p>
 
 <motion.div variants={fadeUpVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
 <Link href="/eee/docs" className="w-full sm:w-auto px-8 py-4 rounded-lg bg-cos-surface text-paper font-bold text-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/5">
 Open EEE SDK Docs <ArrowRight className="w-5 h-5" />
 </Link>
 </motion.div>
 </motion.div>
 </section>

 {/* Trust Section */}
 <section id="protocol" className="py-24 px-6 border-t border-cos-border bg-cos-bg-dim relative scroll-mt-16 text-cos-text">
 <div className="max-w-7xl mx-auto">
 <div className="text-center mb-16 max-w-3xl mx-auto">
 <h2 className="text-4xl font-extrabold tracking-tight mb-6">Standardizing the Evidence</h2>
 <p className="text-cos-text/70 max-w-2xl mx-auto text-lg leading-relaxed">
 Scores are opinions derived from evidence. The EEE standardizes this evidence so that any third party can verify it without trusting the issuer.
 </p>
 </div>

 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
 <div className="card obsidian-glass p-8 flex flex-col hover:border-cos-accent/30 transition-all group duration-300">
 <div className="w-12 h-12 rounded-xl bg-cos-accent/10 flex items-center justify-center border border-cos-accent/20 mb-6 group-hover:bg-cos-accent/20 group-hover:border-cos-accent/40 transition-colors duration-300">
 <Terminal className="w-6 h-6 text-cos-accent" />
 </div>
 <h3 className="text-xl font-bold mb-3">Verify, Don't Trust</h3>
 <p className="text-cos-text/70 text-sm leading-relaxed">
 An Envelope is verifiable from its own contents plus public key material. No call to the issuer's infrastructure is required for verification.
 </p>
 </div>
 
 <div className="card obsidian-glass p-8 flex flex-col hover:border-cos-accent/30 transition-all group duration-300">
 <div className="w-12 h-12 rounded-xl bg-cos-accent/10 flex items-center justify-center border border-cos-accent/20 mb-6 group-hover:bg-cos-accent/20 group-hover:border-cos-accent/40 transition-colors duration-300">
 <Code className="w-6 h-6 text-cos-accent" />
 </div>
 <h3 className="text-xl font-bold mb-3">Capability-centric</h3>
 <p className="text-cos-text/70 text-sm leading-relaxed">
 The subject of an Envelope is a capability execution, agnostic to what requested it—whether agents, workflows, models, or humans.
 </p>
 </div>

 <div className="card obsidian-glass p-8 flex flex-col hover:border-cos-accent/30 transition-all group duration-300">
 <div className="w-12 h-12 rounded-xl bg-cos-accent/10 flex items-center justify-center border border-cos-accent/20 mb-6 group-hover:bg-cos-accent/20 group-hover:border-cos-accent/40 transition-colors duration-300">
 <Shield className="w-6 h-6 text-cos-accent" />
 </div>
 <h3 className="text-xl font-bold mb-3">Tamper-Evident Record</h3>
 <p className="text-cos-text/70 text-sm leading-relaxed">
 Binds the capability invoked, authority, policy decisions, inputs, effects, outputs, and settlement into a single deterministic artifact.
 </p>
 </div>
 </div>
 </div>
 </section>
 </MarketingLayout>
 );
}
