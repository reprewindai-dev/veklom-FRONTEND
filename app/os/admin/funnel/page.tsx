"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CircleDot, RefreshCw, ShieldAlert } from "lucide-react";
import { getToken } from "@/lib/api";

type Step = {
  key: string;
  label: string;
  unit: "sessions" | "accounts";
  count: number;
  conversion_from_previous: number | null;
  drop_from_previous: number | null;
  conversion_from_first: number | null;
  definition: string;
};

type BounceRow = { sessions: number; bounced: number; bounce_rate: number | null; landing_path?: string; referrer?: string };

type FunnelResponse = {
  window: { from: string; to: string; host: string | null };
  generated_at: string;
  steps: Step[];
  bounce: {
    sessions: number;
    bounced: number;
    bounce_rate: number | null;
    by_landing_page: BounceRow[];
    by_referrer: BounceRow[];
  };
  session_events: Record<string, number>;
  aggregate_page_views: { total: number; by_host: Record<string, number> };
  linked_sessions: number;
  notes: string[];
};

const HOSTS = [
  ["", "All hosts"],
  ["veklom.com", "veklom.com"],
  ["os", "Capability OS"],
  ["vlink", "VLink"],
] as const;

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

function pct(v: number | null | undefined, digits = 1) {
  return v === null || v === undefined ? "—" : `${(v * 100).toFixed(digits)}%`;
}

function StepBar({ step, max }: { step: Step; max: number }) {
  const width = max > 0 ? Math.max(step.count > 0 ? 1.5 : 0, (step.count / max) * 100) : 0;
  return (
    <div className="grid grid-cols-[minmax(150px,220px)_1fr_auto] items-center gap-4 py-2.5" title={step.definition}>
      <div className="min-w-0">
        <div className="truncate text-sm text-cos-text">{step.label}</div>
        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-cos-steel">{step.unit}</div>
      </div>
      <div className="h-7 overflow-hidden rounded-md border border-cos-border bg-cos-bg/40">
        <div className="h-full rounded-md bg-cos-accent/70 transition-[width] duration-500" style={{ width: `${width}%` }} />
      </div>
      <div className="w-36 text-right">
        <div className="font-mono text-sm font-semibold text-cos-text">{step.count.toLocaleString()}</div>
        <div className="font-mono text-[10px] text-cos-muted">{pct(step.conversion_from_first)} of first</div>
      </div>
    </div>
  );
}

function Drop({ step }: { step: Step }) {
  if (step.drop_from_previous === null) {
    return <div className="py-0.5 pl-[calc(min(220px,40%)+1rem)] font-mono text-[10px] text-cos-steel">↓ no previous count</div>;
  }
  const drop = step.drop_from_previous;
  const tone = drop >= 0.7 ? "text-cos-danger" : drop >= 0.4 ? "text-cos-warn" : "text-cos-verified";
  return (
    <div className="py-0.5 pl-[calc(min(220px,40%)+1rem)] font-mono text-[10px]">
      <span className={tone}>↓ {drop >= 0 ? `−${pct(drop)} drop` : `+${pct(-drop)} (more than previous step)`}</span>
      <span className="text-cos-steel"> · {pct(step.conversion_from_previous)} continue</span>
    </div>
  );
}

