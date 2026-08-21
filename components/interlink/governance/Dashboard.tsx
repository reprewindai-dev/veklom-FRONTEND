import React, { useState } from 'react';
import { Agent, Capability, Evidence, QuarantinedTicket } from './types';
import { ShieldCheck, ShieldAlert, Cpu, Database, Landmark, RefreshCw, BarChart2, Activity, AlertTriangle, Gauge, Grid, Clock, Flame, Sliders, Filter, Calendar, GitCompare, TrendingUp, ArrowRightLeft, Sparkles, Plus, X, UserPlus, Fingerprint, FileText } from 'lucide-react';

// Expected 7-day baseline calls for each agent's capability profile setup
const AGENT_BASELINES: Record<string, Record<string, number>> = {
  'agent-researcher': {
    'search': 15,
    'db-read': 5,
    'db-delete': 0,
    'payout-trigger': 0
  },
  'agent-db-sync': {
    'search': 0,
    'db-read': 2,
    'db-delete': 18,
    'payout-trigger': 0
  },
  'agent-untrusted': {
    'search': 12,
    'db-read': 8,
    'db-delete': 0,
    'payout-trigger': 0
  }
};

interface DashboardProps {
  agents: Agent[];
  capabilities: Capability[];
  quarantineTickets: QuarantinedTicket[];
  ledger: Evidence[];
  onToggleAgentStatus: (agentId: string) => void;
  onResetSystem: () => void;
  onSelectTab: (tab: string) => void;
  onAddAgent?: (newAgent: Agent) => void;
  onGenerateProfile?: (agentId: string) => Promise<{ bio: string; technicalSummary: string } | null>;
}

