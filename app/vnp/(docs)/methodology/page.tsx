"use client";

import React from 'react';
import { Activity, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MethodologyPage() {
  return (
    <div className="space-y-12 pb-24">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800] text-sm font-medium font-mono mb-6">
          VNP SPECIFICATION v1.0
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
          The Weighted API Scoring Model
        </h1>
        <p className="text-xl text-gray-400 leading-relaxed mb-8">
          The Veklom Nexus Protocol abandons easily manipulated metrics. We measure what matters to the Machine-to-Machine (M2M) economy using cryptographically secure Active Network Metrology.
        </p>
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl font-bold border-b border-white/10 pb-4">1. P99 Latency (Geographically Normalized)</h2>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <p className="text-gray-300 leading-relaxed mb-4">
            Averages are useless for autonomous agents. If an LLM router encounters a P99 latency spike, the entire generation pipeline halts. VNP strictly evaluates the 99th percentile of response times across our decentralized Edge Probes.
          </p>
          <p className="text-gray-300 leading-relaxed">
            By injecting PAD Type-Length-Value (TLV) fields (RFC 8972), we strictly enforce symmetric payloads to perfectly mimic varying API payloads, preventing providers from selectively optimizing ICMP ping traffic.
          </p>
        </div>

        <h2 className="text-2xl font-bold border-b border-white/10 pb-4">2. Absolute Availability & Uptime</h2>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <p className="text-gray-300 leading-relaxed mb-4">
            VNP operates on zero-trust principles. We do not trust self-reported status pages. Our STAMP (Simple Two-Way Active Measurement Protocol - RFC 8762) micro-sessions ensure that performance measurements span every physical member link of complex provider infrastructure utilizing Equal-Cost Multipath (ECMP) routing.
          </p>
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg mt-4">
            <h4 className="text-red-400 font-bold mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Canadian Regulatory Alignment
            </h4>
            <p className="text-sm text-red-200/70">
              Aligns perfectly with Canada's Consumer-Driven Banking Act (CDBA) 2026 mandate requiring 99.5% mathematically proven uptime for Tier-1 financial APIs.
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold border-b border-white/10 pb-4">3. x402 Settlement Compliance</h2>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <p className="text-gray-300 leading-relaxed mb-4">
            APIs must put their money where their SLAs are. Providers failing to meet their latency or correctness constraints face instant, machine-to-machine financial slashing on the Base blockchain.
          </p>
          <p className="text-gray-300 leading-relaxed">
            VNP nodes generate zk-SNARK proofs demonstrating SLA failure. The smart contract instantly confirms the validity of the proof without seeing the raw measurement key, triggering an irrevocable micro-slash.
          </p>
        </div>
      </div>
    </div>
  );
}
