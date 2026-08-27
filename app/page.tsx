import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

// --- Proof chip ---------------------------------------------------------------
type ChipState = "verified" | "warn" | "unknown";

function ProofChip({ label, tag, state }: { label: string; tag?: string; state: ChipState }) {
  const styles = {
    verified: "border-theme-verified/30 bg-theme-verified/10 text-theme-verified",
    warn:     "border-theme-warn/30 bg-theme-warn/10 text-theme-warn",
    unknown:  "border-theme-unknown/30 bg-theme-unknown/10 text-theme-unknown",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-[10px] font-bold tracking-wider ${styles[state]}`}>
      <span>{label}</span>
      {tag && <span className="opacity-60 font-normal">{tag}</span>}
    </span>
  );
}

// --- Lifecycle step -----------------------------------------------------------
function Step({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-6 rounded-2xl border border-theme-border bg-theme-surface min-w-[100px] text-center shadow-sm">
      <span className="w-8 h-8 rounded-full border border-theme-accent/40 text-theme-accent font-mono text-sm font-bold flex items-center justify-center bg-theme-accent/10">
        {n}
      </span>
      <span className="font-mono text-xs text-theme-inkDim font-bold tracking-widest">{label}</span>
    </div>
  );
}

// --- Page ---------------------------------------------------------------------
export const metadata = {
  title: "Veklom - Capability OS for Governed Machine Action",
  description: "Mount a capability. Bind it to identity, policy, budget, and time. Execute through a governed boundary. Preserve evidence after the machine disappears.",
};

export default function PublicLandingPage() {
  return (
    <div className="min-h-screen bg-theme-bg text-theme-ink font-sans selection:bg-theme-accent/30 selection:text-theme-ink">

      {/* -- Nav -- */}
      <nav className="sticky top-0 z-50 border-b border-theme-border bg-theme-bg/80 backdrop-blur-xl">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-md overflow-hidden bg-theme-surface shadow-sm ring-1 ring-theme-border flex items-center justify-center">
                <Image src="/logo.jpg" alt="Veklom Logo" width={32} height={32} className="object-cover" />
              </div>
              <span className="font-mono font-bold text-base tracking-[0.2em] text-theme-ink">VEKLOM</span>
            </Link>
            <span className="hidden sm:inline-block font-mono text-[10px] font-bold tracking-[0.15em] text-theme-inkDim uppercase">
              Capability OS
            </span>
          </div>
          <div className="flex items-center gap-6 font-mono text-[11px] font-bold uppercase tracking-wider text-theme-inkDim">
            <Link href="/proof" className="hover:text-theme-ink transition-colors hidden sm:inline">Proof</Link>
            <Link href="/conformance" className="hover:text-theme-ink transition-colors hidden sm:inline">Conformance</Link>
            <Link href="/demo" className="hover:text-theme-ink transition-colors hidden sm:inline">Demo</Link>
            <Link href="/machine" className="hover:text-theme-ink transition-colors hidden md:inline">Machine</Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg bg-theme-accent text-white font-bold hover:brightness-110 transition-all shadow-sm shadow-theme-accent/20"
            >
              Log in
            </Link>
            <div className="hidden sm:block h-4 w-px bg-theme-border"></div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* -- Human Surface -- */}
      <main className="max-w-[1000px] mx-auto px-6">

        {/* -- Hero -- */}
        <section className="pt-28 pb-20 text-center flex flex-col items-center">
          <div className="inline-flex mb-8 px-4 py-1.5 rounded-full border border-theme-accent/20 bg-theme-accent/10 font-mono text-[10px] font-bold text-theme-accent tracking-[0.15em] uppercase shadow-sm">
            Capability OS &middot; Governed Execution
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 leading-[1.1] text-theme-ink max-w-3xl font-sans">
            Capability OS for <span className="text-theme-accent">Governed Machine Action</span>
          </h1>
          <p className="max-w-2xl mx-auto text-theme-inkDim text-lg font-medium leading-relaxed mb-6">
            Machines are starting to act: spending money, calling APIs, changing data,
            triggering workflows, and making decisions across real systems.
            Veklom gives those machines capabilities &mdash; not blank-check authority.
          </p>
          <p className="max-w-2xl mx-auto text-theme-inkDim text-lg font-medium leading-relaxed mb-12">
            Mount a capability. Bind it to identity, policy, budget, and time.
            Execute it through a governed boundary. Preserve evidence after the
            machine disappears.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-2xl">
            <Link
              href="/demo/governed-machine"
              className="flex-1 text-center px-6 py-4 rounded-xl bg-theme-accent text-white font-bold font-mono text-sm tracking-wide shadow-lg shadow-theme-accent/30 hover:brightness-110 hover:-translate-y-0.5 transition-all"
            >
              Run the Governed Machine Demo
            </Link>
            <Link
              href="/proof"
              className="flex-1 text-center px-6 py-4 rounded-xl border border-theme-border bg-theme-surface text-theme-inkDim font-mono text-sm font-bold tracking-wide hover:border-theme-accent/50 hover:text-theme-ink hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              View Canonical Evidence
            </Link>
          </div>
        </section>

        {/* -- Three principles -- */}
        <section className="pb-28">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              "No consequence beyond authority",
              "No truth claim beyond evidence",
              "No residual agency after termination",
            ].map((p) => (
              <div key={p} className="border border-theme-border bg-theme-surface rounded-2xl p-6 shadow-sm hover:border-theme-accent/50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-theme-accent mb-4 shadow-sm shadow-theme-accent/50" />
                <p className="font-mono text-[13px] text-theme-inkDim leading-relaxed font-bold tracking-tight">{p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* -- Lifecycle spine -- */}
        <section className="pb-28">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-theme-inkDim font-bold mb-8 text-center">
            Capability Lifecycle
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[["1","Capability"],["2","Mount"],["3","Blueprint"],["4","Govern"],["5","Execute"],["6","Evidence"],["7","Settle"]].map(([n, l]) => (
              <Step key={n} n={Number(n)} label={l} />
            ))}
          </div>
        </section>

        {/* -- Public nav -- */}
        <section className="pb-20 border-t border-theme-border pt-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { href: "/proof",        label: "Canonical Proof",    desc: "P5/C0 evidence bundle" },
              { href: "/conformance",  label: "Conformance",        desc: "G0A • G0B • G1 gates" },
              { href: "/architecture", label: "Architecture",       desc: "System layout" },
              { href: "/demo",         label: "Demo Hub",           desc: "6 attack scenarios" },
              { href: "/machine",      label: "Machine Surface",    desc: "JSON APIs for agents" },
            ].map(({ href, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="p-6 rounded-2xl border border-theme-border bg-theme-surface hover:border-theme-accent/50 hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <p className="font-mono text-xs font-bold text-theme-ink group-hover:text-theme-accent transition-colors mb-2">{label}</p>
                <p className="font-mono text-[11px] text-theme-inkDim leading-relaxed font-medium">{desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* -- Proof strip -- */}
        <section className="pb-28 border-t border-theme-border pt-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-theme-inkDim font-bold mb-6">
            Proof boundaries &mdash; veklom-p5-closure-v1
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

      {/* -- Footer -- */}
      <footer className="border-t border-theme-border bg-theme-surface">
        <div className="max-w-[1200px] mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="font-mono text-[10px] font-bold text-theme-inkDim tracking-[0.2em] uppercase">VEKLOM &middot; Capability OS</span>
          <nav className="flex flex-wrap gap-x-8 gap-y-3 justify-center font-mono text-[11px] font-bold text-theme-inkDim uppercase tracking-wider">
            {[["/architecture","Architecture"],["/conformance","Conformance"],["/proof","Proof"],["/machine","Machine"],["/demo","Demo"],["/login","Log in"]].map(([href, label]) => (
              <Link key={href} href={href} className="hover:text-theme-ink transition-colors">{label}</Link>
            ))}
          </nav>
        </div>
      </footer>

    </div>
  );
}
