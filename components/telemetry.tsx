"use client";

import clsx from "clsx";
import { ReactNode, useId } from "react";

/* =========================================================================
   Formatting helpers
   ========================================================================= */
export function fmtNum(n: number | undefined | null, digits = 0): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}
export function fmtUsd(n: number | undefined | null, digits = 2): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

/* =========================================================================
   Palette for chart accents
   ========================================================================= */
export const ACCENT = {
  amber: "#FFB800",
  cyan: "#37C9EC",
  green: "#3EE7A2",
  violet: "#B98BFF",
  red: "#FF5C6C",
  gray: "#A1A1A6",
} as const;
export type AccentKey = keyof typeof ACCENT;

/* =========================================================================
   Pill — route / status / severity chips
   ========================================================================= */
type PillTone = "amber" | "cyan" | "green" | "red" | "violet" | "neutral";

const PILL_TONES: Record<PillTone, string> = {
  amber: "text-brand-400 border-brand-500/40 bg-brand-500/10",
  cyan: "text-[#7fdcf0] border-[#37C9EC]/40 bg-[#37C9EC]/10",
  green: "text-accent-green border-accent-green/40 bg-accent-green/10",
  red: "text-accent-red border-accent-red/40 bg-accent-red/10",
  violet: "text-[#c9aaff] border-[#B98BFF]/40 bg-[#B98BFF]/10",
  neutral: "text-ink-200 border-border-strong bg-white/[0.03]",
};

export function statusTone(value?: string): PillTone {
  const v = (value || "").toLowerCase();
  if (/(pass|healthy|active|verified|on-pace|connected|continuous|ready|resolved|live)/.test(v)) return "green";
  if (/(redact|review|rotat|progress|pending|warn|expir|degraded)/.test(v)) return "amber";
  if (/(fail|crit|error|breach|over|halt|blocked)/.test(v)) return "red";
  return "neutral";
}
export function routeTone(route?: string): PillTone {
  const v = (route || "").toLowerCase();
  if (v.includes("aws") || v.includes("burst")) return "cyan";
  return "amber";
}

export function Pill({
  children,
  tone = "neutral",
  dot,
  className,
}: {
  children: ReactNode;
  tone?: PillTone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap",
        PILL_TONES[tone],
        className
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {children}
    </span>
  );
}

export function RoutePill({ route }: { route?: string }) {
  const label = (route || "").toLowerCase().includes("aws") ? "AWS · BURST" : "HETZNER · PRIMARY";
  return <Pill tone={routeTone(route)}>{label}</Pill>;
}

/* =========================================================================
   Sparkline — area + line micro chart
   ========================================================================= */
export function Sparkline({
  data,
  color = ACCENT.amber,
  height = 44,
  className,
}: {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const w = 240;
  const h = height;
  const pad = 3;
  const pts = data && data.length ? data : [0, 0];
  const max = Math.max(...pts, 1);
  const min = Math.min(...pts, 0);
  const span = max - min || 1;
  const stepX = (w - pad * 2) / Math.max(pts.length - 1, 1);
  const coords = pts.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (h - pad * 2) * (1 - (v - min) / span);
    return [x, y] as const;
  });
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1][0].toFixed(1)},${h - pad} L${coords[0][0].toFixed(1)},${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={clsx("w-full", className)} style={{ height }}>
      <defs>
        <linearGradient id={`sg-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* =========================================================================
   StatTile — labelled metric with delta + sparkline
   ========================================================================= */
export function StatTile({
  label,
  icon,
  value,
  delta,
  deltaTone = "neutral",
  spark,
  sparkColor = ACCENT.amber,
  loading,
}: {
  label: string;
  icon?: ReactNode;
  value: ReactNode;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
  spark?: number[];
  sparkColor?: string;
  loading?: boolean;
}) {
  return (
    <div className="card card-hover p-4 overflow-hidden relative">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-400 min-w-0">
          {icon && <span className="text-ink-600 shrink-0">{icon}</span>}
          <span className="truncate">{label}</span>
        </div>
        {delta && (
          <span
            className={clsx(
              "text-[10px] font-semibold tabular-nums shrink-0",
              deltaTone === "up" && "text-accent-green",
              deltaTone === "down" && "text-accent-red",
              deltaTone === "neutral" && "text-ink-400"
            )}
          >
            {delta}
          </span>
        )}
      </div>
      <div className="mt-2 text-[26px] leading-none font-semibold tracking-tight tabular-nums">
        {loading ? <span className="skeleton inline-block h-7 w-20 rounded" /> : value}
      </div>
      <div className="mt-3 -mx-1 -mb-1 opacity-90">
        {spark && spark.length > 1 ? <Sparkline data={spark} color={sparkColor} height={36} /> : <div style={{ height: 36 }} />}
      </div>
    </div>
  );
}

/* =========================================================================
   SectionCard — labelled panel with title + actions
   ========================================================================= */
export function SectionCard({
  label,
  title,
  actions,
  children,
  className,
  bodyClassName,
}: {
  label?: string;
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={clsx("card p-5", className)}>
      {(label || title || actions) && (
        <header className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            {label && <div className="text-[10px] uppercase tracking-[0.16em] text-ink-600">{label}</div>}
            {title && <div className="text-[15px] font-semibold tracking-tight mt-0.5 truncate">{title}</div>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/* =========================================================================
   DualLineChart — two smooth series (e.g. Hetzner vs AWS burst)
   ========================================================================= */
export function DualLineChart({
  points,
  aKey,
  bKey,
  aColor = ACCENT.amber,
  bColor = ACCENT.cyan,
  labelKey = "hour",
  height = 220,
}: {
  points: Record<string, any>[];
  aKey: string;
  bKey: string;
  aColor?: string;
  bColor?: string;
  labelKey?: string;
  height?: number;
}) {
  const id = useId().replace(/:/g, "");
  const w = 760;
  const h = height;
  const padL = 28;
  const padR = 8;
  const padT = 12;
  const padB = 22;
  const data = points && points.length ? points : [{ [aKey]: 0, [bKey]: 0, [labelKey]: "" }];
  const allVals = data.flatMap((d) => [Number(d[aKey]) || 0, Number(d[bKey]) || 0]);
  const max = Math.max(...allVals, 1);
  const stepX = (w - padL - padR) / Math.max(data.length - 1, 1);
  const yOf = (v: number) => padT + (h - padT - padB) * (1 - v / max);
  const xOf = (i: number) => padL + i * stepX;
  const build = (key: string) =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(Number(d[key]) || 0).toFixed(1)}`).join(" ");
  const areaOf = (key: string) =>
    `${build(key)} L${xOf(data.length - 1).toFixed(1)},${h - padB} L${xOf(0).toFixed(1)},${h - padB} Z`;
  const gridY = [0, 0.25, 0.5, 0.75, 1];
  const labelEvery = Math.ceil(data.length / 12);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`a-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={aColor} stopOpacity="0.22" />
          <stop offset="100%" stopColor={aColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridY.map((g, i) => {
        const y = padT + (h - padT - padB) * g;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#ffffff" strokeOpacity="0.05" strokeDasharray="2 4" />
            <text x={2} y={y + 3} fontSize="9" fill="#6E6E73">
              {Math.round(max * (1 - g))}
            </text>
          </g>
        );
      })}
      <path d={areaOf(aKey)} fill={`url(#a-${id})`} />
      <path d={build(bKey)} fill="none" stroke={bColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <path d={build(aKey)} fill="none" stroke={aColor} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) =>
        i % labelEvery === 0 ? (
          <text key={i} x={xOf(i)} y={h - 6} fontSize="9" fill="#6E6E73" textAnchor="middle">
            {String(d[labelKey])}
          </text>
        ) : null
      )}
    </svg>
  );
}

