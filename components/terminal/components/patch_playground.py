import re
import sys

def modify_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add imports
    if "import { Pipeline }" not in content:
        content = content.replace(
            "import { motion, AnimatePresence } from 'framer-motion';",
            "import { motion, AnimatePresence } from 'framer-motion';\nimport { Pipeline } from '@/components/pipeline/Pipeline';\nimport type { PhaseTrace } from '@/lib/covenant/types';"
        )

    # Add trace states
    if "const [trace, setTrace] = useState<PhaseTrace[] | null>(null);" not in content:
        content = content.replace(
            "const [currentStep, setCurrentStep] = useState<number>(0);",
            "const [currentStep, setCurrentStep] = useState<number>(0);\n  const [trace, setTrace] = useState<PhaseTrace[] | null>(null);\n  const [runId, setRunId] = useState<number>(0);"
        )

    # Rewrite handleExecute
    # Let's find handleExecute function body and replace it
    start_str = "const handleExecute = (threatId: string | null) => {"
    end_str = "const resetPlayground = () => {"
    
    start_idx = content.find(start_str)
    end_idx = content.find(end_str)
    
    if start_idx == -1 or end_idx == -1:
        print("Could not find handleExecute")
        return

    new_handle_execute = """const handleExecute = async (threatId: string | null) => {
    setActiveThreat(threatId);
    setExecutionState('running');
    setCurrentStep(0);
    setLogs([]);
    setSlashedStake(0);
    setFloatingValue(null);
    setTrace([]);
    const rid = Date.now();
    setRunId(rid);

    let payloadStr = '{}';
    if (threatId === 'injection') {
      payloadStr = '{"cmd": "rm -rf /"}'; // triggers SYSTEM_POLICY_VETO
    } else if (threatId === 'depth') {
      payloadStr = '{"a": {"b": {"c": {"d": {"e": {"f": {"g": 1}}}}}}}'; // triggers RECURSIVE_DEPTH_LIMIT_EXCEEDED
    } else if (threatId === 'credentials') {
      payloadStr = '{"req": "fetch_aws"}'; 
    }

    try {
      const res = await fetch('/api/v1/capi/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: "agent-atlas", // Using valid mock agent
          pgl_id: "valid_pgl", 
          target_protocol: "mcp",
          action: "test_action",
          payload: JSON.parse(payloadStr)
        })
      });

      if (!res.body) {
        throw new Error('No streaming body');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let traceArr: PhaseTrace[] = [];

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                if (data.type === 'log') {
                  setLogs(prev => [...prev, `[GATEWAY] Phase ${data.phase}: ${data.text}`]);
                  setCurrentStep(data.phase);
                  
                  // Update trace
                  traceArr = [...traceArr];
                  const existingPhaseIdx = traceArr.findIndex(t => t.phase === data.phase);
                  const isFail = data.text.includes("FAILED");
                  
                  const newPhase: PhaseTrace = {
                    phase: data.phase,
                    name: `Phase ${data.phase}`,
                    status: isFail ? "fail" : "pass",
                    summary: data.text
                  };
                  
                  if (existingPhaseIdx >= 0) {
                    traceArr[existingPhaseIdx] = newPhase;
                  } else {
                    traceArr.push(newPhase);
                  }
                  setTrace(traceArr);

                  if (isFail) {
                    setExecutionState('blocked');
                    setSlashedStake(250);
                    setVnpBalance(prev => prev - 250);
                    setYieldApy(8.2);
                    setFloatingValue('-250 VNP');
                    setFloatingValueColor('text-red-500 font-extrabold shadow-red-500/20');
                    setLastActionStatus('💥 SLA Breach: Slashed 250 VNP');
                    
                    // Append slash block to hash-chained ledger
                    const lastBlock = ledger[0];
                    const newBlockHex = Math.random().toString(16).substring(2, 10);
                    const newHash = `0x${newBlockHex}e3c1b4a9f`;
                    const evidenceHex = Math.random().toString(16).substring(2, 10);
                    const timestamp = new Date().toLocaleTimeString() + ' UTC';
                    
                    setLedger(prev => [{
                      index: lastBlock.index + 1,
                      timestamp,
                      prevHash: lastBlock.hash,
                      hash: newHash,
                      action: 'SLA_BREACH_SLASH',
                      vnpStake: '-250 VNP (Slashed)',
                      evidenceHash: `sha256(0x${evidenceHex}...)`,
                      status: 'SLASHED'
                    }, ...prev]);
                  }

                } else if (data.type === 'error') {
                  setLogs(prev => [...prev, `[ATTACK] ERROR: ${data.detail}`]);
                } else if (data.type === 'receipt') {
                  setLogs(prev => [...prev, `[SYSTEM] Receipt generated: ${data.data.receipt_id}`]);
                  if (executionState !== 'blocked') {
                      setExecutionState('success');
                      setVnpBalance(prev => prev + 10);
                      setYieldApy(12.4);
                      setFloatingValue('+10 VNP');
                      setFloatingValueColor('text-green-400 font-bold');
                      setLastActionStatus('🛡️ SLA fully verified (0 Slashed)');
                      
                      const lastBlock = ledger[0];
                      const newBlockHex = Math.random().toString(16).substring(2, 10);
                      const newHash = `0x${newBlockHex}e3c1b4a9f`;
                      const evidenceHex = Math.random().toString(16).substring(2, 10);
                      const timestamp = new Date().toLocaleTimeString() + ' UTC';
                      
                      setLedger(prev => [{
                        index: lastBlock.index + 1,
                        timestamp,
                        prevHash: lastBlock.hash,
                        hash: newHash,
                        action: 'STANDARD_CREW_RUN',
                        vnpStake: '+10 VNP (SLA Yield)',
                        evidenceHash: `sha256(0x${evidenceHex}...)`,
                        status: 'SUCCESS'
                      }, ...prev]);
                  }
                }
              } catch (e) {
                console.error("Failed to parse SSE", e);
              }
            }
          }
        }
      }
    } catch (error) {
      setLogs(prev => [...prev, `[SYSTEM] Execution failed: ${error}`]);
      setExecutionState('blocked');
    }
  };

  """
    
    content = content[:start_idx] + new_handle_execute + content[end_idx:]

    # Replace middle column Graph with Pipeline
    graph_start_str = "{/* Advanced Trace Graph */}"
    graph_end_str = "{/* Typing Console Logs */}"
    
    graph_start_idx = content.find(graph_start_str)
    graph_end_idx = content.find(graph_end_str)
    
    if graph_start_idx != -1 and graph_end_idx != -1:
        new_pipeline_content = """{/* Advanced Trace Graph */}
              <div className="flex-grow bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col relative overflow-hidden min-h-[300px]">
                <Pipeline trace={trace} runId={runId} />
              </div>

              """
        content = content[:graph_start_idx] + new_pipeline_content + content[graph_end_idx:]

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    modify_file(r"C:\\Users\\antho\\.windsurf\\veklom-control-plane\\components\\terminal\\components\\VanguardPlayground.tsx")
    print("Done")