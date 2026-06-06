"use client";

import { useState } from "react";
import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import { Button, ErrorBox, SuccessBox } from "@/components/ui";
import { ModuleHeader, SectionCard, Pill, Field, Select } from "@/components/telemetry";
import { api } from "@/lib/api";
import { ScanSearch, EyeOff, Download, Trash2, Clock } from "lucide-react";

const STRATEGIES = ["redact", "hash", "replace", "partial"].map((s) => ({ value: s, label: s }));
const DATA_TYPES = ["execution_logs", "audit_logs", "conversations", "api_keys"].map((s) => ({ value: s, label: s }));

export default function PrivacyPage() {
  // PII detect
  const [dText, setDText] = useState("Contact John Smith at john@example.com or 555-123-4567. SSN 123-45-6789.");
  const [dBusy, setDBusy] = useState(false);
  const [dErr, setDErr] = useState<string>();
  const [det, setDet] = useState<any>();

  // PII mask
  const [mText, setMText] = useState("John Smith: john@example.com, card 4111-1111-1111-1111");
  const [strategy, setStrategy] = useState("redact");
  const [mBusy, setMBusy] = useState(false);
  const [mErr, setMErr] = useState<string>();
  const [mask, setMask] = useState<any>();

  // Retention
  const [rType, setRType] = useState("execution_logs");
  const [rDays, setRDays] = useState("90");
  const [rBusy, setRBusy] = useState(false);
  const [rMsg, setRMsg] = useState<string>();
  const [rErr, setRErr] = useState<string>();

  // GDPR
  const [expBusy, setExpBusy] = useState(false);
  const [expErr, setExpErr] = useState<string>();
  const [confirm, setConfirm] = useState("");
  const [delBusy, setDelBusy] = useState(false);
  const [delMsg, setDelMsg] = useState<string>();
  const [delErr, setDelErr] = useState<string>();

  async function detect() {
    setDBusy(true); setDErr(undefined);
    try { setDet(await api("/api/v1/privacy/detect-pii", { method: "POST", body: { text: dText } })); }
    catch (e) { setDErr((e as Error).message); } finally { setDBusy(false); }
  }
  async function maskIt() {
    setMBusy(true); setMErr(undefined);
    try { setMask(await api("/api/v1/privacy/mask-pii", { method: "POST", body: { text: mText, strategy } })); }
    catch (e) { setMErr((e as Error).message); } finally { setMBusy(false); }
  }
  async function setRetention() {
    setRBusy(true); setRErr(undefined); setRMsg(undefined);
    try {
      await api("/api/v1/privacy/retention-policy", { method: "POST", body: { data_type: rType, retention_days: Number(rDays) } });
      setRMsg(`Retention for ${rType} set to ${rDays} days.`);
    } catch (e) { setRErr((e as Error).message); } finally { setRBusy(false); }
  }
  async function exportData() {
    setExpBusy(true); setExpErr(undefined);
    try {
      const data = await api<any>("/api/v1/privacy/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `veklom-data-export-${Date.now()}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { setExpErr((e as Error).message); } finally { setExpBusy(false); }
  }
  async function deleteAccount() {
    setDelBusy(true); setDelErr(undefined); setDelMsg(undefined);
    try {
      await api("/api/v1/privacy/delete-account", { method: "DELETE", body: { confirmation: confirm } });
      setDelMsg("Deletion request accepted. Your data is being purged.");
    } catch (e) { setDelErr((e as Error).message); } finally { setDelBusy(false); }
  }

  return (
    <Shell>
      <TierGate required="sovereign" feature="Privacy Controls">
        <ModuleHeader
          breadcrumb="Governance · Privacy"
          title="Privacy & data rights"
          subtitle="On-prem PII detection and masking, GDPR Article 15 export, Article 17 erasure, and retention policy — zero PII leaves your perimeter."
          pills={<><Pill tone="green">On-prem detection</Pill><Pill tone="cyan">GDPR Art. 15 / 17</Pill><Pill tone="amber">AES-256 at rest</Pill></>}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <SectionCard label="Live engine · /privacy/detect-pii" title="PII detector" actions={<ScanSearch size={15} className="text-brand-400" />}>
            <Field label="Text to scan"><textarea className="input min-h-[88px] resize-y" value={dText} onChange={(e) => setDText(e.target.value)} /></Field>
            <div className="mt-3"><Button onClick={detect} loading={dBusy}>Scan for PII</Button></div>
            {dErr && <div className="mt-3"><ErrorBox message={dErr} /></div>}
            {det && !dErr && (
              <div className="mt-4 rounded-xl border border-border bg-white/[0.02] p-4">
                <div className="flex items-center gap-2">
                  <Pill tone={det.has_pii ? "red" : "green"}>{det.has_pii ? "PII detected" : "No PII"}</Pill>
                  <span className="text-sm text-ink-300">{det.count ?? 0} item(s)</span>
                </div>
                {Array.isArray(det.pii_types) && det.pii_types.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {det.pii_types.map((t: string) => <Pill key={t} tone="amber">{t}</Pill>)}
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard label="Live engine · /privacy/mask-pii" title="PII masker" actions={<EyeOff size={15} className="text-brand-400" />}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2"><Field label="Text"><textarea className="input min-h-[64px] resize-y" value={mText} onChange={(e) => setMText(e.target.value)} /></Field></div>
              <Field label="Strategy"><Select value={strategy} onChange={setStrategy} options={STRATEGIES} /></Field>
            </div>
            <div className="mt-3"><Button onClick={maskIt} loading={mBusy}>Mask PII</Button></div>
            {mErr && <div className="mt-3"><ErrorBox message={mErr} /></div>}
            {mask && !mErr && (
              <div className="mt-4 rounded-xl border border-border bg-white/[0.02] p-4">
                <div className="text-[10px] uppercase tracking-wider text-ink-600 mb-1.5">Masked output</div>
                <p className="font-mono text-[13px] text-ink-100 break-words">{mask.masked_text}</p>
                {Array.isArray(mask.pii_found) && mask.pii_found.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">{mask.pii_found.map((t: string) => <Pill key={t} tone="amber">{t}</Pill>)}</div>
                )}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SectionCard label="GDPR Article 15" title="Right to access" actions={<Download size={15} className="text-brand-400" />}>
            <p className="text-[12px] text-ink-400">Export every record tied to this account — users, executions, audit logs, API-key metadata.</p>
            <div className="mt-3"><Button onClick={exportData} loading={expBusy} variant="ghost">Download data export</Button></div>
            {expErr && <div className="mt-3"><ErrorBox message={expErr} /></div>}
          </SectionCard>

          <SectionCard label="Retention · /privacy/retention-policy" title="Retention policy" actions={<Clock size={15} className="text-brand-400" />}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Data type"><Select value={rType} onChange={setRType} options={DATA_TYPES} /></Field>
              <Field label="Retain (days)"><input className="input" value={rDays} onChange={(e) => setRDays(e.target.value)} /></Field>
            </div>
            <div className="mt-3"><Button onClick={setRetention} loading={rBusy} variant="ghost">Apply policy</Button></div>
            {rErr && <div className="mt-3"><ErrorBox message={rErr} /></div>}
            {rMsg && <div className="mt-3"><SuccessBox message={rMsg} /></div>}
          </SectionCard>

          <SectionCard label="GDPR Article 17" title="Right to erasure" actions={<Trash2 size={15} className="text-accent-red" />}>
            <p className="text-[12px] text-ink-400">Irreversible. Type <span className="font-mono text-accent-red">DELETE MY ACCOUNT</span> to confirm.</p>
            <input className="input mt-3" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="DELETE MY ACCOUNT" />
            <div className="mt-3">
              <Button onClick={deleteAccount} loading={delBusy} variant="danger" disabled={confirm !== "DELETE MY ACCOUNT"}>Erase all data</Button>
            </div>
            {delErr && <div className="mt-3"><ErrorBox message={delErr} /></div>}
            {delMsg && <div className="mt-3"><SuccessBox message={delMsg} /></div>}
          </SectionCard>
        </div>
      </TierGate>
    </Shell>
  );
}
