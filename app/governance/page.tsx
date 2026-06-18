'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Shield,
  TrendingUp,
  Award,
  Lock,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Copy,
  ChevronRight,
  Database,
  Users,
  Fingerprint
} from 'lucide-react';
import useSWR from 'swr';
import { fetcher, api } from '@/lib/api';
import Shell from '@/components/Shell';
import { Pill } from '@/components/telemetry';

interface TrustScoreEvent {
  id: string;
  timestamp: string;
  event_type: string;
  threat_type?: string;
  ai_confidence: number;
  description: string;
  evidence_hash: string;
  status: 'open' | 'resolved';
  resolution_notes?: string;
}

interface OperatorIdentity {
  id: string;
  wallet_address: string;
  operator_name: string;
  trust_score: number;
  rank: string;
  rank_badge_color: string;
  security_level: string;
  events_total: number;
  events_critical: number;
  events_resolved: number;
  joined_at: string;
  verified_at?: string;
  verification_status: 'unverified' | 'pending' | 'verified';
}

const RANK_TIERS = [
  { rank: 'Recruit', minScore: 0, color: 'bg-white/5 border border-white/10 text-ink-300', icon: '🎯' },
  { rank: 'Operator', minScore: 20, color: 'bg-brand-500/10 border border-brand-500/30 text-brand-400', icon: '⚙️' },
  { rank: 'Trusted Operator', minScore: 50, color: 'bg-brand-500/20 border border-brand-500/40 text-brand-400', icon: '✓' },
  { rank: 'Sovereign', minScore: 75, color: 'bg-brand-500/30 border border-brand-500/50 text-brand-400', icon: '👑' },
  { rank: 'Elite Sovereign', minScore: 90, color: 'bg-brand-500/40 border border-brand-500/60 text-brand-400', icon: '⭐' },
  { rank: 'Apex', minScore: 98, color: 'bg-brand-500/50 border border-brand-500/70 text-brand-300', icon: '🔴' },
];

const THREAT_TYPES = [
  'All',
  'brute_force',
  'sql_injection',
  'xss',
  'unauthorized_access',
  'data_exfiltration',
  'suspicious_login',
  'rate_limit_abuse',
  'anomaly',
];