export default function Dashboard({
  agents,
  capabilities,
  quarantineTickets,
  ledger,
  onToggleAgentStatus,
  onResetSystem,
  onSelectTab,
  onAddAgent,
  onGenerateProfile
}: DashboardProps) {
  // Stats
  const activeAgents = agents.filter(a => a.status === 'active');
  const avgTrustScore = Math.round(agents.reduce((acc, curr) => acc + curr.trustScore, 0) / agents.length);
  const totalAnomalies = agents.reduce((acc, curr) => acc + curr.anomalyCount, 0);
  const totalBudgetLimit = agents.reduce((acc, curr) => acc + curr.budgetLimit, 0);
  const totalBudgetUsed = agents.reduce((acc, curr) => acc + curr.budgetUsed, 0);
  const pendingQuarantines = quarantineTickets.filter(t => t.status === 'pending').length;

  // Drift Alert parameters state
  const [driftThreshold, setDriftThreshold] = useState<number>(30);

  // 24-Hour Capability Heatmap State Configuration
  const [heatmapGroupBy, setHeatmapGroupBy] = useState<'agent' | 'capability'>('agent');
  const [heatmapStatusFilter, setHeatmapStatusFilter] = useState<'all' | 'authorized' | 'denied'>('all');
  const [heatPeakThreshold, setHeatPeakThreshold] = useState<number>(3);
  const [selectedHeatCell, setSelectedHeatCell] = useState<{ rowId: string; rowLabel: string; hour: number } | null>(null);

  // Comparative Performance Analysis View State Configuration
  const [compareAgentAId, setCompareAgentAId] = useState<string>(agents[0]?.id || '');
  const [compareAgentBId, setCompareAgentBId] = useState<string>(agents[1]?.id || agents[2]?.id || agents[0]?.id || '');

  // Gemini Operational Profile States
  const [selectedAgentIdForProfile, setSelectedAgentIdForProfile] = useState<string | null>(null);
  const [isAddingAgent, setIsAddingAgent] = useState<boolean>(false);
  const [isGeneratingProfile, setIsGeneratingProfile] = useState<boolean>(false);
  const [profileGenError, setProfileGenError] = useState<string | null>(null);

  // Registration Form State
  const [formData, setFormData] = useState({
    name: '',
    ownerId: 'owner-external',
    category: 'service' as 'system' | 'user' | 'service',
    framework: 'LlamaIndex v3.0',
    budgetLimit: 500,
    autoGenerateProfile: true
  });

  const selectedAgent = agents.find(a => a.id === selectedAgentIdForProfile) || null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newId = `agent-${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'custom'}-${Math.floor(Math.random() * 1000)}`;
    const randomHex = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newAgent: Agent = {
      id: newId,
      name: formData.name,
      ownerId: formData.ownerId,
      trustScore: 80,
      successRate: 0.95,
      status: 'active',
      budgetLimit: formData.budgetLimit,
      budgetUsed: 0,
      publicKey: `ed25519_pub_${randomHex}`,
      anomalyCount: 0,
      consecutiveAnomalies: 0,
      category: formData.category,
      framework: formData.framework,
    };

    if (formData.autoGenerateProfile && onGenerateProfile) {
      setIsGeneratingProfile(true);
      setProfileGenError(null);
      try {
        // First add the agent so it's queryable in the backend generator
        if (onAddAgent) {
          onAddAgent(newAgent);
        }
        // Now generate the profile via Gemini API
        await onGenerateProfile(newAgent.id);
        
        // Reset form states
        setFormData({
          name: '',
          ownerId: 'owner-external',
          category: 'service',
          framework: 'LlamaIndex v3.0',
          budgetLimit: 500,
          autoGenerateProfile: true
        });
        setIsAddingAgent(false);
      } catch (err: any) {
        setProfileGenError(err.message || "Auto-generation failed. The agent has been added, but without profile descriptions.");
      } finally {
        setIsGeneratingProfile(false);
      }
    } else {
      if (onAddAgent) {
        onAddAgent(newAgent);
      }
      setFormData({
        name: '',
        ownerId: 'owner-external',
        category: 'service',
        framework: 'LlamaIndex v3.0',
        budgetLimit: 500,
        autoGenerateProfile: true
      });
      setIsAddingAgent(false);
    }
  };

  const handleManualRegenerateProfile = async (agentId: string) => {
    if (!onGenerateProfile) return;
    setIsGeneratingProfile(true);
    setProfileGenError(null);
    try {
      await onGenerateProfile(agentId);
    } catch (err: any) {
      setProfileGenError(err.message || "Failed to regenerate profile.");
    } finally {
      setIsGeneratingProfile(false);
    }
  };

  // Extract actual transaction frequencies from ledger entries for given agent
  const getActualCounts = (agentId: string) => {
    const counts: Record<string, number> = {
      'search': 0,
      'db-read': 0,
      'db-delete': 0,
      'payout-trigger': 0
    };

    const agentRuns = ledger.filter(ev => ev.who.agentId === agentId);
    agentRuns.forEach(ev => {
      const capId = ev.what.capabilityId;
      if (capId in counts) {
        counts[capId]++;
      }
    });

    return { counts, total: agentRuns.length };
  };

  // Mathematically evaluate capability drift index (Total Variation Distance)
  const calculateAgentDrift = (agentId: string) => {
    const baseline = AGENT_BASELINES[agentId] || { 'search': 1, 'db-read': 0, 'db-delete': 0, 'payout-trigger': 0 };
    const baselineTotal = Object.values(baseline).reduce((a, b) => a + b, 0);

    const P: Record<string, number> = {};
    for (const capId in baseline) {
      P[capId] = baselineTotal > 0 ? baseline[capId] / baselineTotal : 0;
    }

    const { counts: actualCounts, total: actualTotal } = getActualCounts(agentId);

    if (actualTotal === 0) {
      return {
        driftIndex: 0,
        baselinePercentages: P,
        actualPercentages: { 'search': 0, 'db-read': 0, 'db-delete': 0, 'payout-trigger': 0 },
        actualTotal: 0
      };
    }

    const Q: Record<string, number> = {};
    for (const capId in actualCounts) {
      Q[capId] = actualTotal > 0 ? actualCounts[capId]/actualTotal : 0;
    }

    let sumAbsoluteDiff = 0;
    const allKeys = ['search', 'db-read', 'db-delete', 'payout-trigger'];
    allKeys.forEach(k => {
      sumAbsoluteDiff += Math.abs((P[k] || 0) - (Q[k] || 0));
    });

    const tvd = 0.5 * sumAbsoluteDiff;
    const driftIndex = Math.round(tvd * 100);

    return {
      driftIndex,
      baselinePercentages: P,
      actualPercentages: Q,
      actualTotal
    };
  };

  // 24-Hour Heatmap Data Aggregation Engine
  const getHeatmapData = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    // Rows depending on groupBy selection
    let rows: { id: string; label: string }[] = [];
    if (heatmapGroupBy === 'agent') {
      rows = [
        { id: 'all-agents', label: 'All Agents Combined' },
        ...agents.map(a => ({ id: a.id, label: a.name }))
      ];
    } else {
      rows = [
        { id: 'all-caps', label: 'All Capabilities Combined' },
        { id: 'search', label: 'SearchTool' },
        { id: 'db-read', label: 'DatabaseReader' },
        { id: 'db-delete', label: 'DatabaseDeleter' },
        { id: 'payout-trigger', label: 'PayoutDistribute' }
      ];
    }

    // Initialize row ID -> Hour -> Evidence[] map
    const matrix: Record<string, Record<number, Evidence[]>> = {};

    rows.forEach(r => {
      matrix[r.id] = {};
      hours.forEach(h => {
        matrix[r.id][h] = [];
      });
    });

    // Parse ledger entries and categorise into time buckets
    ledger.forEach(ev => {
      let hourVal = 0;
      try {
        const d = new Date(ev.timestamp);
        if (!isNaN(d.getTime())) {
          hourVal = d.getHours();
        }
      } catch (e) {
        hourVal = 0;
      }

      const status = ev.result.status;
      // Apply Status Security Filter
      if (heatmapStatusFilter === 'authorized' && status !== 'authorized') return;
      if (heatmapStatusFilter === 'denied' && status !== 'denied' && status !== 'quarantined') return;

      // Map to selected groupBy rows
      if (heatmapGroupBy === 'agent') {
        const agentId = ev.who.agentId;
        if (matrix['all-agents']) {
          matrix['all-agents'][hourVal].push(ev);
        }
        if (matrix[agentId]) {
          matrix[agentId][hourVal].push(ev);
        }
      } else {
        const capId = ev.what.capabilityId;
        if (matrix['all-caps']) {
          matrix['all-caps'][hourVal].push(ev);
        }
        if (matrix[capId]) {
          matrix[capId][hourVal].push(ev);
        }
      }
    });

    return { rows, hours, matrix };
  };

  return (
    <div id="dashboard-tab" className="space-y-4">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-[#0F1115] border border-[#23272E] rounded">
        <div>
          <h2 className="text-sm font-bold text-white uppercase flex items-center gap-2">
            <Landmark className="w-4 h-4 text-blue-500" />
            Compliance Status Command Center
          </h2>
          <p className="text-[10px] text-gray-500 mt-1 font-mono">
            Governing automated machine capabilities with zero-trust cryptographic attestations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-gray-400 bg-[#0B0C0E] px-2 py-1 rounded border border-[#23272E]">
            LOCALE_TIME: 2026-06-16 (UTC-7)
          </span>
          <button
            id="reset-state-btn"
            onClick={onResetSystem}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] text-blue-400 hover:text-white bg-[#15181E] hover:bg-[#1A1D23] border border-[#23272E] transition-all rounded font-mono uppercase"
          >
            <RefreshCw className="w-3 h-3" />
            Reset Base Register
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-[#0F1115] border border-[#23272E] p-4 rounded relative overflow-hidden group">
          <div className="absolute right-2 top-2 text-[#23272E] opacity-25 pointer-events-none group-hover:scale-110 transition-transform">
            <Cpu className="w-12 h-12" />
          </div>
          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Governed Agents</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-white">{agents.length}</span>
            <span className="text-[10px] text-green-400 font-mono flex items-center gap-0.5">
              ● {activeAgents.length} Active
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1 font-mono">Autonomous software entities</p>
        </div>

        {/* Stat 2 */}
        <div className="bg-[#0F1115] border border-[#23272E] p-4 rounded relative overflow-hidden group">
          <div className="absolute right-2 top-2 text-[#23272E] opacity-25 pointer-events-none group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Sovereign Trust Rating</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-blue-400">{avgTrustScore}</span>
            <span className="text-[10px] text-gray-500 font-mono">/ 100 avg</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1 font-mono">Weighted transaction adherence</p>
        </div>

        {/* Stat 3 */}
        <div className="bg-[#0F1115] border border-[#23272E] p-4 rounded relative overflow-hidden group">
          <div className="absolute right-2 top-2 text-[#23272E] opacity-25 pointer-events-none group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-12 h-12" />
          </div>
          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Active Quarantines</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-amber-500">{pendingQuarantines}</span>
            <span className="text-[10px] text-gray-500 font-mono">held limits</span>
          </div>
          <button
            id="view-quarantine-link"
            onClick={() => onSelectTab('quarantine')}
            className="text-[10px] text-blue-400 hover:underline mt-1 block h-4 text-left font-mono"
          >
            Requires Quorum Signature →
          </button>
        </div>

        {/* Stat 4 */}
        <div className="bg-[#0F1115] border border-[#23272E] p-4 rounded relative overflow-hidden group">
          <div className="absolute right-2 top-2 text-[#23272E] opacity-25 pointer-events-none group-hover:scale-110 transition-transform">
            <Activity className="w-12 h-12" />
          </div>
          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">PGL Ledger Entries</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-green-400">{ledger.length}</span>
            <span className="text-[10px] text-gray-500 font-mono">Attested</span>
          </div>
          <button
            id="view-blockchain-link"
            onClick={() => onSelectTab('ledger')}
            className="text-[10px] text-blue-400 hover:underline mt-1 block h-4 text-left font-mono"
          >
            Browse Block History →
          </button>
        </div>
      </div>

      {/* Grid: Financial Footprints & Compliance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Progress Tracker (Left) */}
        <div className="bg-[#0F1115] border border-[#23272E] p-4 rounded space-y-4 col-span-1">
          <div className="flex justify-between items-center border-b border-[#23272E] pb-3">
            <h3 className="text-xs font-bold text-[#D1D5DB] uppercase tracking-wider">Budget Quota Compliance</h3>
            <span className="bg-blue-900/30 text-blue-400 border border-blue-900/40 text-[9px] px-2 py-0.5 rounded font-mono">
              DAILY_LIMIT
            </span>
          </div>
          <div className="space-y-4 py-1">
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono">
                <span className="text-gray-400">Collective Credit Expense</span>
                <span className="text-white font-medium">
                  {totalBudgetUsed} / {totalBudgetLimit} Credits
                </span>
              </div>
              <div className="h-1.5 bg-[#0B0C0E] rounded-full overflow-hidden border border-[#23272E]">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-400 transition-all duration-500"
                  style={{ width: `${Math.min((totalBudgetUsed / totalBudgetLimit) * 100, 100).toFixed(1)}%` }}
                />
              </div>
            </div>

            {/* Micro details */}
            <div className="grid grid-cols-2 gap-3 text-[11px] bg-[#0B0C0E] p-3 rounded border border-[#23272E] font-mono">
              <div>
                <div className="text-gray-500 uppercase text-[9px]">Unused Capacity</div>
                <div className="text-gray-300 font-bold mt-1">
                  {totalBudgetLimit - totalBudgetUsed} Cr
                </div>
              </div>
              <div>
                <div className="text-gray-500 uppercase text-[9px]">Usage Coefficient</div>
                <div className="text-gray-300 font-bold mt-1">
                  {((totalBudgetUsed / totalBudgetLimit) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="border-t border-[#23272E] pt-3">
              <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Cost Category Allocation</h4>
              <div className="space-y-2 font-mono text-[10px]">
                <div className="flex justify-between text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-sm" />
                    Search Query (5cr/req)
                  </span>
                  <span className="text-gray-300">35%</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-sm" />
                    Database Sync Actions (50cr/req)
                  </span>
                  <span className="text-gray-300">45%</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-sm" />
                    Financial Payout Events (200cr/req)
                  </span>
                  <span className="text-gray-300">20%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Trend Chart (Right) */}
        <div className="bg-[#0F1115] border border-[#23272E] p-4 rounded col-span-1 lg:col-span-2">
          <div className="flex justify-between items-center border-b border-[#23272E] pb-3 mb-4">
            <div>
              <h3 className="text-xs font-bold text-[#D1D5DB] uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-green-400" />
                7-Day Interaction Compliance Log
              </h3>
            </div>
            <span className="text-gray-400 text-[10px] font-mono">100% Attestation Validation Rate</span>
          </div>

          {/* Clean custom SVG chart */}
          <div className="relative">
            <svg viewBox="0 0 500 160" className="w-full h-auto text-[#23272E]">
              {/* Grid Lines */}
              <line x1="30" y1="20" x2="480" y2="20" stroke="#23272E" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="30" y1="60" x2="480" y2="60" stroke="#23272E" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="30" y1="100" x2="480" y2="100" stroke="#23272E" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="30" y1="140" x2="480" y2="140" stroke="#23272E" strokeWidth="1" />

              {/* Data Lines & Shading - Compliance Level */}
              <defs>
                <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 50 140 L 50 110 L 120 80 L 190 120 L 260 40 L 330 90 L 400 35 L 470 42 L 470 140 Z"
                fill="url(#chart-area-grad)"
              />
              <path
                d="M 50 110 L 120 80 L 190 120 L 260 40 L 330 90 L 400 35 L 470 42"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              />

              {/* Secure Transaction Points */}
              <circle cx="50" cy="110" r="3" fill="#0B0C0E" stroke="#3b82f6" strokeWidth="1.5" />
              <circle cx="120" cy="80" r="3" fill="#0B0C0E" stroke="#3b82f6" strokeWidth="1.5" />
              <circle cx="190" cy="120" r="3" fill="#0B0C0E" stroke="#3b82f6" strokeWidth="1.5" />
              <circle cx="260" cy="40" r="3" fill="#0B0C0E" stroke="#3b82f6" strokeWidth="1.5" />
              <circle cx="330" cy="90" r="3" fill="#0B0C0E" stroke="#3b82f6" strokeWidth="1.5" />
              <circle cx="400" cy="35" r="3" fill="#0B0C0E" stroke="#3b82f6" strokeWidth="1.5" />
              <circle cx="470" cy="42" r="3" fill="#0B0C0E" stroke="#3b82f6" strokeWidth="1.5" />

              {/* Day Labels */}
              <text x="50" y="155" textAnchor="middle" fill="#4b5563" className="text-[9px] font-mono">10 JUN</text>
              <text x="120" y="155" textAnchor="middle" fill="#4b5563" className="text-[9px] font-mono">11 JUN</text>
              <text x="190" y="155" textAnchor="middle" fill="#4b5563" className="text-[9px] font-mono">12 JUN</text>
              <text x="260" y="155" textAnchor="middle" fill="#4b5563" className="text-[9px] font-mono">13 JUN</text>
              <text x="330" y="155" textAnchor="middle" fill="#4b5563" className="text-[9px] font-mono">14 JUN</text>
              <text x="400" y="155" textAnchor="middle" fill="#4b5563" className="text-[9px] font-mono">15 JUN</text>
              <text x="470" y="155" textAnchor="middle" fill="#4b5563" className="text-[9px] font-mono">16 JUN</text>

              {/* Y Axis Guides */}
              <text x="24" y="23" textAnchor="end" fill="#4b5563" className="text-[8px] font-mono">5k ops</text>
              <text x="24" y="63" textAnchor="end" fill="#4b5563" className="text-[8px] font-mono">3k ops</text>
              <text x="24" y="103" textAnchor="end" fill="#4b5563" className="text-[8px] font-mono">1k ops</text>
            </svg>
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-gray-500 bg-[#0B0C0E] px-3 py-1.5 rounded border border-[#23272E] font-mono">
            <span>● <strong>Interactive baseline</strong> learns typical behavior patterns from historical nodes.</span>
            <span className="text-green-400 uppercase">Audit status: Clean</span>
          </div>
        </div>
      </div>

      {/* Automated Behavioral Drift Analysis System Section */}
      <div className="bg-[#0F1115] border border-[#23272E] p-4 rounded space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#23272E] pb-3">
          <div>
            <h3 className="text-xs font-bold text-[#D1D5DB] uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-amber-500 animate-pulse" />
              Automated Behavioral Drift Detector
            </h3>
            <p className="text-[10px] text-gray-500 mt-1 font-mono">
              Analyzing Statistical Deviation of Agent Capability Usage against a 7-day Historical Baseline
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-3 sm:mt-0 bg-[#0B0C0E] border border-[#23272E] p-2.5 rounded text-xs">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                <span>DRIFT THRESHOLD DEVIATION SENSITIVITY</span>
                <span className="font-bold text-amber-500 font-mono text-[11px] ml-2">
                  {driftThreshold}% TVD
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="5"
                  max="80"
                  step="5"
                  value={driftThreshold}
                  onChange={(e) => setDriftThreshold(Number(e.target.value))}
                  className="w-40 accent-amber-500 cursor-pointer text-xs h-1 font-mono bg-[#1A1D23] rounded-lg"
                  id="drift-sensitivity-slider"
                />
                <div className="flex gap-1">
                  {[20, 30, 50].map((val) => (
                    <button
                      key={val}
                      onClick={() => setDriftThreshold(val)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-all font-bold uppercase border ${
                        driftThreshold === val
                          ? 'bg-amber-950/40 text-amber-400 border-amber-600/60'
                          : 'bg-transparent text-gray-500 border-[#23272E] hover:text-gray-300'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Analyzer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="drift-analyzer-grid">
          {agents.map((agent) => {
            const driftInfo = calculateAgentDrift(agent.id);
            const isDrifting = driftInfo.driftIndex > driftThreshold;
            
            // Build visual representations for capabilities
            const capabilitiesList = ['search', 'db-read', 'db-delete', 'payout-trigger'];
            const capabilityNames: Record<string, string> = {
              'search': 'SearchTool',
              'db-read': 'DatabaseReader',
              'db-delete': 'DatabaseDeleter',
              'payout-trigger': 'PayoutDistribute'
            };

            return (
              <div 
                key={agent.id} 
                className={`p-3.5 rounded border transition-all relative ${
                  isDrifting 
                    ? 'bg-[#1C0E0F]/40 border-red-950/75 shadow-[0_4px_25px_rgba(239,68,68,0.06)]' 
                    : 'bg-[#0B0C0E]/50 border-[#23272E]'
                }`}
                id={`drift-card-${agent.id}`}
              >
                {isDrifting && (
                  <div className="absolute top-2 right-2 animate-ping h-2 w-2 rounded-full bg-red-500" />
                )}

                <div className="flex justify-between items-start mb-2">
                  <div>
                    <button
                      onClick={() => setSelectedAgentIdForProfile(agent.id)}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 font-sans text-left hover:underline cursor-pointer transition-colors block"
                      title="Click to view Agent Operational Profile"
                    >
                      {agent.name}
                    </button>
                    <span className="text-[9px] text-gray-500 font-mono uppercase">{agent.category} profile template</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-mono font-black block px-2 py-0.5 rounded border ${
                      isDrifting 
                        ? 'bg-red-950/60 text-red-400 border-red-500/50 animate-pulse' 
                        : driftInfo.driftIndex > 0
                        ? 'bg-amber-950/20 text-amber-500 border-amber-900/30'
                        : 'bg-[#0F1115] text-green-400 border-green-900/30'
                    }`}>
                      {driftInfo.driftIndex}% DRIFT
                    </span>
                  </div>
                </div>

                <div className="text-[10.5px] italic text-gray-400 pr-2 mt-1 leading-relaxed border-l-2 border-[#23272E] px-2 font-mono">
                  {isDrifting 
                    ? `⚠️ High deviation logged. Agent has shifted execution intensity into unauthorized or peripheral pipelines.` 
                    : driftInfo.actualTotal === 0
                    ? `✓ Quiet operational window. No active ledger updates registered on live attestation channel.`
                    : `✓ Healthy alignment index. Executing capabilities within safe baseline intervals.`
                  }
                </div>

                {/* Capability Comparison Breakdown */}
                <div className="space-y-2.5 mt-3 pt-3 border-t border-[#23272E]/60">
                  <div className="flex justify-between text-[8px] text-gray-500 font-mono uppercase font-bold tracking-wider">
                    <span>Capability Endpoint</span>
                    <span className="flex gap-4">
                      <span>Baseline (BL)</span>
                      <span>Actual (ACT)</span>
                    </span>
                  </div>

                  {capabilitiesList.map((capId) => {
                    const blPct = driftInfo.baselinePercentages[capId] || 0;
                    const actPct = driftInfo.actualPercentages[capId] || 0;
                    const blPctStr = (blPct * 100).toFixed(0);
                    const actPctStr = (actPct * 100).toFixed(0);

                    return (
                      <div key={capId} className="space-y-1 font-mono text-[10px]">
                        <div className="flex justify-between text-gray-400 text-[9.5px]">
                          <span>{capabilityNames[capId] || capId}</span>
                          <span className="flex items-center gap-3">
                            <span className="text-gray-500">{blPctStr}%</span>
                            <span className={`font-bold ${
                              actPct > 0 
                                ? (isDrifting && (capId === 'db-delete' || capId === 'payout-trigger') ? 'text-red-400 font-bold' : 'text-blue-400') 
                                : 'text-gray-600'
                            }`}>{actPctStr}%</span>
                          </span>
                        </div>
                        {/* Progressive Double Indicator Bar */}
                        <div className="grid grid-cols-2 gap-1.5">
                          {/* Baseline microbar */}
                          <div className="h-1 bg-[#15181E] rounded-full overflow-hidden border border-[#23272E]/40">
                            <div 
                              className="h-full bg-gray-600 transition-all duration-300" 
                              style={{ width: `${blPct * 100}%` }}
                            />
                          </div>
                          {/* Empirical/Actual microbar */}
                          <div className="h-1 bg-[#15181E] rounded-full overflow-hidden border border-[#23272E]/40">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                isDrifting && (capId === 'db-delete' || capId === 'payout-trigger') 
                                  ? 'bg-red-500' 
                                  : 'bg-blue-500'
                              }`} 
                              style={{ width: `${actPct * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Warning message explaining anomalous capability action */}
                {isDrifting && (
                  <div className="mt-3 p-2 bg-red-950/45 text-red-400 border border-red-500/30 rounded text-[9.5px] font-mono leading-relaxed uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 animate-bounce text-red-400" />
                    <span>Behavioral Drift Alert: out-of-profile actions!</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 24-Hour Capability Traffic Heatmap Component */}
      <div className="bg-[#0F1115] border border-[#23272E] p-4 rounded space-y-4" id="capability-heatmap-section">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-[#23272E] pb-3">
          <div>
            <h3 className="text-xs font-bold text-[#D1D5DB] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              Telemetry Analytics: 24-Hour Execution Heatmap
            </h3>
            <p className="text-[10px] text-gray-500 mt-1 font-mono">
              Analyzing live capability request density over rolling 24-hour intervals to isolate peak execution anomalies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
            {/* Dimension Selection */}
            <div className="bg-[#0B0C0E] border border-[#23272E] p-1.5 rounded flex items-center gap-1">
              <span className="text-gray-500 uppercase px-1">Dimension:</span>
              <button
                onClick={() => { setHeatmapGroupBy('agent'); setSelectedHeatCell(null); }}
                className={`px-2 py-0.5 rounded text-[9.5px] transition-all font-bold ${
                  heatmapGroupBy === 'agent'
                    ? 'bg-blue-950/40 text-blue-400 border border-blue-900/40'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                id="heatmap-group-agent"
              >
                BY AGENT
              </button>
              <button
                onClick={() => { setHeatmapGroupBy('capability'); setSelectedHeatCell(null); }}
                className={`px-2 py-0.5 rounded text-[9.5px] transition-all font-bold ${
                  heatmapGroupBy === 'capability'
                    ? 'bg-blue-950/40 text-blue-400 border border-blue-900/40'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                id="heatmap-group-cap"
              >
                BY CAPABILITY
              </button>
            </div>

            {/* Filter Toggle */}
            <div className="bg-[#0B0C0E] border border-[#23272E] p-1.5 rounded flex items-center gap-1">
              <span className="text-gray-500 uppercase px-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-gray-600" /> Status:
              </span>
              {(['all', 'authorized', 'denied'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => { setHeatmapStatusFilter(filter); setSelectedHeatCell(null); }}
                  className={`px-2 py-0.5 rounded text-[9.5px] uppercase transition-all font-bold ${
                    heatmapStatusFilter === filter
                      ? 'bg-teal-950/30 text-teal-400 border border-teal-900/40'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  id={`heatmap-filter-${filter}`}
                >
                  {filter === 'all' ? 'All' : filter === 'authorized' ? 'Auth' : 'Violations'}
                </button>
              ))}
            </div>

            {/* High frequency toggle slider */}
            <div className="bg-[#0B0C0E] border border-[#23272E] p-1.5 rounded flex items-center gap-2">
              <span className="text-gray-500 uppercase flex items-center gap-1">
                <Flame className="w-3 h-3 text-red-500 animate-pulse" /> Spike Threshold
              </span>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={heatPeakThreshold}
                onChange={(e) => { setHeatPeakThreshold(Number(e.target.value)); }}
                className="w-14 accent-red-500 cursor-pointer h-1 rounded bg-[#1A1D23]"
                id="heatmap-threshold-slider"
              />
              <span className="font-bold text-red-400 min-w-[28px]">{heatPeakThreshold}x</span>
            </div>
          </div>
        </div>

        {(() => {
          const { rows, hours, matrix } = getHeatmapData();
          return (
            <div className="space-y-3">
              {/* Main matrix box */}
              <div className="overflow-x-auto bg-[#0B0C0E] border border-[#23272E] p-4 rounded font-mono">
                <div className="min-w-[760px]">
                  
                  {/* Grid layout */}
                  <div className="space-y-3">
                    
                    {/* Hour tickers layout */}
                    <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                      <div className="text-[9px] uppercase font-bold text-gray-500">Execution Timeline</div>
                      <div 
                        className="grid gap-1 text-center font-mono font-bold text-[8.5px] text-gray-500"
                        style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
                      >
                        {hours.map((h) => {
                          const formattedHour = h.toString().padStart(2, '0');
                          return (
                            <div key={h} className="group relative">
                              <span>{formattedHour}</span>
                              <div className="absolute hidden group-hover:block bottom-5 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-gray-800 text-[8px] text-white p-1 rounded whitespace-nowrap z-30">
                                {formattedHour}:00 - {formattedHour}:59
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Hour phase guides labels */}
                    <div className="grid grid-cols-[160px_1fr] gap-4 items-center border-b border-[#23272E]/40 pb-2">
                      <span className="text-[8px] text-gray-600 uppercase">Interactive Nodes</span>
                      <div 
                        className="grid gap-1 text-center font-mono text-[7px] text-gray-600"
                        style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
                      >
                        <div className="col-span-6 text-left pl-1 border-l border-[#23272E]/30">Early Operations (00-05)</div>
                        <div className="col-span-6 text-left pl-1 border-l border-[#23272E]/30">Peak Morning (06-11)</div>
                        <div className="col-span-6 text-left pl-1 border-l border-[#23272E]/30">Afternoon/Sync (12-17)</div>
                        <div className="col-span-6 text-left pl-1 border-l border-[#23272E]/30">Night Watch (18-23)</div>
                      </div>
                    </div>

                    {/* Data Rows */}
                    {rows.map((row) => {
                      return (
                        <div key={row.id} className="grid grid-cols-[160px_1fr] gap-4 items-center group/row hover:bg-[#15181E]/30 p-1 rounded transition-colors" id={`heatmap-row-${row.id}`}>
                          {/* Row identifier */}
                          <div className="truncate pr-2">
                            <span className="font-sans font-bold text-[10.5px] text-gray-300 group-hover/row:text-white transition-colors">
                              {row.label}
                            </span>
                          </div>

                          {/* 24 heat slots columns */}
                          <div 
                            className="grid gap-1"
                            style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
                          >
                            {hours.map((hour) => {
                              const matches = matrix[row.id]?.[hour] || [];
                              const count = matches.length;
                              const isPeak = count >= heatPeakThreshold && count > 0;
                              const isSelected = selectedHeatCell?.rowId === row.id && selectedHeatCell?.hour === hour;

                              // Define visual theme classnames depending on count
                              let slotColor = 'bg-[#15181E]/40 border-[#23272E]/60 text-gray-600';
                              if (count > 0) {
                                if (isPeak) {
                                  slotColor = 'bg-red-950/40 border-red-500/60 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.15)] animate-pulse';
                                } else if (count >= 5) {
                                  slotColor = 'bg-amber-950/35 border-amber-600/40 text-amber-300';
                                } else if (count >= 3) {
                                  slotColor = 'bg-blue-950/35 border-blue-600/40 text-blue-300';
                                } else {
                                  slotColor = 'bg-teal-950/30 border-teal-800/30 text-teal-300';
                                }
                              }

                              const highlightBorder = isSelected
                                ? 'ring-2 ring-white scale-110 z-10'
                                : 'hover:scale-105 hover:border-gray-400';

                              return (
                                <button
                                  key={hour}
                                  onClick={() => setSelectedHeatCell({ rowId: row.id, rowLabel: row.label, hour })}
                                  className={`aspect-square w-full rounded flex items-center justify-center text-[8.5px] font-bold border transition-all cursor-pointer ${slotColor} ${highlightBorder}`}
                                  title={`${row.label} | ${hour.toString().padStart(2, '0')}:00 -> ${count} calls`}
                                  id={`heatcell-${row.id}-${hour}`}
                                >
                                  {count > 0 ? count : ''}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                  </div>

                </div>
              </div>

              {/* Color legend block plus quick visual trends summary */}
              <div className="bg-[#0B0C0E]/50 border border-[#23272E] px-3.5 py-2.5 rounded flex flex-col md:flex-row justify-between items-center gap-4 font-mono text-[9.5px]">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-gray-500 uppercase font-bold text-[8.5px] tracking-wider">Legend:</span>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-[#15181E]/40 border border-[#23272E]/60 rounded" />
                    <span className="text-gray-400">0 Quiet</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-teal-950/30 border border-teal-850/40 rounded" />
                    <span className="text-teal-400">1-2 Initial</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-blue-950/35 border border-blue-650/40 rounded" />
                    <span className="text-blue-400">3-4 Normal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-amber-950/35 border border-amber-600/40 rounded" />
                    <span className="text-amber-400">5-9 Elev.</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-red-950/40 border border-red-500/60 rounded animate-pulse" />
                    <span className="text-red-400 font-bold">Peak Spike</span>
                  </div>
                </div>

                <div className="text-gray-500 text-[9px] flex items-center gap-1.5 uppercase font-bold tracking-wider">
                  <Activity className="w-3 h-3 text-cyan-400" />
                  <span>Real-time live telemetry hooked into compliance pipeline ledger</span>
                </div>
              </div>

              {/* Cell traffic inspector breakdown panel */}
              {selectedHeatCell && (() => {
                const hourStr = selectedHeatCell.hour.toString().padStart(2, '0');
                const cellMatches = matrix[selectedHeatCell.rowId]?.[selectedHeatCell.hour] || [];
                
                return (
                  <div className="bg-[#12141C] border border-[#2E354F]/40 p-4 rounded-md space-y-3" id="heatmap-cell-inspector">
                    <div className="flex justify-between items-center border-b border-[#2E354F]/30 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <h4 className="text-xs font-bold text-white uppercase font-sans">
                          Traffic Inspector: <span className="text-cyan-300 font-mono text-[11px]">{selectedHeatCell.rowLabel}</span>
                        </h4>
                        <span className="text-gray-500 text-[9px] font-mono font-bold bg-[#0B0C0E] border border-[#23272E] px-1.5 py-0.5 rounded ml-2">
                          WINDOW: {hourStr}:00 - {hourStr}:59 UTC
                        </span>
                      </div>
                      <button 
                        onClick={() => setSelectedHeatCell(null)}
                        className="text-gray-500 hover:text-white transition-colors text-[10px] font-mono border border-[#23272E] hover:border-gray-600 px-2 py-0.5 rounded"
                      >
                        [ CLOSE ]
                      </button>
                    </div>

                    {cellMatches.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 font-mono text-[10.5px]">
                        No compliance transactions or capability requests logged during this hour.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] text-cyan-400/80 font-mono">
                          <span>AGGREGATE TRANSACTION COUNT: {cellMatches.length} CALLED</span>
                          {cellMatches.length >= heatPeakThreshold && (
                            <span className="text-red-400 font-bold animate-pulse text-[9px] uppercase tracking-wider flex items-center gap-1 bg-red-950/20 px-2 py-0.5 rounded border border-red-900/40">
                              ⚠️ PEAK TRAFFIC SPIKE DETECTED
                            </span>
                          )}
                        </div>

                        <div className="max-h-56 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                          {cellMatches.map((ev, idx) => {
                            const status = ev.result.status;
                            return (
                              <div key={ev.evidenceId || idx} className="bg-[#0B0C0E]/75 border border-[#23272E]/80 p-2.5 rounded font-mono text-[9.5px] hover:border-[#2E354F]/60 transition-colors">
                                <div className="flex justify-between items-center gap-4 mb-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-blue-400 font-bold">{ev.who.agentName}</span>
                                    <span className="text-gray-600">→</span>
                                    <span className="text-amber-400 font-bold uppercase text-[9px] bg-amber-950/20 px-1 py-0.1 rounded border border-amber-900/30">{ev.what.capabilityName}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-500 font-mono text-[8.5px]">
                                      {(() => {
                                        try {
                                          return new Date(ev.timestamp).toLocaleTimeString([], { hour12: false });
                                        } catch (e) {
                                          return ev.timestamp;
                                        }
                                      })()}
                                    </span>
                                    <span className={`px-1.5 py-0.2 rounded font-bold text-[8.5px] uppercase ${
                                      status === 'authorized' ? 'bg-green-950/30 text-green-400 border border-green-900/30' : 
                                      'bg-red-950/30 text-red-500 border border-red-900/60'
                                    }`}>
                                      {status}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-gray-400 leading-relaxed max-w-full overflow-x-hidden text-ellipsis line-clamp-1">
                                  {ev.result.outputSummary || ev.what.action || 'No descriptive summary saved.'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })()}
      </div>

      {/* Comparative Performance Analytics Panel */}
      <div className="bg-[#0F1115] border border-[#23272E] p-4 rounded space-y-4 shadow-xl" id="comparative-performance-section">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-[#23272E] pb-3">
          <div>
            <h3 className="text-xs font-bold text-[#D1D5DB] uppercase tracking-wider flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-pink-500" />
              Agent Comparative Performance Matrix
            </h3>
            <p className="text-[10px] text-gray-500 mt-1 font-mono">
              Execute twin-agent telemetry cross-evaluations matching security ratings, limits, and anomaly records.
            </p>
          </div>

          {/* Peer Selection Controls */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
            <div className="bg-[#0B0C0E] border border-[#23272E] px-2.5 py-1.5 rounded flex items-center gap-2">
              <span className="text-[#22d3ee] font-bold">PEER A:</span>
              <select
                value={compareAgentAId}
                onChange={(e) => setCompareAgentAId(e.target.value)}
                className="bg-[#15181E] text-white border border-[#23272E] rounded px-2 py-0.5 text-[10px] uppercase font-bold text-ellipsis max-w-[130px] sm:max-w-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                id="compare-selector-a"
              >
                {agents.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center text-gray-600">
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </div>

            <div className="bg-[#0B0C0E] border border-[#23272E] px-2.5 py-1.5 rounded flex items-center gap-2">
              <span className="text-[#f472b6] font-bold">PEER B:</span>
              <select
                value={compareAgentBId}
                onChange={(e) => setCompareAgentBId(e.target.value)}
                className="bg-[#15181E] text-white border border-[#23272E] rounded px-2 py-0.5 text-[10px] uppercase font-bold text-ellipsis max-w-[130px] sm:max-w-xs focus:ring-1 focus:ring-pink-500 focus:outline-none"
                id="compare-selector-b"
              >
                {agents.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.category})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {(() => {
          const agentA = agents.find(a => a.id === compareAgentAId);
          const agentB = agents.find(a => a.id === compareAgentBId);

          if (!agentA || !agentB) {
            return (
              <div className="text-center py-6 text-gray-500 font-mono text-xs">
                Could not retrieve active comparative profiles. Select valid agents above.
              </div>
            );
          }

          const sameAgent = agentA.id === agentB.id;

          // Compute trust parameters
          const trustDiff = agentA.trustScore - agentB.trustScore;

          // Compute budget metrics
          const budgetA_Limit = agentA.budgetLimit || 100;
          const budgetA_Used = agentA.budgetUsed || 0;
          const budgetA_Pct = Math.min(100, Math.round((budgetA_Used / budgetA_Limit) * 100));

          const budgetB_Limit = agentB.budgetLimit || 100;
          const budgetB_Used = agentB.budgetUsed || 0;
          const budgetB_Pct = Math.min(100, Math.round((budgetB_Used / budgetB_Limit) * 100));

          // Max value for resource scale helper
          const maxBudgetScale = Math.max(budgetA_Limit, budgetB_Limit, 100);

          // Get drift info if defined
          const driftInfoA = calculateAgentDrift(agentA.id);
          const driftInfoB = calculateAgentDrift(agentB.id);

          return (
            <div className="space-y-4">
              {sameAgent && (
                <div className="bg-amber-950/20 border border-amber-900/40 p-2.5 rounded text-amber-400 font-mono text-[9px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span><strong>COMPARATIVE WARNING:</strong> Evaluating identical signatures ({agentA.name}). Select separate peers to compute delta variance benchmarks.</span>
                </div>
              )}

              {/* Grid: Gauges & Resource Stack Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                
                {/* Visual Chart 1: Trust Score Dial Gauges */}
                <div className="bg-[#0B0C0E] border border-[#23272E] p-4 rounded flex flex-col justify-between" id="compare-chart-trust">
                  <div className="border-b border-[#23272E]/60 pb-2 mb-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                      Trust Verification Gauges
                    </span>
                  </div>

                  {/* Radiating Gauges Side-by-Side */}
                  <div className="flex justify-around items-center py-4">
                    {/* Peer A Gauge */}
                    <div className="flex flex-col items-center space-y-2">
                      <div className="relative w-24 h-24">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          {/* Outer channel circle */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            className="stroke-[#15181E] fill-none"
                            strokeWidth="8"
                          />
                          {/* Radial progress circle */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            className="stroke-cyan-500 fill-none transition-all duration-1000"
                            strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - agentA.trustScore / 100)}
                            strokeLinecap="round"
                            style={{ filter: 'drop-shadow(0 0 4px rgba(6,182,212,0.4))' }}
                          />
                        </svg>
                        {/* Numerical text inside circle */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-mono font-bold text-white leading-none">{agentA.trustScore}</span>
                          <span className="text-[8px] uppercase tracking-widest text-cyan-400 font-mono font-black">PEER A</span>
                        </div>
                      </div>
                      <span className="text-[10.5px] font-sans font-bold text-gray-300 truncate max-w-[100px]">{agentA.name}</span>
                    </div>

                    {/* Peer B Gauge */}
                    <div className="flex flex-col items-center space-y-2">
                      <div className="relative w-24 h-24">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          {/* Outer channel circle */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            className="stroke-[#15181E] fill-none"
                            strokeWidth="8"
                          />
                          {/* Radial progress circle */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            className="stroke-pink-500 fill-none transition-all duration-1000"
                            strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - agentB.trustScore / 100)}
                            strokeLinecap="round"
                            style={{ filter: 'drop-shadow(0 0 4px rgba(244,114,182,0.4))' }}
                          />
                        </svg>
                        {/* Numerical text inside circle */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-mono font-bold text-white leading-none">{agentB.trustScore}</span>
                          <span className="text-[8px] uppercase tracking-widest text-pink-400 font-mono font-black">PEER B</span>
                        </div>
                      </div>
                      <span className="text-[10.5px] font-sans font-bold text-gray-300 truncate max-w-[100px]">{agentB.name}</span>
                    </div>
                  </div>

                  {/* Trust delta explanation */}
                  <div className="bg-[#15181E] border border-[#23272E] px-2.5 py-1.5 rounded text-[9.5px] text-center font-mono">
                    {trustDiff === 0 ? (
                      <span className="text-gray-400 uppercase font-bold">Identical trust tier values</span>
                    ) : (
                      <span>
                        <span className="text-gray-400 font-bold uppercase">Delta:</span>{' '}
                        <span className={trustDiff > 0 ? 'text-cyan-400 font-bold' : 'text-pink-400 font-bold'}>
                          {trustDiff > 0 ? agentA.name : agentB.name}
                        </span>{' '}
                        leads by{' '}
                        <span className="bg-emerald-950/25 border border-emerald-900/40 text-emerald-400 px-1 py-0.2 rounded font-bold">
                          {Math.abs(trustDiff)}pts
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Visual Chart 2: Resource Consumption Grouped Bar Chart */}
                <div className="bg-[#0B0C0E] border border-[#23272E] p-4 rounded flex flex-col justify-between xl:col-span-1" id="compare-chart-resource">
                  <div className="border-b border-[#23272E]/60 pb-2 mb-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono flex items-center gap-1">
                      <Database className="w-3.5 h-3.5 text-amber-400" />
                      Dynamic Quota Allocation Map
                    </span>
                  </div>

                  {/* Pure SVG Grouped Bar Chart */}
                  <div className="relative py-1 h-36">
                    <svg className="w-full h-full" viewBox="0 0 320 140" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      <line x1="40" y1="20" x2="310" y2="20" stroke="#23272E" strokeDasharray="2 3" />
                      <line x1="40" y1="60" x2="310" y2="60" stroke="#23272E" strokeDasharray="2 3" />
                      <line x1="40" y1="100" x2="310" y2="100" stroke="#23272E" strokeDasharray="2 3" />
                      <line x1="40" y1="120" x2="310" y2="120" stroke="#23272E" />

                      {/* Y-Axis Label ticks */}
                      <text x="35" y="24" className="fill-gray-600 font-mono text-[8px] text-right" textAnchor="end">{maxBudgetScale}cr</text>
                      <text x="35" y="74" className="fill-gray-600 font-mono text-[8px] text-right" textAnchor="end">{Math.round(maxBudgetScale / 2)}cr</text>
                      <text x="35" y="124" className="fill-gray-500 font-mono text-[8px] text-right" textAnchor="end">0</text>

                      {/* Group 1: Budget Limit columns (A vs B) */}
                      {/* Peer A limit bar (Cyan) */}
                      <rect
                        width="20"
                        height={(budgetA_Limit / maxBudgetScale) * 100}
                        x="75"
                        y={120 - (budgetA_Limit / maxBudgetScale) * 100}
                        className="fill-cyan-600/30 stroke-cyan-500/30 opacity-70 hover:opacity-100 transition-opacity"
                        strokeWidth="1"
                      />
                      {/* Peer B limit bar (Fuchsia) */}
                      <rect
                        width="20"
                        height={(budgetB_Limit / maxBudgetScale) * 100}
                        x="100"
                        y={120 - (budgetB_Limit / maxBudgetScale) * 100}
                        className="fill-pink-600/30 stroke-pink-500/30 opacity-70 hover:opacity-100 transition-opacity"
                        strokeWidth="1"
                      />

                      {/* Group 2: Budget Used columns (A vs B) */}
                      {/* Peer A used bar (Cyan filled glow) */}
                      <rect
                        width="20"
                        height={(budgetA_Used / maxBudgetScale) * 100}
                        x="195"
                        y={120 - (budgetA_Used / maxBudgetScale) * 100}
                        className="fill-cyan-500 hover:fill-cyan-400 transition-colors"
                      />
                      {/* Peer B used bar (Fuchsia filled glow) */}
                      <rect
                        width="20"
                        height={(budgetB_Used / maxBudgetScale) * 100}
                        x="220"
                        y={120 - (budgetB_Used / maxBudgetScale) * 100}
                        className="fill-pink-500 hover:fill-pink-400 transition-colors"
                      />

                      {/* Axis Titles */}
                      <text x="97" y="133" className="fill-gray-400 font-mono text-[7.5px] font-bold text-center" textAnchor="middle">BUDGET LIMIT</text>
                      <text x="217" y="133" className="fill-gray-400 font-mono text-[7.5px] font-bold text-center" textAnchor="middle">CONSUMED</text>
                    </svg>
                  </div>

                  {/* Consumed percentages */}
                  <div className="grid grid-cols-2 gap-2 mt-1.5 font-mono text-[9px]">
                    <div className="bg-[#15181E] p-1 border border-cyan-900/10 rounded flex items-center justify-between">
                      <span className="text-gray-500">A used:</span>
                      <span className="text-cyan-400 font-bold">{budgetA_Used} / {budgetA_Limit}cr ({budgetA_Pct}%)</span>
                    </div>
                    <div className="bg-[#15181E] p-1 border border-pink-900/10 rounded flex items-center justify-between">
                      <span className="text-gray-500">B used:</span>
                      <span className="text-pink-400 font-bold">{budgetB_Used} / {budgetB_Limit}cr ({budgetB_Pct}%)</span>
                    </div>
                  </div>
                </div>

                {/* Visual Chart 3: Anomaly Check and Execution Success Scales */}
                <div className="bg-[#0B0C0E] border border-[#23272E] p-4 rounded flex flex-col justify-between" id="compare-chart-safety">
                  <div className="border-b border-[#23272E]/60 pb-2 mb-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                      Anomalies & Operational Integrity
                    </span>
                  </div>

                  <div className="space-y-3 font-mono text-[10px] py-1">
                    
                    {/* Index 1: Transaction Success Index */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="text-gray-400">OPERATIONAL SUCCESS RATE</span>
                        <div className="flex gap-1.5 font-bold">
                          <span className="text-cyan-400">A: {(agentA.successRate * 100).toFixed(0)}%</span>
                          <span className="text-gray-600">|</span>
                          <span className="text-pink-400">B: {(agentB.successRate * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      
                      {/* Comparison compound progress slider */}
                      <div className="h-2 bg-[#15181E] rounded overflow-hidden flex border border-[#23272E]">
                        <div 
                          className="h-full bg-cyan-550 transition-all duration-700 bg-cyan-500" 
                          style={{ width: `${(agentA.successRate) * 50}%` }} 
                        />
                        <div className="w-[1px] bg-gray-905" />
                        <div 
                          className="h-full bg-pink-550 transition-all duration-700 bg-pink-500" 
                          style={{ width: `${(agentB.successRate) * 50}%` }} 
                        />
                      </div>
                    </div>

                    {/* Index 2: Cumulative Anomalies Registered */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="text-gray-400">CUMULATIVE ANOMALIES COUNT</span>
                        <div className="flex gap-1.5 font-bold">
                          <span className={agentA.anomalyCount > 0 ? 'text-red-400' : 'text-gray-500'}>A: {agentA.anomalyCount}</span>
                          <span className="text-gray-600">|</span>
                          <span className={agentB.anomalyCount > 0 ? 'text-pink-400' : 'text-gray-500'}>B: {agentB.anomalyCount}</span>
                        </div>
                      </div>

                      {/* Direct horizontal dot comparison layout */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#15181E] px-2 py-1 rounded flex items-center justify-between border border-[#23272E]">
                          <span className="text-xs text-gray-500">A Index:</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span 
                                key={i} 
                                className={`w-1.5 h-3 rounded-xs ${
                                  i < agentA.anomalyCount 
                                    ? 'bg-red-400 shadow-[0_0_4px_rgba(239,68,68,0.5)]' 
                                    : 'bg-[#23272E]'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>

                        <div className="bg-[#15181E] px-2 py-1 rounded flex items-center justify-between border border-[#23272E]">
                          <span className="text-xs text-gray-500">B Index:</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span 
                                key={i} 
                                className={`w-1.5 h-3 rounded-xs ${
                                  i < agentB.anomalyCount 
                                    ? 'bg-pink-400 shadow-[0_0_4px_rgba(244,114,182,0.5)]' 
                                    : 'bg-[#23272E]'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Index 3: Capability Behavioral Drift */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="text-gray-400 font-bold uppercase">Behavioral Drift Index</span>
                        <div className="flex gap-1.5 font-bold">
                          <span className="text-cyan-400">A: {driftInfoA.driftIndex}%</span>
                          <span className="text-gray-600">|</span>
                          <span className="text-pink-400">B: {driftInfoB.driftIndex}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-[#15181E] rounded-full overflow-hidden flex border border-[#23272E]/60">
                        <div
                          className="h-full bg-cyan-500"
                          style={{ width: `${Math.min(100, driftInfoA.driftIndex)}%` }}
                        />
                        <div
                          className="h-full bg-pink-500"
                          style={{ width: `${Math.min(100, driftInfoB.driftIndex)}%` }}
                        />
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Side-by-side Technical Specification Matrix Grid */}
              <div className="bg-[#0B0C0E]/70 border border-[#23272E] rounded overflow-hidden">
                <div className="bg-[#15181E] px-3 py-1.5 border-b border-[#23272E] flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                    Deep Peer Parameter Comparison Table
                  </span>
                  <span className="text-[8.5px] text-cyan-400 font-mono font-bold bg-cyan-950/25 px-1.5 py-0.2 border border-cyan-900/20 rounded">
                    Active Telemetry Validation Hooked
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[10px] font-mono whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-[#23272E]/40 text-gray-500 text-[9px] uppercase font-bold">
                        <th className="p-2">COMPLIANCE METRIC</th>
                        <th className="p-2 text-cyan-400">PEER A: {agentA.name}</th>
                        <th className="p-2 text-pink-400">PEER B: {agentB.name}</th>
                        <th className="p-2 text-right text-gray-400">SYSTEM EVALUATOR INDEX</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#23272E]/30 text-gray-300">
                      <tr>
                        <td className="p-2 font-bold text-gray-400">Ownership Sector</td>
                        <td className="p-2">{agentA.ownerId}</td>
                        <td className="p-2">{agentB.ownerId}</td>
                        <td className="p-2 text-right text-gray-500">Owner Category Match: {agentA.ownerId === agentB.ownerId ? 'True' : 'False'}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-gray-400">Categorization</td>
                        <td className="p-2 capitalize">{agentA.category} level</td>
                        <td className="p-2 capitalize">{agentB.category} level</td>
                        <td className="p-2 text-right text-gray-500">Security Ring Hierarchy</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-gray-400">Core Framework</td>
                        <td className="p-2">{agentA.framework}</td>
                        <td className="p-2">{agentB.framework}</td>
                        <td className="p-2 text-right text-gray-500">Runtime Orchestrator Engine</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-gray-400">Security Signature Key</td>
                        <td className="p-2 font-mono text-[9px] text-[#22d3ee]/80 selection:bg-cyan-950">{agentA.publicKey}</td>
                        <td className="p-2 font-mono text-[9px] text-[#f472b6]/80 selection:bg-pink-950">{agentB.publicKey}</td>
                        <td className="p-2 text-right text-gray-500">SHA-256 ECDSA Authority Checked</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-gray-400 font-sans text-[10.5px]">Governance Action</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            agentA.status === 'active' ? 'bg-green-950/20 text-green-400 border border-green-900/20' : 'bg-red-950/20 text-red-400 border border-red-900/25'
                          }`}>
                            {agentA.status === 'active' ? 'ACTIVE REGISTRY' : 'MUTED / SUSPENDED'}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            agentB.status === 'active' ? 'bg-green-950/20 text-green-400 border border-green-900/20' : 'bg-red-950/20 text-red-400 border border-red-900/25'
                          }`}>
                            {agentB.status === 'active' ? 'ACTIVE REGISTRY' : 'MUTED / SUSPENDED'}
                          </span>
                        </td>
                        <td className="p-2 text-right">
                          <span className="text-[10px] text-gray-500 font-bold uppercase text-amber-500">
                            {agentA.status === 'active' && agentB.status === 'active' ? 'HIGH PEER CONCURRENCY' : 'MUTED STATE PRESENT'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          );
        })()}
      </div>

      {/* Directory & Active Governance Lifecycle Panel */}
      <div className="bg-[#0F1115] border border-[#23272E] p-4 rounded">
        <div className="flex justify-between items-center border-b border-[#23272E] pb-3 mb-4">
          <div>
            <h3 className="text-xs font-bold text-[#D1D5DB] uppercase tracking-wider">
              Agent Governance Lifecycle Registry
            </h3>
            <p className="text-[9px] text-gray-500 font-mono mt-0.5">Manage agent authorizations & lifecycle state</p>
          </div>
          <button
            onClick={() => setIsAddingAgent(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold font-mono transition-all shadow-sm cursor-pointer"
            id="btn-register-new-agent"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>REGISTER_AGENT</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table id="agents-lifecycle-table" className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#23272E] text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2">Agent Signature Identity</th>
                <th className="py-2">Owner Unit</th>
                <th className="py-2">Trust rating</th>
                <th className="py-2">Success Index</th>
                <th className="py-2">Anomaly Counter</th>
                <th className="py-2">Behavioral Drift</th>
                <th className="py-2">Core framework</th>
                <th className="py-2">Operational quota</th>
                <th className="py-2 text-right">Lifecycle status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#23272E]/50">
              {agents.map(agent => (
                <tr key={agent.id} className="hover:bg-[#15181E]/40 transition-colors">
                  <td className="py-2.5">
                    <button
                      onClick={() => setSelectedAgentIdForProfile(agent.id)}
                      className="font-bold text-blue-400 hover:text-blue-300 block text-[11px] font-sans text-left hover:underline cursor-pointer transition-colors"
                      title="Click to view Agent Operational Profile"
                    >
                      {agent.name}
                    </button>
                    <span className="text-[9px] text-gray-600 block truncate max-w-xs">{agent.publicKey}</span>
                  </td>
                  <td className="py-2.5 text-gray-400">{agent.ownerId}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-sm ${
                        agent.trustScore >= 80 ? 'bg-green-400' :
                        agent.trustScore >= 50 ? 'bg-amber-400' : 'bg-red-500'
                      }`} />
                      <span className="font-bold text-gray-200">{agent.trustScore}</span>
                      <span className="text-[10px] text-gray-600">/100</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-gray-300">{(agent.successRate * 100).toFixed(0)}%</td>
                  <td className="py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      agent.anomalyCount === 0 ? 'bg-[#0B0C0E] text-gray-500 border border-[#23272E]' :
                      agent.anomalyCount < 3 ? 'bg-amber-950/20 text-amber-400 border border-amber-900/40' :
                      'bg-red-950/20 text-red-400 border border-red-900/40'
                    }`}>
                      {agent.anomalyCount} anomalies
                    </span>
                  </td>
                  <td className="py-2.5">
                    {(() => {
                      const driftInfo = calculateAgentDrift(agent.id);
                      const isDrifting = driftInfo.driftIndex > driftThreshold;
                      return (
                        <div className="flex items-center gap-1.5">
                          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-all duration-300 ${
                            isDrifting 
                              ? 'text-red-400 bg-red-950/30 border border-red-900/50 animate-pulse' 
                              : driftInfo.driftIndex > 0
                              ? 'text-amber-400 bg-amber-950/10 border border-amber-900/20'
                              : 'text-gray-500 bg-[#0B0C0E] border border-[#23272E]'
                          }`}>
                            {isDrifting && <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />}
                            <span>{driftInfo.driftIndex}%</span>
                            {isDrifting && <span className="text-[8px] font-black uppercase text-red-400">DRIFT ALERT</span>}
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="py-2.5 text-gray-400">{agent.framework}</td>
                  <td className="py-2.5">
                    <div className="space-y-1 w-24">
                      <div className="flex justify-between text-[9px] text-gray-600">
                        <span>{agent.budgetUsed}cr</span>
                        <span>{agent.budgetLimit}cr</span>
                      </div>
                      <div className="h-1 bg-[#0B0C0E] rounded-full overflow-hidden border border-[#23272E]">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${(agent.budgetUsed / agent.budgetLimit) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      id={`toggle-agent-${agent.id}`}
                      onClick={() => onToggleAgentStatus(agent.id)}
                      className={`px-2 py-0.5 text-[10px] uppercase font-bold transition-all rounded font-mono border ${
                        agent.status === 'active'
                          ? 'bg-green-950/20 text-green-400 hover:bg-red-950/20 hover:text-red-400 border-green-9050 border-green-900/40 hover:border-red-900/40'
                          : 'bg-red-950/20 text-red-400 hover:bg-green-950/20 hover:text-green-400 border-red-900/40 hover:border-green-900/40'
                      }`}
                    >
                      {agent.status === 'active' ? 'ACTIVE (SUSPEND)' : 'SUSPENDED (RESUME)'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🛡️ REGISTER NEW AGENT MODAL */}
      {isAddingAgent && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0E1014] border border-[#23272E] rounded-lg max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#23272E] flex justify-between items-center bg-[#0B0C0E]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <UserPlus className="w-3 h-3 text-blue-400" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest font-mono text-white">
                  Register Autonomous Agent Signature
                </span>
              </div>
              <button
                onClick={() => setIsAddingAgent(false)}
                className="text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                  Agent Identity Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LiquidityAuditor"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#15181E] border border-[#23272E] rounded p-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    Owner Sector Unit
                  </label>
                  <select
                    value={formData.ownerId}
                    onChange={(e) => setFormData(prev => ({ ...prev, ownerId: e.target.value }))}
                    className="w-full bg-[#15181E] border border-[#23272E] rounded p-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="owner-kate">Finance Operations (kate)</option>
                    <option value="owner-system">System Root (system)</option>
                    <option value="owner-thirdparty">External Partner (thirdparty)</option>
                    <option value="owner-external">Custom External Unit</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    Security Category Ring
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as 'system' | 'user' | 'service' }))}
                    className="w-full bg-[#15181E] border border-[#23272E] rounded p-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="service">Service Ring</option>
                    <option value="system">System Sovereign Ring</option>
                    <option value="user">User Proxy Ring</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    Agent Engine Framework
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Veklom Frame v1.5"
                    value={formData.framework}
                    onChange={(e) => setFormData(prev => ({ ...prev, framework: e.target.value }))}
                    className="w-full bg-[#15181E] border border-[#23272E] rounded p-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    Daily Credit Budget Limit
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    step="50"
                    required
                    value={formData.budgetLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, budgetLimit: Number(e.target.value) }))}
                    className="w-full bg-[#15181E] border border-[#23272E] rounded p-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="bg-[#15181E] border border-[#23272E] p-3 rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  <div>
                    <span className="text-white block font-bold text-[11px]">Generate Profile with Gemini API</span>
                    <span className="text-[9px] text-gray-500 block">Create technical summaries & summaries on register</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoGenerateProfile}
                  onChange={(e) => setFormData(prev => ({ ...prev, autoGenerateProfile: e.target.checked }))}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>

              {profileGenError && (
                <div className="p-3 bg-red-950/20 border border-red-900/40 text-red-400 rounded text-[11px] leading-relaxed">
                  ⚠️ {profileGenError}
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-4 border-t border-[#23272E] flex justify-end gap-2 bg-[#0E1014]">
                <button
                  type="button"
                  onClick={() => setIsAddingAgent(false)}
                  disabled={isGeneratingProfile}
                  className="px-4 py-2 rounded border border-[#23272E] hover:bg-[#15181E] text-gray-400 hover:text-white transition-all font-mono uppercase text-[10px] tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingProfile}
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono uppercase text-[10px] tracking-wider font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isGeneratingProfile ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>GENERATING_PROFILE...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>REGISTER_AGENT</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 👤 VIEW AGENT OPERATIONAL PROFILE MODAL */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0E1014] border border-[#23272E] rounded-lg max-w-xl w-full overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#23272E] flex justify-between items-center bg-[#0B0C0E]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <Fingerprint className="w-3 h-3 text-blue-400" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-widest font-mono text-white block">
                    Agent Security Compliance Dossier
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono block">Signature-authenticated profile</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAgentIdForProfile(null)}
                className="text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-xs font-mono">
              {/* Agent Overview Grid */}
              <div className="grid grid-cols-2 gap-4 bg-[#0B0C0E] border border-[#23272E] p-4 rounded-lg">
                <div className="space-y-1">
                  <span className="text-gray-500 text-[9px] uppercase tracking-wider block">Agent Signature Name</span>
                  <span className="text-white font-sans text-sm font-bold block">{selectedAgent.name}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-500 text-[9px] uppercase tracking-wider block">Owner Unit / sector</span>
                  <span className="text-gray-200 font-semibold block">{selectedAgent.ownerId}</span>
                </div>
                <div className="space-y-1 mt-2">
                  <span className="text-gray-500 text-[9px] uppercase tracking-wider block">Security Ring</span>
                  <span className="text-gray-200 block uppercase font-bold text-[10px]">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                      selectedAgent.category === 'system' ? 'bg-red-500' :
                      selectedAgent.category === 'service' ? 'bg-blue-400' : 'bg-green-400'
                    }`} />
                    {selectedAgent.category} Ring
                  </span>
                </div>
                <div className="space-y-1 mt-2">
                  <span className="text-gray-500 text-[9px] uppercase tracking-wider block">Sovereign Framework</span>
                  <span className="text-gray-200 block">{selectedAgent.framework}</span>
                </div>
              </div>

              {/* Trust & Quotas */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 bg-[#15181E] border border-[#23272E]/60 rounded-md">
                  <span className="text-gray-500 text-[9px] uppercase tracking-wider block mb-1">Trust Score</span>
                  <span className={`text-base font-bold font-sans ${
                    selectedAgent.trustScore >= 80 ? 'text-green-400' :
                    selectedAgent.trustScore >= 50 ? 'text-amber-400' : 'text-red-500'
                  }`}>{selectedAgent.trustScore}/100</span>
                </div>
                <div className="p-2.5 bg-[#15181E] border border-[#23272E]/60 rounded-md">
                  <span className="text-gray-500 text-[9px] uppercase tracking-wider block mb-1">Success rate</span>
                  <span className="text-base font-bold text-gray-200 font-sans">{(selectedAgent.successRate * 100).toFixed(0)}%</span>
                </div>
                <div className="p-2.5 bg-[#15181E] border border-[#23272E]/60 rounded-md">
                  <span className="text-gray-500 text-[9px] uppercase tracking-wider block mb-1">Anomalies</span>
                  <span className={`text-base font-bold font-sans ${
                    selectedAgent.anomalyCount === 0 ? 'text-gray-400' : 'text-red-400'
                  }`}>{selectedAgent.anomalyCount} Logged</span>
                </div>
              </div>

              {/* Gemini Generated Bio & Summary */}
              <div className="space-y-3.5 border-t border-[#23272E]/60 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Operational & technical Profile (Gemini AI)
                  </span>
                  <button
                    onClick={() => handleManualRegenerateProfile(selectedAgent.id)}
                    disabled={isGeneratingProfile}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-950/20 text-amber-400 border border-amber-900/40 hover:bg-amber-900/10 text-[9px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${isGeneratingProfile ? 'animate-spin' : ''}`} />
                    <span>REGENERATE</span>
                  </button>
                </div>

                {isGeneratingProfile ? (
                  <div className="space-y-3 p-4 bg-[#0B0C0E]/40 border border-[#23272E] rounded-md animate-pulse">
                    <div className="h-3 bg-[#1A1D23] rounded w-1/3"></div>
                    <div className="space-y-1.5">
                      <div className="h-2.5 bg-[#1A1D23] rounded"></div>
                      <div className="h-2.5 bg-[#1A1D23] rounded"></div>
                      <div className="h-2.5 bg-[#1A1D23] rounded w-5/6"></div>
                    </div>
                  </div>
                ) : selectedAgent.bio || selectedAgent.technicalSummary ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-[#0B0C0E]/40 border border-[#23272E] rounded-md space-y-3">
                      <div>
                        <span className="text-gray-500 text-[8.5px] uppercase tracking-wider font-bold block mb-1">
                          Operational Bio
                        </span>
                        <p className="text-gray-200 text-[11px] leading-relaxed font-sans font-medium">
                          {selectedAgent.bio || "No bio description generated."}
                        </p>
                      </div>

                      <div className="border-t border-[#23272E]/40 pt-3">
                        <span className="text-gray-500 text-[8.5px] uppercase tracking-wider font-bold block mb-1">
                          Technical Compliance Summary
                        </span>
                        <p className="text-gray-300 text-[11px] leading-relaxed font-mono">
                          {selectedAgent.technicalSummary || "No technical summary generated."}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-[#0B0C0E]/40 border border-[#23272E] rounded-md text-center space-y-3">
                    <div className="text-gray-500 text-[11px]">
                      No professional profile has been compiled for this agent signature.
                    </div>
                    <button
                      onClick={() => handleManualRegenerateProfile(selectedAgent.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] tracking-wide transition-all uppercase cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>COMPILE_OPERATIONAL_PROFILE</span>
                    </button>
                  </div>
                )}
              </div>

              {profileGenError && (
                <div className="p-3 bg-red-950/20 border border-red-900/40 text-red-400 rounded text-[11px]">
                  ⚠️ {profileGenError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[#23272E] flex justify-end bg-[#0B0C0E]">
              <button
                onClick={() => setSelectedAgentIdForProfile(null)}
                className="px-4 py-2 rounded border border-[#23272E] hover:bg-[#15181E] text-gray-400 hover:text-white transition-all font-mono uppercase text-[10px] tracking-wider cursor-pointer"
              >
                CLOSE DOSSIER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
