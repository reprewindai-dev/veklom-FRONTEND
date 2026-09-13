import React from "react";
import Link from "next/link";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { AmbientField, PremiumPageIntro, StageLabel } from "@/components/brand/PremiumPrimitives";
import { LiveProofFabric } from "@/components/proof/LiveProofFabric";

export const metadata = {
  title: "Proof Ledger | Veklom Governed Compute",
  description: "The singular source of truth for Veklom's architectural claims, scopes, physical verification evidence, and the M0-M13 mobility ledger.",
};

interface PhysicalEvidenceBundle {
  filename: string;
  label: string;
  runId: string;
  scope: string;
  test: string;
  sha256: string;
  sizeBytes: number;
  href: string;
  description: string;
}

const physicalBundles: PhysicalEvidenceBundle[] = [
  {
    filename: "bound_evidence_5982badd-7c48-4ea4-bbd8-79ccce295a2c.json",
    label: "P2-HOST Physical Hypervisor Run 1",
    runId: "5982badd-7c48-4ea4-bbd8-79ccce295a2c",
    scope: "1 Physical Windows Host, 2 Independent Alpine Linux Guests (Hyper-V)",
    test: "P2-HOST Partition Fencing & Authority Transition",
    sha256: "652f9accf58589dac4119b83a5182a608dc10f3a3b65a79ef4f4580068c882c4",
    sizeBytes: 16619,
    href: "/proofs/bound_evidence_5982badd-7c48-4ea4-bbd8-79ccce295a2c.json",
    description: "Physical hypervisor partition test. Proves authority epoch 1 bound to Node A, fenced upon partition, and transition verified with host hypervisor telemetry.",
  },
  {
    filename: "bound_evidence_5737342f-1504-44aa-93f4-3fcd38383c5a.json",
    label: "P2-HOST Physical Hypervisor Run 2",
    runId: "5737342f-1504-44aa-93f4-3fcd38383c5a",
    scope: "1 Physical Windows Host, 2 Independent Alpine Linux Guests (Hyper-V)",
    test: "P2-HOST Monotonic Authority Replication",
    sha256: "8024535b01442243835fcc0d041e43f388037421ed114e6a04ac079c68241703",
    sizeBytes: 15632,
    href: "/proofs/bound_evidence_5737342f-1504-44aa-93f4-3fcd38383c5a.json",
    description: "Independent replication run. Confirms deterministic hypervisor-enforced partition fencing and cryptographic binding of host observer telemetry.",
  },
  {
    filename: "mobility_p1_evidence_19579c43.json",
    label: "VDB-MOBILITY-P1 Cold Materialization",
    runId: "19579c43-4d58-4a80-86cb-8834a1cdf3ac",
    scope: "Physical Stop-VM Hard Termination of Host_A, Cold Load on Host_B",
    test: "VDB-MOBILITY-P1 14-Step Mobility Sequence (M0-M13)",
    sha256: "15569a162b556d85dc2c1b59cb8831a0f81208ffac37a92cc020991401120564",
    sizeBytes: 8551,
    href: "/proofs/mobility_p1_evidence_19579c43.json",
    description: "Governed state package survives physical VM termination of Host_A, rematerializes on Host_B, rejects spoofed/stale authority, and advances monotonically.",
  },
];

interface MobilityStep {
  step: string;
  name: string;
  invariant: string;
  eventType: string;
  outcome: "VERIFIED" | "DENIED (PASS)" | "VALID";
  outcomeType: "allow" | "deny" | "valid";
  details: string;
  timestamp: string;
}

