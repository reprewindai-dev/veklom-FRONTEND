// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight, Shield, Database, Globe, Lock, Eye, Network,
  BookOpen, ChevronRight, CheckCircle, AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import type { DependencyState } from "@/lib/dependency-status";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } }
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const pillars = [
  {
    id: "01",
    label: "Authority",
    icon: Shield,
    desc: "Who can act, what they can do, and how scope is granted — before execution begins.",
    detail: "Policy-bound access control with scoped, revocable grants.",
  },
  {
    id: "02",
    label: "Policy",
    icon: Lock,
    desc: "Rules are evaluated before execution, not retroactively narrated after the fact.",
    detail: "CAPPO enforces Zero-Trust middleware on every inbound request.",
  },
  {
    id: "03",
    label: "Evidence",
    icon: Database,
    desc: "Consequential actions leave a queryable, cryptographically anchored trail.",
    detail: "GnomLedger (PGL) writes append-only Proof-of-Graph records signed by LockerPhycer.",
  },
  {
    id: "04",
    label: "Sovereignty",
    icon: Globe,
    desc: "BYOS, tenant isolation, data portability, and operator control without vendor lock-in.",
    detail: "Your models, your servers, your data. Ollama-first. No mandatory cloud custody.",
  },
  {
    id: "05",
    label: "Federation",
    icon: Network,
    desc: "Independent nodes coordinate without surrendering their own authority boundaries.",
    detail: "VNP mesh over WireGuard. Nodes attest to each other; no central trust anchor required.",
  },
  {
    id: "06",
    label: "Transparency",
    icon: Eye,
    desc: "Roadmap, build log, known limitations, and incident records — published without euphemisms.",
    detail: "Trust is earned through repeated, verifiable behavior — not promises.",
  },
];

const DEPENDENCY_LABELS: Record<string, { label: string; host: string }> = {
  byos: { label: "BYOS API", host: "api.veklom.com" },
  capi: { label: "cAPI Mesh", host: "capi.veklom.com" },
  gnomledger: { label: "GnomLedger", host: "pgl.veklom.com" },
  lockerphycer: { label: "LockerPhycer", host: "internal" },
  abide: { label: "ABIDE", host: "abide.veklom.com" },
};

type DependencyReading = {
  name: string;
  status: DependencyState;
  http_status?: number;
};

type DependencyProof = {
  status: string;
  dependencies: DependencyReading[];
  checked_at: string;
};

