"use client";

/**
 * BankerPayPanel — Operator-triggered USDC payment to /api/v1/x402/score
 *
 * Full gold-standard flow:
 *   1. POST /api/v1/banker/pay/prepare  → creates pending Payment row
 *   2. wallet_sendCalls via Base Account wagmi connector → real on-chain USDC send
 *   3. POST /api/v1/banker/pay/confirm  → records tx_hash + settlement proof
 *   4. POST /api/v1/x402/score          → calls the paid endpoint using tx_hash as X-PAYMENT
 *
 * Requires the wallet to be connected via the baseAccount() wagmi connector.
 * No backend signing. No EOA private keys. No mock.
 */

import { useState, useCallback } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  usePublicClient,
  useSendTransaction,
} from "wagmi";
import { parseUnits, encodeFunctionData } from "viem";
import { api } from "@/lib/api";

// Base Mainnet USDC contract
const USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
// Your treasury wallet (receives the payment)
const TREASURY = "0x3a74772e925b54F7dAD7FD95c9Ba30825033f970" as const;
// 0.10 USDC = 100000 (6 decimals)
const AMOUNT_USDC = "0.10";
const AMOUNT_UNITS = parseUnits(AMOUNT_USDC, 6);

// Minimal ERC-20 transfer ABI
const ERC20_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

type Step =
  | "idle"
  | "connecting"
  | "preparing"
  | "sending"
  | "confirming"
  | "scoring"
  | "done"
  | "error";

interface ScoreResult {
  trust_score: number;
  grade: string;
  breakdown: Record<string, number>;
  tx_hash: string;
  basescan_url: string;
}

