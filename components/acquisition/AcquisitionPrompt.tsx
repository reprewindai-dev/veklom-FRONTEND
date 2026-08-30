"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SESSION_KEY = "veklom_acquisition_prompt_v2";
const FIRST_DELAY_MS = 700;
const SECOND_DELAY_MS = 30000;
const MAX_DISMISSALS = 3;

type PromptState = {
  dismissals: number;
  lastDismissedAt: number;
  completed: boolean;
};

function emptyState(): PromptState {
  return { dismissals: 0, lastDismissedAt: 0, completed: false };
}

function readState(): PromptState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<PromptState>;
    return {
      dismissals: Number(parsed.dismissals || 0),
      lastDismissedAt: Number(parsed.lastDismissedAt || 0),
      completed: Boolean(parsed.completed),
    };
  } catch {
    return emptyState();
  }
}

function writeState(state: PromptState) {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // Acquisition must never break the page when storage is unavailable.
  }
}

export function AcquisitionPrompt() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<PromptState>(emptyState());

  const eligible = useMemo(
    () => pathname === "/" || pathname.startsWith("/proof") || pathname.startsWith("/architecture") || pathname.startsWith("/conformance") || pathname.startsWith("/docs") || pathname.startsWith("/security"),
    [pathname],
  );

  useEffect(() => {
    if (!eligible) return;

    const current = readState();
    setState(current);
    if (current.completed || current.dismissals >= MAX_DISMISSALS) return;

    const delay = current.dismissals === 0
      ? FIRST_DELAY_MS
      : Math.max(0, SECOND_DELAY_MS - (Date.now() - current.lastDismissedAt));
    const timer = window.setTimeout(() => setOpen(true), delay);

    let exitArmed = false;
    const armTimer = window.setTimeout(() => {
      exitArmed = true;
    }, 8000);

    const onMouseOut = (event: MouseEvent) => {
      if (!exitArmed) return;
      const latest = readState();
      if (latest.completed || latest.dismissals >= MAX_DISMISSALS) return;
      if (event.clientY <= 0 && !event.relatedTarget) setOpen(true);
    };

    document.addEventListener("mouseout", onMouseOut);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(armTimer);
      document.removeEventListener("mouseout", onMouseOut);
    };
  }, [eligible, pathname]);

  function dismiss() {
    const next = {
      ...state,
      dismissals: Math.min(MAX_DISMISSALS, state.dismissals + 1),
      lastDismissedAt: Date.now(),
    };
    setState(next);
    writeState(next);
    setOpen(false);
  }

  function markAccepted() {
    const next = { ...state, completed: true };
    setState(next);
    writeState(next);
  }

  if (!eligible || !open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 px-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="veklom-get-title">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-theme-border bg-theme-bg shadow-2xl">
        <div className="flex items-center justify-between border-b border-theme-border bg-theme-surface px-6 py-4">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-theme-accent">Machine Authority Infrastructure</div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-theme-inkDim">One scan · One approval</div>
        </div>

        <div className="grid md:grid-cols-[1fr_220px]">
          <div className="px-6 py-7 sm:px-8 sm:py-9">
            <div className="mb-5 inline-flex items-center rounded-full border border-theme-border bg-theme-surface px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-theme-inkDim">
              You do not need to configure this manually.
            </div>
            <h2 id="veklom-get-title" className="max-w-lg text-3xl font-semibold tracking-tight text-theme-ink sm:text-4xl">
              Put Veklom on this device.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-theme-inkDim">
              Veklom detects the shortest supported path for this device. If your browser can install the app, one approval is all that remains. Otherwise the web experience opens immediately.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
              <Link
                href="/get"
                onClick={markAccepted}
                className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-theme-ink px-5 text-sm font-bold text-theme-bg shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-2xl"
              >
                Get Veklom now <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <button
                type="button"
                onClick={dismiss}
                className="min-h-14 rounded-xl border border-theme-border px-5 text-sm font-medium text-theme-inkDim transition-colors hover:bg-theme-surface hover:text-theme-ink"
              >
                Not now
              </button>
            </div>

            <p className="mt-4 font-mono text-[10px] leading-5 text-theme-inkDim">
              We can surface the path aggressively; your browser or operating system still controls the final install approval. No hidden authority is granted.
            </p>
          </div>

          <div className="hidden border-l border-theme-border bg-theme-surface p-6 md:flex md:flex-col md:items-center md:justify-center">
            <div className="rounded-xl bg-white p-3 shadow-inner">
              <Image src="/get-veklom-qr.svg" width={164} height={164} alt="Scan to get Veklom" />
            </div>
            <div className="mt-4 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-theme-ink">Scan with your phone</div>
            <div className="mt-1 text-center font-mono text-[9px] text-theme-inkDim">veklom.com/get</div>
          </div>
        </div>
      </div>
    </div>
  );
}
