"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BeaconDiscovery } from "@/components/cos/BeaconDiscovery";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import type { PackagePayload } from "@/components/cos/MountParts";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";

/** Registry (navigation map, Capability tools): what the live registry serves, as returned. */
export default function RegistryPage() {
  const stage = getStage("registry");
  const data = useStageData("registry", { autoGet: true });
  const payload = data.payloads["GET /v1/capability/packages"];
  const packages = (Array.isArray(payload) ? payload : []) as PackagePayload[];
  const catalogProof = data.records.find((record) => record.path === "/v1/capability/packages")?.proof ?? "Not started";

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="xl:col-span-2">
        <Pillar title="Package catalog" proof={catalogProof} detail="Each row is a package exactly as the registry returned it. Being listed is not permission to act.">
          {packages.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">
                  <tr><th className="py-2 pr-4">Package</th><th className="py-2 pr-4">Family</th><th className="py-2 pr-4">Target</th><th className="py-2 pr-4">Reads</th><th className="py-2 pr-4">Writes</th><th className="py-2 pr-4">Blocked</th><th className="py-2" /></tr>
                </thead>
                <tbody>
                  {packages.map((item) => (
                    <tr key={item.id} className="border-t border-cos-border align-top">
                      <td className="py-3 pr-4"><div className="text-cos-text">{item.title}</div><div className="font-mono text-[10px] text-cos-steel">{item.id}</div><div className="mt-1 max-w-xs text-cos-muted">{item.purpose}</div></td>
                      <td className="py-3 pr-4 font-mono text-cos-muted">{item.family}</td>
                      <td className="py-3 pr-4 font-mono text-cos-muted">{item.target_ref ?? "none declared"}</td>
                      <td className="py-3 pr-4 font-mono text-cos-muted">{item.reads?.join(", ") || "—"}</td>
                      <td className="py-3 pr-4 font-mono text-cos-muted">{item.writes?.join(", ") || "—"}</td>
                      <td className="py-3 pr-4 font-mono text-cos-muted">{item.blocked?.join(", ") || "—"}</td>
                      <td className="py-3"><Link href={`/os/mount?package=${encodeURIComponent(item.id)}`} className="inline-flex items-center gap-1 whitespace-nowrap text-cos-accent hover:underline">Mount <ArrowRight size={12} /></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <HonestEmpty title="No capability packages returned" route="GET /v1/capability/packages" detail="Nothing is listed until the registry returns its catalog." />}
        </Pillar>
      </div>
      <div className="xl:col-span-2">
        <BeaconDiscovery />
      </div>
    </SectionShell>
  );
}
