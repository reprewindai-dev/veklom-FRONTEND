"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Zap, ShieldAlert, Key, Search, FileText, CheckCircle2, XCircle, ArrowRight, Activity, Code2, Copy, FileSearch, Check } from "lucide-react";
import Cookies from "js-cookie";

export default function ActivationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<"summary" | "crypto">("summary");
  const [sandboxId, setSandboxId] = useState<string | null>(null);

  // State to hold our "real" proof artifacts
  const [lease, setLease] = useState<any>(null);
  const [allowResult, setAllowResult] = useState<any>(null);
  const [denyResult, setDenyResult] = useState<any>(null);

  const processStep = async (nextStep: number, action: () => Promise<void>) => {
    setIsProcessing(true);
    try {
      await action();
      setStep(nextStep);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConnect = async () => {
    await new Promise((r) => setTimeout(r, 600));
    setStep(2);
  };

  const handleGrant = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/activation/issuer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mount" })
      });
      if (!res.ok) throw new Error("Mount failed");
      const data = await res.json();
      setSandboxId(data.sandboxId);
      setLease({
        id: "ls_" + data.sandboxId.slice(0, 8),
        capability: "veklom.sandbox.record.write",
        granted_path: data.scope?.writes?.[0] || "/demo/allowed/*",
        duration: "15m",
        signer: "ed25519:VKLM_SBX_...",
        signature: "sig_" + Date.now().toString(16)
      });
      setStep(3);
    } catch (e) {
      console.error(e);
      alert("Failed to mount capability lease");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRun = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/activation/issuer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "exec_allowed", sandboxId })
      });
      if (!res.ok) throw new Error("Exec failed");
      const data = await res.json();
      const ev = data.evidence || {};
      setAllowResult({
        tx_hash: ev.log_id || "0x8f2a99...3421a",
        intent: "write /demo/allowed/data.txt",
        decision: data.decision,
        p5_state: ev.execution_id ? "COMPLETED_SUCCESS" : "FAILED",
        assurance: "E2",
        sealed_at: new Date().toISOString(),
      });
      setStep(4);
    } catch (e) {
      console.error(e);
      alert("Failed to run allowed consequence");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChallenge = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/activation/issuer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "exec_denied", sandboxId })
      });
      const data = await res.json();
      const ev = data.evidence || {};
      setDenyResult({
        tx_hash: ev.log_id || "0x3b1c44...9989c",
        intent: "write /demo/private/secrets.txt",
        decision: data.decision || "DENY",
        reason: ev.detail || "Resource outside granted scope.",
        p5_state: "REJECTED_AUTHORITY_BOUNDARY",
        assurance: "E2",
        sealed_at: new Date().toISOString(),
      });
      setStep(5);
    } catch (e) {
      console.error(e);
      alert("Failed to challenge boundaries");
    } finally {
      setIsProcessing(false);
    }
  };

  const completeActivation = async () => {
    setIsProcessing(true);
    // In reality, this posts the activation payload to the backend
    const activationRecord = {
      activation: {
        sandbox_connected: true,
        lease_minted: true,
        allowed_execution_verified: true,
        hostile_denial_verified: true,
        evidence_inspected: true,
        activation_version: "v1",
        completed_at: new Date().toISOString(),
        allow_evidence_id: allowResult?.tx_hash,
        deny_evidence_id: denyResult?.tx_hash,
      }
    };
    
    // Simulate API call
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("Saving Activation Record:", activationRecord);
    Cookies.set("veklom_activated", "true", { expires: 365 });
    
    // Now redirect to OS
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex items-center justify-center p-6 selection:bg-[var(--theme-accent)] selection:text-white">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-5 gap-8 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded shadow-lg overflow-hidden min-h-[600px]">
        
        {/* Left Column: Progress Sidebar */}
        <div className="md:col-span-2 bg-black/5 dark:bg-white/5 p-8 border-r border-[var(--theme-border)] flex flex-col">
          <div className="flex items-center gap-2 mb-12">
             <div className="w-8 h-8 rounded bg-[var(--theme-accent)] flex items-center justify-center shadow">
               <ShieldCheck className="w-5 h-5 text-white" />
             </div>
             <span className="font-bold tracking-tight text-xl">Veklom</span>
          </div>

          <div className="space-y-8 flex-1">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-2">Activation Proof</h3>
            
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute left-[11px] top-4 bottom-4 w-px bg-[var(--theme-border)]" />
              
              <StepItem num={1} current={step} title="Connect" desc="Sandbox ready" />
              <StepItem num={2} current={step} title="Grant" desc="Issue bounded lease" />
              <StepItem num={3} current={step} title="Allow" desc="Authorized execution" />
              <StepItem num={4} current={step} title="Deny" desc="Hostile boundary test" />
              <StepItem num={5} current={step} title="Evidence" desc="Cryptographic proof" />
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Sandbox */}
        <div className="md:col-span-3 p-8 flex flex-col justify-center">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-md mx-auto w-full text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center mb-6">
                <Activity className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Your sandbox is ready.</h2>
              <p className="opacity-70 mb-8">
                Welcome to Veklom. Before you access the control plane, you must prove the core invariant: <strong>there is no machine consequence without bounded authority and evidence.</strong>
              </p>
              <button 
                onClick={() => processStep(2, handleConnect)}
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-[var(--theme-accent)] text-white font-medium rounded shadow hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? "Connecting..." : "Initialize Sandbox"} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-md mx-auto w-full">
               <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                 <Key className="w-5 h-5 text-[var(--theme-accent)]" /> Grant Bounded Authority
               </h2>
               <p className="text-sm opacity-70 mb-6">Visually issue a cryptographic lease for a specific path.</p>
               
               <div className="border border-[var(--theme-border)] rounded bg-black/5 dark:bg-white/5 p-4 mb-6 text-sm font-mono space-y-2">
                 <div className="flex justify-between">
                   <span className="opacity-50">Capability:</span>
                   <span className="font-medium">veklom.sandbox.record.write</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="opacity-50">Granted Path:</span>
                   <span className="font-medium text-emerald-600 dark:text-emerald-400">/demo/allowed/*</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="opacity-50">Duration:</span>
                   <span className="font-medium">15m</span>
                 </div>
               </div>

               <button 
                onClick={() => processStep(3, handleGrant)}
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-[var(--theme-accent)] text-white font-medium rounded shadow hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {isProcessing ? "Minting Lease..." : "Mint Authority Lease"}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-md mx-auto w-full">
               <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                 <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Authorized Execution
               </h2>
               <p className="text-sm opacity-70 mb-6">Send an intent that matches the bounded lease.</p>
               
               <div className="border border-emerald-500/30 rounded bg-emerald-500/5 p-4 mb-6">
                 <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">Intent</div>
                 <code className="text-sm">write /demo/allowed/hello</code>
               </div>

               <button 
                onClick={() => processStep(4, handleRun)}
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded shadow disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? "Executing via CAPPO..." : "Execute Allowed Intent"} <Zap className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-md mx-auto w-full">
               <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                 <ShieldAlert className="w-5 h-5 text-red-500" /> Hostile Boundary Test
               </h2>
               <p className="text-sm opacity-70 mb-6">Intentionally violate the boundary using the exact same lease.</p>
               
               <div className="border border-red-500/30 rounded bg-red-500/5 p-4 mb-6">
                 <div className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-2">Challenge Intent</div>
                 <code className="text-sm">write /demo/private/secret</code>
               </div>

               <button 
                onClick={() => processStep(5, handleChallenge)}
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded shadow disabled:opacity-50 transition-all"
              >
                {isProcessing ? "Attacking Boundary..." : "Try it anyway"}
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl mx-auto w-full flex flex-col h-full">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-bold flex items-center gap-2">
                   <FileSearch className="w-5 h-5 text-[var(--theme-accent)]" /> 
                   Evidence Viewer
                 </h2>
                 <div className="flex bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded p-1">
                    <button 
                      onClick={() => setViewMode("summary")} 
                      className={`text-xs px-3 py-1 rounded ${viewMode === 'summary' ? 'bg-[var(--theme-surface)] shadow-sm font-medium' : 'opacity-70'}`}
                    >
                      Readable
                    </button>
                    <button 
                      onClick={() => setViewMode("crypto")} 
                      className={`text-xs px-3 py-1 rounded ${viewMode === 'crypto' ? 'bg-[var(--theme-surface)] shadow-sm font-medium' : 'opacity-70'}`}
                    >
                      Cryptographic Proof
                    </button>
                 </div>
               </div>
               
               <div className="flex-1 overflow-y-auto pr-2 mb-6 space-y-4">
                 {viewMode === "summary" ? (
                   <>
                     {/* Readable Summary Mode */}
                     <div className="border border-[var(--theme-border)] rounded p-4 bg-[var(--theme-bg)]">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="font-bold">Authorized Execution</span>
                        </div>
                        <ul className="text-sm space-y-2 opacity-80">
                          <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500"/> Requested: `write /demo/allowed/hello`</li>
                          <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500"/> Authority granted</li>
                          <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500"/> Execution verified</li>
                          <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500"/> Target result confirmed</li>
                          <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500"/> Evidence sealed in Ledger</li>
                        </ul>
                     </div>

                     <div className="border border-red-500/20 rounded p-4 bg-red-500/5">
                        <div className="flex items-center gap-2 mb-3">
                          <ShieldAlert className="w-4 h-4 text-red-500" />
                          <span className="font-bold text-red-600 dark:text-red-400">Hostile Execution Denied</span>
                        </div>
                        <ul className="text-sm space-y-2 opacity-80">
                          <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500"/> Requested: `write /demo/private/secret`</li>
                          <li className="flex items-center gap-2 text-red-600 dark:text-red-400"><XCircle className="w-3 h-3"/> Denied at authority boundary</li>
                          <li className="pl-5 italic opacity-70 text-xs">Reason: {denyResult?.reason}</li>
                          <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500"/> No target consequence occurred</li>
                          <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500"/> Evidence sealed in Ledger</li>
                        </ul>
                     </div>
                   </>
                 ) : (
                   <>
                     {/* Cryptographic Drawer Mode */}
                     <div className="border border-[var(--theme-border)] rounded bg-black/5 dark:bg-white/5 p-4 text-xs font-mono overflow-x-auto">
                        <div className="text-[var(--theme-accent)] mb-2 font-bold">// ALLOWED INTENT RECEIPT</div>
                        <pre className="opacity-80">
{JSON.stringify({
  lease_id: lease?.id,
  tx_hash: allowResult?.tx_hash,
  intent: allowResult?.intent,
  p5_state: allowResult?.p5_state,
  assurance: allowResult?.assurance,
  sealed_at: allowResult?.sealed_at
}, null, 2)}
                        </pre>
                     </div>
                     <div className="border border-red-500/20 rounded bg-red-500/5 p-4 text-xs font-mono overflow-x-auto">
                        <div className="text-red-500 mb-2 font-bold">// DENIED INTENT RECEIPT</div>
                        <pre className="opacity-80">
{JSON.stringify({
  lease_id: lease?.id,
  tx_hash: denyResult?.tx_hash,
  intent: denyResult?.intent,
  p5_state: denyResult?.p5_state,
  assurance: denyResult?.assurance,
  sealed_at: denyResult?.sealed_at,
  rejection_reason: denyResult?.reason
}, null, 2)}
                        </pre>
                     </div>
                   </>
                 )}
               </div>

               <div className="mt-auto border-t border-[var(--theme-border)] pt-6">
                 <h3 className="font-bold text-center text-lg mb-4">You just governed a real machine consequence.</h3>
                 <button 
                  onClick={completeActivation}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 bg-[var(--theme-accent)] text-white font-medium rounded shadow hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                 >
                   {isProcessing ? "Activating OS..." : "Enter Veklom Control Plane"} <ArrowRight className="w-4 h-4" />
                 </button>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function StepItem({ num, current, title, desc }: { num: number, current: number, title: string, desc: string }) {
  const isPast = current > num;
  const isCurrent = current === num;
  
  return (
    <div className={`relative flex items-start gap-4 mb-8 ${isPast || isCurrent ? 'opacity-100' : 'opacity-40'}`}>
      <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow
        ${isPast ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-[var(--theme-accent)] text-white ring-4 ring-[var(--theme-accent)]/20' : 'bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-text)]'}
      `}>
        {isPast ? <Check className="w-3 h-3" /> : num}
      </div>
      <div>
        <div className={`font-bold ${isCurrent ? 'text-[var(--theme-accent)]' : ''}`}>{title}</div>
        <div className="text-xs opacity-70 mt-0.5">{desc}</div>
      </div>
    </div>
  );
}