export function BankerPayPanel() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [step, setStep] = useState<Step>("idle");
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);

  const { sendTransactionAsync } = useSendTransaction();
  const publicClient = usePublicClient({ chainId: 8453 });

  const addLog = (msg: string) =>
    setLog((prev) => [...prev, `[${new Date().toISOString().slice(11, 19)}] ${msg}`]);

  const handleError = (msg: string) => {
    setError(msg);
    setStep("error");
    addLog(`❌ ERROR: ${msg}`);
  };

  const run = useCallback(async () => {
    if (!isConnected || !address) {
      handleError("Wallet not connected. Connect your Base Account first.");
      return;
    }
    if (chain?.id !== 8453) {
      handleError("Wrong network. Switch your wallet to Base Mainnet (chain ID 8453).");
      return;
    }
    if (!publicClient) {
      handleError("Base Mainnet RPC client is not ready. Refresh the page and reconnect your wallet.");
      return;
    }

    setError(null);
    setScoreResult(null);
    setTxHash(null);
    setLog([]);

    try {
      // ── STEP 1: Prepare payment (idempotency check + pending DB row) ──────
      setStep("preparing");
      addLog(`Preparing payment: ${AMOUNT_USDC} USDC → ${TREASURY.slice(0, 10)}...`);

      const paymentObjectId = Date.now();
      const prepared = await api<{
        id: number;
        payment_object_type: string;
        payment_object_id: number;
        status: string;
      }>("/api/v1/banker/pay/prepare", {
        method: "POST",
        body: {
          payment_object_type: "x402_score_proof",
          payment_object_id: paymentObjectId,
          to_address: TREASURY,
          amount: parseFloat(AMOUNT_USDC),
          asset: "USDC",
        },
      });
      setPaymentId(prepared.id);
      addLog(`✅ Payment prepared. ID: ${prepared.id} | Status: ${prepared.status}`);

      // ── STEP 2: Send USDC via Base Account wallet ─────────────────────────
      setStep("sending");
      addLog(`Sending ${AMOUNT_USDC} USDC on-chain via Base Account wallet...`);

      const transferData = encodeFunctionData({
        abi: ERC20_TRANSFER_ABI,
        functionName: "transfer",
        args: [TREASURY, AMOUNT_UNITS],
      });

      const hash = await sendTransactionAsync({
        to: USDC_CONTRACT,
        data: transferData,
        chainId: 8453,
      });

      setTxHash(hash);
      addLog(`✅ Tx submitted: ${hash}`);
      addLog(`🔗 https://basescan.org/tx/${hash}`);

      // ── STEP 3: Confirm payment (record tx proof in DB) ───────────────────
      setStep("confirming");
      addLog(`Waiting for Base receipt and recording proof...`);

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });
      if (receipt.status !== "success") {
        throw new Error(`Base transaction failed on-chain: ${hash}`);
      }

      const confirmed = await api<{ status: string }>("/api/v1/banker/pay/confirm", {
        method: "POST",
        body: {
          payment_object_type: "x402_score_proof",
          payment_object_id: prepared.payment_object_id || paymentObjectId,
          tx_hash: hash,
          chain_id: 8453,
          block_number: Number(receipt.blockNumber),
          gas_used: Number(receipt.gasUsed),
        },
      });
      addLog(`✅ Payment confirmed in DB. Status: ${confirmed.status}`);

      // ── STEP 4: Call /score with tx_hash as X-PAYMENT proof ──────────────
      setStep("scoring");
      addLog(`Calling /api/v1/x402/score with X-PAYMENT: ${hash.slice(0, 18)}...`);

      const scoreData = await api<{
        trust_score?: number;
        grade?: string;
        breakdown?: Record<string, number>;
      }>("/api/v1/x402/score", {
        method: "POST",
        body: { subject: address },
        headers: {
          "X-Payment": hash,
          "X-Veklom-Receipt-ID": hash,
        },
      });

      setScoreResult({
        trust_score: scoreData.trust_score ?? 0,
        grade: scoreData.grade ?? "—",
        breakdown: scoreData.breakdown ?? {},
        tx_hash: hash,
        basescan_url: `https://basescan.org/tx/${hash}`,
      });

      setStep("done");
      addLog(`✅ Done. Trust score: ${scoreData.trust_score} (${scoreData.grade})`);
    } catch (e: any) {
      handleError(e?.message || String(e));
    }
  }, [isConnected, address, chain, publicClient, sendTransactionAsync]);

  // ── Find the Base Account connector ──────────────────────────────────────
  const baseAccountConnector = connectors.find((c) => c.id === "baseAccount");
  const coinbaseConnector = connectors.find((c) => c.id === "coinbaseWalletSDK");
  const primaryConnector = baseAccountConnector ?? coinbaseConnector ?? connectors[0];

  return (
    <div className="banker-pay-panel">
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-icon">⚡</span>
          Banker — Pay & Score
        </div>
        <div className="panel-subtitle">
          Real 0.10 USDC on-chain payment to <code>/api/v1/x402/score</code>
        </div>
      </div>

      {/* Wallet Connection */}
      <div className="wallet-section">
        {isConnected && address ? (
          <div className="wallet-connected">
            <span className="wallet-dot" />
            <span className="wallet-addr">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
            <span className="wallet-chain">
              {chain?.id === 8453 ? "✅ Base Mainnet" : `⚠️ Wrong chain: ${chain?.name}`}
            </span>
            <button className="btn-ghost" onClick={() => disconnect()}>
              Disconnect
            </button>
          </div>
        ) : (
          <button
            className="btn-connect"
            onClick={() => primaryConnector && connect({ connector: primaryConnector })}
            disabled={!primaryConnector}
          >
            Connect Base Account Wallet
          </button>
        )}
      </div>

      {/* Pay & Score Button */}
      <button
        className={`btn-pay ${step !== "idle" && step !== "done" && step !== "error" ? "btn-pay--loading" : ""}`}
        onClick={run}
        disabled={!isConnected || chain?.id !== 8453 || (step !== "idle" && step !== "done" && step !== "error")}
      >
        {step === "idle" && "⚡ Pay 0.10 USDC & Get Score"}
        {step === "preparing" && "⏳ Preparing payment..."}
        {step === "sending" && "✍️ Waiting for wallet signature..."}
        {step === "confirming" && "🔗 Recording proof..."}
        {step === "scoring" && "📊 Calling /score..."}
        {step === "done" && "✅ Done — Run again"}
        {step === "error" && "❌ Error — Retry"}
      </button>

      {/* Error */}
      {error && (
        <div className="panel-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Result */}
      {scoreResult && (
        <div className="score-result">
          <div className="score-grade">
            <span className="grade-letter">{scoreResult.grade}</span>
            <span className="grade-score">{scoreResult.trust_score.toFixed(1)}</span>
            <span className="grade-label">Trust Score</span>
          </div>
          <div className="score-breakdown">
            {Object.entries(scoreResult.breakdown).map(([k, v]) => (
              <div key={k} className="breakdown-row">
                <span>{k.replace(/_/g, " ")}</span>
                <span>{typeof v === "number" ? v.toFixed(4) : v}</span>
              </div>
            ))}
          </div>
          <a
            href={scoreResult.basescan_url}
            target="_blank"
            rel="noopener noreferrer"
            className="tx-link"
          >
            🔗 View on Basescan: {scoreResult.tx_hash.slice(0, 18)}...
          </a>
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div className="pay-log">
          {log.map((line, i) => (
            <div key={i} className="log-line">
              {line}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .banker-pay-panel {
          background: linear-gradient(135deg, #0a0a1a 0%, #0d1117 100%);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 16px;
          padding: 24px;
          max-width: 620px;
          font-family: 'Inter', 'JetBrains Mono', monospace;
        }
        .panel-header { margin-bottom: 20px; }
        .panel-title {
          font-size: 18px;
          font-weight: 700;
          color: #e2e8f0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .panel-icon { font-size: 20px; }
        .panel-subtitle {
          font-size: 13px;
          color: #64748b;
          margin-top: 4px;
        }
        .panel-subtitle code {
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 12px;
        }
        .wallet-section { margin-bottom: 16px; }
        .wallet-connected {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          color: #a7f3d0;
        }
        .wallet-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
        }
        .wallet-addr { font-family: monospace; color: #e2e8f0; }
        .wallet-chain { color: #6ee7b7; font-size: 12px; }
        .btn-ghost {
          margin-left: auto;
          background: none;
          border: 1px solid rgba(255,255,255,0.1);
          color: #94a3b8;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.05); }
        .btn-connect {
          width: 100%;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: opacity 0.2s;
        }
        .btn-connect:hover { opacity: 0.9; }
        .btn-connect:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-pay {
          width: 100%;
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          color: white;
          border: none;
          padding: 14px 20px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.02em;
          transition: all 0.2s;
          margin-bottom: 16px;
        }
        .btn-pay:hover:not(:disabled) {
          background: linear-gradient(135deg, #047857 0%, #059669 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
        }
        .btn-pay:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .btn-pay--loading {
          background: linear-gradient(135deg, #1e3a5f 0%, #1e4080 100%);
          animation: pulse-btn 1.5s ease-in-out infinite;
        }
        @keyframes pulse-btn {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .panel-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 12px;
        }
        .score-result {
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.25);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
        }
        .score-grade {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .grade-letter {
          font-size: 48px;
          font-weight: 900;
          color: #6366f1;
          line-height: 1;
        }
        .grade-score {
          font-size: 32px;
          font-weight: 700;
          color: #e2e8f0;
          line-height: 1;
        }
        .grade-label {
          font-size: 12px;
          color: #64748b;
          align-self: flex-end;
          margin-bottom: 4px;
        }
        .score-breakdown {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
        }
        .breakdown-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #94a3b8;
        }
        .breakdown-row span:last-child { color: #e2e8f0; font-family: monospace; }
        .tx-link {
          display: block;
          font-size: 12px;
          color: #818cf8;
          text-decoration: none;
          word-break: break-all;
        }
        .tx-link:hover { color: #a5b4fc; text-decoration: underline; }
        .pay-log {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 12px;
          max-height: 180px;
          overflow-y: auto;
          margin-top: 4px;
        }
        .log-line {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #64748b;
          line-height: 1.7;
          white-space: pre-wrap;
          word-break: break-all;
        }
        .log-line:last-child { color: #94a3b8; }
      `}</style>
    </div>
  );
}
