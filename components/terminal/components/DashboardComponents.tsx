import React from 'react';

// --- Base Panel ---
export const PanelCard = ({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={`obsidian-glass rounded-xl p-4 relative border-[#00E5FF]/10 transition-all duration-300 hover:border-[#00E5FF]/20 hover:shadow-[0_0_20px_rgba(0,229,255,0.04)] flex flex-col ${className}`}>
    <div className="text-[10px] tracking-[0.2em] text-white/90 font-sans mb-4 flex items-center justify-between border-b border-white/5 pb-2 uppercase relative z-10">
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
    warning: 'text-[#FFAB00] bg-[#FFAB00]/10 border-[#FFAB00]/30 shadow-[0_0_10px_rgba(255,171,0,0.1)]',
    critical: 'text-[#FF003C] bg-[#FF003C]/10 border-[#FF003C]/30 shadow-[0_0_10px_rgba(255,0,60,0.1)]',
    neutral: 'text-[#00E5FF] bg-[#00E5FF]/10 border-[#00E5FF]/30 shadow-[0_0_10px_rgba(0,229,255,0.1)]'
  };
  
  const dots = {
    healthy: 'bg-[#00FF66] shadow-[0_0_6px_#00FF66]',
    warning: 'bg-[#FFAB00] shadow-[0_0_6px_#FFAB00]',
    critical: 'bg-[#FF003C] shadow-[0_0_6px_#FF003C]',
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
      <div className="bg-void-charcoal/40 border border-[#00E5FF]/10 rounded-lg p-3 flex flex-col justify-center border-dashed backdrop-blur-sm">
        <span className="text-[9px] text-[#00E5FF]/40 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] text-white/30 mt-1 font-mono">{value}</span>
      </div>
    );
  }

  return (
    <div className="void-metal rounded-lg p-3 flex flex-col justify-center transition-colors duration-300 hover:bg-void-charcoal border-[#00E5FF]/15 hover:border-[#00E5FF]/25 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00E5FF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <span className="text-[9px] text-[#00E5FF]/60 uppercase tracking-[0.15em] mb-1.5 font-sans">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-xl text-white font-mono tracking-tight group-hover:text-[#00E5FF]/90 transition-colors">{value}</span>
        {subtext && <span className="text-[8px] text-[#00E5FF]/70 font-mono">{subtext}</span>}
      </div>
    </div>
  );
};

// --- Action Row (Attention Queue / Primary Actions) ---
export const ActionRow = ({ type, title, subtitle, actionText, onClick }: { type: 'do_now' | 'review' | 'open', title: string, subtitle: string, actionText: string, onClick?: () => void }) => {
  const styles = {
    do_now: { border: 'border-[#FF003C]/30 hover:border-[#FF003C]/50', bg: 'bg-[#FF003C]/5 hover:bg-[#FF003C]/10', badge: 'bg-[#FF003C]/10 text-[#FF003C] border-[#FF003C]/20', button: 'border-[#FF003C]/30 text-[#FF003C]/80 hover:bg-[#FF003C]/20 hover:text-white hover:border-[#FF003C]/50 hover:shadow-[0_0_15px_rgba(255,0,60,0.15)]' },
    review: { border: 'border-[#FFAB00]/30 hover:border-[#FFAB00]/50', bg: 'bg-[#FFAB00]/5 hover:bg-[#FFAB00]/10', badge: 'bg-[#FFAB00]/10 text-[#FFAB00] border-[#FFAB00]/20', button: 'border-[#FFAB00]/30 text-[#FFAB00]/80 hover:bg-[#FFAB00]/20 hover:text-white hover:border-[#FFAB00]/50 hover:shadow-[0_0_15px_rgba(255,171,0,0.15)]' },
    open: { border: 'border-[#00E5FF]/30 hover:border-[#00E5FF]/50', bg: 'bg-[#00E5FF]/5 hover:bg-[#00E5FF]/10', badge: 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20', button: 'border-[#00E5FF]/30 text-[#00E5FF]/80 hover:bg-[#00E5FF]/20 hover:text-white hover:border-[#00E5FF]/50 hover:shadow-[0_0_15px_rgba(0,229,255,0.15)]' }
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
  const dotColor = isAlert ? 'bg-[#FF003C]' : 'bg-[#00E5FF]';
  const dotBorder = isAlert ? 'border-[#FF003C]/50' : 'border-[#00E5FF]/50';
  const dotGlow = isAlert ? 'shadow-[0_0_10px_rgba(255,0,60,0.3)]' : 'shadow-[0_0_10px_rgba(0,229,255,0.3)]';
  const titleColor = isAlert ? 'text-[#FF003C]/90' : 'text-[#00E5FF]/90';
  const timeColor = isAlert ? 'text-[#FF003C]/50' : 'text-[#00E5FF]/50';
  
  return (
    <div className="relative pb-5 last:pb-0 group">
      <div className={`absolute left-[-19px] top-[5px] w-2.5 h-2.5 rounded-full border ${dotBorder} bg-[#030303] z-10 box-content ${dotGlow} flex items-center justify-center transition-all duration-300`}>
         <div className={`w-1 h-1 ${dotColor} rounded-full group-hover:animate-ping`}></div>
      </div>
      <div className="flex justify-between items-baseline mb-1">
        <div className={`${titleColor} text-[11px] font-sans tracking-wide`}>{title}</div>
        <div className={`text-[9px] ${timeColor} uppercase font-mono tracking-widest`}>{time}</div>
      </div>
      <div className="text-[10px] text-white/40 font-mono leading-relaxed">{detail}</div>
    </div>
  );
};

// --- Launchpad Card ---
export const LaunchpadCard = ({ title, status, count, urgency }: { title: string, status: string, count: number, urgency: 'high' | 'normal' | 'low' }) => {
  const urgencyColors = {
    high: 'text-[#FF003C] group-hover:text-[#FF003C]',
    normal: 'text-[#FFAB00] group-hover:text-[#FFAB00]',
    low: 'text-[#00E5FF] group-hover:text-[#00E5FF]'
  };

  const urgencyGlows = {
    high: 'group-hover:shadow-[0_0_20px_rgba(255,0,60,0.12)] group-hover:border-[#FF003C]/30',
    normal: 'group-hover:shadow-[0_0_20px_rgba(255,171,0,0.1)] group-hover:border-[#FFAB00]/30',
    low: 'group-hover:shadow-[0_0_20px_rgba(0,229,255,0.1)] group-hover:border-[#00E5FF]/30'
  };

  return (
    <div className={`obsidian-glass-interactive rounded-xl p-3.5 cursor-pointer group flex flex-col gap-3 relative overflow-hidden ${urgencyGlows[urgency]}`}>
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#00E5FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="flex justify-between items-start">
        <div className="text-white/80 text-[11px] font-sans font-medium group-hover:text-white transition-colors">{title}</div>
        <div className={`text-xl font-mono tracking-tighter ${urgencyColors[urgency]} transition-colors duration-300`}>{count}</div>
      </div>
      <div className="text-[9px] text-white/40 font-mono mt-auto leading-tight group-hover:text-white/60 transition-colors">
        {status}
      </div>
    </div>
  );
};
