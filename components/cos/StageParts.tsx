"use client";

import { Copy, Database, ShieldAlert } from"lucide-react";
import type { ProofStatus } from"@/lib/cos/capabilities";
import { ProofBadge } from"./ProofBadge";

export function Field({ label, value }: { label: string; value: unknown }) {
 const text = value === undefined || value === null || value ==="" ?"Not returned" : String(value);
 return (
 <div className="min-w-0 rounded-lg border border-cos-border bg-cos-bg/40 p-3">
 <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">{label}</div>
 <div title={text} className="mt-1 truncate font-mono text-xs tabular-nums text-cos-text">{text}</div>
 </div>
 );
}

export function JsonPanel({ value, empty ="No source-of-truth payload returned." }: { value: unknown; empty?: string }) {
 return value ? (
 <pre className="max-h-72 overflow-auto rounded-xl border border-cos-border bg-cos-bg/65 p-4 font-mono text-[10px] leading-5 text-cos-muted">{JSON.stringify(value, null, 2)}</pre>
 ) : <div className="rounded-xl border border-dashed border-cos-border p-4 text-xs leading-5 text-cos-muted">{empty}</div>;
}

export function DataNotice({ proof, title, detail }: { proof: ProofStatus; title: string; detail: string }) {
 return <div className="flex items-start gap-3 rounded-xl border border-cos-border bg-cos-bg/35 p-4"><Database size={17} className="mt-0.5 shrink-0 text-cos-accent" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-sm text-cos-text">{title}</span><ProofBadge status={proof} /></div><p className="mt-2 text-xs leading-5 text-cos-muted">{detail}</p></div></div>;
}

export function FailureNotice({ detail }: { detail: string }) {
 return <div className="flex items-start gap-3 rounded-xl border border-cos-warn/30 bg-cos-warn/5 p-4"><ShieldAlert size={17} className="mt-0.5 shrink-0 text-cos-warn" /><p className="text-xs leading-5 text-cos-muted">{detail}</p></div>;
}

export function PaymentChallenge({ value }: { value: unknown }) {
 if (!value || typeof value !=="object" || Array.isArray(value)) return null;
 const payload = value as Record<string, unknown>;
 return (
 <div className="rounded-xl border border-cos-accent/30 bg-cos-accent/5 p-4">
 <div className="text-sm text-cos-text">Payment required to continue</div>
 <p className="mt-1 text-xs leading-5 text-cos-muted">
 This is a legitimate x402 protocol challenge. No payment was initiated.
 </p>
 <div className="mt-3 grid gap-2 sm:grid-cols-2">
 <Field label="Amount" value={payload.amount_usdc ?? payload.amount} />
 <Field label="Currency" value={payload.currency} />
 <Field label="Network" value={payload.network} />
 <Field label="Chain" value={payload.chain_id} />
 <Field label="Challenge" value={payload.challenge_id} />
 <Field label="Nonce" value={payload.nonce} />
 <Field label="Pay to" value={payload.pay_to} />
 <Field label="x402 version" value={payload.x402_version} />
 </div>
 </div>
 );
}

export function CopyValue({ value }: { value?: string }) {
 if (!value) return <span className="font-mono text-xs text-cos-steel">Not returned</span>;
 return <button type="button" title={value} onClick={() => void navigator.clipboard?.writeText(value)} className="group flex max-w-full items-center gap-2 font-mono text-xs tabular-nums text-cos-text"><span className="truncate">{value}</span><Copy size={12} className="shrink-0 text-cos-steel group-hover:text-cos-accent" /></button>;
}