const mobilityLedgerSteps: MobilityStep[] = [
  {
    step: "M0",
    name: "B clean: no state, no authority",
    invariant: "PACKAGE_SELF_CONTAINED / NO_SOURCE_RUNTIME_DEPENDENCY",
    eventType: "B_CLEAN_VERIFIED",
    outcome: "VERIFIED",
    outcomeType: "allow",
    details: "Host_B uninitialized (boot_id 2832bc75..., generation 0). Zero pre-existing authority or state.",
    timestamp: "2026-09-12T23:30:52.031Z",
  },
  {
    step: "M1",
    name: "A receives epoch 1 authority",
    invariant: "FRESH_DESTINATION_AUTHORITY",
    eventType: "EPOCH_TRANSITION",
    outcome: "VERIFIED",
    outcomeType: "allow",
    details: "Host_A granted authority epoch 1 (boot_id add8c35c...). Monotonic capability lease established.",
    timestamp: "2026-09-12T23:30:52.283Z",
  },
  {
    step: "M2",
    name: "A acknowledged mutation N -> N+1",
    invariant: "STATE_VERSION_CONTINUITY",
    eventType: "GEN_ADVANCE",
    outcome: "VERIFIED",
    outcomeType: "allow",
    details: "Generation 1 advance. State root: 23cd6bba... Digest: fe7c6820... Monotonic counter preserved.",
    timestamp: "2026-09-12T23:30:52.345Z",
  },
  {
    step: "M3",
    name: "Package sealed: package_hash, state_root, receipt_anchor",
    invariant: "PROVENANCE_CONTINUITY",
    eventType: "PACKAGE_SEALED",
    outcome: "VERIFIED",
    outcomeType: "allow",
    details: "Package hash: sha256:975ae1f2... State root: sha256:23cd6bba... Previous receipt anchor: bb27414e...",
    timestamp: "2026-09-12T23:30:52.361Z",
  },
  {
    step: "M4",
    name: "Independent pre-verification of package integrity",
    invariant: "PACKAGE_INTEGRITY",
    eventType: "PACKAGE_INTEGRITY_VERIFIED",
    outcome: "VERIFIED",
    outcomeType: "allow",
    details: "Pre-flight chunk cryptographic verification: 1/1 chunks verified intact prior to source shutdown.",
    timestamp: "2026-09-12T23:30:52.361Z",
  },
  {
    step: "M5",
    name: "A terminated. A unavailable. A state path unavailable.",
    invariant: "SOURCE_RUNTIME_UNAVAILABLE / SOURCE_STATE_PATH_UNAVAILABLE",
    eventType: "SOURCE_TERMINATED",
    outcome: "VERIFIED",
    outcomeType: "allow",
    details: "Host_A terminated via Stop-VM (P2HOST_MODE). Confirmed unreachable at 23:31:42. State path severed.",
    timestamp: "2026-09-12T23:31:42.403Z",
  },
  {
    step: "M6",
    name: "Package transferred to B (only package, no A runtime)",
    invariant: "PACKAGE_SELF_CONTAINED",
    eventType: "PACKAGE_TRANSFERRED",
    outcome: "VERIFIED",
    outcomeType: "allow",
    details: "Cold package artifact transferred across physical host boundary to Host_B without runtime A dependency.",
    timestamp: "2026-09-12T23:31:42.403Z",
  },
  {
    step: "M7",
    name: "B verifies package integrity before loading (Adversarial)",
    invariant: "TAMPERED_CHUNK_DENIED / TAMPERED_MANIFEST_DENIED",
    eventType: "MATERIALIZATION_DENY",
    outcome: "DENIED (PASS)",
    outcomeType: "deny",
    details: "Adversarial tamper injection: tampered chunk -> DENY; tampered manifest -> DENY. Zero tolerance.",
    timestamp: "2026-09-12T23:31:42.404Z",
  },
  {
    step: "M8",
    name: "A authority on B -> DENY (Adversarial)",
    invariant: "SOURCE_AUTHORITY_REJECTED_ON_B",
    eventType: "AUTHORITY_DENY",
    outcome: "DENIED (PASS)",
    outcomeType: "deny",
    details: "Cross-host authority spoofing denied: runtime mismatch (auth:Host_A != curr:Host_B). Fails closed.",
    timestamp: "2026-09-12T23:31:42.572Z",
  },
  {
    step: "M9",
    name: "Stale epoch on B -> DENY (Adversarial)",
    invariant: "STALE_EPOCH_REJECTED",
    eventType: "AUTHORITY_DENY",
    outcome: "DENIED (PASS)",
    outcomeType: "deny",
    details: "Stale epoch 1 replay rejected on destination: Active lease held by Host_A. Replay denied.",
    timestamp: "2026-09-12T23:31:42.609Z",
  },
  {
    step: "M10",
    name: "B receives fresh authority (epoch 2, Host_B binding)",
    invariant: "FRESH_DESTINATION_AUTHORITY",
    eventType: "EPOCH_TRANSITION & EXEC_ALLOW",
    outcome: "VERIFIED",
    outcomeType: "allow",
    details: "Epoch transition Host_A -> Host_B, epoch 1 -> 2. Fresh runtime binding confirmed. Result: GOLDEN_EAGLE_99.",
    timestamp: "2026-09-12T23:31:53.095Z",
  },
  {
    step: "M11",
    name: "B materializes exact N+1 state",
    invariant: "STATE_ROOT_CONTINUITY",
    eventType: "MATERIALIZATION_ALLOW",
    outcome: "VERIFIED",
    outcomeType: "allow",
    details: "Host_B materializes state_version 1. State root matches sealed chunk. source_runtime_contacted: false.",
    timestamp: "2026-09-12T23:31:53.099Z",
  },
  {
    step: "M12",
    name: "B performs next mutation N+1 -> N+2",
    invariant: "STATE_VERSION_CONTINUITY / PROVENANCE_CONTINUITY",
    eventType: "EXEC_ALLOW",
    outcome: "VERIFIED",
    outcomeType: "allow",
    details: "Mutation N+1 -> N+2 executed under epoch 2 authority. State version 2 advanced. Receipt chain linked.",
    timestamp: "2026-09-12T23:31:53.279Z",
  },
  {
    step: "M13",
    name: "Continuity verified. Evidence sealed.",
    invariant: "P2HOST_SEAL_UNCHANGED",
    eventType: "EVIDENCE_SEALED",
    outcome: "VALID",
    outcomeType: "valid",
    details: "Deterministic validation complete: 14/14 invariants verified. Evidence bundle cryptographically sealed.",
    timestamp: "2026-09-12T23:31:53.326Z",
  },
];

