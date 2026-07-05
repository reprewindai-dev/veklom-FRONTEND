"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, ShieldAlert, Sparkles, X } from "lucide-react";
import { setTokens, getToken } from "@/lib/api";

interface InterventionEvent {
  type: string;
  message: string;
  code: string;
}

export function AmbientKeyPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [eventData, setEventData] = useState<InterventionEvent | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleIntervention = (e: Event) => {
      const customEvent = e as CustomEvent<InterventionEvent>;
      if (customEvent.detail.type === "MISSING_KEY") {
        setEventData(customEvent.detail);
        setIsOpen(true);
      }
    };

    window.addEventListener("AmbientIntervention", handleIntervention);
    return () => window.removeEventListener("AmbientIntervention", handleIntervention);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsSubmitting(true);
    
    try {
      // In a real implementation, this would call an endpoint to update the Execution Identity.
      // For this prototype, we simulate storing the key in the user's secure profile.
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log("Ambient cAPI successfully injected key:", apiKey);
      
      // Close modal
      setIsOpen(false);
      setApiKey("");
      
      // Optionally, we could automatically retry the failed fetch here if we stored the request context,
      // but for now, we just let the user retry manually.
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-black/80 p-8 shadow-2xl backdrop-blur-xl"
          >
            {/* Ambient Glow Effects */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/20 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-rose-500/20 blur-[80px]" />
            
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Ambient Intervention</h2>
                <p className="text-sm text-indigo-300">interlink-cAPI Edge Node</p>
              </div>
            </div>

            <div className="mb-6 rounded-lg border border-white/5 bg-white/5 p-4 text-sm text-white/80">
              <p className="mb-2">
                <span className="font-medium text-white">Execution Blocked:</span> Your task requires a Bring-Your-Own-Key (BYOK) credential that is currently missing from your Sovereign Identity.
              </p>
              {eventData?.message && (
                <p className="font-mono text-xs text-rose-400/80">
                  {eventData.code}: {eventData.message}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="sk-..."
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-white/30 transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20">
                    <Sparkles size={16} />
                  </div>
                </div>
                <p className="mt-2 text-xs text-white/50">
                  This key will be encrypted and embedded directly into your Execution Identity. It is never stored in plaintext or shared.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!apiKey.trim() || isSubmitting}
                  className="relative flex items-center justify-center overflow-hidden rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  ) : (
                    "Inject Credential"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
