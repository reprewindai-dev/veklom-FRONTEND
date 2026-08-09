"use client";

import { Boxes, Clock3, FileKey2, LockKeyhole, ShieldAlert } from "lucide-react";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { SectionShell } from "@/components/cos/SectionShell";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";

const concepts = [
  ["Capability", "The selected capability is the object being acted on."],
  ["Package", "A versioned contract declares purpose, reads, writes, outputs, and blocked actions."],
  ["Grants", "Only explicitly granted reads and writes are available to the execution."],
  ["Scope", "Workspace and project boundaries constrain where the capability can operate."],
  ["TTL", "The scoped token expires and the execution binding terminates."],
  ["Blocked actions", "Blocked declarations take precedence over every allow."],
];

export default function MountPage() {
  const stage = getStage("mount");
  const data = useStageData("mount");
  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records} primaryAction={<div className="inline-flex items-center gap-2 rounded-xl border border-cos-border bg-cos-bg/60 px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] text-cos-steel"><ShieldAlert size={14} />Not started</div>}>
      <div className="xl:col-span-2">
        <Pillar title="Work" proof="Not started" detail="This is a persistent boundary around a capability, not a persistent agent.">
          <div className="rounded-xl border border-cos-accent/25 bg-cos-accent/[0.035] p-5"><div className="flex items-start gap-4"><Boxes size={24} className="mt-1 shrink-0 text-cos-accent" /><div><h2 className="text-xl font-semibold tracking-tight text-cos-text">A mount would make authority explicit</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-cos-muted">The isolated capability-mount contract is present in the backend source, but no live route is registered. Until the route exists, this workspace will not mint a token, imply grants, or claim a scope.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{concepts.map(([label, text]) => <div key={label} className="rounded-lg border border-cos-border bg-cos-bg/50 p-3"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-cos-accent">{label}</div><p className="mt-2 text-xs leading-5 text-cos-muted">{text}</p></div>)}</div></div></div></div>
          <div className="mt-5"><HonestEmpty title="No mount route registered" route="POST /api/v1/capability/mount" detail="The backend capability-mount module is not registered in the live application entrypoint. No ephemeral scoped token or mount response can be requested from this section." /></div>
        </Pillar>
      </div>
      <Pillar title="Telemetry" proof="Not started"><div className="flex items-start gap-3"><Clock3 size={18} className="text-cos-steel" /><div><p className="text-sm text-cos-text">No mount telemetry exists</p><p className="mt-1 text-xs leading-5 text-cos-muted">TTL, expiry, and execution state remain unobserved until a mount route returns them.</p></div></div></Pillar>
      <Pillar title="Authority" proof="Not started"><div className="flex items-start gap-3"><LockKeyhole size={18} className="text-cos-steel" /><div><p className="text-sm text-cos-text">No token has been issued</p><p className="mt-1 text-xs leading-5 text-cos-muted">A registered mount response must expose only grants, caps, leases, and revocations — never private key material.</p></div></div></Pillar>
      <Pillar title="Evidence" proof="Not started"><div className="flex items-start gap-3"><FileKey2 size={18} className="text-cos-steel" /><div><p className="text-sm text-cos-text">No mount evidence exists</p><p className="mt-1 text-xs leading-5 text-cos-muted">There is no token descriptor, audit event, or hash chain to verify.</p></div></div></Pillar>
      <Pillar title="Drift" proof="Not started"><HonestEmpty title="No mount/runtime comparison" route="POST /api/v1/capability/mount" detail="A mount must bind declared package state to the transient runtime before drift can be measured." /></Pillar>
    </SectionShell>
  );
}
