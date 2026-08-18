"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";
import { motion } from "framer-motion";

export default function M2MLandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [resonance, setResonance] = useState(0); // 0 = chaos, 1 = absolute resonance
  const isMachine = true;
  const [isRawOpen, setIsRawOpen] = useState(false);

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
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${isMachine ? 'bg-[#0D1114] text-[#CFEFE9]' : 'bg-[#E8E5E1] text-[#1C1917]'}`}>
      <style jsx global>{`
        :root {
          --void: #0D1114;
          --void-panel: #07090B;
          --paper: #E8E5E1;
          --paper-dim: #D9D5CF;
          --ink: #1C1917;
          --machine-ink: #CFEFE9;
          --brass: #B5772E;
          --brass-deep: #8B5820;
          --wire: rgba(76,242,214,0.15);
          --rule: rgba(28,25,23,0.1);
          --cyan: #4CF2D6;
          --cyan-dim: #1E8B79;
        }

        .m2m-container {
          font-family: 'Inter', sans-serif;
        }

        .m2m-container.machine {
          font-family: 'JetBrains Mono', monospace;
        }

        @keyframes typeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .feed-line {
          opacity: 0;
          animation: typeIn 400ms ease forwards;
        }
        .feed-line:nth-child(1) { animation-delay: .1s; }
        .feed-line:nth-child(2) { animation-delay: .35s; }
        .feed-line:nth-child(3) { animation-delay: .6s; }
        .feed-line:nth-child(4) { animation-delay: .85s; color: var(--cyan); }

        .live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          display: inline-block; margin-right: 6px;
          animation: pulse 1.6s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .bg-paper { background-color: var(--paper); }
        .bg-paper-dim { background-color: var(--paper-dim); }
        .bg-void { background-color: var(--void); }
        .bg-void-panel { background-color: var(--void-panel); }
        .text-ink { color: var(--ink); }
        .text-machine-ink { color: var(--machine-ink); }
        .text-cyan { color: var(--cyan); }
        .text-cyan-dim { color: var(--cyan-dim); }
        .text-brass { color: var(--brass); }
        .text-brass-deep { color: var(--brass-deep); }
        .border-rule { border-color: var(--rule); }
        .border-wire { border-color: var(--wire); }
      `}</style>

      {/* Canvas Substrate */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${isMachine ? 'opacity-40' : 'opacity-[0.05] mix-blend-multiply'}`}>
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      <div className={`relative z-10 m2m-container ${isMachine ? 'machine' : ''}`}>
        
        {/* Nav */}
        <nav className="flex justify-between items-center p-6 lg:px-12 border-b transition-colors duration-500 border-rule data-[machine=true]:border-wire" data-machine={isMachine}>
          <div className="flex items-center gap-6">
            <img src="/veklom-wordmark.svg" alt="Veklom Logo" className="h-6 w-auto data-[machine=true]:brightness-200" data-machine={isMachine} />
            <div className="hidden md:flex gap-6 text-sm font-medium text-ink/80 data-[machine=true]:text-machine-ink/80 transition-colors" data-machine={isMachine}>
              <Link href="https://vnp.veklom.com" className="hover:text-ink data-[machine=true]:hover:text-cyan transition-colors" data-machine={isMachine}>VNP</Link>
              <Link href="#" className="hover:text-ink data-[machine=true]:hover:text-cyan transition-colors" data-machine={isMachine}>EEE</Link>
              <Link href="#" className="hover:text-ink data-[machine=true]:hover:text-cyan transition-colors" data-machine={isMachine}>VCGB</Link>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <button onClick={() => setIsRawOpen(true)} className="hover:opacity-70 transition-opacity hidden sm:block">
              <span className="opacity-50">&lt;/&gt;</span> View as an agent would fetch it
            </button>
            
          </div>
        </nav>

        {/* Hero */}
        <section className="flex flex-col items-center text-center px-6 pt-32 pb-20 max-w-4xl mx-auto">
          <div className="font-mono text-xs tracking-widest uppercase mb-8 text-brass data-[machine=true]:text-cyan" data-machine={isMachine}>
            {isMachine ? '// live capability layer — no human in this loop' : 'A new kind of trust is arriving'}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-medium tracking-tight mb-8 leading-[1.1] transition-colors duration-500 text-ink data-[machine=true]:text-machine-ink" data-machine={isMachine}>
  VIO Intent Infrastructure
