"use client";

import React, { useEffect, useState } from 'react';
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Activity, Github, ShieldCheck, FileText, Code, GitCommit } from "lucide-react";
import Link from 'next/link';
import { motion } from "framer-motion";

export default function OpenSourcePage() {
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number}>({ days: 60, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // 60-day counter started when VNP was wired out.
    // For now, let's set a target date 60 days from August 18, 2026.
    const targetDate = new Date("2026-10-17T00:00:00Z").getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <MarketingLayout isMachine={false}>
      <section className="relative pt-32 pb-20 px-6 max-w-6xl mx-auto min-h-screen text-cos-text">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cos-accent/10 border border-cos-accent/20 text-cos-accent text-xs font-semibold uppercase tracking-wider mb-6">
            <Github className="w-4 h-4" /> Open Source Initiatives
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Veklom Open Source
          </h1>
          <p className="text-xl text-cos-text/70 max-w-3xl mx-auto leading-relaxed">
            The foundation of the Machine-to-Machine Economy must be transparent, verifiable, and open. We are committed to open-sourcing the core protocols of the Veklom Protocol.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          <div className="p-8 rounded-2xl bg-bg-900 border border-border shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cos-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-cos-accent/10 flex items-center justify-center border border-cos-accent/20">
                <Activity className="w-6 h-6 text-cos-accent" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">VNP Client</h3>
                <div className="text-sm font-mono text-cos-accent">Status: Open Sourced</div>
              </div>
            </div>
            
            <p className="text-cos-text/70 mb-8 relative z-10">
              The Veklom Nexus Protocol (VNP) measurement oracles and probe SDKs are publicly available. Verify exactly how latency, uptime, and SLA adherence are mathematically measured.
            </p>
            
            <div className="flex gap-4 relative z-10">
              <a href="https://github.com/reprewindai-dev/veklom-vnp" target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-lg bg-cos-surface text-bg-900 font-bold hover:opacity-90 transition-colors flex items-center gap-2">
                <Github className="w-4 h-4" /> View on GitHub
              </a>
              <Link href="/vnp/docs" className="px-6 py-3 rounded-lg bg-cos-text/5 border border-cos-text/10 text-cos-text font-bold hover:bg-cos-text/10 transition-colors flex items-center gap-2">
                <FileText className="w-4 h-4" /> Read Docs
              </Link>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-bg-900 border border-border shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFB800]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-[#FFB800]/10 flex items-center justify-center border border-[#FFB800]/20">
                <ShieldCheck className="w-6 h-6 text-[#FFB800]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">EEE & VCGB Protocols</h3>
                <div className="text-sm font-mono text-[#FFB800]">Status: Open Sourced</div>
              </div>
            </div>
            
            <p className="text-cos-text/70 mb-8 relative z-10">
              The Execution Evidence Envelope (EEE) specification and Veklom Capability Governance Board (VCGB) boundaries are public standards for agent accountability and boundary enforcement.
            </p>
            
            <div className="flex gap-4 relative z-10">
              <Link href="/eee/docs" className="px-6 py-3 rounded-lg bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/20 font-bold hover:bg-[#FFB800]/20 transition-colors flex items-center gap-2">
                <FileText className="w-4 h-4" /> EEE Spec
              </Link>
              <Link href="/vcgb/docs" className="px-6 py-3 rounded-lg bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/20 font-bold hover:bg-[#FFB800]/20 transition-colors flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> VCGB Spec
              </Link>
            </div>
          </div>
        </div>

        {/* 60-Day Countdown Section */}
        <div className="w-full p-8 md:p-12 rounded-2xl bg-gradient-to-b from-bg-800 to-bg-900 border border-border flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-bold uppercase tracking-wider mb-6">
            <Activity className="w-4 h-4 animate-pulse" /> Core Infrastructure Release
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">The OS Spine is Opening</h2>
          <p className="text-cos-text/70 max-w-2xl mx-auto mb-12">
            Now that VNP is wired out and successfully measuring truth across the network, we are preparing to open-source the core OS Spine infrastructure. The countdown has begun.
          </p>

          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex flex-col items-center bg-bg-900 border border-border p-6 rounded-xl min-w-[120px]">
              <div className="text-5xl font-mono font-bold text-cos-accent mb-2">{String(timeLeft.days).padStart(2, '0')}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-cos-text/50">Days</div>
            </div>
            <div className="text-5xl font-mono font-bold text-cos-text/20 py-4">:</div>
            <div className="flex flex-col items-center bg-bg-900 border border-border p-6 rounded-xl min-w-[120px]">
              <div className="text-5xl font-mono font-bold text-cos-accent mb-2">{String(timeLeft.hours).padStart(2, '0')}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-cos-text/50">Hours</div>
            </div>
            <div className="text-5xl font-mono font-bold text-cos-text/20 py-4 hidden md:block">:</div>
            <div className="flex flex-col items-center bg-bg-900 border border-border p-6 rounded-xl min-w-[120px]">
              <div className="text-5xl font-mono font-bold text-cos-accent mb-2">{String(timeLeft.minutes).padStart(2, '0')}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-cos-text/50">Minutes</div>
            </div>
            <div className="text-5xl font-mono font-bold text-cos-text/20 py-4 hidden md:block">:</div>
            <div className="flex flex-col items-center bg-bg-900 border border-border p-6 rounded-xl min-w-[120px]">
              <div className="text-5xl font-mono font-bold text-cos-accent mb-2">{String(timeLeft.seconds).padStart(2, '0')}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-cos-text/50">Seconds</div>
            </div>
          </div>
          
          <div className="text-sm font-mono text-cos-text/40 flex items-center justify-center gap-2">
            <GitCommit className="w-4 h-4" /> VEKLOM-PROTOCOL-RELEASE-CANDIDATE
          </div>
        </div>

      </section>
    </MarketingLayout>
  );
}