const verifiedLedger = [
  {
    n: "P1",
    status: "VERIFIED",
    title: "Authority Boundary",
    body: "Consequences are governed by explicit bounded authority rather than ambient server permission. Invalid or incorrect runtime authority fails closed.",
    scope: "Software routing, CAPPO lease enforcement, invalid authority rejection.",
    falsifier: "Wrong authority executing consequence.",
  },
  {
    n: "P2",
    status: "VERIFIED",
    title: "Consequence Dominance",
    body: "The system enforces strictly monotonic capability state transitions and denies out-of-order execution attempts.",
    scope: "State monotonic counters, exactly-once bounds.",
    falsifier: "Out-of-order execution success.",
  },
  {
    n: "P3",
    status: "VERIFIED ×2",
    title: "Authority Continuity (P2-HOST)",
    body: "A capability transitions between execution domains under a real hypervisor-enforced network partition. The stale runtime is fenced, and authority transfers monotonically.",
    scope: "1 Physical Windows Host, 2 Independent Alpine Linux Guests.",
    evidence: [
      {
        label: "Run 5982badd (Physical Host)",
        href: "/proofs/bound_evidence_5982badd-7c48-4ea4-bbd8-79ccce295a2c.json",
        sha256: "652f9accf58589dac4119b83a5182a608dc10f3a3b65a79ef4f4580068c882c4",
      },
      {
        label: "Run 5737342f (Replication Run)",
        href: "/proofs/bound_evidence_5737342f-1504-44aa-93f4-3fcd38383c5a.json",
        sha256: "8024535b01442243835fcc0d041e43f388037421ed114e6a04ac079c68241703",
      },
    ],
    falsifier: "Stale source executing after B obtains epoch.",
  },
  {
    n: "P4",
    status: "VERIFIED",
    title: "Portable Governed State (VDB-MOBILITY-P1)",
    body: "Governed state survives the termination of its source runtime, rematerializes independently on a new execution domain, rejects inherited authority, and continues execution with a verifiable receipt chain.",
    scope: "Physical Stop-VM termination of Host A, fresh cold materialization on Host B.",
    evidence: [
      {
        label: "Run 19579c43 (M0-M13 Mobility)",
        href: "/proofs/mobility_p1_evidence_19579c43.json",
        sha256: "15569a162b556d85dc2c1b59cb8831a0f81208ffac37a92cc020991401120564",
      },
    ],
    falsifier: "B fails to evaluate fresh policy or accepts tampered state.",
  },
  {
    n: "P5",
    status: "PENDING",
    title: "Exactly-Once Execution",
    body: "An uncertain network retry or lost acknowledgment cannot duplicate a real-world consequence.",
    scope: "M6-M7 Ambiguous Retry Protocol.",
  },
  {
    n: "P6",
    status: "PENDING",
    title: "Clean Room & BYOS-Off",
    body: "The full Capability OS functions with zero dependency on the legacy backend (BYOS) or founder infrastructure.",
    scope: "Complete legacy backend deactivated, fresh environment clone.",
  },
];

