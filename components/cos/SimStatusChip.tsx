export function SimStatusChip({ status ="SIMULATED" }: { status?:"SIMULATED" |"EMULATED" |"PHYSICAL HARDWARE VERIFIED" }) {
 return (
 <span className="inline-flex rounded border border-cos-warn/30 bg-cos-warn/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-cos-warn">
 {status}
 </span>
 );
}
