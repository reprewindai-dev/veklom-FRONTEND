"use client";

import Shell from "@/components/Shell";
import { ModuleHeader, Pill, SectionCard } from "@/components/telemetry";
import { GitMerge, Clock } from "lucide-react";

export default function ChainOpsPage() {
  return (
    <Shell>
      <ModuleHeader
        breadcrumb="ChainOps · LangChain Governance"
        title="ChainOps"
        subtitle="Governed LangChain workflow orchestration — policy-gated chain execution, trace evidence, and cost controls."
        pills={
          <>
            <Pill tone="amber"><Clock size={10} className="mr-1" />Coming soon</Pill>
            <Pill tone="neutral">Backend routes not wired</Pill>
          </>
        }
      />

      <SectionCard label="Status" title="Backend routes not wired yet">
        <div className="py-16 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto">
            <GitMerge size={24} className="text-brand-400" />
          </div>
          <div>
            <div className="text-base font-semibold text-ink-100">ChainOps is planned</div>
            <p className="text-sm text-ink-400 mt-1.5 max-w-md mx-auto">
              Governed LangChain workflow execution is on the roadmap. This page will surface
              live chain runs, policy interception traces, cost per chain step, and signed
              evidence packages once the <code className="text-brand-400 text-xs">/api/v1/langchain/*</code> backend
              routes are implemented.
            </p>
          </div>
          <div className="inline-flex flex-col items-center gap-2 mt-2">
            <div className="text-[11px] text-ink-600 uppercase tracking-wider">What&apos;s coming</div>
            <ul className="text-[13px] text-ink-400 space-y-1 text-left">
              <li>• Chain run history with step-level latency &amp; cost</li>
              <li>• Policy gate enforcement per chain node</li>
              <li>• HMAC-SHA256 sealed trace evidence</li>
              <li>• Kill switch and budget cap per chain</li>
              <li>• LangSmith-compatible trace export</li>
            </ul>
          </div>
          <div className="text-[11px] text-ink-600 pt-4 border-t border-border/50 max-w-sm mx-auto">
            No fabricated chain traces are shown here per the anti-fakery spec.
            Real data will appear automatically once the integration ships.
          </div>
        </div>
      </SectionCard>
    </Shell>
  );
}