const STATE_PRESENTATION: Record<DependencyState, { text: string; dot: string; label: string }> = {
  healthy: {
    text: "text-emerald-400/80",
    dot: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]",
    label: "reachable",
  },
  unhealthy: { text: "text-amber-400/80", dot: "bg-amber-400", label: "degraded" },
  unreachable: { text: "text-red-400/80", dot: "bg-red-400", label: "unreachable" },
  unconfigured: { text: "text-white/40", dot: "bg-white/30", label: "unconfigured" },
};

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [proof, setProof] = useState<DependencyProof | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/health/dependencies", { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json()) as DependencyProof;
        if (active) setProof(body);
      })
      .catch(() => {
        if (active) setProofError("Dependency proof unreachable from this browser.");
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#060608] text-white font-sans selection:bg-blue-500/20">

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#060608]/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded overflow-hidden">
              <img src="/logo-square.png" alt="Veklom" className="w-full h-full object-cover" />
            </div>
            <span className="font-semibold tracking-widest text-sm text-white/80 uppercase">VEKLOM</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-white/40 tracking-wide uppercase">
            <Link href="/" className="text-white/90 hover:text-white transition-colors">Overview</Link>
            <Link href="/os" className="hover:text-white transition-colors">Capability OS</Link>
            <Link href="/charter" className="hover:text-white transition-colors">Trust Charter</Link>
            <Link href="/settings" className="hover:text-white transition-colors">Integrations</Link>
          </div>

          <Link
            href="/os"
            className="flex items-center gap-2 text-xs font-semibold bg-white text-black px-4 py-1.5 rounded hover:bg-white/90 transition-colors tracking-wide"
          >
            Control Plane <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="pt-40 pb-28 px-6 max-w-6xl mx-auto">
        <motion.div initial="hidden" animate={mounted ? "visible" : "hidden"} variants={stagger}>

          <motion.div variants={fadeUp} className="mb-3">
            <span className="text-[11px] font-mono font-semibold text-blue-400/80 tracking-[0.2em] uppercase">
              Sovereign Runtime Infrastructure
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.95] mb-8 text-white">
            Governed authority<br className="hidden md:block" />
            <span className="text-white/30"> for autonomous systems.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg md:text-xl text-white/50 max-w-2xl leading-relaxed font-light mb-12">
            VEKLOM is sovereign runtime infrastructure for deploying AI agents with policy-bound access,
            tenant isolation, verifiable evidence, and human override.
          </motion.p>

          <motion.div variants={fadeUp} className="flex items-center gap-4">
            <Link
              href="/os"
              className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-md font-semibold text-sm hover:bg-white/90 transition-colors"
            >
              Explore the control plane <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/charter"
              className="flex items-center gap-2 border border-white/10 text-white/60 px-6 py-3 rounded-md font-semibold text-sm hover:border-white/30 hover:text-white transition-colors"
            >
              <BookOpen className="w-4 h-4" /> Read the Trust Charter
            </Link>
          </motion.div>

        </motion.div>
      </section>

      {/* ── Doctrine ───────────────────────────────────────────────── */}
      <section className="px-6 max-w-6xl mx-auto pb-24">
        <div className="border border-white/[0.07] bg-white/[0.02] rounded-xl p-10 md:p-14">
          <p className="text-[11px] font-mono text-white/30 uppercase tracking-[0.2em] mb-6">The VEKLOM Doctrine</p>
          <blockquote className="text-xl md:text-2xl text-white/80 leading-relaxed font-light max-w-4xl">
            We build trust through evidence, not promises. We disclose limits, own failures,
            preserve operator control, and design systems where authority must be{" "}
            <span className="text-white font-medium">earned</span>,{" "}
            <span className="text-white font-medium">scoped</span>, and{" "}
            <span className="text-white font-medium">revocable</span>.
          </blockquote>
          <div className="mt-8 pt-8 border-t border-white/[0.06]">
            <p className="text-sm text-white/40 leading-relaxed max-w-3xl">
              We are not here to automate human responsibility away. We are here to give humans and agents
              a credible framework for exercising it.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6 Proof Pillars ────────────────────────────────────────── */}
      <section className="px-6 max-w-6xl mx-auto pb-28">
        <div className="mb-12">
          <p className="text-[11px] font-mono text-white/30 uppercase tracking-[0.2em] mb-3">Architecture built on proof</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-white">Six pillars. All verifiable.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.06] rounded-xl overflow-hidden border border-white/[0.06]">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.id}
                className="bg-[#060608] p-8 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="p-2.5 border border-white/10 rounded-lg bg-white/[0.03] group-hover:border-white/20 transition-colors">
                    <Icon className="w-5 h-5 text-white/60" />
                  </div>
                  <span className="font-mono text-[10px] text-white/20 font-bold">{p.id}</span>
                </div>
                <h3 className="text-lg font-bold mb-3 text-white tracking-tight">{p.label}</h3>
                <p className="text-sm text-white/40 leading-relaxed mb-4">{p.desc}</p>
                <p className="text-xs text-white/25 leading-relaxed font-mono border-t border-white/[0.06] pt-4">
                  {p.detail}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── System Status ───────────────────────────────────────────── */}
      <section className="px-6 max-w-6xl mx-auto pb-28">
        <div className="mb-8">
          <p className="text-[11px] font-mono text-white/30 uppercase tracking-[0.2em] mb-3">Current system state</p>
          <h2 className="text-2xl font-bold tracking-tighter text-white">Live infrastructure</h2>
          <p className="text-sm text-white/40 leading-relaxed mt-3 max-w-2xl">
            Reachability only. A green marker means the service answered its health endpoint
            when this page loaded — it is not a claim about correctness, capacity, or uptime
            history.
          </p>
        </div>

        {proofError ? (
          <p className="text-sm font-mono text-red-400/80">{proofError}</p>
        ) : !proof ? (
          <p className="text-sm font-mono text-white/30">Probing dependencies…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {proof.dependencies.map((dependency) => {
                const meta = DEPENDENCY_LABELS[dependency.name] ?? {
                  label: dependency.name,
                  host: dependency.name,
                };
                const presentation = STATE_PRESENTATION[dependency.status];
                return (
                  <div
                    key={dependency.name}
                    className="flex items-center justify-between border border-white/[0.07] bg-white/[0.01] rounded-lg px-5 py-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white/80">{meta.label}</p>
                      <p className="text-[11px] font-mono text-white/30 mt-0.5">{meta.host}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${presentation.dot}`} />
                      <span
                        className={`text-[10px] uppercase font-bold tracking-widest ${presentation.text}`}
                      >
                        {presentation.label}
                      </span>
                      {dependency.http_status ? (
                        <span className="text-[10px] font-mono text-white/25">
                          {dependency.http_status}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] font-mono text-white/25 mt-4">
              Probed at {proof.checked_at} · aggregate {proof.status}
            </p>
          </>
        )}
      </section>

      {/* ── Trust Promise Strip ─────────────────────────────────────── */}
      <section className="px-6 max-w-6xl mx-auto pb-28">
        <div className="border border-white/[0.07] rounded-xl p-8 md:px-12 md:py-10 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-mono text-white/30 uppercase tracking-[0.2em] mb-2">Trust Charter</p>
            <h3 className="text-xl font-bold text-white tracking-tight mb-2">
              Every claim maps to a verifiable artifact.
            </h3>
            <p className="text-sm text-white/40 leading-relaxed">
              Repository, endpoint, benchmark, incident record, or evidence trail — if we say it&apos;s live, we can prove it.
            </p>
          </div>
          <Link
            href="/charter"
            className="flex items-center gap-2 shrink-0 border border-white/10 text-white/60 px-6 py-3 rounded-md font-semibold text-sm hover:border-white/30 hover:text-white transition-colors"
          >
            Read full charter <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] px-6 py-10 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded overflow-hidden opacity-60">
              <img src="/logo-square.png" alt="Veklom" className="w-full h-full object-cover" />
            </div>
            <span className="text-xs text-white/30 font-mono tracking-wider">VEKLOM CONTROL PLANE</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/25">
            <Link href="/charter" className="hover:text-white/60 transition-colors">Trust Charter</Link>
            <Link href="/os" className="hover:text-white/60 transition-colors">Capability OS</Link>
            <Link href="/settings" className="hover:text-white/60 transition-colors">Integrations</Link>
            <span className="font-mono">control.veklom.com</span>
          </div>
        </div>
      </footer>

    </main>
  );
}
