"use client";

import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import { useApi } from "@/hooks/useApi";
import { Button, ErrorBox, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useState } from "react";
import { ModuleHeader, SectionCard, Pill, Field, KV } from "@/components/telemetry";
import { ShieldCheck, ShieldX, ShieldAlert, ScanLine, BadgeCheck } from "lucide-react";

const TAG_OPTIONS = ["explicit", "adult", "violence", "self_harm", "hate", "illegal"];

export default function ContentSafetyPage() {
  const ageStatus = useApi<any>("/api/v1/content-safety/age-verify/status");
  const [filename, setFilename] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [result, setResult] = useState<any>();
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);

  function toggleTag(t: string) { setTags((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]); }

  async function scan() {
    setBusy(true); setErr(undefined); setResult(undefined);
    try { setResult(await api<any>("/api/v1/content-safety/scan", { method: "POST", body: { filename, tags } })); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  async function verifyAge() {
    setVerifying(true);
    try { await api("/api/v1/content-safety/age-verify", { method: "POST", body: { method: "self_attestation" } }); ageStatus.mutate(); }
    catch { /* ignore */ } finally { setVerifying(false); }
  }

  const a = ageStatus.data || {};
  const blocked = result && result.allowed === false;
  const adult = result && result.requires_age_verification;

  return (
    <Shell>
      <TierGate required="pro" feature="Content Safety">
        <ModuleHeader
          breadcrumb="Governance · Content Safety"
          title="Content safety scanner"
          subtitle="Pre-execution classification with zero-tolerance illegal-content blocking and age-gating for restricted categories."
          pills={<Pill tone={a.status === "verified" ? "green" : "amber"} dot>Age: {a.status || "unverified"}</Pill>}
        />

        <div className="grid lg:grid-cols-2 gap-4">
          <SectionCard label="Classify" title="Live scan">
            <div className="space-y-3">
              <Field label="Filename / reference"><input className="input" value={filename} onChange={(e) => setFilename(e.target.value)} placeholder="upload.pdf" /></Field>
              <Field label="Declared tags">
                <div className="flex flex-wrap gap-1.5">
                  {TAG_OPTIONS.map((t) => (
                    <button key={t} onClick={() => toggleTag(t)} className={tags.includes(t)
                      ? "px-2.5 py-1 rounded-lg text-[11px] bg-brand-500/15 text-brand-400 border border-brand-500/30"
                      : "px-2.5 py-1 rounded-lg text-[11px] text-ink-400 border border-border hover:text-ink-200"}>{t}</button>
                  ))}
                </div>
              </Field>
              <Button onClick={scan} loading={busy} className="w-full"><ScanLine size={14} /> Run safety scan</Button>
              {err && <ErrorBox message={err} />}
            </div>

            {result && (
              <div className={`mt-4 rounded-xl border p-4 ${blocked ? "border-accent-red/40 bg-accent-red/10" : adult ? "border-brand-500/40 bg-brand-500/10" : "border-accent-green/40 bg-accent-green/10"}`}>
                <div className="flex items-center gap-2 mb-2">
                  {blocked ? <ShieldX size={18} className="text-accent-red" /> : adult ? <ShieldAlert size={18} className="text-brand-400" /> : <ShieldCheck size={18} className="text-accent-green" />}
                  <span className="text-[15px] font-semibold">{blocked ? "Blocked" : adult ? "Allowed · age-gated" : "Allowed"}</span>
                  <Pill tone={blocked ? "red" : adult ? "amber" : "green"} className="ml-auto">{result.action}</Pill>
                </div>
                <KV k="Category" v={result.category} mono={false} />
                <KV k="Confidence" v={`${Math.round((result.confidence ?? 0) * 100)}%`} />
                <KV k="Flags" v={(result.flags || []).join(", ") || "none"} mono={false} />
                <KV k="Age verification" v={result.requires_age_verification ? "required" : "not required"} mono={false} />
                {result.message && <div className="text-[12px] text-accent-red mt-2">{result.message}</div>}
              </div>
            )}
          </SectionCard>

          <SectionCard label="Restricted flows" title="Age verification">
            {ageStatus.isLoading ? <Spinner /> : (
              <>
                <div className="flex items-center gap-3 card p-4 mb-3">
                  <BadgeCheck size={20} className={a.status === "verified" ? "text-accent-green" : "text-ink-500"} />
                  <div>
                    <div className="text-[14px] font-semibold capitalize">{a.status || "unverified"}</div>
                    <div className="text-[11px] text-ink-600">{a.verification_method ? a.verification_method.replace(/_/g, " ") : "no method on file"}</div>
                  </div>
                  <Pill tone={a.status === "verified" ? "green" : "amber"} className="ml-auto">{a.status || "—"}</Pill>
                </div>
                <div className="card p-3">
                  <KV k="Verified at" v={(a.verified_at || "").slice(0, 19).replace("T", " ") || "—"} mono={false} />
                  <KV k="Expires" v={(a.expires_at || "").slice(0, 10) || "—"} mono={false} />
                  <KV k="Method" v={a.verification_method || "—"} mono={false} />
                </div>
                <Button onClick={verifyAge} loading={verifying} variant="ghost" className="w-full mt-3"><BadgeCheck size={14} /> Re-run age verification</Button>
                <p className="text-[11px] text-ink-500 mt-3">Adult-classified content requires a valid verification token before it can be served through governed endpoints.</p>
              </>
            )}
          </SectionCard>
        </div>
      </TierGate>
    </Shell>
  );
}
