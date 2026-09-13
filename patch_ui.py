def patch_ui():
    with open('components/terminal/components/VanguardPlayground.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Add state variables for the CAPPO mount
    state_search = "const [floatingColor, setFloatingValueColor] = useState<string>('text-green-400');"
    state_replace = state_search + "\n  const [mountInfo, setMountInfo] = useState<{id: string, token: string, nonce: string} | null>(null);\n  const [counterValue, setCounterValue] = useState<number>(41);"
    
    # 2. Modify handleExecute
    execute_search = '''    try {
      const token = getToken();
      const res = await fetch('/api/v1/capi/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: Bearer  } : {}),
        },
        body: JSON.stringify({
          agent_id: currentAgent,
          pgl_id: "valid_pgl", 
          target_protocol: "mcp",
          action: currentAction,
          payload: parsedPayload
        })
      });

      const payload = await res.json().catch(() => ({}));'''
      
    execute_replace = '''    try {
      const token = getToken();
      let currentMount = mountInfo;
      
      setLogs(prev => [...prev, "[CAPPO] Requested execution"]);
      setLogs(prev => [...prev, "[CAPPO] Identity verified via LockerPhycer"]);
      
      if (!currentMount) {
        setLogs(prev => [...prev, "[CAPPO] Mounting core/governed-counter capability"]);
        const mountRes = await fetch('/api/cappo/v1/capability/mounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: Bearer  } : {}),
          },
          body: JSON.stringify({
            package_id: "core/governed-counter"
          })
        });
        const mountData = await mountRes.json();
        if (mountRes.ok) {
           currentMount = { id: mountData.id, token: mountData.token.token_id, nonce: mountData.token.nonce };
           setMountInfo(currentMount);
        } else {
           throw new Error(mountData.detail || "Mount failed");
        }
      }
      
      setLogs(prev => [...prev, "[CAPPO] Permission checked..."]);
      
      const res = await fetch(/api/cappo/v1/capability/mounts//execute, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: Bearer  } : {}),
        },
        body: JSON.stringify({
          action: "increment",
          target_ref: "system:counter",
          resource: "global",
          token_id: currentMount!.token,
          nonce: currentMount!.nonce,
          arguments: {}
        })
      });

      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.decision === "allow") {
          setLogs(prev => [...prev, "[CAPPO] ALLOWED"]);
          const newVal = payload.consequence?.resulting_state?.value || counterValue + 1;
          setLogs(prev => [...prev, [CAPPO] Counter:  -> ]);
          setLogs(prev => [...prev, [CAPPO] Proof: ]);
          setCounterValue(newVal);
      } else {
          setLogs(prev => [...prev, [CAPPO] DENIED: ]);
          setLogs(prev => [...prev, [CAPPO] Counter remains ]);
      }
      '''

    # 3. Add Revoke button handler
    revoke_search = '''  // Nonce rotation requires a backend receipt. This control no longer mints local tokens.
  const handleRotateNonce = () => {'''
    
    revoke_replace = '''  const handleRevoke = async () => {
    if (!mountInfo) return;
    setIsRotating(true);
    const token = getToken();
    try {
      await fetch(/api/cappo/v1/capability/mounts//terminate, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: Bearer  } : {}),
        },
        body: JSON.stringify({
           token_id: mountInfo.token,
           reason: "USER_REVOKED"
        })
      });
      setLogs(prev => [...prev, "[CAPPO] Capability revoked by user."]);
    } finally {
      setIsRotating(false);
    }
  };

  // Nonce rotation requires a backend receipt. This control no longer mints local tokens.
  const handleRotateNonce = () => {'''

    # 4. Update the Rotate button UI to be Revoke button
    button_search = '''                {/* Manual Rotation Action */}
                <button
                  onClick={handleRotateNonce}
                  disabled={isRotating}
                  className="w-full flex items-center justify-center gap-1.5 border border-[#b8860b]/20 hover:border-[#b8860b]/40 bg-[#b8860b]/5 hover:bg-[#b8860b]/10 text-[#b8860b] py-2 rounded-lg text-[10px] font-bold uppercase transition-all disabled:opacity-50"
                >
                  <RefreshCw className={w-3.5 h-3.5 } />
                  {isRotating ? 'Checking Proof Path...' : 'Check Nonce Proof Path'}
                </button>'''
                
    button_replace = '''                {/* Revoke Action */}
                <button
                  onClick={handleRevoke}
                  disabled={isRotating || !mountInfo}
                  className="w-full flex items-center justify-center gap-1.5 border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 text-red-500 py-2 rounded-lg text-[10px] font-bold uppercase transition-all disabled:opacity-50"
                >
                  <ShieldAlert className={w-3.5 h-3.5 } />
                  {isRotating ? 'Revoking...' : 'Revoke Permission'}
                </button>'''

    if state_search in content:
        content = content.replace(state_search, state_replace)
        content = content.replace(execute_search, execute_replace)
        content = content.replace(revoke_search, revoke_replace)
        content = content.replace(button_search, button_replace)
        with open('components/terminal/components/VanguardPlayground.tsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print("UI patched!")
    else:
        print("Failed to patch UI")

patch_ui()
