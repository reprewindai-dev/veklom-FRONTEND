"use client";
import { useEffect } from "react";
import { Activity } from "lucide-react";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { SectionShell } from "@/components/cos/SectionShell";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { JsonPanel } from "@/components/cos/StageParts";
import { MetricGrid } from "@/components/cos/StageCollection";
export default function MeasurePage(){const stage=getStage("measure"),data=useStageData("measure");useEffect(()=>{for(const e of stage.endpoints)if(e.method==="GET")void data.call(e)},[data.call,stage.endpoints]);const metrics=data.payloads[`GET ${stage.endpoints[0].path}`];return <SectionShell stage={stage} proof={data.stageProof} records={data.records}><div className="xl:col-span-2"><Pillar title="Work" proof={metrics?data.records[0]?.proof??"Needs proof":"Needs proof"} detail="Metrics are observations, not authorization or execution proof."><div className="flex items-center gap-3"><Activity className="text-cos-accent" size={18}/><span className="text-sm text-cos-text">Independent measurement surface</span></div><div className="mt-4"><MetricGrid value={metrics}/></div></Pillar></div>{stage.endpoints.slice(1).map((e,i)=><Pillar key={e.path} title={i%2===0?"Telemetry":"Evidence"} proof={data.records[i+1]?.proof??"Needs proof"}><JsonPanel value={data.payloads[`GET ${e.path}`]} empty={`${e.method} ${e.path} has not returned a measurement payload.`}/></Pillar>)}<Pillar title="Authority" proof="Needs proof"><HonestEmpty title="Measurement is not authority" route="GET /v1/vnp/metrics" detail="No authority grant or execution identity is inferred from metric values."/></Pillar><Pillar title="Drift" proof="Needs proof"><HonestEmpty title="No measurement drift baseline" route="GET /api/v1/platform/pulse" detail="Freshness and provenance are displayed only when returned by each source; no baseline was supplied."/></Pillar></SectionShell>}
