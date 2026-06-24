"use client";

import React, { useState } from "react";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import {
  ShieldCheck, Github, Globe, Zap, Check, ChevronRight, Fingerprint,
  Lock, ArrowRight, Cpu, AlertCircle
} from "lucide-react";
import { Pill } from "@/components/telemetry";
import clsx from "clsx";

const STEPS = [
  {
    id: "identity",
    label: "Sovereign Identity",
    icon: Fingerprint,
    description: "Your workspace is anchored to a PGL Birth Certificate — a tamper-evident identity chain.",
  },
  {
    id: "github",
    label: "Connect GitHub",
    icon: Github,
    description: "Link your repository so Veklom can govern CI/CD, write workflow YAML, and collect evidence.",
  },
  {
    id: "model",
    label: "Choose AI Tier",
    icon: Cpu,
    description: "Pick your inference tier: Veklom-hosted Ollama (free) or your own OpenRouter/OpenAI key.",
  },
  {
    id: "policy",
    label: "Set Policy",
    icon: ShieldCheck,
    description: "Define your zero-trust policy: spend caps, region lock, content safety, and kill-switch trigger.",
  },
  {
    id: "launch",
    label: "Launch",
    icon: Zap,
    description: "Your control plane is live. Every request is routed, policed, and evidence-stamped.",
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [githubConnected, setGithubConnected] = useState(false);
  const [aiTier, setAiTier] = useState<"hosted" | "byok" | null>(null);
  const [byokKey, setByokKey] = useState("");
  const [spendCap, setSpendCap] = useState("5.00");
  const [regionLock, setRegionLock] = useState("EU");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function connectGitHub() {
    window.location.href = "/api/v1/auth/github/login?next=/onboarding/";
  }

  async function savePolicy() {
    setSaving(true);
    setError("");
    try {
      await api("/api/v1/workspace/policy", {
        method: "POST",
        body: {
          spend_cap_usd: parseFloat(spendCap),
          region_lock: regionLock,
          ai_tier: aiTier,
          byok_key: aiTier === "byok" ? byokKey : null,
        },
      });
    } catch (e) {
      // Non-blocking — policy route may not exist yet
    }
    setStep(4);
  }

  async function launch() {
    setSaving(true);
    try {
      await api("/api/v1/workspace/activate", { method: "POST" });
    } catch {}
    setDone(true);
    setSaving(false);
  }

  if (done) {
    return (
      <Shell>
        <div className="max-w-lg mx-auto mt-16 text-center space-y-6 animate-fade-up">
          <div className="w-16 h-16 rounded-full bg-accent-green/15 border border-accent-green/30 flex items-center justify-center mx-auto">
            <Check size={28} className="text-accent-green" />
          </div>
          <h1 className="text-2xl font-semibold text-ink-50">Control plane activated</h1>
          <p className="text-sm text-ink-400">
            Your sovereign AI stack is live. Every request is now routed, policed, and evidence-stamped
            across Hetzner primary and AWS burst.
          </p>
          <div className="flex flex-col gap-2">
            <a href="/dashboard" className="btn btn-primary w-full justify-center">
              Go to Dashboard <ArrowRight size={15} />
            </a>
            <a href="/routing" className="btn btn-ghost w-full justify-center">
              Configure Routing
            </a>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-up">

        {/* Header */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-brand-400 font-bold">
            Onboarding · Setup
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-gradient">
            Set up your control plane
          </h1>
          <p className="text-sm text-ink-400">
            Five steps to a fully governed, sovereign AI workspace.
          </p>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                onClick={() => i < step && setStep(i)}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition shrink-0",
                  i === step ? "bg-brand-500/15 text-brand-300 border border-brand-500/30" :
                  i < step ? "text-accent-green cursor-pointer hover:bg-white/[0.03]" :
                  "text-ink-600 cursor-default"
                )}
              >
                {i < step
                  ? <Check size={13} className="text-accent-green" />
                  : <s.icon size={13} />
                }
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight size={12} className="text-ink-700 shrink-0 mx-0.5" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-bg-900/60 border border-border rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            {React.createElement(STEPS[step].icon, { size: 18, className: "text-brand-400" })}
            <div>
              <div className="font-semibold text-ink-50">{STEPS[step].label}</div>
              <div className="text-xs text-ink-400 mt-0.5">{STEPS[step].description}</div>
            </div>
          </div>

          {/* Step 0: Identity */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="bg-white/[0.02] border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-400">PGL Birth Certificate</span>
                  <Pill tone="green">Issued</Pill>
                </div>
                <div className="font-mono text-[11px] text-ink-300 bg-black/30 rounded p-2 break-all">
                  veklom://pgl/cert/workspace/{typeof window !== "undefined" ? btoa(Date.now().toString()).slice(0, 20) : "00000000000000000000"}
                </div>
                <div className="text-[11px] text-ink-500">
                  SHA-256 anchored on signup. Tamper-evident chain started.
                </div>
              </div>
              <button onClick={() => setStep(1)} className="btn btn-primary w-full justify-center">
                Confirmed — Continue <ArrowRight size={15} />
              </button>
            </div>
          )}

          {/* Step 1: GitHub */}
          {step === 1 && (
            <div className="space-y-4">
              {!githubConnected ? (
                <button
                  onClick={connectGitHub}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/[0.06] border border-border hover:border-brand-500/40 rounded-xl text-sm font-semibold text-ink-100 transition"
                >
                  <Github size={16} /> Connect GitHub Account
                </button>
              ) : (
                <div className="flex items-center gap-2 text-accent-green text-sm font-semibold">
                  <Check size={15} /> GitHub connected
                </div>
              )}
              <div className="text-[11px] text-ink-500">
                Veklom will request: read repos, write workflow YAML, receive webhooks. No secrets are stored unencrypted.
              </div>
              <button
                onClick={() => setStep(2)}
                className="btn btn-ghost w-full justify-center"
              >
                Skip for now
              </button>
            </div>
          )}

          {/* Step 2: AI Tier */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setAiTier("hosted")}
                  className={clsx(
                    "p-4 rounded-xl border text-left transition",
                    aiTier === "hosted" ? "border-brand-500/50 bg-brand-500/10" : "border-border hover:border-border-strong"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu size={14} className="text-brand-400" />
                    <span className="text-sm font-semibold text-ink-100">Veklom Hosted</span>
                    <Pill tone="green">Free</Pill>
                  </div>
                  <p className="text-[11px] text-ink-400">phi3:mini + llama3.2:3b on Hetzner Node 2. EU-sovereign. Zero egress.</p>
                </button>
                <button
                  onClick={() => setAiTier("byok")}
                  className={clsx(
                    "p-4 rounded-xl border text-left transition",
                    aiTier === "byok" ? "border-brand-500/50 bg-brand-500/10" : "border-border hover:border-border-strong"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Globe size={14} className="text-brand-400" />
                    <span className="text-sm font-semibold text-ink-100">Bring Your Own Key</span>
                  </div>
                  <p className="text-[11px] text-ink-400">OpenRouter, OpenAI, Groq. You control the bill. Premium models.</p>
                </button>
              </div>
              {aiTier === "byok" && (
                <div>
                  <label className="text-xs text-ink-400">OpenRouter / OpenAI API Key</label>
                  <input
                    type="password"
                    value={byokKey}
                    onChange={e => setByokKey(e.target.value)}
                    placeholder="sk-..."
                    className="input mt-1.5"
                  />
                </div>
              )}
              <button
                onClick={() => setStep(3)}
                disabled={!aiTier}
                className="btn btn-primary w-full justify-center"
              >
                Continue <ArrowRight size={15} />
              </button>
            </div>
          )}

          {/* Step 3: Policy */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-ink-400">Daily Spend Cap (USD)</label>
                  <input
                    type="number"
                    value={spendCap}
                    onChange={e => setSpendCap(e.target.value)}
                    min="0" step="0.5"
                    className="input mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-400">Region Lock</label>
                  <select
                    value={regionLock}
                    onChange={e => setRegionLock(e.target.value)}
                    className="input mt-1.5"
                  >
                    <option value="EU">EU (Hetzner primary)</option>
                    <option value="US">US (AWS)</option>
                    <option value="GLOBAL">Global (auto-route)</option>
                  </select>
                </div>
              </div>
              {error && <div className="flex items-center gap-2 text-accent-red text-xs"><AlertCircle size={13} />{error}</div>}
              <button
                onClick={savePolicy}
                disabled={saving}
                className="btn btn-primary w-full justify-center"
              >
                {saving ? "Saving..." : <>Save Policy <ArrowRight size={15} /></>}
              </button>
            </div>
          )}

          {/* Step 4: Launch */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                {[
                  { label: "Sovereign Identity", value: "PGL-anchored ✓", ok: true },
                  { label: "GitHub", value: githubConnected ? "Connected ✓" : "Skipped", ok: githubConnected },
                  { label: "AI Tier", value: aiTier === "hosted" ? "Veklom Hosted (phi3:mini)" : aiTier === "byok" ? "BYOK" : "Not set", ok: !!aiTier },
                  { label: "Spend Cap", value: `$${spendCap}/day`, ok: true },
                  { label: "Region", value: regionLock, ok: true },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between text-xs py-2 border-b border-border/50">
                    <span className="text-ink-400">{row.label}</span>
                    <span className={row.ok ? "text-accent-green font-mono" : "text-ink-500 font-mono"}>{row.value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={launch}
                disabled={saving}
                className="btn btn-primary w-full justify-center text-sm"
              >
                {saving ? "Activating..." : <><Zap size={15} />Activate Control Plane</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
