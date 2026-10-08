"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

/** Set by the signup page just before leaving for GitHub, with the boxes the person ticked. */
export const PENDING_AGREEMENTS_KEY = "veklom.pendingAgreements";
const PENDING_MAX_AGE_MS = 30 * 60 * 1000;

const DOCUMENTS: { type: string; label: React.ReactNode }[] = [
  { type: "terms", label: <>I agree to the <Link href="/terms" target="_blank" className="underline">Terms of Service</Link>.</> },
  { type: "privacy", label: <>I acknowledge the <Link href="/privacy" target="_blank" className="underline">Privacy Policy</Link>.</> },
  { type: "acceptable_use", label: <>I agree to the <Link href="/acceptable-use" target="_blank" className="underline">Acceptable Use Policy</Link>.</> },
  { type: "github_boundary", label: <>I understand GitHub authorization links my GitHub identity to Veklom and is not blank-check execution authority.</> },
  { type: "device_flow", label: <>I acknowledge Device Flow authorizes GitHub identity/access only, not consequence-bearing machine actions without Veklom governance.</> },
];

// Pages a person must be able to read before accepting.
const READABLE = ["/terms", "/privacy", "/acceptable-use", "/docs", "/login", "/signup", "/verify-email"];

interface AgreementsView { all_current_accepted: boolean }

function takePending(): string[] | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_AGREEMENTS_KEY);
    window.sessionStorage.removeItem(PENDING_AGREEMENTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { agreements?: unknown; at?: unknown };
    if (!Array.isArray(parsed.agreements) || typeof parsed.at !== "number") return null;
    if (Date.now() - parsed.at > PENDING_MAX_AGE_MS) return null;
    return parsed.agreements.filter((a): a is string => typeof a === "string");
  } catch {
    return null;
  }
}

/**
 * A signed-in account with no record of accepting the current agreements is asked to accept
 * them, and the acceptance is recorded now (Identity stamps it with this moment and how it
 * happened). Nothing is back-dated: an account's missing history stays missing.
 */
export function AgreementGate() {
  const { me } = useAuth();
  const pathname = usePathname() || "/";
  const [needed, setNeeded] = useState(false);
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = useCallback(async (agreements: string[], context: "github_signup" | "sign_in_prompt") => {
    const view = await api<AgreementsView>("/api/v1/auth/me/agreements", {
      method: "POST",
      body: { accepted_agreements: agreements, context },
    });
    setNeeded(!view.all_current_accepted);
  }, []);

  useEffect(() => {
    if (!me) { setNeeded(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const view = await api<AgreementsView>("/api/v1/auth/me/agreements");
        if (cancelled || view.all_current_accepted) { if (!cancelled) setNeeded(false); return; }
        // A GitHub signup ticked every box before leaving for GitHub: record that now.
        const pending = takePending();
        if (pending) {
          try { await accept(pending, "github_signup"); return; } catch { /* fall through to the prompt */ }
        }
        if (!cancelled) setNeeded(true);
      } catch {
        // Identity unreachable or an older Identity without this route: do not block the session.
      }
    })();
    return () => { cancelled = true; };
  }, [me, accept]);

  if (!needed || READABLE.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  const all = DOCUMENTS.every((d) => ticked[d.type]);
  const submit = async () => {
    setBusy(true); setError(null);
    try { await accept(DOCUMENTS.map((d) => d.type), "sign_in_prompt"); }
    catch (cause) { setError((cause as Error).message || "Acceptance was not recorded"); }
    finally { setBusy(false); }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="agreement-gate-title"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[var(--theme-bg)] p-6 text-[var(--theme-text)] shadow-2xl">
        <h2 id="agreement-gate-title" className="text-lg font-semibold">Accept the current agreements</h2>
        <p className="mt-2 text-sm opacity-80">
          Your account has no record of accepting the current versions. Your acceptance is recorded
          now, with today&apos;s date.
        </p>
        <div className="mt-4 space-y-3">
          {DOCUMENTS.map((d) => (
            <label key={d.type} className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-1" checked={Boolean(ticked[d.type])}
                onChange={(e) => setTicked((t) => ({ ...t, [d.type]: e.target.checked }))} />
              <span>{d.label}</span>
            </label>
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <button type="button" disabled={!all || busy} onClick={submit}
          className="mt-5 w-full rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
          {busy ? "Recording…" : "Accept and continue"}
        </button>
      </div>
    </div>
  );
}
