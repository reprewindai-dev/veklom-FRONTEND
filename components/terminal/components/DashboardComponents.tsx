import React from 'react';

// --- Base Panel ---
export const PanelCard = ({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#0b1219]/60 border border-cyan-900/40 rounded-xl p-4 relative backdrop-blur-sm shadow-[0_0_15px_rgba(0,255,255,0.02)] flex flex-col ${className}`}>
    <div className="text-[10px] tracking-widest text-white/90 font-sans mb-4 flex items-center justify-between border-b border-cyan-900/30 pb-2">
      {title}
    </div>
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      {children}
    </div>
  </div>
);

// --- Status Badge ---
export const StatusBadge = ({ state, text }: { state: 'healthy' | 'warning' | 'critical' | 'neutral', text: string }) => {
  const colors = {
    healthy: 'text-green-400 bg-green-500/10 border-green-500/30',
    warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    critical: 'text-red-400 bg-red-500/10 border-red-500/30',
    neutral: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
  };
  
  const dots = {
    healthy: 'bg-green-400 shadow-[0_0_5px_#4ade80]',
    warning: 'bg-yellow-400 shadow-[0_0_5px_#facc15]',
    critical: 'bg-red-400 shadow-[0_0_5px_#f87171]',
    neutral: 'bg-cyan-400 shadow-[0_0_5px_#22d3ee]'
  };

  return (
    <div className={`flex w-fit items-center gap-1.5 text-[8px] tracking-widest border px-2 py-0.5 rounded-full ${colors[state]}`}>
      <div className={`w-[4px] h-[4px] rounded-full ${dots[state]}`}></div>
      {text}
    </div>
  );
};

// --- Metric Card ---
export const MetricCard = ({ label, value, subtext, empty = false }: { label: string, value: string, subtext?: string, empty?: boolean }) => {
  if (empty) {
    return (
      <div className="bg-cyan-950/20 border border-cyan-900/30 rounded-lg p-3 flex flex-col justify-center border-dashed">
        <span className="text-[9px] text-cyan-500/50 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] text-white/40 mt-1">{value}</span>
      </div>
    );
  }

  return (
    <div className="bg-cyan-950/20 border border-cyan-900/30 rounded-lg p-3 flex flex-col justify-center">
      <span className="text-[9px] text-cyan-500/50 uppercase tracking-widest mb-1">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-lg text-white font-sans">{value}</span>
        {subtext && <span className="text-[8px] text-cyan-500/70">{subtext}</span>}
      </div>
    </div>
  );
};

// --- Action Row (Attention Queue / Primary Actions) ---
export const ActionRow = ({ type, title, subtitle, actionText, onClick }: { type: 'do_now' | 'review' | 'open', title: string, subtitle: string, actionText: string, onClick?: () => void }) => {
  const styles = {
    do_now: { border: 'border-red-900/40', bg: 'bg-red-950/20', icon: 'text-red-400', badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
    review: { border: 'border-yellow-900/40', bg: 'bg-yellow-950/20', icon: 'text-yellow-400', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    open: { border: 'border-cyan-900/40', bg: 'bg-cyan-950/20', icon: 'text-cyan-400', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' }
  };

  const current = styles[type];

  return (
    <div className={`border ${current.border} ${current.bg} rounded-lg p-3 flex items-center justify-between group transition-colors hover:bg-black/20`}>
      <div className="flex items-center gap-3">
        <div className={`text-[8px] px-1.5 py-0.5 rounded border uppercase tracking-wider ${current.badge}`}>
          {type.replace('_', ' ')}
        </div>
        <div>
          <div className="text-white/90 text-sm font-sans">{title}</div>
          <div className="text-[9px] text-cyan-500/60 mt-0.5">{subtitle}</div>
        </div>
      </div>
      <button onClick={onClick} className={`text-[9px] px-3 py-1.5 border ${current.border} rounded text-white/70 hover:text-white hover:bg-white/5 transition-all uppercase tracking-wider shrink-0`}>
        {actionText}
      </button>
    </div>
  );
};

// --- Timeline Event ---
export const TimelineEvent = ({ title, time, detail, isAlert = false }: { title: string, time: string, detail: string, isAlert?: boolean }) => {
  const color = isAlert ? 'red' : 'cyan';
  
  return (
    <div className="relative pb-4 last:pb-0">
      <div className={`absolute left-[-17px] top-[4px] w-2 h-2 rounded-full border border-${color}-400 bg-[#0b1219] z-10 box-content shadow-[0_0_8px_${isAlert ? '#f00' : '#0ff'}] flex items-center justify-center`}>
         <div className={`w-[2px] h-[2px] bg-${color}-400 rounded-full`}></div>
      </div>
      <div className="flex justify-between items-baseline mb-0.5">
        <div className={`text-${color}-300/90 text-xs`}>{title}</div>
        <div className={`text-[8px] text-${color}-500/50 uppercase`}>{time}</div>
      </div>
      <div className={`text-[9px] text-${color}-100/60`}>{detail}</div>
    </div>
  );
};

// --- Launchpad Card ---
export const LaunchpadCard = ({ title, status, count, urgency }: { title: string, status: string, count: number, urgency: 'high' | 'normal' | 'low' }) => {
  const urgencyColors = {
    high: 'text-red-400',
    normal: 'text-yellow-400',
    low: 'text-cyan-400'
  };

  return (
    <div className="bg-[#0b1219]/40 border border-cyan-900/30 rounded-lg p-3 hover:bg-cyan-950/20 transition-colors cursor-pointer group flex justify-between items-center">
      <div>
        <div className="text-white/80 text-xs font-medium group-hover:text-cyan-300 transition-colors">{title}</div>
        <div className="text-[9px] text-cyan-500/50 mt-0.5">{status}</div>
      </div>
      <div className="text-right">
        <div className={`text-lg font-sans ${urgencyColors[urgency]}`}>{count}</div>
      </div>
    </div>
  );
};
