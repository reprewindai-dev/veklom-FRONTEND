import React from "react";
import Link from "next/link";
import { TrackedLink } from "@/components/TrackedLink";
import { SIGNUP_URL } from "@/lib/funnel";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { AmbientField, StageLabel } from "@/components/brand/PremiumPrimitives";
import { ContinuityBlogSection } from "@/components/blog/ContinuityBlogSection";

const integrations = [
  "Claude",
  "OpenAI",
  "Cursor",
  "LangChain",
  "CrewAI",
  "Day.ai",
  "Microsoft 365",
  "AWS Bedrock",
  "Snowflake",
  "PostgreSQL",
];

const lifecycleSteps = [
  { num: "01", name: "Discover" },
  { num: "02", name: "Intent" },
  { num: "03", name: "Compile DAG" },
  { num: "04", name: "Policy Fence" },
  { num: "05", name: "VLink Lease" },
  { num: "06", name: "Human Gate" },
  { num: "07", name: "Execute & Burn" },
  { num: "08", name: "PGL Receipt" },
];

export default function LandingPage() {
  return (
    <HumanAppShell>
      <div className="relative overflow-hidden bg-theme-bg text-theme-ink">
        <AmbientField />

        {/* Top Notice Banner: Direct counter to Trust3's Gartner banner */}
        <div className="relative z-20 flex items-center justify-center border-b border-theme-border bg-gradient-to-r from-blue-900/90 via-indigo-950 to-slate-950 px-4 py-2.5 text-xs text-white">
          <div className="flex flex-wrap items-center justify-center gap-2 text-center">
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-300 border border-blue-400/30">
              New
            </span>
            <span className="font-medium text-slate-200">
              The Systems Failure Atlas &amp; Continuous Falsification Report (ATLAS-FAIL-2026-02)
            </span>
            <Link
              href="/proof"
              className="inline-flex items-center gap-1 font-semibold text-blue-400 underline underline-offset-4 hover:text-white transition"
            >
              Inspect the physical proofs <span>→</span>
            </Link>
          </div>
        </div>

        {/* Hero Section: Mirroring Trust3 layout, but dominating with VLink */}
        <section className="relative mx-auto w-full max-w-[1440px] px-5 pt-16 pb-20 text-center sm:px-8 md:pt-24 md:pb-28 lg:px-10">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-theme-border bg-theme-surface/80 px-4 py-1.5 text-xs font-semibold tracking-wide text-theme-inkDim backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              THE CONSEQUENCE CONTROL PLANE · POWERED BY VLINK
            </div>

            <h1 className="text-[clamp(2.75rem,6.5vw,5.5rem)] font-bold leading-[1.04] tracking-[-0.04em] text-theme-ink">
              Secure Agents <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Everywhere</span>
              <br />
              And Everything They Touch (<span className="text-blue-500">VLink</span>)
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-theme-inkDim sm:text-lg sm:leading-8">
              Discover, observe, and physically govern autonomous AI agents and the tools they reach across every cloud, model, and framework — backed by Law 0 single-use capability leases, zero ambient authority, and cryptographic receipts. Not passive proxy logs.
            </p>

            {/* Hero CTAs */}
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <TrackedLink
                href={SIGNUP_URL}
                eventName="start_free_vlink"
                ctaLabel="Start free with VLink"
                ctaLocation="home_hero_primary"
                data-analytics-cta="start-free-vlink:hero"
                className="group inline-flex min-h-13 items-center justify-center gap-3 rounded-full bg-blue-600 px-8 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(37,99,235,0.28)] transition duration-300 hover:bg-blue-700 hover:-translate-y-0.5"
              >
                Start free with VLink <span className="transition-transform group-hover:translate-x-1">→</span>
              </TrackedLink>

              <TrackedLink
                href="/proof"
                eventName="proof_inspect"
                ctaLabel="Inspect the Failure Atlas"
                ctaLocation="home_hero_atlas"
                className="inline-flex min-h-13 items-center justify-center rounded-full border border-theme-border bg-theme-surface px-7 text-sm font-semibold text-theme-ink shadow-sm transition hover:border-theme-ink/30 hover:bg-theme-surface/90"
              >
                Inspect the Failure Atlas
              </TrackedLink>

              <TrackedLink
                href="/get"
                eventName="get_veklom_start"
                ctaLabel="Get Veklom"
                ctaLocation="home_hero_get"
                className="inline-flex min-h-13 items-center justify-center rounded-full border border-theme-border bg-theme-surface px-6 text-sm font-semibold text-theme-ink shadow-sm transition hover:border-theme-ink/30"
              >
                Get Veklom
              </TrackedLink>

              <TrackedLink
                href="/os"
                eventName="capability_os_open"
                ctaLabel="Open Capability OS"
                ctaLocation="home_hero_os"
                className="inline-flex min-h-13 items-center justify-center rounded-full border border-theme-border bg-theme-surface px-6 text-sm font-semibold text-theme-ink shadow-sm transition hover:border-theme-ink/30"
              >
                Open Capability OS
              </TrackedLink>
            </div>

            {/* Product Hunt Badge */}
            <div className="mt-8 flex justify-center" data-testid="product-hunt-badge">
              <a
                href="https://www.producthunt.com/products/veklom?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-veklom"
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Veklom - Give machines capability. Not a blank check. | Product Hunt"
                  width={250}
                  height={54}
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1275205&theme=dark&t=1791572797882"
                />
              </a>
            </div>

            {/* Integration Logos Bar */}
            <div className="mt-14 border-t border-theme-border pt-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-inkDim">
                Connects across any model, agent framework, or enterprise platform
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs font-semibold text-theme-inkDim/80">
                {integrations.map((item) => (
                  <span key={item} className="transition hover:text-theme-ink">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* The Pain Section: Matching Trust3's exact deep dark navy container */}
        <section className="relative mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8 lg:px-10">
          <div className="relative overflow-hidden rounded-[32px] border border-blue-950/60 bg-[#070d1e] p-8 text-white shadow-[0_24px_80px_rgba(7,13,30,0.4)] md:p-14">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-400">
                  The Ambient Authority Crisis
                </span>
                <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.03em] sm:text-4xl md:text-5xl">
                  Agents You&rsquo;d Never Approve Are Already Running
                </h2>
                <p className="mt-5 text-sm leading-7 text-slate-300 md:text-base md:leading-8">
                  Developers and teams are deploying autonomous agents with broad API tokens and database keys behind your firewall. Legacy security proxies watch them run and log alerts after the damage is done. In physical reality, the approval gate fails at three points:
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
                <div className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                  Physical Execution Invariant
                </div>
                <div className="mt-3 text-lg font-bold text-white">
                  Computational Possession &ne; Consequence Authority
                </div>
                <p className="mt-2 text-xs leading-6 text-slate-300">
                  An agent having an API key in RAM does not grant the right to execute external reality mutations. Without single-use capability leases burned at the sink, your database is unprotected.
                </p>
              </div>
            </div>

            {/* 3 Failure Points Cards */}
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-blue-500/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-400 font-bold">
                  ✕
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">The Blind Agent</h3>
                <p className="mt-2 text-xs leading-6 text-slate-300">
                  Agents run across fragmented frameworks without cryptographic identity binding. They carry ambient access across internal endpoints, impossible to inventory or tie to a specific human authority.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-blue-500/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-400 font-bold">
                  ✕
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">The Blank Check</h3>
                <p className="mt-2 text-xs leading-6 text-slate-300">
                  Static long-lived bearer tokens and database credentials grant unlimited spending. When an agent loops or gets prompt-injected, a passive proxy has zero authority to stop money leaving your account.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-blue-500/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-400 font-bold">
                  ✕
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">The Runaway Action</h3>
                <p className="mt-2 text-xs leading-6 text-slate-300">
                  Proxies only log JSON alerts after the external mutation has already committed. A dropped network packet or retry triggers duplicate bank debits, repeated emails, and double commits (&Delta;C &gt; 0).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* "Approve With Confidence" Section: Turning the tables with VLink */}
        <section className="relative mx-auto w-full max-w-[1440px] px-5 py-20 text-center sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl">
            <StageLabel>The VLink Difference</StageLabel>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-theme-ink sm:text-4xl md:text-5xl">
              Approve <span className="text-blue-600">With Confidence</span>
            </h2>
            <p className="mt-4 text-sm leading-7 text-theme-inkDim md:text-base">
              Why passive proxies fail — and how VLink transducer wires enforce absolute consequence boundaries.
            </p>

            {/* Interactive Mode Pills */}
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-theme-border bg-theme-surface p-1.5 text-xs font-semibold">
              <span className="rounded-full bg-blue-600 px-4 py-2 text-white shadow-sm">
                01. Discover
              </span>
              <span className="rounded-full px-4 py-2 text-theme-inkDim hover:text-theme-ink">
                02. Observe
              </span>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-blue-700 font-bold dark:bg-blue-950/40 dark:text-blue-300">
                03. Authorize (VLink)
              </span>
            </div>
          </div>

          <div className="mt-12 grid gap-6 text-left md:grid-cols-2">
            <div className="rounded-3xl border border-red-200 bg-red-50/40 p-8 dark:border-red-950/50 dark:bg-red-950/10">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                What Legacy Proxies Call &ldquo;Security&rdquo;
              </span>
              <h3 className="mt-3 text-xl font-bold text-theme-ink">
                Prompt Filters &amp; Ingress Proxies
              </h3>
              <p className="mt-3 text-sm leading-7 text-theme-inkDim">
                Legacy tools inspect JSON prompts as they pass through a proxy. But they have zero control over the physical database engine or destination sink. If an agent hallucinates a valid tool argument, the proxy lets it pass — and the transaction commits permanently.
              </p>
            </div>

            <div className="rounded-3xl border border-blue-200 bg-blue-50/50 p-8 dark:border-blue-950/50 dark:bg-blue-950/10">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                What Veklom Delivers
              </span>
              <h3 className="mt-3 text-xl font-bold text-theme-ink">
                VLink Transducer Wire &amp; Law 0
              </h3>
              <p className="mt-3 text-sm leading-7 text-theme-inkDim">
                Tool calls are converted into cryptographically bounded, single-use capability leases (120s TTL). Without an explicit, unburned permit validated at the physical storage engine, any execution attempt produces strict &Delta;C = 0.
              </p>
            </div>
          </div>
        </section>

        {/* One Control Plane Architecture (Mirroring Trust3's 3-Layer Diagram) */}
        <section className="relative mx-auto w-full max-w-[1440px] px-5 py-12 sm:px-8 lg:px-10">
          <div className="rounded-3xl border border-theme-border bg-theme-surface/70 p-8 md:p-14">
            <div className="text-center">
              <StageLabel>Architecture</StageLabel>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-theme-ink sm:text-4xl md:text-5xl">
                One Control Plane To Secure Agents,
                <br />
                <span className="text-blue-600">Attack Surfaces &amp; The Data Behind Them</span>
              </h2>
            </div>

            {/* 3-Tier Layer Stack */}
            <div className="mt-12 space-y-4">
              {/* Layer 1: Agents */}
              <div className="rounded-2xl border border-theme-border bg-theme-bg p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                      Tier 1 · Untrusted Agent Runtimes
                    </span>
                    <h3 className="text-lg font-bold text-theme-ink">Any AI Model, Framework, or Local Worker</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-medium text-theme-inkDim">
                    <span className="rounded-lg bg-theme-surface border border-theme-border px-3 py-1.5">Claude 3.7 / 3.5</span>
                    <span className="rounded-lg bg-theme-surface border border-theme-border px-3 py-1.5">OpenAI o3 / GPT-4o</span>
                    <span className="rounded-lg bg-theme-surface border border-theme-border px-3 py-1.5">Cursor</span>
                    <span className="rounded-lg bg-theme-surface border border-theme-border px-3 py-1.5">LangChain</span>
                    <span className="rounded-lg bg-theme-surface border border-theme-border px-3 py-1.5">Local Groq / LPUs</span>
                  </div>
                </div>
              </div>

              {/* Layer 2: VLink Transducer Wire (The killer feature Trust3 lacks) */}
              <div className="rounded-2xl border-2 border-blue-500/40 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 p-6 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      Tier 2 · VLink Consequence Transducer (The Missing Layer Proxies Forgot)
                    </span>
                    <h3 className="text-lg font-bold text-theme-ink">Single-Use Leases · 2-of-3 ESTOP Quorum · Replay Interceptor</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-medium">
                    <span className="rounded-lg bg-blue-600 text-white px-3 py-1.5 font-semibold">120s Leases</span>
                    <span className="rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 px-3 py-1.5">236 ops/sec</span>
                    <span className="rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 px-3 py-1.5">0.051 ms Quorum</span>
                    <span className="rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 px-3 py-1.5">Strict &Delta;C = 0</span>
                  </div>
                </div>
              </div>

              {/* Layer 3: Physical Reality Sinks */}
              <div className="rounded-2xl border border-theme-border bg-theme-bg p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      Tier 3 · Physical Reality Sinks &amp; Storage Guards
                    </span>
                    <h3 className="text-lg font-bold text-theme-ink">Databases, Financial Rails, and Enterprise APIs</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-medium text-theme-inkDim">
                    <span className="rounded-lg bg-theme-surface border border-theme-border px-3 py-1.5">Microsoft 365 (Teams, OneDrive)</span>
                    <span className="rounded-lg bg-theme-surface border border-theme-border px-3 py-1.5">Snowflake</span>
                    <span className="rounded-lg bg-theme-surface border border-theme-border px-3 py-1.5">PostgreSQL</span>
                    <span className="rounded-lg bg-theme-surface border border-theme-border px-3 py-1.5">Stripe</span>
                    <span className="rounded-lg bg-theme-surface border border-theme-border px-3 py-1.5">PGL / Gnomledger</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center text-xs text-theme-inkDim">
              Trust3 observes prompts. Veklom governs physical consequences. Connect once with VLink — zero proprietary agent SDK rewrites required.
            </div>
          </div>
        </section>

        {/* "Secured at Every Stage" Lifecycle Ribbon */}
        <section className="relative mx-auto w-full max-w-[1440px] px-5 py-16 text-center sm:px-8 lg:px-10">
          <StageLabel>End-to-End Pipeline</StageLabel>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-theme-ink sm:text-4xl">
            Secured at <span className="text-blue-600">Every Stage</span>
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {lifecycleSteps.map((step) => (
              <div
                key={step.num}
                className="flex flex-col items-center justify-center rounded-2xl border border-theme-border bg-theme-surface p-4 text-center transition hover:border-blue-500/40"
              >
                <span className="text-[10px] font-mono font-bold text-blue-600">{step.num}</span>
                <span className="mt-1 text-xs font-semibold text-theme-ink">{step.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Console Preview Section: "One Console, Every Consequence" */}
        <section className="relative mx-auto w-full max-w-[1440px] px-5 py-12 sm:px-8 lg:px-10">
          <div className="rounded-3xl border border-theme-border bg-theme-surface/75 p-8 md:p-14">
            <div className="text-center">
              <StageLabel>Task-Centric Workspace</StageLabel>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-theme-ink sm:text-4xl md:text-5xl">
                One Console, <span className="text-blue-600">Every Consequence</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-theme-inkDim">
                Inspect live capabilities, watch real DAG state transitions, and audit cryptographic receipts in real time.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-theme-border bg-theme-bg p-6">
                <h3 className="text-base font-bold text-theme-ink">Task Workspace</h3>
                <p className="mt-2 text-xs leading-6 text-theme-inkDim">
                  Describe an outcome in natural language; Veklom automatically compiles the execution DAG, checks required capabilities, and enforces approval gates.
                </p>
                <TrackedLink href="/os" eventName="workspace_open" ctaLabel="Open Workspace" ctaLocation="console_cards" className="mt-4 inline-block text-xs font-semibold text-blue-600 hover:underline">
                  Open Workspace →
                </TrackedLink>
              </div>

              <div className="rounded-2xl border border-theme-border bg-theme-bg p-6">
                <h3 className="text-base font-bold text-theme-ink">12 Governed Computes</h3>
                <p className="mt-2 text-xs leading-6 text-theme-inkDim">
                  Real-time telemetry dials connecting ABIDE, CAPPO, cAPI, LockerPhycer, and Gnomledger with zero ambient authority and zero phantom mass.
                </p>
                <TrackedLink href="/os/govern" eventName="govern_open" ctaLabel="Inspect Dial" ctaLocation="console_cards" className="mt-4 inline-block text-xs font-semibold text-blue-600 hover:underline">
                  Inspect Dials →
                </TrackedLink>
              </div>

              <div className="rounded-2xl border border-theme-border bg-theme-bg p-6">
                <h3 className="text-base font-bold text-theme-ink">Dual-Track Evidence</h3>
                <p className="mt-2 text-xs leading-6 text-theme-inkDim">
                  4-part human understanding packets alongside machine-verifiable GraphQL and WebMCP cryptographic dual-state receipts.
                </p>
                <TrackedLink href="/os/evidence" eventName="evidence_open" ctaLabel="View Receipts" ctaLocation="console_cards" className="mt-4 inline-block text-xs font-semibold text-blue-600 hover:underline">
                  View Receipts →
                </TrackedLink>
              </div>
            </div>
          </div>
        </section>

        {/* Protocol Layer Dark Section: Mirroring Trust3 bottom container */}
        <section className="relative mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8 lg:px-10">
          <div className="relative overflow-hidden rounded-[32px] border border-blue-950/60 bg-[#070d1e] p-8 text-white md:p-14">
            <div className="text-center">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-400">
                Low-Level Silicon Safety
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] sm:text-4xl md:text-5xl">
                Observability And Authorization, At The Protocol Layer
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h3 className="text-lg font-bold text-white">Data Security &amp; PGL Ledger</h3>
                <p className="mt-2 text-xs leading-6 text-slate-300">
                  Every external mutation writes an immutable dual-state receipt recording stateBefore, stateAfter, monotonic epoch, and SHA-256 proof hashes. Replay attacks are intercepted in 0ms.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h3 className="text-lg font-bold text-white">MCP Security (3,605 Tools)</h3>
                <p className="mt-2 text-xs leading-6 text-slate-300">
                  Model Context Protocol servers are treated as untrusted by default. Connect tools sovereignly: Microsoft Teams, OneDrive, Outlook MSAL, or custom stdio binaries under strict TTL leases.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h3 className="text-lg font-bold text-white">A2A &amp; 2-of-3 ESTOP Quorum</h3>
                <p className="mt-2 text-xs leading-6 text-slate-300">
                  Identity travels through the delegation chain with zero ambient authority. Features an institutional 2-of-3 Multi-Party Emergency Stop Quorum that halts estate automation in 0.051 ms.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Physical Numbers Section (Replacing Trust3's vague claims with real silicon numbers) */}
        <section className="relative mx-auto w-full max-w-[1440px] px-5 py-20 text-center sm:px-8 lg:px-10">
          <StageLabel>Silicon Telemetry</StageLabel>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-theme-ink sm:text-4xl">
            What Veklom Delivers, <span className="text-blue-600">In Physical Numbers</span>
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-theme-border bg-theme-surface p-7">
              <div className="text-4xl font-extrabold text-blue-600">0.051 ms</div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-theme-ink">ESTOP Propagation</div>
              <p className="mt-2 text-xs leading-5 text-theme-inkDim">2-of-3 cryptographic killswitch halts all active workers in 1.03 ms</p>
            </div>

            <div className="rounded-2xl border border-theme-border bg-theme-surface p-7">
              <div className="text-4xl font-extrabold text-blue-600">100%</div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-theme-ink">Consequence Denial</div>
              <p className="mt-2 text-xs leading-5 text-theme-inkDim">1,000/1,000 post-ESTOP mutations physically blocked with strict &Delta;C = 0</p>
            </div>

            <div className="rounded-2xl border border-theme-border bg-theme-surface p-7">
              <div className="text-4xl font-extrabold text-blue-600">236 ops/s</div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-theme-ink">VLink Transducer</div>
              <p className="mt-2 text-xs leading-5 text-theme-inkDim">500/500 replay attacks caught as read-only historical readbacks</p>
            </div>

            <div className="rounded-2xl border border-theme-border bg-theme-surface p-7">
              <div className="text-4xl font-extrabold text-blue-600">0.90 KB</div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-theme-ink">Memory Leak Differential</div>
              <p className="mt-2 text-xs leading-5 text-theme-inkDim">Over 50 consecutive browser session lifecycles (verified zero leak)</p>
            </div>
          </div>
        </section>

        {/* Public Proof Center & Failure Atlas Callout */}
        <section className="relative mx-auto w-full max-w-[1440px] px-5 py-12 sm:px-8 lg:px-10">
          <div className="rounded-3xl border border-theme-border bg-gradient-to-r from-slate-900 to-blue-950 p-8 text-white md:p-14">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  Continuous Falsification Standard
                </span>
                <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
                  Don&rsquo;t Trust Us. Inspect the Failure Atlas.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  Every claim is linked to a reproducible test, observable artifact, or explicitly stated residual risk. Untested assumptions remain open risks until verified.
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href="/proof"
                  eventName="proof_inspect"
                  ctaLabel="Open Failure Atlas"
                  ctaLocation="proof_banner"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-slate-950 shadow-md transition hover:bg-slate-100"
                >
                  Open Failure Atlas →
                </TrackedLink>
              </div>
            </div>
          </div>
        </section>

        {/* The Continuity Framework Blog: Thought Leadership */}
        <ContinuityBlogSection />

        {/* Final CTA Section */}
        <section className="relative mx-auto w-full max-w-[1440px] px-5 py-24 text-center sm:px-8 md:py-32 lg:px-10">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-4xl font-bold tracking-[-0.04em] text-theme-ink md:text-6xl">
              Good work starts with a connection.
            </h2>
            <p className="mt-5 text-base leading-8 text-theme-inkDim">
              Create your first VLink. Use the tools you already have, with the limits you choose.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <TrackedLink
                href={SIGNUP_URL}
                eventName="start_free_vlink"
                ctaLabel="Start free with VLink"
                ctaLocation="home_footer"
                data-analytics-cta="start-free-vlink:footer"
                className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-blue-600 px-8 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(37,99,235,0.28)] transition hover:bg-blue-700 hover:-translate-y-0.5"
              >
                Start free with VLink <span className="transition-transform group-hover:translate-x-1">→</span>
              </TrackedLink>

              <TrackedLink
                href="/proof"
                eventName="proof_inspect"
                ctaLabel="Inspect the Failure Atlas"
                ctaLocation="home_footer"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-theme-border bg-theme-surface px-7 text-sm font-semibold text-theme-ink shadow-sm transition hover:border-theme-ink/30"
              >
                Inspect the Failure Atlas
              </TrackedLink>

              <TrackedLink
                href="/vlink/connect/"
                eventName="vlink_connect_start"
                ctaLabel="Try VLink now"
                ctaLocation="home_footer"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-theme-border bg-theme-surface px-6 text-sm font-semibold text-theme-ink shadow-sm transition hover:border-theme-ink/30"
              >
                Try VLink now
              </TrackedLink>
            </div>
          </div>
        </section>
      </div>
    </HumanAppShell>
  );
}
