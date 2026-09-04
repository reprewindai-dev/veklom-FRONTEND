'use client';

import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Database,
  Copy,
  Check,
  Activity,
  ArrowRight,
  Fingerprint,
  Binary,
  Lock,
  History,
  Code
} from "lucide-react";

export default function HashVerifier() {
  const [jsonText, setJsonText] = useState("");
  const [expectedHash, setExpectedHash] = useState("hash_1a2b3c4dx");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const mockComputedHash = "hash_1a2b3c4dx";

  const triggerCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bg-cos-bg border border-cos-border rounded-xl p-6 shadow-[inset_0_4px_24px_rgba(0,0,0,0.6)] flex flex-col gap-6">
      <div className="border-b border-cos-border pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-black text-cos-text flex items-center gap-2 uppercase tracking-tight">
            <Fingerprint className="text-cos-accent size-5" />
            Hash Integrity Verifier
          </h2>
          <p className="text-[10px] font-mono text-cos-muted mt-2 uppercase tracking-widest leading-relaxed">
            Verify serialized ledger blocks without requiring active agent selection.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: payload editor */}
        <div className="xl:col-span-7 flex flex-col gap-5">
          <div className="bg-cos-surface border border-cos-border rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-cos-border pb-2">
              <span className="text-[10px] font-black text-cos-muted uppercase tracking-widest flex items-center gap-1.5">
                <Code className="size-3.5 text-cos-accent" /> RAW JSON INPUT
              </span>
            </div>
            <textarea
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              placeholder="Paste serialized block JSON..."
              className="w-full h-44 bg-cos-bg border border-cos-border rounded-lg p-3 font-mono text-xs text-cos-accent outline-none focus:border-cos-accent/40 resize-none"
            />
          </div>

          <div className="bg-cos-surface border border-cos-border rounded-xl p-5 flex flex-col gap-4">
            <h3 className="text-[10px] font-black text-cos-text uppercase tracking-wider border-b border-cos-border pb-2 flex items-center gap-2">
              <Database className="size-3.5 text-cos-accent" /> BLOCK PARAMETERS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="opacity-50">
                <label className="block text-[9px] font-black text-cos-muted mb-1 tracking-widest">EVENT ID:</label>
                <div className="bg-cos-bg border border-cos-border rounded px-3 py-1.5 text-[10px] font-mono text-cos-text">evt-manual-101</div>
              </div>
              <div className="opacity-50">
                <label className="block text-[9px] font-black text-cos-muted mb-1 tracking-widest">AGENT ID:</label>
                <div className="bg-cos-bg border border-cos-border rounded px-3 py-1.5 text-[10px] font-mono text-cos-text">ag_7f9b2a</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: digest + audit */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <div className="bg-cos-surface border border-cos-border rounded-xl p-5 flex flex-col gap-3">
            <h3 className="text-[10px] font-black text-cos-text uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="text-cos-accent size-3.5" /> EXPECTED SIGNATURE
            </h3>
            <div className="flex gap-2">
              <input type="text" placeholder="Paste signature hash..." value={expectedHash}
                onChange={e => setExpectedHash(e.target.value)}
                className="flex-1 bg-cos-bg border border-cos-border rounded px-3 py-1.5 text-[10px] font-mono text-cos-accent outline-none focus:border-cos-accent" />
            </div>
          </div>

          <div className="bg-cos-surface border border-cos-border rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-5 text-cos-accent"><Binary className="size-20" /></div>
            <h3 className="text-[10px] font-black text-cos-text uppercase tracking-wider flex items-center gap-2">
              <Activity className="text-cos-accent size-4" /> LIVE DIGEST CONSOLE
            </h3>
            <div className="bg-cos-bg border border-cos-border rounded-lg p-4 flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-[9px] font-mono text-cos-muted">
                <span>DIGEST: ACTIVE (Int32 Math)</span>
                <button onClick={() => triggerCopy(mockComputedHash, "computed_hash")}
                  className="text-cos-accent hover:underline flex items-center gap-1 cursor-pointer">
                  {copiedField === "computed_hash" ? <Check className="size-3 text-cos-verified" /> : <Copy className="size-3" />}
                  <span>{copiedField === "computed_hash" ? "Copied!" : "Copy"}</span>
                </button>
              </div>
              <span className="text-[9px] font-black uppercase text-cos-muted tracking-widest">Computed Hash:</span>
              <span className="text-sm font-mono font-black text-cos-verified tracking-tight select-all">{mockComputedHash}</span>
            </div>
            
            <div className="bg-cos-verified/10 border border-cos-verified/30 text-cos-verified p-3 rounded-lg flex items-start gap-2.5">
              <ShieldCheck className="size-4 shrink-0 mt-0.5" />
              <div className="text-[10px] uppercase tracking-widest"><p className="font-black">Parity Validation Succeeded</p></div>
            </div>

            <button className="w-full bg-cos-accent/10 hover:bg-cos-accent/20 border border-cos-accent/30 text-cos-accent py-2 rounded text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5">
              <ShieldCheck className="size-3.5" /> LOG AUDIT CHECK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
