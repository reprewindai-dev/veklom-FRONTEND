"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ShieldCheck, RefreshCw, Server } from "lucide-react";
import {
  TOPOLOGY_ENDPOINT,
  CANONICAL_TOPOLOGY_URL,
  formatFreshness,
  formatTimestamp,
  nodeConnectivityState,
  proofStateClasses,
  type ProofState,
  type VnpTopology,
  type VnpTopologyNode,
  type VnpTopologyResponse,
} from "@/lib/vnp-topology";

interface UptimeResult {
  available: boolean;
  source: string;
  reason?: string;
  data?: unknown;
}

interface HealthResult {
  status?: string;
  version?: string;
  service?: string;
  timestamp?: string;
}

function ProofPill({ state }: { state: ProofState }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${proofStateClasses(
        state
      )}`}
    >
      {state}
    </span>
  );
}

function StatusRow({
  title,
  state,
  value,
  basis,
  window: measurementWindow,
  detail,
}: {
  title: string;
  state: ProofState;
  value: string;
  basis: string;
  window: string;
  detail?: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <ProofPill state={state} />
      </div>
      <div className="text-2xl font-mono text-white mb-3">{value}</div>
      {detail && <p className="text-sm text-gray-400 leading-relaxed mb-3">{detail}</p>}
      <dl className="text-xs text-gray-500 space-y-1 font-mono">
        <div className="flex gap-2">
          <dt className="text-gray-600 uppercase tracking-wider shrink-0">Basis</dt>
          <dd className="text-gray-400 break-all">{basis}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-gray-600 uppercase tracking-wider shrink-0">Window</dt>
          <dd className="text-gray-400">{measurementWindow}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function StatusPage() {
  const [topology, setTopology] = useState<VnpTopology | null>(null);
  const [topologyOk, setTopologyOk] = useState<boolean | null>(null);
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [uptime, setUptime] = useState<UptimeResult | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    // Service health + topology + credentialed uptime, all read independently
    // so one failing source never masks another.
    const [topoRes, healthRes, uptimeRes] = await Promise.allSettled([
      fetch(TOPOLOGY_ENDPOINT, { cache: "no-store" }),
      fetch("/api/health", { cache: "no-store" }),
      fetch("/api/vnp/status-uptime", { cache: "no-store" }),
    ]);

    if (topoRes.status === "fulfilled" && topoRes.value.ok) {
      try {
        const json: VnpTopologyResponse = await topoRes.value.json();
        setTopology(json.topology ?? null);
        setTopologyOk(Boolean(json.topology));
      } catch {
        setTopology(null);
        setTopologyOk(false);
      }
    } else {
      setTopology(null);
      setTopologyOk(false);
    }

    if (healthRes.status === "fulfilled" && healthRes.value.ok) {
      try {
        setHealth(await healthRes.value.json());
        setHealthOk(true);
      } catch {
        setHealth(null);
        setHealthOk(false);
      }
    } else {
      setHealth(null);
      setHealthOk(false);
    }

    if (uptimeRes.status === "fulfilled" && uptimeRes.value.ok) {
      try {
        setUptime(await uptimeRes.value.json());
      } catch {
        setUptime(null);
      }
    } else {
      setUptime(null);
    }

    setUpdatedAt(new Date().toISOString());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  const nodes: VnpTopologyNode[] = topology?.nodes ?? [];
  const expected = topology?.expectedNodes ?? 5;
  const registered = topology?.registeredNodes ?? nodes.length;
  const connected =
    topology?.activeNodes ??
    nodes.filter((n) => (n.status_str ?? "").toLowerCase() === "connected").length;

  // ── Row: Service health ────────────────────────────────────────────────────
  const healthState: ProofState =
    healthOk === null ? "Unknown" : healthOk && health?.status ? "Present" : "Needs proof";
  const healthValue =
    healthOk && health?.status ? String(health.status) : healthOk === false ? "Unreachable" : "…";
  const healthDetail =
    healthOk && health
      ? `Backend reports service "${health.service ?? "unknown"}" version ${
          health.version ?? "unknown"
        }. This reflects the reported process state, not an availability guarantee.`
      : "The service health endpoint did not return a healthy status.";

  // ── Row: VNP node telemetry ────────────────────────────────────────────────
  const telemetryState: ProofState =
    topologyOk === null
      ? "Unknown"
      : topologyOk === false
      ? "Needs proof"
      : connected >= expected && expected > 0
      ? "Present"
      : "Needs proof";
  const telemetryValue =
    topologyOk === false
      ? "Source unavailable"
      : `${connected}/${expected} connected · ${registered}/${expected} registered`;
  const telemetryDetail =
    topologyOk === false
      ? "The canonical beacon topology endpoint could not be read."
      : connected === 0
      ? "All registered nodes are reporting a non-connected state with stale heartbeats. No node is currently live."
      : "Connectivity is derived from each node's returned status and heartbeat freshness, not from the presence of historical observations.";

  // ── Row: API uptime window ─────────────────────────────────────────────────
  const uptimeState: ProofState = uptime?.available ? "Present" : "Needs proof";
  const uptimeValue = uptime?.available ? JSON.stringify(uptime.data) : "No public-safe evidence";
  const uptimeBasis = `${uptime?.source ?? "GET /api/v1/platform/uptime"} (read server-side via /api/vnp/status-uptime)`;
  const uptimeDetail = uptime?.available
    ? "Uptime window read through a server-side route handler that holds credentials; no credentials are exposed to the browser."
    : uptime?.reason ??
      "Requires authenticated BYOS credentials; no public-safe credentialed source is available.";

  // ── Row: Process uptime ────────────────────────────────────────────────────
  // /api/health does not expose a process-uptime counter, so we do not invent one.
  const processState: ProofState = "Needs proof";
  const processValue = "Not exposed";
  const processDetail =
    "The service health endpoint does not return a process-uptime counter, so no uptime duration can be shown without fabrication.";

  const updatedLabel = updatedAt ? formatTimestamp(updatedAt) : "…";

  return (
    <div className="space-y-12 pb-24">
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <h1 className="text-4xl font-extrabold tracking-tight">Network Status &amp; Evidence</h1>
          <button
            onClick={() => refresh()}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
        <p className="text-xl text-gray-400 leading-relaxed mb-2">
          Every claim below shows only what the backend actually returned, with its source and
          measurement window. Where evidence is absent, the row reads{" "}
          <span className="text-amber-300 font-semibold">Needs proof</span> rather than a
          fabricated uptime or &ldquo;Connected&rdquo; label.
        </p>
        <p className="text-sm text-gray-500 font-mono">
          updated_at: {updatedLabel} · source: {CANONICAL_TOPOLOGY_URL}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <StatusRow
          title="Service health"
          state={healthState}
          value={healthValue}
          basis="GET /api/health"
          window="Point-in-time (last fetch)"
          detail={healthDetail}
        />
        <StatusRow
          title="VNP node telemetry"
          state={telemetryState}
          value={telemetryValue}
          basis={`GET ${TOPOLOGY_ENDPOINT} (topology.nodes)`}
          window="Point-in-time (last fetch)"
          detail={telemetryDetail}
        />
        <StatusRow
          title="API uptime window"
          state={uptimeState}
          value={uptimeValue}
          basis={uptimeBasis}
          window={uptime?.available ? "As reported by upstream" : "n/a — source unavailable"}
          detail={uptimeDetail}
        />
        <StatusRow
          title="Process uptime"
          state={processState}
          value={processValue}
          basis="GET /api/health (no uptime field)"
          window="n/a — not measured"
          detail={processDetail}
        />
      </div>

      {/* Per-node telemetry table — the raw evidence behind the telemetry row */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Server className="w-6 h-6 text-[#FFB800]" />
          <h2 className="text-2xl font-bold">Per-node telemetry</h2>
        </div>
        {topologyOk === false ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-gray-400">
            The canonical beacon topology endpoint could not be read. No node evidence is available.
          </div>
        ) : nodes.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-gray-400">
            {loading ? "Loading node telemetry…" : "The topology response returned no nodes."}
          </div>
        ) : (
          <div className="space-y-4">
            {nodes.map((node) => {
              const conn = nodeConnectivityState(node);
              return (
                <div
                  key={node.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{node.name}</h3>
                      <p className="text-sm text-gray-400">
                        {node.physicalLocation ?? node.region} · {node.region}
                      </p>
                    </div>
                    <div className="text-right">
                      <ProofPill state={conn.state} />
                      <p className="text-xs text-gray-500 mt-1">{conn.reason}</p>
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm font-mono">
                    <div>
                      <dt className="text-gray-600 text-xs uppercase tracking-wider">Registration</dt>
                      <dd className="text-gray-200">{node.registrationStatus ?? "unknown"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600 text-xs uppercase tracking-wider">Active keys</dt>
                      <dd className="text-gray-200">{node.activeKeyCount ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600 text-xs uppercase tracking-wider">
                        Operational status
                      </dt>
                      <dd className="text-gray-200">
                        {node.status_str ?? "—"}
                        {node.status ? ` (${node.status})` : ""}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-600 text-xs uppercase tracking-wider">Heartbeat</dt>
                      <dd className="text-gray-200">
                        {formatFreshness(node.heartbeatFreshnessSeconds)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-600 text-xs uppercase tracking-wider">Observations</dt>
                      <dd className="text-gray-200">
                        {typeof node.observationCount === "number"
                          ? node.observationCount.toLocaleString()
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-600 text-xs uppercase tracking-wider">
                        Last observation
                      </dt>
                      <dd className="text-gray-200">{formatTimestamp(node.lastObservation)}</dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="bg-white/5 border border-white/10 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="w-6 h-6 text-[#FFB800]" />
          <h3 className="text-xl font-bold">How to read this page</h3>
        </div>
        <p className="text-gray-400 leading-relaxed">
          A badge is not proof. <span className="text-emerald-300 font-semibold">Present</span> means
          the backend returned the stated evidence at fetch time;{" "}
          <span className="text-amber-300 font-semibold">Needs proof</span> means the required
          evidence was absent or the source was unreachable. Node connectivity is derived from each
          node&rsquo;s returned status and heartbeat freshness, never from the existence of a node
          record or a nonzero observation count.
        </p>
      </div>
    </div>
  );
}