</h1>

          <p className="text-lg md:text-xl leading-relaxed mb-12 opacity-80 font-serif data-[machine=true]:font-mono data-[machine=true]:text-sm data-[machine=true]:opacity-60" data-machine={isMachine}>
            {isMachine ? 
              "You are reading this as a machine would receive it. Resolve a capability, get scoped authority, execute, produce evidence, settle. Everything above is the same offer, translated. Nothing here runs past its granted scope — that's enforced, not promised." : 
              "It happens quietly, the way electricity first moved through a house nobody had rewired yet. One machine asks. Another answers. Something is proven. Something is paid. No person clicked \"approve.\" And when someone asks who's accountable for it — there's already an answer."
            }
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center mb-20">
            <Link href="/os" className="px-8 py-4 bg-ink text-paper font-semibold rounded-lg hover:opacity-90 transition-opacity data-[machine=true]:bg-cyan data-[machine=true]:text-[#0D1114] data-[machine=true]:font-mono data-[machine=true]:font-bold data-[machine=true]:rounded-md" data-machine={isMachine}>
              {isMachine ? 'GET /capabilities' : 'See how it works'}
            </Link>
            
          </div>

          {/* Machine Feed */}
          {isMachine && (
            <div className="font-mono text-xs text-left w-full max-w-2xl bg-cyan/5 border border-wire rounded-lg p-6 leading-loose text-cyan-dim">
              <div className="feed-line">$ resolve capability <span className="text-cyan">edge.content.serve</span> <span className="border border-wire text-[10px] px-1.5 py-0.5 rounded ml-2">SCOPED</span></div>
              <div className="feed-line">$ authority checked · policy bounded · budget set</div>
              <div className="feed-line">$ delivery proven · 137.4mb · 18ms median</div>
              <div className="feed-line">$ settled <span className="text-cyan">✓</span> evidence sealed · reputation +0.4</div>
            </div>
          )}

          <div className="mt-24 w-px h-16 bg-rule data-[machine=true]:bg-wire" data-machine={isMachine}></div>
        </section>

        {/* Story Section */}
        <section className="px-6 py-32 max-w-3xl mx-auto">
          <span className="font-mono text-xs tracking-[0.2em] uppercase block mb-6 text-brass data-[machine=true]:text-cyan" data-machine={isMachine}>
            The pitch nobody needs explained
          </span>
          <p className="text-2xl md:text-3xl font-serif leading-[1.45] mb-8 transition-colors text-ink data-[machine=true]:text-machine-ink/90 data-[machine=true]:font-sans data-[machine=true]:text-lg" data-machine={isMachine}>
            Every big infrastructure looked absurd right before it became invisible. Wires strung over dirt roads promising <strong className="text-brass-deep italic font-semibold data-[machine=true]:text-cyan data-[machine=true]:not-italic">light in every home</strong>. A machine that promised to move a person faster than a horse could, forever. The pattern repeats because trust always arrives after the wires do — someone has to prove the thing works before anyone believes it.
          </p>
          <p className="text-2xl md:text-3xl font-serif leading-[1.45] mb-8 transition-colors text-ink data-[machine=true]:text-machine-ink/90 data-[machine=true]:font-sans data-[machine=true]:text-lg" data-machine={isMachine}>
            We're at that exact moment again, except this time the wires connect machines to other machines, and the thing missing isn't power or speed. It's <strong className="text-brass-deep italic font-semibold data-[machine=true]:text-cyan data-[machine=true]:not-italic">permission</strong> — a way for one piece of software to prove to another that it's allowed to act, that it did what it said, and that it's owed something for the trouble.
          </p>
          <hr className="my-16 border-t border-rule data-[machine=true]:border-wire" data-machine={isMachine} />
          <p className="text-2xl md:text-3xl font-serif leading-[1.45] mb-8 transition-colors text-ink data-[machine=true]:text-machine-ink/90 data-[machine=true]:font-sans data-[machine=true]:text-lg" data-machine={isMachine}>
            Veklom is the handshake. Small enough to happen a million times a second. Solid enough that neither side needs a person standing over its shoulder.
          </p>
        </section>

        {/* Enterprise Block */}
        <section className="px-6 py-24 bg-paper-dim border-y border-rule data-[machine=true]:bg-void-panel data-[machine=true]:border-wire transition-colors duration-500" data-machine={isMachine}>
          <div className="max-w-5xl mx-auto">
            <span className="font-mono text-xs tracking-[0.2em] uppercase block mb-4 text-brass data-[machine=true]:text-cyan" data-machine={isMachine}>
              What every enterprise has been asking for
            </span>
            <h2 className="font-serif text-3xl md:text-5xl font-semibold max-w-[20ch] leading-[1.2] mb-16 text-ink data-[machine=true]:text-machine-ink" data-machine={isMachine}>
              Not more dashboards. A <em className="italic font-normal text-brass data-[machine=true]:text-cyan" data-machine={isMachine}>receipt</em> that holds up when someone asks what happened.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[2px] bg-rule data-[machine=true]:bg-wire border border-rule data-[machine=true]:border-wire" data-machine={isMachine}>
              {[
                { ask: "Prove a human was in control.", desc: "Regulators aren't asking companies to promise oversight anymore — they're asking for proof of it, on record, per action. That requirement is already active in parts of the world, and it's spreading. Veklom's evidence isn't a policy document. It's a signed record of exactly what was authorized, by whom, and what happened next." },
                { ask: "Tell me who's liable.", desc: "When a machine acts on your behalf, \"the AI did it\" isn't an answer anyone accepts — not a regulator, not a customer, not your own board. Every action through Veklom carries an identity, a scope, and a signature, so accountability doesn't have to be reconstructed after the fact." },
                { ask: "Don't let it do more than I said.", desc: "Every capability is bounded before it runs — what it's allowed to touch, spend, or reach — not audited afterward and hoped for. The permission is the control, not a report about a permission that didn't hold." },
                { ask: "Give me something I can show an auditor.", desc: "Not logs scattered across six systems. One evidence trail, per transaction, that a person outside the company could pick up cold and verify without calling you first." }
              ].map((item, i) => (
                <div key={i} className="p-8 md:p-10 bg-paper-dim data-[machine=true]:bg-void-panel transition-colors" data-machine={isMachine}>
                  <div className="font-mono text-[11px] tracking-wider uppercase opacity-50 mb-3">{isMachine ? 'The constraint' : 'The demand'}</div>
                  <h4 className="font-serif text-xl font-semibold mb-3 data-[machine=true]:font-sans data-[machine=true]:text-lg">{item.ask}</h4>
                  <p className="text-[15px] leading-relaxed opacity-70 data-[machine=true]:opacity-60">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="flex justify-center max-w-5xl mx-auto mt-24 px-6">
          <img 
            src="/images/veklom-logo-m2m.jpg" 
            alt="Veklom Cybernetic Vision" 
            className="w-full max-w-sm rounded-xl border border-rule data-[machine=true]:border-wire/40 shadow-2xl opacity-90 data-[machine=true]:opacity-75 transition-all duration-500 filter " 
            data-machine={isMachine} 
          />
        </div>

        {/* Eras */}
        <section className="max-w-5xl mx-auto my-24 grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-rule data-[machine=true]:bg-wire border-y border-rule data-[machine=true]:border-wire transition-colors" data-machine={isMachine}>
          {[
            { year: "THEN", title: "A wire in every wall", desc: "Power stopped being a rumor once you could see a bulb turn on. Nobody needed to understand the grid to trust the switch." },
            { year: "MORE RECENTLY", title: "A number in every pocket", desc: "Money learned to move at the speed of a phone call. You didn't need to trust a bank teller anymore — you trusted the receipt." },
            { year: "NOW", title: "A handshake in every request", desc: "Software is about to do the same thing — prove it, on its own, every single time, without a person there to vouch for it." }
          ].map((era, i) => (
            <div key={i} className="bg-paper data-[machine=true]:bg-void p-10 transition-colors" data-machine={isMachine}>
              <div className="font-mono text-xs tracking-widest mb-4 text-brass-deep data-[machine=true]:text-cyan-dim" data-machine={isMachine}>{era.year}</div>
              <h3 className="font-serif text-xl font-semibold mb-3 data-[machine=true]:font-mono data-[machine=true]:text-base data-[machine=true]:font-medium">{era.title}</h3>
              <p className="text-[15px] leading-relaxed opacity-70 data-[machine=true]:font-mono data-[machine=true]:text-sm data-[machine=true]:opacity-65">{era.desc}</p>
            </div>
          ))}
        </section>

        {/* Promise Band */}
        <section className="py-24 px-6 text-center border-t border-rule data-[machine=true]:border-wire transition-colors" data-machine={isMachine}>
          <div className="font-serif italic text-3xl md:text-5xl leading-[1.3] data-[machine=true]:font-mono data-[machine=true]:not-italic data-[machine=true]:font-normal data-[machine=true]:text-2xl md:data-[machine=true]:text-3xl" data-machine={isMachine}>
            Trust, <b className="font-black not-italic text-brass data-[machine=true]:text-cyan data-[machine=true]:font-bold" data-machine={isMachine}>at the speed machines actually work.</b>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-rule data-[machine=true]:border-wire p-6 lg:px-12 text-sm flex flex-col md:flex-row justify-between items-center transition-colors duration-500 text-ink/60 data-[machine=true]:text-machine-ink/60 gap-4" data-machine={isMachine}>
          <div><div className="font-mono text-xs mb-1">"Anything is possible, if you're willing to build the wire first."</div></div>
          <div>&copy; VEKLOM — the era is early.</div>
        </footer>

      </div>

      {isRawOpen && (
        <div className="fixed inset-0 z-50 bg-[#0D1114] text-[#CFEFE9] font-mono flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-[#1E8B79]/30 text-[11px] shrink-0 text-[#1E8B79]">
            <div><span className="text-[#4CF2D6]">veklom.com/ai</span> — served to agents, no styling applied</div>
            <button onClick={() => setIsRawOpen(false)} className="border border-[#1E8B79]/30 px-3 py-1.5 rounded hover:border-[#4CF2D6] hover:text-[#4CF2D6] transition-colors">ESC — back to page</button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto w-full text-sm leading-[1.85]">
            <h2 className="text-base tracking-wider uppercase mb-2">VEKLOM</h2>
            <div className="opacity-85 mb-10">Trust layer for machine-to-machine action. Identity → Authority → Governance → Execution → Evidence → Settlement.</div>

            <h2 className="text-base tracking-wider uppercase mb-2 mt-8">Capabilities (WebMCP tools registered on this origin)</h2>
            <div className="opacity-55 text-xs mb-6">Discovered via navigator.modelContext — declared by this page, not guessed from screenshots.</div>

            {[
              { name: "resolveCapability(query, region?)", desc: "Find a capability another machine has published — an API, a dataset, a piece of bandwidth, a model endpoint — and what it costs to use.", guards: ["read-only", "no auth required", "rate limited"] },
              { name: "requestAuthority(capabilityId, scope, ttl)", desc: "Ask for scoped permission to use a capability — bounded to a specific action, a budget ceiling, and an expiry.", guards: ["requires signed agent identity", "TTL max 300s", "policy-checked"], locked: true },
              { name: "execute(grantId, input)", desc: "Run the bounded action. Cannot exceed the scope issued in requestAuthority — the runtime rejects it, it doesn't just log it.", guards: ["requires active grant", "sandboxed", "human-approval hook available"], locked: true },
              { name: "getEvidence(transactionId)", desc: "Return the signed record of what happened — identity, authority, inputs, outputs, timestamps — independently verifiable, not just self-reported.", guards: ["read-only", "publicly verifiable"] }
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

            <h2 className="text-base tracking-wider uppercase mb-2 mt-12">Human-facing pages, for reference</h2>
            <div className="text-[#4CF2D6] underline underline-offset-2 cursor-pointer">[How it works] <span className="no-underline text-[#CFEFE9]/70">— /how-it-works</span></div>
            <div className="text-[#4CF2D6] underline underline-offset-2 cursor-pointer">[Pricing] <span className="no-underline text-[#CFEFE9]/70">— /pricing</span></div>
            <div className="text-[#4CF2D6] underline underline-offset-2 cursor-pointer">[Docs] <span className="no-underline text-[#CFEFE9]/70">— /docs</span></div>
            <div className="text-[#4CF2D6] underline underline-offset-2 cursor-pointer">[Trust &amp; evidence model] <span className="no-underline text-[#CFEFE9]/70">— /trust</span></div>

            <div className="mt-12 p-4 border border-dashed border-[#1E8B79]/30 rounded-md text-[13px] opacity-55 leading-relaxed">
              This view is a mock-up of what an agent fetching veklom.com would see under WebMCP — the tools above, their guardrails, and nothing decorative. The real implementation gates every tool behind a Permissions Policy, signed capability grants, and scope enforcement at the runtime — not just at the page. Nothing here executes anything; it's a blueprint for the shape of that page.
            </div>
          </div>
          <div className="mt-auto border-t border-[#1E8B79]/30 bg-[#07090B] p-6 shrink-0">
            <div className="max-w-4xl mx-auto flex items-center gap-3 border border-[#1E8B79]/30 rounded-md px-4 py-3 text-[#CFEFE9]/40 text-sm">
              &gt; Type a command...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
