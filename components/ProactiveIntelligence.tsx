'use client';

/**
 * ProactiveIntelligence — §12 Monitoring + §7.3 Budget + §5 Circuit Breaker + §8.3 Security + §13 Autonomous ML
 *
 * Polls the real backend endpoints every 10 seconds. Surfaces recommendations,
 * live status, and proactive actions WITHOUT waiting for the user to ask.
 *
 * Endpoints used (all per USER_MANUAL.md):
 *   GET /status                          → circuit_breaker state (§5)
 *   GET /api/v1/monitoring/alerts        → live alert feed (§12.3)
 *   GET /api/v1/insights                 → latency, error rate, provider split (§12.4)
 *   GET /api/v1/budget?budget_type=monthly → alert_level, % used (§7.3)
 *   GET /api/v1/security/stats           → security_score (§8.3)
 *   POST /api/v1/autonomous/quality/optimize → best provider recommendation (§13.3)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Zap, AlertTriangle, CheckCircle2, Shield, TrendingUp,
  DollarSign, Activity, Cpu, ChevronRight, BellRing, Sparkles,
  ArrowRight, RefreshCw, XCircle
} from 'lucide-react';
import { api } from '@/lib/api';

// ─── Types (manual §5, §7.3, §8.3, §12.3, §12.4, §13) ─────────────────────

interface CircuitState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  threshold: number;
  cooldown_seconds: number;
}

interface Alert {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  created_at: string;
  resolved: boolean;
}

interface Insights {
  total_requests_today: number;
  avg_latency_ms: number;
  error_rate_percent: number;
  top_models: { model: string; calls: number }[];
  provider_split: { ollama?: number; groq?: number; [k: string]: number | undefined };
}

interface Budget {
  amount: string;
  current_spend: string;
  remaining: string;
  percent_used: number;
  forecast_exhaustion_date?: string;
  alert_level: 'ok' | 'warning' | 'critical' | 'exhausted';
}

interface SecStats {
  security_score: number;
  open: number;
  critical: number;
}

interface AiRec {
  recommended_provider: string;
  recommended_model: string;
  expected_quality: number;
  expected_cost: string;
}

interface Intelligence {
  circuit: CircuitState | null;
  alerts: Alert[];
  insights: Insights | null;
  budget: Budget | null;
  security: SecStats | null;
  aiRec: AiRec | null;
  lastRefreshed: Date;
  loading: boolean;
}

// ─── Severity helpers ───────────────────────────────────────────────────────

function severityColor(sev: string) {
  if (sev === 'CRITICAL') return 'text-red-400 bg-red-500/10 border-red-500/20';
  if (sev === 'WARNING') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
}

function budgetColor(level: string) {
  if (level === 'exhausted') return 'text-red-400';
  if (level === 'critical') return 'text-red-400';
  if (level === 'warning') return 'text-amber-400';
  return 'text-accent-green';
}

function circuitColor(state: string) {
  if (state === 'OPEN') return 'text-red-400';
  if (state === 'HALF_OPEN') return 'text-amber-400';
  return 'text-accent-green';
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ProactiveIntelligence() {
  const [intel, setIntel] = useState<Intelligence>({
    circuit: null,
    alerts: [],
    insights: null,
    budget: null,
    security: null,
    aiRec: null,
    lastRefreshed: new Date(),
    loading: true,
  });
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      // Fire all 6 fetches in parallel — any individual failure is silenced
      const [statusRes, alertsRes, insightsRes, budgetRes, secRes, recRes] =
        await Promise.allSettled([
          fetch('/status').then((r) => r.json()),                                          // §5
          api<Alert[]>('/api/v1/monitoring/alerts'),                                       // §12.3
          api<Insights>('/api/v1/insights'),                                               // §12.4
          api<Budget>('/api/v1/budget?budget_type=monthly'),                               // §7.3
          api<SecStats>('/api/v1/security/stats'),                                         // §8.3
          api<AiRec>('/api/v1/autonomous/quality/optimize', {                              // §13.3
            method: 'POST',
            body: { operation_type: 'inference', target_quality: 0.85, max_cost: '0.005' },
          }),
        ]);

      setIntel({
        circuit:
          statusRes.status === 'fulfilled'
            ? (statusRes.value?.circuit_breaker ?? null)
            : null,
        alerts:
          alertsRes.status === 'fulfilled' && Array.isArray(alertsRes.value)
            ? alertsRes.value.filter((a) => !a.resolved)
            : [],
        insights:
          insightsRes.status === 'fulfilled' ? insightsRes.value : null,
        budget:
          budgetRes.status === 'fulfilled' ? budgetRes.value : null,
        security:
          secRes.status === 'fulfilled' ? secRes.value : null,
        aiRec:
          recRes.status === 'fulfilled' ? recRes.value : null,
        lastRefreshed: new Date(),
        loading: false,
      });
    } catch {
      setIntel((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    refresh();
    // Poll every 10 seconds — §12 Monitoring is meant to be live
    intervalRef.current = setInterval(refresh, 10_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  const { circuit, alerts, insights, budget, security, aiRec, lastRefreshed, loading } = intel;

  // Active alerts (not dismissed by user)
  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id));

  // Derived proactive signals
  const hasBudgetWarning = budget && ['warning', 'critical', 'exhausted'].includes(budget.alert_level);
  const hasCircuitIssue = circuit && circuit.state !== 'CLOSED';
  const hasSecurityIssue = security && (security.open > 0 || security.critical > 0);
  const hasHighError = insights && insights.error_rate_percent > 1.0;

  // Total active signals count
  const signalCount =
    visibleAlerts.length +
    (hasBudgetWarning ? 1 : 0) +
    (hasCircuitIssue ? 1 : 0) +
    (hasSecurityIssue ? 1 : 0) +
    (hasHighError ? 1 : 0);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-bg-800/60 p-4 animate-pulse">
        <div className="h-4 w-48 bg-bg-700 rounded mb-3" />
        <div className="h-3 w-full bg-bg-700 rounded mb-2" />
        <div className="h-3 w-3/4 bg-bg-700 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-bg-800/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-brand-400" />
          <span className="text-[13px] font-semibold text-ink-100">Proactive Intelligence</span>
          {signalCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 border border-red-500/30 text-[10px] font-bold text-red-400">
              {signalCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-ink-600 font-mono">
            {lastRefreshed.toLocaleTimeString()}
          </span>
          <button
            onClick={refresh}
            className="p-1 rounded hover:bg-bg-700 transition-colors text-ink-500 hover:text-ink-200"
            title="Refresh now"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">

        {/* ── Circuit Breaker Status (§5) ─────────────────────────────────── */}
        {circuit && (
          <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
            circuit.state === 'CLOSED'
              ? 'border-accent-green/20 bg-accent-green/5'
              : circuit.state === 'HALF_OPEN'
              ? 'border-amber-500/20 bg-amber-500/5'
              : 'border-red-500/20 bg-red-500/5'
          }`}>
            <Activity size={13} className={circuitColor(circuit.state)} />
            <div className="flex-1 min-w-0">
              <span className={`text-[12px] font-semibold ${circuitColor(circuit.state)}`}>
                LLM Circuit: {circuit.state}
              </span>
              {circuit.state === 'OPEN' && (
                <p className="text-[11px] text-ink-400 mt-0.5">
                  Ollama unreachable — routing to Groq fallback. Auto-recovers in {circuit.cooldown_seconds}s.
                </p>
              )}
              {circuit.state === 'HALF_OPEN' && (
                <p className="text-[11px] text-amber-400/70 mt-0.5">
                  Probing Ollama… {circuit.failures}/{circuit.threshold} failures. Recovery in progress.
                </p>
              )}
              {circuit.state === 'CLOSED' && (
                <p className="text-[11px] text-ink-500 mt-0.5">
                  Local inference healthy · {circuit.failures} recent failures
                </p>
              )}
            </div>
            {circuit.state !== 'CLOSED' && (
              <Link href="/status" className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0">
                Monitor <ChevronRight size={10} />
              </Link>
            )}
          </div>
        )}

        {/* ── Budget Alert (§7.3) ─────────────────────────────────────────── */}
        {budget && (
          <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
            hasBudgetWarning
              ? budget.alert_level === 'exhausted'
                ? 'border-red-500/30 bg-red-500/5'
                : 'border-amber-500/20 bg-amber-500/5'
              : 'border-border bg-bg-700/30'
          }`}>
            <DollarSign size={13} className={budgetColor(budget.alert_level)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-[12px] font-semibold ${budgetColor(budget.alert_level)}`}>
                  Budget: {budget.percent_used.toFixed(1)}% used
                </span>
                <span className="text-[10px] text-ink-500 font-mono">
                  ${budget.current_spend} / ${budget.amount}
                </span>
              </div>
              {hasBudgetWarning && (
                <p className="text-[11px] text-ink-400 mt-0.5">
                  {budget.alert_level === 'exhausted'
                    ? '⛔ Budget exhausted — all AI calls are blocked (HTTP 402). Increase limit immediately.'
                    : budget.alert_level === 'critical'
                    ? `⚠️ Budget critical. Forecast: exhausted by ${budget.forecast_exhaustion_date ? new Date(budget.forecast_exhaustion_date).toLocaleDateString() : 'soon'}.`
                    : `Budget at warning threshold. ${budget.remaining} remaining this month.`}
                </p>
              )}
              {!hasBudgetWarning && (
                <p className="text-[11px] text-ink-500 mt-0.5">
                  ${budget.remaining} remaining · on track
                </p>
              )}
            </div>
            {hasBudgetWarning && (
              <Link href="/budget" className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0">
                Manage <ChevronRight size={10} />
              </Link>
            )}
          </div>
        )}

        {/* ── Security Signal (§8.3) ──────────────────────────────────────── */}
        {security && (
          <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
            hasSecurityIssue
              ? 'border-red-500/20 bg-red-500/5'
              : 'border-border bg-bg-700/30'
          }`}>
            <Shield size={13} className={hasSecurityIssue ? 'text-red-400' : 'text-accent-green'} />
            <div className="flex-1 min-w-0">
              <span className={`text-[12px] font-semibold ${hasSecurityIssue ? 'text-red-400' : 'text-accent-green'}`}>
                Security Score: {security.security_score}/100
              </span>
              {security.open > 0 && (
                <p className="text-[11px] text-ink-400 mt-0.5">
                  {security.critical > 0
                    ? `🚨 ${security.critical} critical threat(s) open — immediate attention required.`
                    : `${security.open} open security event(s) awaiting resolution.`}
                </p>
              )}
              {!hasSecurityIssue && (
                <p className="text-[11px] text-ink-500 mt-0.5">All events resolved · no open threats</p>
              )}
            </div>
            {hasSecurityIssue && (
              <Link href="/security" className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 shrink-0">
                Review <ChevronRight size={10} />
              </Link>
            )}
          </div>
        )}

        {/* ── Request Insights + Error Rate (§12.4) ──────────────────────── */}
        {insights && (
          <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
            hasHighError ? 'border-amber-500/20 bg-amber-500/5' : 'border-border bg-bg-700/30'
          }`}>
            <TrendingUp size={13} className={hasHighError ? 'text-amber-400' : 'text-brand-400'} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-[12px] font-semibold ${hasHighError ? 'text-amber-400' : 'text-ink-100'}`}>
                  {insights.total_requests_today.toLocaleString()} requests today
                </span>
                <span className={`text-[10px] font-mono ${hasHighError ? 'text-amber-400' : 'text-ink-500'}`}>
                  {insights.error_rate_percent}% err
                </span>
              </div>
              <p className="text-[11px] text-ink-500 mt-0.5">
                {`Avg ${insights.avg_latency_ms}ms · `}
                {insights.top_models[0]
                  ? `Top: ${insights.top_models[0].model} (${insights.top_models[0].calls} calls)`
                  : 'No model activity yet'}
                {` · Local ${((insights.provider_split?.ollama ?? 0) * 100).toFixed(0)}%`}
              </p>
              {hasHighError && (
                <p className="text-[11px] text-amber-400/80 mt-0.5">
                  ⚠️ Error rate above 1% — check logs or provider health.
                </p>
              )}
            </div>
            <Link href="/insights" className="text-[10px] text-ink-400 hover:text-ink-200 flex items-center gap-1 shrink-0">
              Details <ChevronRight size={10} />
            </Link>
          </div>
        )}

        {/* ── AI Recommendation (§13.3) ───────────────────────────────────── */}
        {aiRec && (
          <div className="flex items-center gap-3 rounded-lg border border-brand-500/20 bg-brand-500/5 px-3 py-2.5">
            <Cpu size={13} className="text-brand-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[12px] font-semibold text-brand-300">
                Recommended: {aiRec.recommended_provider} · {aiRec.recommended_model}
              </span>
              <p className="text-[11px] text-ink-400 mt-0.5">
                Quality {(aiRec.expected_quality * 100).toFixed(0)}% · Cost ${aiRec.expected_cost} · 
                Best match for your current workload pattern.
              </p>
            </div>
            <Link href="/routing" className="text-[10px] text-brand-400 hover:text-brand-300 flex items-center gap-1 shrink-0">
              Apply <ArrowRight size={10} />
            </Link>
          </div>
        )}

        {/* ── Live Monitoring Alerts (§12.3) ──────────────────────────────── */}
        {visibleAlerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-ink-600 font-medium px-1">
              Live Alerts
            </p>
            {visibleAlerts.slice(0, 4).map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-[12px] ${severityColor(alert.severity)}`}
              >
                {alert.severity === 'CRITICAL' ? (
                  <XCircle size={12} className="mt-0.5 shrink-0" />
                ) : alert.severity === 'WARNING' ? (
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                ) : (
                  <BellRing size={12} className="mt-0.5 shrink-0" />
                )}
                <span className="flex-1 leading-relaxed">{alert.message}</span>
                <button
                  onClick={() => setDismissed((prev) => new Set([...prev, alert.id]))}
                  className="text-ink-600 hover:text-ink-400 transition-colors mt-0.5 shrink-0"
                  title="Dismiss"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── All Clear ───────────────────────────────────────────────────── */}
        {signalCount === 0 && !loading && (
          <div className="flex items-center gap-2.5 rounded-lg border border-accent-green/20 bg-accent-green/5 px-3 py-2.5">
            <CheckCircle2 size={13} className="text-accent-green shrink-0" />
            <div>
              <span className="text-[12px] font-semibold text-accent-green">All systems nominal</span>
              <p className="text-[11px] text-ink-500 mt-0.5">
                No active alerts · circuit closed · budget on track · security clear
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
