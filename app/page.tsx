import React from "react";
import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { originFromHost } from "@/lib/brandMetadata";
import { SIGNUP_URL } from "@/lib/funnel";
import { TrackedLink } from "@/components/TrackedLink";
import { HumanAppShell } from "@/components/shell/HumanAppShell";

// The intro video is dropped into public/intro/ when it is recorded. Until then the slot is not rendered.
const INTRO_VIDEO = "/intro/veklom-intro.mp4";
const INTRO_POSTER = "/intro/veklom-intro-poster.jpg";
const hasIntroVideo = () => existsSync(path.join(process.cwd(), "public", "intro", "veklom-intro.mp4"));
const hasIntroPoster = () => existsSync(path.join(process.cwd(), "public", "intro", "veklom-intro-poster.jpg"));

const steps = [
  { n: "01", title: "Create a VLink", body: "Name what you are connecting: a chat client, an API, an automation, a webhook, a pipeline or a container.", cta: "Start free" },
  { n: "02", title: "Approve the connection", body: "You decide what it may do, what it may spend and how long the permission lasts.", cta: "See how approval works", href: "/vlink" },
  { n: "03", title: "Paste the URL and key", body: "Copy a familiar base URL and a short-lived key into the tool you already use. Nothing else changes.", cta: "Scan to connect", href: "/vlink/connect/" },
];

const connects = [
  { title: "OpenAI-compatible clients", body: "Point the client you already use at a Veklom base URL." },
  { title: "APIs", body: "Keep calling your API. Consequential actions are governed behind the link." },
  { title: "MCP and automation", body: "Give an agent or automation bounded capability, not a blank check." },
  { title: "Webhooks", body: "Receive and act on events inside limits you approved." },
  { title: "CI/CD", body: "Let a pipeline run governed steps and leave a record." },
  { title: "Containers", body: "Run containerized work under the same limits and the same record." },
];

const gives = [
  { title: "Limits you set", body: "Every action runs inside the permissions, budget and time window you approved." },
  { title: "A record of what happened", body: "Each action leaves evidence you can inspect, even after the work is finished." },
  { title: "Honest status", body: "Veklom shows what is live and what is not yet proven, and keeps unknown outcomes marked unknown." },
];

// Share card comes from the root layout (per host); only the canonical is page-specific.
export async function generateMetadata(): Promise<Metadata> {
  const origin = originFromHost((await headers()).get("host"));
  return { alternates: { canonical: `${origin}/` } };
}

const eyebrow = "text-[10px] font-semibold uppercase tracking-[.22em] text-theme-inkDim";
const heading = "font-semibold leading-[1.02] tracking-[-.045em] text-theme-ink";
const primaryBtn = "group inline-flex min-h-12 items-center justify-center gap-4 rounded-full bg-theme-ink px-6 text-sm font-semibold text-theme-bg transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(0,0,0,.18)]";
const secondaryBtn = "inline-flex min-h-12 items-center justify-center rounded-full border border-theme-border bg-theme-surface px-6 text-sm font-semibold text-theme-ink transition hover:border-theme-ink/20";
const container = "mx-auto w-full max-w-[1120px] px-5 sm:px-8";

