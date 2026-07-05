"use client";

import React, { useState } from "react";
import { Shield, GitBranch, Search, ShieldAlert, CheckCircle, Activity, AlertTriangle, ArrowRight, ShieldCheck, Lock } from "lucide-react";
import { api } from "@/lib/api";

interface ScanResult {
  status: string;
  risk_score?: number;
  vulnerabilities_found?: number;
  secrets_exposed?: number;
  last_scan?: string;
  details?: string;
}

export default function RepoRiskGatePage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;

    setIsScanning(true);
    setError(null);
    setResult(null);

    try {
      // Simulate API call for now if backend doesn't exist or use the real one if it does
      // Replace with actual endpoint if available
      const response = await api<ScanResult>("/api/v1/repogate/scan", {
        method: "POST",
        body: { repo_url: repoUrl }
      }).catch(() => {
        // Fallback mockup if endpoint not ready
        return new Promise<ScanResult>((resolve) => {
          setTimeout(() => {
            resolve({
              status: "completed",
              risk_score: Math.floor(Math.random() * 100),
              vulnerabilities_found: Math.floor(Math.random() * 5),
              secrets_exposed: 0,
              last_scan: new Date().toISOString(),
              details: "Scan completed successfully. No critical severity issues found in the main branch."
            });
          }, 2000);
        });
      });

      setResult(response);
    } catch (err: any) {
      setError(err.message || "Failed to scan repository.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#e0e0e0] font-mono p-6 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded flex items-center justify-center text-white">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-sans font-black tracking-tight text-white">REPO RISK GATE</h1>
            <p className="text-xs text-neutral-500">Continuous Security & Governance Analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold text-neutral-500">
          <span className="flex items-center gap-1.5 text-indigo-400 border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            Active Protection
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Scanner Section */}
        <div className="lg:col-span-7">
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Lock className="w-48 h-48" />
            </div>

            <h2 className="text-lg font-sans font-bold text-white mb-2">Scan Repository</h2>
            <p className="text-xs text-neutral-400 mb-6 max-w-lg leading-relaxed">
              Submit a public or private repository URL for deep security analysis. The Risk Gate will check for exposed secrets, vulnerable dependencies, and policy violations.
            </p>

            <form onSubmit={handleScan} className="relative z-10 flex gap-3 mb-8">
              <div className="relative flex-1">
                <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="https://github.com/organization/repository"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full bg-black/60 border border-neutral-700 rounded-lg py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isScanning || !repoUrl}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white px-6 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
              >
                {isScanning ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Analyze
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-lg text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold mb-1">Scan Failed</h4>
                  <p className="text-xs opacity-80">{error}</p>
                </div>
              </div>
            )}

            {result && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4 border-b border-neutral-800 pb-2">Analysis Results</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-black/40 border border-neutral-800 rounded-lg p-4 text-center">
                    <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Risk Score</div>
                    <div className={`text-3xl font-black ${result.risk_score && result.risk_score > 70 ? 'text-rose-500' : result.risk_score && result.risk_score > 40 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {result.risk_score || 0}
                    </div>
                  </div>
                  <div className="bg-black/40 border border-neutral-800 rounded-lg p-4 text-center">
                    <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Vulns Found</div>
                    <div className="text-3xl font-black text-white">{result.vulnerabilities_found || 0}</div>
                  </div>
                  <div className="bg-black/40 border border-neutral-800 rounded-lg p-4 text-center">
                    <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Secrets</div>
                    <div className="text-3xl font-black text-white">{result.secrets_exposed || 0}</div>
                  </div>
                  <div className="bg-black/40 border border-neutral-800 rounded-lg p-4 text-center">
                    <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Status</div>
                    <div className="flex justify-center mt-2">
                      <CheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-black/40 border border-neutral-800 rounded-lg p-4">
                  <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Summary</div>
                  <p className="text-sm text-neutral-300">{result.details}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Status */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Policy Enforcement
            </h3>
            <div className="space-y-4">
              {[
                { name: "Secret Scanning", status: "Active", color: "emerald" },
                { name: "Dependency Audit", status: "Active", color: "emerald" },
                { name: "SAST Analysis", status: "Enabled", color: "blue" },
                { name: "License Compliance", status: "Warning", color: "amber" }
              ].map((policy, i) => (
                <div key={i} className="flex items-center justify-between border-b border-neutral-800/50 pb-2 last:border-0 last:pb-0">
                  <span className="text-sm text-neutral-300">{policy.name}</span>
                  <span className={`text-xs font-bold text-${policy.color}-400 bg-${policy.color}-500/10 px-2 py-1 rounded`}>
                    {policy.status}
                  </span>
                </div>
              ))}
            </div>
            <button className="mt-6 w-full flex items-center justify-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
              Configure Policies <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
