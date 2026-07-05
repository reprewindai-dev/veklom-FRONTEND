import React, { useEffect, useState } from "react";
import { AlertOctagon, X, ShieldAlert, KeyRound, Sparkles, CheckCircle2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InterventionEvent {
  type: string;
  message: string;
  code: string;
  metadata?: any;
}

export default function AmbientIntervention() {
  const [isOpen, setIsOpen] = useState(false);
  const [eventData, setEventData] = useState<InterventionEvent | null>(null);
  
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleIntervention = (e: Event) => {
      const customEvent = e as CustomEvent<InterventionEvent>;
      if (["MISSING_KEY", "QUARANTINE", "PAYMENT_REQUIRED"].includes(customEvent.detail.type)) {
        setEventData(customEvent.detail);
        setIsOpen(true);
      }
    };

    window.addEventListener("AmbientIntervention", handleIntervention);
    return () => window.removeEventListener("AmbientIntervention", handleIntervention);
  }, []);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Real-World Hardening: Dispatch resolution event to unblock the agent
      let resolutionData = {};
      if (eventData?.type === "MISSING_KEY") {
        resolutionData = { api_key: apiKey };
      } else if (eventData?.type === "QUARANTINE") {
        resolutionData = { approved: true };
      } else if (eventData?.type === "PAYMENT_REQUIRED") {
        resolutionData = { vnp_injected: 15.00 }; // Hardcoded for this UI logic
      }

      window.dispatchEvent(
        new CustomEvent("AmbientInterventionResolved", {
          detail: {
            originalEvent: eventData,
            resolution: resolutionData
          }
        })
      );
      
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsOpen(false);
      setApiKey("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 font-sans">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={() => setIsOpen(false)}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0c] p-8 shadow-2xl backdrop-blur-xl"
        >
          {/* Ambient Glow Effects */}
          <div className={`pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full blur-[80px] ${
            eventData?.type === "QUARANTINE" ? "bg-amber-500/20" : 
            eventData?.type === "PAYMENT_REQUIRED" ? "bg-emerald-500/20" : "bg-indigo-500/20"
          }`} />
          
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-4 rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>

          <div className="mb-6 flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full border ${
              eventData?.type === "QUARANTINE" ? "border-amber-500/30 bg-amber-500/10 text-amber-400" : 
              eventData?.type === "PAYMENT_REQUIRED" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" :
              "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
            }`}>
              {eventData?.type === "QUARANTINE" ? <AlertOctagon size={24} /> : 
               eventData?.type === "PAYMENT_REQUIRED" ? <Zap size={24} /> : 
               <ShieldAlert size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {eventData?.type === "QUARANTINE" ? "Safety Layer Quarantine" : 
                 eventData?.type === "PAYMENT_REQUIRED" ? "VNP Micro-Stake Required" : 
                 "Ambient Intervention"}
              </h2>
              <p className={`text-sm ${
                eventData?.type === "QUARANTINE" ? "text-amber-300" : 
                eventData?.type === "PAYMENT_REQUIRED" ? "text-emerald-300" : "text-indigo-300"
              }`}>
                Ambient Control Edge Node
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-lg border border-white/5 bg-white/5 p-4 text-sm text-white/80">
            <p className="mb-2">
              <span className="font-medium text-white">Execution Blocked: </span> 
              {eventData?.type === "QUARANTINE" && "A critical anomaly was detected in this agent's behavior. The capability execution has been quarantined and requires M-of-N human approval."}
              {eventData?.type === "PAYMENT_REQUIRED" && "Agent workload exceeds allocated budget constraints. x402 Payment Required. Inject VNP Micro-Stakes to unblock."}
              {eventData?.type === "MISSING_KEY" && "Your task requires a Bring-Your-Own-Key (BYOK) credential that is currently missing from your Sovereign Identity."}
            </p>
            {eventData?.message && (
              <p className="font-mono text-xs text-rose-400/80 mt-2">
                {eventData.code}: {eventData.message}
              </p>
            )}
          </div>

          {eventData?.type === "MISSING_KEY" && (
            <form onSubmit={handleAction} className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-white/90">
                  <KeyRound size={16} className="text-indigo-400" />
                  Provider API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="submit" className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-500">
                  {isSubmitting ? "Processing..." : "Inject Credential"}
                </button>
              </div>
            </form>
          )}

          {eventData?.type === "QUARANTINE" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-white/50 uppercase tracking-wider">Quorum Status</span>
                  <span className="text-xs font-mono text-amber-400">0 / {eventData?.metadata?.required_count || 2} Approvals</span>
                </div>
                <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-[0%]"></div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={handleAction} className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-500 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Provide Signature
                </button>
              </div>
            </div>
          )}

          {eventData?.type === "PAYMENT_REQUIRED" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Required Stake</div>
                  <div className="text-lg font-mono text-emerald-400">15.00 VNP</div>
                </div>
                <div>
                  <div className="text-xs text-white/50 uppercase tracking-wider mb-1 text-right">Available</div>
                  <div className="text-lg font-mono text-white/70 text-right">45.00 VNP</div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={handleAction} className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 flex items-center gap-2">
                  <Zap size={16} /> Inject Stake
                </button>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