export default function LandingPage() {
  const video = hasIntroVideo();
  const poster = hasIntroPoster();
  return (
    <HumanAppShell>
      <div className="relative overflow-hidden">
        {/* Hero */}
        <section className={`${container} flex flex-col items-center pb-14 pt-20 text-center md:pb-20 md:pt-28`}>
          <div className={eyebrow}>Governed compute, in plain terms</div>
          <h1 className={`${heading} mt-7 text-[clamp(2.75rem,6.4vw,5.5rem)]`}>
            Give machines capability.<br /><span className="text-theme-inkDim">Not a blank check.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-theme-inkDim">
            Tell it what you want done. Veklom does the work inside limits you set, and keeps a record of everything it did.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <TrackedLink href={SIGNUP_URL} eventName="start_free_vlink" ctaLabel="Start free with VLink" ctaLocation="home_hero" data-analytics-cta="start-free-vlink:hero" className={primaryBtn}>
              Start free with VLink <span className="transition-transform group-hover:translate-x-1">→</span>
            </TrackedLink>
            <TrackedLink href="/os" eventName="capability_os_open" ctaLabel="Open Capability OS" ctaLocation="home_hero" className={secondaryBtn}>
              Open Capability OS
            </TrackedLink>
          </div>
          <p className="mt-4 text-[11px] text-theme-inkDim">14-day full-access trial · no card required</p>
        </section>

        {/* Intro video: someone types a request into the chatbot and it runs. Rendered only once the file exists. */}
        {video ? (
          <section className={`${container} pb-20 md:pb-28`} data-testid="intro-video">
            <div className="overflow-hidden rounded-[32px] border border-theme-border bg-theme-surface/75 p-3 sm:p-5">
              <video
                className="aspect-video w-full rounded-[22px] border border-theme-border bg-theme-surface"
                src={INTRO_VIDEO}
                poster={poster ? INTRO_POSTER : undefined}
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="metadata"
                aria-label="Typing a request into Veklom and watching it run"
              />
            </div>
          </section>
        ) : null}

        {/* VLink */}
        <section className={`${container} pb-20 md:pb-28`}>
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className={eyebrow}>VLink</div>
              <h2 className={`${heading} mt-4 text-4xl md:text-5xl`}>Keep the tools you already use.<br />Then things get moving.</h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-theme-inkDim">
              Create one VLink and Veklom governs the consequential actions behind it. Three steps, and your existing client keeps working.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.n} className="flex flex-col rounded-[24px] border border-theme-border bg-theme-surface p-7">
                <div className="text-[11px] font-semibold tracking-[.2em] text-theme-inkDim">{step.n}</div>
                <h3 className="mt-6 text-xl font-semibold tracking-[-.03em] text-theme-ink">{step.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-theme-inkDim">{step.body}</p>
                <TrackedLink href={step.href ?? SIGNUP_URL} eventName={step.href ? "vlink_connect_start" : "start_free_vlink"} ctaLabel={step.cta} ctaLocation="home_vlink" className="mt-6 text-xs font-semibold text-theme-ink underline-offset-4 hover:underline">
                  {step.cta} →
                </TrackedLink>
              </article>
            ))}
          </div>
        </section>

        {/* What it connects to */}
        <section className="border-y border-theme-border bg-theme-surface/68">
          <div className={`${container} py-20 md:py-28`}>
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <div className={eyebrow}>Works with what you have</div>
                <h2 className={`${heading} mt-4 text-4xl md:text-5xl`}>Connect it once.<br />Keep working the way you do.</h2>
              </div>
              <TrackedLink href="/vlink/connect/" eventName="vlink_connect_start" ctaLabel="Try VLink" ctaLocation="home_connects" className={secondaryBtn}>Try VLink</TrackedLink>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {connects.map((item) => (
                <article key={item.title} className="rounded-[24px] border border-theme-border bg-theme-bg p-6">
                  <h3 className="text-lg font-semibold tracking-[-.02em] text-theme-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-theme-inkDim">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* What you get */}
        <section className={`${container} py-20 md:py-28`}>
          <div className="grid gap-10 md:grid-cols-[.8fr_1.2fr] md:gap-16">
            <div>
              <div className={eyebrow}>What you get</div>
              <h2 className={`${heading} mt-4 text-4xl md:text-5xl`}>Work that stays inside the lines.</h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-[24px] border border-theme-border bg-theme-border">
              {gives.map((item) => (
                <article key={item.title} className="bg-theme-surface p-6 md:p-7">
                  <h3 className="text-lg font-semibold tracking-[-.02em] text-theme-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-theme-inkDim">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Other ways in: the machine side, Capability OS and the get-started route stay one click from the landing page. */}
        <section className={`${container} pb-20 md:pb-28`}>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "For machines", body: "The machine-readable surface: agent card, MCP, wallet and conformance for software that connects on its own.", href: "/machine", event: "machine_surface_open", cta: "For Machines" },
              { title: "Capability OS", body: "Inspect available capabilities, use what is already wired and see what is proven.", href: "/os", event: "capability_os_open", cta: "Open Capability OS" },
              { title: "Get Veklom", body: "Choose how you want to start and what you want to connect first.", href: "/get", event: "get_veklom_start", cta: "Get Veklom" },
            ].map((item) => (
              <article key={item.title} className="flex flex-col rounded-[24px] border border-theme-border bg-theme-surface p-7">
                <h3 className="text-xl font-semibold tracking-[-.03em] text-theme-ink">{item.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-theme-inkDim">{item.body}</p>
                <TrackedLink href={item.href} eventName={item.event} ctaLabel={item.cta} ctaLocation="home_more" className="mt-6 text-xs font-semibold text-theme-ink underline-offset-4 hover:underline">
                  {item.cta} →
                </TrackedLink>
              </article>
            ))}
          </div>
        </section>

        {/* Final call to action */}
        <section className={`${container} flex flex-col items-center pb-24 text-center md:pb-32`}>
          <h2 className={`${heading} max-w-2xl text-4xl md:text-6xl`}>Good work starts with a connection.</h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-theme-inkDim">Create your first VLink. Use the tools you already have, with the limits you choose.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <TrackedLink href={SIGNUP_URL} eventName="start_free_vlink" ctaLabel="Start free with VLink" ctaLocation="home_footer" data-analytics-cta="start-free-vlink:footer" className={primaryBtn}>
              Start free with VLink <span className="transition-transform group-hover:translate-x-1">→</span>
            </TrackedLink>
            <TrackedLink href="/proof" eventName="proof_inspect" ctaLabel="Inspect proof" ctaLocation="home_footer" className={secondaryBtn}>
              Inspect the proof
            </TrackedLink>
          </div>
          <div className="mt-10" data-testid="product-hunt-badge">
            <a href="https://www.producthunt.com/products/veklom?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-veklom" target="_blank" rel="noopener noreferrer">
              <img alt="Veklom - Give machines capability. Not a blank check. | Product Hunt" width={250} height={54} src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1275205&theme=dark&t=1791572797882" />
            </a>
          </div>
        </section>
      </div>
    </HumanAppShell>
  );
}
