import { ArrowRight, CircleDashed } from "lucide-react";
import { ProofBadge } from "./ProofBadge";

export function WorkspaceScaffold({ title, description, stage, children }: { title: string; description: string; stage: string; children?: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-10 lg:px-10">
      <div className="mb-10 flex items-start justify-between gap-6">
        <div><div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-cos-accent">{stage} workspace</div><h1 className="text-4xl font-semibold tracking-tight text-cos-text">{title}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-cos-muted">{description}</p></div>
        <ProofBadge status="Not started" />
      </div>
      {children ? (
        <div className="flex flex-col gap-6">
          {children}
        </div>
      ) : (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-cos-border bg-cos-surface2/60 text-center"><CircleDashed size={34} className="text-cos-steel" /><h2 className="mt-5 text-lg text-cos-text">Not started</h2><p className="mt-2 max-w-sm text-sm leading-6 text-cos-muted">This workspace has no connected runtime evidence yet. Start from a capability on the home surface.</p><span className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-cos-steel">Capability flow <ArrowRight size={13} /></span></div>
      )}
    </section>
  );
}
