import { ShieldCheck, Radio, KeyRound, FileCheck2, GitCompareArrows, Server, Cpu, Network, Link, Settings } from"lucide-react";
import type { ProofStatus } from"@/lib/cos/capabilities";
import { ProofBadge } from"./ProofBadge";

const icons = { Work: Radio, Telemetry: Radio, Authority: KeyRound, Evidence: FileCheck2, Drift: GitCompareArrows, Host: Server, Runtime: Cpu, Topology: Network, Connectivity: Link, Configuration: Settings };

export interface PillarProps {
 proof: ProofStatus;
 title: keyof typeof icons;
 children: React.ReactNode;
 detail?: string;
}

export function Pillar({ title, proof, children, detail }: PillarProps) {
 const Icon = icons[title];
 return (
 <article className="rounded-2xl border border-cos-border bg-cos-surface/80 p-5 shadow-cos-card">
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-center gap-2"><Icon size={15} className="text-cos-accent" /><h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-cos-text">{title}</h2></div>
 <ProofBadge status={proof} />
 </div>
 <div className="mt-5">{children}</div>
 {detail && <p className="mt-4 border-t border-cos-border pt-3 font-mono text-[10px] leading-5 text-cos-steel">{detail}</p>}
 </article>
 );
}

export function HonestEmpty({ title, route, detail }: { title: string; route: string; detail: string }) {
 return (
 <div className="rounded-xl border border-dashed border-cos-border bg-cos-bg/45 p-4">
 <div className="flex items-start gap-3"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-cos-steel" /><div><h3 className="text-sm text-cos-text">{title}</h3><p className="mt-2 text-xs leading-5 text-cos-muted">{detail}</p><code className="mt-3 block break-all font-mono text-[10px] tabular-nums text-cos-warn">{route}</code></div></div>
 </div>
 );
}