const unprovenTheses = [
  "Cross-physical-host or multi-cloud hot mobility.",
  "Arbitrary database portability (currently scoped to governed VDB states).",
  "Protection against physical hardware extraction (e.g., cold boot attacks).",
  "Dynamic creation of VMs from thin air without an underlying orchestrator (K8s/Hyper-V).",
];

export default function ProofPage() {
  return (
    <HumanAppShell>
      <main className="relative overflow-hidden">
        <AmbientField className="opacity-60" />

        {/* Hero Section */}
        <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-14 pt-20 sm:px-8 md:pb-20 md:pt-28 lg:px-10">
          <PremiumPageIntro
            eyebrow="The Verification Ledger"
            title="Durable capabilities on disposable infrastructure."
            body="Machine A is not the capability. Machine B is not the capability. The capability is the governed continuity across them. Veklom separates durable capability continuity from disposable execution infrastructure, then binds each materialization to fresh authority and verifiable consequence evidence."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/os"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-theme-ink px-6 text-sm font-semibold text-theme-bg shadow-sm hover:opacity-90 transition-opacity"
            >
              Open Capability OS →
            </Link>
            <Link
              href="/vlink"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-theme-border bg-theme-surface px-6 text-sm font-semibold text-theme-ink hover:bg-theme-border/50 transition-colors"
            >
              Connect existing system
            </Link>
          </div>
        </section>

        {/* Live Proof Fabric Probes */}
        <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-16 sm:px-8 md:pb-20 lg:px-10">
          <LiveProofFabric />
        </section>

        {/* Physical Evidence Bundles (Sealed Ground Truth) */}
        <section className="border-t border-theme-border bg-theme-surface/40 py-20 sm:py-24">
          <div className="mx-auto w-full max-w-[1480px] px-5 sm:px-8 lg:px-10">
            <div className="max-w-3xl">
              <StageLabel>Physical Proof Ground Truth</StageLabel>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-theme-ink sm:text-4xl md:text-5xl">
                The 3 Sealed Physical Evidence Bundles
              </h2>
              <p className="mt-4 text-sm leading-7 text-theme-inkDim sm:text-base">
                Every claim in Veklom is grounded in physically executed receipts produced under hypervisor-enforced partition and cold Stop-VM termination. Download each evidence bundle and independently verify its SHA-256 hash against the sealed manifest.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {physicalBundles.map((bundle) => (
                <div
                  key={bundle.runId}
                  className="flex flex-col justify-between rounded-2xl border border-theme-border bg-theme-bg p-6 sm:p-8 shadow-sm transition-all hover:border-theme-ink/30"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                        VERIFIED SEAL
                      </span>
                      <span className="font-mono text-[11px] text-theme-inkDim">
                        {(bundle.sizeBytes / 1024).toFixed(1)} KB
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-semibold tracking-tight text-theme-ink">
                      {bundle.label}
                    </h3>
                    <p className="mt-2 text-xs font-mono text-theme-inkDim">
                      Run ID: {bundle.runId}
                    </p>

                    <p className="mt-4 text-sm leading-6 text-theme-inkDim">
                      {bundle.description}
                    </p>

                    <div className="mt-5 rounded-lg border border-theme-border bg-theme-surface/70 p-3.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-theme-inkDim">
                        Scope &amp; Topology
                      </div>
                      <div className="mt-1 text-xs text-theme-ink">
                        {bundle.scope}
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-theme-border bg-theme-surface/70 p-3.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-theme-inkDim">
                        Exact SHA-256 Digest
                      </div>
                      <div className="mt-1 font-mono text-[11px] break-all select-all text-theme-ink font-semibold">
                        {bundle.sha256}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-theme-border">
                    <a
                      href={bundle.href}
                      download={bundle.filename}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-theme-ink px-4 py-3 text-xs font-semibold text-theme-bg hover:opacity-90 transition-opacity"
                    >
                      <span>↓ Download Evidence JSON</span>
                      <span className="font-mono opacity-70">({bundle.filename.slice(-14)})</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Verification Helper */}
            <div className="mt-8 rounded-xl border border-theme-border bg-theme-surface/80 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-theme-ink">
                    Independent Verification Method
                  </div>
                  <div className="mt-1 text-xs text-theme-inkDim">
                    Confirm bit-for-bit parity of downloaded files against the sealed evidence using standard CLI tools:
                  </div>
                </div>
                <div className="rounded-lg bg-black px-4 py-2.5 font-mono text-[11px] text-emerald-400">
                  Get-FileHash -Algorithm SHA256 public\proofs\*
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 14-Step Mobility Ledger Section (VDB-MOBILITY-P1) */}
        <section className="border-t border-theme-border bg-theme-bg py-20 sm:py-28">
          <div className="mx-auto w-full max-w-[1480px] px-5 sm:px-8 lg:px-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-3xl">
                <StageLabel>Steel-Thread Execution Ledger</StageLabel>
                <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-theme-ink sm:text-4xl md:text-5xl">
                  VDB-MOBILITY-P1: The 14-Step Mobility Ledger
                </h2>
                <p className="mt-4 text-sm leading-7 text-theme-inkDim sm:text-base">
                  The complete sequential execution record (Steps M0 through M13) demonstrating cold state materialization on disposable infrastructure. Proves that durable capability state survives the permanent termination of source Node A, rematerializes on Node B, and advances only upon issuance of fresh, bounded authority.
                </p>
              </div>

              {/* Status Pill Group */}
              <div className="flex flex-wrap gap-2 md:justify-end">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  14/14 Steps Validated
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-medium text-purple-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                  4/4 Adversarial Attacks Blocked
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-theme-border bg-theme-surface px-3.5 py-1 text-xs font-medium text-theme-ink">
                  Run ID: 19579c43
                </span>
              </div>
            </div>

            {/* Mobility Table */}
            <div className="mt-12 overflow-hidden rounded-2xl border border-theme-border bg-theme-surface shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-theme-border bg-theme-surface/90 text-[11px] font-semibold uppercase tracking-wider text-theme-inkDim">
                    <tr>
                      <th className="py-4 px-4 sm:px-6 w-16">Step</th>
                      <th className="py-4 px-4 sm:px-6 min-w-[220px]">Step Name &amp; Operation</th>
                      <th className="py-4 px-4 sm:px-6 min-w-[200px]">Governed Invariant</th>
                      <th className="py-4 px-4 sm:px-6 min-w-[180px]">Event Type</th>
                      <th className="py-4 px-4 sm:px-6 w-32 text-center">Outcome</th>
                      <th className="py-4 px-4 sm:px-6 min-w-[280px]">Execution Telemetry &amp; Invariants</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border bg-theme-bg text-theme-ink">
                    {mobilityLedgerSteps.map((row) => (
                      <tr key={row.step} className="hover:bg-theme-surface/50 transition-colors">
                        <td className="py-4 px-4 sm:px-6 font-mono font-bold text-theme-ink">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-theme-surface border border-theme-border text-xs">
                            {row.step}
                          </span>
                        </td>
                        <td className="py-4 px-4 sm:px-6 font-medium">
                          {row.name}
                        </td>
                        <td className="py-4 px-4 sm:px-6 font-mono text-[11px] text-theme-inkDim">
                          {row.invariant}
                        </td>
                        <td className="py-4 px-4 sm:px-6 font-mono text-[11px] text-theme-ink">
                          <span className="rounded bg-theme-surface px-2 py-1 border border-theme-border/60">
                            {row.eventType}
                          </span>
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-center">
                          {row.outcomeType === "allow" && (
                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">
                              VERIFIED
                            </span>
                          )}
                          {row.outcomeType === "deny" && (
                            <span className="inline-flex items-center rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-purple-700 uppercase tracking-wide">
                              DENIED (PASS)
                            </span>
                          )}
                          {row.outcomeType === "valid" && (
                            <span className="inline-flex items-center rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-700 uppercase tracking-wide">
                              VALID SEAL
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <div className="text-xs text-theme-inkDim leading-relaxed">
                            {row.details}
                          </div>
                          <div className="mt-1 font-mono text-[10px] text-theme-inkDim/70">
                            ts: {row.timestamp}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Verification Ledger Cards (P1 to P6) */}
        <section className="border-y border-theme-border bg-theme-surface/68">
          <div className="mx-auto grid w-full max-w-[1480px] gap-12 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[.72fr_1.28fr] lg:px-10">
            <div>
              <StageLabel>Cryptographic Truth</StageLabel>
              <h2 className="mt-6 max-w-lg text-4xl font-semibold leading-[.98] tracking-[-.055em] text-theme-ink md:text-6xl">
                The proof ledger is physical.
              </h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-theme-inkDim">
                The evidence bundles below were generated on live physical execution domains under real hypervisor constraints. Download the cryptographically bound JSON receipts directly to verify the causal sequence yourself.
              </p>
            </div>

            <div className="grid gap-px overflow-hidden rounded-[26px] border border-theme-border bg-theme-border sm:grid-cols-2">
              {verifiedLedger.map((item) => (
                <article key={item.n} className="min-h-[280px] bg-theme-bg p-7 md:p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-semibold tracking-[.22em] text-theme-inkDim">
                        {item.n}
                      </div>
                      <div
                        className={`text-[10px] font-semibold uppercase tracking-[.2em] px-2 py-1 rounded-full ${
                          item.status.includes("VERIFIED")
                            ? "bg-green-500/10 text-green-700"
                            : "bg-orange-500/10 text-orange-700"
                        }`}
                      >
                        {item.status}
                      </div>
                    </div>
                    <h3 className="mt-8 text-2xl font-semibold tracking-[-.035em] text-theme-ink">
                      {item.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-theme-inkDim">
                      {item.body}
                    </p>
                  </div>

                  {item.evidence && (
                    <div className="mt-6 pt-6 border-t border-theme-border">
                      <div className="text-[10px] font-semibold uppercase tracking-[.2em] text-theme-inkDim mb-3">
                        Cryptographic Evidence
                      </div>
                      <div className="flex flex-col gap-3">
                        {item.evidence.map((ev, i) => (
                          <div key={i} className="rounded-lg border border-theme-border bg-theme-surface p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-theme-ink">{ev.label}</span>
                              <a
                                href={ev.href}
                                download
                                className="text-xs font-mono bg-theme-ink text-theme-bg px-2.5 py-1 rounded hover:opacity-90 transition-opacity"
                              >
                                ↓ JSON
                              </a>
                            </div>
                            {ev.sha256 && (
                              <div className="mt-2 font-mono text-[10px] text-theme-inkDim break-all select-all">
                                SHA-256: {ev.sha256}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Boundary Constraints & Product Surface */}
        <section className="mx-auto w-full max-w-[1480px] px-5 py-24 sm:px-8 md:py-32 lg:px-10">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
            <div className="rounded-[30px] border border-theme-border bg-[#05070b] p-7 text-white sm:p-9 md:p-12">
              <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/42">
                Boundary Constraints
              </div>
              <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-[1.02] tracking-[-.045em] md:text-5xl">
                What we explicitly do not claim.
              </h2>
              <div className="mt-8 space-y-4">
                {unprovenTheses.map((thesis, index) => (
                  <div key={index} className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
                    <p className="text-sm leading-7 text-white/72">{thesis}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-theme-border bg-theme-surface p-7 sm:p-9 md:p-12">
              <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">
                Available today
              </div>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-.045em] text-theme-ink">
                Capability OS is the product surface.
              </h2>
              <p className="mt-5 text-sm leading-7 text-theme-inkDim">
                People should be able to enter the current Capability OS, inspect available capabilities, use the surfaces that are already wired, and connect existing systems through VLink as those routes are brought online. Early access exposes exactly what exists.
              </p>
              <div className="mt-9 grid gap-2">
                <Link
                  href="/os"
                  className="flex min-h-12 items-center justify-between rounded-2xl bg-theme-ink px-4 text-sm font-semibold text-theme-bg"
                >
                  Open Capability OS <span>→</span>
                </Link>
                <Link
                  href="/vlink"
                  className="flex min-h-12 items-center justify-between rounded-2xl border border-theme-border bg-theme-bg px-4 text-sm font-medium text-theme-ink"
                >
                  Connect with VLink <span>↗</span>
                </Link>
                <Link
                  href="/machine"
                  className="flex min-h-12 items-center justify-between rounded-2xl border border-theme-border bg-theme-bg px-4 text-sm font-medium text-theme-ink"
                >
                  Machine surface <span>↗</span>
                </Link>
                <Link
                  href="/conformance"
                  className="flex min-h-12 items-center justify-between rounded-2xl border border-theme-border bg-theme-bg px-4 text-sm font-medium text-theme-ink"
                >
                  Conformance boundary <span>↗</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </HumanAppShell>
  );
}
