const fs = require('fs');
let file = fs.readFileSync('components/ui/SharedUI.tsx', 'utf8');

const regex = /export function StatusPill\(\{ status, className = "" \}: \{ status: string, className\?: string \}\) \{([\s\S]*?)return \([\s\S]*?\);\n\}/m;

const replacement = `export function StatusPill({ status, className = "" }: { status: string, className?: string }) {
  let colors = "text-theme-inkDim border-theme-border";
  let icon = null;
  const s = status.toUpperCase();
  
  if (s === "VERIFIED" || s === "ALLOW") {
    colors = "text-theme-verified border-theme-verified/40";
    icon = <svg className="w-3 h-3 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>;
  } else if (s === "DEGRADED" || s === "WARN" || s === "GOVERNED") {
    colors = "text-theme-warn border-theme-warn/40";
    icon = <svg className="w-3 h-3 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>;
  } else if (s === "FAILED" || s === "DENY" || s === "INVALID" || s === "REPLAY_DENIED") {
    colors = "text-theme-danger border-theme-danger/40";
    icon = <svg className="w-3 h-3 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>;
  } else if (s === "LIVE" || s === "INFO") {
    colors = "text-theme-info border-theme-info/40";
    icon = <svg className="w-3 h-3 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>; // Replace with wifi-like icon if needed
  } else if (s === "UNKNOWN" || s === "OUTCOME_UNKNOWN") {
    colors = "text-theme-unknown border-theme-unknown/40";
    icon = <svg className="w-3 h-3 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>;
  }

  return (
    <span className={\`inline-flex items-center px-3 py-1 text-[11px] font-bold font-mono tracking-widest uppercase border rounded \${colors} \${className}\`}>
      {icon}
      {status}
    </span>
  );
}`;

file = file.replace(regex, replacement);
fs.writeFileSync('components/ui/SharedUI.tsx', file);
console.log('Updated StatusPill');
