import { ArrowDown, ArrowUp, Activity } from"lucide-react";

export function MetricCard({ 
 title, 
 value, 
 unit, 
 trend, 
 trendValue 
}: { 
 title: string;
 value: string | number;
 unit?: string;
 trend?:"up" |"down" |"neutral";
 trendValue?: string;
}) {
 return (
 <div className="flex flex-col gap-2 rounded-lg border border-cos-border bg-cos-surface p-4 transition-colors hover:border-cos-accent/30">
 <div className="flex items-center gap-2 text-cos-muted">
 <Activity size={14} />
 <span className="text-xs font-medium uppercase tracking-wider">{title}</span>
 </div>
 <div className="flex items-baseline gap-1">
 <span className="font-mono text-2xl font-semibold text-cos-text">{value}</span>
 {unit && <span className="font-mono text-sm font-medium text-cos-steel">{unit}</span>}
 </div>
 {trend && trendValue && (
 <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-cos-verified' : trend === 'down' ? 'text-cos-danger' : 'text-cos-steel'}`}>
 {trend === 'up' && <ArrowUp size={12} />}
 {trend === 'down' && <ArrowDown size={12} />}
 {trend === 'neutral' && <span className="px-1">-</span>}
 <span>{trendValue}</span>
 </div>
 )}
 </div>
 );
}
