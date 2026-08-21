import os
import re

def patch_vanguard():
    path = r"c:\Users\antho\.windsurf\veklom-control-plane\components\terminal\components\VanguardPlayground.tsx"
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add the new states:
    state_injection = """  const [agentId, setAgentId] = useState<string>("agent-atlas");
  const [action, setAction] = useState<string>("test_action");
  const [payloadStr, setPayloadStr] = useState<string>('{}');"""
    
    content = content.replace("const [selectedCrew, setSelectedCrew] = useState<Crew>(CREWS[0]);", "const [selectedCrew, setSelectedCrew] = useState<Crew>(CREWS[0]);\n" + state_injection)
    
    # Update handleExecute
    old_handle = """  // Trigger simulated hybrid run
  const handleExecute = async (threatId: string | null) => {
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
      });"""

    new_handle = """  // Trigger simulated hybrid run
  const handleExecute = async (threatId: string | null) => {
    setActiveThreat(threatId);
    setExecutionState('running');
    setCurrentStep(0);
    setLogs([]);
    setSlashedStake(0);
    setFloatingValue(null);
    setTrace([]);
    const rid = Date.now();
    setRunId(rid);

    let currentAgent = agentId;
    let currentAction = action;
    let currentPayload = payloadStr;

    if (threatId === 'injection') {
      currentPayload = '{"cmd": "rm -rf /"}'; // triggers SYSTEM_POLICY_VETO
      setPayloadStr(currentPayload);
    } else if (threatId === 'depth') {
      currentPayload = '{"a": {"b": {"c": {"d": {"e": {"f": {"g": 1}}}}}}}'; // triggers RECURSIVE_DEPTH_LIMIT_EXCEEDED
      setPayloadStr(currentPayload);
    } else if (threatId === 'credentials') {
      currentPayload = '{"req": "fetch_aws"}'; 
      setPayloadStr(currentPayload);
    }

    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(currentPayload);
    } catch (e) {
      setLogs(["[SYSTEM] Error: Invalid JSON Payload. Execution Aborted."]);
      setExecutionState('idle');
      return;
    }

    try {
      const res = await fetch('/api/v1/capi/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: currentAgent,
          pgl_id: "valid_pgl", 
          target_protocol: "mcp",
          action: currentAction,
          payload: parsedPayload
        })
      });"""

    if old_handle in content:
        content = content.replace(old_handle, new_handle)
    else:
        print("COULD NOT FIND OLD HANDLE")

    # Replace Left Column UI
    old_ui = """              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <span className="text-xs font-bold text-white tracking-widest flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#b8860b]" /> 1. ORCHESTRATE CREW
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono">CREW_ORCHESTRATOR</span>
                </div>

                {/* Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 tracking-wider">SELECT ACTIVE CREW ASSEMBLY</label>
                  <div className="grid grid-cols-1 gap-2">
                    {CREWS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCrew(c);
                          resetPlayground();
                        }}
                        className={`text-left p-3 rounded-xl border transition-all relative ${
                          selectedCrew.id === c.id 
                            ? 'border-[#b8860b] bg-[#b8860b]/5 shadow-lg' 
                            : 'border-white/5 bg-white/[0.01] hover:bg-white/5'
                        }`}
                      >
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          {c.name}
                          {selectedCrew.id === c.id && <span className="w-1.5 h-1.5 bg-[#b8860b] rounded-full animate-ping" />}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1 leading-relaxed">{c.description}</div>
                        
                        {/* Sub-agents */}
                        <div className="flex gap-1.5 mt-2.5 pt-2 border-t border-white/5">
                          {c.agents.map((a, i) => (
                            <span key={i} className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5 flex items-center gap-1">
                              <span>{a.avatar}</span> {a.name}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cognitive Prompt */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 tracking-wider">COGNITIVE RUN INTENT PROMPT</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={2}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-[#b8860b] transition-all resize-none font-mono"
                  />
                </div>

                <div className="pt-2">
                  <label className="text-[10px] text-red-500 font-bold tracking-widest mb-2 block animate-pulse">ACTIVE THREAT INJECTION</label>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => handleExecute('injection')}
                      disabled={executionState === 'running'}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.02] hover:bg-red-500/5 text-left text-[11px] font-bold text-red-400 transition-all hover:border-red-500/40 disabled:opacity-50"
                    >
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 animate-bounce" /> Prompt Injection Override (Expose Secrets)
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleExecute('depth')}
                      disabled={executionState === 'running'}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-orange-500/20 bg-orange-500/[0.02] hover:bg-orange-500/5 text-left text-[11px] font-bold text-orange-400 transition-all hover:border-orange-500/40 disabled:opacity-50"
                    >
                      <span className="flex items-center gap-2">
                        <Layers className="w-4 h-4" /> Payload Nesting Overflow Limit (&gt;6 levels)
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleExecute('credentials')}
                      disabled={executionState === 'running'}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-yellow-500/20 bg-yellow-500/[0.02] hover:bg-yellow-500/5 text-left text-[11px] font-bold text-yellow-400 transition-all hover:border-yellow-500/40 disabled:opacity-50"
                    >
                      <span className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4" /> Key Leakage / Dynamic Redaction Swap
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleExecute(null)}
                    disabled={executionState === 'running'}
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-200 text-black py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 active:scale-[0.98] mt-4 text-xs shadow-lg"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-black" /> Run Standard Secure Intent
                  </button>
                </div>
              </div>"""

    new_ui = """              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <span className="text-xs font-bold text-white tracking-widest flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-[#b8860b]" /> 1. REQUEST BUILDER
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono">HYBRID_PLAYGROUND</span>
                </div>

                {/* Request Builder Form */}
                <div className="space-y-3 flex-grow mt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 tracking-wider">AGENT IDENTITY</label>
                    <select value={agentId} onChange={e => setAgentId(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl p-2 text-xs text-white outline-none focus:border-[#b8860b] transition-all">
                      <option value="agent-atlas">agent-atlas (Data & DB Query)</option>
                      <option value="agent-ledger">agent-ledger (Financial & Transactions)</option>
                      <option value="agent-echo">agent-echo (Echo / Utility)</option>
                      <option value="agent-scout">agent-scout (Search & Retrieval)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 tracking-wider">ACTION ENDPOINT</label>
                    <input value={action} onChange={e => setAction(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl p-2 text-xs text-white outline-none focus:border-[#b8860b] transition-all font-mono" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 tracking-wider">JSON PAYLOAD</label>
                    <textarea
                      value={payloadStr}
                      onChange={(e) => setPayloadStr(e.target.value)}
                      rows={6}
                      spellCheck={false}
                      className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-[11px] text-[#00E5FF] outline-none focus:border-[#b8860b] transition-all resize-none font-mono scrollbar-thin"
                    />
                  </div>
                </div>

                <div className="pt-2 mt-4 border-t border-white/5">
                  <label className="text-[10px] text-red-500 font-bold tracking-widest mb-2 block pt-2">THREAT PRESETS</label>
                  
                  <div className="grid grid-cols-1 gap-2 mb-4">
                    <button
                      onClick={() => handleExecute('injection')}
                      disabled={executionState === 'running'}
                      className="flex items-center justify-between p-2 rounded-xl border border-red-500/20 bg-red-500/[0.02] hover:bg-red-500/5 text-left text-[10px] font-bold text-red-400 transition-all hover:border-red-500/40 disabled:opacity-50"
                    >
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5" /> Prompt Injection Override
                      </span>
                    </button>

                    <button
                      onClick={() => handleExecute('depth')}
                      disabled={executionState === 'running'}
                      className="flex items-center justify-between p-2 rounded-xl border border-orange-500/20 bg-orange-500/[0.02] hover:bg-orange-500/5 text-left text-[10px] font-bold text-orange-400 transition-all hover:border-orange-500/40 disabled:opacity-50"
                    >
                      <span className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5" /> Payload Nesting Limit
                      </span>
                    </button>

                    <button
                      onClick={() => handleExecute('credentials')}
                      disabled={executionState === 'running'}
                      className="flex items-center justify-between p-2 rounded-xl border border-yellow-500/20 bg-yellow-500/[0.02] hover:bg-yellow-500/5 text-left text-[10px] font-bold text-yellow-400 transition-all hover:border-yellow-500/40 disabled:opacity-50"
                    >
                      <span className="flex items-center gap-2">
                        <KeyRound className="w-3.5 h-3.5" /> Key Leakage / Redaction
                      </span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleExecute(null)}
                    disabled={executionState === 'running'}
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-200 text-black py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 active:scale-[0.98] text-xs shadow-lg"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-black" /> Run Custom Payload
                  </button>
                </div>
              </div>"""

    if old_ui in content:
        content = content.replace(old_ui, new_ui)
    else:
        print("COULD NOT FIND OLD UI")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

patch_vanguard()
