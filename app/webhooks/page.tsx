"use client";

import React, { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import {
  Webhook, Github, CreditCard, Mail, Plus, Trash2, TestTube,
  CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Lock, Globe, Zap
} from "lucide-react";
import { Pill, SectionCard } from "@/components/telemetry";
import clsx from "clsx";

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  secret_hint: string;
  is_active: boolean;
  last_triggered_at: string | null;
  fail_count: number;
}

interface WebhookDelivery {
  id: string;
  event: string;
  status: "success" | "failed" | "pending";
  status_code: number;
  url: string;
  delivered_at: string;
  duration_ms: number;
}

const INBOUND = [
  { label: "GitHub", icon: Github, endpoint: "/api/v1/webhooks/github", events: ["push", "pull_request", "workflow_run"], color: "#6366f1" },
  { label: "Stripe", icon: CreditCard, endpoint: "/api/v1/webhooks/stripe", events: ["payment_intent.succeeded", "invoice.paid", "customer.subscription.updated"], color: "#8b5cf6" },
  { label: "Resend", icon: Mail, endpoint: "/api/v1/webhooks/resend", events: ["email.sent", "email.bounced", "email.complained"], color: "#3b82f6" },
];

const ALL_EVENTS = [
  "workspace.member_joined",
  "workspace.member_removed",
  "api_key.created",
  "api_key.revoked",
  "budget.cap_exceeded",
  "budget.cap_warning",
  "kill_switch.activated",
  "kill_switch.deactivated",
  "inference.completed",
  "inference.failed",
  "sla.breach",
  "sla.resolved",
  "audit.entry_created",
  "pipeline.started",
  "pipeline.completed",
  "pipeline.failed",
  "deployment.succeeded",
  "deployment.failed",
  "security.alert_raised",
  "security.alert_resolved",
];

