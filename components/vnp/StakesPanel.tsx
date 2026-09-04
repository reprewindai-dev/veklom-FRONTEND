/**
 * StakesPanel — VNP Micro-Stakes Engine UI
 * Wraps StakingProtocol with an error boundary and empty-state guard.
 * Shows a "coming online" state if no stakers are registered yet.
 */
"use client";

import React, { Component, type ReactNode } from "react";
import { Zap, ArrowLeft, Shield, Clock } from "lucide-react";
import Link from "next/link";
import StakingProtocol from "./StakingProtocol";

// ─── Error Boundary ──────────────────────────────────────────────────────────
class StakesBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return <StakesComingSoon reason="component_error" />;
    }
    return this.props.children;
  }
}

// ─── Coming Soon / Empty State ────────────────────────────────────────────────
function StakesComingSoon({ reason }: { reason?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6">
      {/* Icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
          <Zap size={32} className="text-brand-400" />
        </div>
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-40" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-brand-500/60 border border-brand-400" />
        </span>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-brand-400">
          <Clock size={10} />
          VNP Stakes Engine · Coming Online
        </div>
        <h2 className="text-2xl font-semibold text-ink-100">
          No Stakers Registered Yet
        </h2>
        <p className="text-sm text-ink-400 max-w-md">
          The VNP Micro-Stakes Engine is live and waiting for the first API
          provider to post a bond. Once stakers join, real-time SLA performance
          bonds, epoch settlements, and slash events will appear here.
        </p>
      </div>

      {/* What's coming */}
      <div className="bg-bg-900/60 border border-border rounded-xl p-5 text-left max-w-sm w-full space-y-2">
        <div className="text-[9px] font-mono uppercase tracking-wider text-ink-600 mb-3">
          What appears when stakers are live
        </div>
        {[
          "Provider bond amounts and SLA tiers",
          "Real-time latency vs. 800ms threshold",
          "Epoch settlement payouts and slash history",
          "KDE consensus rate across verifier nodes",
          "Micro-stake yield per 1,000 requests",
        ].map((item) => (
          <div key={item} className="flex items-start gap-2 text-xs text-ink-400">
            <Shield size={10} className="text-brand-400 mt-0.5 shrink-0" />
            {item}
          </div>
        ))}
      </div>

      {/* Back link */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-xs text-brand-400 hover:text-brand-300 transition font-medium"
      >
        <ArrowLeft size={12} />
        Back to Dashboard
      </Link>

      {reason === "component_error" && (
        <p className="text-[10px] text-ink-700 font-mono">
          A render error occurred. The staking engine will retry on next load.
        </p>
      )}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function StakesPanel() {
  return (
    <StakesBoundary>
      <StakingProtocol />
    </StakesBoundary>
  );
}

