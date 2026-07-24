"use client";

import useSWR from "swr";
import {
  Info, Target, Database, FlaskConical, Gauge,
  AlertTriangle, ShieldCheck,
import type { ComponentType, ReactNode } from "react";
import useSWR from "swr";
import {
  AlertTriangle,
  Database,
  FlaskConical,
  Gauge,
  Info,
  ShieldCheck,
  Target,
} from "lucide-react";
import { fetcher } from "@/lib/api";

interface BenchmarkCardData {
  benchmark_details: {
    name: string;
    version: string | null;
    provider: string | null;
    overview: string | null;
    data_type: string;
    domains: string[];
    similar_benchmarks: string[];
    resources: { base_url: string | null; health_path: string | null };
  };
  purpose_and_users: {
    goal: string;
    audience: string[];
    tasks: string[];
    limitations: string | null;
    out_of_scope_uses: string[];
  };
  data: {
    source: string;
    sample_count: number;
    signed_sample_count: number;
    region_count: number;
    first_measured_at: string | null;
    last_measured_at: string | null;
    annotation: string;
  };
  methodology: {
    methods: string;
    metrics: string[];
    calculation: string;
    interpretation: string;
    baseline_results: string | null;
    validation: string;
  };
  performance: {
    composite_score: number;
    stability_rating: string;
    status: string;
    p50_latency_ms: number | null;
    p95_latency_ms: number | null;
    p99_latency_ms: number | null;
    error_rate_percent: number | null;
    uptime_percent: number | null;
    throughput_rps: number | null;
    trust_score: number | null;
    measured_at: string | null;
  };
  targeted_risks: {
    open_incident_count: number;
    recent_incidents: { title: string; severity: string; state: string; opened_at: string | null }[];
    risk_categories: string[];
    potential_harm: string;
  };
  compliance_and_provenance: {
    auth_scheme: string | null;
    x402_ready: boolean;
    pricing_model: string | null;
    tls_versions_observed: string[] | null;
    audit_log_entries: number;
    latest_provenance_hash: string | null;
    on_chain_anchor: string | null;
  };
}

interface CompletenessAxis {
  label: string;
  value: number;
}

function NeedsProof() {
  return (
    <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF7A00]/80 bg-[#FF7A00]/10 border border-[#FF7A00]/20 px-1.5 py-0.5 rounded">
      Needs proof
    </span>
  );
}

function hasProof(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(hasProof);
  }
  return true;
}

function sectionCompleteness(fields: unknown[]): number {
  if (fields.length === 0) return 0;
  const complete = fields.filter(hasProof).length;
  return Math.round((complete / fields.length) * 100);
}

function polygonPoints(values: number[], size: number, radius: number): string {
  const center = size / 2;
  return values
    .map((value, index) => {
      const angle = (Math.PI * 2 * index) / values.length - Math.PI / 2;
      const scaledRadius = (value / 100) * radius;
      const x = center + Math.cos(angle) * scaledRadius;
      const y = center + Math.sin(angle) * scaledRadius;
      return `${x},${y}`;
    })
    .join(" ");
}

function outerPolygonPoints(count: number, size: number, radius: number): string {
  return polygonPoints(Array(count).fill(100), size, radius);
}

