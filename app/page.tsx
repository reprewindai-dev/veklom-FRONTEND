import Link from "next/link";

// ─── Proof chip colour map ────────────────────────────────────────────────────
type ChipState = "verified" | "unknown" | "warn";

const chipStyles: Record<ChipState, string> = {
  verified:
    "border-emerald-400/40 bg-emerald-400/10 text-emerald-400",
  unknown:
    "border-gray-500/40 bg-gray-500/10 text-gray-500",
  warn:
    "border-amber-400/40 bg-amber-400/10 text-amber-400",
};

function ProofChip({
  label,
  tag,
  state,
}: {
  label: string;
  tag?: string;
  state: ChipState;
}) {
  return (
    <span
      className={`inline-flex flex-col items-start gap-0.5 px-3 py-1.5 rounded border font-mono text-xs ${chipStyles[state]}`}
    >
      <span className="font-bold tracking-wide">{label}</span>
      {tag && (
        <span className="text-[10px] opacity-60 tracking-tight">{tag}</span>
      )}
    </span>
  );
}

// ─── Lifecycle step ───────────────────────────────────────────────────────────
function LifecycleStep({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-[96px]">
      <div className="w-10 h-10 rounded-full border border-[#00E5FF]/30 bg-[#111827] flex items-center justify-center font-mono text-sm font-bold text-[#00E5FF]">
        {n}
      </div>
      <span className="font-mono text-xs text-[#8A9BB0] text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

// ─── Connector arrow between steps ───────────────────────────────────────────
function Arrow() {
  return (
    <div className="hidden md:flex items-center self-start mt-5">
      <svg width="28" height="12" viewBox="0 0 28 12" fill="none">
        <path
          d="M0 6h24M20 1l6 5-6 5"
          stroke="#00E5FF"
          strokeOpacity="0.35"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ─── Principle card ───────────────────────────────────────────────────────────
function PrincipleCard({ text }: { text: string }) {
  return (
    <div className="flex-1 min-w-[200px] border border-[#00E5FF]/15 bg-[#111827] rounded-xl px-6 py-5">
      <div className="w-2 h-2 rounded-full bg-[#00E5FF] mb-3" />
      <p className="font-mono text-sm text-[#8A9BB0] leading-relaxed">{text}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const lifecycleSteps: [number, string][] = [
    [1, "Capability"],
    [2, "Mount"],
    [3, "Blueprint"],
    [4, "Govern"],
    [5, "Execute"],
    [6, "Evidence"],
    [7, "Settle"],
  ];

  const proofChips: { label: string; tag?: string; state: ChipState }[] = [
    { label: "P5/C0 CLOSED", tag: "veklom-p5-closure-v1", state: "verified" },
    { label: "75/75 ADVERSARIAL", state: "verified" },
    { label: "TLC SAFETY", state: "verified" },
    { label: "CORRESPONDENCE", state: "verified" },
    { label: "LIVENESS NOT CLAIMED", state: "unknown" },
    { label: "G1 DEFERRED", state: "warn" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      {/* ── Top nav ────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0A0E1A]/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-lg tracking-[0.18em] text-white">
              VEKLOM
            </span>
            <span className="px-2 py-0.5 rounded border border-[#00E5FF]/30 bg-[#00E5FF]/10 text-[#00E5FF] font-mono text-[10px] tracking-widest uppercase">
              Capability OS
            </span>
          </div>

          {/* Right: toggle + proof chip */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 font-mono text-xs">
              <Link
                href="/"
                className="px-3 py-1.5 rounded bg-[#00E5FF]/10 border border-[#00E5FF]/40 text-[#00E5FF] font-semibold"
              >
                Human
              </Link>
              <Link
                href="/machine"
                className="px-3 py-1.5 rounded text-[#8A9BB0] hover:text-white transition-colors"
              >
                Machine
              </Link>
            </div>
            <span className="hidden sm:inline font-mono text-[10px] px-2 py-1 rounded border border-emerald-400/30 bg-emerald-400/10 text-emerald-400 tracking-widest">
              P5 CLOSED
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="pt-24 pb-20 text-center">
          <div className="inline-block mb-6 px-3 py-1 rounded-full border border-[#00E5FF]/20 bg-[#00E5FF]/5 font-mono text-[11px] text-[#00E5FF] tracking-widest uppercase">
            Capability OS · Governed Execution
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-8 leading-tight">
            Capability OS for{" "}
            <span className="text-[#00E5FF]">Governed Machine Action</span>
          </h1>

          <p className="max-w-2xl mx-auto text-[#8A9BB0] text-base md:text-lg leading-relaxed mb-4">
            Machines are starting to act: spending money, calling APIs, changing
            data, triggering workflows, and making decisions across real systems.
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
          </div>
        </section>

        {/* ── Three principles ─────────────────────────────────────────────── */}
        <section className="pb-16">
          <div className="flex flex-col md:flex-row gap-4">
            <PrincipleCard text="No consequence beyond authority" />
            <PrincipleCard text="No truth claim beyond evidence" />
            <PrincipleCard text="No residual agency after termination" />
          </div>
        </section>

        {/* ── Capability lifecycle spine ────────────────────────────────────── */}
        <section className="pb-20">
          <h2 className="font-mono text-xs uppercase tracking-widest text-[#8A9BB0] mb-8 text-center">
            Capability Lifecycle
          </h2>

          {/* Desktop: horizontal row */}
          <div className="hidden md:flex items-start justify-center gap-0 overflow-x-auto pb-4">
            {lifecycleSteps.map(([n, label], idx) => (
              <div key={n} className="flex items-start">
                <LifecycleStep n={n} label={label} />
                {idx < lifecycleSteps.length - 1 && <Arrow />}
              </div>
            ))}
          </div>

          {/* Mobile: vertical column */}
          <div className="flex md:hidden flex-col items-start gap-0 pl-4">
            {lifecycleSteps.map(([n, label], idx) => (
              <div key={n} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full border border-[#00E5FF]/30 bg-[#111827] flex items-center justify-center font-mono text-xs font-bold text-[#00E5FF]">
                    {n}
                  </div>
                  {idx < lifecycleSteps.length - 1 && (
                    <div className="w-px h-8 bg-[#00E5FF]/15 mt-1" />
                  )}
                </div>
                <span className="font-mono text-sm text-[#8A9BB0] mt-1.5">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Proof strip ──────────────────────────────────────────────────── */}
        <section className="pb-20 border-t border-white/[0.06] pt-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#8A9BB0] mb-5">
            Proof boundaries — as of veklom-p5-closure-v1
          </p>
          <div className="flex flex-wrap gap-3">
            {proofChips.map((chip) => (
              <ProofChip key={chip.label} {...chip} />
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] bg-[#0D1220]">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-mono text-xs text-[#8A9BB0] tracking-widest">
            VEKLOM · Capability OS
          </span>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 justify-center font-mono text-xs text-[#8A9BB0]">
            {[
              ["/architecture", "Architecture"],
              ["/conformance", "Conformance"],
              ["/proof", "Proof"],
              ["/machine", "Machine"],
              ["/demo", "Demo"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="hover:text-[#00E5FF] transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
