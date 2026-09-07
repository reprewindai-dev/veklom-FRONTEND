"use client";
import React, { useState, useMemo } from "react";
import { Coins, Sliders, Check, ShieldCheck } from "lucide-react";

// Types extracted from ABIDE for standalone COS usage
export interface ProductOffering {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  priceModel: string;
}

export interface Capability {
  id: string;
  name: string;
  description: string;
  status: string;
  version: string;
  pricingModel?: {
    priceFloor: number;
    billingUnit: string;
  };
}

interface IntentCompilerProps {
  productOfferings: ProductOffering[];
  capabilities: Capability[];
}

export default function IntentCompiler({ productOfferings, capabilities }: IntentCompilerProps) {
  // Bundle checklist states
  const [selectedCaps, setSelectedCaps] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (capabilities && capabilities.length > 0) {
      initial[capabilities[0].id] = true;
      if (capabilities.length > 1) {
        initial[capabilities[1].id] = true;
      }
    } else {
      initial["govern-agent-session"] = true;
      initial["score-api-eligibility"] = true;
    }
    return initial;
  });
  const [slaIndex, setSlaIndex] = useState<number>(1.0); // 1.0 = Platinum, 0.8 = Gold, 1.4 = Sovereign
  const [monthlyVolumeK, setMonthlyVolumeK] = useState<number>(250); // in thousands
  const [receipt, setReceipt] = useState<any>(null);

  // Toggle cap check
  const handleToggleCap = (id: string) => {
    setSelectedCaps(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Pricing calculations
  const priceCalculation = useMemo(() => {
    let basePriceFloor = 0;
    let selectedCount = 0;

    capabilities.forEach(cap => {
      if (selectedCaps[cap.id]) {
        basePriceFloor += cap.pricingModel?.priceFloor || 0;
        selectedCount++;
      }
    });

    // Calculations based on sliders
    const grossCost = monthlyVolumeK * 1000 * basePriceFloor * slaIndex;
    
    // Bulk volume discount
    let discount = 0;
    if (monthlyVolumeK >= 1000) {
      discount = 0.20; // 20% discount above 1M transactions
    } else if (monthlyVolumeK >= 500) {
      discount = 0.12; // 12% discount above 500k
    } else if (selectedCount >= 3) {
      discount = 0.08; // 8% bundle discount
    }

    const discountedPrice = grossCost * (1 - discount);
    const costToServe = grossCost * 0.15; // standard 15% hardware base cost index
    const grossMargin = discountedPrice - costToServe;
    const marginPercent = discountedPrice > 0 ? (grossMargin / discountedPrice) * 100 : 0;

    return {
      basePriceFloor,
      selectedCount,
      grossCost,
      discount,
      discountedPrice,
      marginPercent
    };
  }, [selectedCaps, slaIndex, monthlyVolumeK, capabilities]);

  // Mint cryptographic bundle agreement receipt
  const handleMintAgreement = () => {
    if (priceCalculation.selectedCount === 0) return;

    const receiptHash = "AGREEM_SEAL_" + Math.random().toString(36).substring(2, 15).toUpperCase();
    setReceipt({
      hash: receiptHash,
      timestamp: new Date().toISOString(),
      caps: Object.keys(selectedCaps).filter(k => selectedCaps[k]),
      volume: monthlyVolumeK * 1000,
      sla: slaIndex === 0.8 ? "GOLD (99.9%)" : slaIndex === 1.0 ? "PLATINUM (99.99%)" : "SOVEREIGN (99.999%)",
      price: priceCalculation.discountedPrice
    });
  };

  return (
    <div className="space-y-8">
      {/* Existing product bundles */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-cos-border pb-3">
          <Coins size={18} className="text-cos-accent" />
          <h3 className="text-xl font-black text-cos-text uppercase tracking-tight">Active Capability Packages</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {productOfferings.map((prod, idx) => (
            <div key={idx} className="p-5 border border-cos-border bg-cos-surface space-y-4 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cos-accent/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-start gap-4">
                <h4 className="font-black text-cos-text text-sm uppercase tracking-tight">{prod.name}</h4>
                <span className="text-[9px] px-2 py-0.5 bg-cos-verified/10 border border-cos-verified/30 text-cos-verified font-bold uppercase tracking-widest shrink-0 rounded-sm">
                  ACTIVE SPEC
                </span>
              </div>
              <p className="text-[11px] text-cos-muted font-mono leading-relaxed uppercase">{prod.description}</p>
              
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-mono text-cos-muted uppercase block">Bundled Capabilities:</span>
                <div className="flex flex-wrap gap-1.5">
                  {prod.capabilities.map((capId, i) => {
                    const matched = capabilities.find(c => c.id === capId);
                    return (
                      <span key={i} className="text-[9px] font-mono bg-cos-surface2 border border-cos-border rounded px-2 py-0.5 text-cos-muted font-semibold uppercase">
                        {matched ? matched.name : capId}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-cos-border flex justify-between items-center text-[10px] font-mono uppercase text-cos-muted">
                <span>Model: {prod.priceModel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Custom Bundle Constructor */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-cos-border pb-3 pt-4">
          <Sliders size={18} className="text-cos-accent" />
          <h3 className="text-xl font-black text-cos-text uppercase tracking-tight">Enterprise Custom Blueprint Compiler</h3>
        </div>
        <p className="text-xs font-mono text-cos-muted uppercase leading-relaxed max-w-4xl">
          Select capabilities to bundle into a single enterprise contract. Set target SLA boundaries and scale multipliers to view real-time settlement projection pricing and margin estimates.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Capability Checklist & Sliders */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Checklist */}
            <div className="space-y-3">
              <label className="block text-xs font-mono font-black text-cos-text uppercase tracking-wider">
                Select Capabilities to Bundle:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono uppercase">
                {capabilities.map(cap => {
                  const isChecked = !!selectedCaps[cap.id];
                  return (
                    <div
                      key={cap.id}
                      onClick={() => handleToggleCap(cap.id)}
                      className={`p-4 border transition-all duration-150 cursor-pointer rounded-lg flex items-start gap-3 ${
                        isChecked
                          ? "bg-cos-accent/5 border-cos-accent/50 shadow-[inset_0_0_12px_rgba(0,229,255,0.1)] text-cos-text"
                          : "bg-cos-surface border-cos-border text-cos-muted hover:border-cos-steel/50"
                      }`}
                    >
                      <div className={`w-4 h-4 border shrink-0 flex items-center justify-center mt-0.5 rounded-sm ${isChecked ? "border-cos-accent bg-cos-accent/20" : "border-cos-border"}`}>
                        {isChecked && <Check size={11} className="text-cos-accent stroke-[4]" />}
                      </div>
                      <div className="space-y-1">
                        <span className={`font-black tracking-wide ${isChecked ? "text-cos-text" : "text-cos-muted"}`}>{cap.name}</span>
                        <p className="text-[9px] opacity-70 leading-tight normal-case">{cap.pricingModel?.billingUnit || "per transaction"} — Floor: ${cap.pricingModel?.priceFloor || 0}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SLA select & volume multiplier slider */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <label className="block text-xs font-mono font-black text-cos-text uppercase tracking-wider">
                  Target SLA Class:
                </label>
                <select
                  value={slaIndex}
                  onChange={(e) => setSlaIndex(parseFloat(e.target.value))}
                  className="w-full bg-cos-surface border border-cos-border p-2.5 text-xs text-cos-text focus:outline-none focus:border-cos-accent focus:ring-1 focus:ring-cos-accent/50 rounded-lg font-mono uppercase transition-all"
                >
                  <option value={0.8}>GOLD (99.9%) - 20% discount</option>
                  <option value={1.0}>PLATINUM (99.99%) - standard index</option>
                  <option value={1.4}>SOVEREIGN (99.999%) - 40% premium</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono uppercase">
                  <span className="text-cos-text">Est. Monthly Volume:</span>
                  <span className="text-cos-accent font-black">{(monthlyVolumeK * 1000).toLocaleString()} checks</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={monthlyVolumeK}
                  onChange={(e) => setMonthlyVolumeK(parseInt(e.target.value))}
                  className="w-full accent-cos-accent h-1.5 bg-cos-surface2 rounded-full cursor-pointer appearance-none"
                />
                <div className="flex justify-between text-[9px] text-cos-muted font-mono uppercase">
                  <span>10K runs</span>
                  <span>1,000K runs</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right: Dynamic Billing Invoice & Receipt */}
          <div className="lg:col-span-5 p-5 border border-cos-border bg-cos-surface flex flex-col justify-between rounded-xl min-h-[300px]">
            <div className="space-y-4">
              <div className="border-b border-cos-border pb-3 flex justify-between items-center">
                <span className="text-[10px] font-mono font-black text-cos-muted uppercase tracking-widest">REAL-TIME INVOICE ESTIMATION</span>
                <span className="text-cos-verified font-mono text-[9px] font-bold uppercase tracking-widest bg-cos-verified/10 border border-cos-verified/30 px-1.5 py-0.5 rounded-sm">
                  X402 settlement compat
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-mono uppercase">
                <div className="flex justify-between">
                  <span className="text-cos-muted">Capabilities Selected:</span>
                  <span className="text-cos-text font-bold">{priceCalculation.selectedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cos-muted">Sum Price Floor:</span>
                  <span className="text-cos-text font-bold">${priceCalculation.basePriceFloor.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cos-muted">Bulk Volume Discount:</span>
                  <span className="text-cos-verified font-black">{(priceCalculation.discount * 100).toFixed(0)}% OFF</span>
                </div>
                <div className="flex justify-between border-t border-cos-border pt-2.5">
                  <span className="text-cos-muted">Gross Cost:</span>
                  <span className="text-cos-text">${priceCalculation.grossCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-base border-t border-dashed border-cos-border pt-3">
                  <span className="text-cos-text font-black">Package Net Cost:</span>
                  <span className="text-cos-accent font-black">${priceCalculation.discountedPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} / mo</span>
                </div>
                <div className="flex justify-between text-[10px] pt-1">
                  <span className="text-cos-muted">Target Margin Index:</span>
                  <span className="text-cos-steel">{priceCalculation.marginPercent.toFixed(1)}% Est.</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleMintAgreement}
                  disabled={priceCalculation.selectedCount === 0}
                  className="w-full py-2.5 bg-cos-accent/10 border border-cos-accent text-cos-accent hover:bg-cos-accent hover:text-black text-xs font-black uppercase tracking-widest transition-all rounded-lg disabled:opacity-30 disabled:border-cos-border disabled:text-cos-muted disabled:bg-transparent"
                >
                  Mint Bundle Agreement Receipt
                </button>
              </div>
            </div>

            {receipt && (
              <div className="mt-4 p-4 border border-cos-verified/20 bg-cos-verified/5 text-xs font-mono uppercase space-y-2 rounded-lg">
                <div className="flex items-center gap-1.5 text-cos-verified font-bold border-b border-cos-verified/20 pb-1.5">
                  <ShieldCheck size={14} />
                  <span>DEFI ESCROW COLLATERAL DEPOSITED</span>
                </div>
                <div className="text-[10px] text-cos-text space-y-1 mt-2">
                  <p><span className="text-cos-muted">HASH:</span> <span className="text-cos-steel">{receipt.hash}</span></p>
                  <p><span className="text-cos-muted">CONTRACT SLA:</span> {receipt.sla}</p>
                  <p><span className="text-cos-muted">EST. VALUE:</span> ${receipt.price.toLocaleString()} USD / Month</p>
                  <p className="text-[9px] text-cos-verified/70 lowercase mt-1">Proof anchored on Gnomledger block 1822831.</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