function BenchmarkCardShape({ axes }: { axes: CompletenessAxis[] }) {
  const size = 320;
  const center = size / 2;
  const radius = 112;
  const values = axes.map((axis) => axis.value);
  const valuePoints = polygonPoints(values, size, radius);

  return (
    <div className="border border-[#242424] bg-[#070707] rounded-xl p-4">
      <div className="flex items-center justify-between gap-3 border-b border-[#1F1F1F] pb-3">
        <div>
          <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#FFB800]">BenchmarkCard Shape</div>
          <div className="text-xs text-[#A1A1A6]">Seven-section proof completeness</div>
        </div>
        <span className="text-[9px] font-mono border border-[#FFB800]/20 bg-[#FFB800]/10 text-[#FFB800] px-2 py-1 rounded">
          HEPTAGON
        </span>
      </div>

      <div className="relative mx-auto mt-4 aspect-square max-w-[360px]">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full overflow-visible">
          <defs>
            <radialGradient id="benchmark-card-amber-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,184,0,0.16)" />
              <stop offset="100%" stopColor="rgba(255,184,0,0)" />
            </radialGradient>
          </defs>

          {[0.25, 0.5, 0.75, 1].map((scale) => (
            <polygon
              key={scale}
              points={outerPolygonPoints(axes.length, size, radius * scale)}
              fill="none"
              stroke="rgba(255,184,0,0.16)"
              strokeWidth="1"
            />
          ))}

          {axes.map((axis, index) => {
            const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2;
            const x = center + Math.cos(angle) * radius;
            const y = center + Math.sin(angle) * radius;
            const labelRadius = radius + 34;
            const labelX = center + Math.cos(angle) * labelRadius;
            const labelY = center + Math.sin(angle) * labelRadius;
            return (
              <g key={axis.label}>
                <line
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="rgba(255,184,0,0.18)"
                  strokeWidth="1"
                  strokeDasharray="3 5"
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={labelX < center - 8 ? "end" : labelX > center + 8 ? "start" : "middle"}
                  dominantBaseline="middle"
                  className="fill-[#D6D6D8] text-[9px] font-mono"
                >
                  {axis.label}
                </text>
                <text
                  x={labelX}
                  y={labelY + 12}
                  textAnchor={labelX < center - 8 ? "end" : labelX > center + 8 ? "start" : "middle"}
                  dominantBaseline="middle"
                  className="fill-[#FFB800] text-[9px] font-mono"
                >
                  {axis.value}%
                </text>
              </g>
            );
          })}

          <polygon
            points={valuePoints}
            fill="url(#benchmark-card-amber-glow)"
            stroke="#FFB800"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {values.map((value, index) => {
            const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2;
            const scaledRadius = (value / 100) * radius;
            const x = center + Math.cos(angle) * scaledRadius;
            const y = center + Math.sin(angle) * scaledRadius;
            return <circle key={`${index}-${value}`} cx={x} cy={y} r="3.5" fill="#070707" stroke="#FFB800" strokeWidth="2" />;
          })}
        </svg>
      </div>
    </div>
  );
}

function Value({ children }: { children: ReactNode }) {
  if (children === null || children === undefined || children === "") {
    return <NeedsProof />;
  }
  return <>{children}</>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-[#6E6E73]">{label}</span>
      <span className="text-xs text-[#E6E6E9]">
        <Value>{children}</Value>
      </span>
    </div>
  );
}

