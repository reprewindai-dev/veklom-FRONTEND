const fs = require('fs');
let file = fs.readFileSync('components/ui/SharedUI.tsx', 'utf8');

const regex = /export function StatusPill\(\{ status, label \}: \{ status: StatusType, label: string \}\) \{([\s\S]*?)\}\s*\n\s*export function ProofChip/m;

const replacement = `export function StatusPill({ status, label, className = "" }: { status: string, label?: string, className?: string }) {
  let colors = "text-theme-inkDim border-theme-border bg-theme-surface2";
  let icon = null;
  const s = status.toUpperCase();
  const textLabel = label || status;
  
  if (s === "VERIFIED" || s === "ALLOW" || s === "HEALTHY") {
    colors = "text-theme-verified border-theme-verified/40 bg-transparent";
    icon = <svg className="w-3 h-3 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>;
  } else if (s === "DEGRADED" || s === "WARN" || s === "GOVERNED") {
    colors = "text-theme-warn border-theme-warn/40 bg-transparent";
    icon = <svg className="w-3 h-3 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>;
  } else if (s === "FAILED" || s === "DENY" || s === "INVALID" || s === "REPLAY_DENIED" || s === "DANGER") {
    colors = "text-theme-danger border-theme-danger/40 bg-transparent";
    icon = <svg className="w-3 h-3 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>;
  } else if (s === "LIVE" || s === "INFO") {
    colors = "text-theme-info border-theme-info/40 bg-transparent";
    icon = <svg className="w-3 h-3 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/></svg>;
  } else if (s === "UNKNOWN" || s === "OUTCOME_UNKNOWN") {
    colors = "text-theme-unknown border-theme-unknown/40 bg-transparent";
    icon = <svg className="w-3 h-3 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>;
  }

  return (
    <span className={\`inline-flex items-center px-4 py-1.5 text-xs font-bold font-mono tracking-widest uppercase border rounded \${colors} \${className}\`}>
      {icon}
      {textLabel}
    </span>
  );
}

export function ProofChip`;

file = file.replace(regex, replacement);
fs.writeFileSync('components/ui/SharedUI.tsx', file);
console.log('Updated StatusPill final attempt');
