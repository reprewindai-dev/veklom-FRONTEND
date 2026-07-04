export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as T;
}

export async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  return (await res.json()) as T;
}

export function refreshLive(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("covenant:refresh"));
  }
}

export function short(hash: string | undefined, n = 10): string {
  if (!hash) return "—";
  return hash.length > n * 2 ? `${hash.slice(0, n)}…${hash.slice(-4)}` : hash;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export const DECISION_STYLE: Record<string, { fg: string; bg: string; label: string }> = {
  authorized: { fg: "text-signal", bg: "bg-signal/10 border-signal/30", label: "AUTHORIZED" },
  denied: { fg: "text-rose-300", bg: "bg-rose-500/10 border-rose-500/30", label: "DENIED" },
  quarantined: { fg: "text-amber-300", bg: "bg-amber-500/10 border-amber-500/30", label: "QUARANTINED" },
  error: { fg: "text-mute", bg: "bg-white/5 border-white/15", label: "ERROR" },
};

export const PHASE_STYLE: Record<string, { ring: string; dot: string; text: string }> = {
  pass: { ring: "border-signal/50", dot: "bg-signal", text: "text-signal" },
  warn: { ring: "border-amber-400/50", dot: "bg-amber-400", text: "text-amber-300" },
  fail: { ring: "border-rose-500/50", dot: "bg-rose-500", text: "text-rose-300" },
  skipped: { ring: "border-white/15", dot: "bg-white/30", text: "text-mute" },
  pending: { ring: "border-white/10", dot: "bg-white/15", text: "text-mute" },
};

export const THREAT_STYLE: Record<string, string> = {
  green: "text-signal",
  yellow: "text-amber-300",
  orange: "text-orange-400",
  red: "text-rose-400",
};

export const SEVERITY_STYLE: Record<string, string> = {
  low: "text-mute",
  medium: "text-amber-300",
  high: "text-orange-400",
  critical: "text-rose-400",
};
