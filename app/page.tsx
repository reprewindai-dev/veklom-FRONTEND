import Link from "next/link";

// ─── Proof chip ───────────────────────────────────────────────────────────────
type ChipState = "verified" | "warn" | "unknown";

const chipStyle: Record<ChipState, string> = {
  verified: "border-emerald-400/40 bg-emerald-400/10 text-emerald-400",
  warn:     "border-amber-400/40  bg-amber-400/10  text-amber-400",
  unknown:  "border-gray-500/40   bg-gray-500/10   text-gray-500",
};

function ProofChip({ label, tag, state }: { label: string; tag?: string; state: ChipState }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border font-mono text-[10px] font-bold tracking-wider ${chipStyle[state]}`}>
      <span className="font-bold">{label}</span>
      {tag && <span className="opacity-60 font-normal">{tag}</span>}
    </span>
  );
}

// ─── Lifecycle step ───────────────────────────────────────────────────────────
function Step({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-5 rounded-xl border border-white/10 bg-[#111827] min-w-[90px] text-center">
      <span className="w-7 h-7 rounded-full border border-[#00E5FF]/40 text-[#00E5FF] font-mono text-xs font-bold flex items-center justify-center">
        {n}
      </span>
      <span className="font-mono text-xs text-[#8A9BB0]">{label}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export const metadata = {
  title: "Veklom — Capability OS for Governed Machine Action",
  description: "Mount a capability. Bind it to identity, policy, budget, and time. Execute through a governed boundary. Preserve evidence after the machine disappears.",
};

export default function PublicLandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0A0E1A]/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-base tracking-[0.18em] text-white">VEKLOM</span>
            <span className="hidden sm:inline px-2 py-0.5 rounded border border-[#00E5FF]/30 bg-[#00E5FF]/10 text-[#00E5FF] font-mono text-[10px] tracking-widest uppercase">
              Capability OS
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs text-[#8A9BB0]">
            <Link href="/proof" className="hover:text-white transition-colors hidden sm:inline">Proof</Link>
            <Link href="/conformance" className="hover:text-white transition-colors hidden sm:inline">Conformance</Link>
            <Link href="/demo" className="hover:text-white transition-colors hidden sm:inline">Demo</Link>
            <Link href="/machine" className="hover:text-white transition-colors hidden md:inline">Machine</Link>
            <Link
              href="/login"
              className="px-3 py-1.5 rounded border border-[#00E5FF]/40 bg-[#00E5FF]/10 text-[#00E5FF] hover:bg-[#00E5FF]/20 transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6">

        {/* ── Hero ── */}
        <section className="pt-24 pb-16 text-center">
          <div className="inline-block mb-6 px-3 py-1 rounded-full border border-[#00E5FF]/20 bg-[#00E5FF]/5 font-mono text-[11px] text-[#00E5FF] tracking-widest uppercase">
            Capability OS · Governed Execution
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 leading-tight">
            Capability OS for{" "}
            <span className="text-[#00E5FF]">Governed Machine Action</span>
          </h1>
          <p className="max-w-2xl mx-auto text-[#8A9BB0] text-base md:text-lg leading-relaxed mb-4">
            Machines are starting to act: spending money, calling APIs, changing data,
            triggering workflows, and making decisions across real systems.
            Veklom gives those machines capabilities — not blank-check authority.
          </p>
          <p className="max-w-2xl mx-auto text-[#8A9BB0] text-base md:text-lg leading-relaxed mb-10">
            Mount a capability. Bind it to identity, policy, budget, and time.
            Execute it through a governed boundary. Preserve evidence after the
            machine disappears.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo/governed-machine"
              className="px-6 py-3 rounded-lg bg-[#00E5FF] text-[#0A0E1A] font-bold font-mono text-sm tracking-wide hover:bg-[#00E5FF]/90 transition-colors"
            >
              Run the Governed Machine Demo
            </Link>
            <Link
              href="/proof"
              className="px-6 py-3 rounded-lg border border-[#00E5FF]/30 text-[#00E5FF] font-mono text-sm tracking-wide hover:bg-[#00E5FF]/10 transition-colors"
            >
              View Canonical Evidence
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 rounded-lg border border-white/20 text-white/70 font-mono text-sm tracking-wide hover:border-white/40 hover:text-white transition-colors"
            >
              Log in to Capability OS →
            </Link>
          </div>
        </section>

        {/* ── Three principles ── */}
        <section className="pb-16">
          <div className="flex flex-col md:flex-row gap-4">
            {[
              "No consequence beyond authority",
              "No truth claim beyond evidence",
              "No residual agency after termination",
            ].map((p) => (
              <div key={p} className="flex-1 border border-[#00E5FF]/15 bg-[#111827] rounded-xl px-6 py-5">
                <div className="w-2 h-2 rounded-full bg-[#00E5FF] mb-3" />
                <p className="font-mono text-sm text-[#8A9BB0] leading-relaxed">{p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Lifecycle spine ── */}
        <section className="pb-16">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#8A9BB0] mb-6 text-center">
            Capability Lifecycle
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[["1","Capability"],["2","Mount"],["3","Blueprint"],["4","Govern"],["5","Execute"],["6","Evidence"],["7","Settle"]].map(([n, l]) => (
              <Step key={n} n={Number(n)} label={l} />
            ))}
          </div>
        </section>

        {/* ── Public nav ── */}
        <section className="pb-16 border-t border-white/[0.06] pt-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { href: "/proof",        label: "Canonical Proof",    desc: "P5/C0 evidence bundle" },
              { href: "/conformance",  label: "Conformance",        desc: "G0A · G0B · G1 gates" },
              { href: "/architecture", label: "Architecture",       desc: "System layout" },
              { href: "/demo",         label: "Demo Hub",           desc: "6 attack scenarios" },
              { href: "/machine",      label: "Machine Surface",    desc: "JSON APIs for agents" },
            ].map(({ href, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="p-4 rounded-xl border border-white/10 bg-[#111827] hover:border-[#00E5FF]/30 hover:bg-[#0D1220] transition-all group"
              >
                <p className="font-mono text-xs font-bold text-white group-hover:text-[#00E5FF] transition-colors mb-1">{label}</p>
                <p className="font-mono text-[10px] text-[#8A9BB0]">{desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Proof strip ── */}
        <section className="pb-20 border-t border-white/[0.06] pt-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#8A9BB0] mb-5">
            Proof boundaries — veklom-p5-closure-v1
          </p>
          <div className="flex flex-wrap gap-3">
            <ProofChip label="P5/C0 CLOSED"         tag="veklom-p5-closure-v1" state="verified" />
            <ProofChip label="75/75 ADVERSARIAL"                               state="verified" />
            <ProofChip label="TLC SAFETY"                                      state="verified" />
            <ProofChip label="CORRESPONDENCE"                                  state="verified" />
            <ProofChip label="LIVENESS NOT CLAIMED"                            state="unknown"  />
            <ProofChip label="G1 DEFERRED"                                     state="warn"     />
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] bg-[#0D1220]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-mono text-xs text-[#8A9BB0] tracking-widest">VEKLOM · Capability OS</span>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 justify-center font-mono text-xs text-[#8A9BB0]">
            {[["/architecture","Architecture"],["/conformance","Conformance"],["/proof","Proof"],["/machine","Machine"],["/demo","Demo"],["/login","Log in"]].map(([href, label]) => (
              <Link key={href} href={href} className="hover:text-[#00E5FF] transition-colors">{label}</Link>
            ))}
          </nav>
        </div>
      </footer>

    </div>
  );
}
