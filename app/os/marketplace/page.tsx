"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, PackagePlus, Search } from "lucide-react";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import type { PackagePayload } from "@/components/cos/MountParts";
import { capabilities } from "@/lib/cos/capabilities";
import { capabilityHref } from "@/lib/cos/capability-context";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";

/**
 * Marketplace (design brief): discover, install, version and mount governed capabilities into a
 * workspace. "Marketplace discovers → Mount installs → Harness binds → Govern authorizes."
 * It is not an app store and owns no execution, governance or settlement.
 */
export default function MarketplacePage() {
  const stage = getStage("marketplace");
  const data = useStageData("marketplace", { autoGet: true });
  const [query, setQuery] = useState("");
  const payload = data.payloads["GET /v1/capability/packages"];
  const packages = (Array.isArray(payload) ? payload : []) as PackagePayload[];
  const term = query.trim().toLowerCase();
  const matches = (...values: (string | null | undefined)[]) => !term || values.some((value) => value?.toLowerCase().includes(term));
  const baseline = capabilities.filter((item) => matches(item.name, item.description, item.lifecycleStage, item.kind));
  const live = packages.filter((item) => matches(item.title, item.id, item.purpose, item.family));
  const catalogProof = data.records.find((record) => record.path === "/v1/capability/packages")?.proof ?? "Not started";

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="xl:col-span-2">
        <label className="flex items-center gap-3 rounded-xl border border-cos-border bg-cos-surface/80 px-4 py-3">
          <Search size={16} className="text-cos-accent" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search capabilities and packages" className="flex-1 bg-transparent text-sm text-cos-text outline-none placeholder:text-cos-muted" aria-label="Search the marketplace" />
        </label>
      </div>
      <div className="xl:col-span-2">
        <Pillar title="Packages you can install" proof={catalogProof} detail="Served live by the registry. Installing hands the package to Mount, where you bind its scope; it grants nothing.">
          {live.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {live.map((item) => (
                <div key={item.id} className="flex flex-col rounded-xl border border-cos-border bg-cos-bg/35 p-4">
                  <div className="text-sm font-medium text-cos-text">{item.title}</div>
                  <div className="mt-1 font-mono text-[10px] text-cos-steel">{item.id} · {item.family}</div>
                  <p className="mt-2 flex-1 text-xs leading-5 text-cos-muted">{item.purpose}</p>
                  <div className="mt-2 font-mono text-[10px] text-cos-steel">acts on: {item.target_ref ?? "no target declared"}</div>
                  <Link href={`/os/mount?package=${encodeURIComponent(item.id)}`} className="mt-3 inline-flex items-center gap-2 self-start rounded-lg border border-cos-accent/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cos-accent"><PackagePlus size={14} />Install via Mount</Link>
                </div>
              ))}
            </div>
          ) : <HonestEmpty title={packages.length ? "No package matches this search" : "No packages returned"} route="GET /v1/capability/packages" detail={packages.length ? "Try another word." : "Nothing can be installed until the registry returns its catalog."} />}
        </Pillar>
      </div>
      <div className="xl:col-span-2">
        <Pillar title="Veklom capabilities" proof="Present" detail="The baseline capabilities that ship with the product. Each opens in its own workspace. Per-workspace install records are not connected yet, so these states are the product defaults.">
          {baseline.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {baseline.map((item) => (
                <Link key={item.id} href={capabilityHref(item)} className="group flex flex-col rounded-xl border border-cos-border bg-cos-bg/35 p-4 transition hover:border-cos-accent/40">
                  <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium text-cos-text">{item.name}</span><span className="rounded-full border border-cos-border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-cos-steel">{item.mountState === "Mounted" ? "Installed by default" : "Available"}</span></div>
                  <p className="mt-2 flex-1 text-xs leading-5 text-cos-muted">{item.description}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs text-cos-accent">Open in {item.lifecycleStage} <ArrowRight size={12} className="transition group-hover:translate-x-0.5" /></span>
                </Link>
              ))}
            </div>
          ) : <HonestEmpty title="No capability matches this search" route="lib/cos/capabilities.ts" detail="Try another word." />}
        </Pillar>
      </div>
    </SectionShell>
  );
}