function BounceTable({ title, rows, keyName }: { title: string; rows: BounceRow[]; keyName: "landing_path" | "referrer" }) {
  return (
    <div className="rounded-2xl border border-cos-border bg-cos-surface2/70 p-5 shadow-cos-card">
      <h2 className="text-sm font-semibold text-cos-text">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-xs text-cos-muted">No sessions in this window.</p>
      ) : (
        <table className="mt-3 w-full table-fixed text-left">
          <thead>
            <tr className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">
              <th className="w-1/2 pb-2 font-normal">{keyName === "landing_path" ? "Landing page" : "Referrer"}</th>
              <th className="pb-2 text-right font-normal">Sessions</th>
              <th className="pb-2 text-right font-normal">Bounced</th>
              <th className="pb-2 text-right font-normal">Bounce</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r[keyName])} className="border-t border-cos-border/60 font-mono text-xs text-cos-text">
                <td className="truncate py-1.5 pr-2" title={String(r[keyName])}>{r[keyName]}</td>
                <td className="py-1.5 text-right">{r.sessions}</td>
                <td className="py-1.5 text-right">{r.bounced}</td>
                <td className={`py-1.5 text-right ${(r.bounce_rate ?? 0) >= 0.7 ? "text-cos-danger" : ""}`}>{pct(r.bounce_rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function FunnelPage() {
  const today = useMemo(() => new Date(), []);
  const [from, setFrom] = useState(isoDay(new Date(today.getTime() - 29 * 86_400_000)));
  const [to, setTo] = useState(isoDay(today));
  const [host, setHost] = useState("");
  const [data, setData] = useState<FunnelResponse | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "signed-out" | "forbidden" | "error">("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    setError("");
    // Plain fetch: the shared api() helper redirects on 401/403, but this page
    // should explain the admin gate in place.
    const token = getToken();
    if (!token) {
      setState("signed-out");
      return;
    }
    const params = new URLSearchParams({ from, to });
    if (host) params.set("host", host);
    try {
      const res = await fetch(`/api/v1/analytics/funnel?${params.toString()}`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        cache: "no-store",
        credentials: "omit",
      });
      if (res.status === 401) return setState("signed-out");
      if (res.status === 403) return setState("forbidden");
      const body = await res.json().catch(() => null);
      if (!res.ok || !body) {
        setState("error");
        setError(body?.error?.message || body?.detail || `HTTP ${res.status}`);
        return;
      }
      setData(body as FunnelResponse);
      setState("ready");
    } catch (cause) {
      setState("error");
      setError(cause instanceof Error ? cause.message : "Funnel request failed");
    }
  }, [from, to, host]);

  useEffect(() => {
    void load();
  }, [load]);

  const sessionSteps = data?.steps.filter((s) => s.unit === "sessions") ?? [];
  const accountSteps = data?.steps.filter((s) => s.unit === "accounts") ?? [];
  const sessionMax = Math.max(0, ...sessionSteps.map((s) => s.count));
  const accountMax = Math.max(0, ...accountSteps.map((s) => s.count));

  return (
    <section className="mx-auto max-w-[1500px] px-5 py-8 lg:px-10 lg:py-10">
      <header className="mb-8 flex flex-col gap-6 rounded-2xl border border-cos-border bg-cos-surface2/70 p-5 shadow-cos-card md:flex-row md:items-end md:justify-between lg:p-7">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-cos-accent"><CircleDot size={13} /> Admin · first-party analytics</div>
          <h1 className="text-3xl font-semibold tracking-tight text-cos-text md:text-4xl">Visitor funnel</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-cos-muted">Where visitors drop off, from first page view to a converted workspace. Cookieless and anonymous before sign-in; hover a step for its exact definition.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-[10px] font-mono uppercase tracking-[0.14em] text-cos-steel">From
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="mt-1 block rounded-lg border border-cos-border bg-cos-bg px-3 py-2 font-mono text-xs text-cos-text" />
          </label>
          <label className="text-[10px] font-mono uppercase tracking-[0.14em] text-cos-steel">To
            <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="mt-1 block rounded-lg border border-cos-border bg-cos-bg px-3 py-2 font-mono text-xs text-cos-text" />
          </label>
          <label className="text-[10px] font-mono uppercase tracking-[0.14em] text-cos-steel">Host
            <select value={host} onChange={(e) => setHost(e.target.value)} className="mt-1 block rounded-lg border border-cos-border bg-cos-bg px-3 py-2 font-mono text-xs text-cos-text">
              {HOSTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border border-cos-border bg-cos-surface px-4 py-2 text-xs font-semibold text-cos-text hover:border-cos-accent/40">
            <RefreshCw size={13} className={state === "loading" ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </header>

      {state === "signed-out" && (
        <div className="rounded-2xl border border-cos-border bg-cos-surface2/70 p-6 text-sm text-cos-text">
          Sign in with an administrator account to view the funnel. <Link href="/login?returnTo=%2Fos%2Fadmin%2Ffunnel%2F" className="text-cos-accent underline underline-offset-4">Sign in</Link>
        </div>
      )}
      {state === "forbidden" && (
        <div className="flex items-start gap-3 rounded-2xl border border-cos-danger/30 bg-cos-danger/5 p-6 text-sm text-cos-text">
          <ShieldAlert size={18} className="mt-0.5 text-cos-danger" /> Admin access required. The identity service refused this account for funnel analytics.
        </div>
      )}
      {state === "error" && (
        <div className="rounded-2xl border border-cos-warn/40 bg-cos-warn/5 p-6 font-mono text-xs text-cos-warn">{error}</div>
      )}

      {data && (state === "ready" || state === "loading") && (
        <div className={`space-y-4 ${state === "loading" ? "opacity-60" : ""}`}>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["Visitor sessions", data.bounce.sessions.toLocaleString()],
              ["Bounce rate", pct(data.bounce.bounce_rate)],
              ["Aggregate-only page views", data.aggregate_page_views.total.toLocaleString()],
              ["Sessions linked after sign-in", data.linked_sessions.toLocaleString()],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-cos-border bg-cos-surface p-4">
                <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-cos-steel">{label}</div>
                <div className="mt-2 font-mono text-2xl font-semibold text-cos-text">{value}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-cos-border bg-cos-surface2/70 p-5 shadow-cos-card lg:p-7">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-cos-accent">Anonymous sessions in window</h2>
            <div className="mt-3">
              {sessionSteps.map((s, i) => (
                <div key={s.key}>
                  {i > 0 && <Drop step={s} />}
                  <StepBar step={s} max={sessionMax} />
                </div>
              ))}
            </div>
            <h2 className="mt-6 border-t border-cos-border pt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-cos-accent">Accounts created in window, followed to today</h2>
            <div className="mt-3">
              {accountSteps.map((s, i) => (
                <div key={s.key}>
                  {i > 0 ? <Drop step={s} /> : (
                    <div className="py-0.5 pl-[calc(min(220px,40%)+1rem)] font-mono text-[10px] text-cos-steel">
                      ↓ {pct(s.conversion_from_previous)} of signup-started sessions (different units: sessions → accounts)
                    </div>
                  )}
                  <StepBar step={s} max={accountMax} />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <BounceTable title="Bounce by landing page" rows={data.bounce.by_landing_page} keyName="landing_path" />
            <BounceTable title="Bounce by referrer" rows={data.bounce.by_referrer} keyName="referrer" />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-cos-border bg-cos-surface2/70 p-5">
              <h2 className="text-sm font-semibold text-cos-text">Sessions reaching each event</h2>
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs">
                {Object.entries(data.session_events).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-cos-border/50 py-1 text-cos-text"><span className="text-cos-muted">{k}</span><span>{v}</span></div>
                ))}
                {Object.keys(data.session_events).length === 0 && <p className="text-cos-muted">No session events.</p>}
              </div>
              <div className="mt-4 font-mono text-[10px] text-cos-steel">
                Aggregate-only page views by host: {Object.entries(data.aggregate_page_views.by_host).map(([h, n]) => `${h} ${n}`).join(" · ") || "none"}
              </div>
            </div>
            <div className="rounded-2xl border border-cos-border bg-cos-surface2/70 p-5">
              <h2 className="text-sm font-semibold text-cos-text">How to read this</h2>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-cos-muted">
                {data.notes.map((n) => <li key={n}>· {n}</li>)}
              </ul>
              <p className="mt-4 font-mono text-[10px] text-cos-steel">Window {data.window.from} → {data.window.to} · generated {data.generated_at}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