/* =========================================================================
   BarChart — single series vertical bars
   ========================================================================= */
export function BarChart({
  points,
  valueKey,
  labelKey = "hour",
  color = ACCENT.violet,
  height = 200,
}: {
  points: Record<string, any>[];
  valueKey: string;
  labelKey?: string;
  color?: string;
  height?: number;
}) {
  const w = 760;
  const h = height;
  const padB = 20;
  const padT = 10;
  const data = points && points.length ? points : [];
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
  const gap = 4;
  const bw = (w - gap * (data.length || 1)) / Math.max(data.length, 1);
  const labelEvery = Math.ceil(data.length / 12) || 1;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      {data.map((d, i) => {
        const v = Number(d[valueKey]) || 0;
        const bh = (h - padT - padB) * (v / max);
        const x = i * (bw + gap);
        const y = h - padB - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={Math.max(bh, 1)} rx="2" fill={color} fillOpacity="0.85" />
            {i % labelEvery === 0 && (
              <text x={x + bw / 2} y={h - 5} fontSize="9" fill="#6E6E73" textAnchor="middle">
                {String(d[labelKey])}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* =========================================================================
   ModuleHeader — consistent premium hero for every module page
   ========================================================================= */
export function ModuleHeader({
  breadcrumb,
  title,
  subtitle,
  pills,
  actions,
}: {
  breadcrumb: string;
  title: string;
  subtitle?: string;
  pills?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-6 animate-fade-up">
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.18em] text-ink-600">{breadcrumb}</div>
        <h1 className="text-[26px] font-semibold tracking-tight text-gradient mt-1">{title}</h1>
        {subtitle && <p className="text-sm text-ink-400 mt-1.5 max-w-2xl">{subtitle}</p>}
        {pills && <div className="flex flex-wrap items-center gap-2 mt-3">{pills}</div>}
      </div>
      {actions && <div className="lg:ml-auto flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

/* =========================================================================
   Form primitives — premium dark controls
   ========================================================================= */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-ink-400">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="block text-[10px] text-ink-600 mt-1">{hint}</span>}
    </label>
  );
}

export function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input appearance-none cursor-pointer">
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-bg-800">{o.label}</option>
      ))}
    </select>
  );
}

export function KV({ k, v, mono = true }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-[12px] text-ink-500">{k}</span>
      <span className={clsx("text-[12px] text-ink-100 text-right", mono && "font-mono tabular-nums")}>{v}</span>
    </div>
  );
}

/* =========================================================================
   ProgressBar
   ========================================================================= */
export function ProgressBar({ percent, color = ACCENT.amber }: { percent: number; color?: string }) {
  const p = Math.max(0, Math.min(100, percent || 0));
  return (
    <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${p}%`, background: `linear-gradient(90deg, ${color}aa, ${color})` }}
      />
    </div>
  );
}
