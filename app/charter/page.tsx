// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

const commitments = [
  {
    id: "01",
    title: "No false 'live' claims.",
    body: "We label capabilities precisely: planned, prototype, sandbox, private alpha, public beta, or production. If a system is not deployed and handling real traffic, we do not call it live.",
    artifact: "See: control.veklom.com pipeline status badges",
  },
  {
    id: "02",
    title: "Public changelog discipline.",
    body: "We publish what changed, why it changed, what broke, and what is being done next. Slow weeks and failure periods are documented the same way as successful releases.",
    artifact: "See: GitHub commit history + Discord build log",
  },
  {
    id: "03",
    title: "Evidence-first status reporting.",
    body: "Our status page reports current operational facts — not promotional reassurance. If a service is degraded or down, we say so with the precise failure description.",
    artifact: "See: GnomLedger PGL incident records",
  },
  {
    id: "04",
    title: "Explicit authority. Scoped. Revocable.",
    body: "Every consequential action requires a verifiable grant of authority. Grants have scope boundaries and can be revoked. No system claims authority it was not given.",
    artifact: "See: CAPPO Zero-Trust middleware + LockerPhycer EI tokens",
  },
  {
    id: "05",
    title: "Operator control is preserved.",
    body: "We do not require unnecessary custody of user infrastructure or data. BYOS is the default, not a premium tier. Leaving should never be artificially difficult — customers can export their evidence, configurations, logs, and data.",
    artifact: "See: BYOS backend architecture + data portability docs",
  },
  {
    id: "06",
    title: "Evidence is a product feature.",
    body: "We treat cryptographic audit trails as a first-class deliverable — not a compliance afterthought. Every agent action that is consequential generates a signed, queryable PGL record.",
    artifact: "See: GnomLedger (pgl.veklom.com) + LockerPhycer vault signatures",
  },
  {
    id: "07",
    title: "Trust is earned through repeated, verifiable behavior.",
    body: "We accept that no promise builds trust. Only demonstrated, continuous behavior does. If VEKLOM makes a decision, it should be attributable. If it fails, it should be explainable. If it cannot explain it, it should not claim authority over it.",
    artifact: "See: cAPI telemetry mesh + incident disclosure records",
  },
];

const operatingRules = [
  { category: "Claims", rule: "Never disguise a limitation as an intentional feature." },
  { category: "Incidents", rule: "\"Policy evaluation failed under concurrent load\" — not \"degraded performance.\"" },
  { category: "UX", rule: "No dark patterns, hidden pricing, fabricated urgency, or impossible cancellation flows." },
  { category: "Authority", rule: "Automated execution ≠ legitimate authority. These are structurally different." },
  { category: "Boundaries", rule: "We explain what VEKLOM guarantees, what it does not, and what remains the operator's responsibility." },
];

