"use client";

import { MetricCard } from "@/components/cos/MetricCard";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";

function numericField(payloads: Record<string, unknown>, field: string): number | string | undefined {
  for (const payload of Object.values(payloads)) {
    if (payload && typeof payload === "object" && field in payload) {
      const value = (payload as Record<string, unknown>)[field];
      if (typeof value === "number" || typeof value === "string") return value;
    }
  }
  return undefined;
}

export default function MeasurePage() {
  const baseStage = getStage("measure");
  const stage = { ...baseStage, label: "Measure — Veklom The Threshold" };
  const data = useStageData("measure", { autoGet: true });
  const latency = numericField(data.payloads, "latency");
  const throughput = numericField(data.payloads, "throughput");

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="space-y-4">
        <Pillar title="Work" proof={data.stageProof}>{latency !== undefined || throughput !== undefined ? <div className="grid gap-3 sm:grid-cols-2">
          {latency !== undefined && <MetricCard title="Latency" value={latency} unit="ms" trend="neutral" trendValue="Observed response" />}
          {throughput !== undefined && <MetricCard title="Throughput" value={throughput} trend="neutral" trendValue="Observed response" />}
        </div> : <HonestEmpty title="No measurement values returned" route="GET /v1/vnp/metrics" detail="Metric cards appear only for fields returned by the backend." />}</Pillar>
        <Pillar title="Telemetry" proof={data.stageProof}><HonestEmpty title="Telemetry remains route-backed" route="GET /v1/vnp/metrics" detail="The route ledger records status and latency for each observation." /></Pillar>
        <Pillar title="Authority" proof={data.stageProof}><HonestEmpty title="Measurement authority not returned" route="GET /v1/vnp/validators" detail="No validator authority payload was observed." /></Pillar>
      </div>
      <div className="space-y-4">
        <Pillar title="Evidence" proof={data.stageProof}><HonestEmpty title="Measurement evidence not returned" route="GET /v1/vnp/incidents" detail="No incident evidence was observed." /></Pillar>
        <Pillar title="Drift" proof={data.stageProof}><HonestEmpty title="Drift comparison not returned" route="GET /api/v1/platform/pulse" detail="No comparison value is available." /></Pillar>
      </div>
    </SectionShell>
  );
}
