"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import {
  Radio, TerminalSquare, Scale, ScrollText,
  Boxes, Bot, ShieldAlert, Activity, Link2
} from "lucide-react";

// ── Governance Portal components (self-contained, local simulation state)
import GovDashboard from "@/components/interlink/governance/Dashboard";
import PipelineVisualizer from "@/components/interlink/governance/PipelineVisualizer";
import PolicyManager from "@/components/interlink/governance/PolicyManager";
import QuarantineCenter from "@/components/interlink/governance/QuarantineCenter";
import LedgerExplorer from "@/components/interlink/governance/LedgerExplorer";

// ── Governance Portal seeded state
import {
  INITIAL_AGENTS,
  INITIAL_CAPABILITIES,
  INITIAL_POLICIES,
  INITIAL_LEDGER,
} from "@/components/interlink/governance/scenarios";

// ── Governance Portal types
import { Agent, Capability, Policy, Evidence, QuarantinedTicket, PolicyRule, SimulationResult } from "@/components/interlink/governance/types";

// ── Interlink live hook (proxies to api.veklom.com)
import { useInterlinkLive, interlinkPost, interlinkGet, refreshInterlink } from "@/components/interlink/useLive";

const TABS = [
  { id: "overview",   label: "Overview",        icon: Radio,          hint: "9-phase protocol" },
  { id: "dashboard",  label: "Dashboard",        icon: Activity,       hint: "live metrics" },
  { id: "pipeline",   label: "Pipeline",         icon: Link2,          hint: "phase visualizer" },
  { id: "policies",   label: "Policy Manager",   icon: Scale,          hint: "rules + tiers" },
  { id: "ledger",     label: "Ledger",           icon: ScrollText,     hint: "evidence chain" },
  { id: "agents",     label: "Agents",           icon: Bot,            hint: "trust + risk" },
  { id: "registry",   label: "Registry",         icon: Boxes,          hint: "capabilities" },
  { id: "safety",     label: "Safety",           icon: ShieldAlert,    hint: "anomalies + quorum" },
  { id: "quarantine", label: "Quarantine",       icon: ShieldAlert,    hint: "quorum review" },
];

const PHASES = [
  "Identity", "Policy", "Safety", "Cost",
  "Approval", "Execution", "Evidence", "Audit", "Response",
];

const PILLARS = [
  {
    title: "Self-describing",
    body: "Every actor and capability carries verifiable identity. Agents ask \"what can I do, right now?\" and get a policy-true answer.",
  },
  {
    title: "Self-authorizing",
    body: "System, owner, and runtime policies compose at call time. Conflicts resolve deterministically before a single side effect.",
  },
  {
    title: "Self-proving",
    body: "Each call seals a hash-chained evidence record on the PGL. The proof is the product — replayable, tamper-evident, audit-ready.",
  },
  {
    title: "Self-improving",
    body: "Trust scores, behavioral baselines, cost attribution, and risk scoring update on every call. The connection learns.",
  },
];

const VERSUS = [
  { k: "vs MCP",          v: "MCP discovers tools. Interlink discovers, authorizes, executes — and proves it." },
  { k: "vs REST API",     v: "An API is a stateless call. Interlink is a governed relationship with trust + evidence." },
  { k: "vs API Gateway",  v: "Gateways do auth + rate limits. Interlink adds policy composition, safety, and proof." },
  { k: "vs Service Mesh", v: "A mesh moves bytes with mTLS. Interlink moves capability with accountability." },
];

function MetricBadge({ label, value, tone }: { label: string; value: number | string | undefined; tone: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-center">
      <div className={`text-lg font-mono font-semibold ${tone}`}>{value ?? "—"}</div>
      <div className="font-mono text-[9px] uppercase tracking-wider text-white/30 mt-0.5">{label}</div>
    </div>
  );
}

