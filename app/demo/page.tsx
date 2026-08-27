import Link from "next/link";

const demos = [
  {
    id: "governed-machine",
    title: "Governed Machine Demo",
    description: "Watch a machine request a consequential action. Attack it from every angle: over-authority, tamper, race, unknown outcome, replay.",
    badge: "LIVE HARNESS",
    badgeColor: "text-emerald-400 border-emerald-400/40 bg-emerald-400/5",
    href: "/demo/governed-machine",
    steps: 6,
  },
  {
    id: "p5-proof",
    title: "P5 Truth-State Proof",
    description: "Canonical evidence at tag veklom-p5-closure-v1. 75/75 adversarial tests. TLA+ safety checked. Liveness not claimed.",
    badge: "CANONICAL",
    badgeColor: "text-emerald-400 border-emerald-400/40 bg-emerald-400/5",
    href: "/proof",
    steps: null,
  },
  {
    id: "network-lease",
    title: "NetworkLease / Tunnel Demo",
    description: "CAPPO authorizes a NetworkLease. A Cloudflare Tunnel hostname exists because the lease exists. Revoke the lease, the hostname becomes DENY.",
    badge: "LAB",
    badgeColor: "text-amber-400 border-amber-400/40 bg-amber-400/5",
    href: "#",
    steps: null,
  },
] as const;

export const metadata = {
  title: "Demo Hub | Veklom",
  description: "Interactive demonstrations of governed machine action.",
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-mono font-bold text-sm tracking-widest text-[#00E5FF] hover:opacity-80">
              ← VEKLOM
            </Link>
            <span className="text-white/30">/</span>
            <span className="font-mono text-sm text-white/60">DEMO</span>
          </div>
          <div className="flex gap-4 text-xs font-mono">
            <Link href="/" className="text-white/40 hover:text-white/60">Human</Link>
            <Link href="/machine" className="text-[#00E5FF]/60 hover:text-[#00E5FF]">Machine</Link>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00E5FF]/30 text-[#00E5FF] text-xs font-mono mb-4">
            DEMO HARNESS
          </span>
          <h1 className="text-4xl font-bold mb-4">Governed Machine Demonstrations</h1>
          <p className="text-[#8A9BB0] text-lg max-w-2xl">
            Demos backed by real evidence say so. Simulated demos say{" "}
            <span className="font-mono text-amber-400">SIMULATED — DEMO HARNESS</span>.
            No fake proof states.
          </p>
        </div>
        <div className="grid gap-4">
          {demos.map((demo) => (
            <Link
              key={demo.id}
              href={demo.href}
              aria-disabled={demo.badge === "LAB"}
              className={`block p-6 rounded-xl border border-white/10 bg-[#111827] transition-all group ${
                demo.badge === "LAB" ? "opacity-50 pointer-events-none" : "hover:border-white/20 hover:bg-[#0D1220]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-3 mb-2">
                    <h2 className="text-lg font-semibold group-hover:text-[#00E5FF] transition-colors">{demo.title}</h2>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${demo.badgeColor}`}>
                      {demo.badge}
                    </span>
                    {demo.steps && (
                      <span className="text-[10px] font-mono text-white/30">{demo.steps} scenarios</span>
                    )}
                  </div>
                  <p className="text-[#8A9BB0] text-sm leading-relaxed">{demo.description}</p>
                </div>
                <div className="text-white/20 group-hover:text-white/50 transition-colors text-xl">→</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-10 p-4 rounded-lg border border-white/5 bg-[#111827]">
          <p className="text-xs font-mono text-white/30">
            Simulations run entirely client-side. Canonical evidence: commit{" "}
            <span className="text-white/50">b480076</span> tagged{" "}
            <span className="text-emerald-400">veklom-p5-closure-v1</span>.
          </p>
        </div>
      </main>
    </div>
  );
}
