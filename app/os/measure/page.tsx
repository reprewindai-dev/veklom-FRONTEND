"use client";

import { MetricCard } from "@/components/cos/MetricCard";
import { MeasurementLookup } from "@/components/cos/ExecutionLookups";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { JsonPanel } from "@/components/cos/StageParts";
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

/** Measure (DESIGN_MODEL): observations only. Unmeasured values stay empty; measurement never grants authority. */
export default function MeasurePage() {
  const stage = getStage("measure");
  const data = useStageData("measure", { autoGet: true });
  const latency = numericField(data.payloads, "latency");
  const throughput = numericField(data.payloads, "throughput");
  const record = (path: string) => data.records.find((item) => item.method === "GET" && item.path === path);

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="xl:col-span-2">
        <Pillar title="Measure one execution" proof={data.stageProof} detail="Signed external probes for the provider a governed execution used.">
          <MeasurementLookup stageData={data} />
        </Pillar>
      </div>
      <Pillar title="Service measurements" proof={record("/v1/vnp/metrics")?.proof ?? "Not started"} detail="Cards appear only for values the measurement service returned.">
        {latency !== undefined || throughput !== undefined ? <div className="grid gap-3 sm:grid-cols-2">
          {latency !== undefined && <MetricCard title="Latency" value={latency} unit="ms" trend="neutral" trendValue="Observed response" />}
          {throughput !== undefined && <MetricCard title="Throughput" value={throughput} trend="neutral" trendValue="Observed response" />}
        </div> : <HonestEmpty title="No measurement values returned" route="GET /v1/vnp/metrics" detail="Nothing is shown until the measurement service returns a value." />}
      </Pillar>
      <Pillar title="Incidents" proof={record("/v1/vnp/incidents")?.proof ?? "Not started"} detail="Reported incidents, as returned.">
        <JsonPanel value={data.payloads["GET /v1/vnp/incidents"]} empty="No incident record has been returned." />
      </Pillar>
    </SectionShell>
  );
}
