"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Zap, Lock, Database, Activity, GitCommit, FileText, XCircle, Terminal } from "lucide-react";
import { useUIStore } from "@/lib/store/ui-store";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export default function M2MLandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [resonance, setResonance] = useState(0); // 0 = chaos, 1 = absolute resonance
  const { isMachine, isRawOpen, setIsRawOpen } = useUIStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Chaos Substrate Parameters (Lorenz Attractor)
    let x = 0.01;
    let y = 0;
    let z = 0;
    const a = 10;
    const b = 28;
    const c = 8.0 / 3.0;

    let points: { x: number; y: number; z: number }[] = [];
    const maxPoints = 2500;
    let dt = 0.005; // Base speed

    let currentResonance = 0; // Local tweening variable

    // Colors
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 };
    };

    const c1 = hexToRgb("#FF5E7E");
    const c2 = hexToRgb("#E8965A");
    const r1 = hexToRgb("#4CF2D6");
    const r2 = hexToRgb("#1E8B79");

    const lerpColor = (c_chaos: any, c_res: any, t: number) => {
      return {
        r: Math.round(c_chaos.r + (c_res.r - c_chaos.r) * t),
        g: Math.round(c_chaos.g + (c_res.g - c_chaos.g) * t),
        b: Math.round(c_chaos.b + (c_res.b - c_chaos.b) * t),
      };
    };

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      // The system "learns" and achieves resonance over time (~10 seconds to full resonance)
      if (currentResonance < 1) {
        currentResonance += 0.0015;
        if (currentResonance > 1) currentResonance = 1;
        setResonance(currentResonance);
      }

      ctx.fillStyle = `rgba(13, 17, 20, ${0.1 + (currentResonance * 0.05)})`;
      ctx.fillRect(0, 0, width, height);

      const dynamicDt = dt * (1 - currentResonance * 0.4);
      const dx = a * (y - x) * dynamicDt;
      const dy = (x * (b - z) - y) * dynamicDt;
      const dz = (x * y - c * z) * dynamicDt;

      x += dx;
      y += dy;
      z += dz;

      points.push({ x, y, z });
      if (points.length > maxPoints) {
        points.shift();
      }

      ctx.save();
      ctx.translate(width / 2, height / 2);
      const scale = Math.min(width, height) / 70;
      ctx.scale(scale, scale);

      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const angle = time * 0.1;
        const rx = p.x * Math.cos(angle) - p.y * Math.sin(angle);
        const ry = p.x * Math.sin(angle) + p.y * Math.cos(angle);
        const px = rx;
        const py = p.z - 25;

        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }

      const curColor1 = lerpColor(c1, r1, currentResonance);
      const curColor2 = lerpColor(c2, r2, currentResonance);

      const gradient = ctx.createLinearGradient(-30, -30, 30, 30);
      gradient.addColorStop(0, `rgb(${curColor1.r}, ${curColor1.g}, ${curColor1.b})`);
      gradient.addColorStop(1, `rgb(${curColor2.r}, ${curColor2.g}, ${curColor2.b})`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 0.5 + (currentResonance * 0.5);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      ctx.restore();

      time += 0.01;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsRawOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [setIsRawOpen]);

  return (
    <MarketingLayout>
      {/* Canvas Substrate */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${isMachine ? 'opacity-40' : 'opacity-[0.05] mix-blend-multiply'}`}>
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-32 pb-20 max-w-4xl mx-auto relative z-10">
        <div className="font-mono text-xs tracking-widest uppercase mb-8 text-ink-400" data-machine={isMachine}>
          {isMachine ? '// global deterministic policy-anchored substrate' : 'The missing layer in the AI ecosystem'}
        </div>
        
        <h1 className="text-5xl md:text-7xl font-sans font-medium tracking-tight mb-8 leading-[1.1] text-ink-50">
          VIO Intent Infrastructure
        </h1>

        <p className="text-lg md:text-xl leading-relaxed mb-12 opacity-80 font-serif data-[machine=true]:font-mono data-[machine=true]:text-sm data-[machine=true]:opacity-60" data-machine={isMachine}>
          {isMachine ? 
            "The governance infrastructure for AI agents. Turns declared intent into governed execution. It is not IaC. It is not DevOps. It is not workflow automation. It is the deterministic governance substrate." : 
            "Trust, at the speed machines actually work. The chaotic reality of unregulated AI agents requires a sovereign substrate to tame emergent chaos into deterministic execution."
          }
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center mb-20">
          <Link href="/os" className="px-8 py-4 bg-brand-500 text-bg-900 font-semibold rounded-lg hover:bg-brand-400 transition-colors data-[machine=true]:bg-cos-accent data-[machine=true]:text-[#0D1114] data-[machine=true]:font-mono data-[machine=true]:font-bold data-[machine=true]:rounded-md" data-machine={isMachine}>
            {isMachine ? 'GET /capabilities' : 'See how it works'}
          </Link>
        </div>

        {/* Machine Feed */}
        {isMachine && (
          <div className="font-mono text-xs text-left w-full max-w-2xl bg-cos-accent/5 border border-cos-border rounded-lg p-6 leading-loose text-ink-400 shadow-2xl">
            <div className="feed-line">$ verify intent <span className="text-cos-accent">req.39481</span> <span className="border border-cos-border text-[10px] px-1.5 py-0.5 rounded ml-2">POLICY OK</span></div>
            <div className="feed-line">$ authority checked · policy bounded · identity wrapped</div>
            <div className="feed-line">$ resolution capability <span className="text-cos-accent">edge.compute</span> · residency scored</div>
            <div className="feed-line">$ anchored <span className="text-cos-accent">✓</span> evidence sealed · execution granted</div>
          </div>
        )}
      </section>

      {/* The Core Concept */}
      <section className="px-6 py-32 max-w-4xl mx-auto relative z-10">
        <span className="font-mono text-xs tracking-[0.2em] uppercase block mb-6 text-ink-400" data-machine={isMachine}>
          {isMachine ? 'PROTOCOL GUARANTEES' : 'A Category, Not a Feature'}
        </span>
        
        {!isMachine ? (
          <>
            <p className="text-2xl md:text-3xl font-serif leading-[1.45] mb-8 transition-colors text-ink-50">
              VIO (Intent Infrastructure) isn't about orchestrating agents. It's about governing the intent <strong className="text-ink-400 italic font-semibold">before the agent even exists</strong>.
            </p>
            <p className="text-xl font-serif leading-[1.6] mb-8 transition-colors text-ink-50/80">
              When a machine acts on your behalf, "the AI did it" isn't an answer anyone accepts — not a regulator, not a customer, not your own board. We don't just route workloads; we wrap execution in identity, policy, and cryptographic proof.
            </p>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-mono text-sm">
            <div className="border border-cos-border p-6 rounded-md bg-cos-surface">
              <span className="text-cos-accent mb-2 block">01. Intent</span>
              <div className="text-ink-400">Intent is verified, not assumed.</div>
            </div>
            <div className="border border-cos-border p-6 rounded-md bg-cos-surface">
              <span className="text-cos-accent mb-2 block">02. Identity</span>
              <div className="text-ink-400">Identity is bound, not inferred.</div>
            </div>
            <div className="border border-cos-border p-6 rounded-md bg-cos-surface">
              <span className="text-cos-accent mb-2 block">03. Policy</span>
              <div className="text-ink-400">Policy is enforced, not suggested.</div>
            </div>
            <div className="border border-cos-border p-6 rounded-md bg-cos-surface">
              <span className="text-cos-accent mb-2 block">04. Trust</span>
              <div className="text-ink-400">Trust is scored, not hand-waived.</div>
            </div>
            <div className="border border-cos-border p-6 rounded-md bg-cos-surface">
              <span className="text-cos-accent mb-2 block">05. Execution</span>
              <div className="text-ink-400">Execution is deterministic, not emergent.</div>
            </div>
            <div className="border border-cos-border p-6 rounded-md bg-cos-surface">
              <span className="text-cos-accent mb-2 block">06. Evidence</span>
              <div className="text-ink-400">Evidence is anchored, not implied.</div>
            </div>
          </div>
        )}
      </section>

      {/* The 8 Layers of VIO */}
      <section className="px-6 py-24 bg-bg-900 border-y border-border data-[machine=true]:bg-cos-surface data-[machine=true]:border-cos-border transition-colors duration-500 relative z-10" data-machine={isMachine}>
        <div className="max-w-6xl mx-auto">
          <span className="font-mono text-xs tracking-[0.2em] uppercase block mb-4 text-ink-400" data-machine={isMachine}>
            The Foundation
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-semibold max-w-[20ch] leading-[1.2] mb-16 text-ink-50 data-[machine=true]:font-mono data-[machine=true]:text-3xl" data-machine={isMachine}>
            {isMachine ? 'THE 8 LAYERS OF VIO' : <>The highest standard for <em className="italic font-normal text-ink-400" data-machine={isMachine}>AI Agent Governance</em>.</>}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[2px] bg-border data-[machine=true]:bg-cos-border border border-border data-[machine=true]:border-cos-border" data-machine={isMachine}>
            {[
              {
                title: "Intent Verification",
                h_desc: "Ensuring the intent is legitimate, authorized, contextual, and safe. No agent can act until intent is proven.",
                m_desc: "Extracts intent, binds identity, checks policy content, checks trust content, validates capability scope.",
                icon: ShieldCheck
              },
              {
                title: "Governed Completion",
                h_desc: "Intent becomes a governed plan, not a freeform workflow. Completion is where governance truly begins.",
                m_desc: "Builds deterministic plan graphs, applies policy/trust/identity/safety constraints.",
                icon: GitCommit
              },
              {
                title: "Resolution",
                h_desc: "Determining which capability is allowed to fulfill the verified intent. This is where sovereignty is enforced.",
                m_desc: "Selects capabilities, enforces vendor neutrality, enforces residency, scores trust, tracks identity lineage.",
                icon: Database
              },
              {
                title: "Bound Execution",
                h_desc: "Execution isn't free—it's governed. Actions are wrapped securely so they can't breach their defined scope.",
                m_desc: "Execution is wrapped in identity, policy, trust, safety, and residency envelopes.",
                icon: Lock
              },
              {
                title: "Authority",
                h_desc: "Authority is granted only when all envelopes are satisfied. It is temporary and instantly revocable.",
                m_desc: "Issues short-lived authority tokens, nonce bound approval, budget solvency, residency/safety compliance.",
                icon: Zap
              },
              {
                title: "Deterministic Runtime",
                h_desc: "Actions execute inside a deterministic harness. Execution becomes predictable, auditable, and controlled.",
                m_desc: "Vendor-neutral runtime, sovereign execution, safety enforcement, trust enforcement.",
                icon: Terminal
              },
              {
                title: "Proof Anchoring",
                h_desc: "Every single action anchors cryptographic evidence. Proof is the ultimate accountability layer.",
                m_desc: "Identity proof, policy proof, trust proof, capability proof, execution proof, refusal proof, settlement proof.",
                icon: FileText
              },
              {
                title: "Revocation & Refusal",
                h_desc: "Unsafe or unauthorized actions are refused instantly. Refusal is the absolute core of governance.",
                m_desc: "Trust evolution, policy change, attestation failures, residency violations, safety violations.",
                icon: XCircle
              }
            ].map((layer, i) => {
              const Icon = layer.icon;
              return (
                <div key={i} className="p-8 bg-bg-900 data-[machine=true]:bg-cos-surface transition-colors flex flex-col h-full" data-machine={isMachine}>
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="w-5 h-5 text-ink-400" />
                    <div className="font-mono text-[11px] tracking-wider uppercase opacity-50">Layer 0{i + 1}</div>
                  </div>
                  <h4 className="font-serif text-xl font-semibold mb-3 data-[machine=true]:font-sans data-[machine=true]:text-base data-[machine=true]:text-cos-accent" data-machine={isMachine}>{layer.title}</h4>
                  <p className="text-[14px] leading-relaxed opacity-70 data-[machine=true]:font-mono data-[machine=true]:text-[13px] data-[machine=true]:opacity-60 flex-grow">
                    {isMachine ? layer.m_desc : layer.h_desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Competitive Moat: VNP, EEE, VCGB */}
      <section className="px-6 py-32 max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <span className="font-mono text-xs tracking-[0.2em] uppercase block mb-6 text-ink-400" data-machine={isMachine}>
            {isMachine ? 'ACTIVE NETWORK METROLOGY & GOVERNANCE' : 'Beyond Simple Benchmarks'}
          </span>
          <h2 className="text-3xl md:text-5xl font-serif leading-[1.2] mb-6 transition-colors text-ink-50 data-[machine=true]:font-mono data-[machine=true]:text-3xl" data-machine={isMachine}>
            {isMachine ? 'VNP / EEE / VCGB' : 'Measuring the Complete Truth'}
          </h2>
          <p className="text-lg md:text-xl font-serif leading-[1.6] max-w-3xl mx-auto transition-colors text-ink-50/80 data-[machine=true]:font-mono data-[machine=true]:text-sm data-[machine=true]:text-center" data-machine={isMachine}>
            {isMachine ? 
              "We measure what matters to the M2M economy using cryptographically secure Active Network Metrology and capability boundaries. True governance requires evaluating the complete stack." : 
              "We don't just measure latency or uptime in a vacuum. We measure the complete operational reality: the network, the evidence, and the governance boundaries working together."
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Link href="https://vnp.veklom.com" className="group p-8 rounded-xl bg-bg-800 border border-border hover:border-brand-500/50 transition-colors data-[machine=true]:bg-cos-surface data-[machine=true]:border-cos-border data-[machine=true]:hover:border-cos-accent/50" data-machine={isMachine}>
            <div className="w-10 h-10 rounded bg-bg-700 border border-border flex items-center justify-center mb-6 group-hover:bg-brand-500/10 data-[machine=true]:bg-cos-accent/10 data-[machine=true]:border-cos-accent/20 data-[machine=true]:group-hover:bg-cos-accent/20 transition-colors">
              <Activity className="w-5 h-5 text-ink-50 data-[machine=true]:text-cos-accent" data-machine={isMachine} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-ink-50 data-[machine=true]:text-cos-accent data-[machine=true]:font-mono" data-machine={isMachine}>VNP</h3>
            <div className="text-sm text-ink-400 font-mono mb-4">Veklom Nexus Protocol</div>
            <p className="text-sm text-ink-400 leading-relaxed">Measures physical network reality: P99 Latency, Uptime, and Settlement. The foundational layer of observability.</p>
          </Link>

          <Link href="https://eee.veklom.com" className="group p-8 rounded-xl bg-bg-800 border border-border hover:border-brand-500/50 transition-colors data-[machine=true]:bg-cos-surface data-[machine=true]:border-cos-border data-[machine=true]:hover:border-cos-accent/50" data-machine={isMachine}>
            <div className="w-10 h-10 rounded bg-bg-700 border border-border flex items-center justify-center mb-6 group-hover:bg-brand-500/10 data-[machine=true]:bg-cos-accent/10 data-[machine=true]:border-cos-accent/20 data-[machine=true]:group-hover:bg-cos-accent/20 transition-colors">
              <FileText className="w-5 h-5 text-ink-50 data-[machine=true]:text-cos-accent" data-machine={isMachine} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-ink-50 data-[machine=true]:text-cos-accent data-[machine=true]:font-mono" data-machine={isMachine}>EEE</h3>
            <div className="text-sm text-ink-400 font-mono mb-4">Execution Evidence Envelope</div>
            <p className="text-sm text-ink-400 leading-relaxed">Standardizes the evidence. A tamper-evident record binding capability, authority, policy, and effects.</p>
          </Link>

          <Link href="https://vcgb.veklom.com" className="group p-8 rounded-xl bg-bg-800 border border-border hover:border-brand-500/50 transition-colors data-[machine=true]:bg-cos-surface data-[machine=true]:border-cos-border data-[machine=true]:hover:border-cos-accent/50" data-machine={isMachine}>
            <div className="w-10 h-10 rounded bg-bg-700 border border-border flex items-center justify-center mb-6 group-hover:bg-brand-500/10 data-[machine=true]:bg-cos-accent/10 data-[machine=true]:border-cos-accent/20 data-[machine=true]:group-hover:bg-cos-accent/20 transition-colors">
              <ShieldCheck className="w-5 h-5 text-ink-50 data-[machine=true]:text-cos-accent" data-machine={isMachine} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-ink-50 data-[machine=true]:text-cos-accent data-[machine=true]:font-mono" data-machine={isMachine}>VCGB</h3>
            <div className="text-sm text-ink-400 font-mono mb-4">Capability Governance Benchmark</div>
            <p className="text-sm text-ink-400 leading-relaxed">Evaluates enforcement boundaries. Tests systems for the correct decision, real-world effect boundary, and conformant evidence.</p>
          </Link>
        </div>

        {/* The Final Unified Measurement Card */}
        <div className="w-full p-8 md:p-12 rounded-xl bg-gradient-to-b from-bg-800 to-bg-900 border border-border data-[machine=true]:from-cos-surface data-[machine=true]:to-bg-900 data-[machine=true]:border-cos-border flex flex-col md:flex-row items-center gap-12" data-machine={isMachine}>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-brand-500/10 text-brand-500 text-xs font-bold uppercase tracking-wider mb-6 data-[machine=true]:bg-cos-accent/10 data-[machine=true]:text-cos-accent data-[machine=true]:font-mono" data-machine={isMachine}>
              The Final Measurement
            </div>
            <h3 className="text-3xl font-bold mb-4 text-ink-50 data-[machine=true]:text-cos-text data-[machine=true]:font-mono" data-machine={isMachine}>
              Unified Governed Benchmark
            </h3>
            <p className="text-ink-400 leading-relaxed mb-6">
              Individual metrics are incomplete. The final benchmarking score we measure against is an aggregate of all three. True governance only exists when the network is observable (VNP), the boundary enforces policy (VCGB), and the result is cryptographically anchored (EEE).
            </p>
            <div className="flex items-center gap-4 text-sm font-mono font-bold">
              <span className="text-brand-500 data-[machine=true]:text-cos-accent" data-machine={isMachine}>VNP</span>
              <span className="text-ink-600">+</span>
              <span className="text-brand-500 data-[machine=true]:text-cos-accent" data-machine={isMachine}>EEE</span>
              <span className="text-ink-600">+</span>
              <span className="text-brand-500 data-[machine=true]:text-cos-accent" data-machine={isMachine}>VCGB</span>
              <span className="text-ink-600">=</span>
              <span className="text-ink-50 bg-bg-700 px-3 py-1 rounded data-[machine=true]:bg-cos-surface2" data-machine={isMachine}>ABSOLUTE TRUTH</span>
            </div>
          </div>
          
          <div className="w-full md:w-1/3 flex-shrink-0 relative">
            <div className="aspect-square rounded-full border border-dashed border-border data-[machine=true]:border-cos-border/50 flex items-center justify-center relative p-8" data-machine={isMachine}>
              <div className="absolute top-0 right-1/4 w-12 h-12 bg-bg-800 border border-border rounded-lg flex items-center justify-center text-xs font-mono font-bold text-ink-400 data-[machine=true]:bg-cos-surface data-[machine=true]:border-cos-border data-[machine=true]:text-cos-accent" data-machine={isMachine}>VNP</div>
              <div className="absolute bottom-1/4 -right-4 w-12 h-12 bg-bg-800 border border-border rounded-lg flex items-center justify-center text-xs font-mono font-bold text-ink-400 data-[machine=true]:bg-cos-surface data-[machine=true]:border-cos-border data-[machine=true]:text-cos-accent" data-machine={isMachine}>EEE</div>
              <div className="absolute bottom-1/4 -left-4 w-12 h-12 bg-bg-800 border border-border rounded-lg flex items-center justify-center text-xs font-mono font-bold text-ink-400 data-[machine=true]:bg-cos-surface data-[machine=true]:border-cos-border data-[machine=true]:text-cos-accent" data-machine={isMachine}>VCGB</div>
              
              <div className="w-full h-full rounded-full bg-brand-500/5 data-[machine=true]:bg-cos-accent/5 flex items-center justify-center border border-brand-500/20 data-[machine=true]:border-cos-accent/20" data-machine={isMachine}>
                <div className="w-16 h-16 rounded-full bg-brand-500 flex items-center justify-center data-[machine=true]:bg-cos-accent shadow-[0_0_30px_rgba(255,184,0,0.3)] data-[machine=true]:shadow-[0_0_30px_rgba(0,229,255,0.3)]" data-machine={isMachine}>
                  <ShieldCheck className="w-8 h-8 text-bg-900 data-[machine=true]:text-cos-bg" data-machine={isMachine} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Raw WebMCP View Overlay */}
      {isRawOpen && (
        <div className="fixed inset-0 z-50 bg-[#0D1114] text-[#CFEFE9] font-mono flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-[#1E8B79]/30 text-[11px] shrink-0 text-[#1E8B79]">
            <div><span className="text-[#4CF2D6]">veklom.com</span> — served to agents, no styling applied</div>
            <button onClick={() => setIsRawOpen(false)} className="border border-[#1E8B79]/30 px-3 py-1.5 rounded hover:border-[#4CF2D6] hover:text-[#4CF2D6] transition-colors">ESC — back to page</button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto w-full text-sm leading-[1.85]">
            <h2 className="text-base tracking-wider uppercase mb-2">VIO Intent Infrastructure</h2>
            <div className="opacity-85 mb-10">Global, deterministic policy-anchored substrate. Transforms declared intent into governed execution.</div>

            <h2 className="text-base tracking-wider uppercase mb-2 mt-8">Capabilities (WebMCP tools registered on this origin)</h2>
            <div className="opacity-55 text-xs mb-6">Discovered via navigator.modelContext — declared by this page, not guessed from screenshots.</div>

            {[
              { name: "verifyIntent(payload)", desc: "Extracts intent, binds identity, checks policy/trust content, validates capability scope. Required before any agent execution.", guards: ["read-only", "signature required"] },
              { name: "buildGovernedPlan(intentId)", desc: "Builds deterministic plan graphs and applies policy constraints. Returns a DAG of execution envelopes.", guards: ["requires verified intent"] },
              { name: "requestAuthority(capabilityId, scope, ttl)", desc: "Issues short-lived authority tokens. Performs nonce bound approval and budget solvency checks.", guards: ["requires identity envelope", "TTL max 300s"], locked: true },
              { name: "execute(grantId, input)", desc: "Run the action inside the vendor-neutral deterministic runtime. Cannot exceed scope.", guards: ["requires active grant", "sandboxed", "residency checked"], locked: true },
              { name: "getEvidence(transactionId)", desc: "Pulls the signed cryptographic receipt for a transaction. Proof of identity, policy, execution, and settlement.", guards: ["read-only", "publicly verifiable"] }
            ].map((tool, i) => (
              <div key={i} className="border border-[#1E8B79]/30 rounded-md p-4 bg-[#4CF2D6]/5 mb-4">
                <div className="text-[#4CF2D6] font-bold">{tool.name}</div>
                <div className="opacity-65 mt-1 text-[13px]">{tool.desc}</div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {tool.guards.map((g, j) => (
                    <span key={j} className={`text-[10px] tracking-wider uppercase border px-2 py-0.5 rounded-sm ${tool.locked && j === 0 ? 'border-[#FF8C5A]/40 text-[#FF8C5A]' : 'border-[#1E8B79]/30 text-[#1E8B79]'}`}>{g}</span>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-12 p-4 border border-dashed border-[#1E8B79]/30 rounded-md text-[13px] opacity-55 leading-relaxed">
              This view represents what an agent fetching veklom.com would see under WebMCP. The real implementation gates every tool behind a Permissions Policy and scope enforcement at the runtime. Nothing here executes anything; it is a blueprint for governed capability discovery.
            </div>
          </div>
          <div className="mt-auto border-t border-[#1E8B79]/30 bg-[#07090B] p-6 shrink-0">
            <div className="max-w-4xl mx-auto flex items-center gap-3 border border-[#1E8B79]/30 rounded-md px-4 py-3 text-[#CFEFE9]/40 text-sm">
              &gt; Type a command...
            </div>
          </div>
        </div>
      )}
    </MarketingLayout>
  );
}