function statusIcon(s: string) {
  if (s === "success") return <CheckCircle size={12} className="text-accent-green" />;
  if (s === "failed") return <XCircle size={12} className="text-accent-red" />;
  return <Clock size={12} className="text-brand-400 animate-pulse" />;
}

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>(["budget.cap_exceeded", "kill_switch.activated"]);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, "ok" | "fail">>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [epData, dlData] = await Promise.all([
          api<{ endpoints: WebhookEndpoint[] }>("/api/v1/webhooks/endpoints").catch(() => ({ endpoints: [] })),
          api<{ deliveries: WebhookDelivery[] }>("/api/v1/webhooks/deliveries?limit=20").catch(() => ({ deliveries: [] })),
        ]);
        setEndpoints(epData?.endpoints ?? []);
        setDeliveries(dlData?.deliveries ?? []);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  async function testEndpoint(id: string) {
    setTesting(id);
    try {
      await api("/api/v1/webhooks/test", { method: "POST", body: { endpoint_id: id, event: "ping" } });
      setTestResult(prev => ({ ...prev, [id]: "ok" }));
    } catch {
      setTestResult(prev => ({ ...prev, [id]: "fail" }));
    }
    setTesting(null);
  }

  async function deleteEndpoint(id: string) {
    try {
      await api(`/api/v1/webhooks/endpoints/${id}`, { method: "DELETE" });
      setEndpoints(prev => prev.filter(e => e.id !== id));
    } catch {}
  }

  async function createEndpoint() {
    if (!newUrl) return;
    setSaving(true);
    try {
      const res = await api<WebhookEndpoint>("/api/v1/webhooks/endpoints", {
        method: "POST",
        body: { url: newUrl, events: newEvents },
      });
      setEndpoints(prev => [...prev, res]);
      setNewUrl("");
      setShowNew(false);
    } catch {}
    setSaving(false);
  }

  function toggleEvent(ev: string) {
    setNewEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]);
  }

  // Demo data when backend is empty
  const displayEndpoints = endpoints.length > 0 ? endpoints : [
    {
      id: "demo-1",
      url: "https://your-webhook-endpoint.example.com/events",
      events: ["budget.cap_exceeded", "kill_switch.activated", "sla.breach"],
      secret_hint: "whsec_...abc123",
      is_active: true,
      last_triggered_at: new Date(Date.now() - 3600000).toISOString(),
      fail_count: 0,
    },
  ];

  const displayDeliveries: WebhookDelivery[] = deliveries.length > 0 ? deliveries : [
    { id: "d1", event: "inference.completed", status: "success", status_code: 200, url: "https://your-webhook-endpoint.example.com/events", delivered_at: new Date(Date.now() - 900000).toISOString(), duration_ms: 123 },
    { id: "d2", event: "budget.cap_warning", status: "success", status_code: 200, url: "https://your-webhook-endpoint.example.com/events", delivered_at: new Date(Date.now() - 1800000).toISOString(), duration_ms: 87 },
    { id: "d3", event: "kill_switch.activated", status: "failed", status_code: 502, url: "https://your-webhook-endpoint.example.com/events", delivered_at: new Date(Date.now() - 7200000).toISOString(), duration_ms: 5000 },
  ];

  return (
    <Shell>
      <div className="space-y-6 animate-fade-up max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 border-b border-border pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded bg-brand-500/20 text-brand-400">
                <Webhook size={14} />
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-brand-400 font-bold">
                Workspace · Webhooks
              </span>
            </div>
            <h1 className="text-[28px] font-semibold tracking-tight text-gradient">Webhooks</h1>
            <p className="text-sm text-ink-400 max-w-2xl">
              Outgoing event webhooks and inbound endpoint receivers. Every delivery is HMAC-SHA256 signed.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="green" dot>{displayEndpoints.filter(e => e.is_active).length} Active</Pill>
            <button
              onClick={() => setShowNew(!showNew)}
              className="flex items-center gap-2 px-3 py-2 bg-brand-500/15 border border-brand-500/30 text-brand-300 rounded-lg text-xs font-semibold hover:bg-brand-500/25 transition"
            >
              <Plus size={13} /> Add Endpoint
            </button>
          </div>
        </div>

        {/* Inbound receivers */}
        <SectionCard label="Inbound receivers · Read-only" title="Platform Webhook Receivers">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {INBOUND.map(r => (
              <div key={r.label} className="bg-white/[0.02] border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <r.icon size={14} style={{ color: r.color }} />
                  <span className="text-sm font-semibold text-ink-100">{r.label}</span>
                  <Pill tone="green">Live</Pill>
                </div>
                <code className="text-[10px] font-mono text-brand-300 block bg-black/30 rounded px-2 py-1 mb-3 break-all">
                  {r.endpoint}
                </code>
                <div className="flex flex-wrap gap-1">
                  {r.events.map(ev => (
                    <span key={ev} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.03] border border-border text-ink-500">{ev}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Add endpoint form */}
        {showNew && (
          <SectionCard label="New outbound endpoint" title="Configure Webhook">
            <div className="space-y-4">
              <div>
                <label className="text-xs text-ink-400">Target URL</label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Globe size={14} className="text-ink-500 shrink-0" />
                  <input
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="input flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-ink-400 mb-2 block">Events to subscribe</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_EVENTS.map(ev => (
                    <button
                      key={ev}
                      onClick={() => toggleEvent(ev)}
                      className={clsx(
                        "text-[10px] font-mono px-2 py-1 rounded border transition",
                        newEvents.includes(ev)
                          ? "bg-brand-500/20 border-brand-500/40 text-brand-300"
                          : "bg-transparent border-border text-ink-500 hover:border-border-strong"
                      )}
                    >
                      {ev}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={createEndpoint}
                  disabled={saving || !newUrl}
                  className="btn btn-primary"
                >
                  {saving ? "Creating..." : <><Zap size={13} /> Create Endpoint</>}
                </button>
                <button onClick={() => setShowNew(false)} className="btn btn-ghost text-xs">Cancel</button>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Outbound endpoints */}
        <SectionCard label="Outbound endpoints" title="Your Webhook Endpoints">
          {loading ? (
            <div className="skeleton h-32 rounded-lg" />
          ) : (
            <div className="space-y-3">
              {displayEndpoints.map(ep => (
                <div key={ep.id} className="bg-white/[0.02] border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", ep.is_active ? "bg-accent-green" : "bg-ink-600")} />
                        <code className="text-xs font-mono text-ink-100 truncate">{ep.url}</code>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {ep.events.map(ev => (
                          <span key={ev} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.03] border border-border text-ink-500">{ev}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-ink-600 font-mono">
                        <Lock size={9} /> {ep.secret_hint}
                        {ep.last_triggered_at && <span>Last fired: {new Date(ep.last_triggered_at).toLocaleString()}</span>}
                        {ep.fail_count > 0 && <span className="text-accent-red">{ep.fail_count} failures</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {testResult[ep.id] === "ok" && <CheckCircle size={14} className="text-accent-green" />}
                      {testResult[ep.id] === "fail" && <XCircle size={14} className="text-accent-red" />}
                      <button
                        onClick={() => testEndpoint(ep.id)}
                        disabled={testing === ep.id}
                        className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-border hover:border-brand-500/40 text-ink-400 hover:text-brand-300 transition"
                      >
                        <TestTube size={11} /> {testing === ep.id ? "Testing..." : "Test"}
                      </button>
                      <button
                        onClick={() => deleteEndpoint(ep.id)}
                        className="p-1 text-ink-600 hover:text-accent-red transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Delivery log */}
        <SectionCard label="Delivery log · Last 20" title="Recent Deliveries">
          {loading ? (
            <div className="skeleton h-48 rounded-lg" />
          ) : (
            <div className="space-y-0">
              {displayDeliveries.map((d, i) => (
                <div
                  key={d.id}
                  className={clsx(
                    "flex items-center justify-between gap-3 py-2.5 text-xs",
                    i < displayDeliveries.length - 1 && "border-b border-border/50"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {statusIcon(d.status)}
                    <span className="font-mono text-brand-300 shrink-0">{d.event}</span>
                    <span className="text-ink-600 truncate hidden sm:block">{d.url}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-ink-500">
                    <span className={clsx("font-mono", d.status_code >= 400 ? "text-accent-red" : "text-accent-green")}>{d.status_code}</span>
                    <span>{d.duration_ms}ms</span>
                    <span className="hidden sm:block">{new Date(d.delivered_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

      </div>
    </Shell>
  );
}
