"use client";

/**
 * BankerPayPanel — Real on-chain USDC payment to /api/v1/x402/score
 *
 * Direct flow (no backend pre-auth needed):
 *   1. Connect Base Account wallet via wagmi
 *   2. Send 0.10 USDC on-chain to treasury address via ERC-20 transfer
 *   3. POST /api/v1/x402/score with X-Payment: {txHash}
 *      (the x402 middleware verifies the tx on-chain via Base Mainnet RPC)
 *
 * The backend banker ledger (prepare/confirm) is NOT called here because those
 * endpoints sit behind ZeroTrustMiddleware which requires a JWT. The x402/score
 * endpoint is payment-gated, not JWT-gated — the tx hash IS the credential.
 */

import { useState, useCallback } from "react";
import { useAccount, useConnect, useDisconnect, useSendTransaction } from "wagmi";
import { encodeFunctionData, parseUnits } from "viem";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.veklom.com";

// Base Mainnet USDC contract
const USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`;
// Treasury — receives the 0.10 USDC payment
const TREASURY    = "0x3a74772e925b54F7dAD7FD95c9Ba30825033f970" as `0x${string}`;
// 0.10 USDC = 100,000 micro-USDC (6 decimals)
const AMOUNT_USDC = "0.10";
const AMOUNT_UNITS = parseUnits(AMOUNT_USDC, 6);

const ERC20_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to",     type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

type Step = "idle" | "sending" | "scoring" | "done" | "error";

interface ScoreResult {
  trust_score: number;
  grade: string;
  breakdown: Record<string, number | string>;
  tx_hash: string;
}

export function BankerPayPanel() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors }         = useConnect();
  const { disconnect }                  = useDisconnect();
  const { sendTransactionAsync }        = useSendTransaction();

  const [step,        setStep]        = useState<Step>("idle");
  const [log,         setLog]         = useState<string[]>([]);
  const [error,       setError]       = useState<string | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);

  const addLog = (msg: string) =>
    setLog((prev) => [...prev, `[${new Date().toISOString().slice(11, 19)}] ${msg}`]);

  const handleError = (msg: string) => {
    setError(msg);
    setStep("error");
    addLog(`❌ ERROR: ${msg}`);
  };

  const run = useCallback(async () => {
    if (!isConnected || !address) {
      handleError("Wallet not connected.");
      return;
    }
    if (chain?.id !== 8453) {
      handleError(`Wrong network. Switch to Base Mainnet (id 8453). You are on chain ${chain?.id}.`);
      return;
    }

    setError(null);
    setScoreResult(null);
    setLog([]);

    // ── STEP 1: Send 0.10 USDC on-chain ───────────────────────────────────
    setStep("sending");
    addLog(`Sending ${AMOUNT_USDC} USDC → ${TREASURY.slice(0, 10)}... on Base Mainnet`);
    addLog(`From: ${address.slice(0, 10)}...`);

    let txHash: string;
    try {
      const data = encodeFunctionData({
        abi: ERC20_TRANSFER_ABI,
        functionName: "transfer",
        args: [TREASURY, AMOUNT_UNITS],
      });

      txHash = await sendTransactionAsync({
        to:      USDC_CONTRACT,
        data,
        chainId: 8453,
      });

      addLog(`✅ Tx submitted: ${txHash}`);
      addLog(`🔗 https://basescan.org/tx/${txHash}`);
    } catch (e: any) {
      // User rejected or wallet error
      if (e?.message?.includes("User rejected") || e?.code === 4001) {
        handleError("Transaction rejected in wallet.");
      } else {
        handleError(`Wallet error: ${e?.message || String(e)}`);
      }
      return;
    }

    // ── STEP 2: Wait a few seconds for Base to index the tx ───────────────
    setStep("scoring");
    addLog(`Waiting 6s for Base Mainnet to index the block...`);
    await new Promise((r) => setTimeout(r, 6000));

    // ── STEP 3: Call /score with X-Payment = txHash ────────────────────────
    addLog(`Calling /api/v1/x402/score with X-Payment proof...`);

    try {
      const res = await fetch(`${API_BASE}/api/v1/x402/score`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "X-Payment":     txHash,
        },
        body: JSON.stringify({ subject: address }),
      });

      const data = await res.json();

      if (res.status === 402) {
        // Still not confirmed — may need more time
        addLog(`⚠️ 402 returned: ${data.detail || "tx not yet confirmed on-chain"}`);
        addLog(`Try re-submitting in 30s with hash: ${txHash}`);
        handleError(
          `The tx was submitted but the Base RPC hasn't confirmed it yet. ` +
          `Hash: ${txHash.slice(0, 18)}... — wait ~30s and click retry.`
        );
        // Keep the txHash so the user can retry
        setScoreResult({
          trust_score: 0,
          grade: "—",
          breakdown: { note: "pending confirmation" },
          tx_hash: txHash,
        });
        return;
      }

      if (!res.ok) {
        throw new Error(`Score endpoint: ${res.status} — ${JSON.stringify(data)}`);
      }

      setScoreResult({
        trust_score: data.trust_score ?? 0,
        grade:       data.grade ?? "—",
        breakdown:   data.breakdown ?? {},
        tx_hash:     txHash,
      });
      setStep("done");
      addLog(`✅ Score received: ${data.trust_score} (Grade ${data.grade})`);
    } catch (e: any) {
      handleError(e?.message || String(e));
    }
  }, [isConnected, address, chain, sendTransactionAsync]);

  // Retry with existing tx hash (for pending confirmation case)
  const retryScore = useCallback(async (txHash: string) => {
    setError(null);
    addLog(`Retrying /score with existing tx hash: ${txHash.slice(0, 18)}...`);
    setStep("scoring");
    try {
      const res = await fetch(`${API_BASE}/api/v1/x402/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Payment": txHash },
        body: JSON.stringify({ subject: address }),
      });
      const data = await res.json();
      if (!res.ok) {
        handleError(`Retry: ${res.status} — ${data.detail || JSON.stringify(data)}`);
        return;
      }
      setScoreResult({ trust_score: data.trust_score ?? 0, grade: data.grade ?? "—", breakdown: data.breakdown ?? {}, tx_hash: txHash });
      setStep("done");
      addLog(`✅ Score received: ${data.trust_score} (Grade ${data.grade})`);
    } catch (e: any) {
      handleError(e?.message || String(e));
    }
  }, [address]);

  const baseConnector = connectors.find((c) => c.id === "baseAccount")
    ?? connectors.find((c) => c.id === "coinbaseWalletSDK")
    ?? connectors[0];

  const isWorking = step === "sending" || step === "scoring";

  return (
    <div className="bpp-root">
      <div className="bpp-header">
        <span className="bpp-icon">⚡</span>
        <div>
          <div className="bpp-title">Pay &amp; Score</div>
          <div className="bpp-sub">0.10 USDC on Base → <code>/api/v1/x402/score</code></div>
        </div>
      </div>

      {/* Wallet */}
      <div className="bpp-wallet">
        {isConnected && address ? (
          <div className="bpp-connected">
            <span className="bpp-dot" />
            <span className="bpp-addr">{address.slice(0, 6)}…{address.slice(-4)}</span>
            <span className={`bpp-chain ${chain?.id === 8453 ? "ok" : "warn"}`}>
              {chain?.id === 8453 ? "✅ Base" : `⚠️ Wrong chain (${chain?.name})`}
            </span>
            <button className="bpp-ghost" onClick={() => disconnect()}>Disconnect</button>
          </div>
        ) : (
          <button className="bpp-connect" onClick={() => baseConnector && connect({ connector: baseConnector })}>
            Connect Base Account Wallet
          </button>
        )}
      </div>

      {/* Pay button */}
      <button
        className={`bpp-pay${isWorking ? " bpp-pay--working" : ""}`}
        onClick={run}
        disabled={!isConnected || chain?.id !== 8453 || isWorking}
      >
        {step === "idle"    && "⚡ Pay 0.10 USDC & Get Score"}
        {step === "sending" && "✍️ Confirm in wallet…"}
        {step === "scoring" && "🔗 Verifying on-chain…"}
        {step === "done"    && "✅ Done — Pay again"}
        {step === "error"   && "❌ Failed — Retry"}
      </button>

      {/* Error */}
      {error && (
        <div className="bpp-error">
          <strong>Error:</strong> {error}
          {scoreResult?.tx_hash && scoreResult.trust_score === 0 && step === "error" && (
            <button
              className="bpp-retry-btn"
              onClick={() => retryScore(scoreResult.tx_hash)}
            >
              🔄 Retry with same tx
            </button>
          )}
        </div>
      )}

      {/* Result */}
      {scoreResult && scoreResult.trust_score > 0 && (
        <div className="bpp-result">
          <div className="bpp-grade-row">
            <span className="bpp-letter">{scoreResult.grade}</span>
            <span className="bpp-score">{scoreResult.trust_score.toFixed(1)}</span>
            <span className="bpp-label">Trust Score</span>
          </div>
          <div className="bpp-breakdown">
            {Object.entries(scoreResult.breakdown).map(([k, v]) => (
              <div key={k} className="bpp-row">
                <span>{k.replace(/_/g, " ")}</span>
                <span>{typeof v === "number" ? v.toFixed(4) : v}</span>
              </div>
            ))}
          </div>
          <a
            href={`https://basescan.org/tx/${scoreResult.tx_hash}`}
            target="_blank" rel="noopener noreferrer"
            className="bpp-txlink"
          >
            🔗 Basescan: {scoreResult.tx_hash.slice(0, 20)}…
          </a>
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div className="bpp-log">
          {log.map((l, i) => <div key={i} className="bpp-logline">{l}</div>)}
        </div>
      )}

      <style jsx>{`
        .bpp-root {
          background: linear-gradient(135deg, #090912 0%, #0d1117 100%);
          border: 1px solid rgba(99,102,241,.35);
          border-radius: 16px;
          padding: 24px;
          font-family: 'Inter', system-ui, sans-serif;
          color: #e2e8f0;
        }
        .bpp-header { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
        .bpp-icon { font-size:28px; }
        .bpp-title { font-size:17px; font-weight:700; }
        .bpp-sub { font-size:12px; color:#64748b; margin-top:2px; }
        .bpp-sub code { background:rgba(99,102,241,.15); color:#818cf8; padding:1px 5px; border-radius:3px; }
        .bpp-wallet { margin-bottom:14px; }
        .bpp-connected {
          display:flex; align-items:center; gap:10px;
          background:rgba(16,185,129,.08); border:1px solid rgba(16,185,129,.25);
          border-radius:10px; padding:10px 14px; font-size:13px;
        }
        .bpp-dot { width:8px; height:8px; border-radius:50%; background:#10b981; box-shadow:0 0 6px #10b981; flex-shrink:0; }
        .bpp-addr { font-family:monospace; }
        .bpp-chain { font-size:12px; }
        .bpp-chain.ok   { color:#6ee7b7; }
        .bpp-chain.warn { color:#fbbf24; }
        .bpp-ghost {
          margin-left:auto; background:none; border:1px solid rgba(255,255,255,.1);
          color:#94a3b8; padding:3px 10px; border-radius:6px; cursor:pointer; font-size:12px;
        }
        .bpp-ghost:hover { background:rgba(255,255,255,.05); }
        .bpp-connect {
          width:100%; background:linear-gradient(135deg,#4f46e5,#7c3aed);
          color:#fff; border:none; padding:12px; border-radius:10px;
          cursor:pointer; font-size:14px; font-weight:600;
        }
        .bpp-connect:hover { opacity:.9; }
        .bpp-pay {
          width:100%; background:linear-gradient(135deg,#059669,#10b981);
          color:#fff; border:none; padding:14px; border-radius:12px;
          cursor:pointer; font-size:15px; font-weight:700; letter-spacing:.02em;
          transition:all .2s; margin-bottom:14px;
        }
        .bpp-pay:hover:not(:disabled) {
          background:linear-gradient(135deg,#047857,#059669);
          transform:translateY(-1px);
          box-shadow:0 4px 20px rgba(16,185,129,.4);
        }
        .bpp-pay:disabled { opacity:.45; cursor:not-allowed; transform:none; }
        .bpp-pay--working { background:linear-gradient(135deg,#1e3a5f,#1e4080) !important; animation:pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.65} }
        .bpp-error {
          background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.3);
          color:#fca5a5; padding:12px 14px; border-radius:10px; font-size:13px;
          margin-bottom:12px;
          display:flex; flex-direction:column; gap:10px;
        }
        .bpp-retry-btn {
          background:rgba(239,68,68,.15); border:1px solid rgba(239,68,68,.4);
          color:#fca5a5; padding:6px 12px; border-radius:6px; cursor:pointer;
          font-size:12px; font-weight:600; align-self:flex-start;
        }
        .bpp-retry-btn:hover { background:rgba(239,68,68,.25); }
        .bpp-result {
          background:rgba(99,102,241,.08); border:1px solid rgba(99,102,241,.25);
          border-radius:12px; padding:16px; margin-bottom:12px;
        }
        .bpp-grade-row { display:flex; align-items:center; gap:12px; margin-bottom:14px; }
        .bpp-letter { font-size:48px; font-weight:900; color:#6366f1; line-height:1; }
        .bpp-score  { font-size:32px; font-weight:700; color:#e2e8f0; line-height:1; }
        .bpp-label  { font-size:12px; color:#64748b; align-self:flex-end; margin-bottom:4px; }
        .bpp-breakdown {
          border-top:1px solid rgba(255,255,255,.06); padding-top:10px;
          display:flex; flex-direction:column; gap:5px; margin-bottom:12px;
        }
        .bpp-row { display:flex; justify-content:space-between; font-size:12px; color:#94a3b8; }
        .bpp-row span:last-child { color:#e2e8f0; font-family:monospace; }
        .bpp-txlink { display:block; font-size:12px; color:#818cf8; text-decoration:none; word-break:break-all; }
        .bpp-txlink:hover { color:#a5b4fc; text-decoration:underline; }
        .bpp-log {
          background:rgba(0,0,0,.4); border:1px solid rgba(255,255,255,.06);
          border-radius:10px; padding:10px 12px; max-height:160px; overflow-y:auto;
        }
        .bpp-logline { font-family:monospace; font-size:11px; color:#64748b; line-height:1.8; word-break:break-all; }
        .bpp-logline:last-child { color:#94a3b8; }
      `}</style>
    </div>
  );
}
