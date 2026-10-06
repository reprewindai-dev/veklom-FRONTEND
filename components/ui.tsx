"use client";

import clsx from"clsx";
import { ReactNode, useId } from"react";
import { AlertTriangle, CheckCircle2, Github } from"lucide-react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
 return (
 <div className="flex items-start gap-4 mb-6 animate-fade-up">
 <div>
 <h1 className="text-2xl font-semibold tracking-tight text-gradient">{title}</h1>
 {subtitle && <p className="text-sm text-ink-400 mt-1.5 max-w-2xl">{subtitle}</p>}
 </div>
 {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
 </div>
 );
}

export function Card({ children, className, hover, onClick }: { children: ReactNode; className?: string; hover?: boolean; onClick?: () => void }) {
 return <div onClick={onClick} className={clsx("card p-5", hover &&"card-hover", className)}>{children}</div>;
}

export function StatCard({ label, value, hint, accent }: { label: string; value: ReactNode; hint?: string; accent?: string }) {
 return (
 <Card hover className="min-w-0 relative overflow-hidden">
 <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-brand-500/10 blur-2xl" />
 <div className="text-[11px] uppercase tracking-widest text-ink-400">{label}</div>
 <div className={clsx("mt-1.5 text-3xl font-semibold tracking-tight", accent)}>{value}</div>
 {hint && <div className="text-xs text-ink-400 mt-1">{hint}</div>}
 </Card>
 );
}

export function Spinner({ className }: { className?: string }) {
 return <span className={clsx("spinner", className)} aria-hidden />;
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
 return (
 <Card className="text-center py-10">
 <div className="text-ink-200">{title}</div>
 {hint && <div className="text-xs text-ink-400 mt-1">{hint}</div>}
 </Card>
 );
}

export function ErrorBox({ message, className }: { message: string; className?: string }) {
 return (
 <div className={clsx("flex items-start gap-2.5 rounded-xl border border-accent-red/40 bg-accent-red/10 px-4 py-3 text-accent-red text-sm", className)}>
 <AlertTriangle size={16} className="mt-0.5 shrink-0" />
 <span>{message}</span>
 </div>
 );
}

export function SuccessBox({ message }: { message: string }) {
 return (
 <div className="flex items-start gap-2.5 rounded-xl border border-accent-green/40 bg-accent-green/10 px-4 py-3 text-accent-green text-sm">
 <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
 <span>{message}</span>
 </div>
 );
}

export function Skeleton({ className }: { className?: string }) {
 return <div className={clsx("skeleton rounded-md", className)} />;
}

export function GithubButton({ onClick, label ="Continue with GitHub", disabled }: { onClick?: () => void; label?: string; disabled?: boolean }) {
 return (
 <button type="button" onClick={onClick} disabled={disabled} className="btn btn-ghost w-full">
 <Github size={16} />
 {label}
 </button>
 );
}

export function Table<T>({
 rows, columns, empty, rowKey,
}: {
 rows: T[];
 columns: { key: string; header: string; render: (r: T) => ReactNode; width?: string }[];
 empty?: string;
 rowKey: (r: T) => string;
}) {
 if (!rows || rows.length === 0) return <Empty title={empty ||"No records"} />;
 return (
 <Card className="overflow-x-auto p-0">
 <table className="min-w-full text-sm">
 <thead>
 <tr className="text-left text-[11px] uppercase tracking-widest text-ink-400 border-b border-border">
 {columns.map((c) => (
 <th key={c.key} className="px-4 py-3 font-medium" style={{ width: c.width }}>{c.header}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {rows.map((r) => (
 <tr key={rowKey(r)} className="border-b border-border/60 last:border-0 hover:bg-bg-700/40">
 {columns.map((c) => (
 <td key={c.key} className="px-4 py-3 align-top">{c.render(r)}</td>
 ))}
 </tr>
 ))}
 </tbody>
 </table>
 </Card>
 );
}

// The `btn`/`btn-primary`/`btn-ghost` classes this component used to rely on
// were never defined in any stylesheet, so every Button rendered as bare text
// and operators did not recognise actions as buttons. The look lives here now,
// in the Capability OS glass language (translucent fill, accent hairline,
// rounded-xl), built only from the `cos-*` theme tokens.
const BUTTON_BASE =
 "relative inline-flex items-center justify-center gap-2 rounded-xl border font-medium cursor-pointer select-none backdrop-blur-md " +
 "transition-[border-color,background-color,box-shadow] duration-200 motion-reduce:transition-none " +
 "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cos-accent focus-visible:ring-offset-2 focus-visible:ring-offset-cos-bg " +
 "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none";

const BUTTON_VARIANTS = {
 // Primary: stronger accent fill. Label stays on the theme text colour, which
 // keeps >= 4.5:1 contrast on the light and dark themes alike.
 primary:
 "border-cos-accent/70 bg-cos-accent/20 text-cos-text shadow-[0_0_0_1px_rgb(var(--theme-accent)/0.12),0_8px_24px_-14px_rgb(var(--theme-accent)/0.7)] " +
 "enabled:hover:border-cos-accent enabled:hover:bg-cos-accent/30 enabled:hover:shadow-[0_0_0_1px_rgb(var(--theme-accent)/0.35),0_10px_30px_-12px_rgb(var(--theme-accent)/0.8)]",
 // Secondary: glass.
 outline:
 "border-cos-accent/40 bg-cos-surface2/60 text-cos-text " +
 "enabled:hover:border-cos-accent/80 enabled:hover:shadow-[0_0_0_1px_rgb(var(--theme-accent)/0.2),0_8px_24px_-16px_rgb(var(--theme-accent)/0.6)]",
 ghost:
 "border-cos-border bg-cos-surface2/30 text-cos-text enabled:hover:border-cos-accent/60 enabled:hover:bg-cos-accent/10",
 danger:
 "border-cos-danger/50 bg-cos-danger/15 text-cos-text enabled:hover:border-cos-danger enabled:hover:bg-cos-danger/25",
} as const;

const BUTTON_SIZES = {
 sm: "h-8 px-3 text-xs",
 md: "h-10 px-4 text-sm",
 lg: "h-12 px-6 text-base",
} as const;

export function Button({ children, onClick, variant ="primary", type ="button", disabled, loading, className, size ="md", disabledReason }: {
 children: ReactNode; onClick?: () => void; variant?:"primary" |"ghost" |"danger" |"outline"; type?:"button" |"submit"; disabled?: boolean; loading?: boolean; className?: string; size?:"sm" |"md" |"lg";
 /** Shown as a tooltip and announced to assistive technology while the button is disabled. */
 disabledReason?: string;
}) {
 const hintId = useId();
 const isDisabled = Boolean(disabled || loading);
 const hint = isDisabled && !loading && disabledReason ? disabledReason : undefined;
 const button = (
 <button
 type={type} onClick={onClick} disabled={isDisabled}
 aria-describedby={hint ? hintId : undefined}
 title={hint}
 className={clsx(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)}
 >
 {loading && <Spinner />}
 {children}
 </button>
 );
 if (!hint) return button;
 // Disabled buttons do not receive pointer events in every browser, so the
 // tooltip is also carried by a wrapper, and the reason is in the a11y tree.
 return (
 <span className="inline-flex" title={hint}>
 {button}
 <span id={hintId} className="sr-only">{hint}</span>
 </span>
 );
}