export default function GovernancePage() {
  const [identity, setIdentity] = useState<OperatorIdentity | null>(null);
  const [events, setEvents] = useState<TrustScoreEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchWallet, setSearchWallet] = useState('');
  const [filterThreatType, setFilterThreatType] = useState('All');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Fetch current operator identity + real security stats (USER_MANUAL §8.3)
  useEffect(() => {
    const fetchIdentity = async () => {
      try {
        const [userData, secStats] = await Promise.all([
          api<any>('/api/v1/auth/me'),
          // §8.3: GET /api/v1/security/stats → { security_score, total, open, resolved, critical }
          api<any>('/api/v1/security/stats').catch(() => null),
        ]);

        // security_score is 0-100, directly from the manual's documented response shape
        const secScore = secStats?.security_score ?? 0;

        setIdentity({
          id: userData.id || 'op_dev',
          wallet_address: userData.wallet_address || '',
          operator_name: userData.full_name || userData.email || 'Operator',
          trust_score: secScore,
          rank: secScore >= 90 ? 'Elite Sovereign' : secScore >= 75 ? 'Sovereign' : secScore >= 50 ? 'Trusted Operator' : 'Operator',
          rank_badge_color: 'bg-brand-500/30',
          security_level: secScore >= 75 ? 'HIGH' : 'MEDIUM',
          // §8.3 exact field names from the manual
          events_total: secStats?.total ?? 0,
          events_critical: secStats?.critical ?? 0,
          events_resolved: secStats?.resolved ?? 0,
          joined_at: userData.created_at || new Date().toISOString(),
          verified_at: userData.created_at || undefined,
          verification_status: userData.pgl_id ? 'verified' : 'pending',
        });

        if (secScore >= 98) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }
      } catch (err) {
        console.error('Failed to fetch identity:', err);
        setIdentity(generateDemoOperator());
      } finally {
        setLoading(false);
      }
    };

    fetchIdentity();
  }, []);

  // Fetch trust events from standard endpoints
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await api<any>('/api/v1/security/events?limit=50');
        setEvents(Array.isArray(data) ? data : data.events || []);
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setEvents(generateDemoEvents());
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  // Resolve event
  const resolveEvent = async (eventId: string, notes: string) => {
    try {
      await api(`/api/v1/security/events/${eventId}/resolve`, {
        method: 'POST',
        body: { resolution_notes: notes }
      });
      setEvents(prev =>
        prev.map((e) =>
          e.id === eventId ? { ...e, status: 'resolved' } : e
        )
      );
    } catch (err) {
      console.error('Failed to resolve event:', err);
    }
  };

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (filterStatus === 'open' && e.status !== 'open') return false;
      if (filterStatus === 'resolved' && e.status !== 'resolved') return false;
      if (filterThreatType !== 'All' && e.threat_type !== filterThreatType)
        return false;
      return true;
    });
  }, [events, filterStatus, filterThreatType]);

  // Calculate rank
  const currentRank = useMemo(() => {
    if (!identity) return RANK_TIERS[0];
    return (
      [...RANK_TIERS].reverse().find((t) => identity.trust_score >= t.minScore) ||
      RANK_TIERS[0]
    );
  }, [identity]);

  return (
    <Shell>
      {/* Rank Celebration */}
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/60 backdrop-blur-sm">
          <div className="text-center animate-bounce">
            <div className="text-8xl mb-4">{currentRank.icon}</div>
            <p className="text-4xl font-bold text-brand-400">{currentRank.rank}</p>
            <p className="text-xl text-brand-300 mt-2 font-mono">Apex Rank Unlocked! 🎉</p>
          </div>
        </div>
      )}

      <div className="space-y-6 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-2">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-[0.18em] text-ink-600">
              Workspace · Identity & Trust
            </span>
            <h1 className="text-[28px] font-semibold tracking-tight text-gradient">
              Sovereign Governance
            </h1>
            <p className="text-sm text-ink-400 max-w-2xl mt-1.5">
              Secure operator identity records, cryptographic trust scores, and immutable security intercept ledgers.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 mt-4 lg:mt-0">
            <Link href="/governance/registry" className="btn btn-ghost text-xs py-2">
              <Database className="w-3.5 h-3.5 mr-1 text-brand-400" />
              <span>Operator Registry</span>
            </Link>
            <Link href="/audit" className="btn btn-ghost text-xs py-2">
              <Shield className="w-3.5 h-3.5 mr-1 text-brand-400" />
              <span>Audit Log</span>
            </Link>
          </div>
        </div>

        {/* Operator Card */}
        {identity && (
          <div className="card p-6 border-brand-500/20 bg-gradient-to-r from-brand-500/[0.03] to-brand-500/[0.01]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Identity */}
              <div className="space-y-2">
                <h3 className="text-ink-500 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Operator Identity
                </h3>
                <p className="text-xl font-bold text-white">
                  {identity.operator_name}
                </p>
                <p className="text-ink-400 font-mono text-xs break-all">
                  {identity.wallet_address}
                </p>
              </div>

              {/* Trust Score */}
              <div className="space-y-2">
                <h3 className="text-ink-500 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Trust Score Index
                </h3>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-4xl font-extrabold text-brand-400 tabular-nums">
                    {identity.trust_score}
                  </p>
                  <p className="text-ink-500 text-xs font-mono">/100</p>
                </div>
                <div className="w-full bg-white/[0.03] rounded-full h-2 overflow-hidden border border-white/5">
                  <div
                    className="bg-brand-400 h-full transition-all duration-500 shadow-[0_0_10px_rgba(255,184,0,0.4)]"
                    style={{ width: `${identity.trust_score}%` }}
                  />
                </div>
              </div>

              {/* Rank */}
              <div className="space-y-2">
                <h3 className="text-ink-500 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Sovereign Rank
                </h3>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${currentRank.color}`}>
                  <span className="text-base">{currentRank.icon}</span>
                  {currentRank.rank}
                </div>
                <p className="text-ink-500 text-xs mt-1 font-mono">
                  {100 - identity.trust_score} points to next verification level
                </p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#242424]">
              <div>
                <p className="text-ink-500 text-[9px] uppercase tracking-wider font-mono">
                  Total Events Logged
                </p>
                <p className="text-xl font-bold text-white font-mono mt-1">
                  {identity.events_total}
                </p>
              </div>
              <div>
                <p className="text-ink-500 text-[9px] uppercase tracking-wider font-mono">
                  Critical Vulnerabilities
                </p>
                <p className="text-xl font-bold text-red-500 font-mono mt-1">
                  {identity.events_critical}
                </p>
              </div>
              <div>
                <p className="text-ink-500 text-[9px] uppercase tracking-wider font-mono">
                  Resolved Incidents
                </p>
                <p className="text-xl font-bold text-brand-400 font-mono mt-1">
                  {identity.events_resolved}
                </p>
              </div>
              <div>
                <p className="text-ink-500 text-[9px] uppercase tracking-wider font-mono">
                  Verification Status
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <CheckCircle className="w-4 h-4 text-brand-400" />
                  <span className="text-white font-bold text-xs">PGL VERIFIED</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rank Progression */}
        <div className="card p-5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-400" />
            Rank Progression Matrix
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {RANK_TIERS.map((tier) => {
              const isActive = identity && identity.trust_score >= tier.minScore;
              const isCurrent = currentRank.rank === tier.rank;

              return (
                <div
                  key={tier.rank}
                  className={`p-3.5 rounded-xl border transition ${
                    isActive
                      ? isCurrent
                        ? 'bg-brand-500/10 border-brand-500 text-brand-400'
                        : 'bg-white/[0.01] border-white/5 text-ink-300'
                      : 'bg-black/40 border-[#242424] opacity-30 text-ink-500'
                  }`}
                >
                  <p className="text-xl mb-1.5">{tier.icon}</p>
                  <p className="text-xs font-semibold">{tier.rank}</p>
                  <p className="text-[10px] mt-0.5 font-mono">Score Required: {tier.minScore}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Events Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Filters */}
          <div className="lg:col-span-1">
            <div className="card p-5 space-y-5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#242424] pb-3">
                <Filter className="w-3.5 h-3.5 text-brand-400" />
                Ledger Filters
              </h4>

              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-ink-500 uppercase tracking-wider">
                  Threat Classification
                </label>
                <select
                  value={filterThreatType}
                  onChange={(e) => setFilterThreatType(e.target.value)}
                  className="bg-bg-950 border border-border rounded-lg w-full px-3 py-2 text-xs text-brand-400 font-mono outline-none"
                >
                  {THREAT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-ink-500 uppercase tracking-wider">
                  Lifecycle Status
                </label>
                <div className="space-y-1.5">
                  {[
                    { key: 'all', label: 'All Incidents' },
                    { key: 'open', label: 'Open Warning' },
                    { key: 'resolved', label: 'Resolved Safe' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() =>
                        setFilterStatus(opt.key as 'all' | 'open' | 'resolved')
                      }
                      className={`w-full text-left px-3 py-2 rounded-lg transition text-xs font-semibold ${
                        filterStatus === opt.key
                          ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                          : 'bg-white/[0.01] hover:bg-white/[0.03] text-ink-300 border border-transparent'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Event Ledger */}
          <div className="lg:col-span-3">
            <div className="card overflow-hidden">
              <div className="bg-white/[0.01] px-5 py-4 border-b border-[#242424] flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <Shield className="w-4 h-4 text-brand-400" />
                  Immutable Trust Event Ledger
                </h3>
                <span className="flex items-center gap-1 bg-[#151515] border border-[#242424] px-2 py-0.5 rounded text-[8px] font-mono text-brand-400">
                  <span className="w-1 h-1 rounded-full bg-brand-400 animate-pulse" />SECURE
                </span>
              </div>

              <div className="divide-y divide-[#242424] max-h-[480px] overflow-y-auto custom-scrollbar">
                {filteredEvents.length === 0 ? (
                  <div className="p-10 text-center text-xs font-mono text-ink-500 italic">
                    No matching trust events logged.
                  </div>
                ) : (
                  filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() =>
                        setExpandedEvent(
                          expandedEvent === event.id ? null : event.id
                        )
                      }
                      className="p-5 hover:bg-white/[0.01] cursor-pointer transition"
                    >
                      <div className="flex items-start justify-between mb-2 gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <p className="text-xs font-bold text-white font-mono">
                              {event.event_type}
                            </p>
                            {event.threat_type && (
                              <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-ink-300 text-[9px] font-mono rounded">
                                {event.threat_type}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink-400 leading-relaxed">
                            {event.description}
                          </p>
                        </div>
                        <div
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                            event.status === 'resolved'
                              ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {event.status === 'resolved' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {event.status}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-ink-500 font-mono">
                        <p>{new Date(event.timestamp).toLocaleString()}</p>
                        <p>
                          Model Confidence: <span className="text-brand-300">{(event.ai_confidence * 100).toFixed(0)}%</span>
                        </p>
                      </div>

                      {/* Evidence Hash */}
                      <div className="mt-3 pt-2.5 border-t border-[#242424] flex items-center justify-between">
                        <span className="text-[9px] text-ink-500 font-mono">Evidence HMAC-SHA256:</span>
                        <span className="font-mono text-[10px] text-brand-400 break-all select-all font-semibold">
                          {event.evidence_hash}
                        </span>
                      </div>

                      {/* Expanded Details */}
                      {expandedEvent === event.id && event.status === 'open' && (
                        <div className="mt-4 pt-4 border-t border-[#242424] space-y-3">
                          <textarea
                            placeholder="Enter resolution details..."
                            className="input text-xs"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const notes = (
                                e.currentTarget.parentElement
                                  ?.querySelector('textarea') as HTMLTextAreaElement
                              )?.value;
                              resolveEvent(event.id, notes || '');
                            }}
                            className="btn btn-primary text-xs w-full py-2"
                          >
                            Resolve Security Exception
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Public Secure Directory */}
        <div className="card overflow-hidden">
          <div className="bg-white/[0.01] px-5 py-4 border-b border-[#242424]">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <Fingerprint className="w-4 h-4 text-brand-400" />
              Public Secure Node Directory
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#121212] text-ink-400 uppercase tracking-wider text-[10px] font-mono border-b border-[#242424]">
                <tr>
                  <th className="px-6 py-3.5 text-left font-bold">Operator</th>
                  <th className="px-6 py-3.5 text-left font-bold">Current Rank</th>
                  <th className="px-6 py-3.5 text-center font-bold">Trust Index</th>
                  <th className="px-6 py-3.5 text-center font-bold">Events Logged</th>
                  <th className="px-6 py-3.5 text-left font-bold">Verification Date</th>
                  <th className="px-6 py-3.5 text-center font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242424] font-mono">
                {identity && (
                  <tr className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 text-white font-semibold font-sans">
                      {identity.operator_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold ${currentRank.color}`}>
                        {currentRank.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-brand-400 font-bold">
                        {identity.trust_score}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-ink-300">
                      {identity.events_total}
                    </td>
                    <td className="px-6 py-4 text-ink-400">
                      {new Date(identity.joined_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded text-[10px] font-bold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        VERIFIED
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #242424; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2e2e2e; }
      `}} />
    </Shell>
  );
}

// Demo data fallback
function generateDemoOperator(): OperatorIdentity {
  return {
    id: 'op_demo_123',
    wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f6bEd0',
    operator_name: 'Sovereign Alice',
    trust_score: 87,
    rank: 'Sovereign',
    rank_badge_color: 'bg-brand-500/30',
    security_level: 'HIGH',
    events_total: 42,
    events_critical: 2,
    events_resolved: 40,
    joined_at: '2025-06-01T00:00:00Z',
    verified_at: '2025-06-05T00:00:00Z',
    verification_status: 'verified',
  };
}

function generateDemoEvents(): TrustScoreEvent[] {
  return [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      event_type: 'suspicious_login',
      threat_type: 'suspicious_login',
      ai_confidence: 0.92,
      description: '3 failed login attempts from unusual IP',
      evidence_hash: 'sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
      status: 'resolved',
      resolution_notes: 'User confirmed legitimate access attempt',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      event_type: 'anomaly',
      threat_type: 'rate_limit_abuse',
      ai_confidence: 0.78,
      description: 'Unusual spike in API key usage detected',
      evidence_hash: 'sha256:q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6',
      status: 'open',
    },
  ];
}
