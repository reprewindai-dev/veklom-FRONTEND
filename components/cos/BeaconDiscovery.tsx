"use client";

import { useEffect, useRef, useState } from "react";
import { KeyRound, ShieldCheck, ShieldX } from "lucide-react";
import { getStage, type StageEndpoint } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { HonestEmpty } from "@/components/cos/SectionPillars";
import { Field } from "@/components/cos/StageParts";
import { ProofBadge } from "@/components/cos/ProofBadge";
import { VeklomActivityCue } from "@/components/cos/VeklomActivityCue";
import { beaconStats, NO_DATA, NO_DATA_TOOLTIP, type BeaconStat } from "@/lib/cos/beacon-stats";
import { SANDBOX_COPY, useSandboxMode } from "@/lib/cos/sandbox";

type Beacon = Record<string, unknown>;

export function BeaconStatStrip({ stats }: { stats: BeaconStat[] }) {
  return (
    <dl data-testid="beacon-stats" className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat) => (
        <div key={stat.id} className="rounded-xl border border-cos-border bg-cos-bg/35 px-4 py-3">
          <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">{stat.label}</dt>
          <dd
            className="mt-1 text-2xl font-semibold text-cos-text"
            title={stat.value === NO_DATA ? NO_DATA_TOOLTIP : stat.source}
            data-stat={stat.id}
          >
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
type Verification = { valid?: boolean; reason?: string; kid?: string };

function endpoint(method: StageEndpoint["method"], path: string, baseUrl?: string): StageEndpoint {
  return { method, path, classification: "present", response: "CAPPO beacon response", baseUrl };
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "Not returned";
}

export function BeaconDiscovery() {
  const stage = getStage("capabilities");
  const data = useStageData("capabilities", { autoGet: true });
  const verificationStarted = useRef(new Set<string>());
  const [verification, setVerification] = useState<Record<string, Verification>>({});
  const beaconBase = stage.endpoints.find((item) => item.path === "/v1/capability/beacons")?.baseUrl;
  const beaconsPayload = data.payloads["GET /v1/capability/beacons"];
  const beacons = beaconsPayload && typeof beaconsPayload === "object" && !Array.isArray(beaconsPayload)
    ? (Array.isArray((beaconsPayload as { beacons?: unknown }).beacons) ? (beaconsPayload as { beacons: Beacon[] }).beacons : [])
    : [];
  const keysPayload = data.payloads["GET /.well-known/capability-beacon-keys"];
  const sandbox = useSandboxMode();
  const stats = beaconStats(beaconsPayload, verification);

  useEffect(() => {
    for (const beacon of beacons) {
      const packageRef = stringValue(beacon.package_ref);
      if (packageRef === "Not returned" || verificationStarted.current.has(packageRef)) continue;
      verificationStarted.current.add(packageRef);
      void data.call<Verification>(
        endpoint("POST", "/v1/capability/beacons/verify", beaconBase),
        { beacon },
      ).then((result) => {
        if (result.data) setVerification((current) => ({ ...current, [packageRef]: result.data as Verification }));
      });
    }
  }, [beaconBase, beacons, data.call]);

  return (
    <section className="mt-10 rounded-2xl border border-cos-border bg-cos-surface2/70 p-5 shadow-cos-card lg:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-cos-accent"><KeyRound size={13} /> Signed capability beacons</div>
          <h2 className="mt-2 text-lg font-semibold text-cos-text">Independently verifiable capability advertisements</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-cos-muted">Each row is rendered from the signed beacon and the separate verification response. The published key document is shown as returned.</p>
        </div>
        <ProofBadge status={data.stageProof} />
      </div>
      <div className="mt-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cos-accent" data-testid="beacon-listening">
        <VeklomActivityCue kind="discovery" condition={data.loading ? "active" : beaconsPayload ? "present" : "unknown"} size={18} showCaption={false} />
        {sandbox ? SANDBOX_COPY.beaconHeader : SANDBOX_COPY.liveBeaconHeader}
      </div>
      <BeaconStatStrip stats={stats} />
      {!beacons.length ? <div className="mt-5"><HonestEmpty title="No beacon set returned" route="GET /v1/capability/beacons" detail="No capability advertisement is displayed until the registry returns one." /></div> : <div className="mt-5 space-y-3">{beacons.map((beacon) => {
        const packageRef = stringValue(beacon.package_ref);
        const result = verification[packageRef];
        const valid = result?.valid === true;
        return <article key={packageRef} className="rounded-xl border border-cos-border bg-cos-bg/35 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">{valid ? <ShieldCheck size={16} className="text-cos-verified" /> : <ShieldX size={16} className="text-cos-warn" />}<span className="font-mono text-xs text-cos-text">{packageRef}</span><ProofBadge status={result ? (valid ? "Verified" : "Degraded") : "Needs proof"} /></div>
            <span className="font-mono text-[10px] uppercase text-cos-steel">{result?.reason ?? "Verification not returned"}</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Capability" value={beacon.capability_id} />
            <Field label="Issuer" value={beacon.issuer} />
            <Field label="Presented kid" value={beacon.kid} />
            <Field label="Verified kid returned" value={result?.kid} />
            <Field label="Issued at" value={beacon.issued_at} />
            <Field label="Expires at" value={beacon.expires_at} />
            <Field label="Policy hash" value={beacon.policy_hash} />
            <Field label="Signature" value={beacon.signature ? "Returned; not rendered" : undefined} />
          </div>
          {result?.reason === "beacon_expired" ? <p className="mt-3 text-xs text-cos-warn">This beacon is expired according to signature verification.</p> : null}
        </article>;
      })}</div>}
      <div className="mt-5 rounded-xl border border-cos-border bg-cos-bg/40 p-4">
        <div className="flex items-center gap-2"><KeyRound size={14} className="text-cos-accent" /><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Published issuer keys</span></div>
        {keysPayload ? <pre className="mt-3 max-h-48 overflow-auto font-mono text-[10px] leading-5 text-cos-muted">{JSON.stringify(keysPayload, null, 2)}</pre> : <p className="mt-3 text-xs text-cos-muted">No key document returned — GET /.well-known/capability-beacon-keys</p>}
      </div>
    </section>
  );
}
