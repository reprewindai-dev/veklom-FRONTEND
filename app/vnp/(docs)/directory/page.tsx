"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, Cpu, Wallet } from "lucide-react";
import { proofStateClasses, type ProofState } from "@/lib/vnp-topology";

interface RealtimeMetric {
  latency_ms?: number;
  is_up?: boolean;
  measured_at?: string;
}

interface RealtimeDirectoryResponse {
  realtime_metrics?: Record<string, RealtimeMetric>;
  updated_at?: string;
}

interface DirectoryApi {
  id: string;
  name: string;
}

interface DirectoryCategory {
  title: string;
  icon: typeof Cpu;
  apis: DirectoryApi[];
}

// Candidate Tier-1 APIs the VNP mesh targets. Presence in this list is NOT a
// claim that the API is live or scored — probe evidence is shown only when the
// realtime source actually returns it.
const CATEGORIES: DirectoryCategory[] = [
  {
    title: "AI Infrastructure",
    icon: Cpu,
    apis: [
      { id: "openai", name: "OpenAI API" },
      { id: "anthropic", name: "Anthropic API" },
    ],
  },
  {
    title: "Financial & Web3",
    icon: Wallet,
    apis: [{ id: "stripe", name: "Stripe API" }],
  },
];

const REALTIME_ENDPOINT = "/api/v1/vnp/directory/realtime";

function ProofPill({ state }: { state: ProofState }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${proofStateClasses(
        state
      )}`}
    >
      {state}
    </span>
  );
}

export default function DirectoryPage() {
  const [realtime, setRealtime] = useState<Record<string, RealtimeMetric>>({});
  const [sourceOk, setSourceOk] = useState<boolean | null>(null);
  const [sourceReason, setSourceReason] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchRealtime = async () => {
      try {
        const res = await fetch(REALTIME_ENDPOINT, { cache: "no-store" });
        if (!res.ok) {
          setSourceOk(false);
          setSourceReason(`Realtime probe source returned HTTP ${res.status}.`);
          return;
        }
        const json: RealtimeDirectoryResponse = await res.json();
        setRealtime(json.realtime_metrics ?? {});
        setSourceOk(true);
        setSourceReason(null);
      } catch {
        setSourceOk(false);
        setSourceReason("Realtime probe source is unreachable.");
      }
    };
    fetchRealtime();
    const interval = setInterval(fetchRealtime, 15000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.map((c) => ({
      ...c,
      apis: c.apis.filter(
        (a) => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)
      ),
    })).filter((c) => c.apis.length > 0);
  }, [query]);

  const sourceState: ProofState =
    sourceOk === null ? "Unknown" : sourceOk ? "Present" : "Needs proof";

  return (
    <div className="space-y-12 pb-24">
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h1 className="text-4xl font-extrabold tracking-tight">Tier-1 API Directory</h1>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-white/10 bg-white/5 text-gray-300">
            Realtime probe source
            <ProofPill state={sourceState} />
          </span>
        </div>
        <p className="text-lg text-gray-400 leading-relaxed">
          Candidate APIs the VNP mesh targets. Listing an API here is not a claim that it is live or
          scored — latency and availability appear only when the realtime probe source returns them;
          otherwise each row reads{" "}
          <span className="text-amber-300 font-semibold">Needs proof</span>.
        </p>
        {sourceReason && (
          <p className="text-sm text-amber-300/80 mt-2 font-mono">
            {sourceReason} Source: GET {REALTIME_ENDPOINT}
          </p>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by API name or id…"
          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#FFB800]/50 transition-colors"
        />
      </div>

      <div className="space-y-12">
        {filtered.map((category) => {
          const Icon = category.icon;
          return (
            <section key={category.title}>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
                <Icon className="w-6 h-6 text-[#FFB800]" />
                {category.title}
              </h2>
              <div className="grid gap-4">
                {category.apis.map((apiItem) => {
                  const live = realtime[apiItem.id];
                  const hasProbe = Boolean(live && typeof live.latency_ms === "number");

                  const availability: ProofState = hasProbe
                    ? live?.is_up
                      ? "Present"
                      : "Needs proof"
                    : "Needs proof";
                  const latencyDisplay = hasProbe ? `${live?.latency_ms}ms` : "Needs proof";
                  const measuredAt = hasProbe && live?.measured_at ? live.measured_at : null;

                  return (
                    <div
                      key={apiItem.id}
                      className="bg-white/5 border border-white/10 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <h3 className="font-bold text-lg text-white">{apiItem.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500 uppercase tracking-wider">
                            Availability
                          </span>
                          <ProofPill state={availability} />
                        </div>
                      </div>

                      <div className="flex items-center gap-8 text-sm">
                        <div className="flex flex-col items-end">
                          <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                            Physical probe latency
                          </span>
                          <span className="font-mono text-white">{latencyDisplay}</span>
                          {measuredAt && (
                            <span className="text-[10px] text-gray-500 font-mono mt-0.5">
                              measured_at {measuredAt}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                            Settlement evidence
                          </span>
                          <ProofPill state="Needs proof" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-gray-500">No APIs match &ldquo;{query}&rdquo;.</p>
        )}
      </div>
    </div>
  );
}
