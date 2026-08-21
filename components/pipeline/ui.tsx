"use client";

import { cx, DECISION_STYLE } from "./util";

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cx("panel panel-edge", className)}>{children}</div>;
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-mute">
      {children}
    </div>
  );
}

export function Verdict({ status }: { status: string }) {
  const s = DECISION_STYLE[status] ?? DECISION_STYLE.error;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-md border px-2.5 py-1 font-mono text-[11px] tracking-[0.18em]",
        s.bg,
        s.fg,
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", s.fg.replace("text-", "bg-"))} />
      {s.label}
    </span>
  );
}

export function LiveDot({ label = "LIVE" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.28em] text-signal">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal/60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
      </span>
      {label}
    </span>
  );
}

export function Meter({ value, max = 100, tone = "signal" }: { value: number; max?: number; tone?: "signal" | "violet" | "rose" | "amber" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const bar =
    tone === "rose"
      ? "bg-rose-400"
      : tone === "amber"
        ? "bg-amber-400"
        : tone === "violet"
          ? "bg-violet"
          : "bg-signal";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
      <div className={cx("h-full rounded-full", bar)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function KeyVal({ k, v, mono = true }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="font-mono text-[11px] uppercase tracking-wider text-mute">{k}</span>
      <span className={cx("text-right text-sm text-white/85", mono && "font-mono")}>{v}</span>
    </div>
  );
}

export function Json({ data }: { data: unknown }) {
  return (
    <pre className="scroll-thin max-h-72 overflow-auto rounded-lg border border-white/8 bg-ink-900/80 p-3 font-mono text-[11px] leading-relaxed text-signal/80">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
