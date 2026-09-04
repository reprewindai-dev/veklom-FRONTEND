'use client';

import { useState } from "react";
import { Fingerprint, RefreshCw, Copy, Check, ShieldCheck, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

interface IdentityBundle {
  workspace_id?: string;
  pgl_cert_id?: string;
  issued_at?: string;
  chain_root?: string;
  verified?: boolean;
  // PGL registry fallback shape
  agent_id?: string;
  identity_hash?: string;
  genome_hash?: string;
  certificate_id?: string;
  jurisdiction?: string;
  risk_category?: string;
  signature?: string;
  declared_purpose?: string;
}

export default function ExecutionIdentityV1Control() {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [identity, setIdentity] = useState<IdentityBundle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchIdentity = async () => {
    setLoading(true);
    setError(null);
    try {
      // Pull from the live BYOS PGL certificate endpoint (JWT-authenticated)
      const data = await api<IdentityBundle>("/api/v1/pgl/certificate");
      setIdentity(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch identity from PGL.");
    } finally {
      setLoading(false);
    }
  };

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  // Normalise fields from whichever shape the backend returns
  const fields: [string, string][] = identity
    ? [
        ["Certificate ID", identity.pgl_cert_id ?? identity.certificate_id ?? "—"],
        ["Chain Root / Identity Hash", identity.chain_root ?? identity.identity_hash ?? "—"],
        ["Workspace / Genome Hash", identity.workspace_id ?? identity.genome_hash ?? "—"],
        ["Jurisdiction", identity.jurisdiction ?? "CA-QC"],
        ["Risk Category", identity.risk_category ?? "low"],
        ["Signature", identity.signature ?? "—"],
      ]
    : [];

  const agentLabel = identity
    ? identity.pgl_cert_id ?? identity.agent_id ?? "Unknown"
    : null;

  const issuedAt = identity?.issued_at
    ? new Date(identity.issued_at).toLocaleString()
    : null;

  return (
    <div className="bg-cos-bg border border-cos-border rounded-xl p-6 shadow-[inset_0_4px_24px_rgba(0,0,0,0.6)] flex flex-col gap-6">
      <div className="border-b border-cos-border pb-4">
        <h2 className="text-sm font-black text-cos-text uppercase tracking-tight flex items-center gap-2">
          <Fingerprint className="text-cos-accent size-5" />
          Execution Identity
        </h2>
        <p className="text-[10px] text-cos-muted mt-2 font-mono uppercase tracking-widest leading-relaxed">
          Retrieve the live cryptographic execution identity bundle from the PGL certificate endpoint.
        </p>
      </div>

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-[9px] font-black tracking-widest uppercase text-cos-muted mb-2">SOURCE:</label>
          <div className="w-full bg-cos-surface border border-cos-border rounded-md px-3 py-2 text-xs font-mono text-cos-muted">
            api.veklom.com → /api/v1/pgl/certificate
          </div>
        </div>
        <button
          onClick={fetchIdentity}
          disabled={loading}
          className="flex items-center gap-2 bg-cos-accent/10 hover:bg-cos-accent/20 border border-cos-accent/30 text-cos-accent px-4 py-2 rounded-md text-[10px] font-black tracking-widest uppercase transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "FETCHING..." : "FETCH IDENTITY"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-cos-danger/10 border border-cos-danger/30 rounded-lg px-4 py-3">
          <AlertCircle className="size-4 text-cos-danger flex-shrink-0" />
          <p className="text-[10px] font-mono text-cos-danger uppercase tracking-wide">{error}</p>
        </div>
      )}

      {!identity && !error && (
        <div className="bg-cos-surface border border-cos-border rounded-xl p-5 text-center">
          <p className="text-[10px] font-mono text-cos-muted uppercase tracking-widest">
            Click "Fetch Identity" to pull a live PGL certificate from api.veklom.com
          </p>
        </div>
      )}

      {identity && (
        <div className="bg-cos-surface border border-cos-border rounded-xl p-5 flex flex-col gap-5">
          <div className="flex items-center gap-2 text-cos-verified text-[10px] font-black tracking-widest uppercase">
            <ShieldCheck className="size-4" />
            Live identity bundle loaded — {agentLabel}
          </div>
          <div className="flex flex-col gap-4">
            {identity.declared_purpose && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-black text-cos-muted uppercase tracking-widest">Declared Purpose:</span>
                <span className="text-[11px] font-mono text-cos-text uppercase">{identity.declared_purpose}</span>
              </div>
            )}
            {issuedAt && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-black text-cos-muted uppercase tracking-widest">Issued At:</span>
                <span className="text-[11px] font-mono text-cos-text uppercase">{issuedAt}</span>
              </div>
            )}
            {fields.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1.5">
                <span className="text-[8px] font-black text-cos-muted uppercase tracking-widest">{label}:</span>
                <div className="flex items-center gap-2">
                  <code className="text-[10px] font-mono text-cos-accent bg-cos-bg border border-cos-border rounded px-2 py-1 flex-1 truncate select-all">
                    {value}
                  </code>
                  <button
                    onClick={() => copy(value, label)}
                    className="text-cos-muted hover:text-cos-text transition-colors p-1 bg-cos-bg border border-cos-border rounded"
                  >
                    {copied === label ? <Check className="size-3 text-cos-verified" /> : <Copy className="size-3" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
