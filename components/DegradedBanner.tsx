"use client";
import React, { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DegradedBanner() {
  const [isDegraded, setIsDegraded] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleDegraded = (e: Event) => {
      const customEvent = e as CustomEvent<{ isDegraded: boolean; message: string }>;
      setIsDegraded(customEvent.detail.isDegraded);
      if (customEvent.detail.message) {
        setMessage(customEvent.detail.message);
      }
    };

    window.addEventListener("VeklomDegradedState", handleDegraded);
    return () => window.removeEventListener("VeklomDegradedState", handleDegraded);
  }, []);

  return (
    <AnimatePresence>
      {isDegraded && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="relative z-[200] flex w-full items-center justify-between bg-cyan-500/20 px-4 py-2 border-b border-cyan-500/30 text-cyan-100"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium">{message || "Veklom Core Services are currently experiencing instability. Control Plane is in Read-Only Mode."}</span>
          </div>
          <button 
            onClick={() => setIsDegraded(false)}
            className="rounded p-1 hover:bg-cyan-500/20 text-cyan-200/70 hover:text-cyan-200"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
