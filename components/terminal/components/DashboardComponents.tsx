import React from 'react';

// --- Base Panel ---
export const PanelCard = ({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={`obsidian-glass border border-[#00E5FF]/10 rounded-xl p-4 relative backdrop-blur-md shadow-[0_0_15px_rgba(0,229,255,0.02)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,229,255,0.05)] hover:border-[#00E5FF]/20 flex flex-col ${className}`}>
    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none rounded-xl"></div>
    <div className="text-[10px] tracking-[0.2em] text-white/90 font-sans mb-4 flex items-center justify-between border-b border-[#00E5FF]/20 pb-2 uppercase relative z-10">
      <div className="flex items-center gap-2">
        <div className="w-1 h-1 bg-[#00E5FF] rounded-full shadow-[0_0_8px_#00E5FF]"></div>
        {title}
      </div>
    </div>
    <div className="flex-1 overflow-y-auto scrollbar-hide relative z-10">
      {children}
    </div>
  </div>
);

// --- Status Badge ---
export const StatusBadge = ({ state, text }: { state: 'healthy' | 'warning' | 'critical' | 'neutral', text: string }) => {
  const colors = {
    healthy: 'text-[#00FF66] bg-[#00FF66]/10 border-[#00FF66]/30 shadow-[0_0_10px_rgba(0,255,102,0.1)]',
    warning: 'text-hazard-amber bg-hazard-amber/10 border-hazard-amber/30 shadow-[0_0_10px_rgba(255,184,0,0.1)]',
    critical: 'text-rose-400 bg-rose-500/10 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
    neutral: 'text-[#00E5FF] bg-[#00E5FF]/10 border-[#00E5FF]/30 shadow-[0_0_10px_rgba(0,229,255,0.1)]'
  };
  
  const dots = {
    healthy: 'bg-[#00FF66] shadow-[0_0_6px_#00FF66]',
    warning: 'bg-hazard-amber shadow-[0_0_6px_#FFB800]',
    critical: 'bg-rose-400 shadow-[0_0_6px_#fb7185]',
    neutral: 'bg-[#00E5FF] shadow-[0_0_6px_#00E5FF]'
  };

  return (
    <div className={`flex w-fit items-center gap-2 text-[9px] font-mono tracking-widest border px-2.5 py-1 rounded-full backdrop-blur-sm transition-all duration-300 ${colors[state]}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${dots[state]} animate-pulse`}></div>
      {text}
    </div>
  );
};

// --- Metric Card ---
export const MetricCard = ({ label, value, subtext, empty = false }: { label: string, value: string, subtext?: string, empty?: boolean }) => {
  if (empty) {
    return (
      <div className="bg-void-metal/20 border border-[#00E5FF]/10 rounded-lg p-3 flex flex-col justify-center border-dashed backdrop-blur-sm">
        <span className="text-[9px] text-[#00E5FF]/40 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] text-white/30 mt-1 font-mono">{value}</span>
      </div>
    );
  }

  return (
    <div className="bg-void-metal/40 border border-[#00E5FF]/20 rounded-lg p-3 flex flex-col justify-center transition-colors duration-300 hover:bg-[#00E5FF]/10 hover:border-[#00E5FF]/40 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00E5FF]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <span className="text-[9px] text-[#00E5FF]/60 uppercase tracking-[0.15em] mb-1.5 font-sans">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-xl text-white font-mono tracking-tight group-hover:text-white transition-colors">{value}</span>
        {subtext && <span className="text-[8px] text-[#00E5FF]/70 font-mono">{subtext}</span>}
      </div>
    </div>
  );
};

// --- Action Row (Attention Queue / Primary Actions) ---
export const ActionRow = ({ type, title, subtitle, actionText, onClick }: { type: 'do_now' | 'review' | 'open', title: string, subtitle: string, actionText: string, onClick?: () => void }) => {
  const styles = {
    do_now: { border: 'border-rose-900/40 hover:border-rose-500/50', bg: 'bg-void-metal/40 hover:bg-rose-900/20', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20', button: 'border-rose-900/40 text-rose-300 hover:bg-rose-500/20 hover:text-rose-100 hover:border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0)] hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]' },
    review: { border: 'border-hazard-amber/30 hover:border-hazard-amber/50', bg: 'bg-void-metal/40 hover:bg-hazard-amber/10', badge: 'bg-hazard-amber/10 text-hazard-amber border-hazard-amber/20', button: 'border-hazard-amber/30 text-hazard-amber hover:bg-hazard-amber/20 hover:text-white hover:border-hazard-amber/50 shadow-[0_0_10px_rgba(255,184,0,0)] hover:shadow-[0_0_15px_rgba(255,184,0,0.2)]' },
    open: { border: 'border-[#00E5FF]/30 hover:border-[#00E5FF]/50', bg: 'bg-void-metal/40 hover:bg-[#00E5FF]/10', badge: 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20', button: 'border-[#00E5FF]/30 text-[#00E5FF] hover:bg-[#00E5FF]/20 hover:text-white hover:border-[#00E5FF]/50 shadow-[0_0_10px_rgba(0,229,255,0)] hover:shadow-[0_0_15px_rgba(0,229,255,0.2)]' }
  };

  const current = styles[type];

  return (
    <div className={`border ${current.border} ${current.bg} rounded-xl p-4 flex items-center justify-between group transition-all duration-300 backdrop-blur-sm`}>
      <div className="flex items-center gap-4">
        <div className={`text-[9px] font-mono px-2 py-1 rounded border uppercase tracking-[0.15em] ${current.badge}`}>
          {type.replace('_', ' ')}
        </div>
        <div>
          <div className="text-white/90 text-[13px] font-sans font-medium">{title}</div>
          <div className="text-[10px] text-white/40 mt-1 font-mono leading-tight">{subtitle}</div>
        </div>
      </div>
      <button onClick={onClick} className={`text-[9px] font-mono px-4 py-2 border rounded transition-all duration-300 uppercase tracking-widest shrink-0 ${current.button}`}>
        {actionText}
      </button>
    </div>
  );
};

// --- Timeline Event ---
export const TimelineEvent = ({ title, time, detail, isAlert = false }: { title: string, time: string, detail: string, isAlert?: boolean }) => {
  const colorClass = isAlert ? 'text-rose-300' : 'text-[#00E5FF]';
  const dotBorderClass = isAlert ? 'border-rose-400' : 'border-[#00E5FF]/50';
  const dotBgClass = isAlert ? 'bg-rose-400' : 'bg-[#00E5FF]';
  const timeClass = isAlert ? 'text-rose-500/50' : 'text-[#00E5FF]/50';
  const detailClass = isAlert ? 'text-rose-100/50' : 'text-[#00E5FF]/40';
  const glowHex = isAlert ? '#f43f5e' : '#00E5FF';
  
  return (
    <div className="relative pb-5 last:pb-0 group">
      <div className={`absolute left-[-19px] top-[5px] w-2.5 h-2.5 rounded-full border ${dotBorderClass} bg-[#030303] z-10 box-content shadow-[0_0_10px_${glowHex}33] flex items-center justify-center group-hover:border-[${glowHex}] group-hover:shadow-[0_0_15px_${glowHex}66] transition-all duration-300`}>
         <div className={`w-1 h-1 ${dotBgClass} rounded-full group-hover:animate-ping`}></div>
      </div>
      <div className="flex justify-between items-baseline mb-1">
        <div className={`${colorClass} text-[11px] font-sans tracking-wide font-bold`}>{title}</div>
        <div className={`text-[9px] ${timeClass} uppercase font-mono tracking-widest`}>{time}</div>
      </div>
      <div className={`text-[10px] ${detailClass} font-mono leading-relaxed`}>{detail}</div>
    </div>
  );
};

// --- Launchpad Card ---
export const LaunchpadCard = ({ title, status, count, urgency }: { title: string, status: string, count: number, urgency: 'high' | 'normal' | 'low' }) => {
  const urgencyColors = {
    high: 'text-rose-400 group-hover:text-rose-300',
    normal: 'text-hazard-amber group-hover:text-white',
    low: 'text-[#00E5FF] group-hover:text-white'
  };

  const urgencyGlows = {
    high: 'group-hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] group-hover:border-rose-500/30',
    normal: 'group-hover:shadow-[0_0_20px_rgba(255,184,0,0.1)] group-hover:border-hazard-amber/30',
    low: 'group-hover:shadow-[0_0_20px_rgba(0,229,255,0.1)] group-hover:border-[#00E5FF]/30'
  };

  return (
    <div className={`bg-void-metal/40 border border-[#00E5FF]/10 rounded-xl p-3.5 transition-all duration-300 cursor-pointer group flex flex-col gap-3 relative overflow-hidden ${urgencyGlows[urgency]}`}>
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#00E5FF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="flex justify-between items-start">
        <div className="text-white/80 text-[11px] font-sans font-medium group-hover:text-white transition-colors">{title}</div>
        <div className={`text-xl font-mono tracking-tighter ${urgencyColors[urgency]} transition-colors duration-300`}>{count}</div>
      </div>
      <div className="text-[9px] text-[#00E5FF]/40 font-mono mt-auto leading-tight group-hover:text-[#00E5FF]/60 transition-colors">
        {status}
      </div>
    </div>
  );
};
