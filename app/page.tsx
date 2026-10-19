import React from "react";
import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { originFromHost } from "@/lib/brandMetadata";
import { SIGNUP_URL } from "@/lib/funnel";
import { TrackedLink } from "@/components/TrackedLink";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { AmbientField, StageLabel } from "@/components/brand/PremiumPrimitives";

// The intro video is dropped into public/intro/ when it is recorded. Until then the slot is not rendered.
const INTRO_VIDEO = "/intro/veklom-intro.mp4";
const INTRO_POSTER = "/intro/veklom-intro-poster.jpg";
const hasIntroVideo = () => existsSync(path.join(process.cwd(), "public", "intro", "veklom-intro.mp4"));
const hasIntroPoster = () => existsSync(path.join(process.cwd(), "public", "intro", "veklom-intro-poster.jpg"));

const steps = [
  { n: "1", title: "Create a VLink", body: "Name what you are connecting: a chat client, an API, an automation, a webhook, a pipeline or a container." },
  { n: "2", title: "Approve the connection", body: "You decide what it may do, what it may spend and how long the permission lasts." },
  { n: "3", title: "Paste the URL and key", body: "Copy a familiar base URL and a short-lived key into the tool you already use. Nothing else changes." },
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

const primaryBtn = "group inline-flex min-h-14 items-center justify-center gap-5 rounded-full bg-theme-ink px-7 text-sm font-semibold text-theme-bg shadow-[0_20px_55px_rgba(0,0,0,.16)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_70px_rgba(0,0,0,.22)]";
const secondaryBtn = "inline-flex min-h-14 items-center justify-center rounded-full border border-theme-border bg-theme-surface/70 px-7 text-sm font-semibold text-theme-ink backdrop-blur transition hover:border-theme-ink/20 hover:bg-theme-surface";

export default function LandingPage() {
  const video = hasIntroVideo();
  const poster = hasIntroPoster();
  return (
    <HumanAppShell>
      <div className="relative overflow-hidden">
        <AmbientField />

        <section className="relative mx-auto flex w-full max-w-[1100px] flex-col items-center px-5 pb-10 pt-20 text-center sm:px-8 md:pb-14 md:pt-28">
          <h1 className="text-[clamp(3rem,7.4vw,6.6rem)] font-semibold leading-[.9] tracking-[-.07em] text-theme-ink">
            Give machines capability.<br /><span className="text-theme-inkDim">Not a blank check.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-theme-inkDim md:text-[1.3rem] md:leading-9">
            Tell it what you want done. Veklom does the work inside limits you set, and keeps a record of everything it did.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <div className="flex flex-col items-center gap-2">
              <TrackedLink href={SIGNUP_URL} eventName="start_free_vlink" ctaLabel="Start free with VLink" ctaLocation="home_hero" data-analytics-cta="start-free-vlink:hero" className={primaryBtn}>
                Start free with VLink <span className="transition-transform group-hover:translate-x-1">→</span>
              </TrackedLink>
              <span className="text-[11px] text-theme-inkDim">14-day full-access trial · no card required</span>
            </div>
            <TrackedLink href="/os" eventName="capability_os_open" ctaLabel="Open Capability OS" ctaLocation="home_hero" className={`${secondaryBtn} sm:-mt-5`}>
              Open Capability OS
            </TrackedLink>
          </div>
        </section>

        {video ? (
          <section className="relative mx-auto w-full max-w-[1100px] px-5 pb-16 sm:px-8 md:pb-24" data-testid="intro-video">
            <div className="overflow-hidden rounded-[28px] border border-theme-border bg-theme-surface shadow-[0_40px_120px_rgba(2,8,23,.12)]">
              <video
                className="aspect-video w-full"
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

        <section className="relative mx-auto w-full max-w-[1100px] px-5 py-16 sm:px-8 md:py-24">
          <div className="text-center">
            <StageLabel>VLink</StageLabel>
            <h2 className="mt-6 text-4xl font-semibold leading-[.98] tracking-[-.055em] text-theme-ink md:text-6xl">Keep the tools you already use.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-theme-inkDim md:text-lg">
              Create one VLink and Veklom governs the consequential actions behind it. Works with OpenAI-compatible clients, APIs, MCP and automation, webhooks, CI/CD and containers.
            </p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[26px] border border-theme-border bg-theme-border md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.n} className="bg-theme-surface p-7 md:p-8">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-theme-border text-xs font-semibold text-theme-ink">{step.n}</div>
                <h3 className="mt-8 text-xl font-semibold tracking-[-.03em] text-theme-ink">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-theme-inkDim">{step.body}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <TrackedLink href={SIGNUP_URL} eventName="start_free_vlink" ctaLabel="Start free with VLink" ctaLocation="home_vlink" data-analytics-cta="start-free-vlink:mid" className={primaryBtn}>
              Start free with VLink <span className="transition-transform group-hover:translate-x-1">→</span>
            </TrackedLink>
            <TrackedLink href="/vlink/connect/" eventName="vlink_connect_start" ctaLabel="Scan to connect" ctaLocation="home_vlink" className={secondaryBtn}>
              Scan to connect →
            </TrackedLink>
          </div>
        </section>

        <section className="relative border-y border-theme-border bg-theme-surface/68 backdrop-blur-xl">
          <div className="mx-auto w-full max-w-[1100px] px-5 py-16 sm:px-8 md:py-24">
            <h2 className="text-center text-3xl font-semibold tracking-[-.045em] text-theme-ink md:text-5xl">What you get</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {gives.map((item) => (
                <article key={item.title}>
                  <h3 className="text-lg font-semibold tracking-[-.02em] text-theme-ink">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-theme-inkDim">{item.body}</p>
                </article>
              ))}
            </div>
            <p className="mt-12 text-center text-sm text-theme-inkDim">
              Want the details? <TrackedLink href="/proof" eventName="proof_inspect" ctaLabel="Inspect proof" ctaLocation="home_footer" className="font-semibold text-theme-ink underline underline-offset-4">Inspect the proof</TrackedLink> on veklom.dev.
            </p>
          </div>
        </section>
      </div>
    </HumanAppShell>
  );
}
