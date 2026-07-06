"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, ShieldCheck, Activity, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VNPClaimPage() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    // Simulate API call for now (will connect to backend later)
    setTimeout(() => {
      setStatus('success');
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#FFB800]/30 relative z-10 flex flex-col">
      
      {/* Simple Header */}
      <nav className="border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/vnp" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Protocol
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#FFB800] rounded flex items-center justify-center brand-glow">
              <span className="font-bold text-black text-xs leading-none">V</span>
            </div>
            <span className="font-bold font-mono tracking-wider text-sm">VNP_ONBOARD</span>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center py-12 px-6">
        
        {/* Background Glow */}
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] bg-[#FFB800]/5 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-lg w-full">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight mb-4">Submit API for Evaluation</h1>
            <p className="text-gray-400">
              Enter your mission-critical API details below. Once verified, it will be added to the decentralized edge-probing mesh to establish its cryptographic baseline.
            </p>
          </div>

          {status === 'success' ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Submission Received</h2>
              <p className="text-gray-400 mb-6">
                Your API endpoint has been added to the evaluation queue. The VNP Edge Network will begin preliminary latency and uptime probing shortly.
              </p>
              <Link href="/vnp" className="inline-flex px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors">
                Return to Global Mesh
              </Link>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="obsidian-glass border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FFB800] to-transparent opacity-50" />
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-gray-500 mb-2 uppercase tracking-wider">Provider Name</label>
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. OpenAI, Stripe"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#FFB800]/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-gray-500 mb-2 uppercase tracking-wider">API Name</label>
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. GPT-4 Inference"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#FFB800]/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-gray-500 mb-2 uppercase tracking-wider">Base URL Endpoint</label>
                    <div className="relative">
                      <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                        required
                        type="url" 
                        placeholder="https://api.provider.com/v1"
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#FFB800]/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-gray-500 mb-2 uppercase tracking-wider">Healthcheck / Ping Path</label>
                    <div className="relative">
                      <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                        required
                        type="text" 
                        placeholder="/health or /ping"
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#FFB800]/50 transition-colors"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">This is the exact endpoint our global Edge Probes will hit to measure latency.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-gray-500 mb-2 uppercase tracking-wider">Contact Email</label>
                    <input 
                      required
                      type="email" 
                      placeholder="engineering@provider.com"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#FFB800]/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={status === 'submitting'}
                    className="w-full bg-[#FFB800] hover:bg-[#FFB800]/90 text-black font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {status === 'submitting' ? (
                      <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Verifying...</span>
                    ) : (
                      <>Initialize Baseline Probing <Send className="w-4 h-4" /></>
                    )}
                  </button>
                  <p className="text-center text-xs text-gray-500 mt-4">
                    By submitting, you agree to the VNP Governance Charter. 
                    <br/>If accepted, your API's latency will be public.
                  </p>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}