function OverviewTab({ metrics }: { metrics: any }) {
  return (
    <div className="mx-auto max-w-5xl space-y-8 py-8 px-4">
      {/* Live metrics bar */}
      {metrics && (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          <MetricBadge label="Total"       value={metrics.total}           tone="text-white" />
          <MetricBadge label="Authorized"  value={metrics.authorized}      tone="text-emerald-400" />
          <MetricBadge label="Denied"      value={metrics.denied}          tone="text-rose-400" />
          <MetricBadge label="Quarantined" value={metrics.quarantined}     tone="text-amber-400" />
          <MetricBadge label="Agents"      value={metrics.agents}          tone="text-white/70" />
          <MetricBadge label="Anomalies"   value={metrics.anomalies}       tone="text-orange-400" />
          <MetricBadge label="Open Q"      value={metrics.quarantine_open} tone="text-amber-300" />
          <MetricBadge label="Authz %"     value={metrics.authorized_rate ? `${metrics.authorized_rate}%` : undefined} tone="text-emerald-300" />
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] px-8 py-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-white/40">
              Interlink cAPI · Governed Connection Layer · LIVE
            </span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            The connection is the <span className="text-emerald-400">asset</span>.
          </h1>
          <p className="mt-4 max-w-2xl text-white/60 text-sm leading-relaxed">
            One call that discovers, authorizes, executes, proves, and learns.
            Interlink does what MCP and REST APIs can't — governed, proven, and self-improving.
          </p>

          {/* 9-phase pipeline strip */}
          <div className="mt-8 flex flex-wrap gap-2">
            {PHASES.map((p, i) => (
              <div key={p} className="flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] text-white/70">
                  <span className="mr-1.5 text-emerald-400">{i + 1}.</span>{p}
                </span>
                {i < PHASES.length - 1 && <span className="text-white/20 text-xs">→</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Four pillars */}
      <div className="grid gap-4 sm:grid-cols-2">
        {PILLARS.map((u) => (
          <div key={u.title} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <div className="text-sm font-semibold text-white mb-1">{u.title}</div>
            <p className="text-xs text-white/50 leading-relaxed">{u.body}</p>
          </div>
        ))}
      </div>

      {/* Versus table */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/30 mb-4">
          Interlink cAPI vs.
        </div>
        <div className="space-y-3">
          {VERSUS.map((v) => (
            <div key={v.k} className="flex gap-4">
              <span className="w-36 shrink-0 font-mono text-[11px] text-emerald-400">{v.k}</span>
              <span className="text-xs text-white/60">{v.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function InterlinkPage() {
  const [tab, setTab] = useState("overview");
  const { data } = useInterlinkLive();

  // ── Governance Portal State ──
  const [govAgents, setGovAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [govCapabilities] = useState<Capability[]>(INITIAL_CAPABILITIES);
  const [govPolicies, setGovPolicies] = useState<Policy[]>(INITIAL_POLICIES);
  const [govLedger, setGovLedger] = useState<Evidence[]>(INITIAL_LEDGER);
  const [activeScenarioId, setActiveScenarioId] = useState<string>("scen-standard");
  const [govQuarantine, setGovQuarantine] = useState<QuarantinedTicket[]>([
    {
      ticketId: "TKT-992A-SEC",
      connectionId: "conn_preset_94fd23a",
      agentId: "agent-db-sync",
      agentName: "SynclonObsoleteAgent",
      capabilityId: "db-delete",
      capabilityName: "DatabaseDeleter",
      timestamp: "2026-06-16T03:00:00-07:00",
      anomalies: [
        "Cascading database truncation requires elevated quorum consensus",
        "Temporal warning: Action triggered outside normal operating hours (3:00 AM local)",
        "Budget advisory: synclon-agent has depleted 98% of credit boundaries",
      ],
      approvalsCollected: [],
      status: "pending",
      inputArgs: { recordId: "audit_archive_2020", confirm: true },
    },
  ]);

  // Toggle active agent status
  const handleToggleAgentStatus = (agentId: string) => {
    setGovAgents((prev) =>
      prev.map((agent) => {
        if (agent.id === agentId) {
          const nextStatus = agent.status === "active" ? "suspended" : "active";
          return { ...agent, status: nextStatus };
        }
        return agent;
      })
    );
  };

  // Add agent
  const handleAddAgent = (newAgent: Agent) => {
    setGovAgents((prev) => [...prev, newAgent]);
  };

  // Reset system simulated state
  const handleResetSystem = () => {
    setGovAgents(INITIAL_AGENTS.map((a) => ({ ...a })));
    setGovPolicies(INITIAL_POLICIES.map((p) => ({ ...p, rules: [...p.rules] })));
    setGovLedger(INITIAL_LEDGER.map((l) => ({ ...l })));
    setGovQuarantine([
      {
        ticketId: "TKT-992A-SEC",
        connectionId: "conn_preset_94fd23a",
        agentId: "agent-db-sync",
        agentName: "SynclonObsoleteAgent",
        capabilityId: "db-delete",
        capabilityName: "DatabaseDeleter",
        timestamp: "2026-06-16T03:00:00-07:00",
        anomalies: [
          "Cascading database truncation requires elevated quorum consensus",
          "Temporal warning: Action triggered outside normal operating hours (3:00 AM local)",
          "Budget advisory: synclon-agent has depleted 98% of credit boundaries",
        ],
        approvalsCollected: [],
        status: "pending",
        inputArgs: { recordId: "audit_archive_2020", confirm: true },
      },
    ]);
    setActiveScenarioId("scen-standard");
  };

  // Dynamic success/credits callback when pipeline simulation ends successfully
  const handleSimulationSuccess = (res: SimulationResult) => {
    if (res.status === "authorized" && res.evidence) {
      setGovLedger((prev) => [res.evidence!, ...prev]);
      setGovAgents((prev) =>
        prev.map((agent) => {
          if (agent.id === res.agentId) {
            const expense = res.evidence?.what.capabilityId === "db-read" ? 8 : 5;
            return {
              ...agent,
              trustScore: Math.min(100, agent.trustScore + 2),
              budgetUsed: Math.min(agent.budgetLimit, agent.budgetUsed + expense),
              consecutiveAnomalies: 0,
            };
          }
          return agent;
        })
      );
    } else if (res.status === "quarantined" && res.quarantinedTicket) {
      setGovQuarantine((prev) => {
        if (prev.some((t) => t.ticketId === res.quarantinedTicket?.ticketId)) return prev;
        return [res.quarantinedTicket!, ...prev];
      });
      setGovAgents((prev) =>
        prev.map((agent) => {
          if (agent.id === res.agentId) {
            return {
              ...agent,
              trustScore: Math.max(0, agent.trustScore - 15),
              anomalyCount: agent.anomalyCount + 1,
              consecutiveAnomalies: agent.consecutiveAnomalies + 1,
            };
          }
          return agent;
        })
      );
    } else if (res.status === "denied") {
      setGovAgents((prev) =>
        prev.map((agent) => {
          if (agent.id === res.agentId) {
            const anomalyBonus = res.capabilityId === "search" ? 1 : 0;
            return {
              ...agent,
              trustScore: Math.max(0, agent.trustScore - 10),
              anomalyCount: agent.anomalyCount + anomalyBonus,
              consecutiveAnomalies: agent.consecutiveAnomalies + anomalyBonus,
            };
          }
          return agent;
        })
      );
    }
  };

  // Human Board multi-sig approved quarantine ticket execution
  const handleApproveQuarantineTicket = (
    ticketId: string,
    updatedTicket: QuarantinedTicket,
    newEvidence: Evidence
  ) => {
    setGovQuarantine((prev) => prev.filter((t) => t.ticketId !== ticketId));
    setGovLedger((prev) => [newEvidence, ...prev]);
    setGovAgents((prev) =>
      prev.map((agent) => {
        if (agent.id === updatedTicket.agentId) {
          const usageIncrease = updatedTicket.capabilityId === "db-delete" ? 50 : 200;
          return {
            ...agent,
            budgetUsed: Math.min(agent.budgetLimit, agent.budgetUsed + usageIncrease),
            trustScore: Math.max(0, agent.trustScore - 5),
          };
        }
        return agent;
      })
    );
  };

  const handleDenyQuarantineTicket = (ticketId: string) => {
    setGovQuarantine((prev) => prev.filter((t) => t.ticketId !== ticketId));
  };

  // Add policy rule rule exception helper
  const handleAddPolicyRule = (policyId: string, rule: PolicyRule) => {
    setGovPolicies((prev) =>
      prev.map((policy) => {
        if (policy.id === policyId) {
          return {
            ...policy,
            rules: [...policy.rules, rule],
          };
        }
        return policy;
      })
    );
  };

  const handleAppendLedgerBlock = (block: Evidence) => {
    setGovLedger((prev) => [block, ...prev]);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/30 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10">
            <Radio size={16} className="text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Interlink cAPI</div>
            <div className="font-mono text-[10px] text-white/30 uppercase tracking-widest">
              Governed Connection Layer · 9-Phase Execution Pipeline
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-wider">
              {data ? "Live" : "Connecting…"}
            </span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mt-4 flex gap-1 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition ${
                  active
                    ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-400"
                    : "border-transparent text-white/40 hover:border-white/10 hover:text-white/70"
                }`}
              >
                <Icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "overview" && <OverviewTab metrics={data?.metrics} />}

        {tab === "dashboard" && (
          <div className="p-4">
            <GovDashboard
              agents={govAgents}
              capabilities={govCapabilities}
              quarantineTickets={govQuarantine}
              ledger={govLedger}
              onToggleAgentStatus={handleToggleAgentStatus}
              onResetSystem={handleResetSystem}
              onSelectTab={(newTab) => {
                if (newTab === "visualizer") setTab("pipeline");
                else if (newTab === "policies") setTab("policies");
                else if (newTab === "quarantine") setTab("quarantine");
                else if (newTab === "ledger") setTab("ledger");
              }}
              onAddAgent={handleAddAgent}
            />
          </div>
        )}

        {tab === "pipeline" && (
          <div className="p-4">
            <PipelineVisualizer
              agents={govAgents}
              capabilities={govCapabilities}
              onSimulationSuccess={handleSimulationSuccess}
              onSelectTab={(newTab) => {
                if (newTab === "ledger") setTab("ledger");
                else if (newTab === "quarantine") setTab("quarantine");
              }}
            />
          </div>
        )}

        {tab === "policies" && (
          <div className="p-4">
            <PolicyManager
              agents={govAgents}
              capabilities={govCapabilities}
              policies={govPolicies}
              onAddPolicyRule={handleAddPolicyRule}
            />
          </div>
        )}

        {tab === "ledger" && (
          <div className="p-4">
            <LedgerExplorer
              ledger={govLedger}
            />
          </div>
        )}

        {tab === "safety" && (
          <div className="p-4">
            <div className="mx-auto max-w-4xl space-y-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/30">Safety · Anomalies &amp; Quorum</div>
              <h2 className="text-2xl font-semibold text-white">Breach prevention, in the loop</h2>
              <p className="text-sm text-white/50">
                Behavioral baselines flag deviations in real time. High-severity calls are quarantined
                and held until an M-of-N human quorum signs off.
              </p>
              {data?.anomalies?.length ? (
                <div className="space-y-2">
                  {data.anomalies.slice(0, 20).map((a: any, i: number) => (
                    <div key={i} className="rounded-lg border border-white/10 bg-white/[0.02] p-3 font-mono text-xs text-white/60">
                      <span className="text-orange-400 mr-2">[{a.severity?.toUpperCase() ?? "INFO"}]</span>
                      {a.agent_id} — {a.description ?? JSON.stringify(a)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-white/30">
                  No anomalies detected — or backend Interlink endpoint not yet active.
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "agents" && (
          <div className="p-4">
            <div className="mx-auto max-w-4xl space-y-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/30">Agents · Trust &amp; Risk</div>
              <h2 className="text-2xl font-semibold text-white">The fleet, scored continuously</h2>
              {data?.agents?.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {data.agents.map((a: any) => (
                    <div key={a.identity?.agent_id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="text-sm font-semibold text-white">{a.identity?.agent_name}</div>
                      <div className="font-mono text-[10px] text-white/30 mt-0.5">{a.identity?.agent_id}</div>
                      <div className="mt-2 flex gap-3">
                        <span className="font-mono text-[11px] text-emerald-400">Trust: {a.trust?.score ?? "—"}</span>
                        <span className="font-mono text-[11px] text-amber-400">Risk: {a.risk?.threat_level ?? "—"}</span>
                        {a.suspended && <span className="font-mono text-[11px] text-rose-400">SUSPENDED</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-white/30">
                  No agent data — backend Interlink endpoint may not be active yet.
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "registry" && (
          <div className="p-4">
            <div className="mx-auto max-w-4xl space-y-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/30">Capability Registry</div>
              <h2 className="text-2xl font-semibold text-white">What can this agent do — right now?</h2>
              {data?.capabilities?.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {data.capabilities.map((c: any) => (
                    <div key={c.capability_id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="text-sm font-semibold text-white">{c.capability_name}</div>
                      <div className="font-mono text-[10px] text-white/30">{c.capability_id}</div>
                      <div className="mt-1 font-mono text-[10px] text-white/40">{c.metadata?.category} · {c.metadata?.cost}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-white/30">
                  No capability data — backend Interlink endpoint may not be active yet.
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "quarantine" && (
          <div className="p-4">
            <QuarantineCenter
              tickets={govQuarantine}
              onApproveTicket={handleApproveQuarantineTicket}
              onDenyTicket={handleDenyQuarantineTicket}
              onAppendLedgerBlock={handleAppendLedgerBlock}
            />
          </div>
        )}
      </div>
    </div>
  );
}