function Section({
  index, title, icon: Icon, children,
}: {
  index: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  index,
  title,
  icon: Icon,
  children,
}: {
  index: number;
  title: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <section className="border border-[#1F1F1F] bg-[#080909] rounded-xl p-5 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] font-mono font-bold text-[#FFB800] bg-[#FFB800]/10 border border-[#FFB800]/20 rounded px-1.5 py-0.5">
          {String(index).padStart(2, "0")}
        </span>
        <Icon className="w-3.5 h-3.5 text-[#FFB800]" />
        <h3 className="text-xs font-bold font-mono uppercase tracking-[0.2em] text-[#A1A1A6]">{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">{children}</div>
    </section>
  );
}

export default function ApiBenchmarkCard({ apiId }: { apiId: string }) {
  const { data, error, isLoading } = useSWR<BenchmarkCardData>(
    `/api/v1/benchmarks/card/${encodeURIComponent(apiId)}`,
    fetcher,
  );

  if (isLoading) {
    return (
      <div className="border border-[#1F1F1F] bg-[#080909] rounded-xl p-6 font-mono text-xs text-[#6E6E73]">
        Loading BenchmarkCard from live VNP registry...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="border border-[#1F1F1F] bg-[#080909] rounded-xl p-6 space-y-2">
        <div className="flex items-center gap-2 text-[#FF7A00] font-mono text-xs">
          <AlertTriangle className="w-4 h-4" />
          BenchmarkCard unavailable
        </div>
        <p className="text-[11px] text-[#6E6E73] font-mono">
          This API is not registered in the VNP registry, or the card endpoint returned an error. No fabricated data is shown.
        </p>
      </div>
    );
  }

  const d = data;
  const perf = d.performance;
  const fmt = (v: number | null, suffix = "") => (v === null || v === undefined ? null : `${v}${suffix}`);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
  const completenessAxes: CompletenessAxis[] = [
    {
      label: "Details",
      value: sectionCompleteness([
        d.benchmark_details.name,
        d.benchmark_details.version,
        d.benchmark_details.provider,
        d.benchmark_details.overview,
        d.benchmark_details.data_type,
        d.benchmark_details.domains,
        d.benchmark_details.resources,
      ]),
    },
    {
      label: "Purpose",
      value: sectionCompleteness([
        d.purpose_and_users.goal,
        d.purpose_and_users.audience,
        d.purpose_and_users.tasks,
        d.purpose_and_users.limitations,
        d.purpose_and_users.out_of_scope_uses,
      ]),
    },
    {
      label: "Data",
      value: sectionCompleteness([
        d.data.source,
        d.data.sample_count,
        d.data.signed_sample_count,
        d.data.region_count,
        d.data.first_measured_at,
        d.data.last_measured_at,
        d.data.annotation,
      ]),
    },
    {
      label: "Method",
      value: sectionCompleteness([
        d.methodology.methods,
        d.methodology.metrics,
        d.methodology.calculation,
        d.methodology.interpretation,
        d.methodology.baseline_results,
        d.methodology.validation,
      ]),
    },
    {
      label: "Perf",
      value: sectionCompleteness([
        perf.composite_score,
        perf.stability_rating,
        perf.status,
        perf.p50_latency_ms,
        perf.p95_latency_ms,
        perf.p99_latency_ms,
        perf.error_rate_percent,
        perf.uptime_percent,
        perf.throughput_rps,
        perf.measured_at,
      ]),
    },
    {
      label: "Risk",
      value: sectionCompleteness([
        d.targeted_risks.open_incident_count,
        d.targeted_risks.recent_incidents,
        d.targeted_risks.risk_categories,
        d.targeted_risks.potential_harm,
      ]),
    },
    {
      label: "Proof",
      value: sectionCompleteness([
        d.compliance_and_provenance.auth_scheme,
        d.compliance_and_provenance.x402_ready,
        d.compliance_and_provenance.pricing_model,
        d.compliance_and_provenance.tls_versions_observed,
        d.compliance_and_provenance.audit_log_entries,
        d.compliance_and_provenance.latest_provenance_hash,
        d.compliance_and_provenance.on_chain_anchor,
      ]),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-bold font-mono tracking-widest text-[#6E6E73] uppercase">
          VNP BenchmarkCard
        </h2>
        <span className="text-[9px] font-mono text-[#6E6E73] uppercase tracking-widest">
          7-section standardized documentation · live registry data
        </span>
      </div>

          7-section standardized documentation - live registry data
        </span>
      </div>

      <BenchmarkCardShape axes={completenessAxes} />

      <Section index={1} title="Benchmark Details" icon={Info}>
        <Field label="Name">{d.benchmark_details.name}</Field>
        <Field label="Version">{d.benchmark_details.version}</Field>
        <Field label="Provider">{d.benchmark_details.provider}</Field>
        <Field label="Data Type">{d.benchmark_details.data_type}</Field>
        <Field label="Overview">{d.benchmark_details.overview}</Field>
        <Field label="Domains">{d.benchmark_details.domains.join(" / ")}</Field>
        <Field label="Similar APIs">
          {d.benchmark_details.similar_benchmarks.length ? d.benchmark_details.similar_benchmarks.join(", ") : null}
        </Field>
        <Field label="Resources">
          {d.benchmark_details.resources.base_url ? (
            <span className="font-mono text-[11px] break-all">
              {d.benchmark_details.resources.base_url}
              {d.benchmark_details.resources.health_path}
            </span>
          ) : null}
        </Field>
      </Section>

      <Section index={2} title="Purpose & Users" icon={Target}>
        <Field label="Goal">{d.purpose_and_users.goal}</Field>
        <Field label="Audience">{d.purpose_and_users.audience.join(" · ")}</Field>
        <Field label="Tasks">{d.purpose_and_users.tasks.join(" · ")}</Field>
        <Field label="Limitations">{d.purpose_and_users.limitations ?? "None recorded"}</Field>
        <Field label="Out-of-Scope Uses">{d.purpose_and_users.out_of_scope_uses.join(" · ")}</Field>
        <Field label="Audience">{d.purpose_and_users.audience.join(" / ")}</Field>
        <Field label="Tasks">{d.purpose_and_users.tasks.join(" / ")}</Field>
        <Field label="Limitations">{d.purpose_and_users.limitations ?? "None recorded"}</Field>
        <Field label="Out-of-Scope Uses">{d.purpose_and_users.out_of_scope_uses.join(" / ")}</Field>
      </Section>

      <Section index={3} title="Data" icon={Database}>
        <Field label="Source">{d.data.source}</Field>
        <Field label="Sample Count">{d.data.sample_count.toLocaleString()}</Field>
        <Field label="Signed Samples">{d.data.signed_sample_count.toLocaleString()}</Field>
        <Field label="Regions">{d.data.region_count}</Field>
        <Field label="First Measured">
          {d.data.first_measured_at ? new Date(d.data.first_measured_at).toLocaleString() : null}
        </Field>
        <Field label="Last Measured">
          {d.data.last_measured_at ? new Date(d.data.last_measured_at).toLocaleString() : null}
        </Field>
        <Field label="Annotation">{d.data.annotation}</Field>
      </Section>

      <Section index={4} title="Methodology" icon={FlaskConical}>
        <Field label="Methods">{d.methodology.methods}</Field>
        <Field label="Metrics">{d.methodology.metrics.join(" / ")}</Field>
        <Field label="Calculation">{d.methodology.calculation}</Field>
        <Field label="Interpretation">{d.methodology.interpretation}</Field>
        <Field label="Baseline Results">{d.methodology.baseline_results}</Field>
        <Field label="Validation">{d.methodology.validation}</Field>
      </Section>

      <Section index={5} title="Performance" icon={Gauge}>
        <Field label="Composite Score">{perf.composite_score.toFixed(1)}</Field>
        <Field label="Stability">{perf.stability_rating}</Field>
        <Field label="Status">{perf.status}</Field>
        <Field label="p50 / p95 / p99 Latency">
          {perf.p50_latency_ms !== null
            ? `${perf.p50_latency_ms}ms / ${perf.p95_latency_ms}ms / ${perf.p99_latency_ms}ms`
            : null}
        </Field>
        <Field label="Error Rate">{fmt(perf.error_rate_percent, "%")}</Field>
        <Field label="Uptime">{fmt(perf.uptime_percent, "%")}</Field>
        <Field label="Throughput">{fmt(perf.throughput_rps, " rps")}</Field>
        <Field label="Measured At">
          {perf.measured_at ? new Date(perf.measured_at).toLocaleString() : null}
        </Field>
      </Section>

      <Section index={6} title="Targeted Risks" icon={AlertTriangle}>
        <Field label="Open Incidents">{d.targeted_risks.open_incident_count}</Field>
        <Field label="Risk Categories">{d.targeted_risks.risk_categories.join(" · ")}</Field>
        <Field label="Risk Categories">{d.targeted_risks.risk_categories.join(" / ")}</Field>
        <Field label="Potential Harm">{d.targeted_risks.potential_harm}</Field>
        <Field label="Recent Incidents">
          {d.targeted_risks.recent_incidents.length ? (
            <span className="space-y-1 block">
              {d.targeted_risks.recent_incidents.map((i, idx) => (
                <span key={idx} className="block text-[11px]">
                  <span className="text-[#FF7A00]">[{i.severity}]</span> {i.title} — {i.state}
              {d.targeted_risks.recent_incidents.map((incident, idx) => (
                <span key={`${incident.title}-${idx}`} className="block text-[11px]">
                  <span className="text-[#FF7A00]">[{incident.severity}]</span> {incident.title} - {incident.state}
                </span>
              ))}
            </span>
          ) : (
            "None recorded"
          )}
        </Field>
      </Section>

      <Section index={7} title="Compliance & Provenance" icon={ShieldCheck}>
        <Field label="Auth Scheme">{d.compliance_and_provenance.auth_scheme}</Field>
        <Field label="x402 Ready">{d.compliance_and_provenance.x402_ready ? "Yes" : "No"}</Field>
        <Field label="Pricing Model">{d.compliance_and_provenance.pricing_model}</Field>
        <Field label="TLS Versions Observed">
          {d.compliance_and_provenance.tls_versions_observed?.join(", ") ?? null}
        </Field>
        <Field label="Audit Log Entries">{d.compliance_and_provenance.audit_log_entries.toLocaleString()}</Field>
        <Field label="Latest Provenance Hash">
          {d.compliance_and_provenance.latest_provenance_hash ? (
            <span className="font-mono text-[10px] break-all">{d.compliance_and_provenance.latest_provenance_hash}</span>
          ) : null}
        </Field>
        <Field label="On-Chain Anchor">
          {d.compliance_and_provenance.on_chain_anchor ? (
            <span className="font-mono text-[10px] break-all">{d.compliance_and_provenance.on_chain_anchor}</span>
          ) : null}
        </Field>
      </Section>
    </div>
  );
}