export default function TrustCharterPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <main className="min-h-screen bg-[#060608] text-white font-sans selection:bg-blue-500/20">

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#060608]/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-7 h-7 rounded overflow-hidden opacity-70 group-hover:opacity-100 transition-opacity">
              <img src="/logo-square.png" alt="Veklom" className="w-full h-full object-cover" />
            </div>
            <span className="font-semibold tracking-widest text-sm text-white/50 uppercase group-hover:text-white/80 transition-colors">VEKLOM</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-white/40 tracking-wide uppercase">
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-1.5">
              <ArrowLeft className="w-3 h-3" /> Overview
            </Link>
            <Link href="/os" className="hover:text-white transition-colors">Capability OS</Link>
            <span className="text-white/90">Trust Charter</span>
          </div>
        </div>
      </nav>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <section className="pt-40 pb-16 px-6 max-w-4xl mx-auto">
        <motion.div initial="hidden" animate={mounted ? "visible" : "hidden"} variants={stagger}>
          <motion.div variants={fadeUp} className="mb-4">
            <span className="text-[11px] font-mono font-semibold text-blue-400/70 tracking-[0.2em] uppercase">
              Permanent · Publicly Binding · Version 1.0
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-bold tracking-tighter leading-tight mb-6">
            The VEKLOM<br />
            <span className="text-white/30">Trust Charter</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg text-white/50 max-w-2xl leading-relaxed font-light">
            VEKLOM earns authority by making its actions, policies, evidence, and public claims
            continuously verifiable. This charter is a standard the product, community, and company must live up to —
            not a marketing layer applied after the fact.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 inline-flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/[0.04] text-emerald-400/80 text-xs font-mono px-4 py-2 rounded">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            This charter is in active effect. Published 2026-08-09.
          </motion.div>
        </motion.div>
      </section>

      {/* ── The 7 Commitments ───────────────────────────────────────── */}
      <section className="px-6 max-w-4xl mx-auto pb-20">
        <div className="mb-10 border-b border-white/[0.06] pb-6">
          <p className="text-[11px] font-mono text-white/25 uppercase tracking-[0.2em]">
            Seven binding commitments
          </p>
        </div>

        <div className="space-y-0 divide-y divide-white/[0.06]">
          {commitments.map((c) => (
            <div key={c.id} className="py-10 group">
              <div className="flex gap-8">
                <span className="font-mono text-[11px] text-white/20 pt-1.5 shrink-0 w-6">{c.id}</span>
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-4">
                    <CheckCircle className="w-5 h-5 text-white/30 mt-0.5 shrink-0" />
                    <h3 className="text-xl font-bold tracking-tight text-white">{c.title}</h3>
                  </div>
                  <p className="text-base text-white/50 leading-relaxed mb-5 ml-8">{c.body}</p>
                  <div className="ml-8 inline-flex items-center gap-2 text-[11px] font-mono text-white/25 border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 rounded">
                    <ExternalLink className="w-3 h-3" />
                    {c.artifact}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Operating Rules ─────────────────────────────────────────── */}
      <section className="px-6 max-w-4xl mx-auto pb-28">
        <div className="border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-white/[0.07]">
            <p className="text-[11px] font-mono text-white/30 uppercase tracking-[0.2em] mb-1">Internal operating rules</p>
            <h2 className="text-xl font-bold tracking-tight text-white">Radical operational honesty</h2>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {operatingRules.map((r) => (
              <div key={r.category} className="flex items-start gap-6 px-8 py-5">
                <span className="shrink-0 text-[10px] font-mono font-bold uppercase tracking-widest text-white/25 pt-0.5 w-20">{r.category}</span>
                <p className="text-sm text-white/55 leading-relaxed">{r.rule}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Invariant ───────────────────────────────────────────── */}
      <section className="px-6 max-w-4xl mx-auto pb-28">
        <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-10 md:p-14 text-center">
          <p className="text-[11px] font-mono text-white/25 uppercase tracking-[0.2em] mb-6">The core invariant</p>
          <blockquote className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug mb-8">
            VEKLOM governs how autonomous systems receive, exercise, prove, and lose authority.
          </blockquote>
          <p className="text-sm text-white/35 max-w-xl mx-auto leading-relaxed">
            This stays true even if the models, chains, APIs, orchestration layer, deployment topology, and UI all change.
            The essence is permanent. The expressions of it are not.
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] px-6 py-10 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded overflow-hidden opacity-60">
              <img src="/logo-square.png" alt="Veklom" className="w-full h-full object-cover" />
            </div>
            <span className="text-xs text-white/30 font-mono tracking-wider">VEKLOM · TRUST CHARTER</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/25">
            <Link href="/" className="hover:text-white/60 transition-colors">Overview</Link>
            <Link href="/os" className="hover:text-white/60 transition-colors">Capability OS</Link>
            <span className="font-mono">Published 2026-08-09</span>
          </div>
        </div>
      </footer>

    </main>
  );
}
