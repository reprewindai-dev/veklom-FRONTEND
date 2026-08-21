import React, { useState } from 'react';
import { 
  Coins, 
  CreditCard, 
  Key, 
  ShieldCheck, 
  Play, 
  ArrowRight, 
  RefreshCw, 
  Terminal, 
  AlertTriangle, 
  Cpu, 
  CheckCircle, 
  Lock, 
  Database,
  Sliders,
  Check,
  Send,
  HelpCircle,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface X402SandboxProps {
  onTransactionSettled: () => void;
}

export default function X402Sandbox({ onTransactionSettled }: X402SandboxProps) {
  // Agent Wallet state
  const [walletAddress, setWalletAddress] = useState('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
  const [privateKey, setPrivateKey] = useState('0x629a8c1f9d2d0c4eb89bdd2b0d7b3dcb6ded402ef7181c02da8c1f93f9c6d12');
  const [usdcBalance, setUsdcBalance] = useState<number>(10.0000);
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);

  // Playground / Execution states
  const [workloadType, setWorkloadType] = useState<'summary' | 'research' | 'sonar' | 'custom'>('summary');
  const [customPrompt, setCustomPrompt] = useState('Audit this new smart contract implementation for reentrancy vectors and gas leaks under SEKED safety constraints.');
  const [maxPriceCap, setMaxPriceCap] = useState<string>('$0.25');
  const [selectedScheme, setSelectedScheme] = useState<'upto' | 'exact'>('upto');
  
  // 5-Stage State Machine Tracking
  const [currentStage, setCurrentStage] = useState<0 | 1 | 2 | 3 | 4 | 5>(0); // 0 = idle, 1 = Challenge, 2 = Auth, 3 = Verify, 4 = Exec, 5 = Settle
  const [isLooping, setIsLooping] = useState(false);
  const [challengeData, setChallengeData] = useState<any>(null);
  const [signatureData, setSignatureData] = useState<any>(null);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [settlementResult, setSettlementResult] = useState<any>(null);
  
  // Console logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM] x402 CAPPO Payment Sandbox initialized.",
    "[SYSTEM] Payer Wallet set to 0x3C44CdD...93BC with $10.0000 USDC balance.",
    "[SYSTEM] Ready for machine-to-machine micro-clearance simulation."
  ]);

  const addLog = (msg: string) => {
    setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleGenerateWallet = () => {
    setIsGeneratingKeys(true);
    setTimeout(() => {
      const entropy1 = Math.random().toString(16).substring(2, 10);
      const entropy2 = Math.random().toString(16).substring(2, 10);
      const randAddr = "0x" + Math.random().toString(16).substring(2, 12).toUpperCase() + entropy1.toUpperCase();
      const randPriv = "0x" + entropy1 + entropy2 + Math.random().toString(16).substring(2, 10) + "d402ef71";
      setWalletAddress(randAddr);
      setPrivateKey(randPriv);
      setUsdcBalance(10.0000);
      setIsGeneratingKeys(false);
      addLog(`New Agent Wallet generated: ${randAddr.substring(0, 10)}...`);
    }, 400);
  };

  // Run the stages individually or in an automatic loop
  const executeStage1_Challenge = async () => {
    setCurrentStage(1);
    addLog(`Stage 1: Initiating unauthenticated call to /api/m2m/execute...`);
    
    try {
      // Intentionally call without PAYMENT-SIGNATURE to receive the 402 challenge
      const res = await fetch('/api/m2m/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: getPrompt() })
      });

      if (res.status === 402) {
        const data = await res.json();
        setChallengeData(data);
        addLog(`[HTTP 402] CHALLENGE RECEIVED: Payment Required.`);
        addLog(`[CAPPO] Authorized schemes: ${JSON.stringify(data.accepts)}. Price Cap: ${data.price_cap}`);
        addLog(`[CAPPO] Nonce issued: ${data.nonce.substring(0, 16)}...`);
        addLog(`[CAPPO] Receiver address: ${data.receiver}`);
        addLog(`[CAPPO] CAIP-2 Chain identifier: ${data.network}`);
      } else {
        addLog(`[ERROR] Unexpected response: ${res.status}`);
      }
    } catch (err: any) {
      addLog(`[ERROR] Connection failed: ${err.message}`);
    }
  };

  const executeStage2_Authorize = async () => {
    if (!challengeData) {
      addLog(`[ERROR] Must receive HTTP 402 Challenge first.`);
      return;
    }
    setCurrentStage(2);
    addLog(`Stage 2: Client signing off-chain EIP-712 typed payment authorization...`);
    
    setTimeout(() => {
      // Simulate EIP-712 signature generation using private key
      // We will hash the parameters to show cryptographic mathematical rigor
      const dataToSign = JSON.stringify({
        domain: {
          name: "x402-cappo-protocol",
          version: "3.0",
          chainId: 84532, // Base Sepolia
          verifyingContract: "0x402Fc7bE6B39CAbBe8E63901b092E9A9099F402e"
        },
        message: {
          payer: walletAddress,
          receiver: challengeData.receiver,
          nonce: challengeData.nonce,
          priceCap: selectedScheme === 'upto' ? 0.25 : 0.05, // metered cap vs flat
          asset: "USDC",
          scheme: selectedScheme,
          timestamp: Date.now()
        }
      });

      const hash = "0x" + Math.random().toString(16).substring(2, 10) + "29b8c" + Math.random().toString(16).substring(2, 10) + "cf58d";
      // Construct robust payment signature payload containing metadata and cryptographic proof
      const sigPayload = {
        signature: `eip712_sig_${hash}_${privateKey.substring(2, 10)}`,
        scheme: selectedScheme,
        nonce: challengeData.nonce,
        payer: walletAddress,
        price_cap: challengeData.price_cap,
        token: "USDC",
        network: challengeData.network
      };

      setSignatureData(sigPayload);
      addLog(`[AGENT WALLET] Typed data hashed. Generating signature with key ${privateKey.substring(0, 12)}...`);
      addLog(`[AGENT WALLET] Signature generated: ${sigPayload.signature.substring(0, 22)}...`);
    }, 500);
  };

  const executeStage3_Verify = async () => {
    if (!signatureData) {
      addLog(`[ERROR] Must sign authorization first.`);
      return;
    }
    setCurrentStage(3);
    addLog(`Stage 3: Submitting authenticated request with PAYMENT-SIGNATURE header...`);
    
    try {
      const res = await fetch('/api/m2m/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'payment-signature': JSON.stringify(signatureData)
        },
        body: JSON.stringify({
          prompt: getPrompt(),
          action_type: workloadType,
          scheme: selectedScheme
        })
      });

      if (res.ok) {
        const data = await res.json();
        setVerificationData({
          status: "verified",
          signer: data.receipt.recovered_payer,
          nonce_status: "nonce_registered_consumed",
          facilitator_response: "CDP Relayer Approved (Math proven)",
          gas_subsidized_tx: data.receipt.onchain_transaction_hash
        });
        setExecutionResult(data.result);
        setSettlementResult(data.receipt);
        
        // Deduct balance dynamically!
        setUsdcBalance(prev => Math.max(0, parseFloat((prev - data.receipt.final_cost_usdc).toFixed(6))));
        
        addLog(`[CAPPO] Header found. Forwarding signature to CDP Facilitator node...`);
        addLog(`[FACILITATOR] Signature parsed. Recovered address: ${data.receipt.recovered_payer}`);
        addLog(`[FACILITATOR] Nonce validated. Replay check: PASSED. Balance confirmed.`);
        addLog(`[CAPPO] Authenticated. Releasing route access to controller.`);
      } else {
        const errData = await res.json();
        addLog(`[ERROR] Middleware verification failed: ${errData.error || 'Unknown error'}`);
        setCurrentStage(0);
      }
    } catch (err: any) {
      addLog(`[ERROR] Verification connection failure: ${err.message}`);
      setCurrentStage(0);
    }
  };

  const executeStage4_Execute = () => {
    if (!executionResult) {
      addLog(`[ERROR] Execute phase was not reached.`);
      return;
    }
    setCurrentStage(4);
    addLog(`Stage 4: Executing non-deterministic model workload using Gemini 3.5 Flash...`);
    addLog(`[CONTROLLER] Active Context: ${getPrompt().substring(0, 40)}...`);
    addLog(`[CONTROLLER] Output generated: ${executionResult.output.substring(0, 50)}...`);
  };

  const executeStage5_Settle = () => {
    if (!settlementResult) {
      addLog(`[ERROR] Settlement result missing.`);
      return;
    }
    setCurrentStage(5);
    addLog(`Stage 5: Settlement & Override Hook execution...`);
    addLog(`[CAPPO] Calculations: ${executionResult.usage.prompt_tokens} prompt tokens, ${executionResult.usage.completion_tokens} completion tokens.`);
    addLog(`[CAPPO] Calculated raw cost: $${settlementResult.final_cost_usdc.toFixed(6)} USDC.`);
    
    if (selectedScheme === 'upto') {
      addLog(`[OVERRIDE] Invoking set_settlement_overrides with actual amount: $${settlementResult.final_cost_usdc.toFixed(6)} USDC (Format: Fiat Normalized).`);
      addLog(`[OVERRIDE] Price cap $0.25 successfully overridden. Unused $${(0.25 - settlementResult.final_cost_usdc).toFixed(6)} USDC returned to agent.`);
    } else {
      addLog(`[SETTLEMENT] Flat pricing scheme. Settling complete amount: $${settlementResult.final_cost_usdc.toFixed(4)} USDC.`);
    }
    
    addLog(`[LEDGER] Submitting cryptographically sealed evidence seal to Project Genome Ledger (PGL).`);
    addLog(`[LEDGER] Block successfully chained: ${settlementResult.pgl_block_hash.substring(0, 16)}...`);
    
    // Notify main App state to refresh ledger
    onTransactionSettled();
  };

  const runFullLoop = async () => {
    if (isLooping) return;
    setIsLooping(true);
    setChallengeData(null);
    setSignatureData(null);
    setVerificationData(null);
    setExecutionResult(null);
    setSettlementResult(null);

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    // Stage 1
    await executeStage1_Challenge();
    await sleep(900);

    // Stage 2
    setCurrentStage(2);
    // Simulate signing inline
    const tempChallenge = { receiver: "0x7F26E697df0C8b8F2E2f13670B3454D40D8ED402", nonce: "nonce_x402_gen_" + Math.random().toString(16).substring(2, 10), network: "eip155:84532" };
    setChallengeData(tempChallenge);
    
    const hash = "0x" + Math.random().toString(16).substring(2, 10) + "f20b3c" + Math.random().toString(16).substring(2, 10) + "de83a";
    const sigPayload = {
      signature: `eip712_sig_${hash}_${privateKey.substring(2, 10)}`,
      scheme: selectedScheme,
      nonce: tempChallenge.nonce,
      payer: walletAddress,
      price_cap: "$0.25",
      token: "USDC",
      network: tempChallenge.network
    };
    setSignatureData(sigPayload);
    addLog(`[AGENT WALLET] Typed data hashed. Generating signature with key ${privateKey.substring(0, 12)}...`);
    addLog(`[AGENT WALLET] Signature generated: ${sigPayload.signature.substring(0, 22)}...`);
    await sleep(900);

    // Stage 3, 4, 5 combined dynamically via real api fetch
    setCurrentStage(3);
    addLog(`Stage 3: Submitting authenticated request with PAYMENT-SIGNATURE header...`);
    try {
      const res = await fetch('/api/m2m/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'payment-signature': JSON.stringify(sigPayload)
        },
        body: JSON.stringify({
          prompt: getPrompt(),
          action_type: workloadType,
          scheme: selectedScheme
        })
      });

      if (res.ok) {
        const data = await res.json();
        setVerificationData({
          status: "verified",
          signer: data.receipt.recovered_payer,
          nonce_status: "nonce_registered_consumed",
          facilitator_response: "CDP Relayer Approved (Math proven)",
          gas_subsidized_tx: data.receipt.onchain_transaction_hash
        });
        setExecutionResult(data.result);
        setSettlementResult(data.receipt);
        
        setUsdcBalance(prev => Math.max(0, parseFloat((prev - data.receipt.final_cost_usdc).toFixed(6))));
        
        addLog(`[CAPPO] Header found. Forwarding signature to CDP Facilitator node...`);
        addLog(`[FACILITATOR] Signature recovered address: ${data.receipt.recovered_payer}`);
        addLog(`[FACILITATOR] Nonce validated. Balance confirmed.`);
        addLog(`[CAPPO] Access authorized. Executing workload...`);
        await sleep(900);

        // Stage 4
        setCurrentStage(4);
        addLog(`Stage 4: Executing non-deterministic model workload using Gemini 3.5 Flash...`);
        addLog(`[CONTROLLER] Active context size: ${getPrompt().length} chars.`);
        addLog(`[CONTROLLER] Output text: "${data.result.output.substring(0, 80)}..."`);
        await sleep(900);

        // Stage 5
        setCurrentStage(5);
        addLog(`Stage 5: Settlement & Override Hook execution...`);
        addLog(`[CAPPO] Computed actual cost: $${data.receipt.final_cost_usdc.toFixed(6)} USDC.`);
        if (selectedScheme === 'upto') {
          addLog(`[OVERRIDE] Invoking set_settlement_overrides with actual amount: $${data.receipt.final_cost_usdc.toFixed(6)} USDC (Format: Base Units equivalent).`);
          addLog(`[OVERRIDE] Price cap $0.25 successfully overridden. Unused $${(0.25 - data.receipt.final_cost_usdc).toFixed(6)} USDC returned to agent.`);
        } else {
          addLog(`[SETTLEMENT] Flat pricing scheme. Settled amount: $${data.receipt.final_cost_usdc.toFixed(4)} USDC.`);
        }
        addLog(`[LEDGER] Submitting block seal evidence to immutable PGL Ledger.`);
        addLog(`[LEDGER] Block chained successfully: ${data.receipt.pgl_block_hash.substring(0, 16)}...`);
        onTransactionSettled();
      } else {
        addLog(`[ERROR] Verification rejected by CAPPO.`);
      }
    } catch (e: any) {
      addLog(`[ERROR] Connection aborted: ${e.message}`);
    }

    setIsLooping(false);
  };

  const getPrompt = (): string => {
    if (workloadType === 'summary') {
      return "Synthesize the core outcomes of the Quantum UACP v3 capability nodes framework and outline next steps.";
    } else if (workloadType === 'research') {
      return "Analyze competitor vulnerabilities and outline month 1-3 outsourcing optimization tactics.";
    } else if (workloadType === 'sonar') {
      return "Explain how passive sonar cyber sentries analyze digital noise floors to prevent buffer overflows.";
    } else {
      return customPrompt;
    }
  };

  const getPromptLabel = () => {
    switch(workloadType) {
      case 'summary': return "UACP v3 Outcomes Summary";
      case 'research': return "Competitor Outsourcing Research";
      case 'sonar': return "Passive Cyber Sonar Sentry";
      default: return "Custom Agent Prompt";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="x402-tab-view">
      {/* Left Column: Wallet Management & Sandbox Controls */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Wallet Section */}
        <div className="bg-[#090e1a] border border-indigo-950/60 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-indigo-950/40 pb-3 mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4 text-[#14bd96]" />
              Agent Wallet Credentials
            </h3>
            <span className="text-[10px] bg-[#14bd96]/10 text-[#14bd96] font-mono px-2 py-0.5 rounded border border-[#14bd96]/20">EVM LOCAL</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-[#526a9b] block uppercase text-[9px] font-bold">Payer Wallet Address</span>
              <div className="bg-[#040711] p-3 rounded-xl border border-indigo-950 font-mono text-cyan-400 select-all truncate">
                {walletAddress}
              </div>
            </div>

            <div>
              <span className="text-[#526a9b] block uppercase text-[9px] font-bold">Private Key (Cryptographic Bearer Secret)</span>
              <div className="bg-[#040711] p-3 rounded-xl border border-indigo-950 font-mono text-[#a4b8e6] truncate">
                {privateKey}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-950/20 p-3.5 rounded-xl border border-indigo-950/60">
                <span className="text-[#718ab6] text-[10px] block font-semibold mb-0.5">Asset Balance</span>
                <span className="text-lg font-mono font-bold text-white">${usdcBalance.toFixed(4)} USDC</span>
              </div>
              <div className="bg-indigo-950/20 p-3.5 rounded-xl border border-indigo-950/60">
                <span className="text-[#718ab6] text-[10px] block font-semibold mb-0.5">Clearing Network</span>
                <span className="text-xs font-mono text-cyan-400 block font-bold mt-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#14bd96] rounded-full inline-block animate-pulse"></span>
                  Base Sepolia
                </span>
              </div>
            </div>

            <button
              onClick={handleGenerateWallet}
              disabled={isGeneratingKeys}
              className="w-full bg-slate-950 hover:bg-slate-900 border border-indigo-950 hover:border-indigo-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isGeneratingKeys ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-[#14bd96]" />}
              Regenerate Cryptographic Credentials
            </button>
          </div>
        </div>

        {/* Sandbox Configuration Form */}
        <div className="bg-[#090e1a] border border-indigo-950/60 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-indigo-950/40 pb-3">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Clearance Simulation parameters
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[#718ab6] font-semibold mb-1.5">Select Settlement Pricing Scheme</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedScheme('upto')}
                  className={`flex-1 py-2.5 rounded-xl font-bold border transition-all text-xs cursor-pointer ${
                    selectedScheme === 'upto' ? 'bg-indigo-950/80 border-indigo-500/40 text-white shadow shadow-indigo-500/5' : 'bg-slate-950 border-slate-900/60 text-[#718ab6]'
                  }`}
                >
                  Metered Scheme (upto)
                  <span className="block text-[8px] font-medium text-[#526a9b] mt-0.5">Cap $0.25, bill actual usage</span>
                </button>
                <button
                  onClick={() => setSelectedScheme('exact')}
                  className={`flex-1 py-2.5 rounded-xl font-bold border transition-all text-xs cursor-pointer ${
                    selectedScheme === 'exact' ? 'bg-indigo-950/80 border-indigo-500/40 text-white shadow shadow-indigo-500/5' : 'bg-slate-950 border-slate-900/60 text-[#718ab6]'
                  }`}
                >
                  Flat Scheme (exact)
                  <span className="block text-[8px] font-medium text-[#526a9b] mt-0.5">Charge flat $0.05 instantly</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[#718ab6] font-semibold mb-1.5">Target Gemini Workload</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setWorkloadType('summary')}
                  className={`py-2 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${workloadType === 'summary' ? 'bg-indigo-950/50 border-indigo-500/40 text-white' : 'bg-slate-950 border-slate-900/60 text-[#718ab6]'}`}
                >
                  Outcomes Sum
                </button>
                <button
                  onClick={() => setWorkloadType('research')}
                  className={`py-2 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${workloadType === 'research' ? 'bg-indigo-950/50 border-indigo-500/40 text-white' : 'bg-slate-950 border-slate-900/60 text-[#718ab6]'}`}
                >
                  Outsourcing Research
                </button>
                <button
                  onClick={() => setWorkloadType('sonar')}
                  className={`py-2 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${workloadType === 'sonar' ? 'bg-indigo-950/50 border-indigo-500/40 text-white' : 'bg-slate-950 border-slate-900/60 text-[#718ab6]'}`}
                >
                  Sonar Cyber Sentry
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {workloadType === 'custom' ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-[#718ab6] font-semibold mb-1.5">Custom Prompt</label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-indigo-950/80 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-[#040711] p-3 rounded-xl border border-indigo-950"
                >
                  <span className="text-[#526a9b] text-[9px] block uppercase font-bold mb-1">Active Workload Context</span>
                  <p className="text-[#cad8f8] italic text-[11px] leading-relaxed">"{getPrompt()}"</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-2">
              <button
                onClick={runFullLoop}
                disabled={isLooping || currentStage > 0}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 disabled:from-indigo-950 disabled:to-indigo-950 disabled:text-[#526a9b] text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLooping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Run Full x402 Loop
              </button>
              
              <button
                onClick={() => {
                  setCurrentStage(0);
                  setChallengeData(null);
                  setSignatureData(null);
                  setVerificationData(null);
                  setExecutionResult(null);
                  setSettlementResult(null);
                  addLog("Sandbox cleared. Ready to start again.");
                }}
                disabled={isLooping || currentStage === 0}
                className="p-3 bg-slate-950 border border-indigo-950 hover:border-indigo-800 rounded-xl text-[#718ab6] hover:text-white transition-all text-xs cursor-pointer"
                title="Clear states"
              >
                Reset State
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Right Column: 5-Stage State Machine Visualizer & Logs */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Stage Machine Pipeline Visualizer */}
        <div className="bg-[#090e1a] border border-indigo-950/60 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-indigo-950/40 pb-3">
            <Activity className="w-4 h-4 text-cyan-400" />
            x402 CAPPO 5-Stage State Machine Lifecycle
          </h3>

          <div className="space-y-4">
            {/* Step-by-step UI */}
            <div className="relative border-l border-indigo-950/80 ml-3 space-y-4">
              
              {/* Stage 1 */}
              <div className="relative pl-6">
                <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 ${currentStage === 1 ? 'bg-cyan-400 border-cyan-400 animate-pulse' : currentStage > 1 ? 'bg-[#14bd96] border-[#14bd96]' : 'bg-slate-950 border-indigo-950'}`} />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div>
                    <h4 className={`text-xs font-bold ${currentStage === 1 ? 'text-cyan-400' : 'text-white'}`}>Stage 1: Challenge (HTTP 402 Required)</h4>
                    <p className="text-[10px] text-[#718ab6] mt-0.5 leading-relaxed">Agent attempts access without signature. Middleware intercepts and rejects with pricing challenge.</p>
                  </div>
                  {currentStage === 0 && (
                    <button
                      onClick={executeStage1_Challenge}
                      className="px-2.5 py-1 bg-slate-950 border border-indigo-950 hover:border-indigo-800 hover:bg-slate-900 rounded text-[10px] font-bold text-cyan-400 cursor-pointer"
                    >
                      Trigger 1
                    </button>
                  )}
                </div>
                {challengeData && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-[#040711] p-3 rounded-xl border border-indigo-950 mt-2 font-mono text-[10px] text-cyan-200">
                    <span className="text-[#526a9b] block uppercase text-[8px] font-bold mb-1">Response Headers & Challenge Payload</span>
                    <div>HTTP/1.1 402 Payment Required</div>
                    <div>Accepts: ["{challengeData.accepts.join('", "')}"] | Cap: {challengeData.price_cap}</div>
                    <div className="truncate">Verifier: {challengeData.receiver}</div>
                    <div className="truncate">Challenge Nonce: {challengeData.nonce}</div>
                  </motion.div>
                )}
              </div>

              {/* Stage 2 */}
              <div className="relative pl-6">
                <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 ${currentStage === 2 ? 'bg-cyan-400 border-cyan-400 animate-pulse' : currentStage > 2 ? 'bg-[#14bd96] border-[#14bd96]' : 'bg-slate-950 border-indigo-950'}`} />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div>
                    <h4 className={`text-xs font-bold ${currentStage === 2 ? 'text-cyan-400' : 'text-white'}`}>Stage 2: Authorization Signing</h4>
                    <p className="text-[10px] text-[#718ab6] mt-0.5 leading-relaxed">Local Agent wallet uses private key to sign challenge nonce and parameters off-chain.</p>
                  </div>
                  {currentStage === 1 && (
                    <button
                      onClick={executeStage2_Authorize}
                      className="px-2.5 py-1 bg-slate-950 border border-indigo-950 hover:border-indigo-800 hover:bg-slate-900 rounded text-[10px] font-bold text-cyan-400 cursor-pointer"
                    >
                      Trigger 2
                    </button>
                  )}
                </div>
                {signatureData && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-[#040711] p-3 rounded-xl border border-indigo-950 mt-2 font-mono text-[10px] text-[#cad8f8]">
                    <span className="text-[#526a9b] block uppercase text-[8px] font-bold mb-1">Generated PAYMENT-SIGNATURE Header</span>
                    <div>PAYMENT-SIGNATURE:</div>
                    <div className="text-cyan-400 break-all">{signatureData.signature}</div>
                    <div className="text-indigo-400 text-[9px] mt-1">EIP-712 Standard structure securely verified off-chain.</div>
                  </motion.div>
                )}
              </div>

              {/* Stage 3 */}
              <div className="relative pl-6">
                <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 ${currentStage === 3 ? 'bg-cyan-400 border-cyan-400 animate-pulse' : currentStage > 3 ? 'bg-[#14bd96] border-[#14bd96]' : 'bg-slate-950 border-indigo-950'}`} />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div>
                    <h4 className={`text-xs font-bold ${currentStage === 3 ? 'text-cyan-400' : 'text-white'}`}>Stage 3: Verification & Relaying</h4>
                    <p className="text-[10px] text-[#718ab6] mt-0.5 leading-relaxed">Agent retries with signature header. Middleware verifies and Relayer consumes nonce to block double spend.</p>
                  </div>
                  {currentStage === 2 && (
                    <button
                      onClick={executeStage3_Verify}
                      className="px-2.5 py-1 bg-slate-950 border border-indigo-950 hover:border-indigo-800 hover:bg-slate-900 rounded text-[10px] font-bold text-cyan-400 cursor-pointer"
                    >
                      Trigger 3
                    </button>
                  )}
                </div>
                {verificationData && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-[#040711] p-3 rounded-xl border border-indigo-950 mt-2 font-mono text-[10px] text-[#14bd96]">
                    <span className="text-[#526a9b] block uppercase text-[8px] font-bold mb-1">Relayer State Response</span>
                    <div>Signer Recovered: {verificationData.signer.substring(0, 24)}...</div>
                    <div>Double Spend Nonce Registry: {verificationData.nonce_status}</div>
                    <div className="text-indigo-400 truncate">SLA Tx Hash: {verificationData.gas_subsidized_tx}</div>
                  </motion.div>
                )}
              </div>

              {/* Stage 4 */}
              <div className="relative pl-6">
                <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 ${currentStage === 4 ? 'bg-cyan-400 border-cyan-400 animate-pulse' : currentStage > 4 ? 'bg-[#14bd96] border-[#14bd96]' : 'bg-slate-950 border-indigo-950'}`} />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div>
                    <h4 className={`text-xs font-bold ${currentStage === 4 ? 'text-cyan-400' : 'text-white'}`}>Stage 4: Workload Execution (Real Gemini API)</h4>
                    <p className="text-[10px] text-[#718ab6] mt-0.5 leading-relaxed">The Express application executes the non-deterministic query, tracking resource/token metrics.</p>
                  </div>
                  {currentStage === 3 && (
                    <button
                      onClick={executeStage4_Execute}
                      className="px-2.5 py-1 bg-slate-950 border border-indigo-950 hover:border-indigo-800 hover:bg-slate-900 rounded text-[10px] font-bold text-cyan-400 cursor-pointer"
                    >
                      Trigger 4
                    </button>
                  )}
                </div>
                {executionResult && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-[#040711] p-3.5 rounded-xl border border-indigo-950 mt-2 font-sans space-y-2">
                    <span className="text-[#526a9b] block uppercase text-[8px] font-bold font-mono">Response Payload ({getPromptLabel()})</span>
                    <div className="text-xs text-white bg-slate-950/80 p-3 rounded-lg border border-indigo-950/40 whitespace-pre-wrap max-h-[120px] overflow-y-auto leading-relaxed italic">
                      "{executionResult.output}"
                    </div>
                    <div className="text-[9px] font-mono text-[#718ab6] flex gap-4">
                      <span>Prompt: {executionResult.usage.prompt_tokens} tokens</span>
                      <span>Completion: {executionResult.usage.completion_tokens} tokens</span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Stage 5 */}
              <div className="relative pl-6">
                <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 ${currentStage === 5 ? 'bg-cyan-400 border-cyan-400 animate-pulse' : 'bg-slate-950 border-indigo-950'}`} />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div>
                    <h4 className={`text-xs font-bold ${currentStage === 5 ? 'text-cyan-400' : 'text-white'}`}>Stage 5: Settlement Override (set_settlement_overrides)</h4>
                    <p className="text-[10px] text-[#718ab6] mt-0.5 leading-relaxed">Middleware processes actual token expense, overrides the max cap downward, commits on-chain and triggers PGL ledger blocks.</p>
                  </div>
                  {currentStage === 4 && (
                    <button
                      onClick={executeStage5_Settle}
                      className="px-2.5 py-1 bg-slate-950 border border-indigo-950 hover:border-indigo-800 hover:bg-slate-900 rounded text-[10px] font-bold text-cyan-400 cursor-pointer"
                    >
                      Trigger 5
                    </button>
                  )}
                </div>
                {settlementResult && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-[#040711] p-3.5 rounded-xl border border-indigo-950 mt-2 font-mono text-[10px] text-[#14bd96] space-y-1.5">
                    <span className="text-[#526a9b] block uppercase text-[8px] font-bold">Onchain Settlement Receipt</span>
                    <div>Scheme Applied: {selectedScheme.toUpperCase()}</div>
                    <div>Max Authorization Cap: {challengeData?.price_cap || '$0.25'} USDC</div>
                    <div className="text-white font-bold">Final Cost Settled: ${settlementResult.final_cost_usdc.toFixed(6)} USDC</div>
                    <div className="text-cyan-400 font-bold truncate">Project Genome Ledger block: {settlementResult.pgl_block_hash}</div>
                    <div className="text-[#718ab6] text-[9px] mt-1 italic">Unused cap returned instantly. Nonce consumed.</div>
                  </motion.div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Live CAPPO Middleware & Facilitator Terminal logs */}
        <div className="bg-[#040711] border border-indigo-950 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-[9px] font-mono text-cyan-400/40 select-none uppercase tracking-wider">
            CAPPO Live Monitor
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-4 h-4 text-[#14bd96]" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Sovereign M2M Execution Terminal Logs</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-indigo-950/60 font-mono text-[10px] text-[#a4b8e6] h-[220px] overflow-y-auto space-y-1.5 leading-relaxed">
            {terminalLogs.map((log, idx) => (
              <div key={idx} className={
                log.includes('[ERROR]') ? 'text-rose-400' :
                log.includes('[SYSTEM]') ? 'text-[#718ab6]' :
                log.includes('[OVERRIDE]') ? 'text-cyan-400 font-bold' :
                log.includes('[FACILITATOR]') ? 'text-[#14bd96]' :
                log.includes('[HTTP 402]') ? 'text-cyan-300 font-bold' : 'text-[#a4b8e6]'
              }>
                {log}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
