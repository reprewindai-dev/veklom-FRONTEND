"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Cpu, Play } from "lucide-react";
import { PhaseTrace } from "@/components/cos/PhaseTrace";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { JsonPanel, PaymentChallenge } from "@/components/cos/StageParts";
import { PlanGraphCanvas } from "@/components/cos/PlanGraphCanvas";
import { readSessionCapabilityLease } from "@/lib/cos/lease-session";
import { getToken } from "@/lib/api";
import type { GpcCompileResponse } from "@/lib/cos/gpc";

const BLUEPRINT_STORAGE_KEY = "veklom.blueprint.plan.v1";

function isGpcCompileResponse(value: unknown): value is GpcCompileResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<GpcCompileResponse>;
  return typeof candidate.id === "string"
    && typeof candidate.status === "string"
    && Boolean(candidate.graph && Array.isArray(candidate.graph.nodes) && Array.isArray(candidate.graph.edges));
}

function readPersistedBlueprint(): GpcCompileResponse | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.sessionStorage.getItem(BLUEPRINT_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return isGpcCompileResponse(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export default function BlueprintPage() {
  const stage = getStage("blueprint");
  const data = useStageData("blueprint", { autoGet: true });
  const compileEndpoint = stage.endpoints.find((e) => e.path === "/api/v1/gpc/compile") ?? stage.endpoints[0];
  const statsPayload = data.payloads["GET /api/v1/gpc/stats"];

  const [lease] = useState(() => readSessionCapabilityLease());
  const [intent, setIntent] = useState(() => (
    lease?.packageRef
      ? `Execute governed capability ${lease.packageRef} on resource ${lease.resource || "counter"} with PGL receipt verification`
      : "Compile governed capability execution plan with LAW-0 fail-closed verification and PGL receipt anchoring"
  ));
  const [provider, setProvider] = useState("gemini");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [complianceInput, setComplianceInput] = useState("LAW-0,SOC2,PGL-RECEIPT");
  const [persistedPlan, setPersistedPlan] = useState<GpcCompileResponse | undefined>(() => readPersistedBlueprint());
  const autoCompiledRef = useRef(false);

  const livePlan = Object.values(data.payloads).find(isGpcCompileResponse);
  const plan = livePlan ?? persistedPlan;

  const handleCompile = useCallback(async () => {
    const compliance = complianceInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const result = await data.call<GpcCompileResponse>(compileEndpoint, {
      intent,
      provider,
      model,
      compliance,
      capability_id: lease?.packageRef || "cap.counter.increment.v1",
    });
    if (result.data && isGpcCompileResponse(result.data)) {
      setPersistedPlan(result.data);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(BLUEPRINT_STORAGE_KEY, JSON.stringify(result.data));
      }
      const statsEndpoint = stage.endpoints.find((e) => e.path === "/api/v1/gpc/stats");
      if (statsEndpoint) void data.call(statsEndpoint);
    }
  }, [compileEndpoint, complianceInput, data, intent, lease?.packageRef, model, provider, stage.endpoints]);

  useEffect(() => {
    if (autoCompiledRef.current) return;
    if (getToken()) {
      autoCompiledRef.current = true;
      void handleCompile();
    }
  }, [handleCompile]);

  const challenge = Object.values(data.payloads).find((value) => (
    value && typeof value === "object" && "x402_version" in value
  ));
  const phaseStatus = data.loading ? "current" : plan ? "complete" : "pending";

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="space-y-4">
        <Pillar title="Work" proof={data.stageProof}>
          <PhaseTrace phases={[
            { id: "intent", name: "Intent", status: phaseStatus, kind: "discovery" },
            { id: "compile", name: "Compile", status: phaseStatus, kind: "execution" },
            { id: "review", name: "Review", status: plan ? "complete" : "pending", kind: "authority" },
          ]} />
          <div className="mt-4 space-y-3 rounded-lg border border-cos-border bg-cos-bg/60 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cos-accent">
                <Cpu size={14} /> Governed Plan Compiler (GPC)
              </span>
              {lease?.mountId ? (
                <span className="font-mono text-[10px] text-cos-verified">
                  Bound Lease: {lease.mountId}
                </span>
              ) : null}
            </div>
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">
                Execution Intent
              </label>
              <input
                type="text"
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                className="mt-1 w-full rounded border border-cos-border bg-cos-surface px-3 py-2 font-mono text-xs text-cos-text focus:border-cos-accent focus:outline-none"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">
                  Provider
                </label>
                <input
                  type="text"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="mt-1 w-full rounded border border-cos-border bg-cos-surface px-3 py-1.5 font-mono text-xs text-cos-text"
                />
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">
                  Model
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="mt-1 w-full rounded border border-cos-border bg-cos-surface px-3 py-1.5 font-mono text-xs text-cos-text"
                />
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">
                  Compliance Constraints
                </label>
                <input
                  type="text"
                  value={complianceInput}
                  onChange={(e) => setComplianceInput(e.target.value)}
                  className="mt-1 w-full rounded border border-cos-border bg-cos-surface px-3 py-1.5 font-mono text-xs text-cos-text"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => void handleCompile()}
                disabled={data.loading}
                className="inline-flex items-center gap-2 rounded border border-cos-accent/40 bg-cos-accent/15 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-cos-accent transition hover:bg-cos-accent/25 disabled:opacity-50"
              >
                <Play size={13} />
                {data.loading ? "Compiling Plan..." : "Compile Blueprint"}
              </button>
              {plan ? (
                <Link
                  href="/os/govern"
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-cos-verified hover:underline"
                >
                  Continue to Govern <ArrowRight size={13} />
                </Link>
              ) : null}
            </div>
          </div>
        </Pillar>
        <Pillar title="Telemetry" proof={data.stageProof}>
          {challenge ? (
            <PaymentChallenge value={challenge} />
          ) : statsPayload || plan ? (
            <JsonPanel value={{ compile_ms: (plan as any)?.compile_ms, stats: statsPayload }} empty="No telemetry available." />
          ) : (
            <HonestEmpty title="Compile telemetry follows the route" route="POST /api/v1/gpc/compile" detail="No timing or plan claim is rendered until the endpoint is called." />
          )}
        </Pillar>
        <Pillar title="Authority" proof={data.stageProof}>
          {lease ? (
            <dl className="grid gap-3 sm:grid-cols-2">
              <div><dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Active Mount</dt><dd className="mt-1 font-mono text-xs text-cos-text">{lease.mountId}</dd></div>
              <div><dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Package</dt><dd className="mt-1 font-mono text-xs text-cos-text">{lease.packageRef}</dd></div>
            </dl>
          ) : (
            <HonestEmpty title="Blueprint authority not bound" route="GET /api/v1/gpc/stats" detail="Mount a capability on /os/mount to bind a scoped lease to this blueprint." />
          )}
        </Pillar>
      </div>
      <div className="space-y-4">
        <Pillar title="Evidence" proof={data.stageProof}>
          {plan?.graph?.nodes?.length ? (
            <div className="space-y-4">
              <PlanGraphCanvas graph={plan.graph} />
              <dl className="grid gap-3 sm:grid-cols-3">
                <div><dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Plan ID</dt><dd className="mt-1 break-all font-mono text-xs text-cos-text">{plan.id}</dd></div>
                <div><dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Status</dt><dd className="mt-1 font-mono text-xs text-cos-text">{plan.status}</dd></div>
                <div><dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Proof hash</dt><dd className="mt-1 break-all font-mono text-xs text-cos-text">{plan.proof_hash ?? "Not returned"}</dd></div>
              </dl>
            </div>
          ) : <HonestEmpty title="No compiled plan evidence" route="POST /api/v1/gpc/compile" detail="Click Compile Blueprint to compile an intent into a verified DAG." />}
        </Pillar>
        <Pillar title="Drift" proof={data.stageProof}><HonestEmpty title="Blueprint drift not measured" route="GET /api/v1/gpc/stats" detail="No drift signal was returned by the blueprint routes." /></Pillar>
      </div>
    </SectionShell>
  );
}

