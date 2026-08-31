import React from "react";
import Link from "next/link";

export function VeklomMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M8 8h10l6 18 6-18h10L27.5 40h-7L8 8Z" fill="currentColor" />
      <path d="M18 8h12L24 26 18 8Z" fill="var(--theme-bg)" opacity=".96" />
    </svg>
  );
}

export function PremiumLogo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-3" aria-label="Veklom home">
      <span className="flex h-9 w-9 items-center justify-center rounded-[11px] border border-theme-border bg-theme-surface text-theme-ink shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-transform duration-300 group-hover:-translate-y-0.5">
        <VeklomMark className="h-5 w-5" />
      </span>
      <span className="flex items-baseline gap-2">
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-theme-ink">Veklom</span>
        <span className="hidden text-[10px] font-medium uppercase tracking-[0.22em] text-theme-inkDim sm:inline">Capability OS</span>
      </span>
    </Link>
  );
}

export function StageLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-theme-inkDim">
      <span className="h-1.5 w-1.5 rounded-full bg-theme-accent shadow-[0_0_0_5px_rgb(var(--theme-accent)/0.08)]" />
      {children}
    </div>
  );
}

export function LiveSignal({ label = "Live runtime" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-theme-border bg-theme-surface/75 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-theme-inkDim backdrop-blur">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-theme-verified opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-theme-verified" />
      </span>
      {label}
    </span>
  );
}

export function AmbientField({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className="absolute left-1/2 top-[-18rem] h-[46rem] w-[46rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(103,232,249,0.18),rgba(103,232,249,0.05)_36%,transparent_68%)] blur-3xl" />
      <div className="absolute right-[-14rem] top-[24rem] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.12),transparent_68%)] blur-3xl" />
      <div className="absolute inset-0 opacity-[0.28] [background-image:linear-gradient(to_right,var(--theme-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--theme-border)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />
    </div>
  );
}

export function AuthorityOrb() {
  const rings = [72, 104, 138];
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[590px]">
      <div className="absolute inset-[13%] rounded-full bg-[radial-gradient(circle_at_40%_36%,rgba(255,255,255,.95),rgba(221,249,255,.74)_18%,rgba(31,41,55,.96)_58%,rgba(4,7,15,1)_78%)] shadow-[0_45px_120px_rgba(0,0,0,.35),inset_0_0_70px_rgba(103,232,249,.16)]" />
      <div className="absolute inset-[19%] rounded-full border border-white/10 shadow-[inset_0_0_50px_rgba(103,232,249,.12)]" />
      <svg viewBox="0 0 320 320" className="absolute inset-0 h-full w-full text-theme-ink" fill="none" aria-hidden="true">
        {rings.map((r) => <circle key={r} cx="160" cy="160" r={r} stroke="currentColor" opacity="0.12" strokeDasharray="2 8" />)}
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 160 + Math.cos(rad) * 82;
          const y1 = 160 + Math.sin(rad) * 82;
          const x2 = 160 + Math.cos(rad) * 144;
          const y2 = 160 + Math.sin(rad) * 144;
          return <path key={deg} d={`M${x1} ${y1} L${x2} ${y2}`} stroke="currentColor" opacity="0.13" />;
        })}
        <circle cx="160" cy="160" r="6" fill="rgb(var(--theme-accent))" />
        <circle cx="160" cy="160" r="13" stroke="rgb(var(--theme-accent))" opacity=".35" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="translate-y-1 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/45">Authority boundary</div>
          <div className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">Consequence<br />requires permission.</div>
        </div>
      </div>
      <div className="absolute left-[2%] top-[28%] rounded-full border border-theme-border bg-theme-bg/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-theme-ink shadow-xl backdrop-blur">Identity</div>
      <div className="absolute right-[1%] top-[30%] rounded-full border border-theme-border bg-theme-bg/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-theme-ink shadow-xl backdrop-blur">Policy</div>
      <div className="absolute bottom-[14%] left-[10%] rounded-full border border-theme-border bg-theme-bg/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-theme-ink shadow-xl backdrop-blur">Budget</div>
      <div className="absolute bottom-[12%] right-[9%] rounded-full border border-theme-border bg-theme-bg/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-theme-ink shadow-xl backdrop-blur">Evidence</div>
    </div>
  );
}

export function PremiumPageIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="max-w-4xl">
      <StageLabel>{eyebrow}</StageLabel>
      <h1 className="mt-7 text-[clamp(3rem,7vw,6.7rem)] font-semibold leading-[0.92] tracking-[-0.06em] text-theme-ink">{title}</h1>
      <p className="mt-7 max-w-2xl text-base leading-7 text-theme-inkDim md:text-xl md:leading-8">{body}</p>
    </div>
  );
}
