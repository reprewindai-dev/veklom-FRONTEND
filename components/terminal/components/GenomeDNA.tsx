"use client";
import React from 'react';
import { motion } from 'motion/react';
import { Fingerprint, Shield, FileText, Activity, Network, Zap, Lock } from 'lucide-react';
import { PGLGenome } from '../types';

interface GenomeDNAProps {
  genome?: PGLGenome;
  mini?: boolean;
}

export const GenomeDNA: React.FC<GenomeDNAProps> = ({ genome, mini }) => {
  if (!genome) return null;

  const DNA_LAYERS = [
    { key: 'model', label: 'VNP Ledger Node', icon: <Network size={14} />, color: 'from-[#00E5FF] to-[#0077FF]' },
    { key: 'prompt', label: 'SLA Guardrail', icon: <Shield size={14} />, color: 'from-[#FFB800] to-[#FF8C00]' },
    { key: 'policy', label: 'x402 Execution', icon: <Zap size={14} />, color: 'from-[#00FF66] to-[#00CC44]' },
    { key: 'watchtower', label: 'Identity Core (PGL)', icon: <Lock size={14} />, color: 'from-[#FF003C] to-[#CC0030]' },
  ];

  const getLayerValue = (layerKey: string) => {
    if (!genome || !genome.layers) return 'Active';
    const layers = genome.layers as any;
    if (layers[layerKey]) return layers[layerKey];
    
    // Fallback mapping for VNP schema
    if (layerKey === 'model') return layers.arbiter || 'US-EAST-VNP-Node09';
    if (layerKey === 'prompt') return layers.settlement || 'Strict-Slashing-100VNP';
    if (layerKey === 'policy') return layers.vnp || 'Settlement-Active-x402';
    if (layerKey === 'watchtower') return 'PGL-Verified-Graph';
    return 'Active';
  };

  if (mini) {
    return (
      <div className="bg-black/60 backdrop-blur-xl rounded-xl border border-[#00E5FF]/20 p-4 flex flex-col gap-3 font-mono text-[10px] relative overflow-hidden group hover:border-[#00E5FF]/40 transition-all duration-500 shadow-[0_0_20px_rgba(0,229,255,0.05)]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E5FF]/5 rounded-full blur-[40px] -mr-16 -mt-16 pointer-events-none group-hover:bg-[#00E5FF]/10 transition-colors" />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1.5">
            <Fingerprint size={14} className="text-[#00E5FF] animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#00E5FF]">VNP Identity Genome</span>
          </div>
          <span className="text-[9px] text-white/50 font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10">0x{genome.hash.substring(0, 8)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 relative z-10">
          {DNA_LAYERS.map((layer) => (
            <div key={layer.key} className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex flex-col gap-1.5 hover:bg-white/[0.02] transition-colors relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r ${layer.color} opacity-30`} />
              <div className="flex items-center gap-1.5 text-white/40">
                {React.cloneElement(layer.icon as React.ReactElement, { className: "text-white/60" })}
                <span className="text-[8px] uppercase tracking-widest">{layer.label.split(' ')[0]}</span>
              </div>
              <span className="text-[10px] font-bold text-white/90 truncate tracking-wide">{getLayerValue(layer.key)}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center text-[8px] text-white/40 uppercase mt-2 relative z-10 bg-black/40 p-1.5 rounded border border-white/5">
          <span className="tracking-widest font-bold">VNP SLA SIGNAL</span>
          <div className="flex gap-1 w-24 h-2.5 items-center">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scaleY: 0.3 }}
                animate={{ scaleY: [0.3, Math.random() + 0.4, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.05 }}
                className="h-full flex-grow bg-[#00FF66]/60 rounded-sm shadow-[0_0_4px_#00FF66]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/80 backdrop-blur-2xl rounded-2xl border border-[#00E5FF]/20 p-6 flex flex-col gap-5 relative overflow-hidden group hover:border-[#00E5FF]/40 transition-all duration-500 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#00E5FF]/10 to-transparent rounded-full blur-[60px] -mr-32 -mt-32 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#FFB800]/5 to-transparent rounded-full blur-[40px] -ml-24 -mb-24 pointer-events-none" />
      
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00E5FF]/50 to-transparent opacity-50" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#00E5FF]/10 rounded-lg border border-[#00E5FF]/20 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-[#00E5FF]/20 animate-ping rounded-lg opacity-20" />
            <Fingerprint size={22} className="text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
          </div>
          <div>
            <h2 className="text-sm font-sans font-bold tracking-wide text-white/95">VNP Identity Genome</h2>
            <p className="text-[10px] font-mono tracking-widest text-[#00E5FF]/70 uppercase mt-0.5">Cryptographic Asset</p>
          </div>
        </div>
        <div className="flex flex-col items-start sm:items-end bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/5">
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest mb-0.5 flex items-center gap-1">
              <Lock size={10} /> Immutable Hash
            </span>
            <span className="text-xs font-mono font-bold text-white/90">0x{genome.hash}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 mt-2">
        {DNA_LAYERS.map((layer) => (
          <div key={layer.key} className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-2 relative overflow-hidden group/card hover:bg-white/[0.03] transition-colors">
            {/* Ambient layer glow */}
            <div className={`absolute -bottom-10 -right-10 w-20 h-20 bg-gradient-to-br ${layer.color} opacity-10 blur-[20px] rounded-full group-hover/card:opacity-20 transition-opacity`} />
            
            <div className="flex items-center gap-2 text-white/50 mb-1">
              {React.cloneElement(layer.icon as React.ReactElement, { className: "text-white/70" })}
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/60">{layer.label}</span>
            </div>
            
            <div className="flex items-end justify-between mt-1">
                <span className="text-[13px] font-sans font-medium text-white/95 tracking-wide">{getLayerValue(layer.key)}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-mono text-[#00FF66] tracking-widest uppercase">Sync</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00FF66] shadow-[0_0_5px_#00FF66] animate-pulse" />
                </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-5 border-t border-white/5 relative z-10">
        <div className="flex justify-between items-center text-[10px] font-mono uppercase mb-3">
           <span className="text-white/40 font-bold tracking-widest">Network Consensus Integrity</span>
           <span className="text-[#00E5FF] flex items-center gap-1.5 px-2 py-0.5 bg-[#00E5FF]/10 rounded border border-[#00E5FF]/20">
             <Activity size={10} /> Verified (VNP)
           </span>
        </div>
        <div className="flex gap-1.5 h-4 items-end">
          {[...Array(40)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ height: '20%' }}
              animate={{ height: ['20%', `${Math.random() * 80 + 20}%`, '20%'] }}
              transition={{ repeat: Infinity, duration: Math.random() * 2 + 1, delay: i * 0.05 }}
              className="flex-1 bg-gradient-to-t from-[#00E5FF]/60 to-[#00E5FF]/20 rounded-t-sm opacity-80"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
