"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SESSION_KEY = "veklom_acquisition_prompt_v1";
const FIRST_DELAY_MS = 1800;
const SECOND_DELAY_MS = 90000;

type PromptState = {
  dismissals: number;
  lastDismissedAt: number;
  completed: boolean;
};

function readState(): PromptState {
  if (typeof window === "undefined") {
    return { dismissals: 0, lastDismissedAt: 0, completed: false };
  }

  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return { dismissals: 0, lastDismissedAt: 0, completed: false };
    const parsed = JSON.parse(raw) as Partial<PromptState>;
    return {
      dismissals: Number(parsed.dismissals || 0),
      lastDismissedAt: Number(parsed.lastDismissedAt || 0),
      completed: Boolean(parsed.completed),
    };
  } catch {
    return { dismissals: 0, lastDismissedAt: 0, completed: false };
  }
}

function writeState(state: PromptState) {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // Acquisition should never break the page if browser storage is unavailable.
  }
}

export function AcquisitionPrompt() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<PromptState>({ dismissals: 0, lastDismissedAt: 0, completed: false });

  const eligible = useMemo(
    () => pathname === "/" || pathname.startsWith("/proof") || pathname.startsWith("/architecture") || pathname.startsWith("/conformance") || pathname.startsWith("/docs"),
    [pathname],
  );

  useEffect(() => {
    if (!eligible) return;

    const current = readState();
    setState(current);
    if (current.completed || current.dismissals >= 2) return;

    const delay = current.dismissals === 0 ? FIRST_DELAY_MS : Math.max(0, SECOND_DELAY_MS - (Date.now() - current.lastDismissedAt));
    const timer = window.setTimeout(() => setOpen(true), delay);

    let exitArmed = false;
    const armTimer = window.setTimeout(() => {
      exitArmed = true;
    }, 15000);

    const onMouseOut = (event: MouseEvent) => {
      if (!exitArmed || current.completed || current.dismissals >= 2) return;
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
      dismissals: Math.min(2, state.dismissals + 1),
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="veklom-get-title">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-theme-border bg-theme-bg shadow-2xl">
        <div className="border-b border-theme-border bg-theme-surface px-6 py-4">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-theme-accent">Machine Authority Infrastructure</div>
        </div>

        <div className="px-6 py-7 sm:px-8 sm:py-9">
          <div className="mb-5 inline-flex items-center rounded-full border border-theme-border bg-theme-surface px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-theme-inkDim">
            One path. Minimal setup.
          </div>
          <h2 id="veklom-get-title" className="max-w-lg text-3xl font-semibold tracking-tight text-theme-ink sm:text-4xl">
            Get Veklom before you leave.
          </h2>
          <p className="mt-4 max-w-lg text-base leading-7 text-theme-inkDim">
            Start the governed setup now. Veklom will take you through the shortest available path for this device and keep consequence authority behind the governed boundary.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
            <Link
              href="/signup"
              onClick={markAccepted}
              className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-theme-ink px-5 text-sm font-bold text-theme-bg shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Get Veklom <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
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
            No silent installation. No hidden authority grant. You remain in control of the final approval.
          </p>
        </div>
      </div>
    </div>
  );
}
